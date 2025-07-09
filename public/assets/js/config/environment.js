/**
 * Environment Configuration
 * AffiliatePro - AI-Powered Affiliate Marketing Platform
 */

// Environment detection
const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const isProduction = !isDevelopment;

// Configuration object
export const config = {
    // Environment
    isDevelopment,
    isProduction,
    
    // Firebase Configuration
    firebase: {
        apiKey: isDevelopment 
            ? "AIzaSyBXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX" 
            : "YOUR_PRODUCTION_API_KEY",
        authDomain: isDevelopment 
            ? "affiliate-pro-demo.firebaseapp.com" 
            : "your-production-domain.firebaseapp.com",
        projectId: isDevelopment 
            ? "affiliate-pro-demo" 
            : "your-production-project-id",
        storageBucket: isDevelopment 
            ? "affiliate-pro-demo.appspot.com" 
            : "your-production-bucket.appspot.com",
        messagingSenderId: isDevelopment 
            ? "123456789012" 
            : "YOUR_PRODUCTION_SENDER_ID",
        appId: isDevelopment 
            ? "1:123456789012:web:abcdef1234567890" 
            : "YOUR_PRODUCTION_APP_ID",
        measurementId: isDevelopment 
            ? "G-XXXXXXXXXX" 
            : "YOUR_PRODUCTION_MEASUREMENT_ID"
    },
    
    // AI Services Configuration
    ai: {
        gemini: {
            apiKey: isDevelopment 
                ? "AIzaSyBXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX" 
                : "YOUR_GEMINI_API_KEY",
            endpoint: "https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent"
        },
        openai: {
            apiKey: isDevelopment 
                ? "sk-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX" 
                : "YOUR_OPENAI_API_KEY",
            endpoint: "https://api.openai.com/v1/chat/completions"
        }
    },
    
    // Payment Configuration
    payments: {
        stripe: {
            publishableKey: isDevelopment 
                ? "pk_test_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX" 
                : "pk_live_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
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
        apiAccess: false
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
        emails: ['jaime.pivet@gmail.com'],
        superAdminEmails: ['jaime.pivet@gmail.com']
    },
    
    // Analytics Configuration
    analytics: {
        enabled: true,
        googleAnalyticsId: isDevelopment ? 'G-XXXXXXXXXX' : 'YOUR_GA_ID',
        mixpanelToken: isDevelopment ? 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' : 'YOUR_MIXPANEL_TOKEN'
    },
    
    // Performance Configuration
    performance: {
        cacheTimeout: 5 * 60 * 1000, // 5 minutes
        maxRetries: 3,
        retryDelay: 1000,
        requestTimeout: 30000
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

export default config;