// Firebase client initialization
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: Replace with your Firebase project config
const firebaseConfig = {
  apiKey: "AIzaSyCsk259ufToRr__aFCZwfPo6Q1dfxSzU6s",
  authDomain: "restaurantbooker-540f5.firebaseapp.com",
  projectId: "restaurantbooker-540f5",
  storageBucket: "restaurantbooker-540f5.firebasestorage.app",
  messagingSenderId: "902083529434",
  appId: "1:902083529434:web:877382d2359f2e5cc173e3",
  measurementId: "G-TWTGDE1N30"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app); 