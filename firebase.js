// firebase.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp } from "firebase/app";
import { getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCYqHaoFHGSy_iCv1hpRO36nf2WEr2ovyI",
  authDomain: "budget-tracker-93ddc.firebaseapp.com",
  projectId: "budget-tracker-93ddc",
  storageBucket: "budget-tracker-93ddc.firebasestorage.app",
  messagingSenderId: "646943763564",
  appId: "1:646943763564:web:6265a30c02b5b4c1b73c49"
};

const app = initializeApp(firebaseConfig);

// Export Auth and Storage
export const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
export const storage = getStorage(app);

export const db = getFirestore(app);
