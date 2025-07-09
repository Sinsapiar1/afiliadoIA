/**
 * UI Components - Reusable UI Elements
 * AffiliatePro - AI-Powered Affiliate Marketing Platform
 */

// UI Component Manager
class UIComponents {
    constructor() {
        this.dropdowns = new Map();
        this.modals = new Map();
        this.toasts = [];
        this.tooltips = new Map();
        
        this.init();
    }

    // Initialize UI components
    init() {
        this.initDropdowns();
        this.initModals();
        this.initTooltips();
        this.initThemeToggle();
        this.initLanguageSelector();
        this.initFormValidation();
        this.initPasswordStrength();
        
        console.log('🎨 UI Components initialized');
    }

    // Initialize dropdown components
    initDropdowns() {
        document.addEventListener('click', (event) => {
            const dropdownToggle = event.target.closest('.dropdown-toggle');
            
            if (dropdownToggle) {
                event.preventDefault();
                const dropdown = dropdownToggle.closest('.dropdown');
                this.toggleDropdown(dropdown);
            } else {
                // Close all dropdowns when clicking outside
                this.closeAllDropdowns();
            }
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                this.closeAllDropdowns();
            }
        });
    }

    // Toggle dropdown
    toggleDropdown(dropdownElement) {
        const menu = dropdownElement.querySelector('.dropdown-menu');
        if (!menu) return;

        const isOpen = menu.classList.contains('show');
        
        // Close all other dropdowns
        this.closeAllDropdowns();
        
        if (!isOpen) {
            menu.classList.add('show');
            this.dropdowns.set(dropdownElement, true);
            
            // Position dropdown if needed
            this.positionDropdown(dropdownElement, menu);
        }
    }

    // Close all dropdowns
    closeAllDropdowns() {
        document.querySelectorAll('.dropdown-menu.show').forEach(menu => {
            menu.classList.remove('show');
        });
        this.dropdowns.clear();
    }

    // Position dropdown to prevent overflow
    positionDropdown(dropdown, menu) {
        const rect = dropdown.getBoundingClientRect();
        const menuRect = menu.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;

        // Reset positioning
        menu.style.top = '';
        menu.style.bottom = '';
        menu.style.left = '';
        menu.style.right = '';

        // Check if dropdown would overflow bottom
        if (rect.bottom + menuRect.height > viewportHeight) {
            menu.style.bottom = '100%';
            menu.style.top = 'auto';
        }

        // Check if dropdown would overflow right
        if (rect.right + menuRect.width > viewportWidth) {
            menu.style.right = '0';
            menu.style.left = 'auto';
        }
    }

    // Initialize modal components
    initModals() {
        document.addEventListener('click', (event) => {
            const modalTrigger = event.target.closest('[data-modal]');
            if (modalTrigger) {
                event.preventDefault();
                const modalId = modalTrigger.getAttribute('data-modal');
                this.openModal(modalId);
            }

            const modalClose = event.target.closest('.modal-close, [data-modal-close]');
            if (modalClose) {
                event.preventDefault();
                this.closeModal();
            }
        });

        // Close modal on overlay click
        document.addEventListener('click', (event) => {
            if (event.target.classList.contains('modal-overlay')) {
                this.closeModal();
            }
        });

        // Close modal on Escape key
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                this.closeModal();
            }
        });
    }

    // Create and show modal
    createModal(config) {
        const {
            id,
            title,
            content,
            actions = [],
            size = 'medium',
            closable = true
        } = config;

        const sizeClasses = {
            small: 'max-w-md',
            medium: 'max-w-lg',
            large: 'max-w-2xl',
            xlarge: 'max-w-4xl'
        };

        const modalHTML = `
            <div class="modal ${sizeClasses[size] || sizeClasses.medium}">
                <div class="modal-header">
                    <h3 class="modal-title">${title}</h3>
                    ${closable ? '<button class="modal-close" aria-label="Close modal">×</button>' : ''}
                </div>
                <div class="modal-body">
                    ${content}
                </div>
                ${actions.length > 0 ? `
                    <div class="modal-footer">
                        ${actions.map(action => `
                            <button class="btn ${action.class || 'btn-secondary'}" 
                                    onclick="${action.onclick || ''}" 
                                    ${action.attributes || ''}>
                                ${action.text}
                            </button>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `;

        const overlay = document.getElementById('modal-overlay');
        overlay.innerHTML = modalHTML;
        
        return this.openModal(id);
    }

    // Open modal
    openModal(modalId) {
        const overlay = document.getElementById('modal-overlay');
        if (!overlay) return null;

        overlay.classList.add('show');
        document.body.style.overflow = 'hidden';
        
        // Focus management
        const modal = overlay.querySelector('.modal');
        if (modal) {
            modal.focus();
        }

        this.modals.set(modalId, overlay);
        return overlay;
    }

    // Close modal
    closeModal(modalId = null) {
        const overlay = document.getElementById('modal-overlay');
        if (!overlay) return;

        overlay.classList.remove('show');
        document.body.style.overflow = '';
        
        // Clear modal content after animation
        setTimeout(() => {
            overlay.innerHTML = '';
        }, 300);

        if (modalId) {
            this.modals.delete(modalId);
        } else {
            this.modals.clear();
        }
    }

    // Initialize tooltips
    initTooltips() {
        document.addEventListener('mouseenter', (event) => {
            const element = event.target.closest('[data-tooltip]');
            if (element) {
                this.showTooltip(element);
            }
        });

        document.addEventListener('mouseleave', (event) => {
            const element = event.target.closest('[data-tooltip]');
            if (element) {
                this.hideTooltip(element);
            }
        });
    }

    // Show tooltip
    showTooltip(element) {
        const text = element.getAttribute('data-tooltip');
        const position = element.getAttribute('data-tooltip-position') || 'top';
        
        const tooltip = document.createElement('div');
        tooltip.className = `tooltip tooltip-${position}`;
        tooltip.textContent = text;
        
        document.body.appendChild(tooltip);
        
        const rect = element.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();
        
        let top, left;
        
        switch (position) {
            case 'top':
                top = rect.top - tooltipRect.height - 8;
                left = rect.left + (rect.width - tooltipRect.width) / 2;
                break;
            case 'bottom':
                top = rect.bottom + 8;
                left = rect.left + (rect.width - tooltipRect.width) / 2;
                break;
            case 'left':
                top = rect.top + (rect.height - tooltipRect.height) / 2;
                left = rect.left - tooltipRect.width - 8;
                break;
            case 'right':
                top = rect.top + (rect.height - tooltipRect.height) / 2;
                left = rect.right + 8;
                break;
        }
        
        tooltip.style.top = `${top}px`;
        tooltip.style.left = `${left}px`;
        tooltip.style.opacity = '1';
        
        this.tooltips.set(element, tooltip);
    }

    // Hide tooltip
    hideTooltip(element) {
        const tooltip = this.tooltips.get(element);
        if (tooltip) {
            tooltip.style.opacity = '0';
            setTimeout(() => {
                tooltip.remove();
            }, 200);
            this.tooltips.delete(element);
        }
    }

    // Initialize theme toggle
    initThemeToggle() {
        const themeToggle = document.getElementById('theme-toggle');
        if (!themeToggle) return;

        // Load saved theme
        const savedTheme = localStorage.getItem('theme') || 'light';
        this.setTheme(savedTheme);

        themeToggle.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            this.setTheme(newTheme);
        });
    }

    // Set theme
    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        
        // Update theme toggle icons
        const sunIcon = document.querySelector('.theme-toggle .icon-sun');
        const moonIcon = document.querySelector('.theme-toggle .icon-moon');
        
        if (theme === 'dark') {
            sunIcon?.classList.add('hidden');
            moonIcon?.classList.remove('hidden');
        } else {
            sunIcon?.classList.remove('hidden');
            moonIcon?.classList.add('hidden');
        }
    }

    // Initialize language selector
    initLanguageSelector() {
        const languageDropdown = document.getElementById('language-dropdown');
        if (!languageDropdown) return;

        languageDropdown.addEventListener('click', (event) => {
            const langItem = event.target.closest('[data-lang]');
            if (langItem) {
                event.preventDefault();
                const lang = langItem.getAttribute('data-lang');
                this.setLanguage(lang);
            }
        });
    }

    // Set language
    setLanguage(lang) {
        document.documentElement.setAttribute('lang', lang);
        localStorage.setItem('language', lang);
        
        // Update current language display
        const currentLangElement = document.getElementById('current-language');
        if (currentLangElement) {
            const langMap = { en: 'EN', es: 'ES', pt: 'PT' };
            currentLangElement.textContent = langMap[lang] || 'EN';
        }
        
        // Trigger i18n update if available
        if (window.I18n) {
            window.I18n.setLanguage(lang);
        }
    }

    // Initialize form validation
    initFormValidation() {
        document.addEventListener('submit', (event) => {
            const form = event.target;
            if (form.tagName === 'FORM') {
                const isValid = this.validateForm(form);
                if (!isValid) {
                    event.preventDefault();
                }
            }
        });

        // Real-time validation
        document.addEventListener('blur', (event) => {
            const input = event.target;
            if (input.tagName === 'INPUT' || input.tagName === 'TEXTAREA') {
                this.validateField(input);
            }
        });
    }

    // Validate form
    validateForm(form) {
        let isValid = true;
        const fields = form.querySelectorAll('input, textarea, select');
        
        fields.forEach(field => {
            if (!this.validateField(field)) {
                isValid = false;
            }
        });
        
        return isValid;
    }

    // Validate individual field
    validateField(field) {
        const value = field.value.trim();
        const type = field.type;
        const required = field.hasAttribute('required');
        let isValid = true;
        let errorMessage = '';

        // Required validation
        if (required && !value) {
            isValid = false;
            errorMessage = 'This field is required';
        }
        
        // Type-specific validation
        if (value && !isValid !== false) {
            switch (type) {
                case 'email':
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(value)) {
                        isValid = false;
                        errorMessage = 'Please enter a valid email address';
                    }
                    break;
                    
                case 'password':
                    if (value.length < 6) {
                        isValid = false;
                        errorMessage = 'Password must be at least 6 characters';
                    }
                    break;
                    
                case 'url':
                    try {
                        new URL(value);
                    } catch {
                        isValid = false;
                        errorMessage = 'Please enter a valid URL';
                    }
                    break;
            }
        }
        
        // Custom validation patterns
        const pattern = field.getAttribute('pattern');
        if (pattern && value && !new RegExp(pattern).test(value)) {
            isValid = false;
            errorMessage = field.getAttribute('data-pattern-message') || 'Invalid format';
        }

        // Update field UI
        this.updateFieldValidation(field, isValid, errorMessage);
        
        return isValid;
    }

    // Update field validation UI
    updateFieldValidation(field, isValid, errorMessage) {
        field.classList.toggle('invalid', !isValid);
        field.classList.toggle('valid', isValid);
        
        // Remove existing error message
        const existingError = field.parentNode.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }
        
        // Add error message if invalid
        if (!isValid && errorMessage) {
            const errorElement = document.createElement('div');
            errorElement.className = 'field-error';
            errorElement.textContent = errorMessage;
            field.parentNode.appendChild(errorElement);
        }
    }

    // Initialize password strength indicator
    initPasswordStrength() {
        document.addEventListener('input', (event) => {
            const field = event.target;
            if (field.type === 'password' && field.id === 'register-password') {
                this.updatePasswordStrength(field);
            }
        });
    }

    // Update password strength indicator
    updatePasswordStrength(field) {
        const password = field.value;
        const strengthBar = field.parentNode.querySelector('.strength-fill');
        const strengthText = field.parentNode.querySelector('.strength-text');
        
        if (!strengthBar || !strengthText) return;
        
        // Import password strength checker
        import('./auth.js').then(({ PasswordStrength }) => {
            const result = PasswordStrength.check(password);
            
            // Update strength bar
            strengthBar.style.width = `${(result.score / 5) * 100}%`;
            strengthBar.style.backgroundColor = result.color;
            
            // Update strength text
            strengthText.textContent = result.strength;
            strengthText.style.color = result.color;
        });
    }

    // Toast notification system
    showToast(config) {
        const {
            type = 'info',
            title,
            message,
            duration = 5000,
            actions = []
        } = config;

        const toastId = `toast-${Date.now()}`;
        const toastHTML = `
            <div class="toast ${type}" id="${toastId}">
                <div class="toast-icon">
                    ${this.getToastIcon(type)}
                </div>
                <div class="toast-content">
                    ${title ? `<div class="toast-title">${title}</div>` : ''}
                    <div class="toast-message">${message}</div>
                    ${actions.length > 0 ? `
                        <div class="toast-actions">
                            ${actions.map(action => `
                                <button class="btn btn-sm ${action.class || 'btn-text'}" 
                                        onclick="${action.onclick || ''}">
                                    ${action.text}
                                </button>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
                <button class="toast-close" onclick="uiComponents.closeToast('${toastId}')">
                    ×
                </button>
            </div>
        `;

        const container = document.getElementById('toast-container');
        if (!container) return;

        const toastElement = document.createElement('div');
        toastElement.innerHTML = toastHTML;
        const toast = toastElement.firstElementChild;
        
        container.appendChild(toast);
        
        // Trigger animation
        setTimeout(() => {
            toast.classList.add('show');
        }, 100);

        // Auto-close
        if (duration > 0) {
            setTimeout(() => {
                this.closeToast(toastId);
            }, duration);
        }

        this.toasts.push({ id: toastId, element: toast });
        
        return toastId;
    }

    // Get toast icon
    getToastIcon(type) {
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        return icons[type] || icons.info;
    }

    // Close toast
    closeToast(toastId) {
        const toast = document.getElementById(toastId);
        if (!toast) return;

        toast.classList.remove('show');
        
        setTimeout(() => {
            toast.remove();
            this.toasts = this.toasts.filter(t => t.id !== toastId);
        }, 300);
    }

    // Loading state utilities
    showLoading(element, text = 'Loading...') {
        if (typeof element === 'string') {
            element = document.getElementById(element);
        }
        
        if (!element) return;
        
        element.setAttribute('data-original-content', element.innerHTML);
        element.innerHTML = `
            <div class="loading-state">
                <div class="spinner"></div>
                <span>${text}</span>
            </div>
        `;
        element.classList.add('loading');
    }

    hideLoading(element) {
        if (typeof element === 'string') {
            element = document.getElementById(element);
        }
        
        if (!element) return;
        
        const originalContent = element.getAttribute('data-original-content');
        if (originalContent) {
            element.innerHTML = originalContent;
            element.removeAttribute('data-original-content');
        }
        element.classList.remove('loading');
    }

    // Copy to clipboard utility
    async copyToClipboard(text, showNotification = true) {
        try {
            await navigator.clipboard.writeText(text);
            if (showNotification) {
                this.showToast({
                    type: 'success',
                    message: 'Copied to clipboard!'
                });
            }
            return true;
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);
            if (showNotification) {
                this.showToast({
                    type: 'error',
                    message: 'Failed to copy to clipboard'
                });
            }
            return false;
        }
    }

    // Download file utility
    downloadFile(content, filename, mimeType = 'text/plain') {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
    }

    // Format currency
    formatCurrency(amount, currency = 'USD', locale = 'en-US') {
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: currency
        }).format(amount);
    }

    // Format number
    formatNumber(number, locale = 'en-US') {
        return new Intl.NumberFormat(locale).format(number);
    }

    // Format date
    formatDate(date, options = {}, locale = 'en-US') {
        const defaultOptions = {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        };
        
        return new Intl.DateTimeFormat(locale, { ...defaultOptions, ...options })
            .format(new Date(date));
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

    // Throttle utility
    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
}

// Initialize UI components
const uiComponents = new UIComponents();

// Global access
window.uiComponents = uiComponents;

// Export UI components
export default uiComponents;

console.log('🎨 UI Components system initialized');