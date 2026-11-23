
import { auth } from "./firebase.js";
import { logoutUser, watchAuthState } from "./auth.js";

const userName = document.getElementById("userName");
const userAvatar = document.getElementById("userAvatar");
const logoutButton = document.getElementById("logoutButton");

// Protect the dashboard
watchAuthState(user => {
  if (!user) {
    window.location.replace("login.html");
    return;
  }

  const name = user.displayName || user.email.split("@")[0];

  userName.textContent = name;
  userAvatar.textContent = name.charAt(0).toUpperCase();
});

// Display today's date
document.getElementById("todayDate").textContent =
  new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });

// Logout
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
