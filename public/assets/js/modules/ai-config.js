/**
 * AI Configuration Module
 * AffiliatePro - Personal API Key Management
 */

import authManager from '../core/auth.js';
import uiComponents from '../components/ui-components.js';

class AIConfigManager {
    constructor() {
        this.userApiKeys = {};
        this.init();
    }

    async init() {
        // Load user API keys from localStorage or user profile
        this.loadUserApiKeys();
        
        // Setup event listeners
        this.setupEventListeners();
    }

    // Load user API keys
    loadUserApiKeys() {
        try {
            const user = authManager.getCurrentUser();
            if (user) {
                // Load from localStorage for now (can be moved to Firestore later)
                const savedKeys = localStorage.getItem(`ai_keys_${user.uid}`);
                if (savedKeys) {
                    this.userApiKeys = JSON.parse(savedKeys);
                }
            }
        } catch (error) {
            console.error('Error loading user API keys:', error);
        }
    }

    // Save user API keys
    saveUserApiKeys() {
        try {
            const user = authManager.getCurrentUser();
            if (user) {
                localStorage.setItem(`ai_keys_${user.uid}`, JSON.stringify(this.userApiKeys));
                console.log('✅ API keys saved successfully');
            }
        } catch (error) {
            console.error('Error saving user API keys:', error);
        }
    }

    // Get user's API key for a specific service
    getUserApiKey(service) {
        return this.userApiKeys[service] || null;
    }

    // Set user's API key for a specific service
    setUserApiKey(service, apiKey) {
        this.userApiKeys[service] = apiKey;
        this.saveUserApiKeys();
    }

    // Remove user's API key for a specific service
    removeUserApiKey(service) {
        delete this.userApiKeys[service];
        this.saveUserApiKeys();
    }

    // Check if user has configured API key
    hasApiKey(service) {
        return !!(this.userApiKeys[service] && this.userApiKeys[service].trim());
    }

    // Validate API key format
    validateApiKey(service, apiKey) {
        if (!apiKey || !apiKey.trim()) {
            return { valid: false, message: 'API key is required' };
        }

        switch (service) {
            case 'gemini':
                if (!apiKey.startsWith('AIzaSy')) {
                    return { valid: false, message: 'Invalid Google AI Studio API key format' };
                }
                break;
            case 'openai':
                if (!apiKey.startsWith('sk-')) {
                    return { valid: false, message: 'Invalid OpenAI API key format' };
                }
                break;
            default:
                return { valid: false, message: 'Unknown service' };
        }

        return { valid: true, message: 'API key format is valid' };
    }

    // Test API key with actual API call
    async testApiKey(service, apiKey) {
        try {
            switch (service) {
                case 'gemini':
                    return await this.testGeminiApiKey(apiKey);
                case 'openai':
                    return await this.testOpenAIApiKey(apiKey);
                default:
                    return { valid: false, message: 'Unknown service' };
            }
        } catch (error) {
            return { valid: false, message: `Error testing API key: ${error.message}` };
        }
    }

    // Test Gemini API key
    async testGeminiApiKey(apiKey) {
        try {
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${apiKey}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{
                                text: "Hello, this is a test message. Please respond with 'API key working'."
                            }]
                        }]
                    })
                }
            );

            if (response.ok) {
                return { valid: true, message: 'Gemini API key is working correctly' };
            } else {
                const error = await response.json();
                return { valid: false, message: `API key test failed: ${error.error?.message || 'Unknown error'}` };
            }
        } catch (error) {
            return { valid: false, message: `Network error: ${error.message}` };
        }
    }

    // Test OpenAI API key
    async testOpenAIApiKey(apiKey) {
        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-3.5-turbo',
                    messages: [{
                        role: 'user',
                        content: 'Hello, this is a test message. Please respond with API key working.'
                    }],
                    max_tokens: 10
                })
            });

            if (response.ok) {
                return { valid: true, message: 'OpenAI API key is working correctly' };
            } else {
                const error = await response.json();
                return { valid: false, message: `API key test failed: ${error.error?.message || 'Unknown error'}` };
            }
        } catch (error) {
            return { valid: false, message: `Network error: ${error.message}` };
        }
    }

    // Show API configuration modal
    showApiConfigModal() {
        const currentGeminiKey = this.getUserApiKey('gemini') || '';
        const currentOpenAIKey = this.getUserApiKey('openai') || '';

        uiComponents.createModal({
            id: 'api-config-modal',
            title: '🔑 Configure Your AI API Keys',
            size: 'large',
            content: `
                <div class="api-config-content">
                    <div class="api-config-intro">
                        <p>Configure your personal AI API keys to use the AI features. Each user needs their own API keys.</p>
                        <div class="api-config-benefits">
                            <h4>Benefits of personal API keys:</h4>
                            <ul>
                                <li>✅ Your own usage quotas</li>
                                <li>✅ Better performance</li>
                                <li>✅ Full control over costs</li>
                                <li>✅ Privacy and security</li>
                            </ul>
                        </div>
                    </div>

                    <div class="api-service-config">
                        <h3>🤖 Google AI Studio (Gemini)</h3>
                        <p>Required for product detection and content generation</p>
                        <div class="form-group">
                            <label for="gemini-api-key">API Key</label>
                            <input type="password" id="gemini-api-key" class="form-input" 
                                   placeholder="AIzaSy..." value="${currentGeminiKey}">
                            <div class="form-help">
                                <a href="https://makersuite.google.com/app/apikey" target="_blank">
                                    Get your free API key from Google AI Studio →
                                </a>
                            </div>
                        </div>
                        <button class="btn btn-secondary btn-sm" onclick="aiConfig.testApiKey('gemini')">
                            Test Gemini API Key
                        </button>
                    </div>

                    <div class="api-service-config">
                        <h3>🎯 OpenAI (Optional)</h3>
                        <p>Alternative AI provider for content generation</p>
                        <div class="form-group">
                            <label for="openai-api-key">API Key</label>
                            <input type="password" id="openai-api-key" class="form-input" 
                                   placeholder="sk-..." value="${currentOpenAIKey}">
                            <div class="form-help">
                                <a href="https://platform.openai.com/api-keys" target="_blank">
                                    Get your API key from OpenAI →
                                </a>
                            </div>
                        </div>
                        <button class="btn btn-secondary btn-sm" onclick="aiConfig.testApiKey('openai')">
                            Test OpenAI API Key
                        </button>
                    </div>

                    <div class="api-config-status" id="api-config-status"></div>
                </div>
            `,
            actions: [
                {
                    text: 'Cancel',
                    class: 'btn-secondary',
                    onclick: 'uiComponents.closeModal()'
                },
                {
                    text: 'Save Configuration',
                    class: 'btn-primary',
                    onclick: 'aiConfig.saveApiConfiguration()'
                }
            ]
        });
    }

    // Save API configuration from modal
    async saveApiConfiguration() {
        const geminiKey = document.getElementById('gemini-api-key')?.value?.trim();
        const openaiKey = document.getElementById('openai-api-key')?.value?.trim();
        const statusDiv = document.getElementById('api-config-status');

        try {
            let hasChanges = false;

            // Validate and save Gemini API key
            if (geminiKey) {
                const validation = this.validateApiKey('gemini', geminiKey);
                if (validation.valid) {
                    this.setUserApiKey('gemini', geminiKey);
                    hasChanges = true;
                } else {
                    statusDiv.innerHTML = `<div class="error-message">${validation.message}</div>`;
                    return;
                }
            }

            // Validate and save OpenAI API key
            if (openaiKey) {
                const validation = this.validateApiKey('openai', openaiKey);
                if (validation.valid) {
                    this.setUserApiKey('openai', openaiKey);
                    hasChanges = true;
                } else {
                    statusDiv.innerHTML = `<div class="error-message">${validation.message}</div>`;
                    return;
                }
            }

            if (hasChanges) {
                uiComponents.showToast({
                    type: 'success',
                    title: 'API Keys Saved!',
                    message: 'Your AI API keys have been configured successfully.'
                });
                
                uiComponents.closeModal();
                
                // Refresh the page to reflect changes
                this.updateUIElements();
            } else {
                statusDiv.innerHTML = `<div class="warning-message">No changes were made.</div>`;
            }

        } catch (error) {
            console.error('Error saving API configuration:', error);
            statusDiv.innerHTML = `<div class="error-message">Error saving configuration: ${error.message}</div>`;
        }
    }

    // Test API key from modal
    async testApiKey(service) {
        const inputId = service === 'gemini' ? 'gemini-api-key' : 'openai-api-key';
        const apiKey = document.getElementById(inputId)?.value?.trim();
        const statusDiv = document.getElementById('api-config-status');

        if (!apiKey) {
            statusDiv.innerHTML = `<div class="error-message">Please enter an API key first.</div>`;
            return;
        }

        statusDiv.innerHTML = `<div class="loading-message">Testing ${service} API key...</div>`;

        try {
            const result = await this.testApiKey(service, apiKey);
            
            if (result.valid) {
                statusDiv.innerHTML = `<div class="success-message">✅ ${result.message}</div>`;
            } else {
                statusDiv.innerHTML = `<div class="error-message">❌ ${result.message}</div>`;
            }
        } catch (error) {
            statusDiv.innerHTML = `<div class="error-message">Error testing API key: ${error.message}</div>`;
        }
    }

    // Update UI elements based on API key status
    updateUIElements() {
        // Update navigation indicators
        const productDetectorLink = document.querySelector('[data-route="products"]');
        const contentGeneratorLink = document.querySelector('[data-route="content"]');
        
        if (productDetectorLink) {
            if (this.hasApiKey('gemini')) {
                productDetectorLink.classList.add('api-configured');
            } else {
                productDetectorLink.classList.remove('api-configured');
            }
        }
        
        if (contentGeneratorLink) {
            if (this.hasApiKey('gemini') || this.hasApiKey('openai')) {
                contentGeneratorLink.classList.add('api-configured');
            } else {
                contentGeneratorLink.classList.remove('api-configured');
            }
        }
    }

    // Setup event listeners
    setupEventListeners() {
        // Listen for auth state changes
        authManager.onAuthStateChange((user) => {
            if (user) {
                this.loadUserApiKeys();
                this.updateUIElements();
            } else {
                this.userApiKeys = {};
            }
        });
    }

    // Get API key for AI service calls
    getApiKeyForService(service) {
        const apiKey = this.getUserApiKey(service);
        
        if (!apiKey) {
            // Show configuration modal if no API key is configured
            setTimeout(() => {
                this.showApiConfigModal();
            }, 100);
            return null;
        }
        
        return apiKey;
    }

    // Check if user has required API keys for a feature
    checkRequiredApiKeys(feature) {
        switch (feature) {
            case 'product-detection':
                return this.hasApiKey('gemini');
            case 'content-generation':
                return this.hasApiKey('gemini') || this.hasApiKey('openai');
            default:
                return false;
        }
    }
}

// Create global instance
const aiConfig = new AIConfigManager();

// Export for global access
window.aiConfig = aiConfig;

export default aiConfig;