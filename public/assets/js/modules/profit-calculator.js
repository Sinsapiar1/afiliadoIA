/**
 * Profit Calculator Module
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

// Calculator state
let calculatorState = {
    currentCalculation: null,
    scenarios: ['conservative', 'realistic', 'optimistic'],
    currentScenario: 'realistic',
    selectedProduct: null,
    calculationHistory: [],
    chartData: {},
    projectionMonths: 12
};

// Default calculation parameters
const DEFAULT_PARAMS = {
    productPrice: 97,
    commissionRate: 30,
    conversionRate: 2.5,
    monthlyTraffic: 5000,
    adSpend: 500,
    otherExpenses: 200,
    timeframe: 12,
    trafficGrowthRate: 10,
    seasonalityFactor: 1.0
};

// Scenario multipliers
const SCENARIO_MULTIPLIERS = {
    conservative: {
        conversionRate: 0.7,
        traffic: 0.8,
        commission: 1.0,
        expenses: 1.2,
        growth: 0.5
    },
    realistic: {
        conversionRate: 1.0,
        traffic: 1.0,
        commission: 1.0,
        expenses: 1.0,
        growth: 1.0
    },
    optimistic: {
        conversionRate: 1.4,
        traffic: 1.3,
        commission: 1.1,
        expenses: 0.8,
        growth: 1.8
    }
};

// Profit Calculator module
const ProfitCalculator = {
    // Initialize module
    async init() {
        console.log('💰 Initializing Profit Calculator...');
        
        // Load calculation history
        await this.loadCalculationHistory();
        
        // Check for selected product from other modules
        this.loadSelectedProduct();
        
        console.log('✅ Profit Calculator initialized');
    },

    // Render module
    async render() {
        const pageContent = document.getElementById('page-content');
        if (!pageContent) return;

        pageContent.innerHTML = this.getProfitCalculatorHTML();
        
        // Initialize interactions
        this.initializeInteractions();
        
        // Load default calculation
        this.performCalculation();
        
        // Initialize charts
        this.initializeCharts();
    },

    // Get HTML template
    getProfitCalculatorHTML() {
        const userProfile = authManager.getCurrentUserProfile();
        const hasAccess = authManager.hasPermission('profit_calculator');

        if (!hasAccess) {
            return this.getUpgradeRequiredHTML();
        }

        return `
            <div class="profit-calculator">
                <!-- Header Section -->
                <div class="calculator-header">
                    <div class="calculator-title">
                        <h1>💰 Profit Calculator</h1>
                        <p>Analyze and project your affiliate earnings with AI-powered insights</p>
                    </div>
                    <div class="scenario-selector">
                        <div class="scenario-tabs">
                            ${calculatorState.scenarios.map(scenario => `
                                <button class="scenario-tab ${scenario === calculatorState.currentScenario ? 'active' : ''}"
                                        onclick="ProfitCalculator.switchScenario('${scenario}')">
                                    ${this.getScenarioIcon(scenario)} ${this.capitalizeFirst(scenario)}
                                </button>
                            `).join('')}
                        </div>
                    </div>
                </div>

                <!-- Selected Product -->
                ${calculatorState.selectedProduct ? this.getSelectedProductHTML() : ''}

                <!-- Main Calculator Container -->
                <div class="calculator-container">
                    <!-- Input Panel -->
                    <div class="calculator-inputs">
                        <div class="card">
                            <div class="card-header">
                                <h3>📊 Calculation Parameters</h3>
                                <p>Adjust the values to match your affiliate campaign</p>
                            </div>
                            <div class="card-body">
                                <form id="calculator-form" class="calculator-form">
                                    <div class="form-grid">
                                        <!-- Product Information -->
                                        <div class="form-section">
                                            <h4>Product Details</h4>
                                            <div class="form-group">
                                                <label for="product-price">Product Price ($)</label>
                                                <input type="number" id="product-price" name="productPrice" 
                                                       class="form-input" step="0.01" min="0"
                                                       value="${calculatorState.selectedProduct?.price || DEFAULT_PARAMS.productPrice}">
                                            </div>
                                            <div class="form-group">
                                                <label for="commission-rate">Commission Rate (%)</label>
                                                <input type="number" id="commission-rate" name="commissionRate" 
                                                       class="form-input" step="0.1" min="0" max="100"
                                                       value="${calculatorState.selectedProduct?.commission || DEFAULT_PARAMS.commissionRate}">
                                            </div>
                                        </div>

                                        <!-- Traffic & Conversion -->
                                        <div class="form-section">
                                            <h4>Traffic & Conversion</h4>
                                            <div class="form-group">
                                                <label for="monthly-traffic">Monthly Traffic</label>
                                                <input type="number" id="monthly-traffic" name="monthlyTraffic" 
                                                       class="form-input" step="100" min="0"
                                                       value="${DEFAULT_PARAMS.monthlyTraffic}">
                                            </div>
                                            <div class="form-group">
                                                <label for="conversion-rate">Conversion Rate (%)</label>
                                                <input type="number" id="conversion-rate" name="conversionRate" 
                                                       class="form-input" step="0.1" min="0" max="100"
                                                       value="${calculatorState.selectedProduct?.conversionRate || DEFAULT_PARAMS.conversionRate}">
                                            </div>
                                            <div class="form-group">
                                                <label for="traffic-growth">Monthly Traffic Growth (%)</label>
                                                <input type="number" id="traffic-growth" name="trafficGrowthRate" 
                                                       class="form-input" step="0.5" min="0" max="100"
                                                       value="${DEFAULT_PARAMS.trafficGrowthRate}">
                                            </div>
                                        </div>

                                        <!-- Expenses -->
                                        <div class="form-section">
                                            <h4>Monthly Expenses</h4>
                                            <div class="form-group">
                                                <label for="ad-spend">Advertising Spend ($)</label>
                                                <input type="number" id="ad-spend" name="adSpend" 
                                                       class="form-input" step="10" min="0"
                                                       value="${DEFAULT_PARAMS.adSpend}">
                                            </div>
                                            <div class="form-group">
                                                <label for="other-expenses">Other Expenses ($)</label>
                                                <input type="number" id="other-expenses" name="otherExpenses" 
                                                       class="form-input" step="10" min="0"
                                                       value="${DEFAULT_PARAMS.otherExpenses}">
                                                <small class="form-help">Tools, hosting, content creation, etc.</small>
                                            </div>
                                        </div>

                                        <!-- Timeframe -->
                                        <div class="form-section">
                                            <h4>Projection Settings</h4>
                                            <div class="form-group">
                                                <label for="timeframe">Projection Timeframe (months)</label>
                                                <select id="timeframe" name="timeframe" class="form-select">
                                                    <option value="3">3 months</option>
                                                    <option value="6">6 months</option>
                                                    <option value="12" selected>12 months</option>
                                                    <option value="24">24 months</option>
                                                </select>
                                            </div>
                                            <div class="form-group">
                                                <label for="seasonality">Seasonality Factor</label>
                                                <select id="seasonality" name="seasonalityFactor" class="form-select">
                                                    <option value="0.8">Low season (-20%)</option>
                                                    <option value="1.0" selected>Neutral</option>
                                                    <option value="1.2">High season (+20%)</option>
                                                    <option value="1.5">Peak season (+50%)</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <div class="form-actions">
                                        <button type="button" id="reset-defaults" class="btn btn-secondary">
                                            🔄 Reset to Defaults
                                        </button>
                                        <button type="submit" class="btn btn-primary">
                                            📊 Calculate Profits
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>

                    <!-- Results Panel -->
                    <div class="calculator-results">
                        <div class="results-summary">
                            <div class="card">
                                <div class="card-header">
                                    <h3>📈 ${this.capitalizeFirst(calculatorState.currentScenario)} Scenario Results</h3>
                                </div>
                                <div class="card-body">
                                    <div id="results-content" class="results-content">
                                        ${this.getResultsHTML()}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Charts Section -->
                        <div class="charts-section">
                            <div class="card">
                                <div class="card-header">
                                    <h3>📊 Projection Charts</h3>
                                    <div class="chart-controls">
                                        <select id="chart-type" class="form-select">
                                            <option value="revenue">Revenue Growth</option>
                                            <option value="profit">Profit Progression</option>
                                            <option value="roi">ROI Timeline</option>
                                            <option value="traffic">Traffic & Conversions</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="card-body">
                                    <canvas id="projection-chart" width="600" height="300"></canvas>
                                </div>
                            </div>
                        </div>

                        <!-- Insights Section -->
                        <div class="insights-section">
                            <div class="card">
                                <div class="card-header">
                                    <h3>💡 AI Insights & Recommendations</h3>
                                </div>
                                <div class="card-body">
                                    <div id="insights-content" class="insights-content">
                                        ${this.getInsightsHTML()}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Calculation History -->
                <div class="history-section">
                    <div class="card">
                        <div class="card-header">
                            <h3>📋 Calculation History</h3>
                            <div class="header-actions">
                                <button id="export-calculations" class="btn btn-outline btn-sm">
                                    📊 Export All
                                </button>
                                <button id="clear-history" class="btn-text">Clear History</button>
                            </div>
                        </div>
                        <div class="card-body">
                            <div id="calculation-history" class="calculation-history">
                                ${this.getHistoryHTML()}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    // Get upgrade required HTML
    getUpgradeRequiredHTML() {
        return `
            <div class="upgrade-required">
                <div class="upgrade-card">
                    <div class="upgrade-icon">⚡</div>
                    <h2>Profit Calculator - Pro Feature</h2>
                    <p>Get detailed profit projections and AI-powered insights to optimize your affiliate campaigns.</p>
                    
                    <div class="feature-preview">
                        <h4>What you'll get:</h4>
                        <ul>
                            <li>✅ Advanced profit projections (3-24 months)</li>
                            <li>✅ Multiple scenario analysis</li>
                            <li>✅ ROI optimization insights</li>
                            <li>✅ Traffic growth modeling</li>
                            <li>✅ Expense tracking & optimization</li>
                            <li>✅ Export detailed reports</li>
                        </ul>
                    </div>

                    <div class="upgrade-actions">
                        <button class="btn btn-primary btn-lg" onclick="app.handleUpgrade()">
                            🚀 Upgrade to Pro - $29/month
                        </button>
                        <p class="upgrade-note">Cancel anytime • 7-day money-back guarantee</p>
                    </div>
                </div>
            </div>
        `;
    },

    // Get selected product HTML
    getSelectedProductHTML() {
        const product = calculatorState.selectedProduct;
        return `
            <div class="selected-product">
                <div class="card">
                    <div class="card-body">
                        <div class="product-info">
                            <div class="product-details">
                                <h4>📦 Selected Product</h4>
                                <div class="product-name">${product.name}</div>
                                <div class="product-meta">
                                    ${product.category} • ${uiComponents.formatCurrency(product.price)} • ${product.commission}% commission
                                </div>
                            </div>
                            <button class="btn btn-outline btn-sm" onclick="ProfitCalculator.clearSelectedProduct()">
                                Clear Selection
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    // Get results HTML
    getResultsHTML() {
        if (!calculatorState.currentCalculation) {
            return '<div class="loading-state">Loading calculation...</div>';
        }

        const calc = calculatorState.currentCalculation;
        const scenario = calc.scenarios[calculatorState.currentScenario];

        return `
            <div class="results-grid">
                <!-- Key Metrics -->
                <div class="metric-card primary">
                    <div class="metric-icon">💰</div>
                    <div class="metric-content">
                        <div class="metric-label">Total Profit (${calc.timeframe} months)</div>
                        <div class="metric-value">${uiComponents.formatCurrency(scenario.totalProfit)}</div>
                        <div class="metric-change positive">
                            ${scenario.profitMargin.toFixed(1)}% margin
                        </div>
                    </div>
                </div>

                <div class="metric-card secondary">
                    <div class="metric-icon">📊</div>
                    <div class="metric-content">
                        <div class="metric-label">Monthly Revenue (Avg)</div>
                        <div class="metric-value">${uiComponents.formatCurrency(scenario.avgMonthlyRevenue)}</div>
                        <div class="metric-change positive">
                            ${((scenario.finalMonthRevenue / scenario.firstMonthRevenue - 1) * 100).toFixed(0)}% growth
                        </div>
                    </div>
                </div>

                <div class="metric-card tertiary">
                    <div class="metric-icon">🎯</div>
                    <div class="metric-content">
                        <div class="metric-label">ROI</div>
                        <div class="metric-value">${scenario.roi.toFixed(0)}%</div>
                        <div class="metric-change ${scenario.roi > 200 ? 'positive' : scenario.roi > 100 ? 'neutral' : 'negative'}">
                            ${scenario.roi > 200 ? 'Excellent' : scenario.roi > 100 ? 'Good' : 'Needs improvement'}
                        </div>
                    </div>
                </div>

                <div class="metric-card quaternary">
                    <div class="metric-icon">⚡</div>
                    <div class="metric-content">
                        <div class="metric-label">Break-even Point</div>
                        <div class="metric-value">${scenario.breakEvenMonth}</div>
                        <div class="metric-change">
                            ${scenario.breakEvenMonth <= 3 ? 'Fast' : scenario.breakEvenMonth <= 6 ? 'Good' : 'Slow'} break-even
                        </div>
                    </div>
                </div>
            </div>

            <!-- Detailed Breakdown -->
            <div class="results-breakdown">
                <div class="breakdown-section">
                    <h4>Monthly Breakdown</h4>
                    <div class="breakdown-table">
                        <div class="table-header">
                            <div>Metric</div>
                            <div>Month 1</div>
                            <div>Month ${Math.floor(calc.timeframe/2)}</div>
                            <div>Month ${calc.timeframe}</div>
                        </div>
                        <div class="table-row">
                            <div><strong>Traffic</strong></div>
                            <div>${uiComponents.formatNumber(scenario.monthlyData[0].traffic)}</div>
                            <div>${uiComponents.formatNumber(scenario.monthlyData[Math.floor(calc.timeframe/2)-1].traffic)}</div>
                            <div>${uiComponents.formatNumber(scenario.monthlyData[calc.timeframe-1].traffic)}</div>
                        </div>
                        <div class="table-row">
                            <div><strong>Conversions</strong></div>
                            <div>${scenario.monthlyData[0].conversions}</div>
                            <div>${scenario.monthlyData[Math.floor(calc.timeframe/2)-1].conversions}</div>
                            <div>${scenario.monthlyData[calc.timeframe-1].conversions}</div>
                        </div>
                        <div class="table-row">
                            <div><strong>Revenue</strong></div>
                            <div>${uiComponents.formatCurrency(scenario.monthlyData[0].revenue)}</div>
                            <div>${uiComponents.formatCurrency(scenario.monthlyData[Math.floor(calc.timeframe/2)-1].revenue)}</div>
                            <div>${uiComponents.formatCurrency(scenario.monthlyData[calc.timeframe-1].revenue)}</div>
                        </div>
                        <div class="table-row">
                            <div><strong>Profit</strong></div>
                            <div class="${scenario.monthlyData[0].profit < 0 ? 'negative' : 'positive'}">${uiComponents.formatCurrency(scenario.monthlyData[0].profit)}</div>
                            <div class="${scenario.monthlyData[Math.floor(calc.timeframe/2)-1].profit < 0 ? 'negative' : 'positive'}">${uiComponents.formatCurrency(scenario.monthlyData[Math.floor(calc.timeframe/2)-1].profit)}</div>
                            <div class="${scenario.monthlyData[calc.timeframe-1].profit < 0 ? 'negative' : 'positive'}">${uiComponents.formatCurrency(scenario.monthlyData[calc.timeframe-1].profit)}</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Action Buttons -->
            <div class="results-actions">
                <button class="btn btn-primary" onclick="ProfitCalculator.saveCalculation()">
                    💾 Save Calculation
                </button>
                <button class="btn btn-outline" onclick="ProfitCalculator.exportCalculation()">
                    📊 Export Report
                </button>
                <button class="btn btn-secondary" onclick="ProfitCalculator.optimizeParameters()">
                    🎯 Optimize Parameters
                </button>
            </div>
        `;
    },

    // Get insights HTML
    getInsightsHTML() {
        if (!calculatorState.currentCalculation) {
            return '<div class="loading-state">Loading insights...</div>';
        }

        const calc = calculatorState.currentCalculation;
        const scenario = calc.scenarios[calculatorState.currentScenario];
        const insights = this.generateInsights(scenario, calc);

        return `
            <div class="insights-list">
                ${insights.map(insight => `
                    <div class="insight-item ${insight.type}">
                        <div class="insight-icon">${insight.icon}</div>
                        <div class="insight-content">
                            <div class="insight-title">${insight.title}</div>
                            <div class="insight-description">${insight.description}</div>
                            ${insight.action ? `
                                <div class="insight-action">
                                    <button class="btn btn-sm btn-outline" onclick="${insight.action.onclick}">
                                        ${insight.action.text}
                                    </button>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    },

    // Get history HTML
    getHistoryHTML() {
        if (calculatorState.calculationHistory.length === 0) {
            return '<div class="empty-state-small">No calculation history</div>';
        }

        return calculatorState.calculationHistory.map(calc => `
            <div class="history-item" onclick="ProfitCalculator.loadHistoryCalculation('${calc.id}')">
                <div class="history-content">
                    <div class="history-title">${calc.title || `${calc.productName || 'Product'} - ${this.capitalizeFirst(calc.scenario)}`}</div>
                    <div class="history-details">
                        ${uiComponents.formatCurrency(calc.totalProfit)} profit • ${calc.timeframe} months • ${calc.roi.toFixed(0)}% ROI
                    </div>
                    <div class="history-time">${uiComponents.formatDate(calc.timestamp)}</div>
                </div>
                <div class="history-actions">
                    <button class="btn-icon" onclick="event.stopPropagation(); ProfitCalculator.deleteHistoryItem('${calc.id}');" title="Delete">
                        🗑️
                    </button>
                </div>
            </div>
        `).join('');
    },

    // Initialize interactions
    initializeInteractions() {
        // Calculator form
        const calculatorForm = document.getElementById('calculator-form');
        if (calculatorForm) {
            // Real-time calculation on input change
            calculatorForm.addEventListener('input', this.debounce(() => {
                this.performCalculation();
            }, 500));

            calculatorForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.performCalculation();
            });
        }

        // Reset defaults
        const resetBtn = document.getElementById('reset-defaults');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.resetToDefaults());
        }

        // Chart type selector
        const chartType = document.getElementById('chart-type');
        if (chartType) {
            chartType.addEventListener('change', (e) => {
                this.updateChart(e.target.value);
            });
        }

        // Export and history actions
        const exportBtn = document.getElementById('export-calculations');
        const clearHistoryBtn = document.getElementById('clear-history');

        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportAllCalculations());
        }

        if (clearHistoryBtn) {
            clearHistoryBtn.addEventListener('click', () => this.clearCalculationHistory());
        }
    },

    // Perform calculation
    performCalculation() {
        try {
            const formData = this.getFormData();
            const calculation = this.calculateProfits(formData);
            
            calculatorState.currentCalculation = calculation;
            
            // Update results
            this.updateResults();
            
            // Update charts
            this.updateChart();
            
            // Update insights
            this.updateInsights();
            
        } catch (error) {
            console.error('❌ Calculation error:', error);
            uiComponents.showToast({
                type: 'error',
                message: 'Error performing calculation'
            });
        }
    },

    // Get form data
    getFormData() {
        const form = document.getElementById('calculator-form');
        if (!form) return DEFAULT_PARAMS;

        const formData = new FormData(form);
        
        return {
            productPrice: parseFloat(formData.get('productPrice')) || DEFAULT_PARAMS.productPrice,
            commissionRate: parseFloat(formData.get('commissionRate')) || DEFAULT_PARAMS.commissionRate,
            conversionRate: parseFloat(formData.get('conversionRate')) || DEFAULT_PARAMS.conversionRate,
            monthlyTraffic: parseInt(formData.get('monthlyTraffic')) || DEFAULT_PARAMS.monthlyTraffic,
            adSpend: parseFloat(formData.get('adSpend')) || DEFAULT_PARAMS.adSpend,
            otherExpenses: parseFloat(formData.get('otherExpenses')) || DEFAULT_PARAMS.otherExpenses,
            timeframe: parseInt(formData.get('timeframe')) || DEFAULT_PARAMS.timeframe,
            trafficGrowthRate: parseFloat(formData.get('trafficGrowthRate')) || DEFAULT_PARAMS.trafficGrowthRate,
            seasonalityFactor: parseFloat(formData.get('seasonalityFactor')) || DEFAULT_PARAMS.seasonalityFactor
        };
    },

    // Calculate profits for all scenarios
    calculateProfits(params) {
        const calculation = {
            id: `calc_${Date.now()}`,
            timestamp: new Date(),
            parameters: params,
            timeframe: params.timeframe,
            scenarios: {}
        };

        // Calculate each scenario
        calculatorState.scenarios.forEach(scenarioName => {
            calculation.scenarios[scenarioName] = this.calculateScenario(params, scenarioName);
        });

        return calculation;
    },

    // Calculate single scenario
    calculateScenario(params, scenarioName) {
        const multipliers = SCENARIO_MULTIPLIERS[scenarioName];
        const monthlyData = [];
        
        // Adjusted parameters for this scenario
        const adjustedParams = {
            productPrice: params.productPrice,
            commissionRate: params.commissionRate * multipliers.commission,
            conversionRate: params.conversionRate * multipliers.conversionRate,
            monthlyTraffic: params.monthlyTraffic * multipliers.traffic,
            adSpend: params.adSpend * multipliers.expenses,
            otherExpenses: params.otherExpenses * multipliers.expenses,
            trafficGrowthRate: params.trafficGrowthRate * multipliers.growth,
            seasonalityFactor: params.seasonalityFactor
        };

        let totalRevenue = 0;
        let totalExpenses = 0;
        let totalProfit = 0;
        let breakEvenMonth = null;
        let cumulativeProfit = 0;

        // Calculate month by month
        for (let month = 1; month <= params.timeframe; month++) {
            // Calculate traffic with growth
            const growthMultiplier = Math.pow(1 + adjustedParams.trafficGrowthRate / 100, month - 1);
            const traffic = Math.round(adjustedParams.monthlyTraffic * growthMultiplier * adjustedParams.seasonalityFactor);
            
            // Calculate conversions
            const conversions = Math.round(traffic * (adjustedParams.conversionRate / 100));
            
            // Calculate revenue
            const commissionPerSale = adjustedParams.productPrice * (adjustedParams.commissionRate / 100);
            const revenue = conversions * commissionPerSale;
            
            // Calculate expenses
            const expenses = adjustedParams.adSpend + adjustedParams.otherExpenses;
            
            // Calculate profit
            const profit = revenue - expenses;
            
            // Add to totals
            totalRevenue += revenue;
            totalExpenses += expenses;
            totalProfit += profit;
            cumulativeProfit += profit;
            
            // Check for break-even
            if (breakEvenMonth === null && cumulativeProfit > 0) {
                breakEvenMonth = month;
            }

            monthlyData.push({
                month,
                traffic,
                conversions,
                revenue,
                expenses,
                profit,
                cumulativeProfit
            });
        }

        // Calculate metrics
        const avgMonthlyRevenue = totalRevenue / params.timeframe;
        const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
        const roi = totalExpenses > 0 ? (totalProfit / totalExpenses) * 100 : 0;
        const firstMonthRevenue = monthlyData[0].revenue;
        const finalMonthRevenue = monthlyData[monthlyData.length - 1].revenue;

        return {
            totalRevenue,
            totalExpenses,
            totalProfit,
            avgMonthlyRevenue,
            profitMargin,
            roi,
            breakEvenMonth: breakEvenMonth || `${params.timeframe}+`,
            firstMonthRevenue,
            finalMonthRevenue,
            monthlyData,
            adjustedParams
        };
    },

    // Switch scenario
    switchScenario(scenario) {
        calculatorState.currentScenario = scenario;
        
        // Update active tab
        document.querySelectorAll('.scenario-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[onclick="ProfitCalculator.switchScenario('${scenario}')"]`).classList.add('active');
        
        // Update results
        this.updateResults();
        this.updateChart();
        this.updateInsights();
    },

    // Update results display
    updateResults() {
        const resultsContent = document.getElementById('results-content');
        if (resultsContent) {
            resultsContent.innerHTML = this.getResultsHTML();
        }
    },

    // Update insights display
    updateInsights() {
        const insightsContent = document.getElementById('insights-content');
        if (insightsContent) {
            insightsContent.innerHTML = this.getInsightsHTML();
        }
    },

    // Generate insights
    generateInsights(scenario, calculation) {
        const insights = [];
        
        // ROI insights
        if (scenario.roi < 100) {
            insights.push({
                type: 'warning',
                icon: '⚠️',
                title: 'Low ROI Detected',
                description: `Your current ROI of ${scenario.roi.toFixed(0)}% is below 100%. Consider optimizing your traffic sources or reducing expenses.`,
                action: {
                    text: 'Optimize',
                    onclick: 'ProfitCalculator.optimizeParameters()'
                }
            });
        } else if (scenario.roi > 300) {
            insights.push({
                type: 'success',
                icon: '🎉',
                title: 'Excellent ROI!',
                description: `Your ROI of ${scenario.roi.toFixed(0)}% is excellent! Consider scaling your traffic to maximize profits.`,
                action: {
                    text: 'Scale Strategy',
                    onclick: 'ProfitCalculator.showScalingStrategy()'
                }
            });
        }

        // Break-even insights
        if (typeof scenario.breakEvenMonth === 'number') {
            if (scenario.breakEvenMonth <= 3) {
                insights.push({
                    type: 'success',
                    icon: '⚡',
                    title: 'Fast Break-Even',
                    description: `You'll break even in month ${scenario.breakEvenMonth}. This is excellent for cash flow!`
                });
            } else if (scenario.breakEvenMonth > 6) {
                insights.push({
                    type: 'warning',
                    icon: '⏰',
                    title: 'Slow Break-Even',
                    description: `Break-even in month ${scenario.breakEvenMonth} is quite slow. Consider improving conversion rates or reducing initial expenses.`
                });
            }
        }

        // Traffic growth insights
        const trafficGrowth = ((scenario.finalMonthRevenue / scenario.firstMonthRevenue - 1) * 100);
        if (trafficGrowth < 50) {
            insights.push({
                type: 'info',
                icon: '📈',
                title: 'Boost Traffic Growth',
                description: `Your traffic growth of ${trafficGrowth.toFixed(0)}% could be improved. Consider investing in SEO or content marketing for organic growth.`
            });
        }

        // Profit margin insights
        if (scenario.profitMargin < 20) {
            insights.push({
                type: 'warning',
                icon: '💰',
                title: 'Low Profit Margin',
                description: `Your profit margin of ${scenario.profitMargin.toFixed(1)}% is low. Look for higher-commission products or reduce expenses.`
            });
        } else if (scenario.profitMargin > 50) {
            insights.push({
                type: 'success',
                icon: '💎',
                title: 'High Profit Margin',
                description: `Excellent ${scenario.profitMargin.toFixed(1)}% profit margin! This product has great potential for scaling.`
            });
        }

        // Seasonal insights
        if (calculation.parameters.seasonalityFactor > 1.2) {
            insights.push({
                type: 'info',
                icon: '🎄',
                title: 'Seasonal Opportunity',
                description: 'High seasonality factor detected. Prepare for increased demand and adjust inventory/marketing accordingly.'
            });
        }

        return insights.slice(0, 4); // Limit to 4 insights
    },

    // Initialize charts
    initializeCharts() {
        this.updateChart('revenue');
    },

    // Update chart
    updateChart(chartType = 'revenue') {
        const canvas = document.getElementById('projection-chart');
        if (!canvas || !calculatorState.currentCalculation) return;

        const ctx = canvas.getContext('2d');
        const scenario = calculatorState.currentCalculation.scenarios[calculatorState.currentScenario];
        
        this.drawChart(ctx, canvas, scenario, chartType);
    },

    // Draw chart
    drawChart(ctx, canvas, scenario, chartType) {
        const width = canvas.width;
        const height = canvas.height;
        const padding = 60;
        const chartWidth = width - padding * 2;
        const chartHeight = height - padding * 2;
        
        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        
        // Get data based on chart type
        let data, label, color;
        switch (chartType) {
            case 'revenue':
                data = scenario.monthlyData.map(d => d.revenue);
                label = 'Revenue';
                color = '#10b981';
                break;
            case 'profit':
                data = scenario.monthlyData.map(d => d.profit);
                label = 'Profit';
                color = '#3b82f6';
                break;
            case 'roi':
                data = scenario.monthlyData.map((d, i) => {
                    const totalExpenses = scenario.monthlyData.slice(0, i + 1).reduce((sum, m) => sum + m.expenses, 0);
                    const cumulativeProfit = scenario.monthlyData.slice(0, i + 1).reduce((sum, m) => sum + m.profit, 0);
                    return totalExpenses > 0 ? (cumulativeProfit / totalExpenses) * 100 : 0;
                });
                label = 'ROI (%)';
                color = '#8b5cf6';
                break;
            case 'traffic':
                data = scenario.monthlyData.map(d => d.traffic);
                label = 'Traffic';
                color = '#f59e0b';
                break;
            default:
                data = scenario.monthlyData.map(d => d.revenue);
                label = 'Revenue';
                color = '#10b981';
        }
        
        // Find min/max values
        const maxValue = Math.max(...data);
        const minValue = Math.min(...data, 0);
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
            
            // Y-axis labels
            const value = maxValue - (range / 5) * i;
            ctx.fillStyle = '#6b7280';
            ctx.font = '12px Inter';
            ctx.textAlign = 'right';
            ctx.fillText(this.formatChartValue(value, chartType), padding - 10, y + 4);
        }
        
        // Vertical grid lines and X-axis labels
        const months = scenario.monthlyData.length;
        for (let i = 0; i <= months; i++) {
            const x = padding + (chartWidth / months) * i;
            ctx.beginPath();
            ctx.moveTo(x, padding);
            ctx.lineTo(x, height - padding);
            ctx.stroke();
            
            // X-axis labels
            if (i < months) {
                ctx.fillStyle = '#6b7280';
                ctx.font = '12px Inter';
                ctx.textAlign = 'center';
                ctx.fillText(`M${i + 1}`, x + (chartWidth / months) / 2, height - padding + 20);
            }
        }
        
        // Draw data line
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
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
            ctx.arc(x, y, 4, 0, 2 * Math.PI);
            ctx.fill();
        });
        
        // Draw chart title
        ctx.fillStyle = '#1f2937';
        ctx.font = 'bold 16px Inter';
        ctx.textAlign = 'center';
        ctx.fillText(`${label} Projection - ${this.capitalizeFirst(calculatorState.currentScenario)} Scenario`, width / 2, 30);
    },

    // Format chart values
    formatChartValue(value, chartType) {
        if (chartType === 'roi') {
            return `${value.toFixed(0)}%`;
        } else if (chartType === 'traffic') {
            return uiComponents.formatNumber(value);
        } else {
            return value >= 1000 ? `$${(value / 1000).toFixed(0)}k` : `$${value.toFixed(0)}`;
        }
    },

    // Reset to defaults
    resetToDefaults() {
        const form = document.getElementById('calculator-form');
        if (!form) return;

        // Reset form values
        Object.entries(DEFAULT_PARAMS).forEach(([key, value]) => {
            const input = form.querySelector(`[name="${key}"]`);
            if (input) {
                input.value = value;
            }
        });

        // Recalculate
        this.performCalculation();

        uiComponents.showToast({
            type: 'success',
            message: 'Parameters reset to defaults'
        });
    },

    // Save calculation
    async saveCalculation() {
        if (!calculatorState.currentCalculation) return;

        try {
            const calculationToSave = {
                ...calculatorState.currentCalculation,
                title: `${calculatorState.selectedProduct?.name || 'Product'} - ${this.capitalizeFirst(calculatorState.currentScenario)}`,
                productName: calculatorState.selectedProduct?.name || 'Product',
                scenario: calculatorState.currentScenario,
                totalProfit: calculatorState.currentCalculation.scenarios[calculatorState.currentScenario].totalProfit,
                roi: calculatorState.currentCalculation.scenarios[calculatorState.currentScenario].roi,
                userId: authManager.getCurrentUser().uid
            };

            calculatorState.calculationHistory.unshift(calculationToSave);
            
            // Keep only last 20 calculations
            calculatorState.calculationHistory = calculatorState.calculationHistory.slice(0, 20);
            
            // Save to localStorage
            localStorage.setItem('profitCalculator_history', JSON.stringify(calculatorState.calculationHistory));

            // Update history display
            this.updateHistoryDisplay();

            uiComponents.showToast({
                type: 'success',
                message: 'Calculation saved to history!'
            });

        } catch (error) {
            console.error('❌ Error saving calculation:', error);
            uiComponents.showToast({
                type: 'error',
                message: 'Failed to save calculation'
            });
        }
    },

    // Export calculation
    exportCalculation() {
        if (!calculatorState.currentCalculation) return;

        const calc = calculatorState.currentCalculation;
        const scenario = calc.scenarios[calculatorState.currentScenario];
        
        const exportData = {
            calculation: calc,
            scenario: calculatorState.currentScenario,
            results: scenario,
            exported_at: new Date().toISOString()
        };

        const filename = `profit-calculation-${calculatorState.currentScenario}-${Date.now()}.json`;
        uiComponents.downloadFile(JSON.stringify(exportData, null, 2), filename, 'application/json');

        uiComponents.showToast({
            type: 'success',
            message: 'Calculation exported successfully!'
        });
    },

    // Export all calculations
    exportAllCalculations() {
        if (calculatorState.calculationHistory.length === 0) {
            uiComponents.showToast({
                type: 'warning',
                message: 'No calculations to export'
            });
            return;
        }

        const csvData = this.convertCalculationsToCSV(calculatorState.calculationHistory);
        const filename = `profit-calculations-${new Date().toISOString().split('T')[0]}.csv`;
        uiComponents.downloadFile(csvData, filename, 'text/csv');

        uiComponents.showToast({
            type: 'success',
            message: 'All calculations exported successfully!'
        });
    },

    // Convert calculations to CSV
    convertCalculationsToCSV(calculations) {
        const headers = [
            'Date', 'Product', 'Scenario', 'Timeframe (months)', 
            'Total Revenue', 'Total Expenses', 'Total Profit', 
            'ROI (%)', 'Break-even Month', 'Profit Margin (%)'
        ];

        const rows = calculations.map(calc => [
            calc.timestamp.toLocaleDateString(),
            calc.productName || 'Unknown',
            calc.scenario,
            calc.timeframe,
            calc.scenarios[calc.scenario].totalRevenue.toFixed(2),
            calc.scenarios[calc.scenario].totalExpenses.toFixed(2),
            calc.scenarios[calc.scenario].totalProfit.toFixed(2),
            calc.scenarios[calc.scenario].roi.toFixed(2),
            calc.scenarios[calc.scenario].breakEvenMonth,
            calc.scenarios[calc.scenario].profitMargin.toFixed(2)
        ]);

        return [headers, ...rows]
            .map(row => row.map(field => `"${field}"`).join(','))
            .join('\n');
    },

    // Optimize parameters
    optimizeParameters() {
        uiComponents.createModal({
            id: 'optimization-modal',
            title: '🎯 Parameter Optimization',
            size: 'large',
            content: `
                <div class="optimization-content">
                    <h4>AI Optimization Suggestions</h4>
                    <p>Based on your current parameters, here are optimization recommendations:</p>
                    
                    <div class="optimization-suggestions">
                        <div class="suggestion-item">
                            <div class="suggestion-icon">📈</div>
                            <div class="suggestion-content">
                                <h5>Increase Conversion Rate</h5>
                                <p>Current: ${calculatorState.currentCalculation?.parameters.conversionRate}% → Suggested: ${(calculatorState.currentCalculation?.parameters.conversionRate * 1.3).toFixed(1)}%</p>
                                <small>Improve landing page, add social proof, optimize CTAs</small>
                            </div>
                            <button class="btn btn-sm btn-outline" onclick="ProfitCalculator.applyOptimization('conversionRate', ${calculatorState.currentCalculation?.parameters.conversionRate * 1.3})">
                                Apply
                            </button>
                        </div>
                        
                        <div class="suggestion-item">
                            <div class="suggestion-icon">💰</div>
                            <div class="suggestion-content">
                                <h5>Reduce Ad Spend</h5>
                                <p>Current: $${calculatorState.currentCalculation?.parameters.adSpend} → Suggested: $${Math.round(calculatorState.currentCalculation?.parameters.adSpend * 0.8)}</p>
                                <small>Focus on organic traffic, improve targeting</small>
                            </div>
                            <button class="btn btn-sm btn-outline" onclick="ProfitCalculator.applyOptimization('adSpend', ${Math.round(calculatorState.currentCalculation?.parameters.adSpend * 0.8)})">
                                Apply
                            </button>
                        </div>
                        
                        <div class="suggestion-item">
                            <div class="suggestion-icon">🚀</div>
                            <div class="suggestion-content">
                                <h5>Boost Traffic Growth</h5>
                                <p>Current: ${calculatorState.currentCalculation?.parameters.trafficGrowthRate}% → Suggested: ${(calculatorState.currentCalculation?.parameters.trafficGrowthRate * 1.5).toFixed(1)}%</p>
                                <small>Invest in SEO, content marketing, viral campaigns</small>
                            </div>
                            <button class="btn btn-sm btn-outline" onclick="ProfitCalculator.applyOptimization('trafficGrowthRate', ${calculatorState.currentCalculation?.parameters.trafficGrowthRate * 1.5})">
                                Apply
                            </button>
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
                    text: 'Apply All',
                    class: 'btn-primary',
                    onclick: 'ProfitCalculator.applyAllOptimizations(); uiComponents.closeModal();'
                }
            ]
        });
    },

    // Apply optimization
    applyOptimization(parameter, value) {
        const input = document.querySelector(`[name="${parameter}"]`);
        if (input) {
            input.value = value;
            this.performCalculation();
            
            uiComponents.showToast({
                type: 'success',
                message: `${parameter} optimized!`
            });
        }
        
        uiComponents.closeModal();
    },

    // Apply all optimizations
    applyAllOptimizations() {
        const params = calculatorState.currentCalculation?.parameters;
        if (!params) return;

        this.applyOptimization('conversionRate', params.conversionRate * 1.3);
        this.applyOptimization('adSpend', Math.round(params.adSpend * 0.8));
        this.applyOptimization('trafficGrowthRate', params.trafficGrowthRate * 1.5);
    },

    // Show scaling strategy
    showScalingStrategy() {
        uiComponents.createModal({
            id: 'scaling-modal',
            title: '🚀 Scaling Strategy',
            content: `
                <div class="scaling-content">
                    <h4>Your ROI is excellent! Here's how to scale:</h4>
                    
                    <div class="scaling-strategies">
                        <div class="strategy-item">
                            <h5>📈 Increase Traffic</h5>
                            <p>Double your traffic to maximize profits with your current conversion rate.</p>
                        </div>
                        
                        <div class="strategy-item">
                            <h5>💰 Raise Ad Budget</h5>
                            <p>Your ROI supports higher ad spend. Consider increasing by 50-100%.</p>
                        </div>
                        
                        <div class="strategy-item">
                            <h5>🎯 Add More Products</h5>
                            <p>Diversify with similar high-converting products in your niche.</p>
                        </div>
                        
                        <div class="strategy-item">
                            <h5>🔄 Optimize Further</h5>
                            <p>Fine-tune your funnel to squeeze even more profit from current traffic.</p>
                        </div>
                    </div>
                </div>
            `,
            actions: [
                {
                    text: 'Got it!',
                    class: 'btn-primary',
                    onclick: 'uiComponents.closeModal()'
                }
            ]
        });
    },

    // Load calculation history
    async loadCalculationHistory() {
        try {
            const saved = localStorage.getItem('profitCalculator_history');
            if (saved) {
                calculatorState.calculationHistory = JSON.parse(saved).map(calc => ({
                    ...calc,
                    timestamp: new Date(calc.timestamp)
                }));
            }
        } catch (error) {
            console.error('❌ Error loading calculation history:', error);
        }
    },

    // Load history calculation
    loadHistoryCalculation(calcId) {
        const calc = calculatorState.calculationHistory.find(c => c.id === calcId);
        if (!calc) return;

        // Populate form with historical parameters
        const form = document.getElementById('calculator-form');
        if (form) {
            Object.entries(calc.parameters).forEach(([key, value]) => {
                const input = form.querySelector(`[name="${key}"]`);
                if (input) {
                    input.value = value;
                }
            });
        }

        // Set scenario
        calculatorState.currentScenario = calc.scenario;
        this.switchScenario(calc.scenario);

        // Recalculate
        this.performCalculation();

        uiComponents.showToast({
            type: 'success',
            message: 'Historical calculation loaded'
        });
    },

    // Delete history item
    deleteHistoryItem(calcId) {
        calculatorState.calculationHistory = calculatorState.calculationHistory.filter(c => c.id !== calcId);
        localStorage.setItem('profitCalculator_history', JSON.stringify(calculatorState.calculationHistory));
        
        this.updateHistoryDisplay();

        uiComponents.showToast({
            type: 'success',
            message: 'Calculation deleted from history'
        });
    },

    // Clear calculation history
    clearCalculationHistory() {
        if (!confirm('Are you sure you want to clear all calculation history?')) return;

        calculatorState.calculationHistory = [];
        localStorage.removeItem('profitCalculator_history');
        
        this.updateHistoryDisplay();

        uiComponents.showToast({
            type: 'success',
            message: 'Calculation history cleared'
        });
    },

    // Update history display
    updateHistoryDisplay() {
        const historyContainer = document.getElementById('calculation-history');
        if (historyContainer) {
            historyContainer.innerHTML = this.getHistoryHTML();
        }
    },

    // Load selected product from session storage
    loadSelectedProduct() {
        try {
            const savedProduct = sessionStorage.getItem('selectedProduct');
            if (savedProduct) {
                calculatorState.selectedProduct = JSON.parse(savedProduct);
                sessionStorage.removeItem('selectedProduct'); // Clear after use
            }
        } catch (error) {
            console.error('❌ Error loading selected product:', error);
        }
    },

    // Clear selected product
    clearSelectedProduct() {
        calculatorState.selectedProduct = null;
        this.render(); // Re-render to update UI
    },

    // Utility functions
    getScenarioIcon(scenario) {
        const icons = {
            conservative: '🛡️',
            realistic: '📊',
            optimistic: '🚀'
        };
        return icons[scenario] || '📊';
    },

    capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    },

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
    },

    // Cleanup
    cleanup() {
        calculatorState.currentCalculation = null;
        console.log('💰 Profit Calculator cleanup completed');
    }
};

// Export module
export default ProfitCalculator;

console.log('💰 Profit Calculator module loaded');