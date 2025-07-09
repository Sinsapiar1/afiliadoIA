/**
 * Main Application Entry Point
 * AffiliatePro - AI-Powered Affiliate Marketing Platform
 */

import './firebase-config.js';
import authManager from './auth.js';
import router from './router.js';
import uiComponents from '../components/ui-components.js';

// Application state management
class Application {
    constructor() {
        this.isInitialized = false;
        this.currentUser = null;
        this.userProfile = null;
        this.appState = {
            isLoading: true,
            isOnline: navigator.onLine,
            theme: 'light',
            language: 'en',
            notifications: [],
            usage: {}
        };

        // Event listeners
        this.eventListeners = new Map();
        
        // Initialize application
        this.init();
    }

    // Initialize application
    async init() {
        try {
            console.log('🚀 Initializing AffiliatePro...');
            
            // Show loading screen
            this.showLoadingScreen();
            
            // Initialize core systems
            await this.initializeCore();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Initialize UI interactions
            this.initializeUI();
            
            // Setup auth state monitoring
            this.setupAuthStateMonitoring();
            
            // Setup connection monitoring
            this.setupConnectionMonitoring();
            
            // Setup performance monitoring
            this.setupPerformanceMonitoring();
            
            // Initialize notification system
            this.initializeNotifications();
            
            // Load user preferences
            await this.loadUserPreferences();
            
            // Mark as initialized
            this.isInitialized = true;
            
            // Hide loading screen
            setTimeout(() => {
                this.hideLoadingScreen();
            }, 1000);
            
            console.log('✅ AffiliatePro initialized successfully');
            
        } catch (error) {
            console.error('❌ Failed to initialize application:', error);
            this.handleInitializationError(error);
        }
    }

    // Initialize core systems
    async initializeCore() {
        // Core systems are already initialized via imports
        // Additional core initialization can be added here
        
        // Initialize internationalization if available
        if (window.I18n) {
            await window.I18n.init();
        }
        
        // Initialize analytics if available
        if (window.Analytics) {
            await window.Analytics.init();
        }
    }

    // Setup main event listeners
    setupEventListeners() {
        // Sidebar toggle
        const sidebarToggle = document.getElementById('sidebar-toggle');
        const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
        
        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', () => this.toggleSidebar());
        }
        
        if (mobileMenuToggle) {
            mobileMenuToggle.addEventListener('click', () => this.toggleMobileSidebar());
        }

        // Auth form handlers
        this.setupAuthForms();
        
        // Logout handler
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleLogout();
            });
        }

        // Navigation handlers
        this.setupNavigationHandlers();
        
        // Global keyboard shortcuts
        this.setupKeyboardShortcuts();
        
        // Window resize handler
        window.addEventListener('resize', this.debounce(() => {
            this.handleWindowResize();
        }, 250));
        
        // Before unload handler
        window.addEventListener('beforeunload', (e) => {
            this.handleBeforeUnload(e);
        });
    }

    // Setup authentication forms
    setupAuthForms() {
        // Login form
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Register form  
        const registerForm = document.getElementById('register-form');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        }

        // Show register screen
        const showRegister = document.getElementById('show-register');
        if (showRegister) {
            showRegister.addEventListener('click', (e) => {
                e.preventDefault();
                router.navigate('register');
            });
        }

        // Show login screen
        const showLogin = document.getElementById('show-login');
        if (showLogin) {
            showLogin.addEventListener('click', (e) => {
                e.preventDefault();
                router.navigate('login');
            });
        }

        // Forgot password handler
        const forgotPassword = document.getElementById('forgot-password');
        if (forgotPassword) {
            forgotPassword.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleForgotPassword();
            });
        }
    }

    // Setup navigation handlers
    setupNavigationHandlers() {
        // Handle upgrade card clicks
        const upgradeCard = document.getElementById('upgrade-card');
        if (upgradeCard) {
            upgradeCard.addEventListener('click', () => {
                this.showUpgradeModal();
            });
        }

        // Handle notification clicks
        const notificationToggle = document.getElementById('notifications-toggle');
        if (notificationToggle) {
            notificationToggle.addEventListener('click', () => {
                this.loadNotifications();
            });
        }
    }

    // Setup keyboard shortcuts
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + K for search
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                this.openGlobalSearch();
            }
            
            // Escape to close modals/dropdowns
            if (e.key === 'Escape') {
                uiComponents.closeAllDropdowns();
                uiComponents.closeModal();
            }
            
            // Alt + number for quick navigation
            if (e.altKey && /^[1-9]$/.test(e.key)) {
                e.preventDefault();
                this.handleQuickNavigation(parseInt(e.key));
            }
        });
    }

    // Initialize UI interactions
    initializeUI() {
        // Initialize tooltips for elements with data-tooltip
        document.querySelectorAll('[data-tooltip]').forEach(element => {
            // Tooltips are handled by ui-components.js
        });

        // Initialize auto-resize textareas
        document.querySelectorAll('textarea[data-auto-resize]').forEach(textarea => {
            this.setupAutoResizeTextarea(textarea);
        });

        // Initialize copy buttons
        document.querySelectorAll('[data-copy]').forEach(button => {
            button.addEventListener('click', () => {
                const text = button.getAttribute('data-copy');
                uiComponents.copyToClipboard(text);
            });
        });
    }

    // Setup auth state monitoring
    setupAuthStateMonitoring() {
        authManager.onAuthStateChange((user, profile) => {
            this.currentUser = user;
            this.userProfile = profile;
            
            if (user && profile) {
                this.onUserAuthenticated(user, profile);
            } else {
                this.onUserSignedOut();
            }
        });
    }

    // Setup connection monitoring
    setupConnectionMonitoring() {
        window.addEventListener('online', () => {
            this.appState.isOnline = true;
            this.onConnectionRestored();
        });

        window.addEventListener('offline', () => {
            this.appState.isOnline = false;
            this.onConnectionLost();
        });
    }

    // Setup performance monitoring
    setupPerformanceMonitoring() {
        // Monitor slow operations
        const observer = new PerformanceObserver((list) => {
            list.getEntries().forEach((entry) => {
                if (entry.duration > 100) {
                    console.warn(`🐌 Slow operation: ${entry.name} took ${entry.duration.toFixed(2)}ms`);
                }
            });
        });

        if ('observe' in observer) {
            observer.observe({ entryTypes: ['measure', 'navigation'] });
        }
    }

    // Initialize notification system
    initializeNotifications() {
        // Request notification permission
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission().then(permission => {
                console.log(`📱 Notification permission: ${permission}`);
            });
        }

        // Setup service worker for notifications
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('📱 Service Worker registered');
                })
                .catch(error => {
                    console.log('📱 Service Worker registration failed:', error);
                });
        }
    }

    // Load user preferences
    async loadUserPreferences() {
        // Load theme preference
        const savedTheme = localStorage.getItem('theme') || 'light';
        this.appState.theme = savedTheme;
        uiComponents.setTheme(savedTheme);

        // Load language preference
        const savedLanguage = localStorage.getItem('language') || 'en';
        this.appState.language = savedLanguage;
        uiComponents.setLanguage(savedLanguage);
    }

    // Handle user authentication
    onUserAuthenticated(user, profile) {
        console.log('✅ User authenticated:', user.email);
        
        // Update UI with user info
        this.updateUserInterface(user, profile);
        
        // Load user usage data
        this.loadUserUsage(profile);
        
        // Check for pending notifications
        this.loadNotifications();
        
        // Update upgrade card visibility
        this.updateUpgradeCardVisibility(profile);
        
        // Track login event
        if (window.Analytics) {
            window.Analytics.track('user_login', {
                plan: profile.plan,
                role: profile.role
            });
        }
    }

    // Handle user sign out
    onUserSignedOut() {
        console.log('ℹ️ User signed out');
        
        // Clear user-specific data
        this.clearUserData();
        
        // Track logout event
        if (window.Analytics) {
            window.Analytics.track('user_logout');
        }
    }

    // Update user interface
    updateUserInterface(user, profile) {
        // Update user avatar and name
        const userAvatar = document.getElementById('user-avatar');
        const userName = document.getElementById('user-name');
        const dropdownUserName = document.getElementById('dropdown-user-name');
        const dropdownUserEmail = document.getElementById('dropdown-user-email');
        const dropdownUserPlan = document.getElementById('dropdown-user-plan');

        if (userAvatar) {
            userAvatar.src = user.photoURL || './assets/images/icons/default-avatar.svg';
        }

        if (userName) {
            userName.textContent = profile.fullName || user.displayName || 'User';
        }

        if (dropdownUserName) {
            dropdownUserName.textContent = profile.fullName || user.displayName || 'User';
        }

        if (dropdownUserEmail) {
            dropdownUserEmail.textContent = user.email;
        }

        if (dropdownUserPlan) {
            dropdownUserPlan.textContent = `${profile.plan.charAt(0).toUpperCase() + profile.plan.slice(1)} Plan`;
            dropdownUserPlan.className = `user-plan plan-${profile.plan}`;
        }
    }

    // Load user usage data
    loadUserUsage(profile) {
        if (profile?.usage) {
            this.appState.usage = profile.usage;
            this.updateUsageIndicators();
        }
    }

    // Update usage indicators
    updateUsageIndicators() {
        // Update usage indicators in the UI
        // This will be implemented per module
    }

    // Update upgrade card visibility
    updateUpgradeCardVisibility(profile) {
        const upgradeCard = document.getElementById('upgrade-card');
        if (!upgradeCard) return;

        // Hide upgrade card for paid plans
        if (profile.plan !== 'free') {
            upgradeCard.style.display = 'none';
        } else {
            upgradeCard.style.display = 'block';
        }
    }

    // Clear user-specific data
    clearUserData() {
        this.appState.usage = {};
        this.appState.notifications = [];
        
        // Clear any cached data
        // This will be implemented per module
    }

    // Handle login form submission
    async handleLogin(event) {
        event.preventDefault();
        
        const form = event.target;
        const formData = new FormData(form);
        const email = formData.get('email');
        const password = formData.get('password');
        const remember = formData.get('remember');
        
        // Show loading state
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        uiComponents.showLoading(submitBtn, 'Signing in...');
        
        try {
            const result = await authManager.signIn(email, password, remember);
            
            if (result.success) {
                uiComponents.showToast({
                    type: 'success',
                    title: 'Welcome back!',
                    message: result.message
                });
                
                // Navigation will be handled by auth state change
            } else {
                this.showAuthError(result.message);
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showAuthError('An unexpected error occurred. Please try again.');
        } finally {
            uiComponents.hideLoading(submitBtn);
            submitBtn.textContent = originalText;
        }
    }

    // Handle register form submission
    async handleRegister(event) {
        event.preventDefault();
        
        const form = event.target;
        const formData = new FormData(form);
        const name = formData.get('name');
        const email = formData.get('email');
        const password = formData.get('password');
        const terms = formData.get('terms');
        
        if (!terms) {
            this.showAuthError('Please accept the Terms of Service and Privacy Policy.');
            return;
        }
        
        // Show loading state
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        uiComponents.showLoading(submitBtn, 'Creating account...');
        
        try {
            const result = await authManager.signUp(email, password, name);
            
            if (result.success) {
                uiComponents.showToast({
                    type: 'success',
                    title: 'Account created!',
                    message: result.message,
                    duration: 8000
                });
                
                // Switch to login screen
                router.navigate('login');
            } else {
                this.showAuthError(result.message);
            }
        } catch (error) {
            console.error('Register error:', error);
            this.showAuthError('An unexpected error occurred. Please try again.');
        } finally {
            uiComponents.hideLoading(submitBtn);
            submitBtn.textContent = originalText;
        }
    }

    // Handle logout
    async handleLogout() {
        try {
            const result = await authManager.signOut();
            
            if (result.success) {
                uiComponents.showToast({
                    type: 'success',
                    message: result.message
                });
            }
        } catch (error) {
            console.error('Logout error:', error);
            uiComponents.showToast({
                type: 'error',
                message: 'Error signing out. Please try again.'
            });
        }
    }

    // Handle forgot password
    async handleForgotPassword() {
        const email = prompt('Enter your email address:');
        if (!email) return;
        
        try {
            const result = await authManager.resetPassword(email);
            
            if (result.success) {
                uiComponents.showToast({
                    type: 'success',
                    title: 'Reset email sent!',
                    message: result.message
                });
            } else {
                this.showAuthError(result.message);
            }
        } catch (error) {
            console.error('Password reset error:', error);
            this.showAuthError('Error sending reset email. Please try again.');
        }
    }

    // Show authentication error
    showAuthError(message) {
        const errorElement = document.getElementById('auth-error');
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.remove('hidden');
            
            // Hide error after 5 seconds
            setTimeout(() => {
                errorElement.classList.add('hidden');
            }, 5000);
        }
    }

    // Toggle sidebar
    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
            sidebar.classList.toggle('collapsed');
        }
    }

    // Toggle mobile sidebar
    toggleMobileSidebar() {
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
            sidebar.classList.toggle('open');
        }
    }

    // Handle window resize
    handleWindowResize() {
        // Close mobile sidebar on desktop
        if (window.innerWidth > 1024) {
            const sidebar = document.getElementById('sidebar');
            if (sidebar) {
                sidebar.classList.remove('open');
            }
        }
    }

    // Handle before unload
    handleBeforeUnload(event) {
        // Check if there are unsaved changes
        if (this.hasUnsavedChanges()) {
            event.preventDefault();
            event.returnValue = '';
        }
    }

    // Check for unsaved changes
    hasUnsavedChanges() {
        // This will be implemented per module
        return false;
    }

    // Show loading screen
    showLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.classList.remove('hidden');
        }
    }

    // Hide loading screen
    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.classList.add('hidden');
        }
    }

    // Handle initialization error
    handleInitializationError(error) {
        console.error('❌ Application initialization failed:', error);
        
        // Show error message to user
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.innerHTML = `
                <div class="error-state">
                    <div class="error-icon">⚠️</div>
                    <h2>Failed to load AffiliatePro</h2>
                    <p>Please check your internet connection and try again.</p>
                    <button class="btn btn-primary" onclick="location.reload()">
                        Retry
                    </button>
                </div>
            `;
        }
    }

    // Connection lost handler
    onConnectionLost() {
        uiComponents.showToast({
            type: 'warning',
            title: 'Connection Lost',
            message: 'You are now offline. Some features may be limited.',
            duration: 0
        });
    }

    // Connection restored handler
    onConnectionRestored() {
        uiComponents.showToast({
            type: 'success',
            title: 'Connection Restored',
            message: 'You are back online!',
            duration: 3000
        });
    }

    // Load notifications
    async loadNotifications() {
        // This will be implemented with real notification loading
        const mockNotifications = [
            {
                id: '1',
                title: 'Welcome to AffiliatePro!',
                message: 'Get started by detecting your first winning product.',
                type: 'info',
                unread: true,
                timestamp: new Date()
            },
            {
                id: '2',
                title: 'New Feature: AI Content Generator',
                message: 'Create viral content for TikTok, Instagram, and more!',
                type: 'feature',
                unread: true,
                timestamp: new Date(Date.now() - 3600000)
            }
        ];

        this.updateNotificationBadge(mockNotifications.filter(n => n.unread).length);
        this.renderNotifications(mockNotifications);
    }

    // Update notification badge
    updateNotificationBadge(count) {
        const badge = document.getElementById('notification-count');
        if (badge) {
            if (count > 0) {
                badge.textContent = count > 99 ? '99+' : count.toString();
                badge.style.display = 'flex';
            } else {
                badge.style.display = 'none';
            }
        }
    }

    // Render notifications
    renderNotifications(notifications) {
        const container = document.getElementById('notification-list');
        if (!container) return;

        container.innerHTML = notifications.map(notification => `
            <div class="notification-item ${notification.unread ? 'unread' : ''}">
                <div class="notification-title">${notification.title}</div>
                <div class="notification-message">${notification.message}</div>
                <div class="notification-time">${uiComponents.formatDate(notification.timestamp)}</div>
            </div>
        `).join('');
    }

    // Show upgrade modal
    showUpgradeModal() {
        uiComponents.createModal({
            id: 'upgrade-modal',
            title: 'Upgrade Your Plan',
            content: `
                <div class="upgrade-modal-content">
                    <h3>Unlock Premium Features</h3>
                    <ul>
                        <li>✅ Unlimited product detections</li>
                        <li>✅ AI-powered content generation</li>
                        <li>✅ Advanced funnel builder</li>
                        <li>✅ Priority support</li>
                    </ul>
                    <div class="pricing-info">
                        <span class="price">$29/month</span>
                        <span class="price-subtitle">Cancel anytime</span>
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
                    onclick: 'app.handleUpgrade()'
                }
            ]
        });
    }

    // Handle upgrade
    handleUpgrade() {
        // This will integrate with Stripe
        uiComponents.closeModal();
        uiComponents.showToast({
            type: 'info',
            message: 'Stripe integration coming soon!'
        });
    }

    // Open global search
    openGlobalSearch() {
        // This will be implemented as a global search feature
        console.log('🔍 Global search opened');
    }

    // Handle quick navigation
    handleQuickNavigation(number) {
        const routes = ['dashboard', 'products', 'content', 'funnels', 'calculator', 'avatar', 'profile'];
        const route = routes[number - 1];
        if (route) {
            router.navigate(route);
        }
    }

    // Setup auto-resize textarea
    setupAutoResizeTextarea(textarea) {
        const resize = () => {
            textarea.style.height = 'auto';
            textarea.style.height = textarea.scrollHeight + 'px';
        };

        textarea.addEventListener('input', resize);
        resize(); // Initial resize
    }

    // Debounce utility
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Get application state
    getState() {
        return { ...this.appState };
    }

    // Update application state
    setState(updates) {
        this.appState = { ...this.appState, ...updates };
    }
}

// Initialize application
const app = new Application();

// Global access
window.app = app;

// Export application instance
export default app;

console.log('🚀 AffiliatePro application started');