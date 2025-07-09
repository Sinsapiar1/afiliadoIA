/**
 * Diagnostics Utility
 * AffiliatePro - AI-Powered Affiliate Marketing Platform
 * 
 * This utility helps diagnose configuration issues and system health
 */

import config from '../config/environment.js';
import { auth, db } from '../core/firebase-config.js';
import errorHandler from './error-handler.js';

class Diagnostics {
    constructor() {
        this.results = {
            firebase: { status: 'unknown', details: [] },
            ai: { status: 'unknown', details: [] },
            browser: { status: 'unknown', details: [] },
            performance: { status: 'unknown', details: [] },
            features: { status: 'unknown', details: [] }
        };
    }

    // Run all diagnostics
    async runAll() {
        console.log('🔍 Running system diagnostics...');
        
        await Promise.all([
            this.checkFirebase(),
            this.checkAI(),
            this.checkBrowser(),
            this.checkPerformance(),
            this.checkFeatures()
        ]);

        this.generateReport();
        return this.results;
    }

    // Check Firebase configuration
    async checkFirebase() {
        const details = [];
        
        try {
            // Check if Firebase is initialized
            if (!auth || !db) {
                details.push('❌ Firebase services not initialized');
                this.results.firebase.status = 'error';
                return;
            }

            // Check authentication state
            const authState = auth.currentUser;
            if (authState) {
                details.push('✅ User authenticated');
            } else {
                details.push('ℹ️ No user authenticated (normal for new users)');
            }

            // Test Firestore connection
            try {
                const testDoc = await db.collection('_test').doc('connection').get();
                details.push('✅ Firestore connection successful');
            } catch (error) {
                details.push('❌ Firestore connection failed: ' + error.message);
            }

            // Check configuration
            const configKeys = ['apiKey', 'authDomain', 'projectId'];
            const missingKeys = configKeys.filter(key => !config.firebase[key]);
            
            if (missingKeys.length > 0) {
                details.push('❌ Missing Firebase config keys: ' + missingKeys.join(', '));
            } else {
                details.push('✅ Firebase configuration complete');
            }

            this.results.firebase.status = details.some(d => d.includes('❌')) ? 'error' : 'success';
            this.results.firebase.details = details;

        } catch (error) {
            this.results.firebase.status = 'error';
            this.results.firebase.details = ['❌ Firebase check failed: ' + error.message];
        }
    }

    // Check AI services
    async checkAI() {
        const details = [];
        
        try {
            // Check Gemini API
            if (config.ai.gemini.apiKey && config.ai.gemini.apiKey !== 'AIzaSyBXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX') {
                details.push('✅ Gemini API key configured');
                
                // Test API call (optional)
                try {
                    const response = await fetch(`${config.ai.gemini.endpoint}?key=${config.ai.gemini.apiKey}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            contents: [{
                                parts: [{
                                    text: 'Hello, this is a test message.'
                                }]
                            }],
                            generationConfig: {
                                maxOutputTokens: 10
                            }
                        })
                    });
                    
                    if (response.ok) {
                        details.push('✅ Gemini API connection successful');
                    } else {
                        details.push('⚠️ Gemini API test failed: ' + response.status);
                    }
                } catch (error) {
                    details.push('⚠️ Gemini API test failed: ' + error.message);
                }
            } else {
                details.push('⚠️ Gemini API key not configured (using demo mode)');
            }

            // Check OpenAI API
            if (config.ai.openai.apiKey && config.ai.openai.apiKey !== 'sk-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX') {
                details.push('✅ OpenAI API key configured');
            } else {
                details.push('ℹ️ OpenAI API key not configured (optional)');
            }

            this.results.ai.status = details.some(d => d.includes('❌')) ? 'error' : 
                                   details.some(d => d.includes('⚠️')) ? 'warning' : 'success';
            this.results.ai.details = details;

        } catch (error) {
            this.results.ai.status = 'error';
            this.results.ai.details = ['❌ AI check failed: ' + error.message];
        }
    }

    // Check browser compatibility
    checkBrowser() {
        const details = [];
        
        try {
            // Check ES6 support
            if (typeof Promise !== 'undefined') {
                details.push('✅ ES6 Promises supported');
            } else {
                details.push('❌ ES6 Promises not supported');
            }

            // Check fetch API
            if (typeof fetch !== 'undefined') {
                details.push('✅ Fetch API supported');
            } else {
                details.push('❌ Fetch API not supported');
            }

            // Check localStorage
            if (typeof localStorage !== 'undefined') {
                details.push('✅ LocalStorage supported');
            } else {
                details.push('❌ LocalStorage not supported');
            }

            // Check service workers
            if ('serviceWorker' in navigator) {
                details.push('✅ Service Workers supported');
            } else {
                details.push('ℹ️ Service Workers not supported (PWA features limited)');
            }

            // Check browser version
            const userAgent = navigator.userAgent;
            details.push(`ℹ️ Browser: ${userAgent}`);

            // Check screen size
            details.push(`ℹ️ Screen: ${screen.width}x${screen.height}`);

            this.results.browser.status = details.some(d => d.includes('❌')) ? 'error' : 'success';
            this.results.browser.details = details;

        } catch (error) {
            this.results.browser.status = 'error';
            this.results.browser.details = ['❌ Browser check failed: ' + error.message];
        }
    }

    // Check performance
    checkPerformance() {
        const details = [];
        
        try {
            // Check if performance API is available
            if (window.performance && window.performance.timing) {
                details.push('✅ Performance API available');
                
                // Check page load time
                const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
                details.push(`ℹ️ Page load time: ${loadTime}ms`);
                
                if (loadTime < 2000) {
                    details.push('✅ Page load time is good');
                } else if (loadTime < 5000) {
                    details.push('⚠️ Page load time is acceptable');
                } else {
                    details.push('❌ Page load time is slow');
                }
            } else {
                details.push('ℹ️ Performance API not available');
            }

            // Check memory usage
            if (performance.memory) {
                const memory = performance.memory;
                const usedMB = Math.round(memory.usedJSHeapSize / 1024 / 1024);
                const totalMB = Math.round(memory.totalJSHeapSize / 1024 / 1024);
                details.push(`ℹ️ Memory usage: ${usedMB}MB / ${totalMB}MB`);
            }

            // Check network connection
            if (navigator.connection) {
                const connection = navigator.connection;
                details.push(`ℹ️ Connection: ${connection.effectiveType || 'unknown'}`);
            }

            this.results.performance.status = details.some(d => d.includes('❌')) ? 'error' : 
                                            details.some(d => d.includes('⚠️')) ? 'warning' : 'success';
            this.results.performance.details = details;

        } catch (error) {
            this.results.performance.status = 'error';
            this.results.performance.details = ['❌ Performance check failed: ' + error.message];
        }
    }

    // Check feature flags
    checkFeatures() {
        const details = [];
        
        try {
            const features = config.features;
            
            Object.entries(features).forEach(([feature, enabled]) => {
                if (enabled) {
                    details.push(`✅ ${feature}: enabled`);
                } else {
                    details.push(`ℹ️ ${feature}: disabled`);
                }
            });

            // Check plan limits
            const limits = config.limits;
            Object.entries(limits).forEach(([plan, planLimits]) => {
                details.push(`ℹ️ ${plan} plan limits configured`);
            });

            this.results.features.status = 'success';
            this.results.features.details = details;

        } catch (error) {
            this.results.features.status = 'error';
            this.results.features.details = ['❌ Features check failed: ' + error.message];
        }
    }

    // Generate diagnostic report
    generateReport() {
        console.log('\n📊 Diagnostic Report:');
        console.log('=====================');
        
        Object.entries(this.results).forEach(([category, result]) => {
            const statusIcon = result.status === 'success' ? '✅' : 
                              result.status === 'warning' ? '⚠️' : '❌';
            
            console.log(`\n${statusIcon} ${category.toUpperCase()}: ${result.status}`);
            result.details.forEach(detail => {
                console.log(`  ${detail}`);
            });
        });

        // Overall status
        const hasErrors = Object.values(this.results).some(r => r.status === 'error');
        const hasWarnings = Object.values(this.results).some(r => r.status === 'warning');
        
        if (hasErrors) {
            console.log('\n❌ System has errors that need attention');
        } else if (hasWarnings) {
            console.log('\n⚠️ System has warnings but should work');
        } else {
            console.log('\n✅ System is healthy and ready to use');
        }
    }

    // Show diagnostic modal
    showDiagnosticModal() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal modal-large">
                <div class="modal-header">
                    <h3>🔍 System Diagnostics</h3>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <div id="diagnostic-results">
                        <div class="loading-spinner">
                            <div class="spinner"></div>
                            <p>Running diagnostics...</p>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Close</button>
                    <button class="btn btn-primary" onclick="window.diagnostics.runAll().then(() => window.diagnostics.showDiagnosticModal())">Run Again</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Run diagnostics and update modal
        this.runAll().then(() => {
            const resultsContainer = modal.querySelector('#diagnostic-results');
            resultsContainer.innerHTML = this.generateHTMLReport();
        });
    }

    // Generate HTML report
    generateHTMLReport() {
        let html = '';
        
        Object.entries(this.results).forEach(([category, result]) => {
            const statusIcon = result.status === 'success' ? '✅' : 
                              result.status === 'warning' ? '⚠️' : '❌';
            
            html += `
                <div class="diagnostic-category">
                    <h4>${statusIcon} ${category.toUpperCase()}: ${result.status}</h4>
                    <ul>
                        ${result.details.map(detail => `<li>${detail}</li>`).join('')}
                    </ul>
                </div>
            `;
        });

        return html;
    }
}

// Create singleton instance
const diagnostics = new Diagnostics();

// Make available globally for debugging
window.diagnostics = diagnostics;

// Auto-run diagnostics in development mode
if (config.isDevelopment && window.location.search.includes('debug=true')) {
    setTimeout(() => {
        diagnostics.runAll();
    }, 2000);
}

export default diagnostics;