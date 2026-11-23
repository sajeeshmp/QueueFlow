
import { auth, db } from "./firebase.js";

import {
  collection,
  query,
  where,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

import { signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";

const studentName = document.getElementById("studentName");
const studentEmail = document.getElementById("studentEmail");
const welcomeTitle = document.getElementById("welcomeTitle");
const avatar = document.getElementById("avatar");
const activeTokenCount = document.getElementById("activeTokenCount");
const tokensList = document.getElementById("tokensList");
const logoutButton = document.getElementById("logoutButton");

let unsubscribeTokens = null;

// Display the student's information
function displayStudent(user) {
  const name = user.displayName || "Student";

  studentName.textContent = name;
  studentEmail.textContent = user.email || "";
  welcomeTitle.textContent = `Welcome, ${name.split(" ")[0]}!`;
  avatar.textContent = name.charAt(0).toUpperCase();
}

// Show a message when there are no active tokens
function showEmptyTokens() {
  tokensList.innerHTML = `
    <div class="empty-state">
      <div class="empty-icon">🎟️</div>
      <strong>No active tokens yet</strong>
      <p>When you join a campus queue, your token details will appear here.</p>
    </div>
  `;
}

// Display the student's active tokens
function displayTokens(tokens) {
  activeTokenCount.textContent = tokens.length;

  if (tokens.length === 0) {
    showEmptyTokens();
    return;
  }

  tokensList.innerHTML = "";

  tokens.forEach(token => {
    const item = document.createElement("div");
    item.className = "token-item";

    const details = document.createElement("div");
    const title = document.createElement("strong");
    const subtitle = document.createElement("small");

    title.textContent = token.tokenNumber
      ? `Token ${token.tokenNumber}`
      : "Queue token";

    subtitle.textContent = token.serviceName || "Campus service";

    const status = document.createElement("span");
    status.className = "status-pill";
    status.textContent = token.status || "Waiting";

    details.appendChild(title);
    details.appendChild(subtitle);
    item.appendChild(details);
    item.appendChild(status);

    tokensList.appendChild(item);
  });
}

// Listen for live changes to this student's tokens
function listenToStudentTokens(user) {
  if (unsubscribeTokens) {
    unsubscribeTokens();
  }

  activeTokenCount.textContent = "…";

  const tokensQuery = query(
    collection(db, "tokens"),
    where("userId", "==", user.uid)
  );

  unsubscribeTokens = onSnapshot(
    tokensQuery,
    snapshot => {
      const activeTokens = snapshot.docs
        .map(document => ({
          id: document.id,
          ...document.data()
        }))
        .filter(token =>
          ["waiting", "serving"].includes(
            String(token.status || "").toLowerCase()
          )
        );

      displayTokens(activeTokens);
    },
    error => {
      console.error("Token loading error:", error);
      activeTokenCount.textContent = "—";

      tokensList.textContent =
        "Unable to load your tokens. Please check your Firestore security rules.";
    }
  );
}

// Protect the dashboard and restore the login session
onAuthStateChanged(auth, user => {
  if (!user) {
    if (unsubscribeTokens) {
      unsubscribeTokens();
      unsubscribeTokens = null;
    }

    window.location.replace("login.html");
    return;
  }

  displayStudent(user);
  listenToStudentTokens(user);
});

// Logout
logoutButton.addEventListener("click", async () => {
  logoutButton.disabled = true;
  logoutButton.textContent = "Logging out...";

  try {
    if (unsubscribeTokens) {
      unsubscribeTokens();
      unsubscribeTokens = null;
    }

    await signOut(auth);
    window.location.replace("login.html");
  } catch (error) {
    console.error("Logout error:", error);
    alert("Unable to log out. Please try again.");
    logoutButton.disabled = false;
    logoutButton.textContent = "↪ Log out";
  }
});
