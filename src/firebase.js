import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyChP_QBQM1gBRl7yHFwfb3RU6V-oMaGnSk",
  authDomain: "buzzetto-fc6be.firebaseapp.com",
  projectId: "buzzetto-fc6be",
  storageBucket: "buzzetto-fc6be.firebasestorage.app",
  messagingSenderId: "47341493358",
  appId: "1:47341493358:web:be8d0576203c5111555a7f"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
export const auth = getAuth(app);

export const db = getFirestore(app); // Add this line