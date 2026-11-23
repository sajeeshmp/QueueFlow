
import { auth, db } from "./firebase.js";
import { watchAuthState } from "./auth.js";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  runTransaction,
  onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

const serviceNames = {
  canteen: "Canteen",
  office: "Office / Administration",
  library: "Library",
  accounts: "Accounts / Fees",
  laboratory: "Laboratory",
  "student-section": "Student Section",
  placement: "Placement Cell",
  hostel: "Hostel Office"
};

const services = document.querySelectorAll(".service");
const joinButton = document.getElementById("joinButton");
const activeToken = document.getElementById("activeToken");
const message = document.getElementById("message");

let selectedService = null;
let currentUser = null;
let unsubscribeTokens = null;
let busy = false;

function showMessage(text, type = "error") {
  message.textContent = text;
  message.className = "message " + type;
}

function clearMessage() {
  message.textContent = "";
  message.className = "message";
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

function renderEmpty() {
  activeToken.innerHTML = `
    <div class="empty">
      <span>🎟️</span>
      <strong>No active token</strong>
      <p>Join a campus queue to see your token and waiting position here.</p>
    </div>`;
}

function renderToken(token, waitingAhead) {
  const serviceName = serviceNames[token.serviceId] || "Campus Service";

  activeToken.innerHTML = `
    <div class="queue-card">
      <div class="small">YOUR QUEUE TOKEN</div>
      <div class="token">#${token.tokenNumber}</div>
      <p>${escapeHTML(serviceName)} · ${escapeHTML(token.status.toUpperCase())}</p>
    </div>
    <div class="queue-info">
      <div class="info">
        <small>People ahead</small>
        <strong>${waitingAhead}</strong>
      </div>
      <div class="info">
        <small>Queue position</small>
        <strong>${waitingAhead + 1}</strong>
      </div>
    </div>
    <button class="cancel" id="cancelButton">Cancel My Token</button>
    <p class="notice">Position is calculated from all earlier waiting tokens in the centralized queue.</p>`;

  document.getElementById("cancelButton").addEventListener("click", cancelToken);
}

async function loadMyToken() {
  if (!currentUser) return;

  if (unsubscribeTokens) {
    unsubscribeTokens();
    unsubscribeTokens = null;
  }

  const myTokensQuery = query(
    collection(db, "tokens"),
    where("userId", "==", currentUser.uid)
  );

  unsubscribeTokens = onSnapshot(myTokensQuery, snapshot => {
    const active = snapshot.docs
      .map(item => ({ id: item.id, ...item.data() }))
      .filter(token => token.status === "waiting")
      .sort((a, b) => a.tokenNumber - b.tokenNumber);

    if (!active.length) {
      renderEmpty();
      return;
    }

    const token = active[0];

    getDocs(query(
      collection(db, "tokens"),
      where("status", "==", "waiting")
    )).then(allTokens => {
      const waitingAhead = allTokens.docs.filter(item =>
        item.data().tokenNumber < token.tokenNumber
      ).length;

      renderToken(token, waitingAhead);
    }).catch(error => {
      console.error("Could not calculate queue position:", error);
      renderToken(token, 0);
    });
  }, error => {
    console.error(error);
    showMessage("Unable to load your token. Please refresh the page.");
  });
}

services.forEach(button => {
  button.addEventListener("click", () => {
    selectedService = button.dataset.service;

    services.forEach(item => item.classList.remove("selected"));
    button.classList.add("selected");

    joinButton.disabled = false;
    joinButton.textContent = `Join ${serviceNames[selectedService]} Queue →`;

    clearMessage();
  });
});

// Generate a token and update the global counter atomically.
joinButton.addEventListener("click", async () => {
  if (!currentUser || !selectedService || busy) return;

  busy = true;
  joinButton.disabled = true;
  joinButton.textContent = "Generating your token...";

  try {
    const existingQuery = query(
      collection(db, "tokens"),
      where("userId", "==", currentUser.uid),
      where("status", "==", "waiting")
    );

    const existing = await getDocs(existingQuery);

    if (!existing.empty) {
      showMessage("You already have an active token. Cancel it before joining another queue.");
      await loadMyToken();
      return;
    }

    const counterRef = doc(db, "queueSettings", "globalQueue");

    const newToken = await runTransaction(db, async transaction => {
      const counterSnapshot = await transaction.get(counterRef);

      if (!counterSnapshot.exists()) {
        throw new Error("Queue counter is not configured in Firebase.");
      }

      const nextNumber = counterSnapshot.data().currentNumber + 1;
      const tokenRef = doc(db, "tokens", `token_${nextNumber}`);

      transaction.set(tokenRef, {
        userId: currentUser.uid,
        serviceId: selectedService,
        tokenNumber: nextNumber,
        status: "waiting",
        createdAt: serverTimestamp()
      });

      transaction.update(counterRef, {
        currentNumber: nextNumber
      });

      return nextNumber;
    });

    showMessage(`Success! Your token number is ${newToken}.`, "success");
    await loadMyToken();

  } catch (error) {
    console.error(error);
    showMessage(error.message || "Unable to join the queue. Please try again.");
  } finally {
    busy = false;
    joinButton.disabled = !selectedService;
    joinButton.textContent = selectedService
      ? `Join ${serviceNames[selectedService]} Queue →`
      : "Select a service first →";
  }
});

// Cancel only the student's own active token.
async function cancelToken() {
  const cancelButton = document.getElementById("cancelButton");
  if (!cancelButton || busy) return;

  busy = true;
  cancelButton.disabled = true;
  cancelButton.textContent = "Cancelling...";

  try {
    const myTokens = await getDocs(query(
      collection(db, "tokens"),
      where("userId", "==", currentUser.uid),
      where("status", "==", "waiting")
    ));

    if (myTokens.empty) {
      showMessage("No active token was found.");
      return;
    }

    const tokenDoc = myTokens.docs.sort(
      (a, b) => a.data().tokenNumber - b.data().tokenNumber
    )[0];

    const tokenRef = doc(db, "tokens", tokenDoc.id);

    await runTransaction(db, async transaction => {
      const latest = await transaction.get(tokenRef);

      if (!latest.exists() || latest.data().status !== "waiting") {
        throw new Error("This token is no longer waiting.");
      }

      transaction.update(tokenRef, {
        status: "cancelled"
      });
    });

    showMessage("Your token has been cancelled.", "success");
    await loadMyToken();

  } catch (error) {
    console.error(error);
    showMessage(error.message || "Unable to cancel your token.");
  } finally {
    busy = false;
  }
}

// Read service selected from the dashboard URL.
const params = new URLSearchParams(window.location.search);
const requestedService = params.get("service");

if (requestedService && serviceNames[requestedService]) {
  const button = document.querySelector(
    `.service[data-service="${requestedService}"]`
  );

  if (button) button.click();
}

// Authentication protection
watchAuthState(user => {
  if (!user) {
    window.location.replace("login.html");
    return;
  }

  currentUser = user;
  loadMyToken();
});
