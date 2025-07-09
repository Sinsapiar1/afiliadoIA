/**
 * API Manager - Centralized API handling for AffiliatePro
 * Handles AI services, external APIs, rate limiting, and caching
 */

class APIManager {
  constructor() {
    this.cache = new Map();
    this.rateLimiters = new Map();
    this.activeRequests = new Map();
    this.config = {
      cacheTTL: 5 * 60 * 1000, // 5 minutes
      maxRetries: 3,
      retryDelay: 1000,
      timeout: 30000,
      rateLimits: {
        gemini: { requests: 60, window: 60000 }, // 60 requests per minute
        openai: { requests: 20, window: 60000 }, // 20 requests per minute
        clickbank: { requests: 100, window: 60000 }, // 100 requests per minute
        amazon: { requests: 50, window: 60000 } // 50 requests per minute
      }
    };
    
    this.init();
  }

  init() {
    this.setupRateLimiters();
    this.setupCacheCleanup();
  }

  setupRateLimiters() {
    Object.entries(this.config.rateLimits).forEach(([api, limit]) => {
      this.rateLimiters.set(api, {
        requests: [],
        limit: limit.requests,
        window: limit.window
      });
    });
  }

  setupCacheCleanup() {
    setInterval(() => {
      const now = Date.now();
      for (const [key, value] of this.cache.entries()) {
        if (now - value.timestamp > this.config.cacheTTL) {
          this.cache.delete(key);
        }
      }
    }, 60000); // Clean up every minute
  }

  /**
   * Check if request is within rate limits
   */
  checkRateLimit(api) {
    const limiter = this.rateLimiters.get(api);
    if (!limiter) return true;

    const now = Date.now();
    limiter.requests = limiter.requests.filter(
      time => now - time < limiter.window
    );

    if (limiter.requests.length >= limiter.limit) {
      return false;
    }

    limiter.requests.push(now);
    return true;
  }

  /**
   * Get cached response if available
   */
  getCachedResponse(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.config.cacheTTL) {
      return cached.data;
    }
    return null;
  }

  /**
   * Cache response
   */
  cacheResponse(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Generate cache key
   */
  generateCacheKey(endpoint, params) {
    return `${endpoint}:${JSON.stringify(params)}`;
  }

  /**
   * Make API request with retry logic
   */
  async makeRequest(url, options = {}, api = 'default') {
    const requestKey = `${api}:${url}`;
    
    // Check if request is already in progress
    if (this.activeRequests.has(requestKey)) {
      return this.activeRequests.get(requestKey);
    }

    // Check rate limits
    if (!this.checkRateLimit(api)) {
      throw new Error(`Rate limit exceeded for ${api}`);
    }

    const promise = this._executeRequest(url, options, api);
    this.activeRequests.set(requestKey, promise);
    
    try {
      const result = await promise;
      return result;
    } finally {
      this.activeRequests.delete(requestKey);
    }
  }

  async _executeRequest(url, options, api, retryCount = 0) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }

      if (retryCount < this.config.maxRetries && this._shouldRetry(error)) {
        await this._delay(this.config.retryDelay * Math.pow(2, retryCount));
        return this._executeRequest(url, options, api, retryCount + 1);
      }

      throw error;
    }
  }

  _shouldRetry(error) {
    const retryableErrors = [
      'NetworkError',
      'TypeError',
      'Request timeout'
    ];
    
    return retryableErrors.some(type => 
      error.message.includes(type) || error.name === type
    );
  }

  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * AI Service Methods
   */
  async callGeminiAPI(prompt, options = {}) {
    const cacheKey = this.generateCacheKey('gemini', { prompt, options });
    const cached = this.getCachedResponse(cacheKey);
    if (cached) return cached;

    const apiKey = this._getAPIKey('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error('Gemini API key not configured');
    }

    const response = await this.makeRequest(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: options.temperature || 0.7,
            topK: options.topK || 40,
            topP: options.topP || 0.95,
            maxOutputTokens: options.maxTokens || 2048
          }
        })
      },
      'gemini'
    );

    const result = response.candidates[0].content.parts[0].text;
    this.cacheResponse(cacheKey, result);
    return result;
  }

  async callOpenAIAPI(prompt, options = {}) {
    const cacheKey = this.generateCacheKey('openai', { prompt, options });
    const cached = this.getCachedResponse(cacheKey);
    if (cached) return cached;

    const apiKey = this._getAPIKey('OPENAI_API_KEY');
    if (!apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const response = await this.makeRequest(
      'https://api.openai.com/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: options.model || 'gpt-3.5-turbo',
          messages: [{
            role: 'user',
            content: prompt
          }],
          temperature: options.temperature || 0.7,
          max_tokens: options.maxTokens || 2048
        })
      },
      'openai'
    );

    const result = response.choices[0].message.content;
    this.cacheResponse(cacheKey, result);
    return result;
  }

  /**
   * Affiliate Network APIs
   */
  async validateClickBankProduct(productId) {
    const cacheKey = this.generateCacheKey('clickbank', { productId });
    const cached = this.getCachedResponse(cacheKey);
    if (cached) return cached;

    // Note: This would require ClickBank API access
    // For demo purposes, returning mock data
    const mockData = {
      productId,
      name: `Product ${productId}`,
      gravity: Math.floor(Math.random() * 100),
      commission: Math.floor(Math.random() * 75) + 25,
      avgEarnings: Math.floor(Math.random() * 200) + 50,
      conversionRate: (Math.random() * 0.05 + 0.01).toFixed(4),
      refundRate: (Math.random() * 0.15).toFixed(4),
      isActive: true,
      lastUpdated: new Date().toISOString()
    };

    this.cacheResponse(cacheKey, mockData);
    return mockData;
  }

  async getAmazonProductInfo(asin) {
    const cacheKey = this.generateCacheKey('amazon', { asin });
    const cached = this.getCachedResponse(cacheKey);
    if (cached) return cached;

    // Note: This would require Amazon Product Advertising API
    // For demo purposes, returning mock data
    const mockData = {
      asin,
      title: `Amazon Product ${asin}`,
      price: Math.floor(Math.random() * 100) + 10,
      commission: Math.floor(Math.random() * 10) + 1,
      rating: (Math.random() * 2 + 3).toFixed(1),
      reviewCount: Math.floor(Math.random() * 10000) + 100,
      category: ['Electronics', 'Books', 'Home', 'Sports'][Math.floor(Math.random() * 4)],
      isPrime: Math.random() > 0.5,
      lastUpdated: new Date().toISOString()
    };

    this.cacheResponse(cacheKey, mockData);
    return mockData;
  }

  /**
   * Content Generation APIs
   */
  async generateContent(prompt, platform, options = {}) {
    const enhancedPrompt = this._enhancePromptForPlatform(prompt, platform);
    
    try {
      // Try Gemini first (free tier)
      return await this.callGeminiAPI(enhancedPrompt, options);
    } catch (error) {
      console.warn('Gemini failed, trying OpenAI:', error);
      // Fallback to OpenAI
      return await this.callOpenAIAPI(enhancedPrompt, options);
    }
  }

  _enhancePromptForPlatform(basePrompt, platform) {
    const platformPrompts = {
      tiktok: `${basePrompt}\n\nGenerate viral TikTok content with:\n- Hook in first 3 seconds\n- Trending hashtags\n- Call to action\n- Estimated engagement metrics`,
      facebook: `${basePrompt}\n\nGenerate Facebook post with:\n- Engaging headline\n- Story format\n- Relevant hashtags\n- Call to action\n- Estimated reach`,
      instagram: `${basePrompt}\n\nGenerate Instagram post with:\n- Captivating caption\n- Relevant hashtags (max 30)\n- Story highlights\n- Call to action\n- Estimated engagement`,
      email: `${basePrompt}\n\nGenerate email copy with:\n- Compelling subject line\n- Personalization elements\n- Clear value proposition\n- Strong call to action\n- Estimated open rate`,
      youtube: `${basePrompt}\n\nGenerate YouTube content with:\n- Click-worthy title\n- Hook in first 10 seconds\n- Video description\n- Tags and keywords\n- Estimated views`
    };

    return platformPrompts[platform] || basePrompt;
  }

  /**
   * Analytics and Tracking
   */
  async trackAPIUsage(api, endpoint, success, responseTime) {
    const usage = {
      api,
      endpoint,
      success,
      responseTime,
      timestamp: Date.now(),
      userId: auth.currentUser?.uid
    };

    // Store in Firestore
    if (auth.currentUser) {
      try {
        await db.collection('analytics').add(usage);
      } catch (error) {
        console.error('Failed to track API usage:', error);
      }
    }
  }

  /**
   * Utility Methods
   */
  _getAPIKey(keyName) {
    // In production, these should be stored securely
    // For demo, using environment variables or config
    const keys = {
      GEMINI_API_KEY: localStorage.getItem('GEMINI_API_KEY'),
      OPENAI_API_KEY: localStorage.getItem('OPENAI_API_KEY'),
      CLICKBANK_API_KEY: localStorage.getItem('CLICKBANK_API_KEY'),
      AMAZON_API_KEY: localStorage.getItem('AMAZON_API_KEY')
    };

    return keys[keyName];
  }

  /**
   * Clear cache for specific API
   */
  clearCache(api = null) {
    if (api) {
      for (const [key] of this.cache.entries()) {
        if (key.startsWith(api)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }

  /**
   * Get API usage statistics
   */
  getUsageStats() {
    const stats = {};
    for (const [api, limiter] of this.rateLimiters.entries()) {
      stats[api] = {
        requestsInWindow: limiter.requests.length,
        limit: limiter.limit,
        window: limiter.window
      };
    }
    return stats;
  }

  /**
   * Health check for all APIs
   */
  async healthCheck() {
    const results = {};
    
    // Test Gemini
    try {
      await this.callGeminiAPI('Test connection', { maxTokens: 10 });
      results.gemini = 'healthy';
    } catch (error) {
      results.gemini = 'error';
    }

    // Test OpenAI
    try {
      await this.callOpenAIAPI('Test connection', { maxTokens: 10 });
      results.openai = 'healthy';
    } catch (error) {
      results.openai = 'error';
    }

    return results;
  }
}

// Initialize API Manager
const apiManager = new APIManager();

// Export for use in other modules
window.apiManager = apiManager;