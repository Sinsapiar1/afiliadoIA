/**
 * Environment Configuration
 * AffiliatePro - AI-Powered Affiliate Marketing Platform
 */

// Environment detection
const isDevelopment = window.location.hostname === 'localhost' || 
                     window.location.hostname === '127.0.0.1' ||
                     window.location.port === '8080';
const isProduction = !isDevelopment;

// Configuration object
export const config = {
    // Environment
    isDevelopment,
    isProduction,
    
    // Firebase Configuration - Real Production values
    firebase: {
        apiKey: "AIzaSyAqVGZGdwrvvZoC1trRr8h8TNXrwyugHww",
        authDomain: "marketingafiliados-c6eec.firebaseapp.com",
        projectId: "marketingafiliados-c6eec",
        storageBucket: "marketingafiliados-c6eec.firebasestorage.app",
        messagingSenderId: "208888972841",
        appId: "1:208888972841:web:e68d63fffebc2fe578fe38",
        measurementId: "G-YVQLB05W65"
    },
    
    // AI Services Configuration
    ai: {
        gemini: {
            apiKey: "AIzaSyDemo_Replace_With_Your_Gemini_API_Key",
            endpoint: "https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent",
            model: "gemini-pro"
        },
        openai: {
            apiKey: "sk-demo_Replace_With_Your_OpenAI_API_Key",
            endpoint: "https://api.openai.com/v1/chat/completions",
            model: "gpt-3.5-turbo"
        }
    },
    
    // Payment Configuration
    payments: {
        stripe: {
            publishableKey: isDevelopment 
                ? "pk_test_demo_replace_with_your_stripe_test_key" 
                : "pk_live_replace_with_your_stripe_live_key"
        }
    },
    
    // Feature Flags
    features: {
        aiProductDetection: true,
        aiContentGeneration: true,
        funnelBuilder: true,
        profitCalculator: true,
        adminPanel: true,
        teamManagement: false,
        apiAccess: false,
        offlineMode: true
    },
    
    // Limits Configuration
    limits: {
        free: {
            productDetections: 10,
            contentGenerations: 5,
            funnels: 2,
            avatarGenerations: 3,
            exportLimit: 1
        },
        pro: {
            productDetections: 500,
            contentGenerations: -1, // unlimited
            funnels: 25,
            avatarGenerations: 100,
            exportLimit: -1
        },
        agency: {
            productDetections: -1,
            contentGenerations: -1,
            funnels: -1,
            avatarGenerations: -1,
            exportLimit: -1
        }
    },
    
    // Admin Configuration
    admin: {
        emails: ['jaime.pivet@gmail.com', 'admin@affiliatepro.com'],
        superAdminEmails: ['jaime.pivet@gmail.com']
    },
    
    // Analytics Configuration
    analytics: {
        enabled: true,
        googleAnalyticsId: isDevelopment ? 'G-DEMO123456' : 'G-PROD123456',
        mixpanelToken: isDevelopment ? 'demo_token_12345' : 'prod_token_12345'
    },
    
    // Performance Configuration
    performance: {
        cacheTimeout: 5 * 60 * 1000, // 5 minutes
        maxRetries: 3,
        retryDelay: 1000,
        requestTimeout: 30000
    },
    
    // Demo Mode Configuration
    demo: {
        enabled: isDevelopment, // Enable demo mode only in development
        mockData: isDevelopment,
        simulateAI: isDevelopment,
        bypassAuth: false
    }
};

// Helper functions
export const getConfig = (path) => {
    return path.split('.').reduce((obj, key) => obj?.[key], config);
};

export const isFeatureEnabled = (feature) => {
    return config.features[feature] === true;
};

export const getPlanLimit = (plan, feature) => {
    return config.limits[plan]?.[feature] || 0;
};

export const isAdmin = (email) => {
    return config.admin.emails.includes(email);
};

export const isSuperAdmin = (email) => {
    return config.admin.superAdminEmails.includes(email);
};

export const isDemoMode = () => {
    return config.demo.enabled;
};

export const isValidApiKey = (key) => {
    return key && !key.includes('demo') && !key.includes('Replace');
};

export const getErrorMessage = (error) => {
    const messages = {
        'INVALID_API_KEY': 'API key is missing or invalid. Please check your configuration.',
        'NETWORK_ERROR': 'Network connection error. Please check your internet connection.',
        'RATE_LIMIT': 'Rate limit exceeded. Please try again later.',
        'UNAUTHORIZED': 'Unauthorized access. Please check your credentials.',
        'NOT_FOUND': 'Resource not found.',
        'SERVER_ERROR': 'Server error. Please try again later.'
    };
    return messages[error] || 'An unexpected error occurred.';
};

export default config;