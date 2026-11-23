
import { db } from "./firebase.js";
import { watchAuthState } from "./auth.js";

import {
  collection,
  query,
  where,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

const tokenList = document.getElementById("tokenList");
const message = document.getElementById("message");
const refreshButton = document.getElementById("refreshButton");

const serviceInfo = {
  canteen: { name: "Canteen", icon: "🍽️" },
  office: { name: "Office / Administration", icon: "🏢" },
  library: { name: "Library", icon: "📚" },
  accounts: { name: "Accounts / Fees", icon: "💳" },
  laboratory: { name: "Laboratory", icon: "🧪" },
  "student-section": { name: "Student Section", icon: "🎓" },
  placement: { name: "Placement Cell", icon: "💼" },
  hostel: { name: "Hostel Office", icon: "🏠" }
};

let unsubscribe = null;
let currentTokens = [];

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

function formatDate(timestamp) {
  if (!timestamp || typeof timestamp.toDate !== "function") {
    return "Date unavailable";
  }

  return timestamp.toDate().toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function updateSummary(tokens) {
  document.getElementById("totalCount").textContent = tokens.length;

  document.getElementById("activeCount").textContent =
    tokens.filter(token => token.status === "waiting" || token.status === "serving").length;

  document.getElementById("completedCount").textContent =
    tokens.filter(token => token.status === "completed").length;
}

function renderTokens(tokens) {
  updateSummary(tokens);

  if (!tokens.length) {
    tokenList.innerHTML = `
      <div class="empty">
        <div class="empty-icon">🎟️</div>
        <h3>No tokens yet</h3>
        <p>Your queue history will appear here after you join a campus queue.</p>
        <a href="queue.html" class="join">Join a Queue →</a>
      </div>`;
    return;
  }

  tokenList.innerHTML = `
    <div class="token-list">
      ${tokens.map(token => {
        const service = serviceInfo[token.serviceId] || {
          name: "Campus Service",
          icon: "🏢"
        };

        const status = ["waiting", "serving", "completed", "cancelled"]
          .includes(token.status) ? token.status : "unknown";

        return `
          <article class="token-row">
            <div class="token-left">
              <div class="token-icon">${service.icon}</div>
              <div>
                <div class="token-name">${escapeHTML(service.name)}</div>
                <div class="token-meta">${escapeHTML(formatDate(token.createdAt))}</div>
                <span class="status ${status}">${escapeHTML(status.toUpperCase())}</span>
              </div>
            </div>
            <div class="token-number">#${Number(token.tokenNumber)}</div>
          </article>`;
      }).join("")}
    </div>`;
}

function loadTokens(user) {
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }

  tokenList.textContent = "Loading your tokens...";

  const myTokens = query(
    collection(db, "tokens"),
    where("userId", "==", user.uid)
  );

  unsubscribe = onSnapshot(myTokens, snapshot => {
    currentTokens = snapshot.docs
      .map(document => ({
        id: document.id,
        ...document.data()
      }))
      .sort((a, b) => b.tokenNumber - a.tokenNumber);

    renderTokens(currentTokens);
    message.className = "message";
  }, error => {
    console.error(error);
    message.textContent = "Unable to load token history. Please try again.";
    message.className = "message error";
    tokenList.textContent = "";
  });
}

refreshButton.addEventListener("click", () => {
  if (!unsubscribe) return;

  refreshButton.disabled = true;
  refreshButton.textContent = "Refreshing...";

  // Firestore onSnapshot already keeps the page updated.
  // This button simply confirms the current view.
  setTimeout(() => {
    refreshButton.disabled = false;
    refreshButton.textContent = "↻ Refresh";
  }, 500);
});

watchAuthState(user => {
  if (!user) {
    window.location.replace("login.html");
    return;
  }

  loadTokens(user);
});
