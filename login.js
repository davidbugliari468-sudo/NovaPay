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
// FRONTEND DEBUGGING
// =====================================================

function debugLog(stage, details = {}) {
    console.groupCollapsed(
        `%c[NOVAPAY LOGIN DEBUG] ${stage}`,
        "font-weight:bold;"
    );

    console.log("Time:", new Date().toISOString());
    console.log("Page URL:", window.location.href);
    console.log("Page Origin:", window.location.origin);
    console.log("Backend URL:", BACKEND_URL);
    console.log("User Agent:", navigator.userAgent);

    if (details && typeof details === "object") {
        console.log("Details:", details);
    }

    console.groupEnd();
}


function getDetailedErrorMessage(error) {
    if (!error) {
        return "Unknown error. No error object was returned.";
    }

    const code =
        error?.code ||
        "NO_ERROR_CODE";

    const name =
        error?.name ||
        "UnknownError";

    const message =
        error?.message ||
        String(error);

    return [
        `Error code: ${code}`,
        `Error name: ${name}`,
        `Error message: ${message}`
    ].join("\n");
}


function showDebugFailure(title, error, extraDetails = "") {
    const errorDetails =
        getDetailedErrorMessage(error);

    let message =
        `${errorDetails}`;

    if (extraDetails) {
        message += `\n\n${extraDetails}`;
    }

    console.error(
        "[NOVAPAY LOGIN DEBUG] FINAL FAILURE",
        {
            error,
            errorCode: error?.code,
            errorName: error?.name,
            errorMessage: error?.message,
            pageOrigin: window.location.origin,
            pageURL: window.location.href,
            backendURL: BACKEND_URL
        }
    );

    showModal(
        title,
        message
    );
}


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

    debugLog(
        "BACKEND RESPONSE HEADERS",
        {
            status: response.status,
            statusText: response.statusText,
            ok: response.ok,
            contentType,
            contentLength:
                response.headers.get("content-length"),
            accessControlAllowOrigin:
                response.headers.get(
                    "access-control-allow-origin"
                )
        }
    );

    if (contentType.includes("application/json")) {
        try {
            const json =
                await response.json();

            debugLog(
                "BACKEND JSON RESPONSE",
                {
                    status: response.status,
                    response: json
                }
            );

            return json;

        } catch (error) {

            debugLog(
                "BACKEND JSON PARSE FAILED",
                {
                    status: response.status,
                    contentType,
                    errorName: error?.name,
                    errorMessage: error?.message
                }
            );

            throw new Error(
                `The backend returned invalid JSON. HTTP status: ${response.status}. ${error?.message || ""}`
            );
        }
    }

    const text =
        await response.text();

    debugLog(
        "BACKEND TEXT RESPONSE",
        {
            status: response.status,
            contentType,
            responseText: text
        }
    );

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

        debugLog(
            "LOGIN SUBMIT STARTED",
            {
                formFound: Boolean(form),
                emailFieldFound: Boolean(emailInput),
                passwordFieldFound: Boolean(passwordInput),
                rememberMeFieldFound: Boolean(rememberMeInput),
                loginButtonFound: Boolean(loginButton),
                pageOrigin: window.location.origin,
                pageProtocol: window.location.protocol
            }
        );

        if (loginInProgress) {
            debugLog(
                "LOGIN IGNORED",
                {
                    reason: "A login request is already in progress."
                }
            );

            return;
        }

        if (
            !emailInput ||
            !passwordInput ||
            !rememberMeInput
        ) {
            debugLog(
                "LOGIN FORM ERROR",
                {
                    emailInput: Boolean(emailInput),
                    passwordInput: Boolean(passwordInput),
                    rememberMeInput: Boolean(rememberMeInput)
                }
            );

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


        debugLog(
            "FORM VALUES READ",
            {
                email,
                passwordProvided: Boolean(password),
                passwordLength: password.length,
                rememberMe
            }
        );


        // =============================================
        // BASIC VALIDATION
        // =============================================

        if (!email) {
            debugLog(
                "VALIDATION FAILED",
                {
                    reason: "Email address is empty."
                }
            );

            showModal(
                "Login",
                "Please enter your email address."
            );

            emailInput.focus();

            return;
        }


        if (!isValidEmail(email)) {
            debugLog(
                "VALIDATION FAILED",
                {
                    reason: "Email address format is invalid.",
                    email
                }
            );

            showModal(
                "Login",
                "Please enter a valid email address."
            );

            emailInput.focus();

            return;
        }


        if (!password) {
            debugLog(
                "VALIDATION FAILED",
                {
                    reason: "Password is empty."
                }
            );

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


        debugLog(
            "LOGIN PROCESS STARTED",
            {
                email,
                rememberMe,
                pageOrigin: window.location.origin,
                pageProtocol: window.location.protocol,
                backendURL: BACKEND_URL
            }
        );


        try {

            // =========================================
            // 1. FIREBASE PERSISTENCE
            // =========================================

            debugLog(
                "STEP 1 - SETTING FIREBASE PERSISTENCE",
                {
                    persistence:
                        rememberMe
                            ? "browserLocalPersistence"
                            : "browserSessionPersistence"
                }
            );

            await setPersistence(
                auth,
                rememberMe
                    ? browserLocalPersistence
                    : browserSessionPersistence
            );


            debugLog(
                "STEP 1 SUCCESS - FIREBASE PERSISTENCE SET"
            );


            // =========================================
            // 2. FIREBASE LOGIN
            // =========================================

            debugLog(
                "STEP 2 - FIREBASE LOGIN STARTING",
                {
                    email,
                    firebaseAuthCurrentUser:
                        auth.currentUser
                            ? {
                                uid: auth.currentUser.uid,
                                email: auth.currentUser.email
                            }
                            : null
                }
            );

            const userCredential =
                await signInWithEmailAndPassword(
                    auth,
                    email,
                    password
                );


            const user =
                userCredential?.user;


            debugLog(
                "STEP 2 SUCCESS - FIREBASE LOGIN SUCCEEDED",
                {
                    uid: user?.uid || null,
                    email: user?.email || null,
                    emailVerified:
                        user?.emailVerified === true,
                    providerData:
                        user?.providerData || [],
                    firebaseAuthCurrentUser:
                        auth.currentUser
                            ? {
                                uid: auth.currentUser.uid,
                                email: auth.currentUser.email
                            }
                            : null
                }
            );


            if (!user) {
                throw new Error(
                    "The authenticated user was not returned."
                );
            }


            // =========================================
            // 3. GET FRESH FIREBASE ID TOKEN
            // =========================================

            debugLog(
                "STEP 3 - REQUESTING FRESH FIREBASE ID TOKEN",
                {
                    uid: user.uid,
                    email: user.email
                }
            );

            const idToken =
                await user.getIdToken(true);


            debugLog(
                "STEP 3 TOKEN RESULT",
                {
                    tokenReceived: Boolean(idToken),
                    tokenLength:
                        idToken
                            ? idToken.length
                            : 0
                }
            );


            if (!idToken) {
                throw new Error(
                    "Authentication token was not received."
                );
            }


            // =========================================
            // 4. AUTHENTICATE WITH NOVAPAY BACKEND
            // =========================================

            const protectedURL =
                `${BACKEND_URL}/api/protected`;

            debugLog(
                "STEP 4 - CALLING NOVAPAY BACKEND",
                {
                    method: "GET",
                    url: protectedURL,
                    pageOrigin: window.location.origin,
                    pageProtocol: window.location.protocol,
                    authorizationHeaderPresent: true,
                    tokenLength: idToken.length
                }
            );


            let response;

            try {

                response =
                    await fetch(
                        protectedURL,
                        {
                            method: "GET",

                            headers: {
                                "Authorization": `Bearer ${idToken}`,
                                "Accept": "application/json"
                            },

                            cache: "no-store"
                        }
                    );

            } catch (fetchError) {

                debugLog(
                    "STEP 4 FAILED - BACKEND FETCH ERROR",
                    {
                        errorName:
                            fetchError?.name,
                        errorCode:
                            fetchError?.code,
                        errorMessage:
                            fetchError?.message,
                        pageOrigin:
                            window.location.origin,
                        backendURL:
                            protectedURL,
                        likelyCause:
                            "Possible CORS error, network error, blocked request, HTTPS/origin issue, DNS issue, or backend unavailable."
                    }
                );

                throw new Error(
                    `Backend request could not be completed.\n\n` +
                    `Error: ${fetchError?.message || "Failed to fetch"}\n\n` +
                    `Frontend origin: ${window.location.origin}\n` +
                    `Backend URL: ${protectedURL}\n\n` +
                    `Check the browser console for the complete diagnostic details.`
                );
            }


            debugLog(
                "STEP 4 RESPONSE RECEIVED",
                {
                    status: response.status,
                    statusText: response.statusText,
                    ok: response.ok,
                    url: response.url,
                    redirected: response.redirected,
                    type: response.type
                }
            );


            // =========================================
            // 5. READ BACKEND RESPONSE
            // =========================================

            debugLog(
                "STEP 5 - READING BACKEND RESPONSE"
            );

            const data =
                await readBackendResponse(response);


            debugLog(
                "STEP 5 COMPLETE",
                {
                    status: response.status,
                    ok: response.ok,
                    data
                }
            );


            // =========================================
            // 6. VERIFY BACKEND AUTHENTICATION
            // =========================================

            if (!response.ok || !data?.success) {

                console.error(
                    "NovaPay backend authentication failed.",
                    {
                        status: response.status,
                        statusText: response.statusText,
                        success: data?.success === true,
                        responseData: data,
                        backendURL:
                            `${BACKEND_URL}/api/protected`,
                        frontendOrigin:
                            window.location.origin
                    }
                );


                const backendMessage =
                    getBackendErrorMessage(
                        data,
                        response
                    );


                throw new Error(
                    `Backend authentication failed.\n\n` +
                    `HTTP status: ${response.status} ${response.statusText}\n` +
                    `Backend message: ${backendMessage}\n` +
                    `Response success: ${data?.success === true}\n\n` +
                    `See the browser console for the complete backend response.`
                );
            }


            // =========================================
            // 7. LOGIN SUCCESSFUL
            // =========================================

            console.log(
                "NovaPay login and backend authentication successful."
            );


            debugLog(
                "STEP 7 SUCCESS - COMPLETE LOGIN SUCCESS",
                {
                    firebaseUser:
                        user?.email || null,
                    backendStatus:
                        response.status,
                    backendSuccess:
                        data?.success === true
                }
            );


            // =========================================
            // 8. GO TO DASHBOARD
            // =========================================

            debugLog(
                "STEP 8 - REDIRECTING TO DASHBOARD",
                {
                    destination: "dashboard.html"
                }
            );

            window.location.replace(
                "dashboard.html"
            );

        } catch (error) {

            console.error(
                "NovaPay login error:",
                error
            );


            debugLog(
                "LOGIN FAILED",
                {
                    errorName:
                        error?.name,
                    errorCode:
                        error?.code,
                    errorMessage:
                        error?.message,
                    pageURL:
                        window.location.href,
                    pageOrigin:
                        window.location.origin,
                    backendURL:
                        BACKEND_URL,
                    firebaseCurrentUser:
                        auth.currentUser
                            ? {
                                uid: auth.currentUser.uid,
                                email: auth.currentUser.email
                            }
                            : null
                }
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

                showDebugFailure(
                    firebaseError.title,
                    error,
                    `User-friendly message: ${firebaseError.message}`
                );

            } else {

                // =====================================
                // BACKEND / UNKNOWN ERROR
                // =====================================

                showDebugFailure(
                    "Login Failed - Diagnostic Details",
                    error
                );
            }

        } finally {

            loginInProgress = false;

            setLoginButtonLoading(false);

            debugLog(
                "LOGIN PROCESS FINISHED",
                {
                    loginInProgress,
                    buttonRestored: true
                }
            );
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


// =====================================================
// INITIAL DEBUG INFORMATION
// =====================================================

debugLog(
    "LOGIN.JS LOADED",
    {
        formFound: Boolean(form),
        emailInputFound: Boolean(emailInput),
        passwordInputFound: Boolean(passwordInput),
        rememberMeInputFound: Boolean(rememberMeInput),
        loginButtonFound: Boolean(loginButton),
        forgotPasswordFound: Boolean(forgotPassword),
        customModalFound: Boolean(customModal),
        modalTitleFound: Boolean(modalTitle),
        modalMessageFound: Boolean(modalMessage),
        modalButtonFound: Boolean(modalButton),
        pageURL: window.location.href,
        pageOrigin: window.location.origin,
        pageProtocol: window.location.protocol,
        backendURL: BACKEND_URL,
        firebaseCurrentUser:
            auth.currentUser
                ? {
                    uid: auth.currentUser.uid,
                    email: auth.currentUser.email
                }
                : null
    }
);