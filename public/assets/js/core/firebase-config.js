/**
 * Firebase Configuration and Initialization
 * AffiliatePro - AI-Powered Affiliate Marketing Platform
 */

// Firebase configuration
const firebaseConfig = {
    apiKey: "your-api-key-here",
    authDomain: "affiliate-pro-app.firebaseapp.com",
    projectId: "affiliate-pro-app",
    storageBucket: "affiliate-pro-app.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef123456",
    measurementId: "G-XXXXXXXXXX"
};

// Initialize Firebase
let app, auth, db, analytics;

try {
    // Initialize Firebase App
    app = window.firebase.initializeApp(firebaseConfig);
    
    // Initialize Firebase services
    auth = window.firebase.getAuth(app);
    db = window.firebase.getFirestore(app);
    
    // Initialize Analytics (optional, only if needed)
    if (typeof window.firebase.getAnalytics === 'function') {
        analytics = window.firebase.getAnalytics(app);
    }
    
    console.log('✅ Firebase initialized successfully');
} catch (error) {
    console.error('❌ Firebase initialization error:', error);
}

// Firebase Auth persistence
import { setPersistence, browserLocalPersistence } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

// Set auth persistence
if (auth) {
    setPersistence(auth, browserLocalPersistence)
        .then(() => {
            console.log('✅ Auth persistence set to LOCAL');
        })
        .catch((error) => {
            console.error('❌ Auth persistence error:', error);
        });
}

// Firestore settings for better performance
import { connectFirestoreEmulator, enableNetwork } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Enable offline persistence
if (db) {
    enableNetwork(db).catch((error) => {
        console.warn('⚠️ Firestore network error:', error);
    });
}

// Export Firebase services
export { app, auth, db, analytics };

// User roles and plans configuration
export const USER_ROLES = {
    USER: 'user',
    ADMIN: 'admin',
    SUPER_ADMIN: 'super_admin'
};

export const USER_PLANS = {
    FREE: 'free',
    PRO: 'pro',
    AGENCY: 'agency',
    ENTERPRISE: 'enterprise'
};

// Plan limits configuration
export const PLAN_LIMITS = {
    [USER_PLANS.FREE]: {
        productDetections: 10,
        contentGenerations: 5,
        funnels: 2,
        avatarGenerations: 3,
        exportLimit: 1,
        features: ['basic_detector', 'basic_content', 'basic_calculator']
    },
    [USER_PLANS.PRO]: {
        productDetections: 500,
        contentGenerations: -1, // unlimited
        funnels: 25,
        avatarGenerations: 100,
        exportLimit: -1,
        features: ['advanced_detector', 'viral_content', 'funnel_architect', 'avatar_generator', 'profit_calculator', 'analytics']
    },
    [USER_PLANS.AGENCY]: {
        productDetections: -1,
        contentGenerations: -1,
        funnels: -1,
        avatarGenerations: -1,
        exportLimit: -1,
        features: ['all_features', 'team_management', 'white_label', 'api_access', 'priority_support']
    },
    [USER_PLANS.ENTERPRISE]: {
        productDetections: -1,
        contentGenerations: -1,
        funnels: -1,
        avatarGenerations: -1,
        exportLimit: -1,
        features: ['all_features', 'custom_integrations', 'dedicated_support', 'custom_limits', 'sla']
    }
};

// Admin email configuration
export const ADMIN_EMAILS = [
    'jaime.pivet@gmail.com'
];

// Database collections
export const COLLECTIONS = {
    USERS: 'users',
    PRODUCTS: 'products',
    CONTENT: 'content',
    FUNNELS: 'funnels',
    AVATARS: 'avatars',
    ANALYTICS: 'analytics',
    ADMIN: 'admin',
    SETTINGS: 'settings'
};

// Real-time listeners management
class FirebaseListeners {
    constructor() {
        this.listeners = new Map();
    }

    add(key, unsubscribe) {
        // Clean up existing listener if exists
        if (this.listeners.has(key)) {
            this.listeners.get(key)();
        }
        this.listeners.set(key, unsubscribe);
    }

    remove(key) {
        if (this.listeners.has(key)) {
            this.listeners.get(key)();
            this.listeners.delete(key);
        }
    }

    removeAll() {
        this.listeners.forEach(unsubscribe => unsubscribe());
        this.listeners.clear();
    }
}

export const firebaseListeners = new FirebaseListeners();

// Firebase utilities
export const FirebaseUtils = {
    // Generate timestamp
    timestamp() {
        return new Date().toISOString();
    },

    // Generate server timestamp
    serverTimestamp() {
        return window.firebase.getFirestore.serverTimestamp?.() || new Date();
    },

    // Batch operations helper
    async batchWrite(operations) {
        const { writeBatch } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        const batch = writeBatch(db);
        
        operations.forEach(({ type, ref, data }) => {
            switch (type) {
                case 'set':
                    batch.set(ref, data);
                    break;
                case 'update':
                    batch.update(ref, data);
                    break;
                case 'delete':
                    batch.delete(ref);
                    break;
            }
        });

        return batch.commit();
    },

    // Retry mechanism for failed operations
    async retry(operation, maxRetries = 3, delay = 1000) {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await operation();
            } catch (error) {
                if (attempt === maxRetries) {
                    throw error;
                }
                console.warn(`🔄 Retry attempt ${attempt}/${maxRetries} failed:`, error.message);
                await new Promise(resolve => setTimeout(resolve, delay * attempt));
            }
        }
    },

    // Error handler
    handleError(error, context = '') {
        console.error(`❌ Firebase Error ${context}:`, error);
        
        // Map Firebase errors to user-friendly messages
        const errorMessages = {
            'auth/user-not-found': 'User not found. Please check your email.',
            'auth/wrong-password': 'Incorrect password. Please try again.',
            'auth/email-already-in-use': 'This email is already registered.',
            'auth/weak-password': 'Password is too weak. Please use at least 6 characters.',
            'auth/invalid-email': 'Please enter a valid email address.',
            'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
            'permission-denied': 'You don\'t have permission to perform this action.',
            'unavailable': 'Service temporarily unavailable. Please try again.',
            'deadline-exceeded': 'Request timeout. Please check your connection.',
        };

        return errorMessages[error.code] || error.message || 'An unexpected error occurred.';
    }
};

// Connection state monitoring
let isOnline = navigator.onLine;
let connectionListeners = [];

function updateConnectionState(online) {
    isOnline = online;
    connectionListeners.forEach(listener => listener(online));
    
    // Update UI indicator
    const indicator = document.querySelector('.connection-indicator');
    if (indicator) {
        indicator.classList.toggle('offline', !online);
    }
}

window.addEventListener('online', () => updateConnectionState(true));
window.addEventListener('offline', () => updateConnectionState(false));

export const ConnectionMonitor = {
    isOnline() {
        return isOnline;
    },

    onConnectionChange(callback) {
        connectionListeners.push(callback);
        return () => {
            const index = connectionListeners.indexOf(callback);
            if (index > -1) {
                connectionListeners.splice(index, 1);
            }
        };
    }
};

// Performance monitoring
export const PerformanceMonitor = {
    // Measure operation time
    async measure(name, operation) {
        const start = performance.now();
        try {
            const result = await operation();
            const duration = performance.now() - start;
            console.log(`⏱️ ${name}: ${duration.toFixed(2)}ms`);
            return result;
        } catch (error) {
            const duration = performance.now() - start;
            console.error(`⏱️ ${name} failed after ${duration.toFixed(2)}ms:`, error);
            throw error;
        }
    },

    // Log slow operations
    logSlowOperation(name, duration, threshold = 1000) {
        if (duration > threshold) {
            console.warn(`🐌 Slow operation detected: ${name} took ${duration.toFixed(2)}ms`);
        }
    }
};

// Initialize error boundary for Firebase operations
window.addEventListener('unhandledrejection', (event) => {
    if (event.reason?.code?.startsWith('auth/') || event.reason?.code?.startsWith('firestore/')) {
        console.error('🚨 Unhandled Firebase error:', event.reason);
        event.preventDefault(); // Prevent default error handling
    }
});

// Environment detection
export const Environment = {
    isDevelopment() {
        return location.hostname === 'localhost' || location.hostname === '127.0.0.1';
    },

    isProduction() {
        return !this.isDevelopment();
    },

    getBaseUrl() {
        return this.isDevelopment() 
            ? 'http://localhost:3000' 
            : 'https://affiliate-pro-app.web.app';
    }
};

// Debug mode for development
if (Environment.isDevelopment()) {
    window.FirebaseDebug = {
        auth,
        db,
        analytics,
        utils: FirebaseUtils,
        listeners: firebaseListeners,
        monitor: PerformanceMonitor,
        connection: ConnectionMonitor
    };
    console.log('🐛 Firebase Debug mode enabled. Access via window.FirebaseDebug');
}

export default {
    app,
    auth,
    db,
    analytics,
    utils: FirebaseUtils,
    listeners: firebaseListeners,
    monitor: PerformanceMonitor,
    connection: ConnectionMonitor,
    environment: Environment
};