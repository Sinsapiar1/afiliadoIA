/**
 * Real Firebase Configuration
 * AffiliatePro - AI-Powered Affiliate Marketing Platform
 * 
 * IMPORTANT: Replace these with your actual Firebase project credentials
 * Get them from: https://console.firebase.google.com/
 */

// Firebase configuration for demo purposes
// Replace with your actual Firebase project configuration
const firebaseConfig = {
    apiKey: "AIzaSyBXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    authDomain: "affiliate-pro-demo.firebaseapp.com",
    projectId: "affiliate-pro-demo",
    storageBucket: "affiliate-pro-demo.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcdef1234567890",
    measurementId: "G-XXXXXXXXXX"
};

// Instructions for setting up Firebase:
/*
1. Go to https://console.firebase.google.com/
2. Create a new project or select existing one
3. Enable Authentication (Email/Password)
4. Enable Firestore Database
5. Enable Storage (if needed)
6. Go to Project Settings > General
7. Scroll down to "Your apps" section
8. Click "Add app" > Web app
9. Copy the configuration object
10. Replace the firebaseConfig object above
11. Update the rules in firestore.rules and storage.rules
*/

export default firebaseConfig;