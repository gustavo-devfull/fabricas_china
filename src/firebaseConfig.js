import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

export const firebaseConfig = {
  apiKey: "AIzaSyA_hGFS7qmCHXYxXJvqsfu5OHcvzq4DzLY",
  authDomain: "fabricas-e1113.firebaseapp.com",
  projectId: "fabricas-e1113",
  storageBucket: "fabricas-e1113.firebasestorage.app",
  messagingSenderId: "861066432773",
  appId: "1:861066432773:web:16ae6d862ae4fc6120676c"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
