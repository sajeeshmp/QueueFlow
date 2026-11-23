
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";

import { auth } from "./firebase.js";

// Friendly Firebase error messages
function getFriendlyError(error) {
  const errors = {
    "auth/email-already-in-use": "This email is already registered. Please sign in.",
    "auth/invalid-email": "Please enter a valid email address.",
    "auth/weak-password": "Your password must contain at least 6 characters.",
    "auth/user-not-found": "No account found with this email address.",
    "auth/wrong-password": "Incorrect email or password.",
    "auth/invalid-credential": "Incorrect email or password.",
    "auth/too-many-requests": "Too many attempts. Please try again later.",
    "auth/network-request-failed": "Network error. Check your internet connection.",
    "auth/operation-not-allowed": "Email/password authentication is not enabled in Firebase."
  };

  return errors[error.code] || "Something went wrong. Please try again.";
}

// Register a new user
export async function registerUser(name, email, password) {
  try {
    const credential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    await updateProfile(credential.user, {
      displayName: name
    });

    return credential.user;
  } catch (error) {
    throw new Error(getFriendlyError(error));
  }
}

// Login existing user
export async function loginUser(email, password) {
  try {
    const credential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    return credential.user;
  } catch (error) {
    throw new Error(getFriendlyError(error));
  }
}

// Logout current user
export async function logoutUser() {
  try {
    await signOut(auth);
  } catch (error) {
    throw new Error(getFriendlyError(error));
  }
}

// Listen for login/logout state changes
export function watchAuthState(callback) {
  return onAuthStateChanged(auth, callback);
}
