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

const BACKEND_URL =
    "https://davidbugliari468-3000.app.github.dev";


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
        alert(message);

        if (callback) callback();

        return;
    }

    const modalTitle =
        document.getElementById("modalTitle");

    const modalMessage =
        document.getElementById("modalMessage");

    const modalButton =
        document.getElementById("modalButton");


    if (modalTitle) {
        modalTitle.textContent = title;
    }

    if (modalMessage) {
        modalMessage.innerHTML = message;
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

window.togglePassword = function (inputId, button) {

    const input =
        document.getElementById(inputId);

    if (!input) return;


    if (input.type === "password") {

        input.type = "text";
        button.textContent = "Hide";

    } else {

        input.type = "password";
        button.textContent = "Show";
    }
};


// =====================================================
// FORGOT PASSWORD
// =====================================================

if (forgotPassword) {

    forgotPassword.addEventListener(
        "click",
        function (e) {

            e.preventDefault();

            window.location.href =
                "forgot-password.html";

        }
    );
}


// =====================================================
// LOGIN
// =====================================================

form.addEventListener("submit", async function (e) {

    e.preventDefault();


    const email =
        document.getElementById("email")
            .value
            .trim();

    const password =
        document.getElementById("password")
            .value;

    const rememberMe =
        document.getElementById("rememberMe")
            .checked;


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


    button.disabled = true;
    button.textContent = "Logging In...";


    try {

        // =============================================
        // 1. FIREBASE LOGIN
        // =============================================

        await setPersistence(
            auth,
            rememberMe
                ? browserLocalPersistence
                : browserSessionPersistence
        );


        const userCredential =
            await signInWithEmailAndPassword(
                auth,
                email,
                password
            );


        const user =
            userCredential.user;


        // =============================================
        // 2. GET FRESH FIREBASE ID TOKEN
        // =============================================

        const idToken =
            await user.getIdToken(true);


        if (!idToken) {

            throw new Error(
                "Authentication token was not received."
            );
        }


        // =============================================
        // 3. SEND TOKEN TO NOVAPAY BACKEND
        // =============================================

        const response =
            await fetch(
                `${BACKEND_URL}/api/protected`,
                {
                    method: "GET",

                    headers: {
                        "Authorization":
                            `Bearer ${idToken}`,

                        "Accept":
                            "application/json"
                    }
                }
            );


        // =============================================
        // 4. READ BACKEND RESPONSE
        // =============================================

        let data = null;

        try {

            data = await response.json();

        } catch {

            throw new Error(
                "The backend returned an invalid response."
            );
        }


        // =============================================
        // 5. BACKEND MUST CONFIRM AUTHENTICATION
        // =============================================

        if (!response.ok || !data.success) {

            console.error(
                "Backend authentication failed:",
                data
            );

            throw new Error(
                "Backend authentication failed."
            );
        }


        // =============================================
        // 6. EVERYTHING PASSED
        // =============================================

        console.log(
            "NovaPay login and backend authentication successful."
        );


        window.location.href =
            "dashboard.html";


    } catch (error) {

        console.error(
            "NovaPay login error:",
            error
        );


        switch (error.code) {

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
        }

    } finally {

        button.disabled = false;
        button.textContent = "Login";

    }

});