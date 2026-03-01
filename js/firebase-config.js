// ─── Firebase Configuration ───────────────────────────────────────────────────
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyByqlrBrUqv5twev84RtpNLNh0EakUTi8c",
    authDomain: "police-port.firebaseapp.com",
    projectId: "police-port",
    storageBucket: "police-port.firebasestorage.app",
    messagingSenderId: "602535462028",
    appId: "1:602535462028:web:8446bbee4c1e0b988ba7a9",
    measurementId: "G-QXLKY8KMKL"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
