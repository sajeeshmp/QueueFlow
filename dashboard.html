
import { auth, db } from "./firebase.js";
import { logoutUser, watchAuthState } from "./auth.js";

import {
  collection,
  query,
  where,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

const userName = document.getElementById("userName");
const userAvatar = document.getElementById("userAvatar");
const logoutButton = document.getElementById("logoutButton");

const services = [
  "canteen",
  "office",
  "library",
  "accounts",
  "laboratory",
  "student-section",
  "placement",
  "hostel"
];

const serviceNames = {
  canteen: "Canteen",
  office: "Administration",
  library: "Library",
  accounts: "Accounts / Fees",
  laboratory: "Laboratory",
  "student-section": "Student Section",
  placement: "Placement Cell",
  hostel: "Hostel Office"
};

function updateNumber(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

function loadDashboard(user) {
  const name = user.displayName || user.email.split("@")[0];

  userName.textContent = name;
  userAvatar.textContent = name.charAt(0).toUpperCase();

  // Listen to all waiting tokens.
  const waitingQuery = query(
    collection(db, "tokens"),
    where("status", "==", "waiting")
  );

  onSnapshot(waitingQuery, snapshot => {
    updateNumber("activeCount", snapshot.size);

    const serviceCounts = {};

    services.forEach(service => {
      serviceCounts[service] = 0;
    });

    snapshot.forEach(doc => {
      const token = doc.data();

      if (serviceCounts[token.serviceId] !== undefined) {
        serviceCounts[token.serviceId]++;
      }
    });

    services.forEach(service => {
      updateNumber("count-" + service, serviceCounts[service]);
    });

  }, error => {
    console.error("Waiting queue error:", error);
  });

  // Listen to this student's tokens.
  const myTokensQuery = query(
    collection(db, "tokens"),
    where("userId", "==", user.uid)
  );

  onSnapshot(myTokensQuery, snapshot => {
    let active = 0;
    let completed = 0;

    snapshot.forEach(doc => {
      const status = doc.data().status;

      if (status === "waiting" || status === "serving") {
        active++;
      }

      if (status === "completed") {
        completed++;
      }
    });

    updateNumber("myActiveCount", active);
    updateNumber("completedCount", completed);

  }, error => {
    console.error("My tokens error:", error);
  });
}

watchAuthState(user => {
  if (!user) {
    window.location.replace("login.html");
    return;
  }

  loadDashboard(user);
});

document.getElementById("todayDate").textContent =
  new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });

logoutButton.addEventListener("click", async () => {
  logoutButton.disabled = true;
  logoutButton.textContent = "Logging out...";

  try {
    await logoutUser();
    window.location.replace("login.html");
  } catch (error) {
    alert(error.message);
    logoutButton.disabled = false;
    logoutButton.textContent = "↪ Log Out";
  }
});
