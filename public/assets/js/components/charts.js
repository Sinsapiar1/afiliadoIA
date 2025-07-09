/**
 * Dashboard Module
 * AffiliatePro - AI-Powered Affiliate Marketing Platform
 */

import { db, COLLECTIONS } from '../core/firebase-config.js';
import authManager from '../core/auth.js';
import uiComponents from '../components/ui-components.js';
import {
    doc,
    collection,
    query,
    where,
    orderBy,
    limit,
    getDocs,
    onSnapshot
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Dashboard state
let dashboardState = {
    stats: {
        totalRevenue: 0,
        productsDetected: 0,
        contentGenerated: 0,
        activeFunnels: 0,
        conversionRate: 0,
        clickThroughRate: 0
    },
    recentActivity: [],
    topProducts: [],
    quickActions: [],
    notifications: [],
    isLoading: true
};

// Chart instances
let revenueChart = null;
let conversionChart = null;

// Dashboard module
const Dashboard = {
    // Initialize dashboard
    async init() {
        console.log('📊 Initializing Dashboard...');
        
        // Setup real-time listeners
        this.setupRealtimeListeners();
        
        // Load initial data
        await this.loadDashboardData();
        
        console.log('✅ Dashboard initialized');
    },

    // Render dashboard
    async render() {
        const pageContent = document.getElementById('page-content');
        if (!pageContent) return;

        // Show loading state
        pageContent.innerHTML = this.getLoadingHTML();
        
        // Load and render dashboard content
        await this.loadDashboardData();
        pageContent.innerHTML = this.getDashboardHTML();
        
        // Initialize interactive elements
        this.initializeInteractions();
        
        // Load charts
        this.initializeCharts();
        
        // Start periodic updates
        this.startPeriodicUpdates();
    },

    // Load dashboard data
    async loadDashboardData() {
        try {
            dashboardState.isLoading = true;
            
            const user = authManager.getCurrentUser();
            const userProfile = authManager.getCurrentUserProfile();
            
            if (!user || !userProfile) {
                throw new Error('User not authenticated');
            }

            // Load data in parallel
            const [stats, recentActivity, topProducts] = await Promise.all([
                this.loadUserStats(user.uid),
                this.loadRecentActivity(user.uid),
                this.loadTopProducts(user.uid)
            ]);

            // Update state
            dashboardState.stats = stats;
            dashboardState.recentActivity = recentActivity;
            dashboardState.topProducts = topProducts;
            dashboardState.quickActions = this.getQuickActions(userProfile);
            dashboardState.isLoading = false;

        } catch (error) {
            console.error('❌ Error loading dashboard data:', error);
            dashboardState.isLoading = false;
            this.showErrorState();
        }
    },

    // Load user statistics
    async loadUserStats(userId) {
        try {
            // In a real implementation, this would come from Firestore aggregations
            // For now, we'll use mock data that looks realistic
            
            const userProfile = authManager.getCurrentUserProfile();
            const plan = userProfile?.plan || 'free';
            
            // Generate realistic stats based on user plan and usage
            const usage = userProfile?.usage || {};
            const createdAt = userProfile?.createdAt?.toDate?.() || new Date();
            const daysSinceCreation = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
            
            // Calculate stats based on usage and time
            const baseRevenue = plan === 'free' ? 0 : (plan === 'pro' ? 1250 : (plan === 'agency' ? 5800 : 12500));
            const randomMultiplier = 0.8 + (Math.random() * 0.4); // 0.8 to 1.2
            
            return {
                totalRevenue: baseRevenue * randomMultiplier,
                productsDetected: usage.productDetections || 0,
                contentGenerated: usage.contentGenerations || 0,
                activeFunnels: usage.funnels || 0,
                conversionRate: 2.4 + (Math.random() * 1.2), // 2.4% to 3.6%
                clickThroughRate: 3.8 + (Math.random() * 1.4), // 3.8% to 5.2%
                revenueChange: -5 + (Math.random() * 30), // -5% to +25%
                productsChange: Math.random() * 20, // 0% to +20%
                contentChange: Math.random() * 25, // 0% to +25%
                funnelsChange: -2 + (Math.random() * 12) // -2% to +10%
            };
            
        } catch (error) {
            console.error('❌ Error loading user stats:', error);
            return {
                totalRevenue: 0,
                productsDetected: 0,
                contentGenerated: 0,
                activeFunnels: 0,
                conversionRate: 0,
                clickThroughRate: 0
            };
        }
    },

    // Load recent activity
    async loadRecentActivity(userId) {
        try {
            // In a real implementation, this would query multiple collections
            // For now, we'll return mock data
            
            const activities = [
                {
                    id: '1',
                    type: 'product_detected',
                    title: 'New winning product detected',
                    description: 'Wireless Bluetooth Earbuds - High conversion potential',
                    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
                    icon: '🎯',
                    link: '#products'
                },
                {
                    id: '2',
                    type: 'content_generated',
                    title: 'TikTok content generated',
                    description: 'Viral hook for fitness product promotion',
                    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
                    icon: '📝',
                    link: '#content'
                },
                {
                    id: '3',
                    type: 'funnel_created',
                    title: 'Sales funnel created',
                    description: 'Complete funnel for skincare product',
                    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
                    icon: '🎯',
                    link: '#funnels'
                },
                {
                    id: '4',
                    type: 'avatar_generated',
                    title: 'Customer avatar created',
                    description: 'Detailed persona for fitness niche',
                    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
                    icon: '👤',
                    link: '#avatar'
                }
            ];

            return activities.slice(0, 5); // Return top 5 activities
            
        } catch (error) {
            console.error('❌ Error loading recent activity:', error);
            return [];
        }
    },

    // Load top products
    async loadTopProducts(userId) {
        try {
            // Mock top performing products
            const products = [
                {
                    id: '1',
                    name: 'Wireless Bluetooth Earbuds',
                    category: 'Electronics',
                    price: 49.99,
                    commission: 15.2,
                    conversionRate: 4.2,
                    revenue: 890.50,
                    trend: 'up',
                    change: 12.5
                },
                {
                    id: '2',
                    name: 'Fitness Resistance Bands',
                    category: 'Health & Fitness',
                    price: 24.99,
                    commission: 8.75,
                    conversionRate: 3.8,
                    revenue: 654.30,
                    trend: 'up',
                    change: 8.3
                },
                {
                    id: '3',
                    name: 'LED Desk Lamp',
                    category: 'Home & Office',
                    price: 34.99,
                    commission: 10.50,
                    conversionRate: 2.9,
                    revenue: 432.80,
                    trend: 'down',
                    change: -3.2
                },
                {
                    id: '4',
                    name: 'Skincare Set',
                    category: 'Beauty',
                    price: 79.99,
                    commission: 24.00,
                    conversionRate: 2.1,
                    revenue: 380.40,
                    trend: 'up',
                    change: 18.7
                }
            ];

            return products;
            
        } catch (error) {
            console.error('❌ Error loading top products:', error);
            return [];
        }
    },

    // Get quick actions based on user plan
    getQuickActions(userProfile) {
        const plan = userProfile?.plan || 'free';
        
        const baseActions = [
            {
                title: 'Detect Products',
                description: 'Find winning products with AI',
                icon: '🔍',
                route: 'products',
                color: 'primary'
            },
            {
                title: 'Generate Content',
                description: 'Create viral marketing content',
                icon: '📝',
                route: 'content',
                color: 'success'
            }
        ];

        if (plan !== 'free') {
            baseActions.push(
                {
                    title: 'Build Funnel',
                    description: 'Create conversion funnels',
                    icon: '🎯',
                    route: 'funnels',
                    color: 'warning'
                },
                {
                    title: 'Calculate Profits',
                    description: 'Analyze potential earnings',
                    icon: '💰',
                    route: 'calculator',
                    color: 'info'
                }
            );
        }

        return baseActions;
    },

    // Setup real-time listeners
    setupRealtimeListeners() {
        const user = authManager.getCurrentUser();
        if (!user) return;

        // Listen for usage updates
        const userRef = doc(db, COLLECTIONS.USERS, user.uid);
        const unsubscribe = onSnapshot(userRef, (doc) => {
            if (doc.exists()) {
                const userData = doc.data();
                if (userData.usage) {
                    this.updateUsageStats(userData.usage);
                }
            }
        });

        // Store unsubscribe function for cleanup
        this.unsubscribeListeners = [unsubscribe];
    },

    // Update usage statistics
    updateUsageStats(usage) {
        dashboardState.stats.productsDetected = usage.productDetections || 0;
        dashboardState.stats.contentGenerated = usage.contentGenerations || 0;
        dashboardState.stats.activeFunnels = usage.funnels || 0;
        
        // Update UI if dashboard is visible
        this.updateStatsCards();
    },

    // Update stats cards in UI
    updateStatsCards() {
        const statsCards = document.querySelectorAll('.stat-card-value');
        if (statsCards.length === 0) return;

        const stats = dashboardState.stats;
        const values = [
            uiComponents.formatCurrency(stats.totalRevenue),
            uiComponents.formatNumber(stats.productsDetected),
            uiComponents.formatNumber(stats.contentGenerated),
            uiComponents.formatNumber(stats.activeFunnels)
        ];

        statsCards.forEach((card, index) => {
            if (values[index] !== undefined) {
                card.textContent = values[index];
            }
        });
    },

    // Get loading HTML
    getLoadingHTML() {
        return `
            <div class="dashboard-loading">
                <div class="stats-grid">
                    ${Array(4).fill().map(() => `
                        <div class="stat-card">
                            <div class="skeleton skeleton-card"></div>
                        </div>
                    `).join('')}
                </div>
                <div class="dashboard-content">
                    <div class="dashboard-grid">
                        <div class="dashboard-section">
                            <div class="skeleton skeleton-title"></div>
                            <div class="skeleton skeleton-card" style="height: 300px;"></div>
                        </div>
                        <div class="dashboard-section">
                            <div class="skeleton skeleton-title"></div>
                            <div class="skeleton skeleton-card" style="height: 300px;"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    // Get main dashboard HTML
    getDashboardHTML() {
        const stats = dashboardState.stats;
        const userProfile = authManager.getCurrentUserProfile();
        const userName = userProfile?.fullName || 'there';

        return `
            <div class="dashboard">
                <!-- Welcome Section -->
                <div class="welcome-section">
                    <div class="welcome-content">
                        <h1>Welcome back, ${userName}! 👋</h1>
                        <p>Here's what's happening with your affiliate business today.</p>
                    </div>
                    <div class="welcome-actions">
                        <button class="btn btn-primary" onclick="router.navigate('products')">
                            🔍 Detect Products
                        </button>
                        <button class="btn btn-outline" onclick="router.navigate('content')">
                            📝 Generate Content
                        </button>
                    </div>
                </div>

                <!-- Stats Grid -->
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-card-header">
                            <h3 class="stat-card-title">Total Revenue</h3>
                            <div class="stat-card-icon" style="background: var(--success-100); color: var(--success-600);">
                                💰
                            </div>
                        </div>
                        <div class="stat-card-value">${uiComponents.formatCurrency(stats.totalRevenue)}</div>
                        <div class="stat-card-change ${stats.revenueChange >= 0 ? 'positive' : 'negative'}">
                            ${stats.revenueChange >= 0 ? '↗' : '↘'} ${Math.abs(stats.revenueChange).toFixed(1)}% vs last month
                        </div>
                    </div>

                    <div class="stat-card">
                        <div class="stat-card-header">
                            <h3 class="stat-card-title">Products Detected</h3>
                            <div class="stat-card-icon" style="background: var(--primary-100); color: var(--primary-600);">
                                🎯
                            </div>
                        </div>
                        <div class="stat-card-value">${uiComponents.formatNumber(stats.productsDetected)}</div>
                        <div class="stat-card-change positive">
                            ↗ ${stats.productsChange.toFixed(1)}% vs last month
                        </div>
                    </div>

                    <div class="stat-card">
                        <div class="stat-card-header">
                            <h3 class="stat-card-title">Content Generated</h3>
                            <div class="stat-card-icon" style="background: var(--warning-100); color: var(--warning-600);">
                                📝
                            </div>
                        </div>
                        <div class="stat-card-value">${uiComponents.formatNumber(stats.contentGenerated)}</div>
                        <div class="stat-card-change positive">
                            ↗ ${stats.contentChange.toFixed(1)}% vs last month
                        </div>
                    </div>

                    <div class="stat-card">
                        <div class="stat-card-header">
                            <h3 class="stat-card-title">Active Funnels</h3>
                            <div class="stat-card-icon" style="background: var(--secondary-100); color: var(--secondary-600);">
                                🔄
                            </div>
                        </div>
                        <div class="stat-card-value">${uiComponents.formatNumber(stats.activeFunnels)}</div>
                        <div class="stat-card-change ${stats.funnelsChange >= 0 ? 'positive' : 'negative'}">
                            ${stats.funnelsChange >= 0 ? '↗' : '↘'} ${Math.abs(stats.funnelsChange).toFixed(1)}% vs last month
                        </div>
                    </div>
                </div>

                <!-- Main Dashboard Grid -->
                <div class="dashboard-grid">
                    <!-- Revenue Chart -->
                    <div class="dashboard-section">
                        <div class="card">
                            <div class="card-header">
                                <h3 class="card-title">Revenue Overview</h3>
                                <div class="card-actions">
                                    <select class="form-select" id="revenue-period">
                                        <option value="7d">Last 7 days</option>
                                        <option value="30d" selected>Last 30 days</option>
                                        <option value="90d">Last 90 days</option>
                                    </select>
                                </div>
                            </div>
                            <div class="card-body">
                                <canvas id="revenue-chart" width="400" height="200"></canvas>
                            </div>
                        </div>
                    </div>

                    <!-- Quick Actions -->
                    <div class="dashboard-section">
                        <div class="card">
                            <div class="card-header">
                                <h3 class="card-title">Quick Actions</h3>
                            </div>
                            <div class="card-body">
                                <div class="quick-actions-grid">
                                    ${dashboardState.quickActions.map(action => `
                                        <div class="quick-action-card" onclick="router.navigate('${action.route}')">
                                            <div class="quick-action-icon">${action.icon}</div>
                                            <div class="quick-action-content">
                                                <h4>${action.title}</h4>
                                                <p>${action.description}</p>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Recent Activity -->
                    <div class="dashboard-section">
                        <div class="card">
                            <div class="card-header">
                                <h3 class="card-title">Recent Activity</h3>
                                <a href="#" class="btn-text">View all</a>
                            </div>
                            <div class="card-body">
                                <div class="activity-list">
                                    ${dashboardState.recentActivity.length > 0 ? 
                                        dashboardState.recentActivity.map(activity => `
                                            <div class="activity-item" onclick="router.navigate('${activity.link.substring(1)}')">
                                                <div class="activity-icon">${activity.icon}</div>
                                                <div class="activity-content">
                                                    <h4>${activity.title}</h4>
                                                    <p>${activity.description}</p>
                                                    <span class="activity-time">${this.formatTimeAgo(activity.timestamp)}</span>
                                                </div>
                                            </div>
                                        `).join('') : 
                                        '<div class="empty-state">No recent activity</div>'
                                    }
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Top Products -->
                    <div class="dashboard-section">
                        <div class="card">
                            <div class="card-header">
                                <h3 class="card-title">Top Performing Products</h3>
                                <a href="#products" class="btn-text">View all</a>
                            </div>
                            <div class="card-body">
                                <div class="products-table">
                                    ${dashboardState.topProducts.length > 0 ? `
                                        <div class="table-header">
                                            <div>Product</div>
                                            <div>Revenue</div>
                                            <div>CVR</div>
                                            <div>Trend</div>
                                        </div>
                                        ${dashboardState.topProducts.map(product => `
                                            <div class="table-row">
                                                <div class="product-info">
                                                    <div class="product-name">${product.name}</div>
                                                    <div class="product-category">${product.category}</div>
                                                </div>
                                                <div class="product-revenue">
                                                    ${uiComponents.formatCurrency(product.revenue)}
                                                </div>
                                                <div class="product-cvr">
                                                    ${product.conversionRate}%
                                                </div>
                                                <div class="product-trend ${product.trend}">
                                                    ${product.trend === 'up' ? '↗' : '↘'} ${Math.abs(product.change)}%
                                                </div>
                                            </div>
                                        `).join('')}
                                    ` : '<div class="empty-state">No products detected yet</div>'}
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Performance Metrics -->
                    <div class="dashboard-section full-width">
                        <div class="card">
                            <div class="card-header">
                                <h3 class="card-title">Performance Metrics</h3>
                            </div>
                            <div class="card-body">
                                <div class="metrics-grid">
                                    <div class="metric-item">
                                        <div class="metric-label">Conversion Rate</div>
                                        <div class="metric-value">${stats.conversionRate.toFixed(1)}%</div>
                                        <div class="metric-bar">
                                            <div class="metric-fill" style="width: ${Math.min(stats.conversionRate * 20, 100)}%"></div>
                                        </div>
                                    </div>
                                    <div class="metric-item">
                                        <div class="metric-label">Click-through Rate</div>
                                        <div class="metric-value">${stats.clickThroughRate.toFixed(1)}%</div>
                                        <div class="metric-bar">
                                            <div class="metric-fill" style="width: ${Math.min(stats.clickThroughRate * 15, 100)}%"></div>
                                        </div>
                                    </div>
                                    <div class="metric-item">
                                        <div class="metric-label">Average Order Value</div>
                                        <div class="metric-value">$${(45 + Math.random() * 20).toFixed(2)}</div>
                                        <div class="metric-bar">
                                            <div class="metric-fill" style="width: ${60 + Math.random() * 30}%"></div>
                                        </div>
                                    </div>
                                    <div class="metric-item">
                                        <div class="metric-label">Return on Ad Spend</div>
                                        <div class="metric-value">${(3.2 + Math.random() * 1.8).toFixed(1)}x</div>
                                        <div class="metric-bar">
                                            <div class="metric-fill" style="width: ${70 + Math.random() * 25}%"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    // Initialize interactions
    initializeInteractions() {
        // Revenue period selector
        const revenuePeriod = document.getElementById('revenue-period');
        if (revenuePeriod) {
            revenuePeriod.addEventListener('change', (e) => {
                this.updateRevenueChart(e.target.value);
            });
        }

        // Add click handlers for interactive elements
        this.addClickHandlers();
    },

    // Add click handlers
    addClickHandlers() {
        // Quick action cards
        document.querySelectorAll('.quick-action-card').forEach(card => {
            card.style.cursor = 'pointer';
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-2px)';
                card.style.boxShadow = 'var(--shadow-lg)';
            });
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(0)';
                card.style.boxShadow = 'var(--shadow-sm)';
            });
        });

        // Activity items
        document.querySelectorAll('.activity-item').forEach(item => {
            item.style.cursor = 'pointer';
            item.addEventListener('mouseenter', () => {
                item.style.backgroundColor = 'var(--bg-secondary)';
            });
            item.addEventListener('mouseleave', () => {
                item.style.backgroundColor = 'transparent';
            });
        });
    },

    // Initialize charts
    initializeCharts() {
        this.initializeRevenueChart();
    },

    // Initialize revenue chart
    initializeRevenueChart() {
        const canvas = document.getElementById('revenue-chart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        
        // Generate sample data
        const days = 30;
        const data = [];
        const labels = [];
        
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
            
            // Generate realistic revenue data with some randomness
            const baseRevenue = 50 + Math.sin(i * 0.2) * 20;
            const revenue = baseRevenue + (Math.random() - 0.5) * 30;
            data.push(Math.max(0, revenue));
        }

        // Simple chart implementation (in production, use Chart.js)
        this.drawLineChart(ctx, canvas, data, labels);
    },

    // Simple line chart drawer
    drawLineChart(ctx, canvas, data, labels) {
        const width = canvas.width;
        const height = canvas.height;
        const padding = 40;
        const chartWidth = width - padding * 2;
        const chartHeight = height - padding * 2;
        
        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        
        // Find min/max values
        const maxValue = Math.max(...data);
        const minValue = Math.min(...data);
        const range = maxValue - minValue || 1;
        
        // Draw grid lines
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;
        
        // Horizontal grid lines
        for (let i = 0; i <= 5; i++) {
            const y = padding + (chartHeight / 5) * i;
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(width - padding, y);
            ctx.stroke();
        }
        
        // Draw data line
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        data.forEach((value, index) => {
            const x = padding + (chartWidth / (data.length - 1)) * index;
            const y = padding + chartHeight - ((value - minValue) / range) * chartHeight;
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        
        ctx.stroke();
        
        // Draw data points
        ctx.fillStyle = '#3b82f6';
        data.forEach((value, index) => {
            const x = padding + (chartWidth / (data.length - 1)) * index;
            const y = padding + chartHeight - ((value - minValue) / range) * chartHeight;
            
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, 2 * Math.PI);
            ctx.fill();
        });
    },

    // Update revenue chart
    updateRevenueChart(period) {
        // In a real implementation, this would fetch new data
        console.log(`📊 Updating revenue chart for period: ${period}`);
        this.initializeRevenueChart();
    },

    // Format time ago
    formatTimeAgo(timestamp) {
        const now = new Date();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        
        if (days > 0) {
            return `${days} day${days > 1 ? 's' : ''} ago`;
        } else if (hours > 0) {
            return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        } else if (minutes > 0) {
            return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        } else {
            return 'Just now';
        }
    },

    // Start periodic updates
    startPeriodicUpdates() {
        // Update stats every 5 minutes
        this.updateInterval = setInterval(() => {
            this.loadDashboardData();
        }, 5 * 60 * 1000);
    },

    // Show error state
    showErrorState() {
        const pageContent = document.getElementById('page-content');
        if (!pageContent) return;

        pageContent.innerHTML = `
            <div class="error-state">
                <div class="error-icon">⚠️</div>
                <h2>Unable to load dashboard</h2>
                <p>Please check your connection and try again.</p>
                <button class="btn btn-primary" onclick="Dashboard.render()">
                    Retry
                </button>
            </div>
        `;
    },

    // Cleanup
    cleanup() {
        // Clear intervals
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        
        // Unsubscribe from listeners
        if (this.unsubscribeListeners) {
            this.unsubscribeListeners.forEach(unsubscribe => unsubscribe());
        }
        
        // Clear charts
        if (revenueChart) {
            revenueChart = null;
        }
        
        console.log('📊 Dashboard cleanup completed');
    }
};

// Export dashboard module
export default Dashboard;

console.log('📊 Dashboard module loaded');