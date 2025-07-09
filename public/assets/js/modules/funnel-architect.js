/**
 * Funnel Architect Module
 * AffiliatePro - AI-Powered Affiliate Marketing Platform
 */

import { db, COLLECTIONS } from '../core/firebase-config.js';
import authManager from '../core/auth.js';
import uiComponents from '../components/ui-components.js';
import {
    collection,
    addDoc,
    query,
    where,
    orderBy,
    limit,
    getDocs,
    serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Funnel architect state
let funnelState = {
    currentFunnel: null,
    funnelSteps: [],
    selectedProduct: null,
    templates: {},
    isBuilding: false,
    savedFunnels: [],
    analytics: {}
};

// Funnel step types
const STEP_TYPES = {
    landing: {
        name: 'Landing Page',
        icon: '🏠',
        description: 'First impression page',
        color: '#3b82f6'
    },
    optin: {
        name: 'Opt-in Page',
        icon: '📧',
        description: 'Email capture page',
        color: '#10b981'
    },
    sales: {
        name: 'Sales Page',
        icon: '💰',
        description: 'Main sales pitch',
        color: '#f59e0b'
    },
    upsell: {
        name: 'Upsell Page',
        icon: '⬆️',
        description: 'Additional offer',
        color: '#8b5cf6'
    },
    downsell: {
        name: 'Downsell Page',
        icon: '⬇️',
        description: 'Alternative offer',
        color: '#f97316'
    },
    thank_you: {
        name: 'Thank You Page',
        icon: '🎉',
        description: 'Success confirmation',
        color: '#06b6d4'
    },
    checkout: {
        name: 'Checkout Page',
        icon: '🛒',
        description: 'Payment processing',
        color: '#ef4444'
    }
};

// Funnel templates
const FUNNEL_TEMPLATES = {
    simple_affiliate: {
        name: 'Simple Affiliate Funnel',
        description: 'Basic funnel for affiliate promotions',
        steps: [
            { type: 'landing', title: 'Product Landing', order: 1 },
            { type: 'sales', title: 'Sales Page', order: 2 },
            { type: 'checkout', title: 'Affiliate Checkout', order: 3 },
            { type: 'thank_you', title: 'Success Page', order: 4 }
        ]
    },
    lead_generation: {
        name: 'Lead Generation Funnel',
        description: 'Capture leads before selling',
        steps: [
            { type: 'landing', title: 'Lead Magnet Landing', order: 1 },
            { type: 'optin', title: 'Email Capture', order: 2 },
            { type: 'sales', title: 'Product Presentation', order: 3 },
            { type: 'upsell', title: 'Premium Offer', order: 4 },
            { type: 'thank_you', title: 'Welcome Sequence', order: 5 }
        ]
    },
    high_ticket: {
        name: 'High-Ticket Sales Funnel',
        description: 'For expensive products/services',
        steps: [
            { type: 'landing', title: 'Value-First Landing', order: 1 },
            { type: 'optin', title: 'Free Training Signup', order: 2 },
            { type: 'sales', title: 'High-Value Presentation', order: 3 },
            { type: 'checkout', title: 'Exclusive Checkout', order: 4 },
            { type: 'upsell', title: 'VIP Upgrade', order: 5 },
            { type: 'thank_you', title: 'Onboarding Start', order: 6 }
        ]
    },
    product_launch: {
        name: 'Product Launch Funnel',
        description: 'Build anticipation and launch',
        steps: [
            { type: 'landing', title: 'Pre-Launch Teaser', order: 1 },
            { type: 'optin', title: 'Early Access Signup', order: 2 },
            { type: 'sales', title: 'Launch Presentation', order: 3 },
            { type: 'upsell', title: 'Limited-Time Bonus', order: 4 },
            { type: 'downsell', title: 'Payment Plan Option', order: 5 },
            { type: 'thank_you', title: 'Access Delivery', order: 6 }
        ]
    }
};

// Funnel Architect module
const FunnelArchitect = {
    // Initialize module
    async init() {
        console.log('🎯 Initializing Funnel Architect...');
        
        // Load saved funnels
        await this.loadSavedFunnels();
        
        // Check for selected product from other modules
        this.loadSelectedProduct();
        
        // Initialize templates
        funnelState.templates = FUNNEL_TEMPLATES;
        
        console.log('✅ Funnel Architect initialized');
    },

    // Render module
    async render() {
        const pageContent = document.getElementById('page-content');
        if (!pageContent) return;

        pageContent.innerHTML = this.getFunnelArchitectHTML();
        
        // Initialize interactions
        this.initializeInteractions();
        
        // Setup drag and drop
        this.setupDragAndDrop();
        
        // Load recent funnels if available
        if (funnelState.currentFunnel) {
            this.renderFunnelBuilder();
        } else {
            this.showTemplateSelection();
        }
    },

    // Get HTML template
    getFunnelArchitectHTML() {
        const userProfile = authManager.getCurrentUserProfile();
        const remainingFunnels = authManager.getUsageRemaining('funnels');
        const hasUsage = authManager.hasUsageAvailable('funnels');

        return `
            <div class="funnel-architect">
                <!-- Header Section -->
                <div class="architect-header">
                    <div class="architect-title">
                        <h1>🎯 Funnel Architect</h1>
                        <p>Build high-converting sales funnels visually</p>
                    </div>
                    <div class="usage-indicator">
                        ${remainingFunnels === -1 ? 
                            '<span class="usage-unlimited">∞ Unlimited</span>' :
                            `<span class="usage-count">${remainingFunnels} funnels remaining</span>`
                        }
                    </div>
                </div>

                <!-- Selected Product -->
                ${funnelState.selectedProduct ? this.getSelectedProductHTML() : ''}

                <!-- Main Content Container -->
                <div class="architect-content">
                    <!-- Sidebar -->
                    <div class="architect-sidebar" id="architect-sidebar">
                        <div class="sidebar-section">
                            <h3>📋 Funnel Steps</h3>
                            <div class="step-library">
                                ${Object.entries(STEP_TYPES).map(([key, step]) => `
                                    <div class="step-item" draggable="true" data-step-type="${key}">
                                        <div class="step-icon" style="color: ${step.color}">${step.icon}</div>
                                        <div class="step-info">
                                            <div class="step-name">${step.name}</div>
                                            <div class="step-desc">${step.description}</div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>

                        <div class="sidebar-section">
                            <h3>🎨 Templates</h3>
                            <div class="template-library">
                                ${Object.entries(FUNNEL_TEMPLATES).map(([key, template]) => `
                                    <div class="template-item" onclick="FunnelArchitect.loadTemplate('${key}')">
                                        <div class="template-name">${template.name}</div>
                                        <div class="template-desc">${template.description}</div>
                                        <div class="template-steps">${template.steps.length} steps</div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>

                        <div class="sidebar-section">
                            <h3>📊 Analytics</h3>
                            <div class="analytics-summary">
                                <div class="metric-small">
                                    <span class="metric-label">Conversion Rate</span>
                                    <span class="metric-value">3.2%</span>
                                </div>
                                <div class="metric-small">
                                    <span class="metric-label">Total Visitors</span>
                                    <span class="metric-value">1,245</span>
                                </div>
                                <div class="metric-small">
                                    <span class="metric-label">Revenue</span>
                                    <span class="metric-value">$2,890</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Main Canvas -->
                    <div class="architect-canvas" id="architect-canvas">
                        ${this.getCanvasHTML()}
                    </div>

                    <!-- Properties Panel -->
                    <div class="architect-properties" id="architect-properties">
                        <div class="properties-header">
                            <h3>⚙️ Properties</h3>
                        </div>
                        <div class="properties-content" id="properties-content">
                            ${this.getPropertiesHTML()}
                        </div>
                    </div>
                </div>

                <!-- Toolbar -->
                <div class="architect-toolbar">
                    <div class="toolbar-left">
                        <button class="btn btn-secondary" onclick="FunnelArchitect.newFunnel()">
                            📄 New Funnel
                        </button>
                        <button class="btn btn-outline" onclick="FunnelArchitect.loadFunnel()">
                            📁 Load Funnel
                        </button>
                    </div>
                    <div class="toolbar-center">
                        <div class="funnel-title-input">
                            <input type="text" id="funnel-title" placeholder="Untitled Funnel" 
                                   value="${funnelState.currentFunnel?.title || ''}"
                                   onchange="FunnelArchitect.updateFunnelTitle(this.value)">
                        </div>
                    </div>
                    <div class="toolbar-right">
                        <button class="btn btn-outline" onclick="FunnelArchitect.previewFunnel()" 
                                ${!funnelState.currentFunnel ? 'disabled' : ''}>
                            👁️ Preview
                        </button>
                        <button class="btn btn-secondary" onclick="FunnelArchitect.exportFunnel()" 
                                ${!funnelState.currentFunnel ? 'disabled' : ''}>
                            📤 Export
                        </button>
                        <button class="btn btn-primary" onclick="FunnelArchitect.saveFunnel()" 
                                ${!funnelState.currentFunnel ? 'disabled' : ''}>
                            💾 Save Funnel
                        </button>
                    </div>
                </div>
            </div>
        `;
    },

    // Get selected product HTML
    getSelectedProductHTML() {
        const product = funnelState.selectedProduct;
        return `
            <div class="selected-product">
                <div class="card">
                    <div class="card-body">
                        <div class="product-info">
                            <div class="product-details">
                                <h4>📦 Selected Product</h4>
                                <div class="product-name">${product.name}</div>
                                <div class="product-meta">
                                    ${product.category} • ${uiComponents.formatCurrency(product.price)}
                                </div>
                            </div>
                            <button class="btn btn-outline btn-sm" onclick="FunnelArchitect.clearSelectedProduct()">
                                Clear Selection
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    // Get canvas HTML
    getCanvasHTML() {
        if (!funnelState.currentFunnel) {
            return `
                <div class="canvas-empty">
                    <div class="empty-state">
                        <div class="empty-icon">🎯</div>
                        <h3>Start Building Your Funnel</h3>
                        <p>Choose a template or drag steps from the sidebar to begin</p>
                        <div class="empty-actions">
                            <button class="btn btn-primary" onclick="FunnelArchitect.showTemplateModal()">
                                📋 Choose Template
                            </button>
                            <button class="btn btn-outline" onclick="FunnelArchitect.createBlankFunnel()">
                                ➕ Start from Scratch
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }

        return `
            <div class="canvas-content">
                <div class="funnel-flow" id="funnel-flow">
                    ${this.renderFunnelSteps()}
                </div>
                <div class="canvas-drop-zone" id="canvas-drop-zone">
                    Drop funnel steps here
                </div>
            </div>
        `;
    },

    // Render funnel steps
    renderFunnelSteps() {
        if (!funnelState.funnelSteps || funnelState.funnelSteps.length === 0) {
            return '<div class="no-steps">No steps added yet</div>';
        }

        return funnelState.funnelSteps
            .sort((a, b) => a.order - b.order)
            .map((step, index) => `
                <div class="funnel-step" data-step-id="${step.id}" onclick="FunnelArchitect.selectStep('${step.id}')">
                    <div class="step-header">
                        <div class="step-type">
                            <span class="step-icon" style="color: ${STEP_TYPES[step.type].color}">
                                ${STEP_TYPES[step.type].icon}
                            </span>
                            <span class="step-type-name">${STEP_TYPES[step.type].name}</span>
                        </div>
                        <div class="step-actions">
                            <button class="btn-icon" onclick="FunnelArchitect.duplicateStep('${step.id}')" title="Duplicate">
                                📋
                            </button>
                            <button class="btn-icon" onclick="FunnelArchitect.deleteStep('${step.id}')" title="Delete">
                                🗑️
                            </button>
                        </div>
                    </div>
                    <div class="step-content">
                        <div class="step-title">${step.title || 'Untitled Step'}</div>
                        <div class="step-description">${step.description || STEP_TYPES[step.type].description}</div>
                        <div class="step-metrics">
                            <div class="metric-mini">
                                <span class="metric-label">Visitors</span>
                                <span class="metric-value">${step.analytics?.visitors || 0}</span>
                            </div>
                            <div class="metric-mini">
                                <span class="metric-label">Conversion</span>
                                <span class="metric-value">${step.analytics?.conversion || 0}%</span>
                            </div>
                        </div>
                    </div>
                    ${index < funnelState.funnelSteps.length - 1 ? `
                        <div class="step-connector">
                            <div class="connector-line"></div>
                            <div class="connector-arrow">⬇️</div>
                        </div>
                    ` : ''}
                </div>
            `).join('');
    },

    // Get properties HTML
    getPropertiesHTML() {
        const selectedStep = this.getSelectedStep();
        
        if (!selectedStep) {
            return `
                <div class="no-selection">
                    <p>Select a funnel step to edit its properties</p>
                </div>
            `;
        }

        return `
            <div class="step-properties">
                <div class="properties-section">
                    <h4>Basic Settings</h4>
                    <div class="form-group">
                        <label for="step-title">Step Title</label>
                        <input type="text" id="step-title" class="form-input" 
                               value="${selectedStep.title || ''}"
                               onchange="FunnelArchitect.updateStepProperty('title', this.value)">
                    </div>
                    <div class="form-group">
                        <label for="step-description">Description</label>
                        <textarea id="step-description" class="form-input" rows="3"
                                  onchange="FunnelArchitect.updateStepProperty('description', this.value)">${selectedStep.description || ''}</textarea>
                    </div>
                    <div class="form-group">
                        <label for="step-url">Page URL</label>
                        <input type="url" id="step-url" class="form-input" 
                               value="${selectedStep.url || ''}"
                               placeholder="https://your-domain.com/page"
                               onchange="FunnelArchitect.updateStepProperty('url', this.value)">
                    </div>
                </div>

                <div class="properties-section">
                    <h4>Design Settings</h4>
                    <div class="form-group">
                        <label for="step-template">Template</label>
                        <select id="step-template" class="form-select"
                                onchange="FunnelArchitect.updateStepProperty('template', this.value)">
                            <option value="default" ${selectedStep.template === 'default' ? 'selected' : ''}>Default</option>
                            <option value="minimal" ${selectedStep.template === 'minimal' ? 'selected' : ''}>Minimal</option>
                            <option value="modern" ${selectedStep.template === 'modern' ? 'selected' : ''}>Modern</option>
                            <option value="classic" ${selectedStep.template === 'classic' ? 'selected' : ''}>Classic</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="step-color">Primary Color</label>
                        <input type="color" id="step-color" class="form-input" 
                               value="${selectedStep.primaryColor || '#3b82f6'}"
                               onchange="FunnelArchitect.updateStepProperty('primaryColor', this.value)">
                    </div>
                </div>

                <div class="properties-section">
                    <h4>Content Settings</h4>
                    <div class="form-group">
                        <label for="step-headline">Headline</label>
                        <input type="text" id="step-headline" class="form-input" 
                               value="${selectedStep.headline || ''}"
                               placeholder="Enter compelling headline"
                               onchange="FunnelArchitect.updateStepProperty('headline', this.value)">
                    </div>
                    <div class="form-group">
                        <label for="step-subheadline">Subheadline</label>
                        <input type="text" id="step-subheadline" class="form-input" 
                               value="${selectedStep.subheadline || ''}"
                               placeholder="Supporting text"
                               onchange="FunnelArchitect.updateStepProperty('subheadline', this.value)">
                    </div>
                    <div class="form-group">
                        <label for="step-cta">Call to Action</label>
                        <input type="text" id="step-cta" class="form-input" 
                               value="${selectedStep.cta || ''}"
                               placeholder="e.g., Get Started Now"
                               onchange="FunnelArchitect.updateStepProperty('cta', this.value)">
                    </div>
                </div>

                <div class="properties-section">
                    <h4>Analytics & Tracking</h4>
                    <div class="form-group">
                        <label for="step-pixel">Facebook Pixel</label>
                        <input type="text" id="step-pixel" class="form-input" 
                               value="${selectedStep.facebookPixel || ''}"
                               placeholder="Pixel ID"
                               onchange="FunnelArchitect.updateStepProperty('facebookPixel', this.value)">
                    </div>
                    <div class="form-group">
                        <label for="step-gtag">Google Analytics</label>
                        <input type="text" id="step-gtag" class="form-input" 
                               value="${selectedStep.googleAnalytics || ''}"
                               placeholder="GA4 Measurement ID"
                               onchange="FunnelArchitect.updateStepProperty('googleAnalytics', this.value)">
                    </div>
                </div>

                <div class="properties-actions">
                    <button class="btn btn-primary btn-sm" onclick="FunnelArchitect.generateStepContent()">
                        ✨ AI Generate Content
                    </button>
                    <button class="btn btn-outline btn-sm" onclick="FunnelArchitect.previewStep()">
                        👁️ Preview Step
                    </button>
                </div>
            </div>
        `;
    },

    // Initialize interactions
    initializeInteractions() {
        // Toolbar interactions are handled by onclick attributes
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 's':
                        e.preventDefault();
                        this.saveFunnel();
                        break;
                    case 'n':
                        e.preventDefault();
                        this.newFunnel();
                        break;
                    case 'p':
                        e.preventDefault();
                        this.previewFunnel();
                        break;
                }
            }
            
            // Delete selected step
            if (e.key === 'Delete' || e.key === 'Backspace') {
                const selectedStep = this.getSelectedStep();
                if (selectedStep) {
                    this.deleteStep(selectedStep.id);
                }
            }
        });
    },

    // Setup drag and drop
    setupDragAndDrop() {
        // Make step items draggable
        document.querySelectorAll('.step-item').forEach(item => {
            item.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', e.target.dataset.stepType);
                e.dataTransfer.effectAllowed = 'copy';
            });
        });

        // Setup drop zone
        const dropZone = document.getElementById('canvas-drop-zone');
        const funnelFlow = document.getElementById('funnel-flow');
        
        [dropZone, funnelFlow].forEach(zone => {
            if (!zone) return;
            
            zone.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'copy';
                zone.classList.add('drag-over');
            });

            zone.addEventListener('dragleave', (e) => {
                zone.classList.remove('drag-over');
            });

            zone.addEventListener('drop', (e) => {
                e.preventDefault();
                zone.classList.remove('drag-over');
                
                const stepType = e.dataTransfer.getData('text/plain');
                if (stepType) {
                    this.addStep(stepType);
                }
            });
        });
    },

    // Create blank funnel
    createBlankFunnel() {
        if (!authManager.hasUsageAvailable('funnels')) {
            this.showUpgradeModal();
            return;
        }

        funnelState.currentFunnel = {
            id: `funnel_${Date.now()}`,
            title: 'Untitled Funnel',
            description: '',
            created_at: new Date(),
            updated_at: new Date(),
            product_id: funnelState.selectedProduct?.id || null
        };
        
        funnelState.funnelSteps = [];
        
        this.renderFunnelBuilder();
        
        uiComponents.showToast({
            type: 'success',
            message: 'New funnel created! Start adding steps.'
        });
    },

    // Load template
    loadTemplate(templateKey) {
        if (!authManager.hasUsageAvailable('funnels')) {
            this.showUpgradeModal();
            return;
        }

        const template = FUNNEL_TEMPLATES[templateKey];
        if (!template) return;

        funnelState.currentFunnel = {
            id: `funnel_${Date.now()}`,
            title: template.name,
            description: template.description,
            template: templateKey,
            created_at: new Date(),
            updated_at: new Date(),
            product_id: funnelState.selectedProduct?.id || null
        };

        funnelState.funnelSteps = template.steps.map((step, index) => ({
            id: `step_${Date.now()}_${index}`,
            type: step.type,
            title: step.title,
            order: step.order,
            description: STEP_TYPES[step.type].description,
            analytics: {
                visitors: Math.floor(Math.random() * 1000),
                conversion: (Math.random() * 10).toFixed(1)
            }
        }));

        this.renderFunnelBuilder();
        
        uiComponents.showToast({
            type: 'success',
            message: `Template "${template.name}" loaded successfully!`
        });
    },

    // Show template modal
    showTemplateModal() {
        uiComponents.createModal({
            id: 'template-modal',
            title: 'Choose Funnel Template',
            size: 'large',
            content: `
                <div class="template-grid">
                    ${Object.entries(FUNNEL_TEMPLATES).map(([key, template]) => `
                        <div class="template-card" onclick="FunnelArchitect.loadTemplate('${key}'); uiComponents.closeModal();">
                            <div class="template-header">
                                <h4>${template.name}</h4>
                                <span class="template-steps-count">${template.steps.length} steps</span>
                            </div>
                            <div class="template-description">${template.description}</div>
                            <div class="template-steps-preview">
                                ${template.steps.map(step => `
                                    <div class="step-preview">
                                        <span class="step-icon">${STEP_TYPES[step.type].icon}</span>
                                        <span class="step-name">${step.title}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>
            `,
            actions: [
                {
                    text: 'Cancel',
                    class: 'btn-secondary',
                    onclick: 'uiComponents.closeModal()'
                },
                {
                    text: 'Start from Scratch',
                    class: 'btn-outline',
                    onclick: 'FunnelArchitect.createBlankFunnel(); uiComponents.closeModal();'
                }
            ]
        });
    },

    // Add step
    addStep(stepType) {
        if (!funnelState.currentFunnel) {
            this.createBlankFunnel();
        }

        const newStep = {
            id: `step_${Date.now()}`,
            type: stepType,
            title: STEP_TYPES[stepType].name,
            order: funnelState.funnelSteps.length + 1,
            description: STEP_TYPES[stepType].description,
            analytics: {
                visitors: 0,
                conversion: 0
            }
        };

        funnelState.funnelSteps.push(newStep);
        this.renderFunnelBuilder();
        this.selectStep(newStep.id);

        uiComponents.showToast({
            type: 'success',
            message: `${STEP_TYPES[stepType].name} added to funnel`
        });
    },

    // Select step
    selectStep(stepId) {
        // Remove previous selection
        document.querySelectorAll('.funnel-step').forEach(step => {
            step.classList.remove('selected');
        });

        // Add selection to current step
        const stepElement = document.querySelector(`[data-step-id="${stepId}"]`);
        if (stepElement) {
            stepElement.classList.add('selected');
        }

        // Update properties panel
        const propertiesContent = document.getElementById('properties-content');
        if (propertiesContent) {
            propertiesContent.innerHTML = this.getPropertiesHTML();
        }
    },

    // Get selected step
    getSelectedStep() {
        const selectedElement = document.querySelector('.funnel-step.selected');
        if (!selectedElement) return null;

        const stepId = selectedElement.dataset.stepId;
        return funnelState.funnelSteps.find(step => step.id === stepId);
    },

    // Update step property
    updateStepProperty(property, value) {
        const selectedStep = this.getSelectedStep();
        if (!selectedStep) return;

        selectedStep[property] = value;
        
        // Re-render if it affects the visual representation
        if (['title', 'description'].includes(property)) {
            this.renderFunnelBuilder();
            this.selectStep(selectedStep.id); // Maintain selection
        }

        // Mark funnel as modified
        if (funnelState.currentFunnel) {
            funnelState.currentFunnel.updated_at = new Date();
        }
    },

    // Duplicate step
    duplicateStep(stepId) {
        const step = funnelState.funnelSteps.find(s => s.id === stepId);
        if (!step) return;

        const duplicatedStep = {
            ...step,
            id: `step_${Date.now()}`,
            title: `${step.title} (Copy)`,
            order: funnelState.funnelSteps.length + 1
        };

        funnelState.funnelSteps.push(duplicatedStep);
        this.renderFunnelBuilder();

        uiComponents.showToast({
            type: 'success',
            message: 'Step duplicated successfully'
        });
    },

    // Delete step
    deleteStep(stepId) {
        funnelState.funnelSteps = funnelState.funnelSteps.filter(step => step.id !== stepId);
        
        // Reorder remaining steps
        funnelState.funnelSteps.forEach((step, index) => {
            step.order = index + 1;
        });

        this.renderFunnelBuilder();

        uiComponents.showToast({
            type: 'success',
            message: 'Step deleted successfully'
        });
    },

    // Generate step content using AI
    async generateStepContent() {
        const selectedStep = this.getSelectedStep();
        if (!selectedStep) return;

        try {
            // Show loading
            uiComponents.showToast({
                type: 'info',
                message: 'Generating AI content...'
            });

            // In a real implementation, this would call an AI service
            // For demo, we'll generate mock content
            const generatedContent = this.generateMockStepContent(selectedStep);

            // Update step with generated content
            Object.assign(selectedStep, generatedContent);

            // Update properties panel
            const propertiesContent = document.getElementById('properties-content');
            if (propertiesContent) {
                propertiesContent.innerHTML = this.getPropertiesHTML();
            }

            // Re-render funnel
            this.renderFunnelBuilder();
            this.selectStep(selectedStep.id);

            uiComponents.showToast({
                type: 'success',
                message: 'AI content generated successfully!'
            });

        } catch (error) {
            console.error('❌ Content generation failed:', error);
            uiComponents.showToast({
                type: 'error',
                message: 'Failed to generate content'
            });
        }
    },

    // Generate mock step content
    generateMockStepContent(step) {
        const product = funnelState.selectedProduct;
        const productName = product?.name || 'Our Amazing Product';
        
        const contentTemplates = {
            landing: {
                headline: `Discover ${productName} - The Solution You've Been Looking For`,
                subheadline: 'Join thousands of satisfied customers who have transformed their lives',
                cta: 'Learn More'
            },
            optin: {
                headline: `Get FREE Access to ${productName} Secrets`,
                subheadline: 'Enter your email to receive our exclusive guide and special offers',
                cta: 'Get Instant Access'
            },
            sales: {
                headline: `${productName} - Transform Your Life Today`,
                subheadline: 'Limited time offer: Get ${productName} with exclusive bonuses',
                cta: 'Buy Now - Special Price'
            },
            upsell: {
                headline: `Wait! Upgrade Your ${productName} Experience`,
                subheadline: 'Add these premium features for only $19 more (50% off)',
                cta: 'Yes, Upgrade My Order'
            },
            downsell: {
                headline: `Last Chance - Payment Plan Available`,
                subheadline: 'Get ${productName} for just 3 easy payments of $19.99',
                cta: 'Choose Payment Plan'
            },
            thank_you: {
                headline: `Welcome to the ${productName} Family!`,
                subheadline: 'Check your email for access details and next steps',
                cta: 'Access Your Account'
            },
            checkout: {
                headline: `Secure Checkout - ${productName}`,
                subheadline: '100% secure payment processing with 30-day money-back guarantee',
                cta: 'Complete Purchase'
            }
        };

        return contentTemplates[step.type] || contentTemplates.landing;
    },

    // Preview step
    previewStep() {
        const selectedStep = this.getSelectedStep();
        if (!selectedStep) return;

        uiComponents.createModal({
            id: 'step-preview-modal',
            title: `Preview: ${selectedStep.title}`,
            size: 'xlarge',
            content: `
                <div class="step-preview-container">
                    <div class="preview-mockup">
                        <div class="mockup-browser">
                            <div class="mockup-header">
                                <div class="mockup-controls">
                                    <span class="control red"></span>
                                    <span class="control yellow"></span>
                                    <span class="control green"></span>
                                </div>
                                <div class="mockup-url">${selectedStep.url || 'your-domain.com/page'}</div>
                            </div>
                            <div class="mockup-content">
                                <div class="preview-page" style="background: linear-gradient(135deg, ${selectedStep.primaryColor || '#3b82f6'}, ${selectedStep.primaryColor || '#3b82f6'}dd);">
                                    <div class="preview-header">
                                        <h1>${selectedStep.headline || selectedStep.title}</h1>
                                        <p>${selectedStep.subheadline || selectedStep.description}</p>
                                    </div>
                                    <div class="preview-body">
                                        <div class="preview-content-block">
                                            <p>This is a preview of how your ${STEP_TYPES[selectedStep.type].name.toLowerCase()} will look.</p>
                                        </div>
                                        <div class="preview-cta">
                                            <button class="preview-button" style="background: ${selectedStep.primaryColor || '#3b82f6'}">
                                                ${selectedStep.cta || 'Take Action'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `,
            actions: [
                {
                    text: 'Close Preview',
                    class: 'btn-secondary',
                    onclick: 'uiComponents.closeModal()'
                },
                {
                    text: 'Edit Step',
                    class: 'btn-primary',
                    onclick: 'uiComponents.closeModal()'
                }
            ]
        });
    },

    // Update funnel title
    updateFunnelTitle(title) {
        if (funnelState.currentFunnel) {
            funnelState.currentFunnel.title = title;
            funnelState.currentFunnel.updated_at = new Date();
        }
    },

    // New funnel
    newFunnel() {
        if (funnelState.currentFunnel && this.hasPendingChanges()) {
            if (!confirm('You have unsaved changes. Create new funnel anyway?')) {
                return;
            }
        }

        this.showTemplateModal();
    },

    // Load funnel
    loadFunnel() {
        uiComponents.createModal({
            id: 'load-funnel-modal',
            title: 'Load Funnel',
            content: `
                <div class="saved-funnels">
                    ${funnelState.savedFunnels.length > 0 ? 
                        funnelState.savedFunnels.map(funnel => `
                            <div class="saved-funnel-item" onclick="FunnelArchitect.loadSavedFunnel('${funnel.id}'); uiComponents.closeModal();">
                                <div class="funnel-info">
                                    <div class="funnel-name">${funnel.title}</div>
                                    <div class="funnel-meta">${funnel.steps?.length || 0} steps • ${uiComponents.formatDate(funnel.updated_at)}</div>
                                </div>
                                <div class="funnel-actions">
                                    <button class="btn-icon" onclick="event.stopPropagation(); FunnelArchitect.deleteSavedFunnel('${funnel.id}');" title="Delete">
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        `).join('') :
                        '<div class="empty-state-small">No saved funnels found</div>'
                    }
                </div>
            `,
            actions: [
                {
                    text: 'Cancel',
                    class: 'btn-secondary',
                    onclick: 'uiComponents.closeModal()'
                }
            ]
        });
    },

    // Save funnel
    async saveFunnel() {
        if (!funnelState.currentFunnel) {
            uiComponents.showToast({
                type: 'warning',
                message: 'No funnel to save'
            });
            return;
        }

        try {
            const funnelToSave = {
                ...funnelState.currentFunnel,
                steps: funnelState.funnelSteps,
                updated_at: new Date(),
                userId: authManager.getCurrentUser().uid
            };

            // Save to localStorage (in production, save to Firestore)
            const savedFunnels = JSON.parse(localStorage.getItem('funnelArchitect_savedFunnels') || '[]');
            
            const existingIndex = savedFunnels.findIndex(f => f.id === funnelToSave.id);
            if (existingIndex >= 0) {
                savedFunnels[existingIndex] = funnelToSave;
            } else {
                savedFunnels.push(funnelToSave);
            }
            
            localStorage.setItem('funnelArchitect_savedFunnels', JSON.stringify(savedFunnels));
            funnelState.savedFunnels = savedFunnels;

            // Update usage
            await authManager.updateUsage('funnels', 1);

            uiComponents.showToast({
                type: 'success',
                message: 'Funnel saved successfully!'
            });

        } catch (error) {
            console.error('❌ Error saving funnel:', error);
            uiComponents.showToast({
                type: 'error',
                message: 'Failed to save funnel'
            });
        }
    },

    // Load saved funnel
    loadSavedFunnel(funnelId) {
        const funnel = funnelState.savedFunnels.find(f => f.id === funnelId);
        if (!funnel) return;

        funnelState.currentFunnel = { ...funnel };
        funnelState.funnelSteps = funnel.steps || [];

        // Update title input
        const titleInput = document.getElementById('funnel-title');
        if (titleInput) {
            titleInput.value = funnel.title;
        }

        this.renderFunnelBuilder();

        uiComponents.showToast({
            type: 'success',
            message: `Funnel "${funnel.title}" loaded successfully!`
        });
    },

    // Delete saved funnel
    deleteSavedFunnel(funnelId) {
        if (!confirm('Are you sure you want to delete this funnel?')) return;

        funnelState.savedFunnels = funnelState.savedFunnels.filter(f => f.id !== funnelId);
        localStorage.setItem('funnelArchitect_savedFunnels', JSON.stringify(funnelState.savedFunnels));

        uiComponents.showToast({
            type: 'success',
            message: 'Funnel deleted successfully'
        });

        // Close modal and refresh if it's open
        uiComponents.closeModal();
        this.loadFunnel();
    },

    // Preview funnel
    previewFunnel() {
        if (!funnelState.currentFunnel || funnelState.funnelSteps.length === 0) {
            uiComponents.showToast({
                type: 'warning',
                message: 'No funnel steps to preview'
            });
            return;
        }

        // Open preview in new tab (in production, this would be a real preview)
        const previewData = {
            funnel: funnelState.currentFunnel,
            steps: funnelState.funnelSteps
        };

        console.log('🔍 Funnel preview data:', previewData);

        uiComponents.showToast({
            type: 'info',
            message: 'Funnel preview feature coming soon!'
        });
    },

    // Export funnel
    exportFunnel() {
        if (!funnelState.currentFunnel) {
            uiComponents.showToast({
                type: 'warning',
                message: 'No funnel to export'
            });
            return;
        }

        const exportData = {
            funnel: funnelState.currentFunnel,
            steps: funnelState.funnelSteps,
            exported_at: new Date().toISOString()
        };

        const filename = `${funnelState.currentFunnel.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_funnel.json`;
        uiComponents.downloadFile(JSON.stringify(exportData, null, 2), filename, 'application/json');

        uiComponents.showToast({
            type: 'success',
            message: 'Funnel exported successfully!'
        });
    },

    // Render funnel builder
    renderFunnelBuilder() {
        const canvas = document.getElementById('architect-canvas');
        if (canvas) {
            canvas.innerHTML = this.getCanvasHTML();
            this.setupDragAndDrop();
        }

        // Update toolbar buttons
        const previewBtn = document.querySelector('[onclick="FunnelArchitect.previewFunnel()"]');
        const exportBtn = document.querySelector('[onclick="FunnelArchitect.exportFunnel()"]');
        const saveBtn = document.querySelector('[onclick="FunnelArchitect.saveFunnel()"]');

        [previewBtn, exportBtn, saveBtn].forEach(btn => {
            if (btn) {
                btn.disabled = !funnelState.currentFunnel;
            }
        });
    },

    // Show template selection
    showTemplateSelection() {
        // This is called when no funnel is active
        // The empty state in getCanvasHTML() handles this
    },

    // Load selected product from session storage
    loadSelectedProduct() {
        try {
            const savedProduct = sessionStorage.getItem('selectedProduct');
            if (savedProduct) {
                funnelState.selectedProduct = JSON.parse(savedProduct);
                sessionStorage.removeItem('selectedProduct'); // Clear after use
            }
        } catch (error) {
            console.error('❌ Error loading selected product:', error);
        }
    },

    // Clear selected product
    clearSelectedProduct() {
        funnelState.selectedProduct = null;
        this.render(); // Re-render to update UI
    },

    // Load saved funnels
    async loadSavedFunnels() {
        try {
            const saved = localStorage.getItem('funnelArchitect_savedFunnels');
            if (saved) {
                funnelState.savedFunnels = JSON.parse(saved).map(funnel => ({
                    ...funnel,
                    created_at: new Date(funnel.created_at),
                    updated_at: new Date(funnel.updated_at)
                }));
            }
        } catch (error) {
            console.error('❌ Error loading saved funnels:', error);
        }
    },

    // Check for pending changes
    hasPendingChanges() {
        // In a real implementation, track changes more precisely
        return funnelState.currentFunnel && !funnelState.currentFunnel.saved;
    },

    // Show upgrade modal
    showUpgradeModal() {
        uiComponents.createModal({
            id: 'upgrade-modal',
            title: 'Upgrade Required',
            content: `
                <div class="upgrade-content">
                    <div class="upgrade-icon">⚡</div>
                    <h3>You've reached your funnel limit</h3>
                    <p>Upgrade to Pro to create unlimited funnels and access premium templates.</p>
                    <div class="upgrade-features">
                        <div class="feature">✅ Unlimited funnels</div>
                        <div class="feature">✅ Premium templates</div>
                        <div class="feature">✅ Advanced analytics</div>
                        <div class="feature">✅ Custom domains</div>
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
                    onclick: 'app.handleUpgrade(); uiComponents.closeModal();'
                }
            ]
        });
    },

    // Cleanup
    cleanup() {
        funnelState.isBuilding = false;
        console.log('🎯 Funnel Architect cleanup completed');
    }
};

// Export module
export default FunnelArchitect;

console.log('🎯 Funnel Architect module loaded');