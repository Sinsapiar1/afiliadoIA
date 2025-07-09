/**
 * Offer Validator Module
 * Analyzes and validates affiliate offers from various networks
 */

class OfferValidator {
  constructor() {
    this.networks = {
      clickbank: {
        name: 'ClickBank',
        domain: 'clickbank.com',
        apiEndpoint: 'https://api.clickbank.com/rest/1.3/products',
        validationRules: {
          minGravity: 20,
          minCommission: 25,
          maxRefundRate: 0.15,
          minAvgEarnings: 50
        }
      },
      amazon: {
        name: 'Amazon Associates',
        domain: 'amazon.com',
        apiEndpoint: 'https://webservices.amazon.com/paapi5/documentation',
        validationRules: {
          minRating: 4.0,
          minReviewCount: 100,
          minCommission: 1,
          maxPrice: 1000
        }
      },
      jvzoo: {
        name: 'JVZoo',
        domain: 'jvzoo.com',
        apiEndpoint: 'https://api.jvzoo.com/v2.0',
        validationRules: {
          minCommission: 30,
          minSales: 10,
          maxRefundRate: 0.10
        }
      },
      shareasale: {
        name: 'ShareASale',
        domain: 'shareasale.com',
        apiEndpoint: 'https://api.shareasale.com/w.cfm',
        validationRules: {
          minCommission: 20,
          minConversionRate: 0.01,
          maxRefundRate: 0.12
        }
      }
    };

    this.validationResults = new Map();
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.loadValidationHistory();
  }

  setupEventListeners() {
    // Listen for offer validation requests
    document.addEventListener('validateOffer', (e) => {
      this.validateOffer(e.detail.url, e.detail.options);
    });

    // Listen for bulk validation requests
    document.addEventListener('validateBulkOffers', (e) => {
      this.validateBulkOffers(e.detail.urls, e.detail.options);
    });
  }

  /**
   * Main validation method
   */
  async validateOffer(url, options = {}) {
    try {
      const startTime = Date.now();
      
      // Parse URL and identify network
      const network = this.identifyNetwork(url);
      if (!network) {
        throw new Error('Unsupported affiliate network');
      }

      // Extract product information
      const productInfo = await this.extractProductInfo(url, network);
      
      // Validate against network rules
      const validation = await this.runValidation(productInfo, network, options);
      
      // Calculate overall score
      const score = this.calculateScore(validation, network);
      
      // Store result
      const result = {
        url,
        network: network.name,
        productInfo,
        validation,
        score,
        timestamp: new Date().toISOString(),
        responseTime: Date.now() - startTime,
        userId: auth.currentUser?.uid
      };

      this.validationResults.set(url, result);
      this.saveValidationResult(result);
      
      // Dispatch result event
      this.dispatchValidationResult(result);
      
      return result;
    } catch (error) {
      console.error('Offer validation failed:', error);
      this.dispatchValidationError(error, url);
      throw error;
    }
  }

  /**
   * Identify affiliate network from URL
   */
  identifyNetwork(url) {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    
    for (const [key, network] of Object.entries(this.networks)) {
      if (hostname.includes(network.domain)) {
        return { ...network, key };
      }
    }
    
    return null;
  }

  /**
   * Extract product information from URL
   */
  async extractProductInfo(url, network) {
    const urlObj = new URL(url);
    
    switch (network.key) {
      case 'clickbank':
        return await this.extractClickBankInfo(urlObj);
      case 'amazon':
        return await this.extractAmazonInfo(urlObj);
      case 'jvzoo':
        return await this.extractJVZooInfo(urlObj);
      case 'shareasale':
        return await this.extractShareASaleInfo(urlObj);
      default:
        throw new Error(`Unsupported network: ${network.name}`);
    }
  }

  /**
   * Extract ClickBank product information
   */
  async extractClickBankInfo(urlObj) {
    // Extract product ID from URL
    const productId = urlObj.pathname.split('/').pop();
    
    // Get product data from API
    const productData = await apiManager.validateClickBankProduct(productId);
    
    return {
      productId,
      name: productData.name,
      gravity: productData.gravity,
      commission: productData.commission,
      avgEarnings: productData.avgEarnings,
      conversionRate: productData.conversionRate,
      refundRate: productData.refundRate,
      isActive: productData.isActive,
      category: this.categorizeProduct(productData.name),
      lastUpdated: productData.lastUpdated
    };
  }

  /**
   * Extract Amazon product information
   */
  async extractAmazonInfo(urlObj) {
    // Extract ASIN from URL
    const asinMatch = urlObj.pathname.match(/\/dp\/([A-Z0-9]{10})/);
    const asin = asinMatch ? asinMatch[1] : null;
    
    if (!asin) {
      throw new Error('Invalid Amazon product URL');
    }
    
    // Get product data from API
    const productData = await apiManager.getAmazonProductInfo(asin);
    
    return {
      asin,
      name: productData.title,
      price: productData.price,
      commission: productData.commission,
      rating: productData.rating,
      reviewCount: productData.reviewCount,
      category: productData.category,
      isPrime: productData.isPrime,
      lastUpdated: productData.lastUpdated
    };
  }

  /**
   * Extract JVZoo product information
   */
  async extractJVZooInfo(urlObj) {
    // Mock data for JVZoo (would need actual API integration)
    const productId = urlObj.pathname.split('/').pop();
    
    return {
      productId,
      name: `JVZoo Product ${productId}`,
      commission: Math.floor(Math.random() * 70) + 30,
      sales: Math.floor(Math.random() * 100) + 10,
      refundRate: Math.random() * 0.10,
      category: 'Digital Products',
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Extract ShareASale product information
   */
  async extractShareASaleInfo(urlObj) {
    // Mock data for ShareASale (would need actual API integration)
    const productId = urlObj.pathname.split('/').pop();
    
    return {
      productId,
      name: `ShareASale Product ${productId}`,
      commission: Math.floor(Math.random() * 50) + 20,
      conversionRate: Math.random() * 0.05 + 0.01,
      refundRate: Math.random() * 0.12,
      category: 'Fashion',
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Run validation against network rules
   */
  async runValidation(productInfo, network, options = {}) {
    const rules = network.validationRules;
    const validation = {
      passed: true,
      checks: {},
      warnings: [],
      errors: []
    };

    // Check gravity (ClickBank specific)
    if (productInfo.gravity !== undefined) {
      const gravityCheck = productInfo.gravity >= rules.minGravity;
      validation.checks.gravity = {
        passed: gravityCheck,
        value: productInfo.gravity,
        threshold: rules.minGravity,
        weight: 0.2
      };
      if (!gravityCheck) {
        validation.warnings.push(`Low gravity: ${productInfo.gravity} (min: ${rules.minGravity})`);
      }
    }

    // Check commission rate
    if (productInfo.commission !== undefined) {
      const commissionCheck = productInfo.commission >= rules.minCommission;
      validation.checks.commission = {
        passed: commissionCheck,
        value: productInfo.commission,
        threshold: rules.minCommission,
        weight: 0.25
      };
      if (!commissionCheck) {
        validation.errors.push(`Low commission: ${productInfo.commission}% (min: ${rules.minCommission}%)`);
        validation.passed = false;
      }
    }

    // Check refund rate
    if (productInfo.refundRate !== undefined) {
      const refundCheck = productInfo.refundRate <= rules.maxRefundRate;
      validation.checks.refundRate = {
        passed: refundCheck,
        value: productInfo.refundRate,
        threshold: rules.maxRefundRate,
        weight: 0.15
      };
      if (!refundCheck) {
        validation.warnings.push(`High refund rate: ${(productInfo.refundRate * 100).toFixed(1)}% (max: ${(rules.maxRefundRate * 100).toFixed(1)}%)`);
      }
    }

    // Check average earnings
    if (productInfo.avgEarnings !== undefined) {
      const earningsCheck = productInfo.avgEarnings >= rules.minAvgEarnings;
      validation.checks.avgEarnings = {
        passed: earningsCheck,
        value: productInfo.avgEarnings,
        threshold: rules.minAvgEarnings,
        weight: 0.2
      };
      if (!earningsCheck) {
        validation.warnings.push(`Low average earnings: $${productInfo.avgEarnings} (min: $${rules.minAvgEarnings})`);
      }
    }

    // Check rating (Amazon specific)
    if (productInfo.rating !== undefined) {
      const ratingCheck = productInfo.rating >= rules.minRating;
      validation.checks.rating = {
        passed: ratingCheck,
        value: productInfo.rating,
        threshold: rules.minRating,
        weight: 0.1
      };
      if (!ratingCheck) {
        validation.warnings.push(`Low rating: ${productInfo.rating} (min: ${rules.minRating})`);
      }
    }

    // Check review count (Amazon specific)
    if (productInfo.reviewCount !== undefined) {
      const reviewCheck = productInfo.reviewCount >= rules.minReviewCount;
      validation.checks.reviewCount = {
        passed: reviewCheck,
        value: productInfo.reviewCount,
        threshold: rules.minReviewCount,
        weight: 0.1
      };
      if (!reviewCheck) {
        validation.warnings.push(`Low review count: ${productInfo.reviewCount} (min: ${rules.minReviewCount})`);
      }
    }

    // Check conversion rate
    if (productInfo.conversionRate !== undefined) {
      const conversionCheck = productInfo.conversionRate >= rules.minConversionRate;
      validation.checks.conversionRate = {
        passed: conversionCheck,
        value: productInfo.conversionRate,
        threshold: rules.minConversionRate,
        weight: 0.2
      };
      if (!conversionCheck) {
        validation.warnings.push(`Low conversion rate: ${(productInfo.conversionRate * 100).toFixed(2)}% (min: ${(rules.minConversionRate * 100).toFixed(2)}%)`);
      }
    }

    return validation;
  }

  /**
   * Calculate overall validation score
   */
  calculateScore(validation, network) {
    let totalScore = 0;
    let totalWeight = 0;

    for (const [checkName, check] of Object.entries(validation.checks)) {
      const weight = check.weight || 0.1;
      totalWeight += weight;
      
      if (check.passed) {
        totalScore += weight;
      } else {
        // Partial score based on how close to threshold
        const ratio = check.value / check.threshold;
        totalScore += weight * Math.min(ratio, 1);
      }
    }

    const score = totalWeight > 0 ? (totalScore / totalWeight) * 100 : 0;
    
    return {
      overall: Math.round(score),
      breakdown: validation.checks,
      grade: this.getGrade(score),
      recommendation: this.getRecommendation(score, validation)
    };
  }

  /**
   * Get letter grade from score
   */
  getGrade(score) {
    if (score >= 90) return 'A+';
    if (score >= 85) return 'A';
    if (score >= 80) return 'A-';
    if (score >= 75) return 'B+';
    if (score >= 70) return 'B';
    if (score >= 65) return 'B-';
    if (score >= 60) return 'C+';
    if (score >= 55) return 'C';
    if (score >= 50) return 'C-';
    if (score >= 45) return 'D+';
    if (score >= 40) return 'D';
    return 'F';
  }

  /**
   * Get recommendation based on score
   */
  getRecommendation(score, validation) {
    if (score >= 85) {
      return {
        action: 'Highly Recommended',
        description: 'This offer meets all criteria and shows strong potential for success.',
        priority: 'high'
      };
    } else if (score >= 70) {
      return {
        action: 'Recommended',
        description: 'This offer meets most criteria and is worth testing.',
        priority: 'medium'
      };
    } else if (score >= 50) {
      return {
        action: 'Consider with Caution',
        description: 'This offer has some issues but might work with proper optimization.',
        priority: 'low'
      };
    } else {
      return {
        action: 'Not Recommended',
        description: 'This offer has significant issues and should be avoided.',
        priority: 'avoid'
      };
    }
  }

  /**
   * Categorize product based on name
   */
  categorizeProduct(name) {
    const categories = {
      'weight loss': 'Health & Fitness',
      'fitness': 'Health & Fitness',
      'diet': 'Health & Fitness',
      'muscle': 'Health & Fitness',
      'make money': 'Business & Marketing',
      'marketing': 'Business & Marketing',
      'business': 'Business & Marketing',
      'investment': 'Business & Marketing',
      'dating': 'Relationships',
      'relationship': 'Relationships',
      'love': 'Relationships',
      'parenting': 'Family & Parenting',
      'baby': 'Family & Parenting',
      'children': 'Family & Parenting',
      'beauty': 'Beauty & Fashion',
      'fashion': 'Beauty & Fashion',
      'skincare': 'Beauty & Fashion',
      'technology': 'Technology',
      'software': 'Technology',
      'gaming': 'Entertainment',
      'music': 'Entertainment',
      'education': 'Education',
      'language': 'Education',
      'cooking': 'Food & Cooking',
      'recipe': 'Food & Cooking',
      'travel': 'Travel',
      'home': 'Home & Garden',
      'garden': 'Home & Garden',
      'pets': 'Pets & Animals',
      'dog': 'Pets & Animals',
      'cat': 'Pets & Animals'
    };

    const lowerName = name.toLowerCase();
    for (const [keyword, category] of Object.entries(categories)) {
      if (lowerName.includes(keyword)) {
        return category;
      }
    }

    return 'Other';
  }

  /**
   * Validate multiple offers in bulk
   */
  async validateBulkOffers(urls, options = {}) {
    const results = [];
    const batchSize = options.batchSize || 5;
    
    for (let i = 0; i < urls.length; i += batchSize) {
      const batch = urls.slice(i, i + batchSize);
      const batchPromises = batch.map(url => 
        this.validateOffer(url, options).catch(error => ({
          url,
          error: error.message,
          timestamp: new Date().toISOString()
        }))
      );
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Add delay between batches to respect rate limits
      if (i + batchSize < urls.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return results;
  }

  /**
   * Save validation result to Firestore
   */
  async saveValidationResult(result) {
    if (!auth.currentUser) return;
    
    try {
      await db.collection('offerValidations').add({
        ...result,
        userId: auth.currentUser.uid,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    } catch (error) {
      console.error('Failed to save validation result:', error);
    }
  }

  /**
   * Load validation history from Firestore
   */
  async loadValidationHistory() {
    if (!auth.currentUser) return;
    
    try {
      const snapshot = await db.collection('offerValidations')
        .where('userId', '==', auth.currentUser.uid)
        .orderBy('timestamp', 'desc')
        .limit(50)
        .get();
      
      snapshot.forEach(doc => {
        const data = doc.data();
        this.validationResults.set(data.url, data);
      });
    } catch (error) {
      console.error('Failed to load validation history:', error);
    }
  }

  /**
   * Get validation history
   */
  getValidationHistory() {
    return Array.from(this.validationResults.values())
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  /**
   * Dispatch validation result event
   */
  dispatchValidationResult(result) {
    document.dispatchEvent(new CustomEvent('offerValidationComplete', {
      detail: result
    }));
  }

  /**
   * Dispatch validation error event
   */
  dispatchValidationError(error, url) {
    document.dispatchEvent(new CustomEvent('offerValidationError', {
      detail: { error: error.message, url }
    }));
  }

  /**
   * Get validation statistics
   */
  getValidationStats() {
    const history = this.getValidationHistory();
    const stats = {
      total: history.length,
      passed: 0,
      failed: 0,
      averageScore: 0,
      byNetwork: {},
      byGrade: {}
    };

    let totalScore = 0;
    
    history.forEach(result => {
      if (result.score?.overall >= 70) {
        stats.passed++;
      } else {
        stats.failed++;
      }
      
      totalScore += result.score?.overall || 0;
      
      // By network
      if (!stats.byNetwork[result.network]) {
        stats.byNetwork[result.network] = 0;
      }
      stats.byNetwork[result.network]++;
      
      // By grade
      const grade = result.score?.grade || 'F';
      if (!stats.byGrade[grade]) {
        stats.byGrade[grade] = 0;
      }
      stats.byGrade[grade]++;
    });

    stats.averageScore = history.length > 0 ? Math.round(totalScore / history.length) : 0;
    
    return stats;
  }

  /**
   * Export validation results
   */
  exportValidationResults(format = 'json') {
    const history = this.getValidationHistory();
    
    switch (format.toLowerCase()) {
      case 'csv':
        return this.exportToCSV(history);
      case 'json':
        return JSON.stringify(history, null, 2);
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Export to CSV format
   */
  exportToCSV(history) {
    const headers = [
      'URL',
      'Network',
      'Product Name',
      'Score',
      'Grade',
      'Commission',
      'Recommendation',
      'Timestamp'
    ];
    
    const rows = history.map(result => [
      result.url,
      result.network,
      result.productInfo?.name || '',
      result.score?.overall || 0,
      result.score?.grade || 'F',
      result.productInfo?.commission || 0,
      result.score?.recommendation?.action || '',
      result.timestamp
    ]);
    
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    
    return csvContent;
  }
}

// Initialize Offer Validator
const offerValidator = new OfferValidator();

// Export for use in other modules
window.offerValidator = offerValidator;