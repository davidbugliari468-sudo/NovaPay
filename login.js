import { auth } from "./firebase.js";

import {
    signInWithEmailAndPassword,
    setPersistence,
    browserLocalPersistence,
    browserSessionPersistence
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";


// ============================================================
// NOVAPAY LOGIN
// ============================================================
//
// Frontend:
// https://davidbugliari468-sudo.github.io/NovaPay/
//
// Backend:
// https://novapay-server.onrender.com
//
// IMPORTANT:
// The /NovaPay/ path belongs to GitHub Pages.
// It is NOT added to the backend URL.
// ============================================================

const BACKEND_URL = "https://novapay-server.onrender.com";


// ============================================================
// ELEMENTS
// ============================================================

const loginForm = document.getElementById("loginForm");
const loginBtn = document.getElementById("loginBtn");
const forgotPassword = document.getElementById("forgotPassword");


// ============================================================
// MODAL
// ============================================================

function showModal(title, message) {
    const modal = document.getElementById("customModal");
    const modalTitle = document.getElementById("modalTitle");
    const modalMessage = document.getElementById("modalMessage");
    const modalButton = document.getElementById("modalButton");

    if (!modal) {
        alert(`${title}\n\n${message}`);
        return;
    }

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


// ============================================================
// PASSWORD VISIBILITY
// ============================================================

window.togglePassword = function (inputId, button) {
    const input = document.getElementById(inputId);

    if (!input || !button) {
        console.error("NovaPay: Password input or toggle button not found.");
        return;
    }

    if (input.type === "password") {
        input.type = "text";
        button.textContent = "Hide";
    } else {
        input.type = "password";
        button.textContent = "Show";
    }
};


// ============================================================
// FORGOT PASSWORD
// ============================================================

if (forgotPassword) {
    forgotPassword.addEventListener("click", (event) => {
        event.preventDefault();

        window.location.href = "forgot-password.html";
    });
}


// ============================================================
// LOGIN
// ============================================================

if (loginForm) {
    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const emailInput = document.getElementById("email");
        const passwordInput = document.getElementById("password");
        const rememberMeInput = document.getElementById("rememberMe");

        if (!emailInput || !passwordInput || !rememberMeInput) {
            console.error("NovaPay: Required login elements are missing.");

            showModal(
                "Login Error",
                "The login form is missing a required field."
            );

            return;
        }

        const email = emailInput.value.trim();
        const password = passwordInput.value;
        const rememberMe = rememberMeInput.checked;

        // --------------------------------------------------------
        // BASIC VALIDATION
        // --------------------------------------------------------

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

        // --------------------------------------------------------
        // DISABLE BUTTON
        // --------------------------------------------------------

        if (loginBtn) {
            loginBtn.disabled = true;
            loginBtn.textContent = "Logging in...";
        }

        console.log("NovaPay login started.");
        console.log("Frontend origin:", window.location.origin);
        console.log("Backend:", BACKEND_URL);

        try {

            // ====================================================
            // STEP 1 — FIREBASE PERSISTENCE
            // ====================================================

            console.log("STEP 1: Setting Firebase persistence...");

            await setPersistence(
                auth,
                rememberMe
                    ? browserLocalPersistence
                    : browserSessionPersistence
            );

            console.log("STEP 1 PASSED.");


            // ====================================================
            // STEP 2 — FIREBASE AUTHENTICATION
            // ====================================================

            console.log("STEP 2: Signing into Firebase...");

            const userCredential =
                await signInWithEmailAndPassword(
                    auth,
                    email,
                    password
                );

            const user = userCredential.user;

            console.log("STEP 2 PASSED.");
            console.log("Firebase UID:", user.uid);
            console.log("Firebase email:", user.email);
            console.log("Email verified:", user.emailVerified);


            // ====================================================
            // STEP 3 — GET FIREBASE ID TOKEN
            // ====================================================

            console.log("STEP 3: Getting Firebase ID token...");

            const idToken = await user.getIdToken(true);

            if (!idToken) {
                throw new Error(
                    "Firebase login succeeded, but no ID token was returned."
                );
            }

            console.log("STEP 3 PASSED.");
            console.log("Firebase ID token received.");


            // ====================================================
            // STEP 4 — CONNECT TO RENDER
            // ====================================================

            const protectedUrl =
                `${BACKEND_URL}/api/protected`;

            console.log("STEP 4: Connecting to Render...");
            console.log("Request URL:", protectedUrl);

            let response;

            try {
                response = await fetch(
                    protectedUrl,
                    {
                        method: "GET",

                        headers: {
                            "Authorization": `Bearer ${idToken}`,
                            "Accept": "application/json"
                        },

                        cache: "no-store"
                    }
                );
            } catch (networkError) {

                console.error(
                    "STEP 4 FAILED: Browser could not connect to Render.",
                    networkError
                );

                showModal(
                    "Backend Connection Failed",
                    "Firebase login was successful, but your browser could not connect to the NovaPay backend.\n\nThis is most likely a CORS or frontend-origin configuration problem.\n\nCheck your Render FRONTEND_ORIGIN setting."
                );

                return;
            }

            console.log(
                "STEP 4 PASSED: Render responded."
            );

            console.log(
                "HTTP status:",
                response.status
            );


            // ====================================================
            // STEP 5 — READ RENDER RESPONSE
            // ====================================================

            const responseText = await response.text();

            console.log(
                "STEP 5: Render response received."
            );

            console.log(
                "Raw response:",
                responseText
            );

            let data;

            try {
                data = JSON.parse(responseText);
            } catch (parseError) {

                console.error(
                    "STEP 5 FAILED: Backend response was not JSON.",
                    parseError
                );

                showModal(
                    "Backend Error",
                    `The Render server responded with HTTP ${response.status}, but the response was not valid JSON.`
                );

                return;
            }

            console.log(
                "Parsed backend response:",
                data
            );


            // ====================================================
            // STEP 6 — CHECK BACKEND AUTHENTICATION
            // ====================================================

            if (!response.ok) {

                console.error(
                    "STEP 6 FAILED: Backend returned an HTTP error.",
                    {
                        status: response.status,
                        data
                    }
                );

                const backendError =
                    data?.error ||
                    "Unknown backend error.";

                showModal(
                    "Backend Authentication Failed",
                    `Firebase login worked, but Render rejected the request.\n\nHTTP Status: ${response.status}\n\nBackend message: ${backendError}`
                );

                return;
            }


            if (!data.success) {

                console.error(
                    "STEP 6 FAILED: Backend returned success=false.",
                    data
                );

                showModal(
                    "Backend Authentication Failed",
                    `Firebase login worked, but the backend did not authenticate the user.\n\nBackend message: ${data.error || "Unknown error."}`
                );

                return;
            }

            console.log(
                "STEP 6 PASSED: Render verified the Firebase token."
            );


            // ====================================================
            // STEP 7 — LOGIN COMPLETELY SUCCESSFUL
            // ====================================================

            console.log("--------------------------------------------");
            console.log("NOVAPAY LOGIN SUCCESSFUL");
            console.log("--------------------------------------------");

            console.log(
                "Authenticated Firebase UID:",
                user.uid
            );

            console.log(
                "Backend user:",
                data.user
            );


            // ====================================================
            // STEP 8 — DASHBOARD REDIRECT
            // ====================================================
            //
            // Using a relative URL keeps the /NovaPay/ GitHub Pages
            // path automatically.
            //
            // Example:
            // /NovaPay/login.html
            //       ↓
            // /NovaPay/dashboard.html
            // ====================================================

            window.location.href = "dashboard.html";

        } catch (error) {

            console.error("--------------------------------------------");
            console.error("NOVAPAY LOGIN ERROR");
            console.error("--------------------------------------------");

            console.error("Error:", error);
            console.error("Error code:", error?.code);
            console.error("Error message:", error?.message);
            console.error("Error name:", error?.name);

            let title = "Login Failed";
            let message =
                "We could not complete your login. Please try again.";

            // ----------------------------------------------------
            // FIREBASE ERRORS
            // ----------------------------------------------------

            switch (error?.code) {

                case "auth/invalid-credential":

                    title = "Invalid Login";
                    message =
                        "The email address or password is incorrect.";

                    break;


                case "auth/user-not-found":

                    title = "Account Not Found";
                    message =
                        "No NovaPay account was found with this email address.";

                    break;


                case "auth/wrong-password":

                    title = "Incorrect Password";
                    message =
                        "The password you entered is incorrect.";

                    break;


                case "auth/invalid-email":

                    title = "Invalid Email";
                    message =
                        "Please enter a valid email address.";

                    break;


                case "auth/user-disabled":

                    title = "Account Disabled";
                    message =
                        "This Firebase account has been disabled.";

                    break;


                case "auth/too-many-requests":

                    title = "Too Many Attempts";
                    message =
                        "There have been too many login attempts. Please wait and try again later.";

                    break;


                case "auth/network-request-failed":

                    title = "Network Error";
                    message =
                        "The browser could not communicate with Firebase. Please check your internet connection.";

                    break;


                case "auth/operation-not-allowed":

                    title = "Login Method Disabled";
                    message =
                        "Email/password authentication is not currently enabled in Firebase.";

                    break;


                default:

                    message =
                        error?.message ||
                        "An unexpected error occurred. Please try again.";

                    break;
            }

            showModal(title, message);

        } finally {

            if (loginBtn) {
                loginBtn.disabled = false;
                loginBtn.textContent = "Login";
            }
        }
    });

} else {

    console.error(
        "NovaPay: loginForm was not found."
    );
}

console.log(
    "NovaPay login.js loaded successfully."
);