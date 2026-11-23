
import { auth } from "./firebase.js";
import { logoutUser, watchAuthState } from "./auth.js";
import { updateProfile } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";

const nameInput = document.getElementById("name");
const emailInput = document.getElementById("email");
const avatar = document.getElementById("avatar");
const displayName = document.getElementById("displayName");
const displayEmail = document.getElementById("displayEmail");
const createdDate = document.getElementById("createdDate");
const accountId = document.getElementById("accountId");
const message = document.getElementById("message");
const saveButton = document.getElementById("saveButton");
const logoutButton = document.getElementById("logoutButton");

let currentUser = null;

function showMessage(text, type = "error") {
  message.textContent = text;
  message.className = "message " + type;
}

function updateUserDetails(user) {
  currentUser = user;

  const name = user.displayName || user.email.split("@")[0];

  nameInput.value = name;
  emailInput.value = user.email || "";
  displayName.textContent = name;
  displayEmail.textContent = user.email || "";
  avatar.textContent = name.charAt(0).toUpperCase();

  createdDate.textContent = user.metadata.creationTime
    ? new Date(user.metadata.creationTime).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric"
      })
    : "Unavailable";

  // Show a shortened account ID rather than the full identifier.
  accountId.textContent = user.uid.slice(0, 8) + "...";
}

watchAuthState(user => {
  if (!user) {
    window.location.replace("login.html");
    return;
  }

  updateUserDetails(user);
});

document.getElementById("profileForm").addEventListener("submit", async event => {
  event.preventDefault();

  if (!currentUser) return;

  const newName = nameInput.value.trim();

  if (newName.length < 2) {
    showMessage("Please enter a valid name.");
    return;
  }

  saveButton.disabled = true;
  saveButton.textContent = "Saving...";

  try {
    await updateProfile(auth.currentUser, {
      displayName: newName
    });

    updateUserDetails(auth.currentUser);
    showMessage("Your profile has been updated successfully.", "success");

  } catch (error) {
    console.error(error);
    showMessage("Unable to update your profile. Please try again.");
  } finally {
    saveButton.disabled = false;
    saveButton.textContent = "Save Changes →";
  }
});

logoutButton.addEventListener("click", async () => {
  logoutButton.disabled = true;
  logoutButton.textContent = "Logging out...";

  try {
    await logoutUser();
    window.location.replace("login.html");
  } catch (error) {
    showMessage(error.message);
    logoutButton.disabled = false;
    logoutButton.textContent = "↪ Log Out";
  }
});
