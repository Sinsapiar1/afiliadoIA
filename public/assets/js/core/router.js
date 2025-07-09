/**
 * Router System - Single Page Application Navigation
 * AffiliatePro - AI-Powered Affiliate Marketing Platform
 */

import authManager from './auth.js';

// Route definitions
const routes = {
    // Public routes
    'login': {
        path: '/login',
        component: 'auth',
        title: 'Sign In - AffiliatePro',
        requiresAuth: false,
        requiresGuest: true
    },
    'register': {
        path: '/register',
        component: 'auth',
        title: 'Sign Up - AffiliatePro',
        requiresAuth: false,
        requiresGuest: true
    },
    
    // Protected routes
    'dashboard': {
        path: '/dashboard',
        component: 'dashboard',
        title: 'Dashboard - AffiliatePro',
        requiresAuth: true,
        icon: 'dashboard',
        nav: true
    },
    'products': {
        path: '/products',
        component: 'products',
        title: 'Product Detector - AffiliatePro',
        requiresAuth: true,
        icon: 'star',
        nav: true,
        permission: 'product_detector'
    },
    'content': {
        path: '/content',
        component: 'content',
        title: 'Content Generator - AffiliatePro',
        requiresAuth: true,
        icon: 'file-text',
        nav: true,
        permission: 'content_generator'
    },
    'funnels': {
        path: '/funnels',
        component: 'funnels',
        title: 'Funnel Architect - AffiliatePro',
        requiresAuth: true,
        icon: 'layers',
        nav: true,
        permission: 'funnel_architect'
    },
    'calculator': {
        path: '/calculator',
        component: 'calculator',
        title: 'Profit Calculator - AffiliatePro',
        requiresAuth: true,
        icon: 'calculator',
        nav: true,
        permission: 'profit_calculator'
    },
    'avatar': {
        path: '/avatar',
        component: 'avatar',
        title: 'Avatar Generator - AffiliatePro',
        requiresAuth: true,
        icon: 'user',
        nav: true,
        permission: 'avatar_generator'
    },
    'profile': {
        path: '/profile',
        component: 'profile',
        title: 'Profile - AffiliatePro',
        requiresAuth: true,
        icon: 'user',
        nav: false
    },
    'admin': {
        path: '/admin',
        component: 'admin',
        title: 'Admin Panel - AffiliatePro',
        requiresAuth: true,
        requiresRole: 'admin',
        icon: 'shield',
        nav: false
    }
};

// Router class
class Router {
    constructor() {
        this.currentRoute = null;
        this.isInitialized = false;
        this.routeListeners = [];
        this.components = new Map();
        this.beforeRouteHooks = [];
        this.afterRouteHooks = [];
        
        // Bind methods
        this.handlePopState = this.handlePopState.bind(this);
        this.handleLinkClick = this.handleLinkClick.bind(this);
        
        // Initialize router
        this.init();
    }

    // Initialize router
    init() {
        // Listen for browser navigation
        window.addEventListener('popstate', this.handlePopState);
        
        // Listen for link clicks
        document.addEventListener('click', this.handleLinkClick);
        
        // Listen for auth state changes
        authManager.onAuthStateChange((user, profile) => {
            this.handleAuthStateChange(user, profile);
        });
        
        // Load initial route
        this.loadRoute(this.getCurrentPath());
        
        this.isInitialized = true;
        console.log('🧭 Router initialized');
    }

    // Handle browser back/forward
    handlePopState(event) {
        const path = this.getCurrentPath();
        this.loadRoute(path, false); // Don't update history
    }

    // Handle link clicks
    handleLinkClick(event) {
        const link = event.target.closest('a[href]');
        if (!link) return;

        const href = link.getAttribute('href');
        
        // Check if it's an internal route
        if (href && href.startsWith('#')) {
            event.preventDefault();
            const route = href.substring(1);
            this.navigate(route);
        }
        
        // Handle data-route attributes
        const route = link.getAttribute('data-route');
        if (route) {
            event.preventDefault();
            this.navigate(route);
        }
    }

    // Handle authentication state changes
    handleAuthStateChange(user, profile) {
        if (!this.isInitialized) return;
        
        const currentRoute = this.currentRoute;
        
        if (user) {
            // User is authenticated
            if (currentRoute?.requiresGuest) {
                // Redirect to dashboard if on guest-only page
                this.navigate('dashboard');
            } else if (currentRoute?.requiresRole && profile?.role !== currentRoute.requiresRole) {
                // Check role permissions
                this.navigate('dashboard');
            } else if (currentRoute?.permission && !authManager.hasPermission(currentRoute.permission)) {
                // Check feature permissions
                this.navigate('dashboard');
            }
        } else {
            // User is not authenticated
            if (currentRoute?.requiresAuth) {
                // Redirect to login if on protected page
                this.navigate('login');
            }
        }
    }

    // Get current path
    getCurrentPath() {
        const hash = window.location.hash;
        return hash ? hash.substring(1) : 'dashboard';
    }

    // Navigate to route
    navigate(routeName, updateHistory = true) {
        const route = routes[routeName];
        
        if (!route) {
            console.warn(`⚠️ Route not found: ${routeName}`);
            this.navigate('dashboard');
            return;
        }

        // Check authentication requirements
        if (route.requiresAuth && !authManager.isAuthenticated()) {
            this.navigate('login');
            return;
        }

        if (route.requiresGuest && authManager.isAuthenticated()) {
            this.navigate('dashboard');
            return;
        }

        // Check role requirements
        if (route.requiresRole) {
            const userProfile = authManager.getCurrentUserProfile();
            if (!userProfile || userProfile.role !== route.requiresRole) {
                this.navigate('dashboard');
                return;
            }
        }

        // Check permission requirements
        if (route.permission && !authManager.hasPermission(route.permission)) {
            console.warn(`⚠️ Insufficient permissions for: ${routeName}`);
            this.navigate('dashboard');
            return;
        }

        // Run before route hooks
        for (const hook of this.beforeRouteHooks) {
            const result = hook(routeName, route);
            if (result === false) {
                console.log('🚫 Navigation cancelled by before hook');
                return;
            }
        }

        this.loadRoute(routeName, updateHistory);
    }

    // Load route
    async loadRoute(routeName, updateHistory = true) {
        const route = routes[routeName];
        
        if (!route) {
            console.warn(`⚠️ Route not found: ${routeName}`);
            return;
        }

        try {
            // Update history if needed
            if (updateHistory && routeName !== this.getCurrentPath()) {
                window.history.pushState({ route: routeName }, '', `#${routeName}`);
            }

            // Update current route
            const previousRoute = this.currentRoute;
            this.currentRoute = route;

            // Update document title
            document.title = route.title;

            // Update UI state
            this.updateUIState(routeName, route);

            // Load component
            await this.loadComponent(route.component, routeName);

            // Run after route hooks
            for (const hook of this.afterRouteHooks) {
                hook(routeName, route, previousRoute);
            }

            // Notify route listeners
            this.notifyRouteListeners(routeName, route, previousRoute);

            console.log(`🧭 Navigated to: ${routeName}`);
        } catch (error) {
            console.error(`❌ Error loading route ${routeName}:`, error);
            
            // Fallback to dashboard on error
            if (routeName !== 'dashboard') {
                this.navigate('dashboard');
            }
        }
    }

    // Update UI state
    updateUIState(routeName, route) {
        // Show/hide main containers
        const authContainer = document.getElementById('auth-container');
        const appContainer = document.getElementById('app-container');
        
        if (route.component === 'auth') {
            authContainer?.classList.remove('hidden');
            appContainer?.classList.add('hidden');
        } else {
            authContainer?.classList.add('hidden');
            appContainer?.classList.remove('hidden');
        }

        // Update page title and subtitle
        this.updatePageHeader(routeName, route);

        // Update navigation state
        this.updateNavigation(routeName);

        // Update admin navigation visibility
        this.updateAdminNavigation();
    }

    // Update page header
    updatePageHeader(routeName, route) {
        const pageTitle = document.getElementById('page-title');
        const pageSubtitle = document.getElementById('page-subtitle');
        
        const titles = {
            dashboard: {
                title: 'Dashboard',
                subtitle: 'Welcome back! Here\'s what\'s happening with your affiliate business.'
            },
            products: {
                title: 'Product Detector',
                subtitle: 'Discover winning products with AI-powered analysis.'
            },
            content: {
                title: 'Content Generator',
                subtitle: 'Create viral content for all your marketing channels.'
            },
            funnels: {
                title: 'Funnel Architect',
                subtitle: 'Build high-converting sales funnels visually.'
            },
            calculator: {
                title: 'Profit Calculator',
                subtitle: 'Analyze and project your affiliate earnings.'
            },
            avatar: {
                title: 'Avatar Generator',
                subtitle: 'Create detailed customer personas for better targeting.'
            },
            profile: {
                title: 'Profile',
                subtitle: 'Manage your account settings and preferences.'
            },
            admin: {
                title: 'Admin Panel',
                subtitle: 'Manage users, analytics, and platform settings.'
            }
        };

        const pageInfo = titles[routeName] || { title: 'AffiliatePro', subtitle: '' };
        
        if (pageTitle) {
            pageTitle.textContent = pageInfo.title;
            pageTitle.setAttribute('data-i18n', `${routeName}.title`);
        }
        
        if (pageSubtitle) {
            pageSubtitle.textContent = pageInfo.subtitle;
            pageSubtitle.setAttribute('data-i18n', `${routeName}.subtitle`);
        }
    }

    // Update navigation active state
    updateNavigation(routeName) {
        // Remove active class from all nav links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });

        // Add active class to current route
        const activeLink = document.querySelector(`[data-route="${routeName}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
    }

    // Update admin navigation visibility
    updateAdminNavigation() {
        const adminNav = document.getElementById('admin-nav');
        const userProfile = authManager.getCurrentUserProfile();
        
        if (adminNav) {
            if (userProfile?.role === 'admin') {
                adminNav.style.display = 'block';
            } else {
                adminNav.style.display = 'none';
            }
        }
    }

    // Load component
    async loadComponent(componentName, routeName) {
        try {
            // Check if component is already loaded
            if (this.components.has(componentName)) {
                const component = this.components.get(componentName);
                if (component.render) {
                    await component.render(routeName);
                }
                return;
            }

            // Load component module
            let component;
            switch (componentName) {
                case 'auth':
                    component = await this.loadAuthComponent(routeName);
                    break;
                case 'dashboard':
                    component = await import('../modules/dashboard.js');
                    break;
                case 'products':
                    component = await import('../modules/product-detector.js');
                    break;
                case 'content':
                    component = await import('../modules/content-generator.js');
                    break;
                case 'funnels':
                    component = await import('../modules/funnel-architect.js');
                    break;
                case 'calculator':
                    component = await import('../modules/profit-calculator.js');
                    break;
                case 'avatar':
                    component = await import('../modules/avatar-generator.js');
                    break;
                case 'profile':
                    component = await import('../modules/profile.js');
                    break;
                case 'admin':
                    component = await import('../modules/admin-panel.js');
                    break;
                default:
                    throw new Error(`Unknown component: ${componentName}`);
            }

            // Cache component
            this.components.set(componentName, component);

            // Initialize component
            if (component.init) {
                await component.init();
            }

            // Render component
            if (component.render) {
                await component.render(routeName);
            }

        } catch (error) {
            console.error(`❌ Error loading component ${componentName}:`, error);
            
            // Show error message to user
            this.showErrorMessage(`Failed to load ${componentName} component`);
        }
    }

    // Load auth component (special case)
    async loadAuthComponent(routeName) {
        const authScreens = document.querySelectorAll('.auth-screen');
        authScreens.forEach(screen => screen.classList.remove('active'));

        const targetScreen = routeName === 'register' ? 'register-screen' : 'login-screen';
        const screen = document.getElementById(targetScreen);
        if (screen) {
            screen.classList.add('active');
        }

        return {
            render: (route) => {
                // Auth component rendering is handled by CSS classes
                console.log(`🔐 Auth component rendered: ${route}`);
            }
        };
    }

    // Show error message
    showErrorMessage(message) {
        const pageContent = document.getElementById('page-content');
        if (pageContent) {
            pageContent.innerHTML = `
                <div class="error-state">
                    <div class="error-icon">⚠️</div>
                    <h2>Something went wrong</h2>
                    <p>${message}</p>
                    <button class="btn btn-primary" onclick="location.reload()">
                        Reload Page
                    </button>
                </div>
            `;
        }
    }

    // Add route listener
    onRouteChange(callback) {
        this.routeListeners.push(callback);
        
        // Return unsubscribe function
        return () => {
            const index = this.routeListeners.indexOf(callback);
            if (index > -1) {
                this.routeListeners.splice(index, 1);
            }
        };
    }

    // Notify route listeners
    notifyRouteListeners(routeName, route, previousRoute) {
        this.routeListeners.forEach(callback => {
            try {
                callback(routeName, route, previousRoute);
            } catch (error) {
                console.error('❌ Route listener error:', error);
            }
        });
    }

    // Add before route hook
    beforeEach(hook) {
        this.beforeRouteHooks.push(hook);
    }

    // Add after route hook
    afterEach(hook) {
        this.afterRouteHooks.push(hook);
    }

    // Get current route
    getCurrentRoute() {
        return this.currentRoute;
    }

    // Get all routes
    getRoutes() {
        return routes;
    }

    // Check if route exists
    hasRoute(routeName) {
        return routes.hasOwnProperty(routeName);
    }

    // Get route by name
    getRoute(routeName) {
        return routes[routeName];
    }

    // Generate navigation items
    getNavigationItems() {
        return Object.entries(routes)
            .filter(([name, route]) => route.nav)
            .map(([name, route]) => ({
                name,
                ...route,
                active: this.currentRoute?.component === route.component
            }));
    }
}

// Initialize router
const router = new Router();

// Global router utilities
window.Router = router;

// Export router instance
export default router;

console.log('🧭 Router system initialized');