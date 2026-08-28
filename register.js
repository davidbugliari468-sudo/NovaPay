
/* =========================================================
   NOVAPAY — REGISTRATION
=========================================================

   FLOW

   STEP 1
   Nickname + First Name
        ↓
   STEP 2
   Surname + Middle Name
        ↓
   STEP 3
   Email + Phone
        ↓
   ACCOUNT SECURITY
   Password + Terms
        ↓
   Firebase Authentication
        ↓
   Render phone verification
        ↓
   Firestore profile
        ↓
   Email verification
        ↓
   Success

========================================================= */


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
   DOM — FORM
========================================================= */

const form =
    document.getElementById("registrationForm");


/* =========================================================
   STEPS
========================================================= */

const step1 =
    document.getElementById("step1");

const step2 =
    document.getElementById("step2");

const step3 =
    document.getElementById("step3");

const accountSecurity =
    document.getElementById("accountSecurity");


/* =========================================================
   NAVIGATION BUTTONS
========================================================= */

const nextStepBtn =
    document.getElementById("nextStepBtn");

const nextStep2Btn =
    document.getElementById("nextStep2Btn");

const nextStep3Btn =
    document.getElementById("nextStep3Btn");

const backStep2Btn =
    document.getElementById("backStep2Btn");

const backStep3Btn =
    document.getElementById("backStep3Btn");

const backToStep3Btn =
    document.getElementById("backToStep3Btn");


/* =========================================================
   REGISTRATION BUTTON
========================================================= */

const registerBtn =
    document.getElementById("registerBtn");

const continueBtn =
    document.getElementById("continueBtn");


/* =========================================================
   UI
========================================================= */

const successScreen =
    document.getElementById("successScreen");

const loginLink =
    document.getElementById("loginLink");

const registerProgress =
    document.getElementById("registerProgress");

const registerTitle =
    document.getElementById("registerTitle");

const registerDescription =
    document.getElementById("registerDescription");

const errorMessage =
    document.getElementById("errorMessage");

const successMessage =
    document.getElementById("successMessage");

const registrationStatus =
    document.getElementById("registrationStatus");

const successNickname =
    document.getElementById("successNickname");

const verificationStatus =
    document.getElementById("verificationStatus");


/* =========================================================
   INPUTS
========================================================= */

const nicknameInput =
    document.getElementById("nickname");

const firstNameInput =
    document.getElementById("firstName");

const middleNameInput =
    document.getElementById("middleName");

const surnameInput =
    document.getElementById("surname");

const emailInput =
    document.getElementById("email");

const phoneInput =
    document.getElementById("phone");

const passwordInput =
    document.getElementById("password");

const confirmPasswordInput =
    document.getElementById("confirmPassword");

const termsInput =
    document.getElementById("terms");


/* =========================================================
   PASSWORD UI
========================================================= */

const passwordStrength =
    document.getElementById("passwordStrength");

const confirmPasswordMessage =
    document.getElementById("confirmPasswordMessage");

const requirementLength =
    document.getElementById("requirementLength");

const requirementUppercase =
    document.getElementById("requirementUppercase");

const requirementLowercase =
    document.getElementById("requirementLowercase");

const requirementNumber =
    document.getElementById("requirementNumber");

const requirementSpecial =
    document.getElementById("requirementSpecial");


/* =========================================================
   CONSTANTS
========================================================= */

const MIN_PASSWORD_LENGTH = 8;

const MAX_NICKNAME_LENGTH = 30;
const MAX_NAME_LENGTH = 50;
const MAX_EMAIL_LENGTH = 254;
const MAX_PHONE_LENGTH = 20;


/* =========================================================
   STATE
========================================================= */

let currentStep = 1;

let registrationInProgress = false;

let registrationProfile = null;


/* =========================================================
   PROFILE STEPS
========================================================= */

const profileSteps = [
    step1,
    step2,
    step3
].filter(Boolean);


/* =========================================================
   TEXT CLEANING
========================================================= */

function cleanText(value, maxLength) {

    return String(value || "")
        .trim()
        .replace(/\s+/g, " ")
        .slice(0, maxLength);
}


/* =========================================================
   EMAIL NORMALIZATION
========================================================= */

function normalizeEmail(value) {

    return String(value || "")
        .trim()
        .toLowerCase();
}


/* =========================================================
   PHONE NORMALIZATION
========================================================= */

function normalizePhone(value) {

    return String(value || "")
        .trim()
        .replace(/[^\d+]/g, "")
        .slice(0, MAX_PHONE_LENGTH);
}


/* =========================================================
   EMAIL VALIDATION
========================================================= */

function validEmail(email) {

    if (!email) {
        return false;
    }

    if (email.length > MAX_EMAIL_LENGTH) {
        return false;
    }

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}


/* =========================================================
   PASSWORD VALIDATION
========================================================= */

function passwordIsValid(password) {

    return (
        password.length >= MIN_PASSWORD_LENGTH &&
        /[A-Z]/.test(password) &&
        /[a-z]/.test(password) &&
        /[0-9]/.test(password) &&
        /[^A-Za-z0-9]/.test(password)
    );
}


/* =========================================================
   ERROR MESSAGE
========================================================= */

function showError(message) {

    if (!errorMessage) {
        return;
    }

    errorMessage.textContent = message;

    errorMessage.hidden = false;

    errorMessage.style.display = "block";
}


function clearError() {

    if (!errorMessage) {
        return;
    }

    errorMessage.textContent = "";

    errorMessage.hidden = true;

    errorMessage.style.display = "none";
}


/* =========================================================
   SUCCESS MESSAGE
========================================================= */

function showSuccess(message) {

    if (!successMessage) {
        return;
    }

    successMessage.textContent = message;

    successMessage.hidden = false;

    successMessage.style.display = "block";
}


/* =========================================================
   REGISTRATION STATUS
========================================================= */

function setStatus(message) {

    if (!registrationStatus) {
        return;
    }

    registrationStatus.textContent = message;

    registrationStatus.hidden = !message;
}


/* =========================================================
   PROCESSING STATE
========================================================= */

function setProcessing(processing) {

    registrationInProgress =
        processing;

    if (registerBtn) {

        registerBtn.disabled =
            processing;

        registerBtn.setAttribute(
            "aria-busy",
            processing
                ? "true"
                : "false"
        );

        registerBtn.textContent =
            processing
                ? "Creating Account..."
                : "Create Account";
    }

    [
        nextStepBtn,
        nextStep2Btn,
        nextStep3Btn,
        backStep2Btn,
        backStep3Btn,
        backToStep3Btn
    ].forEach(button => {

        if (button) {
            button.disabled =
                processing;
        }
    });
}


/* =========================================================
   PROGRESS
========================================================= */

function updateProgress() {

    if (!registerProgress) {
        return;
    }

    registerProgress.textContent =
        `Step ${currentStep} of 3`;
}


/* =========================================================
   HIDE ALL PROFILE STEPS
========================================================= */

function hideAllProfileSteps() {

    profileSteps.forEach(step => {

        step.hidden = true;

    });
}


/* =========================================================
   SHOW PROFILE STEP
========================================================= */

function showProfileStep(stepNumber) {

    if (
        stepNumber < 1 ||
        stepNumber > 3
    ) {
        return;
    }

    currentStep =
        stepNumber;

    hideAllProfileSteps();

    const selectedStep =
        profileSteps[
            stepNumber - 1
        ];

    if (selectedStep) {

        selectedStep.hidden =
            false;
    }

    updateProgress();

    clearError();

    if (registerTitle) {

        registerTitle.textContent =
            "Get your NovaPay account free";
    }

    if (registerDescription) {

        registerDescription.textContent =
            "Create your account securely.";
    }

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


/* =========================================================
   SHOW ACCOUNT SECURITY
========================================================= */

function showAccountSecurity() {

    hideAllProfileSteps();

    if (accountSecurity) {

        accountSecurity.hidden =
            false;
    }

    currentStep =
        3;

    updateProgress();

    clearError();

    if (registerTitle) {

        registerTitle.textContent =
            "Secure your account";
    }

    if (registerDescription) {

        registerDescription.textContent =
            "Choose a strong password to protect your account.";
    }

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


/* =========================================================
   STEP 1 VALIDATION
========================================================= */

function validateStep1() {

    clearError();

    const nickname =
        cleanText(
            nicknameInput?.value,
            MAX_NICKNAME_LENGTH
        );

    const firstName =
        cleanText(
            firstNameInput?.value,
            MAX_NAME_LENGTH
        );


    if (!nickname) {

        showError(
            "Please enter your nickname."
        );

        nicknameInput?.focus();

        return false;
    }


    if (!firstName) {

        showError(
            "Please enter your first name."
        );

        firstNameInput?.focus();

        return false;
    }


    return true;
}


/* =========================================================
   STEP 2 VALIDATION
========================================================= */

function validateStep2() {

    clearError();

    const surname =
        cleanText(
            surnameInput?.value,
            MAX_NAME_LENGTH
        );


    if (!surname) {

        showError(
            "Please enter your surname."
        );

        surnameInput?.focus();

        return false;
    }


    return true;
}


/* =========================================================
   STEP 3 VALIDATION
========================================================= */

function validateStep3() {

    clearError();

    const email =
        normalizeEmail(
            emailInput?.value
        );

    const phone =
        normalizePhone(
            phoneInput?.value
        );


    if (!validEmail(email)) {

        showError(
            "Please enter a valid email address."
        );

        emailInput?.focus();

        return false;
    }


    if (!phone) {

        showError(
            "Please enter your phone number."
        );

        phoneInput?.focus();

        return false;
    }


    registrationProfile = {

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

        email,

        phone
    };


    return true;
}


/* =========================================================
   SECURITY VALIDATION
========================================================= */

function validateSecurityStep() {

    clearError();

    const password =
        passwordInput?.value || "";

    const confirmPassword =
        confirmPasswordInput?.value || "";


    if (!passwordIsValid(password)) {

        showError(
            "Your password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character."
        );

        passwordInput?.focus();

        return false;
    }


    if (
        password !==
        confirmPassword
    ) {

        showError(
            "Your passwords do not match."
        );

        confirmPasswordInput?.focus();

        return false;
    }


    if (
        termsInput &&
        !termsInput.checked
    ) {

        showError(
            "Please accept the Terms & Conditions and Privacy Policy."
        );

        termsInput.focus();

        return false;
    }


    return true;
}


/* =========================================================
   PASSWORD REQUIREMENTS
========================================================= */

function updatePasswordRequirements() {

    const password =
        passwordInput?.value || "";


    const hasLength =
        password.length >=
        MIN_PASSWORD_LENGTH;

    const hasUppercase =
        /[A-Z]/.test(password);

    const hasLowercase =
        /[a-z]/.test(password);

    const hasNumber =
        /[0-9]/.test(password);

    const hasSpecial =
        /[^A-Za-z0-9]/.test(password);


    const updateRequirement =
        (element, valid) => {

            if (!element) {
                return;
            }

            element.classList.toggle(
                "valid",
                valid
            );

            element.classList.toggle(
                "invalid",
                !valid
            );

            element.setAttribute(
                "aria-checked",
                valid
                    ? "true"
                    : "false"
            );
        };


    updateRequirement(
        requirementLength,
        hasLength
    );

    updateRequirement(
        requirementUppercase,
        hasUppercase
    );

    updateRequirement(
        requirementLowercase,
        hasLowercase
    );

    updateRequirement(
        requirementNumber,
        hasNumber
    );

    updateRequirement(
        requirementSpecial,
        hasSpecial
    );


    if (passwordStrength) {

        if (!password) {

            passwordStrength.textContent =
                "Use at least 8 characters.";

        } else if (
            passwordIsValid(password)
        ) {

            passwordStrength.textContent =
                "Strong password.";

        } else {

            passwordStrength.textContent =
                "Password does not meet all requirements.";
        }
    }
}


/* =========================================================
   PASSWORD MATCH
========================================================= */

function updatePasswordMatch() {

    if (!confirmPasswordMessage) {
        return;
    }

    const password =
        passwordInput?.value || "";

    const confirmPassword =
        confirmPasswordInput?.value || "";


    if (!confirmPassword) {

        confirmPasswordMessage.textContent =
            "";

        confirmPasswordMessage.classList.remove(
            "valid",
            "invalid"
        );

        return;
    }


    if (
        password ===
        confirmPassword
    ) {

        confirmPasswordMessage.textContent =
            "Passwords match.";

        confirmPasswordMessage.classList.add(
            "valid"
        );

        confirmPasswordMessage.classList.remove(
            "invalid"
        );

    } else {

        confirmPasswordMessage.textContent =
            "Passwords do not match.";

        confirmPasswordMessage.classList.add(
            "invalid"
        );

        confirmPasswordMessage.classList.remove(
            "valid"
        );
    }
}


/* =========================================================
   FIREBASE ERROR MESSAGE
========================================================= */

function firebaseErrorMessage(error) {

    switch (error?.code) {

        case "auth/email-already-in-use":

            return "This email is already registered.";


        case "auth/invalid-email":

            return "Please enter a valid email address.";


        case "auth/weak-password":

            return "Your password does not meet NovaPay's security requirements.";


        case "auth/operation-not-allowed":

            return "Email registration is currently unavailable.";


        case "auth/network-request-failed":

            return "Network error. Please check your connection and try again.";


        case "auth/too-many-requests":

            return "Too many attempts. Please try again later.";


        case "auth/user-disabled":

            return "This account has been disabled.";


        default:

            return (
                error?.message ||
                "We could not create your account. Please try again."
            );
    }
}


/* =========================================================
   CREATE FIRESTORE USER DOCUMENT
========================================================= */

async function createUserDocument(user) {

    if (!user?.uid) {

        throw new Error(
            "Authenticated user identity is unavailable."
        );
    }


    if (!registrationProfile) {

        throw new Error(
            "Registration profile is unavailable."
        );
    }


    const userReference =
        doc(
            db,
            "users",
            user.uid
        );


    await setDoc(
        userReference,
        {

            nickname:
                registrationProfile.nickname,

            firstName:
                registrationProfile.firstName,

            middleName:
                registrationProfile.middleName,

            surname:
                registrationProfile.surname,

            email:
                registrationProfile.email,

            phone:
                registrationProfile.phone,

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
   CREATE NOVAPAY ACCOUNT
========================================================= */

async function createNovaPayAccount() {

    if (registrationInProgress) {
        return;
    }


    if (!validateSecurityStep()) {
        return;
    }


    if (!registrationProfile) {

        showError(
            "Please complete the registration steps first."
        );

        showProfileStep(1);

        return;
    }


    setProcessing(true);

    setStatus(
        "Creating your NovaPay account..."
    );


    let firebaseUser = null;


    try {

        /* =============================================
           1. CREATE FIREBASE ACCOUNT
        ============================================= */

        const credential =
            await createUserWithEmailAndPassword(
                auth,
                registrationProfile.email,
                passwordInput.value
            );

        firebaseUser =
            credential.user;


        /* =============================================
           2. GET FRESH FIREBASE TOKEN
        ============================================= */

        const idToken =
            await firebaseUser.getIdToken(true);


        if (!idToken) {

            throw new Error(
                "Authentication token was not received."
            );
        }


        /* =============================================
           3. CLAIM PHONE THROUGH RENDER
        ============================================= */

        setStatus(
            "Checking your phone number..."
        );


        const response =
            await fetch(
                `${BACKEND_URL}/api/registration/claim-phone`,
                {
                    method: "POST",

                    headers: {

                        "Authorization":
                            `Bearer ${idToken}`,

                        "Content-Type":
                            "application/json",

                        "Accept":
                            "application/json"
                    },

                    body: JSON.stringify({
                        phone:
                            registrationProfile.phone
                    }),

                    cache: "no-store"
                }
            );


        let data = null;


        try {

            data =
                await response.json();

        } catch {

            data = null;
        }


        /* =============================================
           4. CHECK PHONE CLAIM
        ============================================= */

        if (!response.ok) {

            if (
                response.status === 409 &&
                data?.error ===
                    "This phone number is already registered."
            ) {

                throw new Error(
                    "PHONE_ALREADY_REGISTERED"
                );
            }


            throw new Error(
                data?.error ||
                "We could not verify your phone number."
            );
        }


        if (
            data &&
            data.success === false
        ) {

            throw new Error(
                data.error ||
                "We could not verify your phone number."
            );
        }


        /* =============================================
           5. CREATE FIRESTORE PROFILE
        ============================================= */

        setStatus(
            "Creating your NovaPay profile..."
        );


        await createUserDocument(
            firebaseUser
        );


        /* =============================================
           6. SEND EMAIL VERIFICATION
        ============================================= */

        setStatus(
            "Sending your verification email..."
        );


        await sendEmailVerification(
            firebaseUser
        );


        /* =============================================
           7. CLEAR PASSWORDS
        ============================================= */

        if (passwordInput) {
            passwordInput.value = "";
        }

        if (confirmPasswordInput) {
            confirmPasswordInput.value = "";
        }


        /* =============================================
           8. SIGN OUT
        ============================================= */

        await signOut(auth);


        /* =============================================
           9. SHOW SUCCESS
        ============================================= */

        if (successNickname) {

            successNickname.textContent =
                registrationProfile.nickname;
        }


        if (verificationStatus) {

            verificationStatus.textContent =
                `A verification email has been sent to ${registrationProfile.email}. Please open your email and click the verification link before logging in.`;
        }


        if (form) {
            form.hidden = true;
        }


        if (successScreen) {
            successScreen.hidden = false;
        }


        if (loginLink) {
            loginLink.hidden = true;
        }


        showSuccess(
            "Your NovaPay account has been created successfully."
        );


        setStatus("");


    } catch (error) {

        console.error(
            "NovaPay registration failed:",
            error
        );


        /* =============================================
           DUPLICATE PHONE
        ============================================= */

        if (
            error?.message ===
            "PHONE_ALREADY_REGISTERED"
        ) {

            showError(
                "This phone number is already registered. Please use another phone number."
            );

        } else {

            showError(
                firebaseErrorMessage(error)
            );
        }


        /* =============================================
           CLEAN UP AUTH SESSION
        ============================================= */

        if (firebaseUser) {

            try {

                await signOut(auth);

            } catch (cleanupError) {

                console.error(
                    "Registration cleanup failed:",
                    cleanupError
                );
            }
        }


        setStatus("");


    } finally {

        setProcessing(false);
    }
}


/* =========================================================
   PASSWORD INPUT EVENTS
========================================================= */

passwordInput?.addEventListener(
    "input",
    () => {

        updatePasswordRequirements();

        updatePasswordMatch();
    }
);


confirmPasswordInput?.addEventListener(
    "input",
    updatePasswordMatch
);


/* =========================================================
   PASSWORD SHOW / HIDE
========================================================= */

document
    .querySelectorAll(".show-password")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const target =
                    document.getElementById(
                        button.dataset.target
                    );


                if (!target) {
                    return;
                }


                const hidden =
                    target.type === "password";


                target.type =
                    hidden
                        ? "text"
                        : "password";


                button.textContent =
                    hidden
                        ? "Hide"
                        : "Show";


                button.setAttribute(
                    "aria-label",
                    hidden
                        ? "Hide password"
                        : "Show password"
                );
            }
        );
    });


/* =========================================================
   STEP 1 → STEP 2
========================================================= */

nextStepBtn?.addEventListener(
    "click",
    event => {

        event.preventDefault();


        if (registrationInProgress) {
            return;
        }


        if (!validateStep1()) {
            return;
        }


        showProfileStep(2);
    }
);


/* =========================================================
   STEP 2 → STEP 3
========================================================= */

nextStep2Btn?.addEventListener(
    "click",
    event => {

        event.preventDefault();


        if (registrationInProgress) {
            return;
        }


        if (!validateStep2()) {
            return;
        }


        showProfileStep(3);
    }
);


/* =========================================================
   STEP 3 → ACCOUNT SECURITY
========================================================= */

nextStep3Btn?.addEventListener(
    "click",
    event => {

        event.preventDefault();


        if (registrationInProgress) {
            return;
        }


        if (!validateStep3()) {
            return;
        }


        showAccountSecurity();
    }
);


/* =========================================================
   STEP 2 → STEP 1
========================================================= */

backStep2Btn?.addEventListener(
    "click",
    event => {

        event.preventDefault();


        if (registrationInProgress) {
            return;
        }


        showProfileStep(1);
    }
);


/* =========================================================
   STEP 3 → STEP 2
========================================================= */

backStep3Btn?.addEventListener(
    "click",
    event => {

        event.preventDefault();


        if (registrationInProgress) {
            return;
        }


        showProfileStep(2);
    }
);


/* =========================================================
   SECURITY → STEP 3
========================================================= */

backToStep3Btn?.addEventListener(
    "click",
    event => {

        event.preventDefault();


        if (registrationInProgress) {
            return;
        }


        showProfileStep(3);
    }
);


/* =========================================================
   FORM SUBMIT
========================================================= */

form?.addEventListener(
    "submit",
    async event => {

        event.preventDefault();

        await createNovaPayAccount();
    }
);


/* =========================================================
   SUCCESS → LOGIN
========================================================= */

continueBtn?.addEventListener(
    "click",
    event => {

        event.preventDefault();

        window.location.href =
            "login.html";
    }
);


/* =========================================================
   INITIALIZE
========================================================= */

showProfileStep(1);

updatePasswordRequirements();

updatePasswordMatch();


console.log(
    "NovaPay registration initialized successfully."
);