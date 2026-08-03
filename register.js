import {
    auth,
    db,
    doc,
    setDoc,
    serverTimestamp
} from "./firebase.js";

import {
    createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
console.log("register.js loaded successfully");
// ==========================================
// NovaPay Register
// register.js
// ==========================================

// Show / Hide Password

function togglePassword(inputId, button) {

    const input = document.getElementById(inputId);

    if (input.type === "password") {

        input.type = "text";

        button.textContent = "Hide";

    } else {

        input.type = "password";

        button.textContent = "Show";

    }

}

// Password Strength

const password = document.getElementById("password");

const strength = document.getElementById("strength");

password.addEventListener("input", () => {

    const value = password.value;

    let score = 0;

    if (value.length >= 8) score++;

    if (/[A-Z]/.test(value)) score++;

    if (/[a-z]/.test(value)) score++;

    if (/[0-9]/.test(value)) score++;

    if (/[^A-Za-z0-9]/.test(value)) score++;

    if (score <= 2) {

        strength.textContent = "❌ Weak Password";

        strength.style.color = "#dc2626";

    }

    else if (score === 3 || score === 4) {

        strength.textContent = "🟡 Medium Password";

        strength.style.color = "#d97706";

    }

    else {

        strength.textContent = "✅ Strong Password";

        strength.style.color = "#16a34a";

    }

});

// Form Validation

const form = document.getElementById("registerForm");

const button = document.getElementById("registerBtn");

form.addEventListener("submit", async function (e) {

    e.preventDefault();

    const email = document.getElementById("email").value.trim();

    const pass = document.getElementById("password").value;

    const confirm = document.getElementById("confirmPassword").value;

    if (pass !== confirm) {
        alert("Passwords do not match.");
        return;
    }

    button.disabled = true;
    button.textContent = "Creating Account...";

    try {

        const userCredential = await createUserWithEmailAndPassword(
            auth,
            email,
            pass
        );

        const user = userCredential.user;

        await setDoc(doc(db, "users", user.uid), {
    uid: user.uid,
    email: user.email,

    walletBalance: 0,

    hasLoginPin: false,
    loginPin: null,

    biometricEnabled: false,

    createdAt: serverTimestamp()
});

        alert("Account created successfully!");

        window.location.href = "dashboard.html";

    } catch (error) {

        if (error.code === "auth/email-already-in-use") {
            alert("Email already exists.");
        } else if (error.code === "auth/invalid-email") {
            alert("Invalid email address.");
        } else if (error.code === "auth/weak-password") {
            alert("Password must be at least 6 characters.");
        } else {
            alert(error.message);
        }

    } finally {

        button.disabled = false;
        button.textContent = "Create Account";

    }

});