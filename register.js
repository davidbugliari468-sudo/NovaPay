console.log("NovaPay register.js loaded");


/* =========================================================
   FIREBASE
========================================================= */

import {
    auth,
    db,
    doc,
    setDoc,
    serverTimestamp
} from "./firebase.js";

import {
    createUserWithEmailAndPassword,
    sendEmailVerification,
    signOut
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";


/* =========================================================
   BACKEND
========================================================= */

const BACKEND_URL =
    "https://novapay-server.onrender.com";


/* =========================================================
   CONSTANTS
========================================================= */

const MIN_PASSWORD_LENGTH = 8;

const MAX_NICKNAME_LENGTH = 30;

const MAX_NAME_LENGTH = 50;

const MAX_EMAIL_LENGTH = 254;

const MAX_PHONE_LENGTH = 20;


/* =========================================================
   DOM
========================================================= */

const form =
    document.getElementById(
        "registrationForm"
    );

const registerBtn =
    document.getElementById(
        "registerBtn"
    );

const continueBtn =
    document.getElementById(
        "continueBtn"
    );

const loginLink =
    document.getElementById(
        "loginLink"
    );


/* =========================================================
   MESSAGES
========================================================= */

const errorMessage =
    document.getElementById(
        "errorMessage"
    );

const successMessage =
    document.getElementById(
        "successMessage"
    );

const registrationStatus =
    document.getElementById(
        "registrationStatus"
    );


/* =========================================================
   SUCCESS SCREEN
========================================================= */

const successScreen =
    document.getElementById(
        "successScreen"
    );

const successNickname =
    document.getElementById(
        "successNickname"
    );

const verificationStatus =
    document.getElementById(
        "verificationStatus"
    );


/* =========================================================
   INPUTS
========================================================= */

const nicknameInput =
    document.getElementById(
        "nickname"
    );

const firstNameInput =
    document.getElementById(
        "firstName"
    );

const middleNameInput =
    document.getElementById(
        "middleName"
    );

const surnameInput =
    document.getElementById(
        "surname"
    );

const emailInput =
    document.getElementById(
        "email"
    );

const phoneInput =
    document.getElementById(
        "phone"
    );

const passwordInput =
    document.getElementById(
        "password"
    );

const confirmPasswordInput =
    document.getElementById(
        "confirmPassword"
    );

const termsInput =
    document.getElementById(
        "terms"
    );


/* =========================================================
   PASSWORD UI
========================================================= */

const passwordStrength =
    document.getElementById(
        "passwordStrength"
    );

const confirmPasswordMessage =
    document.getElementById(
        "confirmPasswordMessage"
    );

const requirementLength =
    document.getElementById(
        "requirementLength"
    );

const requirementUppercase =
    document.getElementById(
        "requirementUppercase"
    );

const requirementLowercase =
    document.getElementById(
        "requirementLowercase"
    );

const requirementNumber =
    document.getElementById(
        "requirementNumber"
    );

const requirementSpecial =
    document.getElementById(
        "requirementSpecial"
    );


/* =========================================================
   STATE
========================================================= */

let registrationInProgress =
    false;


/* =========================================================
   BASIC CLEANING
========================================================= */

function cleanText(
    value,
    maxLength
) {

    return String(
        value || ""
    )
        .trim()
        .replace(/\s+/g, " ")
        .slice(
            0,
            maxLength
        );
}


function cleanEmail(
    value
) {

    return String(
        value || ""
    )
        .trim()
        .toLowerCase()
        .slice(
            0,
            MAX_EMAIL_LENGTH
        );
}


function cleanPhone(
    value
) {

    return String(
        value || ""
    )
        .trim()
        .replace(
            /[^\d+]/g,
            ""
        )
        .slice(
            0,
            MAX_PHONE_LENGTH
        );
}


/* =========================================================
   ERROR UI
========================================================= */

function showError(
    message
) {

    if (!errorMessage) {
        return;
    }


    errorMessage.textContent =
        message;


    errorMessage.hidden =
        false;


    if (successMessage) {

        successMessage.textContent =
            "";

        successMessage.hidden =
            true;
    }
}


function hideError() {

    if (!errorMessage) {
        return;
    }


    errorMessage.textContent =
        "";

    errorMessage.hidden =
        true;
}


/* =========================================================
   SUCCESS UI
========================================================= */

function showSuccess(
    message
) {

    if (!successMessage) {
        return;
    }


    successMessage.textContent =
        message;


    successMessage.hidden =
        false;


    if (errorMessage) {

        errorMessage.textContent =
            "";

        errorMessage.hidden =
            true;
    }
}


function hideSuccess() {

    if (!successMessage) {
        return;
    }


    successMessage.textContent =
        "";

    successMessage.hidden =
        true;
}


/* =========================================================
   STATUS UI
========================================================= */

function setStatus(
    message
) {

    if (!registrationStatus) {
        return;
    }


    registrationStatus.textContent =
        message;


    registrationStatus.hidden =
        !message;
}


/* =========================================================
   LOADING STATE
========================================================= */

function setLoading(
    loading
) {

    registrationInProgress =
        loading;


    if (!registerBtn) {
        return;
    }


    registerBtn.disabled =
        loading;


    registerBtn.textContent =
        loading
            ? "Creating Account..."
            : "Create Account";
}


/* =========================================================
   PASSWORD REQUIREMENTS
========================================================= */

function getPasswordRequirements(
    password
) {

    return {

        length:
            password.length >=
            MIN_PASSWORD_LENGTH,

        uppercase:
            /[A-Z]/.test(
                password
            ),

        lowercase:
            /[a-z]/.test(
                password
            ),

        number:
            /[0-9]/.test(
                password
            ),

        special:
            /[^A-Za-z0-9]/.test(
                password
            )
    };
}


/* =========================================================
   UPDATE PASSWORD REQUIREMENTS
========================================================= */

function updatePasswordRequirements() {

    const password =
        passwordInput?.value || "";


    const requirements =
        getPasswordRequirements(
            password
        );


    if (requirementLength) {

        requirementLength.classList.toggle(
            "valid",
            requirements.length
        );
    }


    if (requirementUppercase) {

        requirementUppercase.classList.toggle(
            "valid",
            requirements.uppercase
        );
    }


    if (requirementLowercase) {

        requirementLowercase.classList.toggle(
            "valid",
            requirements.lowercase
        );
    }


    if (requirementNumber) {

        requirementNumber.classList.toggle(
            "valid",
            requirements.number
        );
    }


    if (requirementSpecial) {

        requirementSpecial.classList.toggle(
            "valid",
            requirements.special
        );
    }


    if (!passwordStrength) {
        return;
    }


    if (!password) {

        passwordStrength.textContent =
            "";

        return;
    }


    const score =
        Object.values(
            requirements
        )
        .filter(Boolean)
        .length;


    if (score === 5) {

        passwordStrength.textContent =
            "Strong password.";

        passwordStrength.style.color =
            "#16a34a";

    } else if (score >= 3) {

        passwordStrength.textContent =
            "Password is almost ready.";

        passwordStrength.style.color =
            "#ca8a04";

    } else {

        passwordStrength.textContent =
            "Password needs more requirements.";

        passwordStrength.style.color =
            "#dc2626";
    }
}


/* =========================================================
   PASSWORD MATCH
========================================================= */

function updatePasswordMatch() {

    if (
        !passwordInput ||
        !confirmPasswordInput ||
        !confirmPasswordMessage
    ) {
        return;
    }


    const password =
        passwordInput.value;


    const confirmPassword =
        confirmPasswordInput.value;


    if (!confirmPassword) {

        confirmPasswordMessage.textContent =
            "";

        confirmPasswordMessage.className =
            "field-message";

        return;
    }


    if (
        password ===
        confirmPassword
    ) {

        confirmPasswordMessage.textContent =
            "Passwords match.";

        confirmPasswordMessage.className =
            "field-message valid";

    } else {

        confirmPasswordMessage.textContent =
            "Passwords do not match.";

        confirmPasswordMessage.className =
            "field-message invalid";
    }
}


/* =========================================================
   PASSWORD SHOW / HIDE
========================================================= */

function setupPasswordToggles() {

    const buttons =
        document.querySelectorAll(
            ".np-show-password"
        );


    buttons.forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    const targetId =
                        button.dataset.target;


                    const input =
                        document.getElementById(
                            targetId
                        );


                    if (!input) {
                        return;
                    }


                    const showing =
                        input.type ===
                        "text";


                    input.type =
                        showing
                            ? "password"
                            : "text";


                    button.textContent =
                        showing
                            ? "Show"
                            : "Hide";


                    button.setAttribute(
                        "aria-label",
                        showing
                            ? "Show password"
                            : "Hide password"
                    );
                }
            );
        }
    );
}


/* =========================================================
   FORM DATA
========================================================= */

function getFormData() {

    return {

        nickname:
            cleanText(
                nicknameInput?.value,
                MAX_NICKNAME_LENGTH
            ),

        firstName:
            cleanText(
                firstNameInput?.value,
                MAX_NAME_LENGTH
            ),

        middleName:
            cleanText(
                middleNameInput?.value,
                MAX_NAME_LENGTH
            ),

        surname:
            cleanText(
                surnameInput?.value,
                MAX_NAME_LENGTH
            ),

        email:
            cleanEmail(
                emailInput?.value
            ),

        phone:
            cleanPhone(
                phoneInput?.value
            ),

        password:
            passwordInput?.value ||
            "",

        confirmPassword:
            confirmPasswordInput?.value ||
            "",

        termsAccepted:
            Boolean(
                termsInput?.checked
            )
    };
}


/* =========================================================
   FORM VALIDATION
========================================================= */

function validateForm(
    data
) {

    if (!data.nickname) {

        return "Please enter your nickname.";
    }


    if (!data.firstName) {

        return "Please enter your first name.";
    }


    if (!data.surname) {

        return "Please enter your surname.";
    }


    if (!data.email) {

        return "Please enter your email address.";
    }


    if (
        data.email.length >
        MAX_EMAIL_LENGTH
    ) {

        return "Your email address is too long.";
    }


    const emailPattern =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


    if (
        !emailPattern.test(
            data.email
        )
    ) {

        return "Please enter a valid email address.";
    }


    if (!data.phone) {

        return "Please enter your phone number.";
    }


    const phoneDigits =
        data.phone.replace(
            /\D/g,
            ""
        );


    if (
        phoneDigits.length < 7 ||
        phoneDigits.length > 15
    ) {

        return "Please enter a valid phone number.";
    }


    if (!data.password) {

        return "Please create a password.";
    }


    const requirements =
        getPasswordRequirements(
            data.password
        );


    if (
        !requirements.length ||
        !requirements.uppercase ||
        !requirements.lowercase ||
        !requirements.number ||
        !requirements.special
    ) {

        return (
            "Your password must contain at least 8 characters, " +
            "including uppercase, lowercase, a number and a special character."
        );
    }


    if (
        data.password !==
        data.confirmPassword
    ) {

        return "Your passwords do not match.";
    }


    if (!data.termsAccepted) {

        return (
            "Please accept the Terms & Conditions and Privacy Policy."
        );
    }


    return null;
}


/* =========================================================
   FIRESTORE USER PROFILE
========================================================= */

async function createUserDocument(
    user,
    data
) {

    if (!user?.uid) {

        throw new Error(
            "Authenticated user identity is unavailable."
        );
    }


    const userReference =
        doc(
            db,
            "users",
            user.uid
        );


    /*
       IMPORTANT:

       Password is NEVER stored here.
    */

    await setDoc(
        userReference,
        {

            nickname:
                data.nickname,

            firstName:
                data.firstName,

            middleName:
                data.middleName,

            surname:
                data.surname,

            email:
                data.email,

            phone:
                data.phone,

            accountStatus:
                "pending_verification",

            emailVerified:
                false,

            createdAt:
                serverTimestamp()
        }
    );
}


/* =========================================================
   CLAIM PHONE THROUGH RENDER
========================================================= */

async function claimPhoneOnBackend(
    firebaseUser,
    data
) {

    if (!firebaseUser) {

        throw new Error(
            "Authenticated user is unavailable."
        );
    }


    /*
       Get a fresh Firebase ID token.

       Render verifies this token.
    */

    const idToken =
        await firebaseUser.getIdToken(
            true
        );


    const response =
        await fetch(
            `${BACKEND_URL}/api/registration/claim-phone`,
            {
                method: "POST",

                headers: {

                    "Content-Type":
                        "application/json",

                    "Authorization":
                        `Bearer ${idToken}`,

                    "Accept":
                        "application/json"
                },

                body:
                    JSON.stringify({

                        phone:
                            data.phone,

                        nickname:
                            data.nickname,

                        firstName:
                            data.firstName,

                        middleName:
                            data.middleName,

                        surname:
                            data.surname
                    })
            }
        );


    let result =
        null;


    try {

        result =
            await response.json();

    } catch {

        result =
            null;
    }


    if (
        response.status ===
        409
    ) {

        throw new Error(
            "PHONE_ALREADY_REGISTERED"
        );
    }


    if (!response.ok) {

        throw new Error(
            result?.error ||
            "The server could not complete registration."
        );
    }


    if (
        result?.success ===
        false
    ) {

        throw new Error(
            result.error ||
            "The server rejected the registration."
        );
    }


    return result;
}


/* =========================================================
   FIREBASE ERROR MESSAGES
========================================================= */

function getFriendlyFirebaseError(
    error
) {

    switch (
        error?.code
    ) {

        case "auth/email-already-in-use":

            return (
                "An account already exists with this email address."
            );


        case "auth/invalid-email":

            return (
                "Please enter a valid email address."
            );


        case "auth/weak-password":

            return (
                "Your password does not meet NovaPay's security requirements."
            );


        case "auth/operation-not-allowed":

            return (
                "Email/password registration is currently unavailable."
            );


        case "auth/network-request-failed":

            return (
                "Network error. Please check your internet connection and try again."
            );


        case "auth/too-many-requests":

            return (
                "Too many attempts. Please wait a little and try again."
            );


        case "auth/user-disabled":

            return (
                "This account has been disabled."
            );


        case "permission-denied":

        case "firestore/permission-denied":

            return (
                "Your account could not be completed because access was denied."
            );


        default:

            return (
                "Registration could not be completed. Please try again."
            );
    }
}


/* =========================================================
   CREATE NOVAPAY ACCOUNT
========================================================= */

async function createNovaPayAccount(
    data
) {

    if (registrationInProgress) {
        return;
    }


    setLoading(true);

    hideError();

    hideSuccess();

    setStatus(
        "Creating your secure account..."
    );


    let firebaseUser =
        null;


    try {

        /* =================================================
           1. CREATE FIREBASE AUTH ACCOUNT
        ================================================= */

        const credential =
            await createUserWithEmailAndPassword(
                auth,
                data.email,
                data.password
            );


        firebaseUser =
            credential.user;


        /* =================================================
           2. CLAIM PHONE THROUGH RENDER
        ================================================= */

        setStatus(
            "Checking your phone number..."
        );


        await claimPhoneOnBackend(
            firebaseUser,
            data
        );


        /* =================================================
           3. CREATE FIRESTORE PROFILE
        ================================================= */

        setStatus(
            "Creating your NovaPay profile..."
        );


        await createUserDocument(
            firebaseUser,
            data
        );


        /* =================================================
           4. SEND EMAIL VERIFICATION
        ================================================= */

        setStatus(
            "Sending your verification email..."
        );


        await sendEmailVerification(
            firebaseUser
        );


        /* =================================================
           5. CLEAR PASSWORDS
        ================================================= */

        if (passwordInput) {

            passwordInput.value =
                "";
        }


        if (confirmPasswordInput) {

            confirmPasswordInput.value =
                "";
        }


        /* =================================================
           6. SIGN OUT
        ================================================= */

        await signOut(
            auth
        );


        /* =================================================
           7. SUCCESS SCREEN
        ================================================= */

        if (successNickname) {

            successNickname.textContent =
                data.nickname;
        }


        if (verificationStatus) {

            verificationStatus.textContent =
                `A verification link has been sent to ${data.email}. Please check your inbox or Spam/Junk folder and verify your email before logging in.`;
        }


        if (form) {

            form.hidden =
                true;
        }


        if (successScreen) {

            successScreen.hidden =
                false;
        }


        if (loginLink) {

            loginLink.hidden =
                true;
        }


        showSuccess(
            "Your NovaPay account has been created. Please verify your email before logging in."
        );


        setStatus(
            ""
        );

    } catch (error) {

        console.error(
            "NovaPay registration failed:",
            error
        );


        /*
           Duplicate phone.
        */

        if (
            error?.message ===
            "PHONE_ALREADY_REGISTERED"
        ) {

            showError(
                "This phone number is already registered. Please use another phone number."
            );

        } else {

            showError(
                getFriendlyFirebaseError(
                    error
                )
            );
        }


        /*
           Make sure the Firebase session is not
           left active after a failed registration.
        */

        if (firebaseUser) {

            try {

                await signOut(
                    auth
                );

            } catch (
                cleanupError
            ) {

                console.error(
                    "Registration cleanup failed:",
                    cleanupError
                );
            }
        }


        setStatus(
            ""
        );

    } finally {

        setLoading(
            false
        );
    }
}


/* =========================================================
   FORM SUBMISSION
========================================================= */

if (form) {

    form.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            hideError();

            hideSuccess();


            const data =
                getFormData();


            const validationError =
                validateForm(
                    data
                );


            if (validationError) {

                showError(
                    validationError
                );

                return;
            }


            await createNovaPayAccount(
                data
            );
        }
    );
}


/* =========================================================
   PASSWORD EVENTS
========================================================= */

if (passwordInput) {

    passwordInput.addEventListener(
        "input",
        () => {

            updatePasswordRequirements();

            updatePasswordMatch();

            hideError();
        }
    );
}


if (confirmPasswordInput) {

    confirmPasswordInput.addEventListener(
        "input",
        () => {

            updatePasswordMatch();

            hideError();
        }
    );
}


/* =========================================================
   NORMAL INPUT EVENTS
========================================================= */

[
    nicknameInput,
    firstNameInput,
    middleNameInput,
    surnameInput,
    emailInput,
    phoneInput
]
    .filter(Boolean)
    .forEach(
        input => {

            input.addEventListener(
                "input",
                () => {

                    hideError();
                }
            );
        }
    );


/* =========================================================
   CONTINUE TO LOGIN
========================================================= */

if (continueBtn) {

    continueBtn.addEventListener(
        "click",
        () => {

            window.location.href =
                "login.html";
        }
    );
}


/* =========================================================
   INITIALIZE
========================================================= */

setupPasswordToggles();

updatePasswordRequirements();

updatePasswordMatch();


console.log(
    "NovaPay registration initialized successfully."
);