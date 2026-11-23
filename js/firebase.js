
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";

import { getAuth } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";

import { getFirestore } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBGxFUSPHoxA_SLD2BE4D0c4ea2C8CPzQo",
  authDomain: "smartqueueflowsystem.firebaseapp.com",
  projectId: "smartqueueflowsystem",
  storageBucket: "smartqueueflowsystem.firebasestorage.app",
  messagingSenderId: "113853772698",
  appId: "1:113853772698:web:001aa6288a38f147e9c023",
  measurementId: "G-5EQBEXMBXY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Authentication
const auth = getAuth(app);

// Initialize Firestore Database
const db = getFirestore(app);

export { app, auth, db };
