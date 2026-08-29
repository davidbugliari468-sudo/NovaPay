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
    signOut,
    deleteUser
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
   REGISTRATION STEPS
========================================================= */

const stepOne =
    document.getElementById(
        "registrationStepOne"
    );

const stepTwo =
    document.getElementById(
        "registrationStepTwo"
    );

const nextBtn =
    document.getElementById(
        "nextBtn"
    );

const backBtn =
    document.getElementById(
        "backBtn"
    );

const stepIndicator =
    document.getElementById(
        "stepIndicator"
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
   SUCCESS / VERIFICATION SCREEN
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

const resendVerificationBtn =
    document.getElementById(
        "resendVerificationBtn"
    );

const checkVerificationBtn =
    document.getElementById(
        "checkVerificationBtn"
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

let currentStep =
    1;

let verificationEmail =
    "";


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
   STEP UI
========================================================= */

function showRegistrationStep(
    step
) {

    currentStep =
        step;


    if (stepOne) {

        stepOne.hidden =
            step !== 1;
    }


    if (stepTwo) {

        stepTwo.hidden =
            step !== 2;
    }


    if (stepIndicator) {

        stepIndicator.textContent =
            `Step ${step} of 2`;
    }


    if (nextBtn) {

        nextBtn.hidden =
            step !== 1;
    }


    if (registerBtn) {

        registerBtn.hidden =
            step !== 2;
    }


    if (backBtn) {

        backBtn.hidden =
            step !== 2;
    }


    hideError();

    hideSuccess();
}


/* =========================================================
   STEP ONE VALIDATION
========================================================= */

function validateStepOne(
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


    return null;
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
   STEP TWO VALIDATION
========================================================= */

function validateStepTwo(
    data
) {

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
   STEP ONE → STEP TWO
========================================================= */

if (nextBtn) {

    nextBtn.addEventListener(
        "click",
        event => {

            event.preventDefault();

            const data =
                getFormData();

            const error =
                validateStepOne(
                    data
                );


            if (error) {

                showError(
                    error
                );

                return;
            }


            showRegistrationStep(
                2
            );


            passwordInput?.focus();
        }
    );
}


/* =========================================================
   STEP TWO → STEP ONE
========================================================= */

if (backBtn) {

    backBtn.addEventListener(
        "click",
        event => {

            event.preventDefault();

            showRegistrationStep(
                1
            );
        }
    );
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
    () => {

        updatePasswordMatch();
    }
);


/* =========================================================
   VERIFICATION SCREEN
========================================================= */

function showVerificationScreen(
    email,
    nickname
) {

    verificationEmail =
        email;


    if (form) {

        form.hidden =
            true;
    }


    if (successScreen) {

        successScreen.hidden =
            false;
    }


    if (successNickname) {

        successNickname.textContent =
            nickname || "";
    }


    if (verificationStatus) {

        verificationStatus.textContent =
            `We've sent a verification link to ${email}. ` +
            "Open your email inbox or Spam/Junk folder and tap the verification link " +
            "to complete your registration.";
    }


    if (successMessage) {

        successMessage.hidden =
            true;

        successMessage.textContent =
            "";
    }


    if (errorMessage) {

        errorMessage.hidden =
            true;

        errorMessage.textContent =
            "";
    }


    setStatus(
        ""
    );
}


/* =========================================================
   HIDE VERIFICATION SCREEN
========================================================= */

function hideVerificationScreen() {

    if (successScreen) {

        successScreen.hidden =
            true;
    }


    if (form) {

        form.hidden =
            false;
    }
}


/* =========================================================
   SEND VERIFICATION EMAIL
========================================================= */

async function sendVerificationEmail(
    user
) {

    if (!user) {

        throw new Error(
            "Your Firebase account could not be found."
        );
    }


    await sendEmailVerification(
        user
    );
}


/* =========================================================
   RESEND VERIFICATION
========================================================= */

if (resendVerificationBtn) {

    resendVerificationBtn.addEventListener(
        "click",
        async event => {

            event.preventDefault();


            if (!verificationEmail) {

                showError(
                    "Your verification session has expired. Please register again."
                );

                return;
            }


            resendVerificationBtn.disabled =
                true;


            try {

                hideError();


                const currentUser =
                    auth.currentUser;


                if (
                    !currentUser
                ) {

                    throw new Error(
                        "Please start registration again."
                    );
                }


                await sendVerificationEmail(
                    currentUser
                );


                if (verificationStatus) {

                    verificationStatus.textContent =
                        `A new verification link has been sent to ${verificationEmail}. ` +
                        "Please check your inbox or Spam/Junk folder.";
                }


            } catch (error) {

                console.error(
                    "Verification resend failed:",
                    error
                );


                showError(
                    "We could not resend the verification email. Please wait a moment and try again."
                );


            } finally {

                resendVerificationBtn.disabled =
                    false;
            }
        }
    );
}


/* =========================================================
   CHECK EMAIL VERIFICATION
========================================================= */

if (checkVerificationBtn) {

    checkVerificationBtn.addEventListener(
        "click",
        async event => {

            event.preventDefault();


            checkVerificationBtn.disabled =
                true;


            try {

                hideError();


                const currentUser =
                    auth.currentUser;


                if (!currentUser) {

                    throw new Error(
                        "Your verification session has expired. Please start again."
                    );
                }


                const {
                    reload
                } =
                    await import(
                        "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js"
                    );


                await reload(
                    currentUser
                );


                if (
                    currentUser.emailVerified
                ) {

                    /*
                     * Do NOT automatically send an unverified user
                     * to the dashboard.
                     *
                     * At this point Firebase has explicitly confirmed
                     * that the email is verified.
                     */

                    if (verificationStatus) {

                        verificationStatus.textContent =
                            "Your email has been verified. Your registration is complete.";
                    }


                    if (continueBtn) {

                        continueBtn.hidden =
                            false;

                        continueBtn.disabled =
                            false;
                    }


                    if (checkVerificationBtn) {

                        checkVerificationBtn.hidden =
                            true;
                    }


                    /*
                     * Keep the user signed out after verification.
                     *
                     * The normal login flow will authenticate them
                     * and perform the final access checks.
                     */

                    await signOut(
                        auth
                    );


                    return;
                }


                showError(
                    "Your email has not been verified yet. Please open the verification link in your email first, then try again."
                );


            } catch (error) {

                console.error(
                    "Verification check failed:",
                    error
                );


                showError(
                    "We could not confirm your email verification. Please try again."
                );


            } finally {

                checkVerificationBtn.disabled =
                    false;
            }
        }
    );
}


/* =========================================================
   CREATE ACCOUNT
========================================================= */

if (form) {

    form.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            if (
                registrationInProgress
            ) {

                return;
            }


            const data =
                getFormData();


            const stepOneError =
                validateStepOne(
                    data
                );


            if (stepOneError) {

                showRegistrationStep(
                    1
                );

                showError(
                    stepOneError
                );

                return;
            }


            const stepTwoError =
                validateStepTwo(
                    data
                );


            if (stepTwoError) {

                showError(
                    stepTwoError
                );

                return;
            }


            registrationInProgress =
                true;


            if (registerBtn) {

                registerBtn.disabled =
                    true;
            }


            if (nextBtn) {

                nextBtn.disabled =
                    true;
            }


            hideError();
            hideSuccess();


            setStatus(
                "Creating your registration..."
            );


            let firebaseUser =
                null;


            try {

                /* ---------------------------------------------
                   CREATE FIREBASE AUTH ACCOUNT
                --------------------------------------------- */

                const credential =
                    await createUserWithEmailAndPassword(
                        auth,
                        data.email,
                        data.password
                    );


                firebaseUser =
                    credential.user;


                if (!firebaseUser) {

                    throw new Error(
                        "Firebase did not return a user account."
                    );
                }


                /* ---------------------------------------------
                   CREATE NOVAPAY FIRESTORE PROFILE
                --------------------------------------------- */

                setStatus(
                    "Creating your NovaPay profile..."
                );


                await createUserDocument(
                    firebaseUser,
                    data
                );


                /* ---------------------------------------------
                   CLAIM PHONE THROUGH RENDER
                --------------------------------------------- */

                setStatus(
                    "Checking your phone number..."
                );


                try {

                    await claimPhoneOnBackend(
                        firebaseUser,
                        data
                    );

                } catch (phoneError) {

                    /*
                     * If the phone is already registered,
                     * do not continue registration.
                     */

                    if (
                        phoneError.message ===
                        "PHONE_ALREADY_REGISTERED"
                    ) {

                        throw new Error(
                            "PHONE_ALREADY_REGISTERED"
                        );
                    }


                    throw phoneError;
                }


                /* ---------------------------------------------
                   SEND EMAIL VERIFICATION
                --------------------------------------------- */

                setStatus(
                    "Sending your verification email..."
                );


                await sendVerificationEmail(
                    firebaseUser
                );


                /*
                 * Save the email for the verification screen
                 * before signing the user out.
                 */

                verificationEmail =
                    data.email;


                /* ---------------------------------------------
                   IMPORTANT:
                   USER MUST VERIFY EMAIL BEFORE ACCESS
                --------------------------------------------- */

                await signOut(
                    auth
                );


                showVerificationScreen(
                    data.email,
                    data.nickname
                );


            } catch (error) {

                console.error(
                    "Registration failed:",
                    error
                );


                /* ---------------------------------------------
                   FIREBASE EMAIL ALREADY EXISTS
                --------------------------------------------- */

                if (
                    error?.code ===
                    "auth/email-already-in-use"
                ) {

                    /*
                     * The email may belong to an account that
                     * was created previously but never verified.
                     *
                     * We attempt to authenticate only with the
                     * password the user just entered. If the
                     * account is unverified, we can resend the
                     * verification email instead of trapping the
                     * user with "already exists".
                     */

                    try {

                        const {
                            signInWithEmailAndPassword
                        } =
                            await import(
                                "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js"
                            );


                        const existingCredential =
                            await signInWithEmailAndPassword(
                                auth,
                                data.email,
                                data.password
                            );


                        const existingUser =
                            existingCredential.user;


                        if (
                            existingUser &&
                            !existingUser.emailVerified
                        ) {

                            await sendVerificationEmail(
                                existingUser
                            );


                            verificationEmail =
                                data.email;


                            showVerificationScreen(
                                data.email,
                                data.nickname
                            );


                            if (verificationStatus) {

                                verificationStatus.textContent =
                                    `This email already has an unverified registration. ` +
                                    `We've sent a new verification link to ${data.email}. ` +
                                    "Please check your inbox or Spam/Junk folder.";
                            }


                            await signOut(
                                auth
                            );


                            return;
                        }


                        await signOut(
                            auth
                        );


                        showError(
                            "This email is already registered. Please use the login page."
                        );


                    } catch (existingAccountError) {

                        console.error(
                            "Existing account check failed:",
                            existingAccountError
                        );


                        if (
                            existingAccountError?.code ===
                            "auth/wrong-password" ||
                            existingAccountError?.code ===
                            "auth/invalid-credential"
                        ) {

                            showError(
                                "This email is already registered. Please use the login page or reset your password."
                            );

                        } else {

                            showError(
                                "This email is already registered. If you have not verified it yet, please use the verification email that was sent to you."
                            );
                        }
                    }


                    return;
                }


                /* ---------------------------------------------
                   PHONE ALREADY REGISTERED
                --------------------------------------------- */

                if (
                    error?.message ===
                    "PHONE_ALREADY_REGISTERED"
                ) {

                    showError(
                        "This phone number is already registered with NovaPay."
                    );


                    if (firebaseUser) {

                        try {

                            await deleteUser(
                                firebaseUser
                            );

                        } catch (
                            cleanupError
                        ) {

                            console.error(
                                "Firebase cleanup failed:",
                                cleanupError
                            );
                        }
                    }


                    return;
                }


                /* ---------------------------------------------
                   FIREBASE COMMON ERRORS
                --------------------------------------------- */

                switch (
                    error?.code
                ) {

                    case "auth/weak-password":

                        showError(
                            "Your password is too weak. Please create a stronger password."
                        );

                        break;


                    case "auth/invalid-email":

                        showError(
                            "Please enter a valid email address."
                        );

                        break;


                    case "auth/operation-not-allowed":

                        showError(
                            "Email and password registration is currently unavailable."
                        );

                        break;


                    case "auth/network-request-failed":

                        showError(
                            "Network connection failed. Please check your internet connection and try again."
                        );

                        break;


                    case "auth/too-many-requests":

                        showError(
                            "Too many attempts were made. Please wait a little while before trying again."
                        );

                        break;


                    default:

                        showError(
                            error?.message ||
                            "Registration could not be completed. Please try again."
                        );
                }


                /* ---------------------------------------------
                   CLEAN UP NEW AUTH ACCOUNT IF POSSIBLE
                --------------------------------------------- */

                if (firebaseUser) {

                    try {

                        await deleteUser(
                            firebaseUser
                        );

                    } catch (
                        cleanupError
                    ) {

                        console.error(
                            "Could not remove incomplete Firebase account:",
                            cleanupError
                        );
                    }
                }


            } finally {

                registrationInProgress =
                    false;


                if (registerBtn) {

                    registerBtn.disabled =
                        false;
                }


                if (nextBtn) {

                    nextBtn.disabled =
                        false;
                }


                setStatus(
                    ""
                );
            }
        }
    );
}


/* =========================================================
   CONTINUE BUTTON
========================================================= */

if (continueBtn) {

    continueBtn.addEventListener(
        "click",
        event => {

            /*
             * Verification completion is intentionally handled
             * separately from this button.
             *
             * If the existing HTML already provides a destination
             * through href, allow that existing navigation.
             */

            const target =
                continueBtn.getAttribute(
                    "data-href"
                ) ||
                continueBtn.getAttribute(
                    "href"
                );


            if (
                target &&
                target !== "#"
            ) {

                window.location.href =
                    target;

                return;
            }


            /*
             * Do not send the user to the dashboard automatically.
             * Login.js will be responsible for normal authenticated
             * navigation after the email has been verified.
             */

            event.preventDefault();


            showError(
                "Please log in after verifying your email."
            );
        }
    );
}


/* =========================================================
   LOGIN LINK
========================================================= */

if (loginLink) {

    loginLink.addEventListener(
        "click",
        () => {

            /*
             * Existing HTML navigation is preserved.
             * No custom redirect is forced here.
             */
        }
    );
}


/* =========================================================
   INITIALIZE
========================================================= */

setupPasswordToggles();

showRegistrationStep(
    1
);

updatePasswordRequirements();

updatePasswordMatch();

hideVerificationScreen();

console.log(
    "NovaPay registration flow initialized."
);