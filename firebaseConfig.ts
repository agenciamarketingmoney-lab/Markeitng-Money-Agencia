import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDd5va3PioSVOuI9xjB9-IfujYnani2hko",
  authDomain: "marketing-money-ag.firebaseapp.com",
  projectId: "marketing-money-ag",
  storageBucket: "marketing-money-ag.firebasestorage.app",
  messagingSenderId: "1040558959300",
  appId: "1:1040558959300:web:879cb20ed5d7a9d6723791",
  measurementId: "G-ZL18NYHGYZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const db = getFirestore(app);
export const auth = getAuth(app);