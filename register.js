console.log("NovaPay register.js loaded");

/*
============================================================
 NOVAPAY — SECURE REGISTRATION
============================================================

 SECURITY MODEL

 - Firebase Authentication owns passwords.
 - Passwords are NEVER stored in Firestore.
 - Firebase UID is the users/{uid} document ID.
 - No client-created wallet balance.
 - No client-created admin privileges.
 - No client-created transaction status.
 - Server timestamps are used.
 - Email verification is required.
 - Registration button is locked while processing.
 - Firebase Auth is the authentication source of truth.
 - No localStorage authentication.
 - Firebase errors are converted to safe user messages.
============================================================
*/


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
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";


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
   REGISTRATION
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


/*
   IMPORTANT:

   These are the three profile steps.

   The password/security screen is kept separate
   from the three profile steps.

   Therefore the progress indicator remains:

       Step 1 of 3
       Step 2 of 3
       Step 3 of 3

   When Step 3 is completed, we show the
   existing account-security section.
*/

const profileSteps = [
    step1,
    step2,
    step3
].filter(Boolean);


/* =========================================================
   TEXT HELPERS
========================================================= */

function cleanText(value, maxLength) {

    return String(value || "")
        .trim()
        .replace(/\s+/g, " ")
        .slice(0, maxLength);
}


function normalizeEmail(value) {

    return String(value || "")
        .trim()
        .toLowerCase();
}


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
   STATUS
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

    registrationInProgress = processing;

    if (registerBtn) {

        registerBtn.disabled = processing;

        registerBtn.setAttribute(
            "aria-busy",
            processing ? "true" : "false"
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
            button.disabled = processing;
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
   PROFILE STEP DISPLAY
========================================================= */

function hideAllProfileSteps() {

    profileSteps.forEach(step => {

        if (step) {
            step.hidden = true;
        }

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

    currentStep = stepNumber;

    hideAllProfileSteps();

    const selectedStep =
        profileSteps[stepNumber - 1];

    if (selectedStep) {
        selectedStep.hidden = false;
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
        accountSecurity.hidden = false;
    }

    /*
       The profile section is complete.

       The progress indicator remains on
       Step 3 of 3 because this security screen
       belongs to the final registration stage.
    */

    currentStep = 3;

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

    const middleName =
        cleanText(
            middleNameInput?.value,
            MAX_NAME_LENGTH
        );


    if (!surname) {

        showError(
            "Please enter your surname."
        );

        surnameInput?.focus();

        return false;
    }


    /*
       Middle name is intentionally optional.
    */

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


    /*
       Save only normal profile information.

       Password is deliberately NOT stored here.
    */

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
   PASSWORD / SECURITY VALIDATION
========================================================= */

function validateSecurityStep() {

    clearError();

    const password =
        passwordInput?.value || "";

    const confirmPassword =
        confirmPasswordInput?.value || "";


    if (!passwordIsValid(password)) {

        showError(
            "Your password does not meet NovaPay's security requirements."
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
   FIREBASE ERROR HANDLING
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


        case "permission-denied":

        case "firestore/permission-denied":

            return "Your account could not be completed because access was denied.";


        default:

            return "We could not create your account. Please try again.";
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


    /*
       IMPORTANT:

       Firebase Authentication generates the UID.

       Firestore document:

           users/{Firebase UID}

       This must match the Firestore security rules.
    */

    const userReference =
        doc(
            db,
            "users",
            user.uid
        );


    /*
       MINIMUM PROFILE ONLY.

       NEVER store:

       - password
       - wallet balance
       - admin status
       - permissions
       - transaction status
       - payment status
    */

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

        /*
           PASSWORD GOES DIRECTLY TO
           FIREBASE AUTHENTICATION.

           It is NEVER written to Firestore.
        */

        const credential =
            await createUserWithEmailAndPassword(
                auth,
                registrationProfile.email,
                passwordInput.value
            );


        firebaseUser =
            credential.user;


        /*
           Firebase UID is used as the
           Firestore document ID.
        */

        await createUserDocument(
            firebaseUser
        );


        /*
           Send verification email.
        */

        await sendEmailVerification(
            firebaseUser
        );


        /*
           Remove password values from
           the page after successful creation.
        */

        if (passwordInput) {
            passwordInput.value = "";
        }

        if (confirmPasswordInput) {
            confirmPasswordInput.value = "";
        }


        /* =================================================
           SUCCESS SCREEN
        ================================================= */

        if (successNickname) {

            successNickname.textContent =
                registrationProfile.nickname;
        }


        if (verificationStatus) {

            verificationStatus.textContent =
                `A verification email has been sent to ${registrationProfile.email}. Please verify your email before using sensitive NovaPay features.`;
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
            "Your NovaPay account has been created."
        );


        setStatus("");


    } catch (error) {

        console.error(
            "NovaPay registration failed:",
            error
        );


        /*
           If Firebase Auth created the user but
           Firestore/email verification failed,
           sign the user out of the current session.
        */

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


        showError(
            firebaseErrorMessage(error)
        );


        setStatus("");


    } finally {

        setProcessing(false);
    }
}


/* =========================================================
   PASSWORD REQUIREMENTS
========================================================= */

function setRequirement(
    element,
    valid
) {

    if (!element) {
        return;
    }

    element.classList.toggle(
        "valid",
        valid
    );

    element.setAttribute(
        "aria-checked",
        valid ? "true" : "false"
    );
}


function updatePasswordRequirements() {

    const password =
        passwordInput?.value || "";


    const lengthValid =
        password.length >= MIN_PASSWORD_LENGTH;

    const uppercaseValid =
        /[A-Z]/.test(password);

    const lowercaseValid =
        /[a-z]/.test(password);

    const numberValid =
        /[0-9]/.test(password);

    const specialValid =
        /[^A-Za-z0-9]/.test(password);


    setRequirement(
        requirementLength,
        lengthValid
    );

    setRequirement(
        requirementUppercase,
        uppercaseValid
    );

    setRequirement(
        requirementLowercase,
        lowercaseValid
    );

    setRequirement(
        requirementNumber,
        numberValid
    );

    setRequirement(
        requirementSpecial,
        specialValid
    );


    if (!passwordStrength) {
        return;
    }


    if (!password) {

        passwordStrength.textContent =
            "Use at least 8 characters.";

        return;
    }


    if (
        lengthValid &&
        uppercaseValid &&
        lowercaseValid &&
        numberValid &&
        specialValid
    ) {

        passwordStrength.textContent =
            "Password meets NovaPay's requirements.";

    } else {

        passwordStrength.textContent =
            "Password does not meet all requirements.";
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

        confirmPasswordMessage.textContent = "";

        return;
    }


    if (
        password ===
        confirmPassword
    ) {

        confirmPasswordMessage.textContent =
            "Passwords match.";

    } else {

        confirmPasswordMessage.textContent =
            "Passwords do not match.";
    }
}


/* =========================================================
   PASSWORD EVENTS
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
   SHOW / HIDE PASSWORD
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


                const isHidden =
                    target.type === "password";


                target.type =
                    isHidden
                        ? "text"
                        : "password";


                button.textContent =
                    isHidden
                        ? "Hide"
                        : "Show";


                button.setAttribute(
                    "aria-label",
                    isHidden
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
    () => {

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
    () => {

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
   STEP 3 → SECURITY
========================================================= */

nextStep3Btn?.addEventListener(
    "click",
    () => {

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
    () => {

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
    () => {

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
    () => {

        if (registrationInProgress) {
            return;
        }


        showProfileStep(3);
    }
);


/* =========================================================
   FORM SUBMISSION
========================================================= */

form?.addEventListener(
    "submit",
    async event => {

        event.preventDefault();

        /*
           The form only submits from the
           account-security stage.

           Firebase registration happens here.
        */

        await createNovaPayAccount();
    }
);


/* =========================================================
   SUCCESS → LOGIN
========================================================= */

continueBtn?.addEventListener(
    "click",
    () => {

        /*
           Firebase Authentication remains
           the authentication authority.

           No localStorage token is created.
        */

        window.location.href =
            "login.html";
    }
);


/* =========================================================
   FIREBASE AUTH STATE
========================================================= */

onAuthStateChanged(
    auth,
    user => {

        /*
           Firebase controls authentication state.

           We intentionally do NOT use localStorage
           as an authentication mechanism.
        */

        if (!user) {
            return;
        }

        /*
           No privileged action is performed here.
           Protected pages must independently
           check Firebase Auth.
        */
    }
);


/* =========================================================
   INITIALIZE
========================================================= */

showProfileStep(1);

updatePasswordRequirements();

updatePasswordMatch();