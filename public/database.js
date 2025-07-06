// database.js
// This file initializes Firebase and exposes necessary instances and Firestore functions globally.

// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy, where } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js"; // Removed signInAnonymously, onAuthStateChanged, signInWithCustomToken

// IMPORTANT: Canvas environment variables
// These variables are provided by the Canvas environment for secure Firebase configuration.
// If running outside Canvas, replace placeholders with your actual Firebase project details.
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {
    apiKey: "AIzaSyBrrfCibbB8LBc72NxHuT_kTMUL9B4n5GE", // Your actual API Key
    authDomain: "crud-event-manager.firebaseapp.com",
    projectId: "crud-event-manager",
    storageBucket: "crud-event-manager.firebasestorage.app",
    messagingSenderId: "161505017762",
    appId: "1:161505017762:web:fd21f5b0f2098baebefcfb"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Expose Firebase instances and Firestore functions globally for script.js to access.
// This avoids re-importing and re-initializing in script.js.
window.db = db;
window.auth = auth;
window.appId = appId; // Pass appId to script.js for collection path
window.firebaseFirestore = { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy, where };

// Note: The authentication sign-in logic (onAuthStateChanged block) has been removed as requested.
// `loadReminders()` will now be called directly from `script.js` on DOMContentLoaded.
