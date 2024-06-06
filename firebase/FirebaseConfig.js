// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";
import { getFirestore } from 'firebase/firestore';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAXo7MXqquHX4ErgzQ0lWuqBIXBePrjoLU",
  authDomain: "walking-challenge-exam.firebaseapp.com",
  projectId: "walking-challenge-exam",
  storageBucket: "walking-challenge-exam.appspot.com",
  messagingSenderId: "1068296534310",
  appId: "1:1068296534310:web:c10b2be1e5333e4614e9e7"
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});
const storage = getStorage(app);
const firestore = getFirestore(app);

export { app, auth, storage, firestore };