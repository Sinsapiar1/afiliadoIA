# 🚀 AffiliatePro - Setup Guide

## 📋 Prerequisites

- Node.js (v16 or higher)
- Firebase CLI (`npm install -g firebase-tools`)
- Git

## 🔧 Initial Setup

### 1. Clone and Install Dependencies

```bash
git clone <your-repo-url>
cd affiliate-pro
npm install
```

### 2. Firebase Configuration

#### Step 1: Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or select existing project
3. Follow the setup wizard

#### Step 2: Enable Services
1. **Authentication**: Go to Authentication > Sign-in method > Enable Email/Password
2. **Firestore**: Go to Firestore Database > Create database > Start in test mode
3. **Storage**: Go to Storage > Get started > Start in test mode (optional)
4. **Hosting**: Go to Hosting > Get started

#### Step 3: Get Configuration
1. Go to Project Settings (gear icon)
2. Scroll to "Your apps" section
3. Click "Add app" > Web app
4. Copy the configuration object

#### Step 4: Update Configuration Files

**Update `public/assets/js/config/environment.js`:**
```javascript
firebase: {
    apiKey: "YOUR_ACTUAL_API_KEY",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef123456",
    measurementId: "G-XXXXXXXXXX"
}
```

**Update `public/assets/js/config/firebase-config-real.js`:**
```javascript
const firebaseConfig = {
    apiKey: "YOUR_ACTUAL_API_KEY",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef123456",
    measurementId: "G-XXXXXXXXXX"
};
```

### 3. AI Services Configuration

#### Gemini API (Google AI)
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create an API key
3. Update `public/assets/js/config/environment.js`:
```javascript
ai: {
    gemini: {
        apiKey: "YOUR_GEMINI_API_KEY",
        endpoint: "https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent"
    }
}
```

#### OpenAI API (Optional)
1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create an API key
3. Update the configuration:
```javascript
openai: {
    apiKey: "YOUR_OPENAI_API_KEY",
    endpoint: "https://api.openai.com/v1/chat/completions"
}
```

### 4. Payment Configuration (Optional)

#### Stripe Setup
1. Create a [Stripe account](https://stripe.com)
2. Get your publishable key
3. Update configuration:
```javascript
payments: {
    stripe: {
        publishableKey: "pk_test_YOUR_STRIPE_KEY"
    }
}
```

## 🚀 Development

### 1. Start Development Server

```bash
# Using Firebase CLI
firebase serve --only hosting

# Or using a local server
npx http-server public -p 8080
```

### 2. Access the Application

Open your browser and go to:
- Firebase: `http://localhost:5000`
- HTTP Server: `http://localhost:8080`

## 📦 Deployment

### 1. Build for Production

```bash
# The application is already optimized for production
# No build step required for vanilla HTML/CSS/JS
```

### 2. Deploy to Firebase Hosting

```bash
# Login to Firebase
firebase login

# Initialize Firebase (if not already done)
firebase init hosting

# Deploy
firebase deploy --only hosting
```

### 3. Deploy to Other Platforms

#### Netlify
1. Connect your GitHub repository
2. Set build command: (leave empty)
3. Set publish directory: `public`
4. Deploy

#### Vercel
1. Import your GitHub repository
2. Set framework preset: Other
3. Set output directory: `public`
4. Deploy

## 🔒 Security Configuration

### 1. Firestore Security Rules

Update `firestore.rules`:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Admin access
    match /admin/{document=**} {
      allow read, write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Public read access for some collections
    match /products/{productId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

### 2. Storage Security Rules

Update `storage.rules`:
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 🧪 Testing

### 1. Manual Testing Checklist

- [ ] User registration and login
- [ ] Product detection functionality
- [ ] Content generation
- [ ] Funnel builder
- [ ] Profit calculator
- [ ] Avatar generator
- [ ] Admin panel (if admin user)
- [ ] Responsive design on mobile
- [ ] Dark/light theme toggle
- [ ] Language switching

### 2. Browser Compatibility

Test in:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile browsers

## 🐛 Troubleshooting

### Common Issues

#### 1. Firebase Connection Errors
- Check if Firebase project is properly configured
- Verify API keys are correct
- Ensure Firestore is enabled

#### 2. AI API Errors
- Verify API keys are valid
- Check API quotas and limits
- Ensure endpoints are accessible

#### 3. Authentication Issues
- Check if Email/Password auth is enabled
- Verify Firestore rules allow user operations
- Check browser console for errors

#### 4. CORS Issues
- Ensure Firebase hosting is properly configured
- Check if API endpoints allow your domain

### Debug Mode

Enable debug mode by adding to URL:
```
?debug=true
```

This will show additional console logs and error details.

## 📞 Support

If you encounter issues:

1. Check the browser console for errors
2. Review Firebase console logs
3. Check the troubleshooting section above
4. Create an issue in the repository

## 🔄 Updates

To update the application:

1. Pull latest changes: `git pull origin main`
2. Update dependencies: `npm install`
3. Test locally: `firebase serve`
4. Deploy: `firebase deploy`

---

**🎯 Next Steps:**
1. Configure Firebase with your project
2. Set up AI API keys
3. Test the application locally
4. Deploy to production
5. Monitor and optimize performance