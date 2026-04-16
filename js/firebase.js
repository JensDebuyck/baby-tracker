import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.12.0/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyADqtOrqW0e6SLuTQufApg3oKHUe5AI4vE",
    authDomain: "baby-tracker-efce1.firebaseapp.com",
    projectId: "baby-tracker-efce1",
    storageBucket: "baby-tracker-efce1.firebasestorage.app",
    messagingSenderId: "392243513788",
    appId: "1:392243513788:web:cf94a945602a86538103b9"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);