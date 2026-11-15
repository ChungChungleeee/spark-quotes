import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAo8CImnPFjbMgHMd6vGUmpT0UePRrTJGA",
  authDomain: "alphamaxx1.firebaseapp.com",
  projectId: "alphamaxx1",
  storageBucket: "alphamaxx1.firebasestorage.app",
  messagingSenderId: "882248208659",
  appId: "1:882248208659:web:f447a89d41368424d04ae6",
  measurementId: "G-173HY5HFZ8",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export {
  auth,
  googleProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
};
