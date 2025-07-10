/**
 * Demo Authentication System
 * AffiliatePro - AI-Powered Affiliate Marketing Platform
 * 
 * This is a mock authentication system for demo purposes.
 * It simulates Firebase Auth behavior without requiring real Firebase setup.
 */

import { isDemoMode } from '../config/environment.js';

// Mock users for demo
const DEMO_USERS = {
    'admin@affiliatepro.com': {
        uid: 'demo-admin-123',
        email: 'admin@affiliatepro.com',
        displayName: 'Admin User',
        photoURL: null,
        emailVerified: true,
        password: 'admin123',
        profile: {
            fullName: 'Admin User',
            plan: 'agency',
            role: 'admin',
            createdAt: new Date('2024-01-01'),
            lastLoginAt: new Date(),
            usage: {
                productDetections: 45,
                contentGenerations: 23,
                funnels: 8,
                avatarGenerations: 12
            }
        }
    },
    'user@demo.com': {
        uid: 'demo-user-456',
        email: 'user@demo.com',
        displayName: 'Demo User',
        photoURL: null,
        emailVerified: true,
        password: 'demo123',
        profile: {
            fullName: 'Demo User',
            plan: 'free',
            role: 'user',
            createdAt: new Date('2024-01-15'),
            lastLoginAt: new Date(),
            usage: {
                productDetections: 7,
                contentGenerations: 3,
                funnels: 1,
                avatarGenerations: 2
            }
        }
    },
    'pro@demo.com': {
        uid: 'demo-pro-789',
        email: 'pro@demo.com',
        displayName: 'Pro User',
        photoURL: null,
        emailVerified: true,
        password: 'pro123',
        profile: {
            fullName: 'Pro User',
            plan: 'pro',
            role: 'user',
            createdAt: new Date('2024-01-10'),
            lastLoginAt: new Date(),
            usage: {
                productDetections: 156,
                contentGenerations: 89,
                funnels: 12,
                avatarGenerations: 34
            }
        }
    }
};

class DemoAuthManager {
    constructor() {
        this.currentUser = null;
        this.currentProfile = null;
        this.listeners = [];
        this.isInitialized = false;
        
        // Initialize demo auth
        this.init();
    }

    async init() {
        // Check for existing session
        const savedSession = localStorage.getItem('demo-auth-session');
        if (savedSession) {
            try {
                const session = JSON.parse(savedSession);
                const user = DEMO_USERS[session.email];
                if (user && session.timestamp > Date.now() - 24 * 60 * 60 * 1000) {
                    this.currentUser = {
                        uid: user.uid,
                        email: user.email,
                        displayName: user.displayName,
                        photoURL: user.photoURL,
                        emailVerified: user.emailVerified
                    };
                    this.currentProfile = user.profile;
                    
                    // Notify listeners
                    this.notifyListeners();
                }
            } catch (error) {
                console.warn('Invalid demo session data');
                localStorage.removeItem('demo-auth-session');
            }
        }
        
        this.isInitialized = true;
        console.log('✅ Demo Auth initialized');
    }

    // Sign in with email and password
    async signIn(email, password, remember = false) {
        return new Promise((resolve) => {
            // Simulate network delay
            setTimeout(() => {
                const user = DEMO_USERS[email.toLowerCase()];
                
                if (!user) {
                    resolve({
                        success: false,
                        message: 'User not found. Please check your email.',
                        code: 'auth/user-not-found'
                    });
                    return;
                }
                
                if (user.password !== password) {
                    resolve({
                        success: false,
                        message: 'Incorrect password. Please try again.',
                        code: 'auth/wrong-password'
                    });
                    return;
                }
                
                // Successful login
                this.currentUser = {
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName,
                    photoURL: user.photoURL,
                    emailVerified: user.emailVerified
                };
                this.currentProfile = user.profile;
                
                // Update last login
                this.currentProfile.lastLoginAt = new Date();
                
                // Save session
                if (remember) {
                    localStorage.setItem('demo-auth-session', JSON.stringify({
                        email: user.email,
                        timestamp: Date.now()
                    }));
                }
                
                // Notify listeners
                this.notifyListeners();
                
                resolve({
                    success: true,
                    message: 'Welcome back!',
                    user: this.currentUser,
                    profile: this.currentProfile
                });
            }, 800); // Simulate network delay
        });
    }

    // Sign up with email and password
    async signUp(email, password, displayName) {
        return new Promise((resolve) => {
            // Simulate network delay
            setTimeout(() => {
                const existingUser = DEMO_USERS[email.toLowerCase()];
                
                if (existingUser) {
                    resolve({
                        success: false,
                        message: 'This email is already registered.',
                        code: 'auth/email-already-in-use'
                    });
                    return;
                }
                
                if (password.length < 6) {
                    resolve({
                        success: false,
                        message: 'Password is too weak. Please use at least 6 characters.',
                        code: 'auth/weak-password'
                    });
                    return;
                }
                
                // Create new user
                const newUser = {
                    uid: `demo-${Date.now()}`,
                    email: email.toLowerCase(),
                    displayName: displayName,
                    photoURL: null,
                    emailVerified: false,
                    password: password,
                    profile: {
                        fullName: displayName,
                        plan: 'free',
                        role: 'user',
                        createdAt: new Date(),
                        lastLoginAt: new Date(),
                        usage: {
                            productDetections: 0,
                            contentGenerations: 0,
                            funnels: 0,
                            avatarGenerations: 0
                        }
                    }
                };
                
                // Store the new user
                DEMO_USERS[email.toLowerCase()] = newUser;
                
                resolve({
                    success: true,
                    message: 'Account created successfully! Please sign in.',
                    user: {
                        uid: newUser.uid,
                        email: newUser.email,
                        displayName: newUser.displayName,
                        photoURL: newUser.photoURL,
                        emailVerified: newUser.emailVerified
                    }
                });
            }, 1000); // Simulate network delay
        });
    }

    // Sign out
    async signOut() {
        return new Promise((resolve) => {
            setTimeout(() => {
                this.currentUser = null;
                this.currentProfile = null;
                
                // Clear session
                localStorage.removeItem('demo-auth-session');
                
                // Notify listeners
                this.notifyListeners();
                
                resolve({
                    success: true,
                    message: 'You have been signed out successfully.'
                });
            }, 300);
        });
    }

    // Send password reset email
    async sendPasswordResetEmail(email) {
        return new Promise((resolve) => {
            setTimeout(() => {
                const user = DEMO_USERS[email.toLowerCase()];
                
                if (!user) {
                    resolve({
                        success: false,
                        message: 'User not found. Please check your email.',
                        code: 'auth/user-not-found'
                    });
                    return;
                }
                
                resolve({
                    success: true,
                    message: 'Password reset email sent! (This is a demo - check console for details)',
                    demoNote: `Demo password for ${email}: ${user.password}`
                });
                
                console.log(`🔑 Demo Password Reset for ${email}: ${user.password}`);
            }, 500);
        });
    }

    // Get current user
    getCurrentUser() {
        return this.currentUser;
    }

    // Get current user profile
    getCurrentProfile() {
        return this.currentProfile;
    }

    // Add auth state change listener
    onAuthStateChange(callback) {
        this.listeners.push(callback);
        
        // Immediately call with current state
        if (this.isInitialized) {
            callback(this.currentUser, this.currentProfile);
        }
        
        // Return unsubscribe function
        return () => {
            const index = this.listeners.indexOf(callback);
            if (index > -1) {
                this.listeners.splice(index, 1);
            }
        };
    }

    // Notify all listeners
    notifyListeners() {
        this.listeners.forEach(callback => {
            try {
                callback(this.currentUser, this.currentProfile);
            } catch (error) {
                console.error('Error in auth state listener:', error);
            }
        });
    }

    // Update user profile
    async updateProfile(updates) {
        return new Promise((resolve) => {
            setTimeout(() => {
                if (!this.currentUser) {
                    resolve({
                        success: false,
                        message: 'No user is signed in.',
                        code: 'auth/no-user'
                    });
                    return;
                }
                
                // Update profile
                this.currentProfile = {
                    ...this.currentProfile,
                    ...updates
                };
                
                // Update stored user data
                const user = DEMO_USERS[this.currentUser.email];
                if (user) {
                    user.profile = this.currentProfile;
                }
                
                // Notify listeners
                this.notifyListeners();
                
                resolve({
                    success: true,
                    message: 'Profile updated successfully!',
                    profile: this.currentProfile
                });
            }, 300);
        });
    }

    // Get available demo users for testing
    getDemoUsers() {
        return Object.keys(DEMO_USERS).map(email => ({
            email,
            password: DEMO_USERS[email].password,
            plan: DEMO_USERS[email].profile.plan,
            role: DEMO_USERS[email].profile.role
        }));
    }
}

// Export the demo auth manager
export default new DemoAuthManager();

// Also export for direct access
export { DemoAuthManager, DEMO_USERS };