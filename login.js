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
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const rememberMeInput = document.getElementById("rememberMe");
const loginButton = document.getElementById("loginBtn");
const forgotPassword = document.getElementById("forgotPassword");

const customModal = document.getElementById("customModal");
const modalTitle = document.getElementById("modalTitle");
const modalMessage = document.getElementById("modalMessage");
const modalButton = document.getElementById("modalButton");


// =====================================================
// LOGIN STATE
// =====================================================

let loginInProgress = false;


// =====================================================
// MODAL
// =====================================================

function hideModal() {
    if (!customModal) {
        return;
    }

    customModal.style.display = "none";
}


function showModal(title, message, callback = null) {
    if (!customModal) {
        window.alert(`${title}\n\n${message}`);

        if (typeof callback === "function") {
            callback();
        }

        return;
    }

    if (modalTitle) {
        modalTitle.textContent = title;
    }

    if (modalMessage) {
        modalMessage.textContent = message;
    }

    customModal.style.display = "flex";

    if (modalButton) {
        modalButton.onclick = () => {
            hideModal();

            if (typeof callback === "function") {
                callback();
            }
        };

        modalButton.focus();
    }
}


// =====================================================
// MODAL BUTTON
// =====================================================

if (modalButton) {
    modalButton.addEventListener("click", () => {
        hideModal();
    });
}


// =====================================================
// CLOSE MODAL WHEN CLICKING OUTSIDE THE BOX
// =====================================================

if (customModal) {
    customModal.addEventListener("click", (event) => {
        if (event.target === customModal) {
            hideModal();
        }
    });
}


// =====================================================
// ESCAPE KEY CLOSES MODAL
// =====================================================

document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") {
        return;
    }

    if (!customModal) {
        return;
    }

    if (customModal.style.display === "flex") {
        hideModal();
    }
});


// =====================================================
// SHOW / HIDE PASSWORD
// =====================================================

window.togglePassword = function (inputId, toggleButton) {
    const input = document.getElementById(inputId);

    if (!input || !toggleButton) {
        return;
    }

    const showingPassword = input.type === "password";

    if (showingPassword) {
        input.type = "text";

        toggleButton.textContent = "Hide";
        toggleButton.setAttribute(
            "aria-label",
            "Hide password"
        );
    } else {
        input.type = "password";

        toggleButton.textContent = "Show";
        toggleButton.setAttribute(
            "aria-label",
            "Show password"
        );
    }
};


// =====================================================
// FORGOT PASSWORD
// =====================================================

if (forgotPassword) {
    forgotPassword.addEventListener("click", (event) => {
        event.preventDefault();

        if (loginInProgress) {
            return;
        }

        window.location.href = "forgot-password.html";
    });
}


// =====================================================
// EMAIL VALIDATION
// =====================================================

function isValidEmail(email) {
    if (!email) {
        return false;
    }

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}


// =====================================================
// LOGIN BUTTON STATE
// =====================================================

function setLoginButtonLoading(isLoading) {
    if (!loginButton) {
        return;
    }

    loginButton.disabled = isLoading;

    if (isLoading) {
        loginButton.textContent = "Logging In...";
        loginButton.setAttribute(
            "aria-busy",
            "true"
        );
    } else {
        loginButton.textContent = "Login";
        loginButton.removeAttribute("aria-busy");
    }
}


// =====================================================
// FIREBASE ERROR MESSAGE
// =====================================================

function getFirebaseErrorMessage(error) {
    switch (error?.code) {

        case "auth/invalid-credential":

        case "auth/user-not-found":

        case "auth/wrong-password":

            return {
                title: "Login Failed",
                message: "Incorrect email or password."
            };


        case "auth/invalid-email":

            return {
                title: "Login Failed",
                message: "Please enter a valid email address."
            };


        case "auth/user-disabled":

            return {
                title: "Account Disabled",
                message: "This account has been disabled."
            };


        case "auth/too-many-requests":

            return {
                title: "Temporarily Blocked",
                message:
                    "Too many login attempts. Please wait and try again."
            };


        case "auth/network-request-failed":

            return {
                title: "Connection Error",
                message:
                    "Please check your internet connection and try again."
            };


        case "auth/operation-not-allowed":

            return {
                title: "Login Unavailable",
                message:
                    "Email and password login is currently unavailable."
            };


        case "auth/weak-password":

            return {
                title: "Login Failed",
                message:
                    "The password provided is not valid."
            };


        default:

            return {
                title: "Login Failed",
                message:
                    "We could not complete your login. Please try again."
            };
    }
}


// =====================================================
// BACKEND ERROR MESSAGE
// =====================================================

function getBackendErrorMessage(data, response) {
    if (data && typeof data.error === "string") {
        return data.error;
    }

    if (data && typeof data.message === "string") {
        return data.message;
    }

    if (response?.status === 401) {
        return "Your session could not be authenticated. Please log in again.";
    }

    if (response?.status === 403) {
        return "You are not authorized to access this account.";
    }

    if (response?.status >= 500) {
        return "The NovaPay server is temporarily unavailable. Please try again.";
    }

    return "Backend authentication failed. Please try again.";
}


// =====================================================
// BACKEND RESPONSE READER
// =====================================================

async function readBackendResponse(response) {
    const contentType =
        response.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
        try {
            return await response.json();
        } catch {
            throw new Error(
                "The backend returned invalid JSON."
            );
        }
    }

    const text = await response.text();

    if (!text) {
        return {};
    }

    return {
        message: text
    };
}


// =====================================================
// LOGIN
// =====================================================

if (form) {
    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        if (loginInProgress) {
            return;
        }

        if (
            !emailInput ||
            !passwordInput ||
            !rememberMeInput
        ) {
            showModal(
                "Login Error",
                "The login form is missing a required field."
            );

            return;
        }


        // =============================================
        // READ FORM VALUES
        // =============================================

        const email =
            emailInput.value.trim();

        const password =
            passwordInput.value;

        const rememberMe =
            rememberMeInput.checked;


        // =============================================
        // BASIC VALIDATION
        // =============================================

        if (!email) {
            showModal(
                "Login",
                "Please enter your email address."
            );

            emailInput.focus();

            return;
        }


        if (!isValidEmail(email)) {
            showModal(
                "Login",
                "Please enter a valid email address."
            );

            emailInput.focus();

            return;
        }


        if (!password) {
            showModal(
                "Login",
                "Please enter your password."
            );

            passwordInput.focus();

            return;
        }


        // =============================================
        // START LOGIN
        // =============================================

        loginInProgress = true;

        setLoginButtonLoading(true);


        try {

            // =========================================
            // 1. FIREBASE PERSISTENCE
            // =========================================

            await setPersistence(
                auth,
                rememberMe
                    ? browserLocalPersistence
                    : browserSessionPersistence
            );


            // =========================================
            // 2. FIREBASE LOGIN
            // =========================================

            const userCredential =
                await signInWithEmailAndPassword(
                    auth,
                    email,
                    password
                );


            const user =
                userCredential?.user;


            if (!user) {
                throw new Error(
                    "The authenticated user was not returned."
                );
            }


            // =========================================
            // 3. GET FRESH FIREBASE ID TOKEN
            // =========================================

            const idToken =
                await user.getIdToken(true);


            if (!idToken) {
                throw new Error(
                    "Authentication token was not received."
                );
            }


            // =========================================
            // 4. AUTHENTICATE WITH NOVAPAY BACKEND
            // =========================================

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


            // =========================================
            // 5. READ BACKEND RESPONSE
            // =========================================

            const data =
                await readBackendResponse(response);


            // =========================================
            // 6. VERIFY BACKEND AUTHENTICATION
            // =========================================

            if (!response.ok || !data?.success) {

                console.error(
                    "NovaPay backend authentication failed.",
                    {
                        status: response.status,
                        success: data?.success === true
                    }
                );

                throw new Error(
                    getBackendErrorMessage(
                        data,
                        response
                    )
                );
            }


            // =========================================
            // 7. LOGIN SUCCESSFUL
            // =========================================

            console.log(
                "NovaPay login and backend authentication successful."
            );


            // =========================================
            // 8. GO TO DASHBOARD
            // =========================================

            window.location.replace(
                "dashboard.html"
            );

        } catch (error) {

            console.error(
                "NovaPay login error:",
                error
            );


            // =========================================
            // FIREBASE AUTHENTICATION ERRORS
            // =========================================

            const firebaseError =
                getFirebaseErrorMessage(error);


            const firebaseErrorCodes = [
                "auth/invalid-credential",
                "auth/user-not-found",
                "auth/wrong-password",
                "auth/invalid-email",
                "auth/user-disabled",
                "auth/too-many-requests",
                "auth/network-request-failed",
                "auth/operation-not-allowed",
                "auth/weak-password"
            ];


            if (
                firebaseErrorCodes.includes(
                    error?.code
                )
            ) {

                showModal(
                    firebaseError.title,
                    firebaseError.message
                );

            } else {

                // =====================================
                // BACKEND / UNKNOWN ERROR
                // =====================================

                showModal(
                    "Login Failed",
                    error?.message ||
                    "We could not complete your login. Please try again."
                );
            }

        } finally {

            loginInProgress = false;

            setLoginButtonLoading(false);
        }
    });
}


// =====================================================
// ENTER KEY SUPPORT
// =====================================================

if (emailInput) {
    emailInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            event.preventDefault();

            if (form && typeof form.requestSubmit === "function") {
                form.requestSubmit();
            }
        }
    });
}


if (passwordInput) {
    passwordInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            event.preventDefault();

            if (form && typeof form.requestSubmit === "function") {
                form.requestSubmit();
            }
        }
    });
}


// =====================================================
// REMEMBER ME ACCESSIBILITY
// =====================================================

if (rememberMeInput) {
    rememberMeInput.addEventListener("change", () => {
        rememberMeInput.setAttribute(
            "aria-checked",
            String(rememberMeInput.checked)
        );
    });

    rememberMeInput.setAttribute(
        "aria-checked",
        String(rememberMeInput.checked)
    );
}


// =====================================================
// INITIAL PAGE STATE
// =====================================================

setLoginButtonLoading(false);