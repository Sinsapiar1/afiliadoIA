/**
 * Product Detector Module
 * AffiliatePro - AI-Powered Affiliate Marketing Platform
 */

import { db, COLLECTIONS } from '../core/firebase-config.js';
import authManager from '../core/auth.js';
import uiComponents from '../components/ui-components.js';
import config from '../config/environment.js';
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

// Product detector state
let detectorState = {
    isDetecting: false,
    currentProducts: [],
    filters: {
        category: 'all',
        priceRange: 'all',
        sortBy: 'popularity',
        platforms: ['all']
    },
    searchHistory: [],
    savedProducts: []
};

// AI Service integration
class AIProductService {
    constructor() {
        this.apiEndpoint = config.ai.gemini.endpoint;
        this.apiKey = config.ai.gemini.apiKey;
    }

    // Detect products using AI
    async detectProducts(criteria) {
        const prompt = this.buildDetectionPrompt(criteria);
        
        try {
            // Try AI API first
            if (this.apiKey && this.apiKey !== 'your-gemini-api-key') {
                return await this.callGeminiAPI(prompt);
            } else {
                // Fallback to mock data for demo
                return this.generateMockProducts(criteria);
            }
        } catch (error) {
            console.warn('AI API failed, using mock data:', error);
            return this.generateMockProducts(criteria);
        }
    }

    // Build detection prompt for AI
    buildDetectionPrompt(criteria) {
        const { category, priceRange, targetAudience, platforms } = criteria;
        
        return `
            As an expert affiliate marketer and product analyst, analyze current market trends and identify 8-10 winning products for affiliate marketing with the following criteria:

            Category: ${category}
            Price Range: ${priceRange}
            Target Audience: ${targetAudience || 'General consumers'}
            Platforms: ${platforms.join(', ')}
            Date: ${new Date().toISOString().split('T')[0]}

            For each product, provide:
            1. Product name and category
            2. Current market price (USD)
            3. Estimated conversion rate (%)
            4. Competition level (Low/Medium/High)
            5. Trend status (Rising/Stable/Declining)
            6. Best marketing platforms
            7. Target audience demographics
            8. Why it's a winning product
            9. Potential commission rate
            10. Seasonality factor

            Return only real, currently trending products that exist in the market. Focus on products with high affiliate potential and proven sales data.

            Format as JSON array with these exact fields:
            {
                "products": [
                    {
                        "name": "Product name",
                        "category": "Category",
                        "price": 29.99,
                        "conversionRate": 3.2,
                        "competition": "Medium",
                        "trend": "Rising",
                        "platforms": ["TikTok", "Facebook"],
                        "targetAudience": "Young adults 18-35",
                        "reason": "Why it's winning",
                        "commission": 15.5,
                        "seasonality": "Year-round",
                        "epc": 2.45,
                        "gravity": 85.2
                    }
                ]
            }
        `;
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
                    temperature: 0.7,
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

        // Parse JSON from response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('No JSON found in response');
        }

        const result = JSON.parse(jsonMatch[0]);
        return result.products || [];
    }

    // Generate mock products for demo
    generateMockProducts(criteria) {
        const mockProducts = [
            {
                name: "Wireless Bluetooth Earbuds Pro",
                category: "Electronics",
                price: 49.99,
                conversionRate: 4.2,
                competition: "High",
                trend: "Rising",
                platforms: ["TikTok", "Instagram", "YouTube"],
                targetAudience: "Tech enthusiasts 20-40",
                reason: "High demand for wireless audio, excellent reviews, affordable price point",
                commission: 15.5,
                seasonality: "Year-round",
                epc: 2.85,
                gravity: 92.3,
                image: "https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=300&h=200&fit=crop"
            },
            {
                name: "LED Desk Lamp with Wireless Charging",
                category: "Home & Office",
                price: 34.99,
                conversionRate: 3.8,
                competition: "Medium",
                trend: "Stable",
                platforms: ["Facebook", "Pinterest", "Google Ads"],
                targetAudience: "Remote workers 25-45",
                reason: "WFH trend, multifunctional design, energy efficient",
                commission: 12.0,
                seasonality: "Peak in Q4",
                epc: 1.95,
                gravity: 76.8,
                image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=200&fit=crop"
            },
            {
                name: "Resistance Bands Fitness Set",
                category: "Health & Fitness",
                price: 24.99,
                conversionRate: 5.1,
                competition: "Medium",
                trend: "Rising",
                platforms: ["Instagram", "TikTok", "YouTube"],
                targetAudience: "Fitness enthusiasts 18-50",
                reason: "Home fitness trend, versatile equipment, affordable",
                commission: 18.0,
                seasonality: "Peak Jan-Mar",
                epc: 3.42,
                gravity: 88.1,
                image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&h=200&fit=crop"
            },
            {
                name: "Smart Water Bottle with Temperature Display",
                category: "Health & Fitness",
                price: 39.99,
                conversionRate: 3.5,
                competition: "Low",
                trend: "Rising",
                platforms: ["TikTok", "Instagram", "Amazon"],
                targetAudience: "Health-conscious millennials",
                reason: "Unique smart features, health tracking trend, viral potential",
                commission: 20.5,
                seasonality: "Summer peak",
                epc: 2.78,
                gravity: 65.4,
                image: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=300&h=200&fit=crop"
            },
            {
                name: "Portable Phone Stand with MagSafe",
                category: "Electronics",
                price: 19.99,
                conversionRate: 4.7,
                competition: "High",
                trend: "Stable",
                platforms: ["TikTok", "Facebook", "Instagram"],
                targetAudience: "iPhone users 18-40",
                reason: "iPhone compatibility, content creation trend, affordable",
                commission: 25.0,
                seasonality: "Year-round",
                epc: 1.85,
                gravity: 71.2,
                image: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=300&h=200&fit=crop"
            },
            {
                name: "Blue Light Blocking Glasses",
                category: "Health & Wellness",
                price: 29.99,
                conversionRate: 3.9,
                competition: "Medium",
                trend: "Stable",
                platforms: ["Facebook", "Google Ads", "Instagram"],
                targetAudience: "Office workers 25-50",
                reason: "Digital eye strain awareness, remote work increase",
                commission: 22.0,
                seasonality: "Year-round",
                epc: 2.15,
                gravity: 79.6,
                image: "https://images.unsplash.com/photo-1574258495973-f010dfbb5371?w=300&h=200&fit=crop"
            },
            {
                name: "Skincare LED Face Mask",
                category: "Beauty",
                price: 89.99,
                conversionRate: 2.8,
                competition: "Medium",
                trend: "Rising",
                platforms: ["Instagram", "TikTok", "Pinterest"],
                targetAudience: "Women 25-45",
                reason: "At-home beauty treatments, LED therapy trend, high ticket",
                commission: 30.0,
                seasonality: "Peak Q4",
                epc: 4.55,
                gravity: 58.9,
                image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=300&h=200&fit=crop"
            },
            {
                name: "Car Mount Phone Holder",
                category: "Automotive",
                price: 16.99,
                conversionRate: 4.1,
                competition: "High",
                trend: "Stable",
                platforms: ["Amazon", "Facebook", "Google Ads"],
                targetAudience: "Car owners 20-60",
                reason: "Universal need, safety focus, affordable price",
                commission: 18.5,
                seasonality: "Year-round",
                epc: 1.45,
                gravity: 82.7,
                image: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=300&h=200&fit=crop"
            }
        ];

        // Filter based on criteria
        let filteredProducts = mockProducts;
        
        if (criteria.category && criteria.category !== 'all') {
            filteredProducts = filteredProducts.filter(p => 
                p.category.toLowerCase().includes(criteria.category.toLowerCase())
            );
        }

        if (criteria.priceRange && criteria.priceRange !== 'all') {
            const [min, max] = this.parsePriceRange(criteria.priceRange);
            filteredProducts = filteredProducts.filter(p => 
                p.price >= min && p.price <= max
            );
        }

        // Shuffle and return up to 8 products
        return filteredProducts
            .sort(() => Math.random() - 0.5)
            .slice(0, 8)
            .map(product => ({
                ...product,
                id: `product_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                detectedAt: new Date().toISOString(),
                score: Math.round((product.conversionRate * 10 + product.epc * 20) * Math.random() * 1.2)
            }));
    }

    // Parse price range
    parsePriceRange(range) {
        switch (range) {
            case 'under-25': return [0, 25];
            case '25-50': return [25, 50];
            case '50-100': return [50, 100];
            case 'over-100': return [100, 999999];
            default: return [0, 999999];
        }
    }
}

// Initialize AI service
const aiService = new AIProductService();

// Product Detector module
const ProductDetector = {
    // Initialize module
    async init() {
        console.log('🔍 Initializing Product Detector...');
        
        // Load saved data
        await this.loadSavedProducts();
        await this.loadSearchHistory();
        
        console.log('✅ Product Detector initialized');
    },

    // Render module
    async render() {
        const pageContent = document.getElementById('page-content');
        if (!pageContent) return;

        pageContent.innerHTML = this.getProductDetectorHTML();
        
        // Initialize interactions
        this.initializeInteractions();
        
        // Load recent products if available
        if (detectorState.currentProducts.length === 0) {
            await this.loadRecentProducts();
        } else {
            this.renderProducts();
        }
    },

    // Get HTML template
    getProductDetectorHTML() {
        const userProfile = authManager.getCurrentUserProfile();
        const remainingDetections = authManager.getUsageRemaining('productDetections');
        const hasUsage = authManager.hasUsageAvailable('productDetections');

        return `
            <div class="product-detector">
                <!-- Header Section -->
                <div class="detector-header">
                    <div class="detector-title">
                        <h1>🔍 AI Product Detector</h1>
                        <p>Discover winning products with advanced AI analysis</p>
                    </div>
                    <div class="usage-indicator">
                        ${remainingDetections === -1 ? 
                            '<span class="usage-unlimited">∞ Unlimited</span>' :
                            `<span class="usage-count">${remainingDetections} detections remaining</span>`
                        }
                    </div>
                </div>

                <!-- Detection Form -->
                <div class="detection-form-container">
                    <div class="card">
                        <div class="card-header">
                            <h3>Product Detection Criteria</h3>
                            <p>Customize your search to find the most relevant winning products</p>
                        </div>
                        <div class="card-body">
                            <form id="detection-form" class="detection-form">
                                <div class="form-grid">
                                    <div class="form-group">
                                        <label for="category">Category</label>
                                        <select id="category" name="category" class="form-select">
                                            <option value="all">All Categories</option>
                                            <option value="electronics">Electronics</option>
                                            <option value="health-fitness">Health & Fitness</option>
                                            <option value="beauty">Beauty & Skincare</option>
                                            <option value="home-garden">Home & Garden</option>
                                            <option value="fashion">Fashion & Accessories</option>
                                            <option value="automotive">Automotive</option>
                                            <option value="hobbies">Hobbies & Crafts</option>
                                            <option value="business">Business & Industrial</option>
                                        </select>
                                    </div>

                                    <div class="form-group">
                                        <label for="price-range">Price Range</label>
                                        <select id="price-range" name="priceRange" class="form-select">
                                            <option value="all">All Prices</option>
                                            <option value="under-25">Under $25</option>
                                            <option value="25-50">$25 - $50</option>
                                            <option value="50-100">$50 - $100</option>
                                            <option value="over-100">Over $100</option>
                                        </select>
                                    </div>

                                    <div class="form-group">
                                        <label for="target-audience">Target Audience</label>
                                        <input type="text" id="target-audience" name="targetAudience" 
                                               class="form-input" placeholder="e.g., Young adults, Parents, Professionals">
                                    </div>

                                    <div class="form-group">
                                        <label for="platforms">Marketing Platforms</label>
                                        <select id="platforms" name="platforms" class="form-select" multiple>
                                            <option value="tiktok">TikTok</option>
                                            <option value="instagram">Instagram</option>
                                            <option value="facebook">Facebook</option>
                                            <option value="youtube">YouTube</option>
                                            <option value="pinterest">Pinterest</option>
                                            <option value="google-ads">Google Ads</option>
                                            <option value="amazon">Amazon</option>
                                        </select>
                                    </div>
                                </div>

                                <div class="form-actions">
                                    <button type="button" id="clear-filters" class="btn btn-secondary">
                                        Clear Filters
                                    </button>
                                    <button type="submit" id="detect-btn" class="btn btn-primary" 
                                            ${!hasUsage ? 'disabled' : ''}>
                                        <span class="btn-text">🔍 Detect Products</span>
                                        <span class="btn-loading hidden">
                                            <div class="spinner"></div>
                                            Analyzing...
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
                            <h3>Detected Products</h3>
                            <span id="results-count" class="results-count">
                                ${detectorState.currentProducts.length} products found
                            </span>
                        </div>
                        <div class="results-actions">
                            <div class="sort-dropdown">
                                <label for="sort-by">Sort by:</label>
                                <select id="sort-by" class="form-select">
                                    <option value="score">AI Score</option>
                                    <option value="conversion">Conversion Rate</option>
                                    <option value="commission">Commission</option>
                                    <option value="price">Price</option>
                                    <option value="competition">Competition</option>
                                </select>
                            </div>
                            <button id="export-products" class="btn btn-outline" 
                                    ${detectorState.currentProducts.length === 0 ? 'disabled' : ''}>
                                📊 Export CSV
                            </button>
                        </div>
                    </div>

                    <div id="products-container" class="products-container">
                        ${this.getProductsHTML()}
                    </div>
                </div>

                <!-- Search History -->
                <div class="history-section">
                    <div class="card">
                        <div class="card-header">
                            <h3>Recent Searches</h3>
                            <button id="clear-history" class="btn-text">Clear All</button>
                        </div>
                        <div class="card-body">
                            <div id="search-history" class="search-history">
                                ${this.getSearchHistoryHTML()}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    // Get products HTML
    getProductsHTML() {
        if (detectorState.currentProducts.length === 0) {
            return `
                <div class="empty-state">
                    <div class="empty-icon">🔍</div>
                    <h3>No products detected yet</h3>
                    <p>Use the form above to detect winning products with AI analysis</p>
                </div>
            `;
        }

        return `
            <div class="products-grid">
                ${detectorState.currentProducts.map(product => this.getProductCardHTML(product)).join('')}
            </div>
        `;
    },

    // Get product card HTML
    getProductCardHTML(product) {
        return `
            <div class="product-card" data-product-id="${product.id}">
                <div class="product-card-image">
                    <img src="${product.image || 'https://via.placeholder.com/300x200?text=Product'}" 
                         alt="${product.name}" loading="lazy">
                    <div class="product-score">
                        <span class="score-value">${product.score}</span>
                        <span class="score-label">AI Score</span>
                    </div>
                    <div class="product-trend ${product.trend.toLowerCase()}">
                        ${product.trend === 'Rising' ? '📈' : product.trend === 'Declining' ? '📉' : '➡️'}
                        ${product.trend}
                    </div>
                </div>
                
                <div class="product-card-content">
                    <div class="product-header">
                        <h4 class="product-title">${product.name}</h4>
                        <div class="product-category">${product.category}</div>
                    </div>

                    <div class="product-metrics">
                        <div class="metric">
                            <span class="metric-label">Price</span>
                            <span class="metric-value">${uiComponents.formatCurrency(product.price)}</span>
                        </div>
                        <div class="metric">
                            <span class="metric-label">CVR</span>
                            <span class="metric-value">${product.conversionRate}%</span>
                        </div>
                        <div class="metric">
                            <span class="metric-label">Commission</span>
                            <span class="metric-value">${product.commission}%</span>
                        </div>
                        <div class="metric">
                            <span class="metric-label">EPC</span>
                            <span class="metric-value">$${product.epc}</span>
                        </div>
                    </div>

                    <div class="product-details">
                        <div class="detail-item">
                            <strong>Target:</strong> ${product.targetAudience}
                        </div>
                        <div class="detail-item">
                            <strong>Competition:</strong> 
                            <span class="competition-${product.competition.toLowerCase()}">${product.competition}</span>
                        </div>
                        <div class="detail-item">
                            <strong>Platforms:</strong> ${product.platforms.join(', ')}
                        </div>
                        <div class="detail-item">
                            <strong>Seasonality:</strong> ${product.seasonality}
                        </div>
                    </div>

                    <div class="product-reason">
                        <strong>Why it's winning:</strong>
                        <p>${product.reason}</p>
                    </div>

                    <div class="product-actions">
                        <button class="btn btn-primary btn-sm" onclick="ProductDetector.generateContent('${product.id}')">
                            📝 Generate Content
                        </button>
                        <button class="btn btn-outline btn-sm" onclick="ProductDetector.createFunnel('${product.id}')">
                            🎯 Create Funnel
                        </button>
                        <button class="btn btn-secondary btn-sm" onclick="ProductDetector.saveProduct('${product.id}')">
                            💾 Save
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    // Get search history HTML
    getSearchHistoryHTML() {
        if (detectorState.searchHistory.length === 0) {
            return '<div class="empty-state-small">No recent searches</div>';
        }

        return detectorState.searchHistory.map(search => `
            <div class="history-item" onclick="ProductDetector.loadHistorySearch('${search.id}')">
                <div class="history-content">
                    <div class="history-title">${search.title}</div>
                    <div class="history-details">${search.details}</div>
                    <div class="history-time">${uiComponents.formatDate(search.timestamp)}</div>
                </div>
                <div class="history-results">${search.resultCount} products</div>
            </div>
        `).join('');
    },

    // Initialize interactions
    initializeInteractions() {
        // Detection form
        const detectionForm = document.getElementById('detection-form');
        if (detectionForm) {
            detectionForm.addEventListener('submit', (e) => this.handleDetection(e));
        }

        // Clear filters
        const clearFilters = document.getElementById('clear-filters');
        if (clearFilters) {
            clearFilters.addEventListener('click', () => this.clearFilters());
        }

        // Sort dropdown
        const sortBy = document.getElementById('sort-by');
        if (sortBy) {
            sortBy.addEventListener('change', (e) => this.sortProducts(e.target.value));
        }

        // Export button
        const exportBtn = document.getElementById('export-products');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportProducts());
        }

        // Clear history
        const clearHistory = document.getElementById('clear-history');
        if (clearHistory) {
            clearHistory.addEventListener('click', () => this.clearSearchHistory());
        }

        // Platform multi-select
        this.initializeMultiSelect();
    },

    // Initialize multi-select for platforms
    initializeMultiSelect() {
        const platformsSelect = document.getElementById('platforms');
        if (!platformsSelect) return;

        // Add "All" option behavior
        platformsSelect.addEventListener('change', (e) => {
            const options = Array.from(e.target.options);
            const selectedValues = Array.from(e.target.selectedOptions).map(opt => opt.value);
            
            // If nothing is selected, select all
            if (selectedValues.length === 0) {
                options.forEach(opt => opt.selected = true);
            }
        });
    },

    // Handle product detection
    async handleDetection(event) {
        event.preventDefault();
        
        if (detectorState.isDetecting) return;
        
        // Check usage limits
        if (!authManager.hasUsageAvailable('productDetections')) {
            this.showUpgradeModal();
            return;
        }

        try {
            detectorState.isDetecting = true;
            this.updateDetectionUI(true);

            // Get form data
            const formData = new FormData(event.target);
            const criteria = {
                category: formData.get('category'),
                priceRange: formData.get('priceRange'),
                targetAudience: formData.get('targetAudience'),
                platforms: Array.from(document.getElementById('platforms').selectedOptions)
                    .map(opt => opt.value)
            };

            console.log('🔍 Detecting products with criteria:', criteria);

            // Call AI service
            const products = await aiService.detectProducts(criteria);
            
            if (products.length === 0) {
                throw new Error('No products found for the given criteria');
            }

            // Update state
            detectorState.currentProducts = products;
            
            // Save to search history
            await this.saveSearchHistory(criteria, products.length);
            
            // Update usage
            await authManager.updateUsage('productDetections', 1);
            
            // Render results
            this.renderProducts();
            
            // Show success message
            uiComponents.showToast({
                type: 'success',
                title: 'Products Detected!',
                message: `Found ${products.length} winning products for your criteria`
            });

            // Scroll to results
            document.querySelector('.results-section').scrollIntoView({ 
                behavior: 'smooth',
                block: 'start'
            });

        } catch (error) {
            console.error('❌ Product detection failed:', error);
            
            uiComponents.showToast({
                type: 'error',
                title: 'Detection Failed',
                message: error.message || 'Unable to detect products. Please try again.'
            });
        } finally {
            detectorState.isDetecting = false;
            this.updateDetectionUI(false);
        }
    },

    // Update detection UI state
    updateDetectionUI(isDetecting) {
        const detectBtn = document.getElementById('detect-btn');
        const btnText = detectBtn.querySelector('.btn-text');
        const btnLoading = detectBtn.querySelector('.btn-loading');

        if (isDetecting) {
            detectBtn.disabled = true;
            btnText.classList.add('hidden');
            btnLoading.classList.remove('hidden');
        } else {
            detectBtn.disabled = false;
            btnText.classList.remove('hidden');
            btnLoading.classList.add('hidden');
        }
    },

    // Render products
    renderProducts() {
        const container = document.getElementById('products-container');
        const resultsCount = document.getElementById('results-count');
        const exportBtn = document.getElementById('export-products');

        if (container) {
            container.innerHTML = this.getProductsHTML();
        }

        if (resultsCount) {
            resultsCount.textContent = `${detectorState.currentProducts.length} products found`;
        }

        if (exportBtn) {
            exportBtn.disabled = detectorState.currentProducts.length === 0;
        }
    },

    // Sort products
    sortProducts(sortBy) {
        const products = [...detectorState.currentProducts];
        
        products.sort((a, b) => {
            switch (sortBy) {
                case 'score':
                    return b.score - a.score;
                case 'conversion':
                    return b.conversionRate - a.conversionRate;
                case 'commission':
                    return b.commission - a.commission;
                case 'price':
                    return a.price - b.price;
                case 'competition':
                    const compOrder = { 'Low': 1, 'Medium': 2, 'High': 3 };
                    return compOrder[a.competition] - compOrder[b.competition];
                default:
                    return 0;
            }
        });

        detectorState.currentProducts = products;
        this.renderProducts();
    },

    // Clear filters
    clearFilters() {
        const form = document.getElementById('detection-form');
        if (form) {
            form.reset();
            
            // Reset multi-select
            const platformsSelect = document.getElementById('platforms');
            Array.from(platformsSelect.options).forEach(opt => opt.selected = false);
        }
    },

    // Export products to CSV
    exportProducts() {
        if (detectorState.currentProducts.length === 0) {
            uiComponents.showToast({
                type: 'warning',
                message: 'No products to export'
            });
            return;
        }

        const headers = [
            'Product Name', 'Category', 'Price', 'Conversion Rate (%)', 
            'Commission (%)', 'EPC ($)', 'Competition', 'Trend', 
            'Target Audience', 'Platforms', 'Seasonality', 'AI Score'
        ];

        const rows = detectorState.currentProducts.map(product => [
            product.name,
            product.category,
            product.price,
            product.conversionRate,
            product.commission,
            product.epc,
            product.competition,
            product.trend,
            product.targetAudience,
            product.platforms.join('; '),
            product.seasonality,
            product.score
        ]);

        const csvContent = [headers, ...rows]
            .map(row => row.map(field => `"${field}"`).join(','))
            .join('\n');

        const filename = `affiliate-products-${new Date().toISOString().split('T')[0]}.csv`;
        uiComponents.downloadFile(csvContent, filename, 'text/csv');

        uiComponents.showToast({
            type: 'success',
            message: 'Products exported successfully!'
        });
    },

    // Save search history
    async saveSearchHistory(criteria, resultCount) {
        const historyItem = {
            id: `search_${Date.now()}`,
            title: this.buildSearchTitle(criteria),
            details: this.buildSearchDetails(criteria),
            criteria: criteria,
            resultCount: resultCount,
            timestamp: new Date()
        };

        detectorState.searchHistory.unshift(historyItem);
        
        // Keep only last 10 searches
        detectorState.searchHistory = detectorState.searchHistory.slice(0, 10);

        // Save to localStorage
        localStorage.setItem('productDetector_searchHistory', JSON.stringify(detectorState.searchHistory));

        // Update UI
        const historyContainer = document.getElementById('search-history');
        if (historyContainer) {
            historyContainer.innerHTML = this.getSearchHistoryHTML();
        }
    },

    // Build search title
    buildSearchTitle(criteria) {
        const parts = [];
        
        if (criteria.category && criteria.category !== 'all') {
            parts.push(criteria.category.replace('-', ' '));
        }
        
        if (criteria.priceRange && criteria.priceRange !== 'all') {
            parts.push(criteria.priceRange.replace('-', ' - $'));
        }

        return parts.length > 0 ? parts.join(' • ') : 'All Categories';
    },

    // Build search details
    buildSearchDetails(criteria) {
        const details = [];
        
        if (criteria.targetAudience) {
            details.push(`Target: ${criteria.targetAudience}`);
        }
        
        if (criteria.platforms && criteria.platforms.length > 0) {
            details.push(`Platforms: ${criteria.platforms.join(', ')}`);
        }

        return details.join(' • ') || 'No specific criteria';
    },

    // Load search history from storage
    async loadSearchHistory() {
        try {
            const saved = localStorage.getItem('productDetector_searchHistory');
            if (saved) {
                detectorState.searchHistory = JSON.parse(saved).map(item => ({
                    ...item,
                    timestamp: new Date(item.timestamp)
                }));
            }
        } catch (error) {
            console.error('❌ Error loading search history:', error);
        }
    },

    // Load history search
    loadHistorySearch(searchId) {
        const search = detectorState.searchHistory.find(s => s.id === searchId);
        if (!search) return;

        // Populate form with criteria
        const form = document.getElementById('detection-form');
        if (form) {
            form.category.value = search.criteria.category || 'all';
            form.priceRange.value = search.criteria.priceRange || 'all';
            form.targetAudience.value = search.criteria.targetAudience || '';
            
            // Handle platforms
            const platformsSelect = document.getElementById('platforms');
            Array.from(platformsSelect.options).forEach(opt => {
                opt.selected = search.criteria.platforms.includes(opt.value);
            });
        }

        // Trigger detection
        this.handleDetection({ preventDefault: () => {}, target: form });
    },

    // Clear search history
    clearSearchHistory() {
        detectorState.searchHistory = [];
        localStorage.removeItem('productDetector_searchHistory');
        
        const historyContainer = document.getElementById('search-history');
        if (historyContainer) {
            historyContainer.innerHTML = this.getSearchHistoryHTML();
        }

        uiComponents.showToast({
            type: 'success',
            message: 'Search history cleared'
        });
    },

    // Load recent products
    async loadRecentProducts() {
        // In a real implementation, this would load from Firestore
        // For demo, we'll show a message
        const container = document.getElementById('products-container');
        if (container) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🔍</div>
                    <h3>Ready to find winning products?</h3>
                    <p>Use our AI-powered detector to discover high-converting products for your affiliate business</p>
                    <button class="btn btn-primary" onclick="document.getElementById('detection-form').scrollIntoView()">
                        Start Detection
                    </button>
                </div>
            `;
        }
    },

    // Generate content for product
    generateContent(productId) {
        const product = detectorState.currentProducts.find(p => p.id === productId);
        if (!product) return;

        // Store product data for content generator
        sessionStorage.setItem('selectedProduct', JSON.stringify(product));
        
        // Navigate to content generator
        router.navigate('content');
        
        uiComponents.showToast({
            type: 'info',
            message: `Redirecting to content generator for ${product.name}`
        });
    },

    // Create funnel for product
    createFunnel(productId) {
        const product = detectorState.currentProducts.find(p => p.id === productId);
        if (!product) return;

        // Store product data for funnel architect
        sessionStorage.setItem('selectedProduct', JSON.stringify(product));
        
        // Navigate to funnel architect
        router.navigate('funnels');
        
        uiComponents.showToast({
            type: 'info',
            message: `Creating funnel for ${product.name}`
        });
    },

    // Save product
    async saveProduct(productId) {
        const product = detectorState.currentProducts.find(p => p.id === productId);
        if (!product) return;

        try {
            // Add to saved products
            const savedProduct = {
                ...product,
                savedAt: new Date(),
                userId: authManager.getCurrentUser().uid
            };

            detectorState.savedProducts.push(savedProduct);
            
            // Save to localStorage (in production, save to Firestore)
            localStorage.setItem('productDetector_savedProducts', 
                JSON.stringify(detectorState.savedProducts));

            uiComponents.showToast({
                type: 'success',
                message: `${product.name} saved to your collection`
            });

        } catch (error) {
            console.error('❌ Error saving product:', error);
            uiComponents.showToast({
                type: 'error',
                message: 'Failed to save product'
            });
        }
    },

    // Load saved products
    async loadSavedProducts() {
        try {
            const saved = localStorage.getItem('productDetector_savedProducts');
            if (saved) {
                detectorState.savedProducts = JSON.parse(saved);
            }
        } catch (error) {
            console.error('❌ Error loading saved products:', error);
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
                    <h3>You've reached your detection limit</h3>
                    <p>Upgrade to Pro to get unlimited product detections and unlock all features.</p>
                    <div class="upgrade-features">
                        <div class="feature">✅ Unlimited product detections</div>
                        <div class="feature">✅ Advanced AI analysis</div>
                        <div class="feature">✅ Content generation</div>
                        <div class="feature">✅ Funnel builder</div>
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
        detectorState.isDetecting = false;
        console.log('🔍 Product Detector cleanup completed');
    }
};

// Export module
export default ProductDetector;

console.log('🔍 Product Detector module loaded');