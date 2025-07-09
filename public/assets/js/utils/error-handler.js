/**
 * Error Handler Utility
 * AffiliatePro - AI-Powered Affiliate Marketing Platform
 */

import config from '../config/environment.js';

// Error types
export const ERROR_TYPES = {
    NETWORK: 'NETWORK_ERROR',
    AUTH: 'AUTH_ERROR',
    VALIDATION: 'VALIDATION_ERROR',
    API: 'API_ERROR',
    FIREBASE: 'FIREBASE_ERROR',
    UNKNOWN: 'UNKNOWN_ERROR'
};

// Error severity levels
export const ERROR_SEVERITY = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    CRITICAL: 'critical'
};

// Error handler class
class ErrorHandler {
    constructor() {
        this.errorLog = [];
        this.maxLogSize = 100;
        this.isInitialized = false;
    }

    // Initialize error handler
    init() {
        if (this.isInitialized) return;

        // Global error handlers
        window.addEventListener('error', (event) => {
            this.handleError(event.error, {
                type: ERROR_TYPES.UNKNOWN,
                severity: ERROR_SEVERITY.MEDIUM,
                context: 'Global Error Handler',
                file: event.filename,
                line: event.lineno,
                column: event.colno
            });
        });

        // Unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.handleError(event.reason, {
                type: ERROR_TYPES.UNKNOWN,
                severity: ERROR_SEVERITY.HIGH,
                context: 'Unhandled Promise Rejection'
            });
        });

        // Network errors
        window.addEventListener('offline', () => {
            this.handleError(new Error('Network connection lost'), {
                type: ERROR_TYPES.NETWORK,
                severity: ERROR_SEVERITY.MEDIUM,
                context: 'Network Status'
            });
        });

        this.isInitialized = true;
        console.log('✅ Error handler initialized');
    }

    // Handle errors
    handleError(error, options = {}) {
        const errorInfo = {
            message: error.message || 'Unknown error',
            stack: error.stack,
            timestamp: new Date().toISOString(),
            type: options.type || ERROR_TYPES.UNKNOWN,
            severity: options.severity || ERROR_SEVERITY.MEDIUM,
            context: options.context || 'Unknown',
            userAgent: navigator.userAgent,
            url: window.location.href,
            ...options
        };

        // Log error
        this.logError(errorInfo);

        // Show user-friendly message
        this.showUserMessage(errorInfo);

        // Report to analytics if critical
        if (errorInfo.severity === ERROR_SEVERITY.CRITICAL) {
            this.reportToAnalytics(errorInfo);
        }

        // Console output for development
        if (config.isDevelopment) {
            console.error('🚨 Error:', errorInfo);
        }

        return errorInfo;
    }

    // Log error to memory
    logError(errorInfo) {
        this.errorLog.push(errorInfo);

        // Keep log size manageable
        if (this.errorLog.length > this.maxLogSize) {
            this.errorLog.shift();
        }

        // Store in localStorage for persistence
        try {
            localStorage.setItem('affiliatePro_errorLog', JSON.stringify(this.errorLog.slice(-20)));
        } catch (e) {
            console.warn('Could not save error log to localStorage');
        }
    }

    // Show user-friendly error message
    showUserMessage(errorInfo) {
        const messages = {
            [ERROR_TYPES.NETWORK]: {
                title: 'Connection Error',
                message: 'Please check your internet connection and try again.',
                action: 'Retry'
            },
            [ERROR_TYPES.AUTH]: {
                title: 'Authentication Error',
                message: 'Please sign in again to continue.',
                action: 'Sign In'
            },
            [ERROR_TYPES.VALIDATION]: {
                title: 'Invalid Input',
                message: 'Please check your input and try again.',
                action: 'OK'
            },
            [ERROR_TYPES.API]: {
                title: 'Service Temporarily Unavailable',
                message: 'We\'re experiencing technical difficulties. Please try again later.',
                action: 'Retry'
            },
            [ERROR_TYPES.FIREBASE]: {
                title: 'Database Error',
                message: 'Unable to save your data. Please try again.',
                action: 'Retry'
            },
            [ERROR_TYPES.UNKNOWN]: {
                title: 'Something went wrong',
                message: 'An unexpected error occurred. Please try again.',
                action: 'OK'
            }
        };

        const messageConfig = messages[errorInfo.type] || messages[ERROR_TYPES.UNKNOWN];

        // Show toast notification
        this.showToast(messageConfig.title, messageConfig.message, 'error');

        // Show modal for critical errors
        if (errorInfo.severity === ERROR_SEVERITY.CRITICAL) {
            this.showErrorModal(messageConfig);
        }
    }

    // Show toast notification
    showToast(title, message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-header">
                <h4>${title}</h4>
                <button class="toast-close">&times;</button>
            </div>
            <div class="toast-body">
                <p>${message}</p>
            </div>
        `;

        const container = document.getElementById('toast-container');
        if (container) {
            container.appendChild(toast);

            // Auto remove after 5 seconds
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.remove();
                }
            }, 5000);

            // Close button handler
            const closeBtn = toast.querySelector('.toast-close');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => toast.remove());
            }
        }
    }

    // Show error modal
    showErrorModal(config) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h3>${config.title}</h3>
                </div>
                <div class="modal-body">
                    <p>${config.message}</p>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-primary" onclick="this.closest('.modal-overlay').remove()">
                        ${config.action}
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    }

    // Report error to analytics
    reportToAnalytics(errorInfo) {
        // Google Analytics
        if (window.gtag && config.analytics.googleAnalyticsId) {
            window.gtag('event', 'exception', {
                description: errorInfo.message,
                fatal: errorInfo.severity === ERROR_SEVERITY.CRITICAL
            });
        }

        // Custom analytics endpoint
        if (config.analytics.enabled) {
            fetch('/api/analytics/error', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(errorInfo)
            }).catch(() => {
                // Silently fail if analytics endpoint is not available
            });
        }
    }

    // Get error log
    getErrorLog() {
        return [...this.errorLog];
    }

    // Clear error log
    clearErrorLog() {
        this.errorLog = [];
        localStorage.removeItem('affiliatePro_errorLog');
    }

    // Create specific error handlers
    createNetworkErrorHandler() {
        return (error) => this.handleError(error, {
            type: ERROR_TYPES.NETWORK,
            severity: ERROR_SEVERITY.MEDIUM,
            context: 'Network Request'
        });
    }

    createAuthErrorHandler() {
        return (error) => this.handleError(error, {
            type: ERROR_TYPES.AUTH,
            severity: ERROR_SEVERITY.HIGH,
            context: 'Authentication'
        });
    }

    createValidationErrorHandler() {
        return (error) => this.handleError(error, {
            type: ERROR_TYPES.VALIDATION,
            severity: ERROR_SEVERITY.LOW,
            context: 'Form Validation'
        });
    }

    createAPIErrorHandler() {
        return (error) => this.handleError(error, {
            type: ERROR_TYPES.API,
            severity: ERROR_SEVERITY.MEDIUM,
            context: 'API Request'
        });
    }

    createFirebaseErrorHandler() {
        return (error) => this.handleError(error, {
            type: ERROR_TYPES.FIREBASE,
            severity: ERROR_SEVERITY.HIGH,
            context: 'Firebase Operation'
        });
    }
}

// Create singleton instance
const errorHandler = new ErrorHandler();

// Export functions
export const handleError = (error, options) => errorHandler.handleError(error, options);
export const showToast = (title, message, type) => errorHandler.showToast(title, message, type);
export const getErrorLog = () => errorHandler.getErrorLog();
export const clearErrorLog = () => errorHandler.clearErrorLog();

// Export specific handlers
export const networkErrorHandler = () => errorHandler.createNetworkErrorHandler();
export const authErrorHandler = () => errorHandler.createAuthErrorHandler();
export const validationErrorHandler = () => errorHandler.createValidationErrorHandler();
export const apiErrorHandler = () => errorHandler.createAPIErrorHandler();
export const firebaseErrorHandler = () => errorHandler.createFirebaseErrorHandler();

// Initialize on import
errorHandler.init();

export default errorHandler;