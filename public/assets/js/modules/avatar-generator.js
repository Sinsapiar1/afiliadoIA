/**
 * Avatar Generator Module
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

// Avatar generator state
let avatarState = {
    currentAvatar: null,
    isGenerating: false,
    selectedProduct: null,
    avatarHistory: [],
    generationMode: 'guided', // 'guided' or 'custom'
    avatarCategories: {}
};

// Avatar categories and templates
const AVATAR_CATEGORIES = {
    demographics: {
        name: 'Demographics',
        icon: '👥',
        fields: ['age', 'gender', 'location', 'income', 'education', 'occupation']
    },
    psychographics: {
        name: 'Psychographics',
        icon: '🧠',
        fields: ['personality', 'values', 'interests', 'lifestyle', 'attitudes', 'motivations']
    },
    behavior: {
        name: 'Behavior',
        icon: '🎯',
        fields: ['shopping_habits', 'media_consumption', 'technology_usage', 'decision_making', 'brand_loyalty']
    },
    pain_points: {
        name: 'Pain Points',
        icon: '❗',
        fields: ['challenges', 'frustrations', 'fears', 'obstacles', 'time_constraints']
    },
    goals: {
        name: 'Goals & Aspirations',
        icon: '🎨',
        fields: ['short_term_goals', 'long_term_goals', 'aspirations', 'success_metrics', 'desired_outcomes']
    }
};

// AI Avatar Service
class AIAvatarService {
    constructor() {
        this.apiEndpoint = 'https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent';
        this.apiKey = 'your-gemini-api-key'; // In production, store securely
    }

    // Generate avatar using AI
    async generateAvatar(params) {
        const prompt = this.buildAvatarPrompt(params);
        
        try {
            if (this.apiKey && this.apiKey !== 'your-gemini-api-key') {
                return await this.callGeminiAPI(prompt);
            } else {
                return this.generateMockAvatar(params);
            }
        } catch (error) {
            console.warn('AI API failed, using mock avatar:', error);
            return this.generateMockAvatar(params);
        }
    }

    // Build avatar generation prompt
    buildAvatarPrompt(params) {
        const { product, niche, targetAudience, generationMode, customInputs } = params;
        
        return `
            As an expert market researcher and customer psychology analyst, create a detailed customer avatar/persona for the following:

            PRODUCT/SERVICE DETAILS:
            - Product: ${product?.name || 'Product/Service'}
            - Category: ${product?.category || niche || 'General'}
            - Price Point: $${product?.price || 'Various'}
            - Target Audience: ${targetAudience || 'General consumers'}

            GENERATION MODE: ${generationMode}
            ${customInputs ? `CUSTOM REQUIREMENTS: ${customInputs}` : ''}

            Create a comprehensive customer avatar including:

            DEMOGRAPHICS:
            - Age range and specific age
            - Gender and gender expression
            - Geographic location (country, region, city type)
            - Income level and financial situation
            - Education level and background
            - Occupation and career stage
            - Family situation and household composition

            PSYCHOGRAPHICS:
            - Personality traits (Big 5 model)
            - Core values and beliefs
            - Interests and hobbies
            - Lifestyle and daily routine
            - Attitudes toward technology, money, brands
            - Motivations and drivers
            - Communication preferences

            BEHAVIORAL PATTERNS:
            - Shopping habits and purchase behavior
            - Media consumption preferences
            - Technology usage patterns
            - Decision-making process
            - Brand loyalty and switching behavior
            - Social media usage and platforms
            - Information gathering methods

            PAIN POINTS & CHALLENGES:
            - Primary frustrations and problems
            - Daily challenges and obstacles
            - Fears and anxieties
            - Time constraints and limitations
            - Financial concerns
            - Social or emotional challenges

            GOALS & ASPIRATIONS:
            - Short-term goals (1-6 months)
            - Long-term goals (1-5 years)
            - Life aspirations and dreams
            - Success metrics and definitions
            - Desired outcomes from products/services
            - Personal growth objectives

            MARKETING INSIGHTS:
            - Best marketing channels to reach them
            - Messaging that resonates
            - Content types they prefer
            - Optimal timing for engagement
            - Trust-building factors
            - Purchase triggers and objections

            Make the avatar realistic, specific, and actionable. Include a compelling backstory and give them a name.

            Return as JSON:
            {
                "avatar": {
                    "name": "First Last",
                    "tagline": "Brief description",
                    "photo_description": "Physical appearance description",
                    "demographics": {
                        "age": 32,
                        "age_range": "28-35",
                        "gender": "Female",
                        "location": "Austin, Texas",
                        "income": 75000,
                        "education": "Bachelor's Degree",
                        "occupation": "Marketing Manager",
                        "family_status": "Married, 1 child"
                    },
                    "psychographics": {
                        "personality": ["Ambitious", "Creative", "Detail-oriented"],
                        "values": ["Family", "Growth", "Authenticity"],
                        "interests": ["Fitness", "Travel", "Technology"],
                        "lifestyle": "Busy professional balancing career and family",
                        "motivations": ["Career advancement", "Work-life balance"]
                    },
                    "behavior": {
                        "shopping_habits": "Research-driven, value-conscious",
                        "media_consumption": "Podcasts, Instagram, LinkedIn",
                        "technology_usage": "Heavy smartphone user, early adopter",
                        "decision_making": "Analytical, seeks recommendations",
                        "social_media": ["Instagram", "LinkedIn", "TikTok"]
                    },
                    "pain_points": [
                        "Limited time for self-care",
                        "Overwhelmed by choices",
                        "Balancing work and family"
                    ],
                    "goals": {
                        "short_term": ["Improve productivity", "Better work-life balance"],
                        "long_term": ["Career advancement", "Financial security"],
                        "aspirations": ["Leadership role", "Flexible lifestyle"]
                    },
                    "marketing_insights": {
                        "channels": ["Instagram", "LinkedIn", "Email"],
                        "messaging": ["Time-saving", "Professional growth", "Family-focused"],
                        "content_types": ["How-to guides", "Success stories", "Quick tips"],
                        "timing": ["Early morning", "Lunch break", "Evening"],
                        "trust_factors": ["Reviews", "Expert endorsements", "Free trials"],
                        "objections": ["Time investment", "Cost vs value", "Learning curve"]
                    },
                    "backstory": "Detailed background story"
                }
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

        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('No JSON found in response');
        }

        const result = JSON.parse(jsonMatch[0]);
        return result.avatar;
    }

    // Generate mock avatar for demo
    generateMockAvatar(params) {
        const { product, niche, targetAudience } = params;
        
        const mockAvatars = {
            fitness: {
                name: "Sarah Johnson",
                tagline: "Busy professional seeking fitness solutions",
                photo_description: "Athletic woman in her early 30s with a warm smile",
                demographics: {
                    age: 32,
                    age_range: "28-35",
                    gender: "Female",
                    location: "Denver, Colorado",
                    income: 68000,
                    education: "Bachelor's in Business",
                    occupation: "Marketing Manager",
                    family_status: "Single, no children"
                },
                psychographics: {
                    personality: ["Ambitious", "Health-conscious", "Time-conscious"],
                    values: ["Health", "Efficiency", "Personal growth"],
                    interests: ["Yoga", "Hiking", "Healthy cooking", "Productivity apps"],
                    lifestyle: "Active professional with limited time",
                    motivations: ["Staying fit despite busy schedule", "Stress management"]
                },
                behavior: {
                    shopping_habits: "Research online, reads reviews, values convenience",
                    media_consumption: "Instagram, fitness podcasts, YouTube workouts",
                    technology_usage: "Heavy smartphone user, fitness apps enthusiast",
                    decision_making: "Quick decisions for proven solutions",
                    social_media: ["Instagram", "LinkedIn", "TikTok"]
                },
                pain_points: [
                    "Limited time for gym visits",
                    "Inconsistent workout schedule",
                    "High stress from work",
                    "Expensive fitness memberships"
                ],
                goals: {
                    short_term: ["Establish consistent workout routine", "Lose 10 pounds"],
                    long_term: ["Maintain healthy lifestyle", "Run a marathon"],
                    aspirations: ["Work-life balance", "Leadership position"]
                },
                marketing_insights: {
                    channels: ["Instagram", "Fitness blogs", "Email newsletters"],
                    messaging: ["Time-efficient", "Proven results", "No-gym-required"],
                    content_types: ["Quick workout videos", "Before/after stories", "Productivity tips"],
                    timing: ["Early morning", "Lunch break", "Evening"],
                    trust_factors: ["User testimonials", "Expert recommendations", "Free trials"],
                    objections: ["Time commitment", "Equipment needed", "Results timeline"]
                },
                backstory: "Sarah is a 32-year-old marketing manager living in Denver who struggles to maintain her fitness routine due to her demanding career. She used to be very active in college but has found it increasingly difficult to find time for the gym. She's looking for efficient, home-based fitness solutions that can fit into her busy schedule."
            },
            beauty: {
                name: "Emily Chen",
                tagline: "Beauty enthusiast seeking premium skincare",
                photo_description: "Asian woman in her late 20s with glowing skin and trendy style",
                demographics: {
                    age: 28,
                    age_range: "25-32",
                    gender: "Female",
                    location: "Los Angeles, California",
                    income: 85000,
                    education: "Master's in Communications",
                    occupation: "Social Media Manager",
                    family_status: "In relationship, no children"
                },
                psychographics: {
                    personality: ["Creative", "Trend-conscious", "Detail-oriented"],
                    values: ["Self-expression", "Quality", "Authenticity"],
                    interests: ["Skincare", "Makeup", "Fashion", "Photography"],
                    lifestyle: "Urban professional with active social life",
                    motivations: ["Self-care", "Looking polished", "Staying current with trends"]
                },
                behavior: {
                    shopping_habits: "Brand loyal, willing to pay premium for quality",
                    media_consumption: "Instagram, TikTok, beauty YouTube, magazines",
                    technology_usage: "Early adopter, heavy social media user",
                    decision_making: "Influenced by reviews and social proof",
                    social_media: ["Instagram", "TikTok", "Pinterest", "YouTube"]
                },
                pain_points: [
                    "Finding products for sensitive skin",
                    "Information overload from beauty content",
                    "Expensive skincare costs",
                    "Time-consuming routines"
                ],
                goals: {
                    short_term: ["Perfect her skincare routine", "Try new makeup trends"],
                    long_term: ["Maintain youthful appearance", "Build beauty collection"],
                    aspirations: ["Start beauty blog", "Work with beauty brands"]
                },
                marketing_insights: {
                    channels: ["Instagram", "TikTok", "Beauty influencers"],
                    messaging: ["Premium quality", "Trending", "Exclusive"],
                    content_types: ["Tutorials", "Reviews", "Behind-the-scenes"],
                    timing: ["Morning routine", "Evening skincare", "Weekend experiments"],
                    trust_factors: ["Influencer endorsements", "Before/after photos", "Ingredient transparency"],
                    objections: ["Price point", "Skin sensitivity", "Too many steps"]
                },
                backstory: "Emily is a 28-year-old social media manager in LA who is passionate about beauty and skincare. She stays on top of the latest trends through social media and is always looking for the next holy grail product. She has a good income and is willing to invest in quality products that deliver results."
            },
            tech: {
                name: "Marcus Rodriguez",
                tagline: "Tech professional optimizing productivity",
                photo_description: "Hispanic man in his early 30s with glasses and modern style",
                demographics: {
                    age: 31,
                    age_range: "28-35",
                    gender: "Male",
                    location: "Austin, Texas",
                    income: 95000,
                    education: "Computer Science Degree",
                    occupation: "Software Developer",
                    family_status: "Married, expecting first child"
                },
                psychographics: {
                    personality: ["Analytical", "Efficiency-focused", "Tech-savvy"],
                    values: ["Innovation", "Productivity", "Family"],
                    interests: ["Programming", "Gaming", "Productivity tools", "Smart home"],
                    lifestyle: "Work-from-home tech professional",
                    motivations: ["Career advancement", "Work-life optimization", "Providing for family"]
                },
                behavior: {
                    shopping_habits: "Research extensively, compares features and reviews",
                    media_consumption: "Tech blogs, YouTube reviews, Reddit, podcasts",
                    technology_usage: "Power user, early adopter, automation enthusiast",
                    decision_making: "Data-driven, seeks best value",
                    social_media: ["LinkedIn", "Twitter", "Reddit", "YouTube"]
                },
                pain_points: [
                    "Information overload",
                    "Tool fatigue from too many apps",
                    "Balancing work efficiency with family time",
                    "Staying current with tech trends"
                ],
                goals: {
                    short_term: ["Optimize home office setup", "Learn new programming language"],
                    long_term: ["Senior developer role", "Side project success"],
                    aspirations: ["Tech leadership", "Financial independence"]
                },
                marketing_insights: {
                    channels: ["LinkedIn", "Tech blogs", "YouTube", "Email"],
                    messaging: ["Efficiency", "Innovation", "ROI"],
                    content_types: ["In-depth reviews", "Tutorials", "Case studies"],
                    timing: ["Morning news", "Lunch break", "Weekend research"],
                    trust_factors: ["Expert reviews", "Technical specifications", "Free trials"],
                    objections: ["Integration complexity", "Learning curve", "Cost justification"]
                },
                backstory: "Marcus is a 31-year-old software developer working remotely from Austin. He's expecting his first child and is focused on optimizing his productivity to balance his growing career with family responsibilities. He loves exploring new tools and technologies that can make his work more efficient."
            }
        };

        // Determine which avatar to use based on product/niche
        let avatarKey = 'tech'; // default
        if (product?.category || niche) {
            const category = (product?.category || niche).toLowerCase();
            if (category.includes('fitness') || category.includes('health')) {
                avatarKey = 'fitness';
            } else if (category.includes('beauty') || category.includes('skincare')) {
                avatarKey = 'beauty';
            }
        }

        const baseAvatar = mockAvatars[avatarKey];
        
        // Customize based on product if available
        if (product) {
            baseAvatar.product_context = {
                product_name: product.name,
                product_price: product.price,
                product_category: product.category,
                relevance_score: 0.85 + Math.random() * 0.15
            };
        }

        return {
            ...baseAvatar,
            id: `avatar_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            created_at: new Date().toISOString(),
            confidence_score: 0.8 + Math.random() * 0.2
        };
    }
}

// Initialize AI service
const aiAvatarService = new AIAvatarService();

// Avatar Generator module
const AvatarGenerator = {
    // Initialize module
    async init() {
        console.log('👤 Initializing Avatar Generator...');
        
        // Load avatar history
        await this.loadAvatarHistory();
        
        // Check for selected product from other modules
        this.loadSelectedProduct();
        
        // Initialize categories
        avatarState.avatarCategories = AVATAR_CATEGORIES;
        
        console.log('✅ Avatar Generator initialized');
    },

    // Render module
    async render() {
        const pageContent = document.getElementById('page-content');
        if (!pageContent) return;

        pageContent.innerHTML = this.getAvatarGeneratorHTML();
        
        // Initialize interactions
        this.initializeInteractions();
        
        // Show welcome state if no current avatar
        if (!avatarState.currentAvatar) {
            this.showWelcomeState();
        }
    },

    // Get HTML template
    getAvatarGeneratorHTML() {
        const userProfile = authManager.getCurrentUserProfile();
        const remainingGenerations = authManager.getUsageRemaining('avatarGenerations');
        const hasUsage = authManager.hasUsageAvailable('avatarGenerations');

        return `
            <div class="avatar-generator">
                <!-- Header Section -->
                <div class="generator-header">
                    <div class="generator-title">
                        <h1>👤 Avatar Generator</h1>
                        <p>Create detailed customer personas with AI-powered insights</p>
                    </div>
                    <div class="usage-indicator">
                        ${remainingGenerations === -1 ? 
                            '<span class="usage-unlimited">∞ Unlimited</span>' :
                            `<span class="usage-count">${remainingGenerations} avatars remaining</span>`
                        }
                    </div>
                </div>

                <!-- Selected Product -->
                ${avatarState.selectedProduct ? this.getSelectedProductHTML() : ''}

                <!-- Generation Mode Selector -->
                <div class="mode-selector">
                    <div class="card">
                        <div class="card-body">
                            <div class="mode-tabs">
                                <button class="mode-tab ${avatarState.generationMode === 'guided' ? 'active' : ''}"
                                        onclick="AvatarGenerator.switchMode('guided')">
                                    🎯 Guided Generation
                                </button>
                                <button class="mode-tab ${avatarState.generationMode === 'custom' ? 'active' : ''}"
                                        onclick="AvatarGenerator.switchMode('custom')">
                                    ⚙️ Custom Generation
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Generation Form -->
                <div class="generation-container">
                    <div class="generation-form">
                        <div class="card">
                            <div class="card-header">
                                <h3>${avatarState.generationMode === 'guided' ? '🎯 Quick Avatar Generation' : '⚙️ Custom Avatar Generation'}</h3>
                                <p>${avatarState.generationMode === 'guided' ? 'Answer a few questions to generate your avatar' : 'Provide detailed requirements for a custom avatar'}</p>
                            </div>
                            <div class="card-body">
                                <form id="avatar-form" class="avatar-form">
                                    ${avatarState.generationMode === 'guided' ? this.getGuidedFormHTML() : this.getCustomFormHTML()}
                                    
                                    <div class="form-actions">
                                        <button type="button" id="clear-form" class="btn btn-secondary">
                                            🔄 Clear Form
                                        </button>
                                        <button type="submit" id="generate-btn" class="btn btn-primary" 
                                                ${!hasUsage ? 'disabled' : ''}>
                                            <span class="btn-text">✨ Generate Avatar</span>
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

                    <!-- Avatar Display -->
                    <div class="avatar-display">
                        <div class="card">
                            <div class="card-header">
                                <h3>👤 Generated Avatar</h3>
                                <div class="avatar-actions">
                                    <button id="regenerate-btn" class="btn btn-outline btn-sm" 
                                            ${!avatarState.currentAvatar ? 'disabled' : ''}>
                                        🔄 Regenerate
                                    </button>
                                    <button id="save-avatar" class="btn btn-secondary btn-sm" 
                                            ${!avatarState.currentAvatar ? 'disabled' : ''}>
                                        💾 Save Avatar
                                    </button>
                                </div>
                            </div>
                            <div class="card-body">
                                <div id="avatar-content" class="avatar-content">
                                    ${this.getAvatarDisplayHTML()}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Avatar History -->
                <div class="history-section">
                    <div class="card">
                        <div class="card-header">
                            <h3>📋 Avatar History</h3>
                            <div class="header-actions">
                                <button id="export-avatars" class="btn btn-outline btn-sm">
                                    📊 Export All
                                </button>
                                <button id="clear-history" class="btn-text">Clear History</button>
                            </div>
                        </div>
                        <div class="card-body">
                            <div id="avatar-history" class="avatar-history">
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
        const product = avatarState.selectedProduct;
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
                            <button class="btn btn-outline btn-sm" onclick="AvatarGenerator.clearSelectedProduct()">
                                Clear Selection
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    // Get guided form HTML
    getGuidedFormHTML() {
        return `
            <div class="guided-form">
                <div class="form-grid">
                    <div class="form-group">
                        <label for="niche">Product/Service Niche</label>
                        <select id="niche" name="niche" class="form-select">
                            <option value="">Select a niche</option>
                            <option value="fitness">Fitness & Health</option>
                            <option value="beauty">Beauty & Skincare</option>
                            <option value="tech">Technology & Software</option>
                            <option value="education">Education & Courses</option>
                            <option value="business">Business & Finance</option>
                            <option value="lifestyle">Lifestyle & Home</option>
                            <option value="fashion">Fashion & Accessories</option>
                            <option value="food">Food & Nutrition</option>
                            <option value="travel">Travel & Adventure</option>
                            <option value="parenting">Parenting & Family</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label for="price-point">Price Point</label>
                        <select id="price-point" name="pricePoint" class="form-select">
                            <option value="budget">Budget ($1-50)</option>
                            <option value="mid-range" selected>Mid-range ($50-200)</option>
                            <option value="premium">Premium ($200-500)</option>
                            <option value="luxury">Luxury ($500+)</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label for="target-age">Target Age Group</label>
                        <select id="target-age" name="targetAge" class="form-select">
                            <option value="18-25">18-25 (Gen Z)</option>
                            <option value="26-35" selected>26-35 (Millennials)</option>
                            <option value="36-45">36-45 (Gen X)</option>
                            <option value="46-55">46-55 (Gen X)</option>
                            <option value="55+">55+ (Boomers)</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label for="gender-focus">Gender Focus</label>
                        <select id="gender-focus" name="genderFocus" class="form-select">
                            <option value="all">All Genders</option>
                            <option value="female">Primarily Female</option>
                            <option value="male">Primarily Male</option>
                            <option value="non-binary">Non-Binary Inclusive</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label for="income-level">Income Level</label>
                        <select id="income-level" name="incomeLevel" class="form-select">
                            <option value="low">Low ($20k-40k)</option>
                            <option value="middle" selected>Middle ($40k-80k)</option>
                            <option value="upper-middle">Upper Middle ($80k-150k)</option>
                            <option value="high">High ($150k+)</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label for="lifestyle">Lifestyle</label>
                        <select id="lifestyle" name="lifestyle" class="form-select">
                            <option value="busy-professional">Busy Professional</option>
                            <option value="stay-at-home">Stay-at-Home Parent</option>
                            <option value="student">Student</option>
                            <option value="retiree">Retiree</option>
                            <option value="entrepreneur">Entrepreneur</option>
                            <option value="freelancer">Freelancer</option>
                        </select>
                    </div>
                </div>

                <div class="form-group full-width">
                    <label for="primary-goal">Primary Goal/Need</label>
                    <textarea id="primary-goal" name="primaryGoal" class="form-input" rows="3"
                              placeholder="What is the main goal or need this avatar has? (e.g., save time, improve health, advance career)"></textarea>
                </div>

                <div class="form-group full-width">
                    <label for="biggest-challenge">Biggest Challenge</label>
                    <textarea id="biggest-challenge" name="biggestChallenge" class="form-input" rows="3"
                              placeholder="What is the biggest challenge or pain point this avatar faces?"></textarea>
                </div>
            </div>
        `;
    },

    // Get custom form HTML
    getCustomFormHTML() {
        return `
            <div class="custom-form">
                <div class="form-group">
                    <label for="custom-product">Product/Service Name</label>
                    <input type="text" id="custom-product" name="customProduct" class="form-input"
                           value="${avatarState.selectedProduct?.name || ''}"
                           placeholder="Enter product or service name">
                </div>

                <div class="form-group">
                    <label for="custom-audience">Target Audience Description</label>
                    <textarea id="custom-audience" name="customAudience" class="form-input" rows="4"
                              placeholder="Describe your target audience in detail (demographics, interests, behavior, etc.)"></textarea>
                </div>

                <div class="form-group">
                    <label for="custom-requirements">Specific Requirements</label>
                    <textarea id="custom-requirements" name="customRequirements" class="form-input" rows="6"
                              placeholder="Any specific requirements for the avatar? (e.g., specific location, profession, pain points, goals, etc.)"></textarea>
                </div>

                <div class="form-group">
                    <label for="custom-context">Additional Context</label>
                    <textarea id="custom-context" name="customContext" class="form-input" rows="4"
                              placeholder="Any additional context about your market, competition, or unique factors?"></textarea>
                </div>

                <div class="form-group">
                    <label for="avatar-depth">Avatar Depth</label>
                    <select id="avatar-depth" name="avatarDepth" class="form-select">
                        <option value="basic">Basic (Key demographics and goals)</option>
                        <option value="detailed" selected>Detailed (Comprehensive profile)</option>
                        <option value="deep">Deep (Extensive psychological profile)</option>
                    </select>
                </div>
            </div>
        `;
    },

    // Get avatar display HTML
    getAvatarDisplayHTML() {
        if (!avatarState.currentAvatar) {
            return `
                <div class="avatar-placeholder">
                    <div class="placeholder-icon">👤</div>
                    <h3>Generate Your First Avatar</h3>
                    <p>Fill out the form and click "Generate Avatar" to create a detailed customer persona</p>
                </div>
            `;
        }

        const avatar = avatarState.currentAvatar;
        
        return `
            <div class="avatar-profile">
                <!-- Avatar Header -->
                <div class="avatar-header">
                    <div class="avatar-photo">
                        <div class="avatar-placeholder-img">
                            👤
                        </div>
                        <div class="confidence-score">
                            <span class="score-value">${(avatar.confidence_score * 100).toFixed(0)}%</span>
                            <span class="score-label">Confidence</span>
                        </div>
                    </div>
                    <div class="avatar-basic-info">
                        <h3 class="avatar-name">${avatar.name}</h3>
                        <p class="avatar-tagline">${avatar.tagline}</p>
                        <div class="avatar-key-facts">
                            <span class="fact">${avatar.demographics.age} years old</span>
                            <span class="fact">${avatar.demographics.location}</span>
                            <span class="fact">${avatar.demographics.occupation}</span>
                        </div>
                    </div>
                    <div class="avatar-actions">
                        <button class="btn btn-outline btn-sm" onclick="AvatarGenerator.editAvatar()">
                            ✏️ Edit
                        </button>
                        <button class="btn btn-primary btn-sm" onclick="AvatarGenerator.generateContent()">
                            📝 Create Content
                        </button>
                    </div>
                </div>

                <!-- Avatar Details -->
                <div class="avatar-details">
                    <div class="detail-tabs">
                        <button class="detail-tab active" onclick="AvatarGenerator.switchTab('demographics')">
                            👥 Demographics
                        </button>
                        <button class="detail-tab" onclick="AvatarGenerator.switchTab('psychographics')">
                            🧠 Psychographics
                        </button>
                        <button class="detail-tab" onclick="AvatarGenerator.switchTab('behavior')">
                            🎯 Behavior
                        </button>
                        <button class="detail-tab" onclick="AvatarGenerator.switchTab('goals')">
                            🎨 Goals
                        </button>
                        <button class="detail-tab" onclick="AvatarGenerator.switchTab('marketing')">
                            📢 Marketing
                        </button>
                    </div>

                    <div class="detail-content">
                        <div id="tab-demographics" class="tab-panel active">
                            ${this.getDemographicsHTML(avatar.demographics)}
                        </div>
                        <div id="tab-psychographics" class="tab-panel">
                            ${this.getPsychographicsHTML(avatar.psychographics)}
                        </div>
                        <div id="tab-behavior" class="tab-panel">
                            ${this.getBehaviorHTML(avatar.behavior)}
                        </div>
                        <div id="tab-goals" class="tab-panel">
                            ${this.getGoalsHTML(avatar.goals, avatar.pain_points)}
                        </div>
                        <div id="tab-marketing" class="tab-panel">
                            ${this.getMarketingHTML(avatar.marketing_insights)}
                        </div>
                    </div>
                </div>

                <!-- Backstory -->
                <div class="avatar-backstory">
                    <h4>📖 Backstory</h4>
                    <p>${avatar.backstory}</p>
                </div>
            </div>
        `;
    },

    // Get demographics HTML
    getDemographicsHTML(demographics) {
        return `
            <div class="demographics-grid">
                <div class="demo-item">
                    <div class="demo-label">Age</div>
                    <div class="demo-value">${demographics.age} (${demographics.age_range})</div>
                </div>
                <div class="demo-item">
                    <div class="demo-label">Gender</div>
                    <div class="demo-value">${demographics.gender}</div>
                </div>
                <div class="demo-item">
                    <div class="demo-label">Location</div>
                    <div class="demo-value">${demographics.location}</div>
                </div>
                <div class="demo-item">
                    <div class="demo-label">Income</div>
                    <div class="demo-value">${uiComponents.formatCurrency(demographics.income)}/year</div>
                </div>
                <div class="demo-item">
                    <div class="demo-label">Education</div>
                    <div class="demo-value">${demographics.education}</div>
                </div>
                <div class="demo-item">
                    <div class="demo-label">Occupation</div>
                    <div class="demo-value">${demographics.occupation}</div>
                </div>
                <div class="demo-item">
                    <div class="demo-label">Family Status</div>
                    <div class="demo-value">${demographics.family_status}</div>
                </div>
            </div>
        `;
    },

    // Get psychographics HTML
    getPsychographicsHTML(psychographics) {
        return `
            <div class="psycho-sections">
                <div class="psycho-section">
                    <h5>Personality Traits</h5>
                    <div class="trait-tags">
                        ${psychographics.personality.map(trait => `<span class="trait-tag">${trait}</span>`).join('')}
                    </div>
                </div>
                
                <div class="psycho-section">
                    <h5>Core Values</h5>
                    <div class="value-list">
                        ${psychographics.values.map(value => `<div class="value-item">• ${value}</div>`).join('')}
                    </div>
                </div>
                
                <div class="psycho-section">
                    <h5>Interests & Hobbies</h5>
                    <div class="interest-tags">
                        ${psychographics.interests.map(interest => `<span class="interest-tag">${interest}</span>`).join('')}
                    </div>
                </div>
                
                <div class="psycho-section">
                    <h5>Lifestyle</h5>
                    <p>${psychographics.lifestyle}</p>
                </div>
                
                <div class="psycho-section">
                    <h5>Primary Motivations</h5>
                    <ul>
                        ${psychographics.motivations.map(motivation => `<li>${motivation}</li>`).join('')}
                    </ul>
                </div>
            </div>
        `;
    },

    // Get behavior HTML
    getBehaviorHTML(behavior) {
        return `
            <div class="behavior-sections">
                <div class="behavior-section">
                    <h5>Shopping Habits</h5>
                    <p>${behavior.shopping_habits}</p>
                </div>
                
                <div class="behavior-section">
                    <h5>Media Consumption</h5>
                    <p>${behavior.media_consumption}</p>
                </div>
                
                <div class="behavior-section">
                    <h5>Technology Usage</h5>
                    <p>${behavior.technology_usage}</p>
                </div>
                
                <div class="behavior-section">
                    <h5>Decision Making</h5>
                    <p>${behavior.decision_making}</p>
                </div>
                
                <div class="behavior-section">
                    <h5>Social Media Platforms</h5>
                    <div class="platform-tags">
                        ${behavior.social_media.map(platform => `<span class="platform-tag">${platform}</span>`).join('')}
                    </div>
                </div>
            </div>
        `;
    },

    // Get goals HTML
    getGoalsHTML(goals, painPoints) {
        return `
            <div class="goals-sections">
                <div class="goals-section">
                    <h5>Short-term Goals</h5>
                    <ul>
                        ${goals.short_term.map(goal => `<li>${goal}</li>`).join('')}
                    </ul>
                </div>
                
                <div class="goals-section">
                    <h5>Long-term Goals</h5>
                    <ul>
                        ${goals.long_term.map(goal => `<li>${goal}</li>`).join('')}
                    </ul>
                </div>
                
                <div class="goals-section">
                    <h5>Aspirations</h5>
                    <ul>
                        ${goals.aspirations.map(aspiration => `<li>${aspiration}</li>`).join('')}
                    </ul>
                </div>
                
                <div class="goals-section pain-points">
                    <h5>Pain Points & Challenges</h5>
                    <ul>
                        ${painPoints.map(pain => `<li>${pain}</li>`).join('')}
                    </ul>
                </div>
            </div>
        `;
    },

    // Get marketing HTML
    getMarketingHTML(marketing) {
        return `
            <div class="marketing-sections">
                <div class="marketing-section">
                    <h5>Best Marketing Channels</h5>
                    <div class="channel-tags">
                        ${marketing.channels.map(channel => `<span class="channel-tag">${channel}</span>`).join('')}
                    </div>
                </div>
                
                <div class="marketing-section">
                    <h5>Effective Messaging</h5>
                    <div class="message-tags">
                        ${marketing.messaging.map(msg => `<span class="message-tag">${msg}</span>`).join('')}
                    </div>
                </div>
                
                <div class="marketing-section">
                    <h5>Preferred Content Types</h5>
                    <div class="content-tags">
                        ${marketing.content_types.map(type => `<span class="content-tag">${type}</span>`).join('')}
                    </div>
                </div>
                
                <div class="marketing-section">
                    <h5>Optimal Timing</h5>
                    <div class="timing-tags">
                        ${marketing.timing.map(time => `<span class="timing-tag">${time}</span>`).join('')}
                    </div>
                </div>
                
                <div class="marketing-section">
                    <h5>Trust Factors</h5>
                    <ul>
                        ${marketing.trust_factors.map(factor => `<li>${factor}</li>`).join('')}
                    </ul>
                </div>
                
                <div class="marketing-section">
                    <h5>Common Objections</h5>
                    <ul>
                        ${marketing.objections.map(objection => `<li>${objection}</li>`).join('')}
                    </ul>
                </div>
            </div>
        `;
    },

    // Get history HTML
    getHistoryHTML() {
        if (avatarState.avatarHistory.length === 0) {
            return '<div class="empty-state-small">No avatar history</div>';
        }

        return avatarState.avatarHistory.map(avatar => `
            <div class="history-item" onclick="AvatarGenerator.loadHistoryAvatar('${avatar.id}')">
                <div class="history-content">
                    <div class="history-title">${avatar.name}</div>
                    <div class="history-details">${avatar.tagline}</div>
                    <div class="history-meta">
                        ${avatar.demographics.age} • ${avatar.demographics.location} • ${uiComponents.formatDate(avatar.timestamp)}
                    </div>
                </div>
                <div class="history-actions">
                    <button class="btn-icon" onclick="event.stopPropagation(); AvatarGenerator.deleteHistoryItem('${avatar.id}');" title="Delete">
                        🗑️
                    </button>
                </div>
            </div>
        `).join('');
    },

    // Initialize interactions
    initializeInteractions() {
        // Avatar form
        const avatarForm = document.getElementById('avatar-form');
        if (avatarForm) {
            avatarForm.addEventListener('submit', (e) => this.handleGeneration(e));
        }

        // Clear form
        const clearForm = document.getElementById('clear-form');
        if (clearForm) {
            clearForm.addEventListener('click', () => this.clearForm());
        }

        // Regenerate button
        const regenerateBtn = document.getElementById('regenerate-btn');
        if (regenerateBtn) {
            regenerateBtn.addEventListener('click', () => this.regenerateAvatar());
        }

        // Save avatar
        const saveBtn = document.getElementById('save-avatar');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.saveAvatar());
        }

        // Export and history actions
        const exportBtn = document.getElementById('export-avatars');
        const clearHistoryBtn = document.getElementById('clear-history');

        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportAvatars());
        }

        if (clearHistoryBtn) {
            clearHistoryBtn.addEventListener('click', () => this.clearAvatarHistory());
        }
    },

    // Handle avatar generation
    async handleGeneration(event) {
        event.preventDefault();
        
        if (avatarState.isGenerating) return;
        
        // Check usage limits
        if (!authManager.hasUsageAvailable('avatarGenerations')) {
            this.showUpgradeModal();
            return;
        }

        try {
            avatarState.isGenerating = true;
            this.updateGenerationUI(true);

            // Get form data
            const formData = new FormData(event.target);
            const params = this.buildGenerationParams(formData);

            console.log('👤 Generating avatar with params:', params);

            // Call AI service
            const avatar = await aiAvatarService.generateAvatar(params);
            
            if (!avatar) {
                throw new Error('No avatar generated');
            }

            // Update state
            avatarState.currentAvatar = avatar;
            
            // Update usage
            await authManager.updateUsage('avatarGenerations', 1);
            
            // Render avatar
            this.renderAvatar();
            
            // Show success message
            uiComponents.showToast({
                type: 'success',
                title: 'Avatar Generated!',
                message: `Created detailed persona: ${avatar.name}`
            });

            // Scroll to avatar
            document.querySelector('.avatar-display').scrollIntoView({ 
                behavior: 'smooth',
                block: 'start'
            });

        } catch (error) {
            console.error('❌ Avatar generation failed:', error);
            
            uiComponents.showToast({
                type: 'error',
                title: 'Generation Failed',
                message: error.message || 'Unable to generate avatar. Please try again.'
            });
        } finally {
            avatarState.isGenerating = false;
            this.updateGenerationUI(false);
        }
    },

    // Build generation parameters
    buildGenerationParams(formData) {
        const params = {
            generationMode: avatarState.generationMode,
            product: avatarState.selectedProduct
        };

        if (avatarState.generationMode === 'guided') {
            params.niche = formData.get('niche');
            params.pricePoint = formData.get('pricePoint');
            params.targetAge = formData.get('targetAge');
            params.genderFocus = formData.get('genderFocus');
            params.incomeLevel = formData.get('incomeLevel');
            params.lifestyle = formData.get('lifestyle');
            params.primaryGoal = formData.get('primaryGoal');
            params.biggestChallenge = formData.get('biggestChallenge');
        } else {
            params.customProduct = formData.get('customProduct');
            params.customAudience = formData.get('customAudience');
            params.customRequirements = formData.get('customRequirements');
            params.customContext = formData.get('customContext');
            params.avatarDepth = formData.get('avatarDepth');
            params.customInputs = `Product: ${params.customProduct}\nAudience: ${params.customAudience}\nRequirements: ${params.customRequirements}\nContext: ${params.customContext}`;
        }

        return params;
    },

    // Switch generation mode
    switchMode(mode) {
        avatarState.generationMode = mode;
        this.render(); // Re-render to update form
    },

    // Switch avatar detail tabs
    switchTab(tabName) {
        // Remove active class from all tabs and panels
        document.querySelectorAll('.detail-tab').forEach(tab => tab.classList.remove('active'));
        document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.remove('active'));
        
        // Add active class to selected tab and panel
        document.querySelector(`[onclick="AvatarGenerator.switchTab('${tabName}')"]`).classList.add('active');
        document.getElementById(`tab-${tabName}`).classList.add('active');
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

    // Render avatar
    renderAvatar() {
        const avatarContent = document.getElementById('avatar-content');
        const regenerateBtn = document.getElementById('regenerate-btn');
        const saveBtn = document.getElementById('save-avatar');

        if (avatarContent) {
            avatarContent.innerHTML = this.getAvatarDisplayHTML();
        }

        if (regenerateBtn) {
            regenerateBtn.disabled = !avatarState.currentAvatar;
        }

        if (saveBtn) {
            saveBtn.disabled = !avatarState.currentAvatar;
        }
    },

    // Regenerate avatar
    regenerateAvatar() {
        const form = document.getElementById('avatar-form');
        if (form) {
            this.handleGeneration({ preventDefault: () => {}, target: form });
        }
    },

    // Edit avatar
    editAvatar() {
        if (!avatarState.currentAvatar) return;

        uiComponents.createModal({
            id: 'edit-avatar-modal',
            title: 'Edit Avatar',
            size: 'large',
            content: `
                <div class="edit-avatar-form">
                    <div class="form-group">
                        <label for="edit-name">Name</label>
                        <input type="text" id="edit-name" class="form-input" value="${avatarState.currentAvatar.name}">
                    </div>
                    <div class="form-group">
                        <label for="edit-tagline">Tagline</label>
                        <input type="text" id="edit-tagline" class="form-input" value="${avatarState.currentAvatar.tagline}">
                    </div>
                    <div class="form-group">
                        <label for="edit-age">Age</label>
                        <input type="number" id="edit-age" class="form-input" value="${avatarState.currentAvatar.demographics.age}">
                    </div>
                    <div class="form-group">
                        <label for="edit-location">Location</label>
                        <input type="text" id="edit-location" class="form-input" value="${avatarState.currentAvatar.demographics.location}">
                    </div>
                    <div class="form-group">
                        <label for="edit-occupation">Occupation</label>
                        <input type="text" id="edit-occupation" class="form-input" value="${avatarState.currentAvatar.demographics.occupation}">
                    </div>
                    <div class="form-group">
                        <label for="edit-backstory">Backstory</label>
                        <textarea id="edit-backstory" class="form-input" rows="4">${avatarState.currentAvatar.backstory}</textarea>
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
                    onclick: 'AvatarGenerator.saveAvatarEdit(); uiComponents.closeModal();'
                }
            ]
        });
    },

    // Save avatar edit
    saveAvatarEdit() {
        if (!avatarState.currentAvatar) return;

        // Get edited values
        avatarState.currentAvatar.name = document.getElementById('edit-name').value;
        avatarState.currentAvatar.tagline = document.getElementById('edit-tagline').value;
        avatarState.currentAvatar.demographics.age = parseInt(document.getElementById('edit-age').value);
        avatarState.currentAvatar.demographics.location = document.getElementById('edit-location').value;
        avatarState.currentAvatar.demographics.occupation = document.getElementById('edit-occupation').value;
        avatarState.currentAvatar.backstory = document.getElementById('edit-backstory').value;

        // Re-render
        this.renderAvatar();

        uiComponents.showToast({
            type: 'success',
            message: 'Avatar updated successfully!'
        });
    },

    // Generate content for avatar
    generateContent() {
        if (!avatarState.currentAvatar) return;

        // Store avatar data for content generator
        sessionStorage.setItem('selectedAvatar', JSON.stringify(avatarState.currentAvatar));
        
        // Navigate to content generator
        router.navigate('content');
        
        uiComponents.showToast({
            type: 'info',
            message: `Creating content for ${avatarState.currentAvatar.name}`
        });
    },

    // Save avatar
    async saveAvatar() {
        if (!avatarState.currentAvatar) return;

        try {
            const avatarToSave = {
                ...avatarState.currentAvatar,
                timestamp: new Date(),
                userId: authManager.getCurrentUser().uid
            };

            avatarState.avatarHistory.unshift(avatarToSave);
            
            // Keep only last 20 avatars
            avatarState.avatarHistory = avatarState.avatarHistory.slice(0, 20);
            
            // Save to localStorage
            localStorage.setItem('avatarGenerator_history', JSON.stringify(avatarState.avatarHistory));

            // Update history display
            this.updateHistoryDisplay();

            uiComponents.showToast({
                type: 'success',
                message: 'Avatar saved to history!'
            });

        } catch (error) {
            console.error('❌ Error saving avatar:', error);
            uiComponents.showToast({
                type: 'error',
                message: 'Failed to save avatar'
            });
        }
    },

    // Export avatars
    exportAvatars() {
        if (avatarState.avatarHistory.length === 0) {
            uiComponents.showToast({
                type: 'warning',
                message: 'No avatars to export'
            });
            return;
        }

        const csvData = this.convertAvatarsToCSV(avatarState.avatarHistory);
        const filename = `avatars-${new Date().toISOString().split('T')[0]}.csv`;
        uiComponents.downloadFile(csvData, filename, 'text/csv');

        uiComponents.showToast({
            type: 'success',
            message: 'Avatars exported successfully!'
        });
    },

    // Convert avatars to CSV
    convertAvatarsToCSV(avatars) {
        const headers = [
            'Name', 'Age', 'Gender', 'Location', 'Occupation', 'Income',
            'Personality', 'Values', 'Interests', 'Pain Points', 'Goals'
        ];

        const rows = avatars.map(avatar => [
            avatar.name,
            avatar.demographics.age,
            avatar.demographics.gender,
            avatar.demographics.location,
            avatar.demographics.occupation,
            avatar.demographics.income,
            avatar.psychographics.personality.join('; '),
            avatar.psychographics.values.join('; '),
            avatar.psychographics.interests.join('; '),
            avatar.pain_points.join('; '),
            [...avatar.goals.short_term, ...avatar.goals.long_term].join('; ')
        ]);

        return [headers, ...rows]
            .map(row => row.map(field => `"${field}"`).join(','))
            .join('\n');
    },

    // Clear form
    clearForm() {
        const form = document.getElementById('avatar-form');
        if (form) {
            form.reset();
        }
    },

    // Load avatar history
    async loadAvatarHistory() {
        try {
            const saved = localStorage.getItem('avatarGenerator_history');
            if (saved) {
                avatarState.avatarHistory = JSON.parse(saved).map(avatar => ({
                    ...avatar,
                    timestamp: new Date(avatar.timestamp)
                }));
            }
        } catch (error) {
            console.error('❌ Error loading avatar history:', error);
        }
    },

    // Load history avatar
    loadHistoryAvatar(avatarId) {
        const avatar = avatarState.avatarHistory.find(a => a.id === avatarId);
        if (!avatar) return;

        avatarState.currentAvatar = { ...avatar };
        this.renderAvatar();

        uiComponents.showToast({
            type: 'success',
            message: `Avatar "${avatar.name}" loaded`
        });
    },

    // Delete history item
    deleteHistoryItem(avatarId) {
        avatarState.avatarHistory = avatarState.avatarHistory.filter(a => a.id !== avatarId);
        localStorage.setItem('avatarGenerator_history', JSON.stringify(avatarState.avatarHistory));
        
        this.updateHistoryDisplay();

        uiComponents.showToast({
            type: 'success',
            message: 'Avatar deleted from history'
        });
    },

    // Clear avatar history
    clearAvatarHistory() {
        if (!confirm('Are you sure you want to clear all avatar history?')) return;

        avatarState.avatarHistory = [];
        localStorage.removeItem('avatarGenerator_history');
        
        this.updateHistoryDisplay();

        uiComponents.showToast({
            type: 'success',
            message: 'Avatar history cleared'
        });
    },

    // Update history display
    updateHistoryDisplay() {
        const historyContainer = document.getElementById('avatar-history');
        if (historyContainer) {
            historyContainer.innerHTML = this.getHistoryHTML();
        }
    },

    // Load selected product from session storage
    loadSelectedProduct() {
        try {
            const savedProduct = sessionStorage.getItem('selectedProduct');
            if (savedProduct) {
                avatarState.selectedProduct = JSON.parse(savedProduct);
                sessionStorage.removeItem('selectedProduct'); // Clear after use
            }
        } catch (error) {
            console.error('❌ Error loading selected product:', error);
        }
    },

    // Clear selected product
    clearSelectedProduct() {
        avatarState.selectedProduct = null;
        this.render(); // Re-render to update UI
    },

    // Show welcome state
    showWelcomeState() {
        // Welcome state is shown in getAvatarDisplayHTML when no avatar exists
    },

    // Show upgrade modal
    showUpgradeModal() {
        uiComponents.createModal({
            id: 'upgrade-modal',
            title: 'Upgrade Required',
            content: `
                <div class="upgrade-content">
                    <div class="upgrade-icon">⚡</div>
                    <h3>You've reached your avatar generation limit</h3>
                    <p>Upgrade to Pro to create unlimited customer avatars and unlock advanced features.</p>
                    <div class="upgrade-features">
                        <div class="feature">✅ Unlimited avatar generation</div>
                        <div class="feature">✅ Deep psychological profiles</div>
                        <div class="feature">✅ Advanced customization</div>
                        <div class="feature">✅ Export capabilities</div>
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
        avatarState.isGenerating = false;
        console.log('👤 Avatar Generator cleanup completed');
    }
};

// Export module
export default AvatarGenerator;

console.log('👤 Avatar Generator module loaded');