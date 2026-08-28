import { auth } from "./firebase.js";

import {
    signInWithEmailAndPassword,
    setPersistence,
    browserLocalPersistence,
    browserSessionPersistence
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

// =====================================================
// TEMPORARY NOVAPAY LOGIN DIAGNOSTIC
// =====================================================

const BACKEND_URL = "https://novapay-server.onrender.com";

// =====================================================
// ELEMENTS
// =====================================================

const form = document.getElementById("loginForm");
const button = document.getElementById("loginBtn");
const forgotPassword = document.getElementById("forgotPassword");

// =====================================================
// SAFETY CHECK
// =====================================================

if (!form) {
    console.error("DIAGNOSTIC ERROR: loginForm was not found.");
}

if (!button) {
    console.error("DIAGNOSTIC ERROR: loginBtn was not found.");
}

// =====================================================
// MODAL
// =====================================================

function showModal(title, message) {
    const modal = document.getElementById("customModal");

    if (!modal) {
        alert(`${title}\n\n${message}`);
        return;
    }

    const modalTitle = document.getElementById("modalTitle");
    const modalMessage = document.getElementById("modalMessage");
    const modalButton = document.getElementById("modalButton");

    if (modalTitle) {
        modalTitle.textContent = title;
    }

    if (modalMessage) {
        modalMessage.textContent = message;
    }

    modal.style.display = "flex";

    if (modalButton) {
        modalButton.onclick = () => {
            modal.style.display = "none";
        };
    }
}

// =====================================================
// SHOW / HIDE PASSWORD
// =====================================================

window.togglePassword = function (inputId, toggleButton) {
    const input = document.getElementById(inputId);

    if (!input || !toggleButton) {
        console.error("DIAGNOSTIC: Password elements were not found.");
        return;
    }

    if (input.type === "password") {
        input.type = "text";
        toggleButton.textContent = "Hide";
    } else {
        input.type = "password";
        toggleButton.textContent = "Show";
    }
};

// =====================================================
// FORGOT PASSWORD
// =====================================================

if (forgotPassword) {
    forgotPassword.addEventListener("click", (event) => {
        event.preventDefault();
        window.location.href = "forgot-password.html";
    });
}

// =====================================================
// LOGIN
// =====================================================

if (form) {
    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        console.clear();

        console.log("========================================");
        console.log("NOVAPAY LOGIN DIAGNOSTIC STARTED");
        console.log("========================================");

        const emailElement = document.getElementById("email");
        const passwordElement = document.getElementById("password");
        const rememberElement = document.getElementById("rememberMe");

        if (!emailElement || !passwordElement || !rememberElement) {
            console.error("DIAGNOSTIC ERROR: Required login fields are missing.");

            showModal(
                "Diagnostic Error",
                "One or more login form fields could not be found."
            );

            return;
        }

        const email = emailElement.value.trim();
        const password = passwordElement.value;
        const rememberMe = rememberElement.checked;

        // -------------------------------------------------
        // BASIC VALIDATION
        // -------------------------------------------------

        if (!email) {
            showModal(
                "Login",
                "Please enter your email address."
            );
            return;
        }

        if (!password) {
            showModal(
                "Login",
                "Please enter your password."
            );
            return;
        }

        if (button) {
            button.disabled = true;
            button.textContent = "Testing...";
        }

        try {

            // =================================================
            // TEST 1 — FIREBASE PERSISTENCE
            // =================================================

            console.log("TEST 1: Setting Firebase persistence...");

            await setPersistence(
                auth,
                rememberMe
                    ? browserLocalPersistence
                    : browserSessionPersistence
            );

            console.log("TEST 1 PASSED: Firebase persistence is working.");

            // =================================================
            // TEST 2 — FIREBASE LOGIN
            // =================================================

            console.log("TEST 2: Attempting Firebase login...");
            console.log("Email:", email);

            const userCredential =
                await signInWithEmailAndPassword(
                    auth,
                    email,
                    password
                );

            const user = userCredential.user;

            console.log("TEST 2 PASSED: Firebase login successful.");
            console.log("Firebase UID:", user.uid);
            console.log("Firebase email:", user.email);
            console.log("Email verified:", user.emailVerified);

            // =================================================
            // TEST 3 — FIREBASE ID TOKEN
            // =================================================

            console.log("TEST 3: Requesting Firebase ID token...");

            const idToken = await user.getIdToken(true);

            if (!idToken) {
                throw new Error(
                    "Firebase login succeeded, but no ID token was returned."
                );
            }

            console.log("TEST 3 PASSED: Firebase ID token received.");
            console.log(
                "Token received:",
                `${idToken.substring(0, 20)}...`
            );

            // =================================================
            // TEST 4 — RENDER BACKEND CONNECTION
            // =================================================

            const backendUrl =
                `${BACKEND_URL}/api/protected`;

            console.log("TEST 4: Connecting to Render backend...");
            console.log("Backend URL:", backendUrl);

            let response;

            try {
                response = await fetch(
                    backendUrl,
                    {
                        method: "GET",

                        headers: {
                            "Authorization": `Bearer ${idToken}`,
                            "Accept": "application/json"
                        }
                    }
                );
            } catch (networkError) {

                console.error(
                    "TEST 4 FAILED: Browser could not connect to Render.",
                    networkError
                );

                showModal(
                    "Backend Connection Failed",
                    "Firebase login worked, but the browser could not connect to the Render backend. Check the browser Console for the exact error."
                );

                return;
            }

            console.log(
                "TEST 4 RESPONSE RECEIVED.",
                "HTTP status:",
                response.status
            );

            // =================================================
            // TEST 5 — READ BACKEND RESPONSE
            // =================================================

            const responseText = await response.text();

            console.log(
                "TEST 5: Raw backend response:",
                responseText
            );

            let data;

            try {
                data = JSON.parse(responseText);
            } catch (parseError) {

                console.error(
                    "TEST 5 FAILED: Render did not return valid JSON.",
                    parseError
                );

                showModal(
                    "Backend Response Error",
                    `Render responded with HTTP ${response.status}, but the response was not valid JSON. Check the browser Console.`
                );

                return;
            }

            console.log("Parsed backend response:", data);

            // =================================================
            // TEST 6 — BACKEND AUTHENTICATION
            // =================================================

            if (!response.ok) {

                console.error(
                    "TEST 6 FAILED: Backend returned HTTP error.",
                    {
                        status: response.status,
                        data
                    }
                );

                showModal(
                    "Backend Authentication Failed",
                    `Firebase login worked, but Render rejected the request.\n\nHTTP Status: ${response.status}\nBackend Error: ${data.error || "Unknown error"}\n\nCheck the browser Console.`
                );

                return;
            }

            if (!data.success) {

                console.error(
                    "TEST 6 FAILED: Backend returned success=false.",
                    data
                );

                showModal(
                    "Backend Authentication Failed",
                    `Firebase login worked, but the backend did not authenticate the user.\n\nBackend Error: ${data.error || "Unknown error"}`
                );

                return;
            }

            console.log(
                "TEST 6 PASSED: Render authenticated the Firebase token."
            );

            console.log(
                "Authenticated backend user:",
                data.user
            );

            // =================================================
            // ALL TESTS PASSED
            // =================================================

            console.log("========================================");
            console.log("ALL LOGIN TESTS PASSED");
            console.log("========================================");

            showModal(
                "Login Test Successful",
                "Firebase login works and Render successfully verified the Firebase token.\n\nThe login system itself is working."
            );

            /*
             * IMPORTANT:
             * We deliberately do NOT redirect to dashboard.html
             * during this diagnostic test.
             *
             * We want to see the successful result first.
             */

        } catch (error) {

            console.error("========================================");
            console.error("LOGIN DIAGNOSTIC FAILED");
            console.error("========================================");

            console.error("Error object:", error);
            console.error("Error code:", error?.code);
            console.error("Error message:", error?.message);
            console.error("Error name:", error?.name);

            let title = "Login Diagnostic Failed";
            let message =
                "An unexpected error occurred. Check the browser Console for details.";

            switch (error?.code) {

                case "auth/invalid-credential":
                    title = "Firebase Login Failed";
                    message =
                        "Firebase rejected the email/password combination. The Render backend was not reached.";
                    break;

                case "auth/user-not-found":
                    title = "Firebase User Not Found";
                    message =
                        "Firebase could not find an account with this email address.";
                    break;

                case "auth/wrong-password":
                    title = "Firebase Password Error";
                    message =
                        "Firebase rejected the password.";
                    break;

                case "auth/invalid-email":
                    title = "Invalid Email";
                    message =
                        "Firebase says the email address is invalid.";
                    break;

                case "auth/too-many-requests":
                    title = "Too Many Attempts";
                    message =
                        "Firebase temporarily blocked login attempts. Please wait and try again.";
                    break;

                case "auth/network-request-failed":
                    title = "Firebase Network Error";
                    message =
                        "The browser could not communicate with Firebase.";
                    break;

                default:
                    message =
                        error?.message ||
                        "Unknown error. Check the browser Console.";
            }

            showModal(title, message);

        } finally {

            if (button) {
                button.disabled = false;
                button.textContent = "Login";
            }
        }
    });
}

console.log("NovaPay diagnostic login.js loaded.");