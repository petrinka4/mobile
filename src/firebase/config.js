import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';


const firebaseConfig = {
  apiKey: "AIzaSyAUkMlYVC-3-OKFupZBFkX96x4qo7Ynv90",
  authDomain: "habit-tracker-b03d4.firebaseapp.com",
  projectId: "habit-tracker-b03d4",
  storageBucket: "habit-tracker-b03d4.firebasestorage.app",
  messagingSenderId: "1026123454898",
  appId: "1:1026123454898:web:5265e2b6765d99782aecab"
};


const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});