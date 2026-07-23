// Firebase Configuration

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";

import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import {
    getFirestore,
    doc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDNqTAQKGGW0Km4P7VIxZw9jyv8hGEiDvc",
    authDomain: "novapay-a0875.firebaseapp.com",
    projectId: "novapay-a0875",
    storageBucket: "novapay-a0875.firebasestorage.app",
    messagingSenderId: "99118341312",
    appId: "1:99118341312:web:9d353e75280fa36bcee125"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getFirestore(app);

export {
    auth,
    db,
    doc,
    setDoc,
    serverTimestamp
};