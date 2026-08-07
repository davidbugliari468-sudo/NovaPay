import { auth } from "./firebase.js";

import {
    signInWithEmailAndPassword,
    setPersistence,
    browserLocalPersistence,
    browserSessionPersistence,
    sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
function showModal(title, message, callback = null) {

    const modal = document.getElementById("customModal");
    const modalTitle = document.getElementById("modalTitle");
    const modalMessage = document.getElementById("modalMessage");
    const modalButton = document.getElementById("modalButton");

    modalTitle.textContent = title;
    modalMessage.innerHTML = message;

    modal.style.display = "flex";

    modalButton.onclick = () => {

        modal.style.display = "none";

        if (callback) callback();

    };

}
// Show / Hide Password

window.togglePassword = function (inputId, button) {

    const input = document.getElementById(inputId);

    if (input.type === "password") {
        input.type = "text";
        button.textContent = "Hide";
    } else {
        input.type = "password";
        button.textContent = "Show";
    }

};

// Elements

const form = document.getElementById("loginForm");
const button = document.getElementById("loginBtn");
const forgotPassword = document.getElementById("forgotPassword");

// Login

form.addEventListener("submit", async function (e) {

    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const rememberMe = document.getElementById("rememberMe").checked;

    button.disabled = true;
    button.textContent = "Logging In...";

    try {

        await setPersistence(
            auth,
            rememberMe
                ? browserLocalPersistence
                : browserSessionPersistence
        );

        await signInWithEmailAndPassword(
    auth,
    email,
    password
);

window.location.href = "pin-check.html";

    } catch (error) {

        switch (error.code) {

            case "auth/invalid-credential":
                alert("Incorrect email or password.");
                break;

            case "auth/user-not-found":
                alert("Account not found.");
                break;

            case "auth/wrong-password":
                alert("Incorrect password.");
                break;

            case "auth/invalid-email":
                alert("Invalid email address.");
                break;

            default:
                alert(error.message);

        }

    } finally {

        button.disabled = false;
        button.textContent = "Login";

    }

});

// Forgot Password

forgotPassword.addEventListener("click", async function (e) {

    e.preventDefault();

    const email = document.getElementById("email").value.trim();

    if (!email) {
        alert("Enter your email address first.");
        return;
    }

    try {

        await sendPasswordResetEmail(auth, email);

        showModal(
    "Password Reset Email Sent",
    `
    We've sent a password reset link to your email.<br><br>

    📧 Check your Inbox.<br><br>

    If you don't see the email within a few minutes,
    check your <strong>Spam</strong> or <strong>Junk</strong> folder.<br><br>

    After resetting your password, return to NovaPay and log in.
    `
);

    } catch (error) {

        alert(error.message);

    }

});