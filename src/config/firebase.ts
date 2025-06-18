
import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator, enableNetwork, disableNetwork } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID 
};

// Initialize Firebase only if we have valid config
let app;
let auth;
let db;

try {
  // Validate that we have the required config
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    throw new Error("Missing required Firebase configuration");
  }

  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);

  // Enable offline persistence for better reliability
  if (typeof window !== 'undefined') {
    // Enable network first, then handle any connection issues gracefully
    enableNetwork(db).catch((error) => {
      console.warn("Could not enable Firestore network:", error);
    });
  }

  console.log("Firebase initialized successfully");
} catch (error) {
  console.error("Firebase initialization failed:", error);
  // Create mock objects for development - but still try to continue
  auth = null;
  db = null;
}

export { auth, db };
export default app;
