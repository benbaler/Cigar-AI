import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDoPg3UGeeqTxkKCRUM9eyDygWfo_yEpCM",
  authDomain: "cigar-ai-66fa5.firebaseapp.com",
  projectId: "cigar-ai-66fa5",
  storageBucket: "cigar-ai-66fa5.firebasestorage.app",
  messagingSenderId: "778807024194",
  appId: "1:778807024194:web:5581ded971080ad4eb2bdb",
  measurementId: "G-SMT27P3Y6L"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const analytics = getAnalytics(app);
export const db = getFirestore(app);
export const storage = getStorage(app);