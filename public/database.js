
// Importation of functions that needed from the firestore 
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy, where } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js"; // Removed signInAnonymously, onAuthStateChanged, signInWithCustomToken

// The variables are provided by the Firebase configuration.
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


// This avoids re-importing and re-initializing in script.js.
window.db = db;
window.auth = auth;
window.appId = appId; // Pass appId to script.js for collection path
window.firebaseFirestore = { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy, where };

