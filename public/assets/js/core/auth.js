/**
 * Authentication System
 * AffiliatePro - AI-Powered Affiliate Marketing Platform
 */

import { auth, db, USER_ROLES, USER_PLANS, ADMIN_EMAILS, COLLECTIONS, FirebaseUtils } from './firebase-config.js';
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword,
    signOut,
    sendPasswordResetEmail,
    updateProfile,
    onAuthStateChanged,
    sendEmailVerification
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import {
    doc,
    setDoc,
    getDoc,
    updateDoc,
    serverTimestamp,
    increment
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Authentication State Management
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.userProfile = null;
        this.authListeners = [];
        this.isInitialized = false;
        
        // Initialize auth state listener
        this.initAuthStateListener();
    }

    // Initialize authentication state listener
    initAuthStateListener() {
        onAuthStateChanged(auth, async (user) => {
            this.currentUser = user;
            
            if (user) {
                try {
                    // Load user profile data
                    await this.loadUserProfile(user.uid);
                    
                    // Update last login
                    await this.updateLastLogin(user.uid);
                    
                    // Check if user is admin
                    const isAdmin = this.isAdmin(user.email);
                    if (isAdmin && this.userProfile?.role !== USER_ROLES.ADMIN) {
                        await this.updateUserRole(user.uid, USER_ROLES.ADMIN);
                    }
                    
                    console.log('✅ User authenticated:', user.email);
                } catch (error) {
                    console.error('❌ Error loading user profile:', error);
                }
            } else {
                this.userProfile = null;
                console.log('ℹ️ User signed out');
            }

            // Notify all listeners
            this.notifyAuthListeners(user, this.userProfile);
            this.isInitialized = true;
        });
    }

    // Add authentication state listener
    onAuthStateChange(callback) {
        this.authListeners.push(callback);
        
        // If already initialized, call immediately
        if (this.isInitialized) {
            callback(this.currentUser, this.userProfile);
        }

        // Return unsubscribe function
        return () => {
            const index = this.authListeners.indexOf(callback);
            if (index > -1) {
                this.authListeners.splice(index, 1);
            }
        };
    }

    // Notify all auth listeners
    notifyAuthListeners(user, profile) {
        this.authListeners.forEach(callback => {
            try {
                callback(user, profile);
            } catch (error) {
                console.error('❌ Auth listener error:', error);
            }
        });
    }

    // Sign in with email and password
    async signIn(email, password, rememberMe = false) {
        try {
            const result = await signInWithEmailAndPassword(auth, email, password);
            const user = result.user;

            // Check if email is verified
            if (!user.emailVerified) {
                throw new Error('Please verify your email before signing in.');
            }

            // Update user analytics
            await this.updateUserAnalytics(user.uid, 'login');

            return {
                success: true,
                user: user,
                message: 'Successfully signed in!'
            };
        } catch (error) {
            const message = FirebaseUtils.handleError(error, 'Sign In');
            return {
                success: false,
                error: error.code,
                message: message
            };
        }
    }

    // Create new user account
    async signUp(email, password, fullName) {
        try {
            // Validate input
            if (!email || !password || !fullName) {
                throw new Error('All fields are required.');
            }

            if (password.length < 6) {
                throw new Error('Password must be at least 6 characters long.');
            }

            // Create user account
            const result = await createUserWithEmailAndPassword(auth, email, password);
            const user = result.user;

            // Update user profile
            await updateProfile(user, {
                displayName: fullName
            });

            // Create user document in Firestore
            await this.createUserProfile(user.uid, {
                email: email,
                fullName: fullName,
                role: this.isAdmin(email) ? USER_ROLES.ADMIN : USER_ROLES.USER,
                plan: USER_PLANS.FREE
            });

            // Send verification email
            await sendEmailVerification(user);

            // Update analytics
            await this.updateUserAnalytics(user.uid, 'signup');

            return {
                success: true,
                user: user,
                message: 'Account created successfully! Please check your email for verification.'
            };
        } catch (error) {
            const message = FirebaseUtils.handleError(error, 'Sign Up');
            return {
                success: false,
                error: error.code,
                message: message
            };
        }
    }

    // Sign out user
    async signOut() {
        try {
            await signOut(auth);
            this.currentUser = null;
            this.userProfile = null;
            
            return {
                success: true,
                message: 'Successfully signed out!'
            };
        } catch (error) {
            const message = FirebaseUtils.handleError(error, 'Sign Out');
            return {
                success: false,
                error: error.code,
                message: message
            };
        }
    }

    // Send password reset email
    async resetPassword(email) {
        try {
            await sendPasswordResetEmail(auth, email);
            return {
                success: true,
                message: 'Password reset email sent! Check your inbox.'
            };
        } catch (error) {
            const message = FirebaseUtils.handleError(error, 'Password Reset');
            return {
                success: false,
                error: error.code,
                message: message
            };
        }
    }

    // Create user profile in Firestore
    async createUserProfile(uid, userData) {
        const userProfile = {
            uid: uid,
            email: userData.email,
            fullName: userData.fullName,
            role: userData.role,
            plan: userData.plan,
            usage: {
                productDetections: 0,
                contentGenerations: 0,
                funnels: 0,
                avatarGenerations: 0,
                exports: 0
            },
            preferences: {
                theme: 'light',
                language: 'en',
                notifications: {
                    email: true,
                    push: true,
                    marketing: false
                }
            },
            subscription: {
                status: 'active',
                startDate: serverTimestamp(),
                endDate: null,
                stripeCustomerId: null,
                stripeSubscriptionId: null
            },
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            lastLoginAt: serverTimestamp(),
            isActive: true,
            emailVerified: false
        };

        const userRef = doc(db, COLLECTIONS.USERS, uid);
        await setDoc(userRef, userProfile);
        
        console.log('✅ User profile created:', uid);
        return userProfile;
    }

    // Load user profile from Firestore
    async loadUserProfile(uid) {
        try {
            const userRef = doc(db, COLLECTIONS.USERS, uid);
            const userSnap = await getDoc(userRef);
            
            if (userSnap.exists()) {
                this.userProfile = { id: userSnap.id, ...userSnap.data() };
                return this.userProfile;
            } else {
                // Create profile if doesn't exist (for existing auth users)
                const user = auth.currentUser;
                if (user) {
                    this.userProfile = await this.createUserProfile(uid, {
                        email: user.email,
                        fullName: user.displayName || 'User',
                        role: this.isAdmin(user.email) ? USER_ROLES.ADMIN : USER_ROLES.USER,
                        plan: USER_PLANS.FREE
                    });
                    return this.userProfile;
                }
            }
        } catch (error) {
            console.error('❌ Error loading user profile:', error);
            throw error;
        }
    }

    // Update user profile
    async updateUserProfile(updates) {
        if (!this.currentUser) {
            throw new Error('No authenticated user');
        }

        try {
            const userRef = doc(db, COLLECTIONS.USERS, this.currentUser.uid);
            const updateData = {
                ...updates,
                updatedAt: serverTimestamp()
            };

            await updateDoc(userRef, updateData);
            
            // Update local profile
            this.userProfile = { ...this.userProfile, ...updateData };
            
            // Notify listeners
            this.notifyAuthListeners(this.currentUser, this.userProfile);
            
            console.log('✅ User profile updated');
            return this.userProfile;
        } catch (error) {
            console.error('❌ Error updating user profile:', error);
            throw error;
        }
    }

    // Update user role
    async updateUserRole(uid, role) {
        try {
            const userRef = doc(db, COLLECTIONS.USERS, uid);
            await updateDoc(userRef, {
                role: role,
                updatedAt: serverTimestamp()
            });

            if (uid === this.currentUser?.uid) {
                this.userProfile.role = role;
            }

            console.log(`✅ User role updated to ${role}`);
        } catch (error) {
            console.error('❌ Error updating user role:', error);
            throw error;
        }
    }

    // Update user plan
    async updateUserPlan(plan, subscriptionData = {}) {
        if (!this.currentUser) {
            throw new Error('No authenticated user');
        }

        try {
            const userRef = doc(db, COLLECTIONS.USERS, this.currentUser.uid);
            const updateData = {
                plan: plan,
                subscription: {
                    ...this.userProfile.subscription,
                    ...subscriptionData,
                    updatedAt: serverTimestamp()
                },
                updatedAt: serverTimestamp()
            };

            await updateDoc(userRef, updateData);
            
            // Update local profile
            this.userProfile = { ...this.userProfile, ...updateData };
            
            // Reset usage limits for new plan
            await this.resetUsageLimits();
            
            console.log(`✅ User plan updated to ${plan}`);
            return this.userProfile;
        } catch (error) {
            console.error('❌ Error updating user plan:', error);
            throw error;
        }
    }

    // Update user usage
    async updateUsage(type, increment = 1) {
        if (!this.currentUser) {
            throw new Error('No authenticated user');
        }

        try {
            const userRef = doc(db, COLLECTIONS.USERS, this.currentUser.uid);
            const usageUpdate = {};
            usageUpdate[`usage.${type}`] = increment(increment);

            await updateDoc(userRef, usageUpdate);
            
            // Update local profile
            if (this.userProfile?.usage) {
                this.userProfile.usage[type] = (this.userProfile.usage[type] || 0) + increment;
            }

            console.log(`✅ Usage updated: ${type} +${increment}`);
        } catch (error) {
            console.error('❌ Error updating usage:', error);
            throw error;
        }
    }

    // Reset usage limits (typically for plan upgrades)
    async resetUsageLimits() {
        if (!this.currentUser) {
            throw new Error('No authenticated user');
        }

        try {
            const userRef = doc(db, COLLECTIONS.USERS, this.currentUser.uid);
            await updateDoc(userRef, {
                usage: {
                    productDetections: 0,
                    contentGenerations: 0,
                    funnels: 0,
                    avatarGenerations: 0,
                    exports: 0
                },
                updatedAt: serverTimestamp()
            });

            // Update local profile
            if (this.userProfile) {
                this.userProfile.usage = {
                    productDetections: 0,
                    contentGenerations: 0,
                    funnels: 0,
                    avatarGenerations: 0,
                    exports: 0
                };
            }

            console.log('✅ Usage limits reset');
        } catch (error) {
            console.error('❌ Error resetting usage limits:', error);
            throw error;
        }
    }

    // Update last login timestamp
    async updateLastLogin(uid) {
        try {
            const userRef = doc(db, COLLECTIONS.USERS, uid);
            await updateDoc(userRef, {
                lastLoginAt: serverTimestamp()
            });
        } catch (error) {
            console.error('❌ Error updating last login:', error);
        }
    }

    // Update user analytics
    async updateUserAnalytics(uid, action) {
        try {
            const analyticsRef = doc(db, COLLECTIONS.ANALYTICS, 'user_actions');
            const analyticsData = {};
            analyticsData[`${action}_count`] = increment(1);
            analyticsData['last_updated'] = serverTimestamp();

            await updateDoc(analyticsRef, analyticsData);
        } catch (error) {
            console.error('❌ Error updating analytics:', error);
        }
    }

    // Check if user is admin
    isAdmin(email) {
        return ADMIN_EMAILS.includes(email?.toLowerCase());
    }

    // Check if user has permission
    hasPermission(permission) {
        if (!this.userProfile) return false;
        
        // Admin has all permissions
        if (this.userProfile.role === USER_ROLES.ADMIN) return true;
        
        // Check plan-specific permissions
        const planFeatures = this.getPlanFeatures();
        return planFeatures.includes(permission);
    }

    // Get current plan features
    getPlanFeatures() {
        if (!this.userProfile) return [];
        
        const plan = this.userProfile.plan || USER_PLANS.FREE;
        return PLAN_LIMITS[plan]?.features || [];
    }

    // Check usage limits
    hasUsageAvailable(type) {
        if (!this.userProfile) return false;
        
        // Admin has unlimited usage
        if (this.userProfile.role === USER_ROLES.ADMIN) return true;
        
        const plan = this.userProfile.plan || USER_PLANS.FREE;
        const limits = PLAN_LIMITS[plan];
        
        if (!limits) return false;
        
        const limit = limits[type];
        if (limit === -1) return true; // Unlimited
        
        const used = this.userProfile.usage?.[type] || 0;
        return used < limit;
    }

    // Get usage remaining
    getUsageRemaining(type) {
        if (!this.userProfile) return 0;
        
        // Admin has unlimited usage
        if (this.userProfile.role === USER_ROLES.ADMIN) return -1;
        
        const plan = this.userProfile.plan || USER_PLANS.FREE;
        const limits = PLAN_LIMITS[plan];
        
        if (!limits) return 0;
        
        const limit = limits[type];
        if (limit === -1) return -1; // Unlimited
        
        const used = this.userProfile.usage?.[type] || 0;
        return Math.max(0, limit - used);
    }

    // Get current user
    getCurrentUser() {
        return this.currentUser;
    }

    // Get current user profile
    getCurrentUserProfile() {
        return this.userProfile;
    }

    // Check if user is authenticated
    isAuthenticated() {
        return !!this.currentUser;
    }

    // Check if authentication is initialized
    isAuthInitialized() {
        return this.isInitialized;
    }
}

// Password strength checker
export const PasswordStrength = {
    check(password) {
        let score = 0;
        let feedback = [];

        if (password.length >= 8) score += 1;
        else feedback.push('At least 8 characters');

        if (/[a-z]/.test(password)) score += 1;
        else feedback.push('Lowercase letter');

        if (/[A-Z]/.test(password)) score += 1;
        else feedback.push('Uppercase letter');

        if (/[0-9]/.test(password)) score += 1;
        else feedback.push('Number');

        if (/[^A-Za-z0-9]/.test(password)) score += 1;
        else feedback.push('Special character');

        const strength = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'][score];
        const color = ['#ef4444', '#f59e0b', '#eab308', '#22c55e', '#16a34a'][score];

        return {
            score,
            strength,
            color,
            feedback,
            isStrong: score >= 3
        };
    }
};

// Initialize auth manager
const authManager = new AuthManager();

// Export auth manager instance and utilities
export default authManager;
export { PasswordStrength };

// Global auth utilities for easy access
window.AuthManager = authManager;
console.log('🔐 Authentication system initialized');