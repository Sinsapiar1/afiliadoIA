/**
 * Content Generator Module
 * AffiliatePro - AI-Powered Affiliate Marketing Platform
 */

import { db, COLLECTIONS } from '../core/firebase-config.js';
import authManager from '../core/auth.js';
import uiComponents from '../components/ui-components.js';
import {
    collection,
    addDoc,
    query,
    where,
    orderBy,
    limit,
    getDocs,
    serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Content generator state
let contentState = {
    isGenerating: false,
    currentContent: [],
    selectedProduct: null,
    generationHistory: [],
    templates: {},
    platforms: {
        tiktok: { name: 'TikTok', icon: '📱', color: '#ff0050' },
        instagram: { name: 'Instagram', icon: '📷', color: '#e4405f' },
        facebook: { name: 'Facebook', icon: '👥', color: '#1877f2' },
        youtube: { name: 'YouTube', icon: '📺', color: '#ff0000' },
        email: { name: 'Email', icon: '📧', color: '#34495e' },
        blog: { name: 'Blog', icon: '📝', color: '#2c3e50' },
        pinterest: { name: 'Pinterest', icon: '📌', color: '#bd081c' },
        twitter: { name: 'Twitter', icon: '🐦', color: '#1da1f2' }
    }
};

// AI Content Service
class AIContentService {
    constructor() {
        this.apiEndpoint = 'https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent';
        this.apiKey = 'your-gemini-api-key'; // In production, store securely
    }

    // Generate content using AI
    async generateContent(params) {
        const prompt = this.buildContentPrompt(params);
        
        try {
            if (this.apiKey && this.apiKey !== 'your-gemini-api-key') {
                return await this.callGeminiAPI(prompt);
            } else {
                return this.generateMockContent(params);
            }
        } catch (error) {
            console.warn('AI API failed, using mock content:', error);
            return this.generateMockContent(params);
        }
    }

    // Build content generation prompt
    buildContentPrompt(params) {
        const { platform, product, tone, length, audience, goals } = params;
        
        return `
            As an expert copywriter and viral content creator, generate high-converting marketing content for the following:

            PRODUCT DETAILS:
            - Name: ${product?.name || 'Premium Product'}
            - Category: ${product?.category || 'General'}
            - Price: $${product?.price || '29.99'}
            - Target Audience: ${product?.targetAudience || audience}

            CONTENT REQUIREMENTS:
            - Platform: ${platform}
            - Tone: ${tone}
            - Length: ${length}
            - Goal: ${goals || 'Drive sales and engagement'}
            - Date: ${new Date().toISOString().split('T')[0]}

            PLATFORM-SPECIFIC GUIDELINES:
            ${this.getPlatformGuidelines(platform)}

            Generate 3-5 different variations of content, each with:
            1. Main copy/script
            2. Hook/opening line
            3. Call-to-action
            4. Suggested hashtags (if applicable)
            5. Estimated engagement metrics
            6. Best posting times
            7. Visual suggestions

            Focus on:
            - Emotional triggers and psychological persuasion
            - Current trends and viral patterns
            - Platform-specific best practices
            - Clear value propositions
            - Urgency and scarcity elements
            - Social proof integration

            Return as JSON:
            {
                "content_variations": [
                    {
                        "title": "Variation name",
                        "copy": "Main content text",
                        "hook": "Opening hook",
                        "cta": "Call to action",
                        "hashtags": ["#hashtag1", "#hashtag2"],
                        "engagement_score": 8.5,
                        "best_times": ["7-9 AM", "7-9 PM"],
                        "visual_suggestions": "Visual description",
                        "target_metrics": {
                            "views": 50000,
                            "engagement_rate": 4.2,
                            "clicks": 2100
                        }
                    }
                ]
            }
        `;
    }

    // Get platform-specific guidelines
    getPlatformGuidelines(platform) {
        const guidelines = {
            tiktok: `
                - 15-60 second video scripts
                - Start with a hook in first 3 seconds
                - Use trending sounds and effects
                - Include text overlays and captions
                - Focus on entertainment and education
                - Use vertical video format (9:16)
            `,
            instagram: `
                - Stories: 15 seconds, engaging visuals
                - Reels: 15-30 seconds, trending audio
                - Posts: Eye-catching visuals with compelling captions
                - Use relevant hashtags (10-30)
                - Include Instagram Shopping tags
            `,
            facebook: `
                - Longer form content (up to 2000 characters)
                - Include images or videos
                - Ask questions to drive engagement
                - Use Facebook Groups for organic reach
                - Include link previews
            `,
            youtube: `
                - Video scripts with clear structure
                - Compelling titles and thumbnails
                - Include timestamps and chapters
                - Strong intro and outro
                - SEO-optimized descriptions
            `,
            email: `
                - Subject line optimization
                - Personal and conversational tone
                - Clear value proposition
                - Single, clear call-to-action
                - Mobile-optimized formatting
            `,
            blog: `
                - SEO-optimized titles and headers
                - 1500-3000 words for in-depth content
                - Include internal and external links
                - Use bullet points and subheadings
                - Add relevant images and infographics
            `
        };

        return guidelines[platform] || guidelines.facebook;
    }

    // Call Gemini API
    async callGeminiAPI(prompt) {
        const response = await fetch(`${this.apiEndpoint}?key=${this.apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }],
                generationConfig: {
                    temperature: 0.8,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 2048
                }
            })
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        const content = data.candidates[0]?.content?.parts[0]?.text;
        
        if (!content) {
            throw new Error('No content in API response');
        }

        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('No JSON found in response');
        }

        const result = JSON.parse(jsonMatch[0]);
        return result.content_variations || [];
    }

    // Generate mock content for demo
    generateMockContent(params) {
        const { platform, product, tone, length } = params;
        
        const mockTemplates = {
            tiktok: [
                {
                    title: "Problem-Solution Hook",
                    copy: `POV: You've been struggling with [PROBLEM] until you found THIS! 🤯\n\n*shows product in action*\n\nI was skeptical at first, but after trying ${product?.name || 'this product'}...\n\nMy life literally changed! Now I can't imagine living without it.\n\nComment "LINK" and I'll send you where to get it! 👇`,
                    hook: "POV: You've been struggling with [PROBLEM] until you found THIS! 🤯",
                    cta: "Comment 'LINK' for the product details!",
                    hashtags: ["#lifehack", "#gamechanger", "#musthave", "#affiliate", "#viral"],
                    engagement_score: 8.7,
                    best_times: ["7-9 AM", "7-9 PM"],
                    visual_suggestions: "Split screen: before/after, product unboxing, lifestyle shots",
                    target_metrics: {
                        views: 125000,
                        engagement_rate: 6.2,
                        clicks: 7750
                    }
                },
                {
                    title: "Transformation Story",
                    copy: `This is how ${product?.name || 'one simple product'} changed my entire routine ✨\n\n*day 1 vs day 30*\n\nI used to [OLD SITUATION] but now...\n\nSeriously, why didn't I find this sooner?!\n\nThe results speak for themselves 📈\n\nWho else needs to try this? Tag them! 👇`,
                    hook: "This is how one simple product changed my entire routine ✨",
                    cta: "Tag someone who needs this transformation!",
                    hashtags: ["#transformation", "#beforeandafter", "#results", "#recommend", "#tiktokfinds"],
                    engagement_score: 9.1,
                    best_times: ["6-8 AM", "8-10 PM"],
                    visual_suggestions: "Time-lapse transformation, side-by-side comparisons, testimonial style",
                    target_metrics: {
                        views: 89000,
                        engagement_rate: 7.8,
                        clicks: 6950
                    }
                }
            ],
            instagram: [
                {
                    title: "Lifestyle Integration",
                    copy: `Can we talk about how ${product?.name || 'this product'} fits perfectly into my daily routine? 💫\n\nSwipe to see how I use it throughout my day ➡️\n\n✨ Morning: [USE CASE 1]\n✨ Afternoon: [USE CASE 2]\n✨ Evening: [USE CASE 3]\n\nHonestly, it's become my secret weapon for [BENEFIT]. Who else is obsessed with products that actually work? 🙋‍♀️\n\nLet me know in the comments if you want the link! 👇`,
                    hook: "Can we talk about how this fits perfectly into my daily routine? 💫",
                    cta: "Comment below if you want the link!",
                    hashtags: ["#dailyroutine", "#lifestyle", "#musthave", "#productivity", "#selfcare", "#affiliate", "#recommendation"],
                    engagement_score: 7.9,
                    best_times: ["8-10 AM", "5-7 PM"],
                    visual_suggestions: "Carousel showing different uses, aesthetic flat lays, lifestyle photography",
                    target_metrics: {
                        views: 45000,
                        engagement_rate: 5.4,
                        clicks: 2430
                    }
                }
            ],
            facebook: [
                {
                    title: "Educational Value Post",
                    copy: `I never realized how much [PROBLEM] was affecting my [LIFE AREA] until I discovered ${product?.name || 'this solution'}.\n\nHere's what I learned and why this might help you too:\n\n🔍 The Problem: Most people struggle with [SPECIFIC ISSUE] because [REASON]\n\n💡 The Solution: ${product?.name || 'This product'} works by [MECHANISM]\n\n📊 The Results: After [TIME PERIOD], I noticed:\n• [BENEFIT 1]\n• [BENEFIT 2]\n• [BENEFIT 3]\n\n🎯 Who It's For: Perfect if you're dealing with [TARGET PROBLEMS]\n\nI've included the link in the comments for anyone interested. What's been your experience with similar products?`,
                    hook: "I never realized how much this was affecting my life until...",
                    cta: "Check the comments for the link - what's your experience?",
                    hashtags: [],
                    engagement_score: 8.3,
                    best_times: ["9-11 AM", "1-3 PM", "7-9 PM"],
                    visual_suggestions: "Before/after photos, infographic-style images, product in use",
                    target_metrics: {
                        views: 28000,
                        engagement_rate: 4.8,
                        clicks: 1344
                    }
                }
            ],
            email: [
                {
                    title: "Personal Recommendation",
                    copy: `Subject: This completely changed my [AREA] (and it might change yours too)\n\nHey [NAME],\n\nI don't usually reach out about products, but I had to share this with you.\n\nLast month, I was struggling with [PROBLEM]. You know that feeling when you've tried everything and nothing seems to work?\n\nThat's when I found ${product?.name || 'this product'}.\n\nI was skeptical (aren't we all?), but after [TIME PERIOD] of using it, the results have been incredible:\n\n• [SPECIFIC BENEFIT 1]\n• [SPECIFIC BENEFIT 2]\n• [SPECIFIC BENEFIT 3]\n\nThe best part? It's actually [UNIQUE SELLING POINT].\n\nI thought you might be interested because [PERSONAL CONNECTION/REASON].\n\n[CALL TO ACTION]\n\nLet me know what you think!\n\n[YOUR NAME]\n\nP.S. They're offering [SPECIAL OFFER] right now, but I'm not sure how long it'll last.`,
                    hook: "This completely changed my [AREA] (and it might change yours too)",
                    cta: "Click here to learn more about [PRODUCT]",
                    hashtags: [],
                    engagement_score: 9.2,
                    best_times: ["8-10 AM", "1-3 PM"],
                    visual_suggestions: "Personal photos with product, before/after images, testimonial graphics",
                    target_metrics: {
                        views: 1000,
                        engagement_rate: 12.5,
                        clicks: 125
                    }
                }
            ]
        };

        const platformTemplates = mockTemplates[platform] || mockTemplates.facebook;
        
        return platformTemplates.map(template => ({
            ...template,
            id: `content_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            platform: platform,
            tone: tone,
            length: length,
            created_at: new Date().toISOString(),
            product_id: product?.id || null
        }));
    }
}

// Initialize AI service
const aiContentService = new AIContentService();

// Content Generator module
const ContentGenerator = {
    // Initialize module
    async init() {
        console.log('📝 Initializing Content Generator...');
        
        // Load generation history
        await this.loadGenerationHistory();
        
        // Check for selected product from other modules
        this.loadSelectedProduct();
        
        console.log('✅ Content Generator initialized');
    },

    // Render module
    async render() {
        const pageContent = document.getElementById('page-content');
        if (!pageContent) return;

        pageContent.innerHTML = this.getContentGeneratorHTML();
        
        // Initialize interactions
        this.initializeInteractions();
        
        // Load recent content if available
        if (contentState.currentContent.length === 0) {
            this.showWelcomeState();
        } else {
            this.renderContent();
        }
    },

    // Get HTML template
    getContentGeneratorHTML() {
        const userProfile = authManager.getCurrentUserProfile();
        const remainingGenerations = authManager.getUsageRemaining('contentGenerations');
        const hasUsage = authManager.hasUsageAvailable('contentGenerations');

        return `
            <div class="content-generator">
                <!-- Header Section -->
                <div class="generator-header">
                    <div class="generator-title">
                        <h1>📝 AI Content Generator</h1>
                        <p>Create viral marketing content for all platforms</p>
                    </div>
                    <div class="usage-indicator">
                        ${remainingGenerations === -1 ? 
                            '<span class="usage-unlimited">∞ Unlimited</span>' :
                            `<span class="usage-count">${remainingGenerations} generations remaining</span>`
                        }
                    </div>
                </div>

                <!-- Product Selection -->
                ${contentState.selectedProduct ? this.getSelectedProductHTML() : ''}

                <!-- Generation Form -->
                <div class="generation-form-container">
                    <div class="card">
                        <div class="card-header">
                            <h3>Content Generation Settings</h3>
                            <p>Customize your content for maximum engagement</p>
                        </div>
                        <div class="card-body">
                            <form id="generation-form" class="generation-form">
                                <div class="form-grid">
                                    <!-- Platform Selection -->
                                    <div class="form-group full-width">
                                        <label>Platform</label>
                                        <div class="platform-grid">
                                            ${Object.entries(contentState.platforms).map(([key, platform]) => `
                                                <label class="platform-option">
                                                    <input type="radio" name="platform" value="${key}" 
                                                           ${key === 'tiktok' ? 'checked' : ''}>
                                                    <div class="platform-card">
                                                        <div class="platform-icon" style="color: ${platform.color}">
                                                            ${platform.icon}
                                                        </div>
                                                        <div class="platform-name">${platform.name}</div>
                                                    </div>
                                                </label>
                                            `).join('')}
                                        </div>
                                    </div>

                                    <!-- Product Input -->
                                    <div class="form-group">
                                        <label for="product-name">Product Name</label>
                                        <input type="text" id="product-name" name="productName" 
                                               class="form-input" 
                                               value="${contentState.selectedProduct?.name || ''}"
                                               placeholder="Enter product name">
                                    </div>

                                    <!-- Tone Selection -->
                                    <div class="form-group">
                                        <label for="tone">Tone & Style</label>
                                        <select id="tone" name="tone" class="form-select">
                                            <option value="casual">Casual & Friendly</option>
                                            <option value="professional">Professional</option>
                                            <option value="enthusiastic">Enthusiastic</option>
                                            <option value="educational">Educational</option>
                                            <option value="humorous">Humorous</option>
                                            <option value="inspirational">Inspirational</option>
                                            <option value="urgent">Urgent & Compelling</option>
                                        </select>
                                    </div>

                                    <!-- Length Selection -->
                                    <div class="form-group">
                                        <label for="length">Content Length</label>
                                        <select id="length" name="length" class="form-select">
                                            <option value="short">Short (Quick & Punchy)</option>
                                            <option value="medium" selected>Medium (Detailed)</option>
                                            <option value="long">Long (In-depth)</option>
                                        </select>
                                    </div>

                                    <!-- Target Audience -->
                                    <div class="form-group">
                                        <label for="audience">Target Audience</label>
                                        <input type="text" id="audience" name="audience" 
                                               class="form-input" 
                                               value="${contentState.selectedProduct?.targetAudience || ''}"
                                               placeholder="e.g., Young professionals, Parents, Fitness enthusiasts">
                                    </div>

                                    <!-- Goals -->
                                    <div class="form-group">
                                        <label for="goals">Campaign Goals</label>
                                        <select id="goals" name="goals" class="form-select">
                                            <option value="sales">Drive Sales</option>
                                            <option value="awareness">Brand Awareness</option>
                                            <option value="engagement">Increase Engagement</option>
                                            <option value="leads">Generate Leads</option>
                                            <option value="traffic">Drive Traffic</option>
                                        </select>
                                    </div>
                                </div>

                                <div class="form-actions">
                                    <button type="button" id="clear-form" class="btn btn-secondary">
                                        Clear Form
                                    </button>
                                    <button type="submit" id="generate-btn" class="btn btn-primary" 
                                            ${!hasUsage ? 'disabled' : ''}>
                                        <span class="btn-text">✨ Generate Content</span>
                                        <span class="btn-loading hidden">
                                            <div class="spinner"></div>
                                            Generating...
                                        </span>
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>

                <!-- Results Section -->
                <div class="results-section">
                    <div class="results-header">
                        <div class="results-title">
                            <h3>Generated Content</h3>
                            <span id="content-count" class="results-count">
                                ${contentState.currentContent.length} variations
                            </span>
                        </div>
                        <div class="results-actions">
                            <button id="regenerate-btn" class="btn btn-outline" 
                                    ${contentState.currentContent.length === 0 ? 'disabled' : ''}>
                                🔄 Regenerate
                            </button>
                            <button id="export-content" class="btn btn-secondary" 
                                    ${contentState.currentContent.length === 0 ? 'disabled' : ''}>
                                📊 Export All
                            </button>
                        </div>
                    </div>

                    <div id="content-container" class="content-container">
                        ${this.getContentHTML()}
                    </div>
                </div>

                <!-- Generation History -->
                <div class="history-section">
                    <div class="card">
                        <div class="card-header">
                            <h3>Recent Generations</h3>
                            <button id="clear-history" class="btn-text">Clear All</button>
                        </div>
                        <div class="card-body">
                            <div id="generation-history" class="generation-history">
                                ${this.getHistoryHTML()}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    // Get selected product HTML
    getSelectedProductHTML() {
        const product = contentState.selectedProduct;
        return `
            <div class="selected-product">
                <div class="card">
                    <div class="card-body">
                        <div class="product-info">
                            <div class="product-details">
                                <h4>📦 Selected Product</h4>
                                <div class="product-name">${product.name}</div>
                                <div class="product-meta">
                                    ${product.category} • ${uiComponents.formatCurrency(product.price)}
                                </div>
                            </div>
                            <button class="btn btn-outline btn-sm" onclick="ContentGenerator.clearSelectedProduct()">
                                Clear Selection
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    // Get content HTML
    getContentHTML() {
        if (contentState.currentContent.length === 0) {
            return `
                <div class="empty-state">
                    <div class="empty-icon">📝</div>
                    <h3>No content generated yet</h3>
                    <p>Use the form above to generate viral marketing content</p>
                </div>
            `;
        }

        return `
            <div class="content-grid">
                ${contentState.currentContent.map(content => this.getContentCardHTML(content)).join('')}
            </div>
        `;
    },

    // Get content card HTML
    getContentCardHTML(content) {
        const platform = contentState.platforms[content.platform];
        
        return `
            <div class="content-card" data-content-id="${content.id}">
                <div class="content-card-header">
                    <div class="content-platform">
                        <span class="platform-icon" style="color: ${platform.color}">
                            ${platform.icon}
                        </span>
                        <span class="platform-name">${platform.name}</span>
                    </div>
                    <div class="content-score">
                        <span class="score-value">${content.engagement_score}</span>
                        <span class="score-label">Score</span>
                    </div>
                </div>

                <div class="content-card-body">
                    <h4 class="content-title">${content.title}</h4>
                    
                    <div class="content-preview">
                        <div class="content-section">
                            <label>Hook:</label>
                            <p class="content-hook">${content.hook}</p>
                        </div>
                        
                        <div class="content-section">
                            <label>Main Content:</label>
                            <div class="content-copy">${this.formatContentCopy(content.copy)}</div>
                        </div>
                        
                        <div class="content-section">
                            <label>Call to Action:</label>
                            <p class="content-cta">${content.cta}</p>
                        </div>
                        
                        ${content.hashtags && content.hashtags.length > 0 ? `
                            <div class="content-section">
                                <label>Hashtags:</label>
                                <div class="hashtags">
                                    ${content.hashtags.map(tag => `<span class="hashtag">${tag}</span>`).join('')}
                                </div>
                            </div>
                        ` : ''}
                        
                        <div class="content-metrics">
                            <div class="metric-item">
                                <span class="metric-label">Est. Views</span>
                                <span class="metric-value">${uiComponents.formatNumber(content.target_metrics.views)}</span>
                            </div>
                            <div class="metric-item">
                                <span class="metric-label">Engagement</span>
                                <span class="metric-value">${content.target_metrics.engagement_rate}%</span>
                            </div>
                            <div class="metric-item">
                                <span class="metric-label">Est. Clicks</span>
                                <span class="metric-value">${uiComponents.formatNumber(content.target_metrics.clicks)}</span>
                            </div>
                        </div>
                        
                        <div class="content-insights">
                            <div class="insight-item">
                                <strong>Best Times:</strong> ${content.best_times.join(', ')}
                            </div>
                            <div class="insight-item">
                                <strong>Visual Suggestions:</strong> ${content.visual_suggestions}
                            </div>
                        </div>
                    </div>

                    <div class="content-actions">
                        <button class="btn btn-primary btn-sm" onclick="ContentGenerator.copyContent('${content.id}')">
                            📋 Copy
                        </button>
                        <button class="btn btn-outline btn-sm" onclick="ContentGenerator.editContent('${content.id}')">
                            ✏️ Edit
                        </button>
                        <button class="btn btn-secondary btn-sm" onclick="ContentGenerator.saveContent('${content.id}')">
                            💾 Save
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    // Format content copy with line breaks
    formatContentCopy(copy) {
        return copy.replace(/\n/g, '<br>').replace(/\*([^*]+)\*/g, '<em>$1</em>');
    },

    // Get history HTML
    getHistoryHTML() {
        if (contentState.generationHistory.length === 0) {
            return '<div class="empty-state-small">No recent generations</div>';
        }

        return contentState.generationHistory.map(history => `
            <div class="history-item" onclick="ContentGenerator.loadHistoryGeneration('${history.id}')">
                <div class="history-content">
                    <div class="history-title">${history.title}</div>
                    <div class="history-details">${history.platform} • ${history.variations} variations</div>
                    <div class="history-time">${uiComponents.formatDate(history.timestamp)}</div>
                </div>
                <div class="history-platform">
                    ${contentState.platforms[history.platform]?.icon || '📝'}
                </div>
            </div>
        `).join('');
    },

    // Initialize interactions
    initializeInteractions() {
        // Generation form
        const generationForm = document.getElementById('generation-form');
        if (generationForm) {
            generationForm.addEventListener('submit', (e) => this.handleGeneration(e));
        }

        // Clear form
        const clearForm = document.getElementById('clear-form');
        if (clearForm) {
            clearForm.addEventListener('click', () => this.clearForm());
        }

        // Regenerate button
        const regenerateBtn = document.getElementById('regenerate-btn');
        if (regenerateBtn) {
            regenerateBtn.addEventListener('click', () => this.regenerateContent());
        }

        // Export button
        const exportBtn = document.getElementById('export-content');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportContent());
        }

        // Clear history
        const clearHistory = document.getElementById('clear-history');
        if (clearHistory) {
            clearHistory.addEventListener('click', () => this.clearGenerationHistory());
        }

        // Platform selection changes
        this.setupPlatformHandlers();
    },

    // Setup platform selection handlers
    setupPlatformHandlers() {
        const platformInputs = document.querySelectorAll('input[name="platform"]');
        platformInputs.forEach(input => {
            input.addEventListener('change', (e) => {
                this.updateFormForPlatform(e.target.value);
            });
        });
    },

    // Update form based on platform selection
    updateFormForPlatform(platform) {
        // Platform-specific form adjustments
        const lengthSelect = document.getElementById('length');
        const goalsSelect = document.getElementById('goals');
        
        if (platform === 'tiktok') {
            // TikTok prefers short, viral content
            if (lengthSelect) lengthSelect.value = 'short';
            if (goalsSelect) goalsSelect.value = 'engagement';
        } else if (platform === 'email') {
            // Email works better with longer, detailed content
            if (lengthSelect) lengthSelect.value = 'medium';
            if (goalsSelect) goalsSelect.value = 'sales';
        }
    },

    // Handle content generation
    async handleGeneration(event) {
        event.preventDefault();
        
        if (contentState.isGenerating) return;
        
        // Check usage limits
        if (!authManager.hasUsageAvailable('contentGenerations')) {
            this.showUpgradeModal();
            return;
        }

        try {
            contentState.isGenerating = true;
            this.updateGenerationUI(true);

            // Get form data
            const formData = new FormData(event.target);
            const params = {
                platform: formData.get('platform'),
                productName: formData.get('productName'),
                tone: formData.get('tone'),
                length: formData.get('length'),
                audience: formData.get('audience'),
                goals: formData.get('goals'),
                product: contentState.selectedProduct
            };

            console.log('📝 Generating content with params:', params);

            // Call AI service
            const content = await aiContentService.generateContent(params);
            
            if (content.length === 0) {
                throw new Error('No content generated');
            }

            // Update state
            contentState.currentContent = content;
            
            // Save to generation history
            await this.saveGenerationHistory(params, content.length);
            
            // Update usage
            await authManager.updateUsage('contentGenerations', 1);
            
            // Render results
            this.renderContent();
            
            // Show success message
            uiComponents.showToast({
                type: 'success',
                title: 'Content Generated!',
                message: `Created ${content.length} viral content variations`
            });

            // Scroll to results
            document.querySelector('.results-section').scrollIntoView({ 
                behavior: 'smooth',
                block: 'start'
            });

        } catch (error) {
            console.error('❌ Content generation failed:', error);
            
            uiComponents.showToast({
                type: 'error',
                title: 'Generation Failed',
                message: error.message || 'Unable to generate content. Please try again.'
            });
        } finally {
            contentState.isGenerating = false;
            this.updateGenerationUI(false);
        }
    },

    // Update generation UI state
    updateGenerationUI(isGenerating) {
        const generateBtn = document.getElementById('generate-btn');
        const btnText = generateBtn.querySelector('.btn-text');
        const btnLoading = generateBtn.querySelector('.btn-loading');

        if (isGenerating) {
            generateBtn.disabled = true;
            btnText.classList.add('hidden');
            btnLoading.classList.remove('hidden');
        } else {
            generateBtn.disabled = false;
            btnText.classList.remove('hidden');
            btnLoading.classList.add('hidden');
        }
    },

    // Render content
    renderContent() {
        const container = document.getElementById('content-container');
        const contentCount = document.getElementById('content-count');
        const regenerateBtn = document.getElementById('regenerate-btn');
        const exportBtn = document.getElementById('export-content');

        if (container) {
            container.innerHTML = this.getContentHTML();
        }

        if (contentCount) {
            contentCount.textContent = `${contentState.currentContent.length} variations`;
        }

        if (regenerateBtn) {
            regenerateBtn.disabled = contentState.currentContent.length === 0;
        }

        if (exportBtn) {
            exportBtn.disabled = contentState.currentContent.length === 0;
        }
    },

    // Copy content to clipboard
    async copyContent(contentId) {
        const content = contentState.currentContent.find(c => c.id === contentId);
        if (!content) return;

        const textToCopy = `${content.copy}\n\n${content.cta}\n\n${content.hashtags ? content.hashtags.join(' ') : ''}`;
        
        const success = await uiComponents.copyToClipboard(textToCopy);
        if (success) {
            uiComponents.showToast({
                type: 'success',
                message: 'Content copied to clipboard!'
            });
        }
    },

    // Edit content
    editContent(contentId) {
        const content = contentState.currentContent.find(c => c.id === contentId);
        if (!content) return;

        uiComponents.createModal({
            id: 'edit-content-modal',
            title: 'Edit Content',
            size: 'large',
            content: `
                <div class="edit-content-form">
                    <div class="form-group">
                        <label for="edit-hook">Hook:</label>
                        <textarea id="edit-hook" class="form-input" rows="2">${content.hook}</textarea>
                    </div>
                    <div class="form-group">
                        <label for="edit-copy">Main Content:</label>
                        <textarea id="edit-copy" class="form-input" rows="6">${content.copy}</textarea>
                    </div>
                    <div class="form-group">
                        <label for="edit-cta">Call to Action:</label>
                        <input type="text" id="edit-cta" class="form-input" value="${content.cta}">
                    </div>
                    <div class="form-group">
                        <label for="edit-hashtags">Hashtags:</label>
                        <input type="text" id="edit-hashtags" class="form-input" 
                               value="${content.hashtags ? content.hashtags.join(' ') : ''}">
                    </div>
                </div>
            `,
            actions: [
                {
                    text: 'Cancel',
                    class: 'btn-secondary',
                    onclick: 'uiComponents.closeModal()'
                },
                {
                    text: 'Save Changes',
                    class: 'btn-primary',
                    onclick: `ContentGenerator.saveContentEdit('${contentId}'); uiComponents.closeModal();`
                }
            ]
        });
    },

    // Save content edit
    saveContentEdit(contentId) {
        const content = contentState.currentContent.find(c => c.id === contentId);
        if (!content) return;

        // Get edited values
        const hook = document.getElementById('edit-hook').value;
        const copy = document.getElementById('edit-copy').value;
        const cta = document.getElementById('edit-cta').value;
        const hashtags = document.getElementById('edit-hashtags').value
            .split(' ')
            .filter(tag => tag.startsWith('#'))
            .slice(0, 10);

        // Update content
        content.hook = hook;
        content.copy = copy;
        content.cta = cta;
        content.hashtags = hashtags;

        // Re-render
        this.renderContent();

        uiComponents.showToast({
            type: 'success',
            message: 'Content updated successfully!'
        });
    },

    // Save content
    async saveContent(contentId) {
        const content = contentState.currentContent.find(c => c.id === contentId);
        if (!content) return;

        try {
            // In production, save to Firestore
            // For demo, save to localStorage
            const savedContent = JSON.parse(localStorage.getItem('contentGenerator_savedContent') || '[]');
            savedContent.push({
                ...content,
                savedAt: new Date(),
                userId: authManager.getCurrentUser().uid
            });
            
            localStorage.setItem('contentGenerator_savedContent', JSON.stringify(savedContent));

            uiComponents.showToast({
                type: 'success',
                message: 'Content saved to your collection!'
            });

        } catch (error) {
            console.error('❌ Error saving content:', error);
            uiComponents.showToast({
                type: 'error',
                message: 'Failed to save content'
            });
        }
    },

    // Regenerate content
    regenerateContent() {
        const form = document.getElementById('generation-form');
        if (form) {
            this.handleGeneration({ preventDefault: () => {}, target: form });
        }
    },

    // Export content
    exportContent() {
        if (contentState.currentContent.length === 0) {
            uiComponents.showToast({
                type: 'warning',
                message: 'No content to export'
            });
            return;
        }

        const content = contentState.currentContent.map(item => ({
            Platform: contentState.platforms[item.platform].name,
            Title: item.title,
            Hook: item.hook,
            'Main Content': item.copy.replace(/\n/g, ' '),
            'Call to Action': item.cta,
            Hashtags: item.hashtags ? item.hashtags.join(' ') : '',
            'Engagement Score': item.engagement_score,
            'Best Times': item.best_times.join(', '),
            'Visual Suggestions': item.visual_suggestions
        }));

        const csvContent = this.convertToCSV(content);
        const filename = `content-${new Date().toISOString().split('T')[0]}.csv`;
        uiComponents.downloadFile(csvContent, filename, 'text/csv');

        uiComponents.showToast({
            type: 'success',
            message: 'Content exported successfully!'
        });
    },

    // Convert to CSV
    convertToCSV(data) {
        if (data.length === 0) return '';

        const headers = Object.keys(data[0]);
        const rows = data.map(row => 
            headers.map(header => `"${row[header] || ''}"`).join(',')
        );

        return [headers.join(','), ...rows].join('\n');
    },

    // Clear form
    clearForm() {
        const form = document.getElementById('generation-form');
        if (form) {
            form.reset();
            // Reset to TikTok as default
            const tiktokRadio = form.querySelector('input[value="tiktok"]');
            if (tiktokRadio) tiktokRadio.checked = true;
        }
    },

    // Load selected product from session storage
    loadSelectedProduct() {
        try {
            const savedProduct = sessionStorage.getItem('selectedProduct');
            if (savedProduct) {
                contentState.selectedProduct = JSON.parse(savedProduct);
                sessionStorage.removeItem('selectedProduct'); // Clear after use
            }
        } catch (error) {
            console.error('❌ Error loading selected product:', error);
        }
    },

    // Clear selected product
    clearSelectedProduct() {
        contentState.selectedProduct = null;
        this.render(); // Re-render to update UI
    },

    // Save generation history
    async saveGenerationHistory(params, variationCount) {
        const historyItem = {
            id: `generation_${Date.now()}`,
            title: `${params.productName || 'Product'} - ${contentState.platforms[params.platform].name}`,
            platform: params.platform,
            variations: variationCount,
            params: params,
            timestamp: new Date()
        };

        contentState.generationHistory.unshift(historyItem);
        
        // Keep only last 10 generations
        contentState.generationHistory = contentState.generationHistory.slice(0, 10);

        // Save to localStorage
        localStorage.setItem('contentGenerator_history', JSON.stringify(contentState.generationHistory));

        // Update UI
        const historyContainer = document.getElementById('generation-history');
        if (historyContainer) {
            historyContainer.innerHTML = this.getHistoryHTML();
        }
    },

    // Load generation history
    async loadGenerationHistory() {
        try {
            const saved = localStorage.getItem('contentGenerator_history');
            if (saved) {
                contentState.generationHistory = JSON.parse(saved).map(item => ({
                    ...item,
                    timestamp: new Date(item.timestamp)
                }));
            }
        } catch (error) {
            console.error('❌ Error loading generation history:', error);
        }
    },

    // Load history generation
    loadHistoryGeneration(historyId) {
        const history = contentState.generationHistory.find(h => h.id === historyId);
        if (!history) return;

        // Populate form with historical params
        const form = document.getElementById('generation-form');
        if (form) {
            // Set platform
            const platformRadio = form.querySelector(`input[value="${history.params.platform}"]`);
            if (platformRadio) platformRadio.checked = true;

            // Set other fields
            form.productName.value = history.params.productName || '';
            form.tone.value = history.params.tone || 'casual';
            form.length.value = history.params.length || 'medium';
            form.audience.value = history.params.audience || '';
            form.goals.value = history.params.goals || 'sales';
        }

        uiComponents.showToast({
            type: 'info',
            message: 'Form populated with historical settings'
        });
    },

    // Clear generation history
    clearGenerationHistory() {
        contentState.generationHistory = [];
        localStorage.removeItem('contentGenerator_history');
        
        const historyContainer = document.getElementById('generation-history');
        if (historyContainer) {
            historyContainer.innerHTML = this.getHistoryHTML();
        }

        uiComponents.showToast({
            type: 'success',
            message: 'Generation history cleared'
        });
    },

    // Show welcome state
    showWelcomeState() {
        const container = document.getElementById('content-container');
        if (container) {
            container.innerHTML = `
                <div class="welcome-state">
                    <div class="welcome-icon">✨</div>
                    <h3>Ready to create viral content?</h3>
                    <p>Our AI will generate multiple high-converting variations for your chosen platform</p>
                    <div class="welcome-features">
                        <div class="feature">🎯 Platform-optimized content</div>
                        <div class="feature">📈 Engagement predictions</div>
                        <div class="feature">🔥 Viral hooks & CTAs</div>
                        <div class="feature">📊 Performance insights</div>
                    </div>
                </div>
            `;
        }
    },

    // Show upgrade modal
    showUpgradeModal() {
        uiComponents.createModal({
            id: 'upgrade-modal',
            title: 'Upgrade Required',
            content: `
                <div class="upgrade-content">
                    <div class="upgrade-icon">⚡</div>
                    <h3>You've reached your generation limit</h3>
                    <p>Upgrade to Pro to get unlimited content generation and advanced features.</p>
                    <div class="upgrade-features">
                        <div class="feature">✅ Unlimited content generation</div>
                        <div class="feature">✅ All platform templates</div>
                        <div class="feature">✅ Advanced AI models</div>
                        <div class="feature">✅ Content scheduling</div>
                    </div>
                </div>
            `,
            actions: [
                {
                    text: 'Maybe Later',
                    class: 'btn-secondary',
                    onclick: 'uiComponents.closeModal()'
                },
                {
                    text: 'Upgrade Now',
                    class: 'btn-primary',
                    onclick: 'app.handleUpgrade(); uiComponents.closeModal();'
                }
            ]
        });
    },

    // Cleanup
    cleanup() {
        contentState.isGenerating = false;
        console.log('📝 Content Generator cleanup completed');
    }
};

// Export module
export default ContentGenerator;

console.log('📝 Content Generator module loaded');