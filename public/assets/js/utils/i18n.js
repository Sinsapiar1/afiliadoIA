/**
 * Internationalization System
 * AffiliatePro - AI-Powered Affiliate Marketing Platform
 */

// Supported languages
const SUPPORTED_LANGUAGES = {
    en: 'English',
    es: 'Español',
    pt: 'Português'
};

// Default language
const DEFAULT_LANGUAGE = 'en';

// Translation storage
const translations = new Map();

// Current language
let currentLanguage = DEFAULT_LANGUAGE;

// Translation cache
const translationCache = new Map();

// Internationalization class
class I18n {
    constructor() {
        this.isInitialized = false;
        this.loadingPromises = new Map();
        this.observers = [];
        
        // Initialize
        this.init();
    }

    // Initialize i18n system
    async init() {
        try {
            // Load saved language preference
            const savedLanguage = localStorage.getItem('language') || 
                                 this.detectBrowserLanguage() || 
                                 DEFAULT_LANGUAGE;
            
            // Set initial language
            await this.setLanguage(savedLanguage, false);
            
            // Setup DOM observer for dynamic content
            this.setupDOMObserver();
            
            this.isInitialized = true;
            console.log('🌍 Internationalization system initialized');
            
        } catch (error) {
            console.error('❌ Failed to initialize i18n:', error);
        }
    }

    // Detect browser language
    detectBrowserLanguage() {
        const browserLang = navigator.language || navigator.userLanguage;
        const langCode = browserLang.substring(0, 2);
        
        return SUPPORTED_LANGUAGES[langCode] ? langCode : DEFAULT_LANGUAGE;
    }

    // Load translations for a language
    async loadTranslations(language) {
        if (translations.has(language)) {
            return translations.get(language);
        }

        // Check if already loading
        if (this.loadingPromises.has(language)) {
            return this.loadingPromises.get(language);
        }

        // Create loading promise
        const loadingPromise = this.fetchTranslations(language);
        this.loadingPromises.set(language, loadingPromise);

        try {
            const translationData = await loadingPromise;
            translations.set(language, translationData);
            this.loadingPromises.delete(language);
            
            console.log(`✅ Translations loaded for: ${language}`);
            return translationData;
            
        } catch (error) {
            this.loadingPromises.delete(language);
            console.error(`❌ Failed to load translations for ${language}:`, error);
            
            // Fall back to default language if available
            if (language !== DEFAULT_LANGUAGE && translations.has(DEFAULT_LANGUAGE)) {
                return translations.get(DEFAULT_LANGUAGE);
            }
            
            throw error;
        }
    }

    // Fetch translations from server/local files
    async fetchTranslations(language) {
        try {
            // Try to load from local files first
            const response = await fetch(`./locales/${language}.json`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            return await response.json();
            
        } catch (error) {
            console.warn(`⚠️ Could not load ${language}.json, using fallback translations`);
            
            // Return embedded fallback translations
            return this.getFallbackTranslations(language);
        }
    }

    // Get fallback translations
    getFallbackTranslations(language) {
        const fallbackTranslations = {
            en: {
                // Common
                loading: 'Loading...',
                error: 'Error',
                success: 'Success',
                warning: 'Warning',
                info: 'Info',
                save: 'Save',
                cancel: 'Cancel',
                delete: 'Delete',
                edit: 'Edit',
                create: 'Create',
                update: 'Update',
                back: 'Back',
                next: 'Next',
                previous: 'Previous',
                close: 'Close',
                yes: 'Yes',
                no: 'No',
                
                // Auth
                login: {
                    subtitle: 'Welcome back! Sign in to your account',
                    email: 'Email',
                    password: 'Password',
                    remember: 'Remember me',
                    forgot: 'Forgot password?',
                    signin: 'Sign In',
                    no_account: "Don't have an account?",
                    signup: 'Sign up'
                },
                register: {
                    subtitle: 'Create your account and start earning',
                    name: 'Full Name',
                    email: 'Email',
                    password: 'Password',
                    terms: 'I agree to the Terms of Service and Privacy Policy',
                    create: 'Create Account',
                    have_account: 'Already have an account?',
                    signin: 'Sign in'
                },
                
                // Navigation
                nav: {
                    dashboard: 'Dashboard',
                    products: 'Product Detector',
                    content: 'Content Generator',
                    funnels: 'Funnel Architect',
                    calculator: 'Profit Calculator',
                    avatar: 'Avatar Generator',
                    account: 'Account',
                    profile: 'Profile',
                    admin: 'Admin Panel'
                },
                
                // Dashboard
                dashboard: {
                    title: 'Dashboard',
                    subtitle: "Welcome back! Here's what's happening with your affiliate business.",
                    stats: {
                        revenue: 'Total Revenue',
                        products: 'Products Detected',
                        content: 'Content Generated',
                        funnels: 'Active Funnels'
                    }
                },
                
                // Product Detector
                products: {
                    title: 'Product Detector',
                    subtitle: 'Discover winning products with AI-powered analysis.',
                    detect_button: 'Detect Products',
                    analyzing: 'Analyzing products...',
                    no_results: 'No products found. Try adjusting your criteria.',
                    filters: {
                        category: 'Category',
                        price_range: 'Price Range',
                        popularity: 'Popularity'
                    }
                },
                
                // Content Generator
                content: {
                    title: 'Content Generator',
                    subtitle: 'Create viral content for all your marketing channels.',
                    generate_button: 'Generate Content',
                    platform: 'Platform',
                    tone: 'Tone',
                    length: 'Length',
                    generating: 'Generating content...'
                },
                
                // User Menu
                user_menu: {
                    profile: 'Profile',
                    settings: 'Settings',
                    help: 'Help & Support',
                    logout: 'Sign Out'
                },
                
                // Notifications
                notifications: {
                    title: 'Notifications',
                    mark_read: 'Mark all as read'
                },
                
                // Upgrade
                upgrade: {
                    title: 'Upgrade to Pro',
                    subtitle: 'Unlock unlimited features',
                    button: 'Upgrade Now'
                },
                
                // Header
                header: {
                    theme_toggle: 'Toggle theme'
                }
            },
            
            es: {
                // Common
                loading: 'Cargando...',
                error: 'Error',
                success: 'Éxito',
                warning: 'Advertencia',
                info: 'Información',
                save: 'Guardar',
                cancel: 'Cancelar',
                delete: 'Eliminar',
                edit: 'Editar',
                create: 'Crear',
                update: 'Actualizar',
                back: 'Atrás',
                next: 'Siguiente',
                previous: 'Anterior',
                close: 'Cerrar',
                yes: 'Sí',
                no: 'No',
                
                // Auth
                login: {
                    subtitle: '¡Bienvenido de nuevo! Inicia sesión en tu cuenta',
                    email: 'Correo electrónico',
                    password: 'Contraseña',
                    remember: 'Recordarme',
                    forgot: '¿Olvidaste tu contraseña?',
                    signin: 'Iniciar Sesión',
                    no_account: '¿No tienes una cuenta?',
                    signup: 'Regístrate'
                },
                register: {
                    subtitle: 'Crea tu cuenta y comienza a ganar',
                    name: 'Nombre Completo',
                    email: 'Correo Electrónico',
                    password: 'Contraseña',
                    terms: 'Acepto los Términos de Servicio y Política de Privacidad',
                    create: 'Crear Cuenta',
                    have_account: '¿Ya tienes una cuenta?',
                    signin: 'Iniciar sesión'
                },
                
                // Navigation
                nav: {
                    dashboard: 'Panel de Control',
                    products: 'Detector de Productos',
                    content: 'Generador de Contenido',
                    funnels: 'Arquitecto de Funnels',
                    calculator: 'Calculadora de Ganancias',
                    avatar: 'Generador de Avatares',
                    account: 'Cuenta',
                    profile: 'Perfil',
                    admin: 'Panel de Administración'
                },
                
                // Dashboard
                dashboard: {
                    title: 'Panel de Control',
                    subtitle: '¡Bienvenido de nuevo! Esto es lo que está pasando con tu negocio de afiliados.',
                    stats: {
                        revenue: 'Ingresos Totales',
                        products: 'Productos Detectados',
                        content: 'Contenido Generado',
                        funnels: 'Funnels Activos'
                    }
                },
                
                // Product Detector
                products: {
                    title: 'Detector de Productos',
                    subtitle: 'Descubre productos ganadores con análisis impulsado por IA.',
                    detect_button: 'Detectar Productos',
                    analyzing: 'Analizando productos...',
                    no_results: 'No se encontraron productos. Intenta ajustar tus criterios.',
                    filters: {
                        category: 'Categoría',
                        price_range: 'Rango de Precio',
                        popularity: 'Popularidad'
                    }
                },
                
                // Content Generator
                content: {
                    title: 'Generador de Contenido',
                    subtitle: 'Crea contenido viral para todos tus canales de marketing.',
                    generate_button: 'Generar Contenido',
                    platform: 'Plataforma',
                    tone: 'Tono',
                    length: 'Longitud',
                    generating: 'Generando contenido...'
                },
                
                // User Menu
                user_menu: {
                    profile: 'Perfil',
                    settings: 'Configuración',
                    help: 'Ayuda y Soporte',
                    logout: 'Cerrar Sesión'
                },
                
                // Notifications
                notifications: {
                    title: 'Notificaciones',
                    mark_read: 'Marcar todas como leídas'
                },
                
                // Upgrade
                upgrade: {
                    title: 'Actualizar a Pro',
                    subtitle: 'Desbloquea funciones ilimitadas',
                    button: 'Actualizar Ahora'
                },
                
                // Header
                header: {
                    theme_toggle: 'Cambiar tema'
                }
            },
            
            pt: {
                // Common
                loading: 'Carregando...',
                error: 'Erro',
                success: 'Sucesso',
                warning: 'Aviso',
                info: 'Informação',
                save: 'Salvar',
                cancel: 'Cancelar',
                delete: 'Excluir',
                edit: 'Editar',
                create: 'Criar',
                update: 'Atualizar',
                back: 'Voltar',
                next: 'Próximo',
                previous: 'Anterior',
                close: 'Fechar',
                yes: 'Sim',
                no: 'Não',
                
                // Auth
                login: {
                    subtitle: 'Bem-vindo de volta! Entre na sua conta',
                    email: 'E-mail',
                    password: 'Senha',
                    remember: 'Lembrar de mim',
                    forgot: 'Esqueceu a senha?',
                    signin: 'Entrar',
                    no_account: 'Não tem uma conta?',
                    signup: 'Cadastre-se'
                },
                register: {
                    subtitle: 'Crie sua conta e comece a ganhar',
                    name: 'Nome Completo',
                    email: 'E-mail',
                    password: 'Senha',
                    terms: 'Concordo com os Termos de Serviço e Política de Privacidade',
                    create: 'Criar Conta',
                    have_account: 'Já tem uma conta?',
                    signin: 'Entrar'
                },
                
                // Navigation
                nav: {
                    dashboard: 'Painel',
                    products: 'Detector de Produtos',
                    content: 'Gerador de Conteúdo',
                    funnels: 'Arquiteto de Funis',
                    calculator: 'Calculadora de Lucros',
                    avatar: 'Gerador de Avatares',
                    account: 'Conta',
                    profile: 'Perfil',
                    admin: 'Painel Admin'
                },
                
                // Dashboard
                dashboard: {
                    title: 'Painel',
                    subtitle: 'Bem-vindo de volta! Veja o que está acontecendo com seu negócio de afiliados.',
                    stats: {
                        revenue: 'Receita Total',
                        products: 'Produtos Detectados',
                        content: 'Conteúdo Gerado',
                        funnels: 'Funis Ativos'
                    }
                },
                
                // Product Detector
                products: {
                    title: 'Detector de Produtos',
                    subtitle: 'Descubra produtos vencedores com análise impulsionada por IA.',
                    detect_button: 'Detectar Produtos',
                    analyzing: 'Analisando produtos...',
                    no_results: 'Nenhum produto encontrado. Tente ajustar seus critérios.',
                    filters: {
                        category: 'Categoria',
                        price_range: 'Faixa de Preço',
                        popularity: 'Popularidade'
                    }
                },
                
                // Content Generator
                content: {
                    title: 'Gerador de Conteúdo',
                    subtitle: 'Crie conteúdo viral para todos os seus canais de marketing.',
                    generate_button: 'Gerar Conteúdo',
                    platform: 'Plataforma',
                    tone: 'Tom',
                    length: 'Comprimento',
                    generating: 'Gerando conteúdo...'
                },
                
                // User Menu
                user_menu: {
                    profile: 'Perfil',
                    settings: 'Configurações',
                    help: 'Ajuda e Suporte',
                    logout: 'Sair'
                },
                
                // Notifications
                notifications: {
                    title: 'Notificações',
                    mark_read: 'Marcar todas como lidas'
                },
                
                // Upgrade
                upgrade: {
                    title: 'Atualizar para Pro',
                    subtitle: 'Desbloqueie recursos ilimitados',
                    button: 'Atualizar Agora'
                },
                
                // Header
                header: {
                    theme_toggle: 'Alternar tema'
                }
            }
        };

        return fallbackTranslations[language] || fallbackTranslations[DEFAULT_LANGUAGE];
    }

    // Set current language
    async setLanguage(language, updateDOM = true) {
        if (!SUPPORTED_LANGUAGES[language]) {
            console.warn(`⚠️ Unsupported language: ${language}, falling back to ${DEFAULT_LANGUAGE}`);
            language = DEFAULT_LANGUAGE;
        }

        try {
            // Load translations for the new language
            await this.loadTranslations(language);
            
            // Update current language
            currentLanguage = language;
            
            // Save to localStorage
            localStorage.setItem('language', language);
            
            // Update document language
            document.documentElement.setAttribute('lang', language);
            
            // Update DOM if requested
            if (updateDOM) {
                this.translateDOM();
            }
            
            // Notify observers
            this.notifyObservers(language);
            
            console.log(`🌍 Language changed to: ${language}`);
            
        } catch (error) {
            console.error(`❌ Failed to set language to ${language}:`, error);
            throw error;
        }
    }

    // Get current language
    getCurrentLanguage() {
        return currentLanguage;
    }

    // Get supported languages
    getSupportedLanguages() {
        return { ...SUPPORTED_LANGUAGES };
    }

    // Translate a key
    translate(key, params = {}, fallback = null) {
        const cacheKey = `${currentLanguage}:${key}:${JSON.stringify(params)}`;
        
        // Check cache first
        if (translationCache.has(cacheKey)) {
            return translationCache.get(cacheKey);
        }

        const currentTranslations = translations.get(currentLanguage);
        if (!currentTranslations) {
            console.warn(`⚠️ No translations loaded for language: ${currentLanguage}`);
            return fallback || key;
        }

        // Navigate through nested keys
        const keys = key.split('.');
        let value = currentTranslations;

        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                value = null;
                break;
            }
        }

        // If no translation found, try fallback language
        if (value === null && currentLanguage !== DEFAULT_LANGUAGE) {
            const defaultTranslations = translations.get(DEFAULT_LANGUAGE);
            if (defaultTranslations) {
                value = defaultTranslations;
                for (const k of keys) {
                    if (value && typeof value === 'object' && k in value) {
                        value = value[k];
                    } else {
                        value = null;
                        break;
                    }
                }
            }
        }

        // Use fallback or key if still no translation
        if (value === null || value === undefined) {
            value = fallback || key;
        }

        // Handle string interpolation
        if (typeof value === 'string' && Object.keys(params).length > 0) {
            value = this.interpolate(value, params);
        }

        // Cache the result
        translationCache.set(cacheKey, value);

        return value;
    }

    // Interpolate parameters in translation string
    interpolate(text, params) {
        return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
            return params.hasOwnProperty(key) ? params[key] : match;
        });
    }

    // Translate the entire DOM
    translateDOM() {
        const elements = document.querySelectorAll('[data-i18n]');
        
        elements.forEach(element => {
            const key = element.getAttribute('data-i18n');
            const params = this.getElementParams(element);
            const translation = this.translate(key, params);
            
            // Update element content
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                if (element.type === 'submit' || element.type === 'button') {
                    element.value = translation;
                } else {
                    element.placeholder = translation;
                }
            } else {
                element.textContent = translation;
            }
        });

        // Translate title attributes
        const titleElements = document.querySelectorAll('[data-i18n-title]');
        titleElements.forEach(element => {
            const key = element.getAttribute('data-i18n-title');
            const translation = this.translate(key);
            element.setAttribute('title', translation);
        });

        // Clear cache for next translation
        translationCache.clear();
    }

    // Get interpolation parameters from element
    getElementParams(element) {
        const params = {};
        const paramAttrs = Array.from(element.attributes)
            .filter(attr => attr.name.startsWith('data-i18n-param-'));
        
        paramAttrs.forEach(attr => {
            const paramName = attr.name.replace('data-i18n-param-', '');
            params[paramName] = attr.value;
        });
        
        return params;
    }

    // Setup DOM observer for dynamic content
    setupDOMObserver() {
        if (typeof MutationObserver === 'undefined') return;

        const observer = new MutationObserver((mutations) => {
            let shouldTranslate = false;
            
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            if (node.hasAttribute && node.hasAttribute('data-i18n')) {
                                shouldTranslate = true;
                            }
                            if (node.querySelectorAll && node.querySelectorAll('[data-i18n]').length > 0) {
                                shouldTranslate = true;
                            }
                        }
                    });
                }
            });
            
            if (shouldTranslate) {
                // Debounce translation updates
                this.debouncedTranslateDOM();
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // Debounced DOM translation
    debouncedTranslateDOM() {
        if (this.translateTimeout) {
            clearTimeout(this.translateTimeout);
        }
        
        this.translateTimeout = setTimeout(() => {
            this.translateDOM();
        }, 100);
    }

    // Add language change observer
    addObserver(callback) {
        this.observers.push(callback);
        
        // Return unsubscribe function
        return () => {
            const index = this.observers.indexOf(callback);
            if (index > -1) {
                this.observers.splice(index, 1);
            }
        };
    }

    // Notify observers of language change
    notifyObservers(language) {
        this.observers.forEach(callback => {
            try {
                callback(language);
            } catch (error) {
                console.error('❌ I18n observer error:', error);
            }
        });
    }

    // Format number with localization
    formatNumber(number, options = {}) {
        const locale = this.getLocale(currentLanguage);
        return new Intl.NumberFormat(locale, options).format(number);
    }

    // Format currency with localization
    formatCurrency(amount, currency = 'USD', options = {}) {
        const locale = this.getLocale(currentLanguage);
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: currency,
            ...options
        }).format(amount);
    }

    // Format date with localization
    formatDate(date, options = {}) {
        const locale = this.getLocale(currentLanguage);
        return new Intl.DateTimeFormat(locale, options).format(new Date(date));
    }

    // Get locale from language
    getLocale(language) {
        const localeMap = {
            en: 'en-US',
            es: 'es-ES',
            pt: 'pt-BR'
        };
        return localeMap[language] || localeMap[DEFAULT_LANGUAGE];
    }

    // Check if language is RTL
    isRTL(language = currentLanguage) {
        const rtlLanguages = ['ar', 'he', 'fa', 'ur'];
        return rtlLanguages.includes(language);
    }

    // Get text direction
    getTextDirection(language = currentLanguage) {
        return this.isRTL(language) ? 'rtl' : 'ltr';
    }
}

// Create global instance
const i18n = new I18n();

// Global helper functions
window.t = (key, params, fallback) => i18n.translate(key, params, fallback);
window.I18n = i18n;

// Export i18n instance and utilities
export default i18n;
export { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE };

console.log('🌍 Internationalization system loaded');