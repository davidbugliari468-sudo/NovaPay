import { auth } from "./firebase.js";

import {
    signInWithEmailAndPassword,
    setPersistence,
    browserLocalPersistence,
    browserSessionPersistence
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";


// =====================================================
// NOVAPAY BACKEND
// =====================================================

const BACKEND_URL = "https://novapay-server.onrender.com";


// =====================================================
// ELEMENTS
// =====================================================

const form = document.getElementById("loginForm");
const button = document.getElementById("loginBtn");
const forgotPassword = document.getElementById("forgotPassword");


// =====================================================
// MODAL
// =====================================================

function showModal(title, message, callback = null) {
    const modal = document.getElementById("customModal");

    if (!modal) {
        alert(`${title}\n\n${message}`);

        if (callback) {
            callback();
        }

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

            if (callback) {
                callback();
            }
        };
    }
}


// =====================================================
// SHOW / HIDE PASSWORD
// =====================================================

window.togglePassword = function (inputId, toggleButton) {
    const input = document.getElementById(inputId);

    if (!input || !toggleButton) {
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

        const emailInput = document.getElementById("email");
        const passwordInput = document.getElementById("password");
        const rememberMeInput = document.getElementById("rememberMe");

        if (!emailInput || !passwordInput || !rememberMeInput) {
            showModal(
                "Login Error",
                "The login form is missing a required field."
            );

            return;
        }

        const email = emailInput.value.trim();
        const password = passwordInput.value;
        const rememberMe = rememberMeInput.checked;

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

        // -------------------------------------------------
        // DISABLE LOGIN BUTTON
        // -------------------------------------------------

        if (button) {
            button.disabled = true;
            button.textContent = "Logging In...";
        }

        try {

            // =============================================
            // 1. FIREBASE PERSISTENCE
            // =============================================

            await setPersistence(
                auth,
                rememberMe
                    ? browserLocalPersistence
                    : browserSessionPersistence
            );


            // =============================================
            // 2. FIREBASE LOGIN
            // =============================================

            const userCredential =
                await signInWithEmailAndPassword(
                    auth,
                    email,
                    password
                );

            const user = userCredential.user;


            // =============================================
            // 3. GET FRESH FIREBASE ID TOKEN
            // =============================================

            const idToken =
                await user.getIdToken(true);

            if (!idToken) {
                throw new Error(
                    "Authentication token was not received."
                );
            }


            // =============================================
            // 4. AUTHENTICATE WITH NOVAPAY BACKEND
            // =============================================

            const response =
                await fetch(
                    `${BACKEND_URL}/api/protected`,
                    {
                        method: "GET",

                        headers: {
                            "Authorization": `Bearer ${idToken}`,
                            "Accept": "application/json"
                        },

                        cache: "no-store"
                    }
                );


            // =============================================
            // 5. READ BACKEND RESPONSE
            // =============================================

            let data;

            try {
                data = await response.json();
            } catch {
                throw new Error(
                    "The backend returned an invalid response."
                );
            }


            // =============================================
            // 6. VERIFY BACKEND AUTHENTICATION
            // =============================================

            if (!response.ok || !data.success) {
                console.error(
                    "Backend authentication failed:",
                    data
                );

                throw new Error(
                    data.error ||
                    "Backend authentication failed."
                );
            }


            // =============================================
            // 7. LOGIN SUCCESSFUL
            // =============================================

            console.log(
                "NovaPay login and backend authentication successful."
            );


            // =============================================
            // 8. GO TO DASHBOARD
            // =============================================

            window.location.href = "dashboard.html";

        } catch (error) {

            console.error(
                "NovaPay login error:",
                error
            );

            // -------------------------------------------------
            // FIREBASE AUTH ERRORS
            // -------------------------------------------------

            switch (error?.code) {

                case "auth/invalid-credential":

                case "auth/user-not-found":

                case "auth/wrong-password":

                    showModal(
                        "Login Failed",
                        "Incorrect email or password."
                    );

                    break;


                case "auth/invalid-email":

                    showModal(
                        "Login Failed",
                        "Please enter a valid email address."
                    );

                    break;


                case "auth/user-disabled":

                    showModal(
                        "Account Disabled",
                        "This account has been disabled."
                    );

                    break;


                case "auth/too-many-requests":

                    showModal(
                        "Temporarily Blocked",
                        "Too many login attempts. Please wait and try again."
                    );

                    break;


                case "auth/network-request-failed":

                    showModal(
                        "Connection Error",
                        "Please check your internet connection and try again."
                    );

                    break;


                default:

                    showModal(
                        "Login Failed",
                        "We could not complete your login. Please try again."
                    );

                    break;
            }

        } finally {

            if (button) {
                button.disabled = false;
                button.textContent = "Login";
            }
        }
    });
}