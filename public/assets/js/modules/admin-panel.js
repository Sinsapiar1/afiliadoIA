/**
 * Admin Panel Module
 * AffiliatePro - AI-Powered Affiliate Marketing Platform
 */

import { db, COLLECTIONS, USER_ROLES, USER_PLANS, PLAN_LIMITS } from '../core/firebase-config.js';
import authManager from '../core/auth.js';
import uiComponents from '../components/ui-components.js';
import {
    collection,
    query,
    where,
    orderBy,
    limit,
    getDocs,
    doc,
    updateDoc,
    deleteDoc,
    getDoc,
    serverTimestamp,
    startAfter,
    endBefore
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Admin panel state
let adminState = {
    currentSection: 'overview',
    users: [],
    analytics: {},
    settings: {},
    filters: {
        userStatus: 'all',
        userPlan: 'all',
        dateRange: '30d'
    },
    pagination: {
        users: { page: 1, limit: 20, total: 0 },
        logs: { page: 1, limit: 50, total: 0 }
    },
    isLoading: false
};

// Admin Panel module
const AdminPanel = {
    // Initialize module
    async init() {
        console.log('🛡️ Initializing Admin Panel...');
        
        // Check admin permissions
        const userProfile = authManager.getCurrentUserProfile();
        if (!userProfile || userProfile.role !== USER_ROLES.ADMIN) {
            console.error('❌ Unauthorized access to admin panel');
            router.navigate('dashboard');
            return;
        }
        
        // Load initial data
        await this.loadAnalytics();
        await this.loadUsers();
        await this.loadSettings();
        
        console.log('✅ Admin Panel initialized');
    },

    // Render module
    async render() {
        const pageContent = document.getElementById('page-content');
        if (!pageContent) return;

        // Check admin permissions
        const userProfile = authManager.getCurrentUserProfile();
        if (!userProfile || userProfile.role !== USER_ROLES.ADMIN) {
            pageContent.innerHTML = this.getUnauthorizedHTML();
            return;
        }

        pageContent.innerHTML = this.getAdminPanelHTML();
        
        // Initialize interactions
        this.initializeInteractions();
        
        // Load section content
        this.loadSection(adminState.currentSection);
    },

    // Get HTML template
    getAdminPanelHTML() {
        return `
            <div class="admin-panel">
                <!-- Header Section -->
                <div class="admin-header">
                    <div class="admin-title">
                        <h1>🛡️ Admin Panel</h1>
                        <p>Manage users, analytics, and platform settings</p>
                    </div>
                    <div class="admin-actions">
                        <button class="btn btn-outline" onclick="AdminPanel.exportData()">
                            📊 Export Data
                        </button>
                        <button class="btn btn-secondary" onclick="AdminPanel.refreshData()">
                            🔄 Refresh
                        </button>
                    </div>
                </div>

                <!-- Navigation Tabs -->
                <div class="admin-nav">
                    <div class="nav-tabs">
                        <button class="nav-tab ${adminState.currentSection === 'overview' ? 'active' : ''}"
                                onclick="AdminPanel.switchSection('overview')">
                            📊 Overview
                        </button>
                        <button class="nav-tab ${adminState.currentSection === 'users' ? 'active' : ''}"
                                onclick="AdminPanel.switchSection('users')">
                            👥 Users
                        </button>
                        <button class="nav-tab ${adminState.currentSection === 'analytics' ? 'active' : ''}"
                                onclick="AdminPanel.switchSection('analytics')">
                            📈 Analytics
                        </button>
                        <button class="nav-tab ${adminState.currentSection === 'settings' ? 'active' : ''}"
                                onclick="AdminPanel.switchSection('settings')">
                            ⚙️ Settings
                        </button>
                        <button class="nav-tab ${adminState.currentSection === 'logs' ? 'active' : ''}"
                                onclick="AdminPanel.switchSection('logs')">
                            📋 Activity Logs
                        </button>
                    </div>
                </div>

                <!-- Content Area -->
                <div class="admin-content">
                    <div id="admin-section-content" class="section-content">
                        ${this.getSectionContent(adminState.currentSection)}
                    </div>
                </div>
            </div>
        `;
    },

    // Get unauthorized HTML
    getUnauthorizedHTML() {
        return `
            <div class="unauthorized-access">
                <div class="unauthorized-card">
                    <div class="unauthorized-icon">🚫</div>
                    <h2>Access Denied</h2>
                    <p>You don't have permission to access the admin panel.</p>
                    <button class="btn btn-primary" onclick="router.navigate('dashboard')">
                        Return to Dashboard
                    </button>
                </div>
            </div>
        `;
    },

    // Get section content
    getSectionContent(section) {
        switch (section) {
            case 'overview':
                return this.getOverviewHTML();
            case 'users':
                return this.getUsersHTML();
            case 'analytics':
                return this.getAnalyticsHTML();
            case 'settings':
                return this.getSettingsHTML();
            case 'logs':
                return this.getLogsHTML();
            default:
                return this.getOverviewHTML();
        }
    },

    // Get overview HTML
    getOverviewHTML() {
        const analytics = adminState.analytics;
        
        return `
            <div class="overview-section">
                <!-- Key Metrics -->
                <div class="metrics-grid">
                    <div class="metric-card primary">
                        <div class="metric-icon">👥</div>
                        <div class="metric-content">
                            <div class="metric-label">Total Users</div>
                            <div class="metric-value">${uiComponents.formatNumber(analytics.totalUsers || 0)}</div>
                            <div class="metric-change positive">
                                +${analytics.newUsersToday || 0} today
                            </div>
                        </div>
                    </div>

                    <div class="metric-card secondary">
                        <div class="metric-icon">💰</div>
                        <div class="metric-content">
                            <div class="metric-label">Monthly Revenue</div>
                            <div class="metric-value">${uiComponents.formatCurrency(analytics.monthlyRevenue || 0)}</div>
                            <div class="metric-change ${analytics.revenueGrowth >= 0 ? 'positive' : 'negative'}">
                                ${analytics.revenueGrowth >= 0 ? '+' : ''}${(analytics.revenueGrowth || 0).toFixed(1)}% vs last month
                            </div>
                        </div>
                    </div>

                    <div class="metric-card tertiary">
                        <div class="metric-icon">📈</div>
                        <div class="metric-content">
                            <div class="metric-label">Active Subscriptions</div>
                            <div class="metric-value">${uiComponents.formatNumber(analytics.activeSubscriptions || 0)}</div>
                            <div class="metric-change neutral">
                                ${(analytics.conversionRate || 0).toFixed(1)}% conversion rate
                            </div>
                        </div>
                    </div>

                    <div class="metric-card quaternary">
                        <div class="metric-icon">🎯</div>
                        <div class="metric-content">
                            <div class="metric-label">Feature Usage</div>
                            <div class="metric-value">${uiComponents.formatNumber(analytics.totalGenerations || 0)}</div>
                            <div class="metric-change positive">
                                AI generations this month
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Quick Stats -->
                <div class="quick-stats">
                    <div class="card">
                        <div class="card-header">
                            <h3>📊 Quick Statistics</h3>
                        </div>
                        <div class="card-body">
                            <div class="stats-grid">
                                <div class="stat-item">
                                    <div class="stat-label">Plan Distribution</div>
                                    <div class="plan-breakdown">
                                        <div class="plan-stat">
                                            <span class="plan-name">Free</span>
                                            <span class="plan-count">${analytics.planDistribution?.free || 0}</span>
                                            <span class="plan-percentage">${((analytics.planDistribution?.free || 0) / (analytics.totalUsers || 1) * 100).toFixed(0)}%</span>
                                        </div>
                                        <div class="plan-stat">
                                            <span class="plan-name">Pro</span>
                                            <span class="plan-count">${analytics.planDistribution?.pro || 0}</span>
                                            <span class="plan-percentage">${((analytics.planDistribution?.pro || 0) / (analytics.totalUsers || 1) * 100).toFixed(0)}%</span>
                                        </div>
                                        <div class="plan-stat">
                                            <span class="plan-name">Agency</span>
                                            <span class="plan-count">${analytics.planDistribution?.agency || 0}</span>
                                            <span class="plan-percentage">${((analytics.planDistribution?.agency || 0) / (analytics.totalUsers || 1) * 100).toFixed(0)}%</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="stat-item">
                                    <div class="stat-label">Feature Usage Today</div>
                                    <div class="feature-usage">
                                        <div class="usage-item">
                                            <span>Product Detections</span>
                                            <span>${analytics.todayUsage?.productDetections || 0}</span>
                                        </div>
                                        <div class="usage-item">
                                            <span>Content Generations</span>
                                            <span>${analytics.todayUsage?.contentGenerations || 0}</span>
                                        </div>
                                        <div class="usage-item">
                                            <span>Funnel Creations</span>
                                            <span>${analytics.todayUsage?.funnelCreations || 0}</span>
                                        </div>
                                        <div class="usage-item">
                                            <span>Avatar Generations</span>
                                            <span>${analytics.todayUsage?.avatarGenerations || 0}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Recent Activity -->
                <div class="recent-activity">
                    <div class="card">
                        <div class="card-header">
                            <h3>🔄 Recent Activity</h3>
                        </div>
                        <div class="card-body">
                            <div class="activity-list">
                                ${(analytics.recentActivity || []).map(activity => `
                                    <div class="activity-item">
                                        <div class="activity-icon">${activity.icon}</div>
                                        <div class="activity-content">
                                            <div class="activity-title">${activity.title}</div>
                                            <div class="activity-time">${uiComponents.formatDate(activity.timestamp)}</div>
                                        </div>
                                    </div>
                                `).join('') || '<div class="empty-state-small">No recent activity</div>'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    // Get users HTML
    getUsersHTML() {
        return `
            <div class="users-section">
                <!-- Users Filters -->
                <div class="users-filters">
                    <div class="card">
                        <div class="card-body">
                            <div class="filters-grid">
                                <div class="filter-group">
                                    <label for="user-status">Status</label>
                                    <select id="user-status" class="form-select" onchange="AdminPanel.updateUserFilter('userStatus', this.value)">
                                        <option value="all">All Users</option>
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                        <option value="suspended">Suspended</option>
                                    </select>
                                </div>
                                
                                <div class="filter-group">
                                    <label for="user-plan">Plan</label>
                                    <select id="user-plan" class="form-select" onchange="AdminPanel.updateUserFilter('userPlan', this.value)">
                                        <option value="all">All Plans</option>
                                        <option value="free">Free</option>
                                        <option value="pro">Pro</option>
                                        <option value="agency">Agency</option>
                                        <option value="enterprise">Enterprise</option>
                                    </select>
                                </div>
                                
                                <div class="filter-group">
                                    <label for="user-search">Search</label>
                                    <input type="text" id="user-search" class="form-input" placeholder="Email or name" 
                                           onchange="AdminPanel.searchUsers(this.value)">
                                </div>
                                
                                <div class="filter-actions">
                                    <button class="btn btn-outline" onclick="AdminPanel.exportUsers()">
                                        📊 Export Users
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Users Table -->
                <div class="users-table">
                    <div class="card">
                        <div class="card-header">
                            <h3>👥 Users (${adminState.users.length})</h3>
                            <div class="table-actions">
                                <button class="btn btn-primary btn-sm" onclick="AdminPanel.addUser()">
                                    ➕ Add User
                                </button>
                            </div>
                        </div>
                        <div class="card-body">
                            ${adminState.isLoading ? '<div class="loading-state">Loading users...</div>' : `
                                <div class="table-responsive">
                                    <table class="admin-table">
                                        <thead>
                                            <tr>
                                                <th>User</th>
                                                <th>Plan</th>
                                                <th>Status</th>
                                                <th>Created</th>
                                                <th>Last Active</th>
                                                <th>Usage</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${adminState.users.map(user => `
                                                <tr>
                                                    <td>
                                                        <div class="user-info">
                                                            <div class="user-avatar">👤</div>
                                                            <div class="user-details">
                                                                <div class="user-name">${user.fullName || 'Unknown'}</div>
                                                                <div class="user-email">${user.email}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span class="plan-badge plan-${user.plan}">${user.plan?.toUpperCase() || 'FREE'}</span>
                                                    </td>
                                                    <td>
                                                        <span class="status-badge status-${user.isActive ? 'active' : 'inactive'}">
                                                            ${user.isActive ? 'Active' : 'Inactive'}
                                                        </span>
                                                    </td>
                                                    <td>${uiComponents.formatDate(user.createdAt)}</td>
                                                    <td>${user.lastLoginAt ? uiComponents.formatDate(user.lastLoginAt) : 'Never'}</td>
                                                    <td>
                                                        <div class="usage-summary">
                                                            <small>${user.usage?.productDetections || 0} products</small>
                                                            <small>${user.usage?.contentGenerations || 0} content</small>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div class="action-buttons">
                                                            <button class="btn-icon" onclick="AdminPanel.viewUser('${user.id}')" title="View">
                                                                👁️
                                                            </button>
                                                            <button class="btn-icon" onclick="AdminPanel.editUser('${user.id}')" title="Edit">
                                                                ✏️
                                                            </button>
                                                            <button class="btn-icon" onclick="AdminPanel.suspendUser('${user.id}')" title="Suspend">
                                                                ⚠️
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            `).join('') || '<tr><td colspan="7" class="empty-state">No users found</td></tr>'}
                                        </tbody>
                                    </table>
                                </div>

                                <!-- Pagination -->
                                <div class="table-pagination">
                                    <div class="pagination-info">
                                        Showing ${((adminState.pagination.users.page - 1) * adminState.pagination.users.limit) + 1} to ${Math.min(adminState.pagination.users.page * adminState.pagination.users.limit, adminState.pagination.users.total)} of ${adminState.pagination.users.total} users
                                    </div>
                                    <div class="pagination-controls">
                                        <button class="btn btn-outline btn-sm" 
                                                onclick="AdminPanel.changePage('users', ${adminState.pagination.users.page - 1})"
                                                ${adminState.pagination.users.page <= 1 ? 'disabled' : ''}>
                                            Previous
                                        </button>
                                        <span class="page-info">Page ${adminState.pagination.users.page}</span>
                                        <button class="btn btn-outline btn-sm" 
                                                onclick="AdminPanel.changePage('users', ${adminState.pagination.users.page + 1})"
                                                ${adminState.pagination.users.page * adminState.pagination.users.limit >= adminState.pagination.users.total ? 'disabled' : ''}>
                                            Next
                                        </button>
                                    </div>
                                </div>
                            `}
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    // Get analytics HTML
    getAnalyticsHTML() {
        return `
            <div class="analytics-section">
                <!-- Analytics Filters -->
                <div class="analytics-filters">
                    <div class="card">
                        <div class="card-body">
                            <div class="filters-grid">
                                <div class="filter-group">
                                    <label for="date-range">Date Range</label>
                                    <select id="date-range" class="form-select" onchange="AdminPanel.updateDateRange(this.value)">
                                        <option value="7d">Last 7 days</option>
                                        <option value="30d" selected>Last 30 days</option>
                                        <option value="90d">Last 90 days</option>
                                        <option value="1y">Last year</option>
                                    </select>
                                </div>
                                
                                <div class="filter-group">
                                    <label for="metric-type">Metric</label>
                                    <select id="metric-type" class="form-select">
                                        <option value="users">User Growth</option>
                                        <option value="revenue">Revenue</option>
                                        <option value="usage">Feature Usage</option>
                                        <option value="retention">Retention</option>
                                    </select>
                                </div>
                                
                                <div class="filter-actions">
                                    <button class="btn btn-outline" onclick="AdminPanel.exportAnalytics()">
                                        📊 Export Report
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Charts Section -->
                <div class="analytics-charts">
                    <div class="charts-grid">
                        <div class="chart-card">
                            <div class="card">
                                <div class="card-header">
                                    <h3>📈 User Growth</h3>
                                </div>
                                <div class="card-body">
                                    <canvas id="user-growth-chart" width="400" height="200"></canvas>
                                </div>
                            </div>
                        </div>
                        
                        <div class="chart-card">
                            <div class="card">
                                <div class="card-header">
                                    <h3>💰 Revenue Trends</h3>
                                </div>
                                <div class="card-body">
                                    <canvas id="revenue-chart" width="400" height="200"></canvas>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Feature Analytics -->
                <div class="feature-analytics">
                    <div class="card">
                        <div class="card-header">
                            <h3>🎯 Feature Usage Analytics</h3>
                        </div>
                        <div class="card-body">
                            <div class="feature-stats-grid">
                                <div class="feature-stat">
                                    <h4>Product Detector</h4>
                                    <div class="stat-value">${uiComponents.formatNumber(adminState.analytics.featureUsage?.productDetections || 0)}</div>
                                    <div class="stat-label">Total detections</div>
                                    <div class="usage-bar">
                                        <div class="usage-fill" style="width: 85%"></div>
                                    </div>
                                </div>
                                
                                <div class="feature-stat">
                                    <h4>Content Generator</h4>
                                    <div class="stat-value">${uiComponents.formatNumber(adminState.analytics.featureUsage?.contentGenerations || 0)}</div>
                                    <div class="stat-label">Total generations</div>
                                    <div class="usage-bar">
                                        <div class="usage-fill" style="width: 72%"></div>
                                    </div>
                                </div>
                                
                                <div class="feature-stat">
                                    <h4>Funnel Architect</h4>
                                    <div class="stat-value">${uiComponents.formatNumber(adminState.analytics.featureUsage?.funnelCreations || 0)}</div>
                                    <div class="stat-label">Funnels created</div>
                                    <div class="usage-bar">
                                        <div class="usage-fill" style="width: 45%"></div>
                                    </div>
                                </div>
                                
                                <div class="feature-stat">
                                    <h4>Avatar Generator</h4>
                                    <div class="stat-value">${uiComponents.formatNumber(adminState.analytics.featureUsage?.avatarGenerations || 0)}</div>
                                    <div class="stat-label">Avatars generated</div>
                                    <div class="usage-bar">
                                        <div class="usage-fill" style="width: 38%"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    // Get settings HTML
    getSettingsHTML() {
        return `
            <div class="settings-section">
                <!-- Platform Settings -->
                <div class="platform-settings">
                    <div class="card">
                        <div class="card-header">
                            <h3>⚙️ Platform Settings</h3>
                        </div>
                        <div class="card-body">
                            <form id="platform-settings-form" class="settings-form">
                                <div class="settings-grid">
                                    <div class="setting-group">
                                        <h4>General Settings</h4>
                                        <div class="form-group">
                                            <label for="platform-name">Platform Name</label>
                                            <input type="text" id="platform-name" class="form-input" value="AffiliatePro">
                                        </div>
                                        <div class="form-group">
                                            <label for="support-email">Support Email</label>
                                            <input type="email" id="support-email" class="form-input" value="support@affiliatepro.com">
                                        </div>
                                        <div class="form-group">
                                            <label class="checkbox-label">
                                                <input type="checkbox" id="maintenance-mode">
                                                <span class="checkmark"></span>
                                                <span>Maintenance Mode</span>
                                            </label>
                                        </div>
                                    </div>

                                    <div class="setting-group">
                                        <h4>Feature Limits</h4>
                                        <div class="limits-grid">
                                            ${Object.entries(USER_PLANS).map(([planKey, planName]) => `
                                                <div class="plan-limits">
                                                    <h5>${planName.toUpperCase()} Plan</h5>
                                                    <div class="form-group">
                                                        <label>Product Detections</label>
                                                        <input type="number" class="form-input" 
                                                               value="${PLAN_LIMITS[planName]?.productDetections || 0}"
                                                               data-plan="${planName}" data-limit="productDetections">
                                                    </div>
                                                    <div class="form-group">
                                                        <label>Content Generations</label>
                                                        <input type="number" class="form-input" 
                                                               value="${PLAN_LIMITS[planName]?.contentGenerations || 0}"
                                                               data-plan="${planName}" data-limit="contentGenerations">
                                                    </div>
                                                </div>
                                            `).join('')}
                                        </div>
                                    </div>

                                    <div class="setting-group">
                                        <h4>AI Configuration</h4>
                                        <div class="form-group">
                                            <label for="ai-provider">AI Provider</label>
                                            <select id="ai-provider" class="form-select">
                                                <option value="gemini">Google Gemini</option>
                                                <option value="openai">OpenAI GPT</option>
                                                <option value="claude">Anthropic Claude</option>
                                            </select>
                                        </div>
                                        <div class="form-group">
                                            <label for="ai-temperature">AI Temperature</label>
                                            <input type="range" id="ai-temperature" class="form-range" 
                                                   min="0" max="1" step="0.1" value="0.7">
                                            <span class="range-value">0.7</span>
                                        </div>
                                        <div class="form-group">
                                            <label for="rate-limit">Rate Limit (requests/hour)</label>
                                            <input type="number" id="rate-limit" class="form-input" value="100">
                                        </div>
                                    </div>
                                </div>

                                <div class="form-actions">
                                    <button type="button" class="btn btn-secondary" onclick="AdminPanel.resetSettings()">
                                        🔄 Reset to Defaults
                                    </button>
                                    <button type="submit" class="btn btn-primary">
                                        💾 Save Settings
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>

                <!-- Email Templates -->
                <div class="email-templates">
                    <div class="card">
                        <div class="card-header">
                            <h3>📧 Email Templates</h3>
                        </div>
                        <div class="card-body">
                            <div class="template-tabs">
                                <button class="template-tab active" onclick="AdminPanel.switchTemplate('welcome')">
                                    Welcome Email
                                </button>
                                <button class="template-tab" onclick="AdminPanel.switchTemplate('upgrade')">
                                    Upgrade Reminder
                                </button>
                                <button class="template-tab" onclick="AdminPanel.switchTemplate('reset')">
                                    Password Reset
                                </button>
                            </div>
                            
                            <div class="template-editor">
                                <div class="form-group">
                                    <label for="email-subject">Subject Line</label>
                                    <input type="text" id="email-subject" class="form-input" 
                                           value="Welcome to AffiliatePro!">
                                </div>
                                <div class="form-group">
                                    <label for="email-content">Email Content</label>
                                    <textarea id="email-content" class="form-input" rows="10">
Welcome to AffiliatePro! 

We're excited to have you on board. Get started by exploring our AI-powered tools:

• Product Detector - Find winning products
• Content Generator - Create viral content  
• Funnel Architect - Build converting funnels

Best regards,
The AffiliatePro Team
                                    </textarea>
                                </div>
                                <div class="template-actions">
                                    <button class="btn btn-outline" onclick="AdminPanel.previewEmail()">
                                        👁️ Preview
                                    </button>
                                    <button class="btn btn-primary" onclick="AdminPanel.saveEmailTemplate()">
                                        💾 Save Template
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    // Get logs HTML
    getLogsHTML() {
        return `
            <div class="logs-section">
                <!-- Log Filters -->
                <div class="log-filters">
                    <div class="card">
                        <div class="card-body">
                            <div class="filters-grid">
                                <div class="filter-group">
                                    <label for="log-level">Level</label>
                                    <select id="log-level" class="form-select">
                                        <option value="all">All Levels</option>
                                        <option value="info">Info</option>
                                        <option value="warning">Warning</option>
                                        <option value="error">Error</option>
                                    </select>
                                </div>
                                
                                <div class="filter-group">
                                    <label for="log-source">Source</label>
                                    <select id="log-source" class="form-select">
                                        <option value="all">All Sources</option>
                                        <option value="auth">Authentication</option>
                                        <option value="payment">Payments</option>
                                        <option value="api">API Calls</option>
                                        <option value="system">System</option>
                                    </select>
                                </div>
                                
                                <div class="filter-group">
                                    <label for="log-search">Search</label>
                                    <input type="text" id="log-search" class="form-input" placeholder="Search logs...">
                                </div>
                                
                                <div class="filter-actions">
                                    <button class="btn btn-outline" onclick="AdminPanel.exportLogs()">
                                        📊 Export Logs
                                    </button>
                                    <button class="btn btn-secondary" onclick="AdminPanel.clearOldLogs()">
                                        🗑️ Clear Old Logs
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Activity Logs -->
                <div class="activity-logs">
                    <div class="card">
                        <div class="card-header">
                            <h3>📋 Activity Logs</h3>
                        </div>
                        <div class="card-body">
                            <div class="logs-list">
                                ${this.getMockLogs().map(log => `
                                    <div class="log-item log-${log.level}">
                                        <div class="log-icon">${this.getLogIcon(log.level)}</div>
                                        <div class="log-content">
                                            <div class="log-message">${log.message}</div>
                                            <div class="log-meta">
                                                <span class="log-source">${log.source}</span>
                                                <span class="log-time">${uiComponents.formatDate(log.timestamp)}</span>
                                                ${log.user ? `<span class="log-user">${log.user}</span>` : ''}
                                            </div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    // Initialize interactions
    initializeInteractions() {
        // Platform settings form
        const platformForm = document.getElementById('platform-settings-form');
        if (platformForm) {
            platformForm.addEventListener('submit', (e) => this.handleSettingsSave(e));
        }

        // AI temperature slider
        const tempSlider = document.getElementById('ai-temperature');
        if (tempSlider) {
            tempSlider.addEventListener('input', (e) => {
                const valueSpan = e.target.nextElementSibling;
                if (valueSpan) {
                    valueSpan.textContent = e.target.value;
                }
            });
        }
    },

    // Switch section
    switchSection(section) {
        adminState.currentSection = section;
        
        // Update active tab
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[onclick="AdminPanel.switchSection('${section}')"]`).classList.add('active');
        
        // Load section content
        this.loadSection(section);
    },

    // Load section
    async loadSection(section) {
        const contentArea = document.getElementById('admin-section-content');
        if (!contentArea) return;

        contentArea.innerHTML = this.getSectionContent(section);
        
        // Load section-specific data
        switch (section) {
            case 'users':
                await this.loadUsers();
                break;
            case 'analytics':
                await this.loadAnalytics();
                this.initializeCharts();
                break;
            case 'settings':
                await this.loadSettings();
                break;
            case 'logs':
                await this.loadLogs();
                break;
        }
    },

    // Load analytics data
    async loadAnalytics() {
        try {
            // In a real implementation, this would fetch from Firestore
            // For demo, we'll use mock data
            adminState.analytics = {
                totalUsers: 1247,
                newUsersToday: 23,
                monthlyRevenue: 28450,
                revenueGrowth: 12.5,
                activeSubscriptions: 342,
                conversionRate: 3.2,
                totalGenerations: 8965,
                planDistribution: {
                    free: 905,
                    pro: 287,
                    agency: 42,
                    enterprise: 13
                },
                todayUsage: {
                    productDetections: 156,
                    contentGenerations: 89,
                    funnelCreations: 34,
                    avatarGenerations: 67
                },
                featureUsage: {
                    productDetections: 15420,
                    contentGenerations: 8965,
                    funnelCreations: 3456,
                    avatarGenerations: 2890
                },
                recentActivity: [
                    {
                        icon: '👤',
                        title: 'New user registration: john.doe@example.com',
                        timestamp: new Date(Date.now() - 15 * 60 * 1000)
                    },
                    {
                        icon: '💰',
                        title: 'Pro subscription activated: sarah.wilson@company.com',
                        timestamp: new Date(Date.now() - 35 * 60 * 1000)
                    },
                    {
                        icon: '🔍',
                        title: 'Product detection spike detected in Electronics category',
                        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000)
                    }
                ]
            };
        } catch (error) {
            console.error('❌ Error loading analytics:', error);
        }
    },

    // Load users data
    async loadUsers() {
        try {
            adminState.isLoading = true;
            this.updateUsersDisplay();
            
            // In a real implementation, this would fetch from Firestore
            // For demo, we'll use mock data
            adminState.users = [
                {
                    id: 'user1',
                    email: 'jaime.pivet@gmail.com',
                    fullName: 'Jaime Pivet',
                    plan: 'enterprise',
                    role: 'admin',
                    isActive: true,
                    createdAt: new Date('2024-01-15'),
                    lastLoginAt: new Date(),
                    usage: {
                        productDetections: 156,
                        contentGenerations: 89,
                        funnelCreations: 12,
                        avatarGenerations: 34
                    }
                },
                {
                    id: 'user2',
                    email: 'sarah.wilson@company.com',
                    fullName: 'Sarah Wilson',
                    plan: 'pro',
                    role: 'user',
                    isActive: true,
                    createdAt: new Date('2024-02-10'),
                    lastLoginAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
                    usage: {
                        productDetections: 45,
                        contentGenerations: 67,
                        funnelCreations: 8,
                        avatarGenerations: 12
                    }
                },
                {
                    id: 'user3',
                    email: 'mike.johnson@startup.com',
                    fullName: 'Mike Johnson',
                    plan: 'agency',
                    role: 'user',
                    isActive: true,
                    createdAt: new Date('2024-03-05'),
                    lastLoginAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
                    usage: {
                        productDetections: 234,
                        contentGenerations: 156,
                        funnelCreations: 23,
                        avatarGenerations: 45
                    }
                }
            ];
            
            adminState.pagination.users.total = adminState.users.length;
            adminState.isLoading = false;
            
            this.updateUsersDisplay();
            
        } catch (error) {
            console.error('❌ Error loading users:', error);
            adminState.isLoading = false;
        }
    },

    // Load settings
    async loadSettings() {
        try {
            // In a real implementation, this would fetch from Firestore
            adminState.settings = {
                platformName: 'AffiliatePro',
                supportEmail: 'support@affiliatepro.com',
                maintenanceMode: false,
                aiProvider: 'gemini',
                aiTemperature: 0.7,
                rateLimit: 100
            };
        } catch (error) {
            console.error('❌ Error loading settings:', error);
        }
    },

    // Load logs
    async loadLogs() {
        // Logs are shown via getMockLogs()
    },

    // Get mock logs
    getMockLogs() {
        return [
            {
                level: 'info',
                source: 'auth',
                message: 'User login successful: jaime.pivet@gmail.com',
                timestamp: new Date(),
                user: 'jaime.pivet@gmail.com'
            },
            {
                level: 'info',
                source: 'api',
                message: 'Product detection request completed in 2.3s',
                timestamp: new Date(Date.now() - 5 * 60 * 1000),
                user: 'sarah.wilson@company.com'
            },
            {
                level: 'warning',
                source: 'system',
                message: 'High API usage detected for user: mike.johnson@startup.com',
                timestamp: new Date(Date.now() - 15 * 60 * 1000),
                user: 'mike.johnson@startup.com'
            },
            {
                level: 'error',
                source: 'payment',
                message: 'Payment processing failed for subscription renewal',
                timestamp: new Date(Date.now() - 30 * 60 * 1000),
                user: 'user@example.com'
            },
            {
                level: 'info',
                source: 'auth',
                message: 'New user registration: john.doe@example.com',
                timestamp: new Date(Date.now() - 45 * 60 * 1000)
            }
        ];
    },

    // Get log icon
    getLogIcon(level) {
        const icons = {
            info: 'ℹ️',
            warning: '⚠️',
            error: '❌'
        };
        return icons[level] || 'ℹ️';
    },

    // Initialize charts
    initializeCharts() {
        this.initializeUserGrowthChart();
        this.initializeRevenueChart();
    },

    // Initialize user growth chart
    initializeUserGrowthChart() {
        const canvas = document.getElementById('user-growth-chart');
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
            
            // Generate realistic user growth data
            const baseUsers = 1000 + i * 8;
            const users = baseUsers + Math.sin(i * 0.3) * 20 + (Math.random() - 0.5) * 40;
            data.push(Math.max(0, Math.round(users)));
        }

        this.drawLineChart(ctx, canvas, data, labels, 'New Users', '#3b82f6');
    },

    // Initialize revenue chart
    initializeRevenueChart() {
        const canvas = document.getElementById('revenue-chart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        
        // Generate sample revenue data
        const days = 30;
        const data = [];
        const labels = [];
        
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
            
            // Generate realistic revenue data
            const baseRevenue = 800 + i * 15;
            const revenue = baseRevenue + Math.sin(i * 0.2) * 100 + (Math.random() - 0.5) * 150;
            data.push(Math.max(0, Math.round(revenue)));
        }

        this.drawLineChart(ctx, canvas, data, labels, 'Daily Revenue ($)', '#10b981');
    },

    // Draw line chart
    drawLineChart(ctx, canvas, data, labels, title, color) {
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
        ctx.strokeStyle = '#e5e7eb';
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
        ctx.strokeStyle = color;
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
        ctx.fillStyle = color;
        data.forEach((value, index) => {
            const x = padding + (chartWidth / (data.length - 1)) * index;
            const y = padding + chartHeight - ((value - minValue) / range) * chartHeight;
            
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, 2 * Math.PI);
            ctx.fill();
        });
    },

    // User management functions
    viewUser(userId) {
        const user = adminState.users.find(u => u.id === userId);
        if (!user) return;

        uiComponents.createModal({
            id: 'user-details-modal',
            title: `User Details: ${user.fullName}`,
            size: 'large',
            content: `
                <div class="user-details">
                    <div class="detail-grid">
                        <div class="detail-item">
                            <label>Email:</label>
                            <span>${user.email}</span>
                        </div>
                        <div class="detail-item">
                            <label>Plan:</label>
                            <span class="plan-badge plan-${user.plan}">${user.plan.toUpperCase()}</span>
                        </div>
                        <div class="detail-item">
                            <label>Status:</label>
                            <span class="status-badge status-${user.isActive ? 'active' : 'inactive'}">
                                ${user.isActive ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                        <div class="detail-item">
                            <label>Member Since:</label>
                            <span>${uiComponents.formatDate(user.createdAt)}</span>
                        </div>
                        <div class="detail-item">
                            <label>Last Login:</label>
                            <span>${user.lastLoginAt ? uiComponents.formatDate(user.lastLoginAt) : 'Never'}</span>
                        </div>
                    </div>
                    
                    <div class="usage-details">
                        <h4>Usage Statistics</h4>
                        <div class="usage-grid">
                            <div class="usage-item">
                                <span>Product Detections:</span>
                                <span>${user.usage?.productDetections || 0}</span>
                            </div>
                            <div class="usage-item">
                                <span>Content Generations:</span>
                                <span>${user.usage?.contentGenerations || 0}</span>
                            </div>
                            <div class="usage-item">
                                <span>Funnel Creations:</span>
                                <span>${user.usage?.funnelCreations || 0}</span>
                            </div>
                            <div class="usage-item">
                                <span>Avatar Generations:</span>
                                <span>${user.usage?.avatarGenerations || 0}</span>
                            </div>
                        </div>
                    </div>
                </div>
            `,
            actions: [
                {
                    text: 'Close',
                    class: 'btn-secondary',
                    onclick: 'uiComponents.closeModal()'
                },
                {
                    text: 'Edit User',
                    class: 'btn-primary',
                    onclick: `AdminPanel.editUser('${userId}'); uiComponents.closeModal();`
                }
            ]
        });
    },

    editUser(userId) {
        const user = adminState.users.find(u => u.id === userId);
        if (!user) return;

        uiComponents.createModal({
            id: 'edit-user-modal',
            title: `Edit User: ${user.fullName}`,
            content: `
                <div class="edit-user-form">
                    <div class="form-group">
                        <label for="edit-user-name">Full Name</label>
                        <input type="text" id="edit-user-name" class="form-input" value="${user.fullName || ''}">
                    </div>
                    <div class="form-group">
                        <label for="edit-user-email">Email</label>
                        <input type="email" id="edit-user-email" class="form-input" value="${user.email}" readonly>
                    </div>
                    <div class="form-group">
                        <label for="edit-user-plan">Plan</label>
                        <select id="edit-user-plan" class="form-select">
                            <option value="free" ${user.plan === 'free' ? 'selected' : ''}>Free</option>
                            <option value="pro" ${user.plan === 'pro' ? 'selected' : ''}>Pro</option>
                            <option value="agency" ${user.plan === 'agency' ? 'selected' : ''}>Agency</option>
                            <option value="enterprise" ${user.plan === 'enterprise' ? 'selected' : ''}>Enterprise</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="edit-user-role">Role</label>
                        <select id="edit-user-role" class="form-select">
                            <option value="user" ${user.role === 'user' ? 'selected' : ''}>User</option>
                            <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="checkbox-label">
                            <input type="checkbox" id="edit-user-active" ${user.isActive ? 'checked' : ''}>
                            <span class="checkmark"></span>
                            <span>Active Account</span>
                        </label>
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
                    onclick: `AdminPanel.saveUserEdit('${userId}'); uiComponents.closeModal();`
                }
            ]
        });
    },

    saveUserEdit(userId) {
        const user = adminState.users.find(u => u.id === userId);
        if (!user) return;

        // Get form values
        user.fullName = document.getElementById('edit-user-name').value;
        user.plan = document.getElementById('edit-user-plan').value;
        user.role = document.getElementById('edit-user-role').value;
        user.isActive = document.getElementById('edit-user-active').checked;

        // Update display
        this.updateUsersDisplay();

        uiComponents.showToast({
            type: 'success',
            message: `User ${user.fullName} updated successfully`
        });
    },

    suspendUser(userId) {
        const user = adminState.users.find(u => u.id === userId);
        if (!user) return;

        if (!confirm(`Are you sure you want to suspend ${user.fullName}?`)) return;

        user.isActive = false;
        this.updateUsersDisplay();

        uiComponents.showToast({
            type: 'warning',
            message: `User ${user.fullName} has been suspended`
        });
    },

    addUser() {
        uiComponents.createModal({
            id: 'add-user-modal',
            title: 'Add New User',
            content: `
                <div class="add-user-form">
                    <div class="form-group">
                        <label for="new-user-name">Full Name</label>
                        <input type="text" id="new-user-name" class="form-input" placeholder="Enter full name">
                    </div>
                    <div class="form-group">
                        <label for="new-user-email">Email</label>
                        <input type="email" id="new-user-email" class="form-input" placeholder="Enter email address">
                    </div>
                    <div class="form-group">
                        <label for="new-user-plan">Plan</label>
                        <select id="new-user-plan" class="form-select">
                            <option value="free">Free</option>
                            <option value="pro">Pro</option>
                            <option value="agency">Agency</option>
                            <option value="enterprise">Enterprise</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="checkbox-label">
                            <input type="checkbox" id="new-user-send-welcome" checked>
                            <span class="checkmark"></span>
                            <span>Send welcome email</span>
                        </label>
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
                    text: 'Add User',
                    class: 'btn-primary',
                    onclick: 'AdminPanel.createNewUser(); uiComponents.closeModal();'
                }
            ]
        });
    },

    createNewUser() {
        const name = document.getElementById('new-user-name').value;
        const email = document.getElementById('new-user-email').value;
        const plan = document.getElementById('new-user-plan').value;
        const sendWelcome = document.getElementById('new-user-send-welcome').checked;

        if (!name || !email) {
            uiComponents.showToast({
                type: 'error',
                message: 'Please fill in all required fields'
            });
            return;
        }

        const newUser = {
            id: `user_${Date.now()}`,
            email,
            fullName: name,
            plan,
            role: 'user',
            isActive: true,
            createdAt: new Date(),
            lastLoginAt: null,
            usage: {
                productDetections: 0,
                contentGenerations: 0,
                funnelCreations: 0,
                avatarGenerations: 0
            }
        };

        adminState.users.unshift(newUser);
        this.updateUsersDisplay();

        uiComponents.showToast({
            type: 'success',
            message: `User ${name} created successfully${sendWelcome ? ' (welcome email sent)' : ''}`
        });
    },

    // Filter and pagination functions
    updateUserFilter(filterType, value) {
        adminState.filters[filterType] = value;
        this.applyUserFilters();
    },

    applyUserFilters() {
        // In a real implementation, this would filter the users
        this.updateUsersDisplay();
    },

    searchUsers(query) {
        // In a real implementation, this would search users
        console.log('Searching users:', query);
    },

    changePage(type, page) {
        if (page < 1) return;
        
        adminState.pagination[type].page = page;
        
        if (type === 'users') {
            this.loadUsers();
        }
    },

    // Settings functions
    handleSettingsSave(event) {
        event.preventDefault();
        
        uiComponents.showToast({
            type: 'success',
            message: 'Settings saved successfully!'
        });
    },

    resetSettings() {
        if (!confirm('Are you sure you want to reset all settings to defaults?')) return;
        
        // Reset form values to defaults
        document.getElementById('platform-name').value = 'AffiliatePro';
        document.getElementById('support-email').value = 'support@affiliatepro.com';
        document.getElementById('maintenance-mode').checked = false;
        document.getElementById('ai-provider').value = 'gemini';
        document.getElementById('ai-temperature').value = '0.7';
        document.getElementById('rate-limit').value = '100';
        
        uiComponents.showToast({
            type: 'info',
            message: 'Settings reset to defaults'
        });
    },

    switchTemplate(templateType) {
        // Update active template tab
        document.querySelectorAll('.template-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[onclick="AdminPanel.switchTemplate('${templateType}')"]`).classList.add('active');
        
        // Load template content
        const templates = {
            welcome: {
                subject: 'Welcome to AffiliatePro!',
                content: `Welcome to AffiliatePro! 

We're excited to have you on board. Get started by exploring our AI-powered tools:

• Product Detector - Find winning products
• Content Generator - Create viral content  
• Funnel Architect - Build converting funnels

Best regards,
The AffiliatePro Team`
            },
            upgrade: {
                subject: 'Upgrade Your AffiliatePro Account',
                content: `Hi there!

You're doing great with AffiliatePro! Ready to unlock even more potential?

Upgrade to Pro and get:
• Unlimited AI generations
• Advanced analytics
• Priority support

Upgrade now: [UPGRADE_LINK]

Best regards,
The AffiliatePro Team`
            },
            reset: {
                subject: 'Reset Your AffiliatePro Password',
                content: `Hi,

Someone requested a password reset for your AffiliatePro account.

Click here to reset your password: [RESET_LINK]

If you didn't request this, please ignore this email.

Best regards,
The AffiliatePro Team`
            }
        };
        
        const template = templates[templateType];
        if (template) {
            document.getElementById('email-subject').value = template.subject;
            document.getElementById('email-content').value = template.content;
        }
    },

    previewEmail() {
        uiComponents.showToast({
            type: 'info',
            message: 'Email preview feature coming soon!'
        });
    },

    saveEmailTemplate() {
        uiComponents.showToast({
            type: 'success',
            message: 'Email template saved successfully!'
        });
    },

    // Export functions
    exportData() {
        uiComponents.showToast({
            type: 'info',
            message: 'Exporting platform data...'
        });
    },

    exportUsers() {
        const csvData = this.convertUsersToCSV(adminState.users);
        const filename = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
        uiComponents.downloadFile(csvData, filename, 'text/csv');

        uiComponents.showToast({
            type: 'success',
            message: 'Users exported successfully!'
        });
    },

    exportAnalytics() {
        uiComponents.showToast({
            type: 'info',
            message: 'Exporting analytics report...'
        });
    },

    exportLogs() {
        uiComponents.showToast({
            type: 'info',
            message: 'Exporting activity logs...'
        });
    },

    // Convert users to CSV
    convertUsersToCSV(users) {
        const headers = [
            'Email', 'Full Name', 'Plan', 'Role', 'Status', 'Created Date', 
            'Last Login', 'Product Detections', 'Content Generations', 
            'Funnel Creations', 'Avatar Generations'
        ];

        const rows = users.map(user => [
            user.email,
            user.fullName || '',
            user.plan,
            user.role,
            user.isActive ? 'Active' : 'Inactive',
            user.createdAt.toLocaleDateString(),
            user.lastLoginAt ? user.lastLoginAt.toLocaleDateString() : 'Never',
            user.usage?.productDetections || 0,
            user.usage?.contentGenerations || 0,
            user.usage?.funnelCreations || 0,
            user.usage?.avatarGenerations || 0
        ]);

        return [headers, ...rows]
            .map(row => row.map(field => `"${field}"`).join(','))
            .join('\n');
    },

    // Utility functions
    updateUsersDisplay() {
        if (adminState.currentSection === 'users') {
            const contentArea = document.getElementById('admin-section-content');
            if (contentArea) {
                contentArea.innerHTML = this.getUsersHTML();
            }
        }
    },

    updateDateRange(range) {
        adminState.filters.dateRange = range;
        this.loadAnalytics();
    },

    refreshData() {
        uiComponents.showToast({
            type: 'info',
            message: 'Refreshing data...'
        });
        
        // Reload current section data
        this.loadSection(adminState.currentSection);
    },

    clearOldLogs() {
        if (!confirm('Are you sure you want to clear logs older than 30 days?')) return;
        
        uiComponents.showToast({
            type: 'success',
            message: 'Old logs cleared successfully'
        });
    },

    // Cleanup
    cleanup() {
        adminState.currentSection = 'overview';
        adminState.isLoading = false;
        console.log('🛡️ Admin Panel cleanup completed');
    }
};

// Export module
export default AdminPanel;

console.log('🛡️ Admin Panel module loaded');