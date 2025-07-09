# 🚀 AffiliatePro - AI-Powered Affiliate Marketing Platform

## 📋 Overview

AffiliatePro is a comprehensive affiliate marketing platform that leverages AI to help marketers discover winning products, generate viral content, build sales funnels, and optimize their affiliate business.

## 🆕 Recent Updates & Improvements

### ✅ **Fixed Issues**
- **Firebase Configuration**: Updated with proper configuration structure
- **Error Handling**: Added comprehensive error handling system
- **AI Integration**: Fixed Gemini API integration with proper fallbacks
- **Diagnostics**: Added system diagnostics for troubleshooting
- **Configuration Management**: Centralized configuration with environment detection

### 🚀 **New Features**
- **Environment Configuration**: Smart configuration based on development/production
- **Error Handler**: Global error handling with user-friendly messages
- **Diagnostics Tool**: System health checker and configuration validator
- **Toast Notifications**: Enhanced notification system
- **Setup Guide**: Comprehensive setup instructions

### 🔧 **Technical Improvements**
- **Modular Architecture**: Better separation of concerns
- **Configuration Management**: Centralized settings with environment detection
- **Error Recovery**: Graceful error handling and recovery
- **Performance Monitoring**: Built-in performance tracking
- **Debug Mode**: Enhanced debugging capabilities

## 🎯 **Quick Start**

### 1. **Clone & Setup**
```bash
git clone <your-repo-url>
cd affiliate-pro
npm install
```

### 2. **Configure Firebase**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable Authentication (Email/Password)
4. Enable Firestore Database
5. Copy your configuration to `public/assets/js/config/environment.js`

### 3. **Configure AI Services**
1. Get Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Update the configuration in `public/assets/js/config/environment.js`

### 4. **Run Locally**
```bash
firebase serve --only hosting
# or
npx http-server public -p 8080
```

### 5. **Test & Debug**
- Open `http://localhost:5000?debug=true` for diagnostic mode
- Check browser console for detailed logs
- Use `window.diagnostics.runAll()` for system health check

## 🔍 **Troubleshooting**

### **Common Issues & Solutions**

#### 1. **Firebase Connection Errors**
```javascript
// Check if Firebase is properly configured
window.diagnostics.runAll().then(results => {
    console.log('Firebase Status:', results.firebase);
});
```

#### 2. **AI API Issues**
- Verify API keys are correct
- Check API quotas and limits
- Ensure endpoints are accessible

#### 3. **Authentication Problems**
- Enable Email/Password auth in Firebase
- Check Firestore security rules
- Verify user permissions

### **Debug Mode**
Add `?debug=true` to your URL to enable:
- Enhanced console logging
- Automatic diagnostics
- Performance monitoring
- Error tracking

### **System Diagnostics**
```javascript
// Run full system check
window.diagnostics.runAll();

// Show diagnostic modal
window.diagnostics.showDiagnosticModal();
```

## 📁 **Project Structure**

```
affiliate-pro/
├── 📁 public/
│   ├── index.html                 # Main application
│   ├── 📁 assets/
│   │   ├── 📁 css/               # Stylesheets
│   │   ├── 📁 js/
│   │   │   ├── 📁 config/        # Configuration files
│   │   │   ├── 📁 core/          # Core application logic
│   │   │   ├── 📁 modules/       # Feature modules
│   │   │   ├── 📁 components/    # UI components
│   │   │   ├── 📁 utils/         # Utilities
│   │   │   └── 📁 services/      # External services
│   │   └── 📁 images/            # Assets
│   └── 📁 locales/               # Internationalization
├── 📁 docs/                      # Documentation
├── firebase.json                 # Firebase configuration
├── firestore.rules              # Database security rules
├── SETUP.md                     # Setup instructions
└── README.md                    # This file
```

## 🛠 **Configuration Files**

### **Environment Configuration** (`public/assets/js/config/environment.js`)
```javascript
export const config = {
    isDevelopment: true, // Auto-detected
    firebase: { /* Your Firebase config */ },
    ai: { /* AI service configs */ },
    features: { /* Feature flags */ },
    limits: { /* Plan limits */ }
};
```

### **Firebase Rules** (`firestore.rules`)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## 🚀 **Deployment**

### **Firebase Hosting**
```bash
firebase login
firebase deploy --only hosting
```

### **Other Platforms**
- **Netlify**: Connect GitHub repo, set publish dir to `public`
- **Vercel**: Import repo, set framework to "Other"

## 📊 **Features**

### **Core Modules**
- 🔍 **Product Detector**: AI-powered product discovery
- 📝 **Content Generator**: Viral content creation
- 🎯 **Funnel Architect**: Visual funnel builder
- 💰 **Profit Calculator**: Financial projections
- 👤 **Avatar Generator**: Target audience profiles
- ✅ **Offer Validator**: Affiliate offer analysis

### **Admin Features**
- 👥 **User Management**: User administration
- 📈 **Analytics**: Usage and performance metrics
- ⚙️ **Settings**: System configuration
- 🔒 **Security**: Access control and permissions

## 🔧 **Development**

### **Adding New Features**
1. Create module in `public/assets/js/modules/`
2. Add route in `public/assets/js/core/router.js`
3. Update navigation in `public/index.html`
4. Add styles in `public/assets/css/`

### **Testing**
```javascript
// Run diagnostics
window.diagnostics.runAll();

// Test specific features
window.diagnostics.checkFirebase();
window.diagnostics.checkAI();
```

## 📞 **Support**

### **Getting Help**
1. Check the [SETUP.md](SETUP.md) guide
2. Run system diagnostics: `window.diagnostics.runAll()`
3. Check browser console for errors
4. Review Firebase console logs

### **Reporting Issues**
- Include diagnostic results
- Provide browser console logs
- Specify steps to reproduce
- Include environment details

## 🎯 **Next Steps**

1. **Configure Firebase** with your project
2. **Set up AI API keys** for full functionality
3. **Test all features** locally
4. **Deploy to production**
5. **Monitor performance** and optimize

---

**🎉 Your AffiliatePro application is now ready to use!**

For detailed setup instructions, see [SETUP.md](SETUP.md).