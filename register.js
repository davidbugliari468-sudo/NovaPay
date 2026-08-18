/* =========================================================
   NOVAPAY — REGISTRATION
   2-STEP REGISTRATION
   Firebase SDK 10.12.5
========================================================= */

import { auth, db } from "./firebase.js";

import {
    createUserWithEmailAndPassword,
    updateProfile
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import {
    doc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";


/* =========================================================
   ELEMENTS
========================================================= */

const step1 = document.getElementById("step1");
const step2 = document.getElementById("step2");
const successScreen = document.getElementById("successScreen");

const nextStepBtn = document.getElementById("nextStepBtn");
const backStepBtn = document.getElementById("backStepBtn");
const registerBtn = document.getElementById("registerBtn");
const continueBtn = document.getElementById("continueBtn");

const registerTitle = document.getElementById("registerTitle");
const registerDescription =
    document.getElementById("registerDescription");
const registerProgress =
    document.getElementById("registerProgress");
const loginLink = document.getElementById("loginLink");

const errorMessage =
    document.getElementById("errorMessage");

const successMessage =
    document.getElementById("successMessage");

const successNickname =
    document.getElementById("successNickname");

const nickname =
    document.getElementById("nickname");

const firstName =
    document.getElementById("firstName");

const middleName =
    document.getElementById("middleName");

const surname =
    document.getElementById("surname");

const email =
    document.getElementById("email");

const phone =
    document.getElementById("phone");

const password =
    document.getElementById("password");

const confirmPassword =
    document.getElementById("confirmPassword");

const terms =
    document.getElementById("terms");

const passwordStrength =
    document.getElementById("passwordStrength");


/* =========================================================
   HELPERS
========================================================= */

function clean(value) {
    return String(value || "")
        .trim()
        .replace(/\s+/g, " ");
}


function cleanPhone(value) {
    return String(value || "")
        .trim()
        .replace(/[()\-\s]/g, "");
}


function showError(message) {

    if (!errorMessage) return;

    errorMessage.textContent = message;
    errorMessage.style.display = "block";

    if (successMessage) {
        successMessage.style.display = "none";
    }
}


function clearError() {

    if (!errorMessage) return;

    errorMessage.textContent = "";
    errorMessage.style.display = "none";
}


function validEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}


function validPhone(value) {
    return /^\+?[0-9]{7,15}$/.test(value);
}


/* =========================================================
   STEP 1 VALIDATION
========================================================= */

function validateStep1() {

    clearError();

    const nicknameValue =
        clean(nickname?.value);

    const firstNameValue =
        clean(firstName?.value);

    const surnameValue =
        clean(surname?.value);

    const emailValue =
        clean(email?.value).toLowerCase();

    const phoneValue =
        cleanPhone(phone?.value);


    if (!nicknameValue) {
        showError("Please enter your nickname.");
        return false;
    }


    if (nicknameValue.length < 2) {
        showError(
            "Your nickname must contain at least 2 characters."
        );
        return false;
    }


    if (!firstNameValue) {
        showError("Please enter your first name.");
        return false;
    }


    if (!surnameValue) {
        showError("Please enter your surname.");
        return false;
    }


    if (!emailValue) {
        showError("Please enter your email address.");
        return false;
    }


    if (!validEmail(emailValue)) {
        showError(
            "Please enter a valid email address."
        );
        return false;
    }


    if (!phoneValue) {
        showError("Please enter your phone number.");
        return false;
    }


    if (!validPhone(phoneValue)) {
        showError(
            "Please enter a valid phone number."
        );
        return false;
    }


    return true;
}


/* =========================================================
   CONTINUE — STEP 1 → STEP 2
========================================================= */

nextStepBtn?.addEventListener("click", () => {

    console.log("NovaPay: Continue clicked");

    if (!validateStep1()) {
        return;
    }


    step1.style.display = "none";
    step2.style.display = "block";


    registerTitle.textContent =
        "Secure Your Account";

    registerDescription.textContent =
        "Create a strong password to protect your NovaPay account.";

    registerProgress.textContent =
        "Step 2 of 2";


    clearError();


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
});


/* =========================================================
   BACK — STEP 2 → STEP 1
========================================================= */

backStepBtn?.addEventListener("click", () => {

    step2.style.display = "none";
    step1.style.display = "block";


    registerTitle.textContent =
        "Create Account";

    registerDescription.textContent =
        "Create your NovaPay account in two simple steps.";

    registerProgress.textContent =
        "Step 1 of 2";


    clearError();


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
});


/* =========================================================
   SHOW / HIDE PASSWORD
========================================================= */

document
    .querySelectorAll(".show-password")
    .forEach((button) => {

        button.addEventListener("click", () => {

            const target =
                document.getElementById(
                    button.dataset.target
                );

            if (!target) return;


            if (target.type === "password") {

                target.type = "text";
                button.textContent = "Hide";

            } else {

                target.type = "password";
                button.textContent = "Show";
            }
        });
    });


/* =========================================================
   PASSWORD STRENGTH
========================================================= */

password?.addEventListener("input", () => {

    const value = password.value;

    if (!passwordStrength) return;


    if (!value) {

        passwordStrength.textContent =
            "Use at least 8 characters.";

        return;
    }


    let score = 0;

    if (value.length >= 8) score++;
    if (/[A-Z]/.test(value)) score++;
    if (/[a-z]/.test(value)) score++;
    if (/[0-9]/.test(value)) score++;
    if (/[^A-Za-z0-9]/.test(value)) score++;


    if (score <= 2) {

        passwordStrength.textContent =
            "Weak password";

        passwordStrength.style.color =
            "#dc2626";

    } else if (score <= 4) {

        passwordStrength.textContent =
            "Medium password";

        passwordStrength.style.color =
            "#d97706";

    } else {

        passwordStrength.textContent =
            "Strong password";

        passwordStrength.style.color =
            "#16a34a";
    }
});


/* =========================================================
   CREATE ACCOUNT
========================================================= */

registerBtn?.addEventListener("click", async () => {

    clearError();


    /* -----------------------------------------
       VALIDATE PERSONAL INFORMATION
    ----------------------------------------- */

    if (!validateStep1()) {

        step2.style.display = "none";
        step1.style.display = "block";

        registerTitle.textContent =
            "Create Account";

        registerDescription.textContent =
            "Create your NovaPay account in two simple steps.";

        registerProgress.textContent =
            "Step 1 of 2";

        return;
    }


    /* -----------------------------------------
       PASSWORD
    ----------------------------------------- */

    const passwordValue =
        password?.value || "";

    const confirmValue =
        confirmPassword?.value || "";


    if (passwordValue.length < 8) {

        showError(
            "Your password must contain at least 8 characters."
        );

        return;
    }


    if (passwordValue !== confirmValue) {

        showError(
            "Passwords do not match."
        );

        return;
    }


    if (!terms?.checked) {

        showError(
            "Please agree to the Terms & Conditions and Privacy Policy."
        );

        return;
    }


    /* -----------------------------------------
       USER INFORMATION
    ----------------------------------------- */

    const nicknameValue =
        clean(nickname.value);

    const firstNameValue =
        clean(firstName.value);

    const middleNameValue =
        clean(middleName.value);

    const surnameValue =
        clean(surname.value);

    const emailValue =
        clean(email.value).toLowerCase();

    const phoneValue =
        cleanPhone(phone.value);


    /* -----------------------------------------
       PREVENT DOUBLE SUBMISSION
    ----------------------------------------- */

    registerBtn.disabled = true;
    registerBtn.textContent =
        "Creating Account...";


    try {

        /* =====================================
           FIREBASE AUTH
        ===================================== */

        const credential =
            await createUserWithEmailAndPassword(
                auth,
                emailValue,
                passwordValue
            );


        const user =
            credential.user;


        /* =====================================
           NICKNAME
           This is the user's display name.
        ===================================== */

        await updateProfile(user, {
            displayName: nicknameValue
        });


        /* =====================================
           FIRESTORE USER
        ===================================== */

        await setDoc(
            doc(
                db,
                "users",
                user.uid
            ),
            {

                uid:
                    user.uid,

                /*
                 * DISPLAY NAME
                 *
                 * Dashboard / Profile / Unlock
                 * should use this nickname.
                 */
                nickname:
                    nicknameValue,

                /*
                 * REAL PERSONAL INFORMATION
                 */
                firstName:
                    firstNameValue,

                middleName:
                    middleNameValue,

                surname:
                    surnameValue,

                /*
                 * Compatibility field for
                 * existing pages that currently
                 * read fullName.
                 *
                 * IMPORTANT:
                 * fullName = nickname.
                 */
                fullName:
                    nicknameValue,

                email:
                    emailValue,

                phone:
                    phoneValue,

                /*
                 * OTP is not active yet.
                 */
                phoneVerified:
                    false,

                emailVerified:
                    user.emailVerified,

                /*
                 * ACCOUNT
                 */
                tier:
                    "Tier 1",

                verificationStatus:
                    "Basic",

                /*
                 * ACHIEVEMENT POINTS
                 */
                points:
                    0,

                /*
                 * WALLET
                 */
                walletBalance:
                    0,

                balance:
                    0,

                /*
                 * FREE LIMIT
                 */
                freeLimit:
                    50000,

                /*
                 * PROFILE
                 */
                profileCompleted:
                    false,

                /*
                 * SECURITY
                 */
                loginPinCreated:
                    false,

                /*
                 * FUTURE VERIFICATION
                 */
                ninVerified:
                    false,

                bvnVerified:
                    false,

                /*
                 * FUTURE PERMANENT ACCOUNT
                 */
                accountNumber:
                    null,

                accountName:
                    null,

                /*
                 * TIMESTAMPS
                 */
                createdAt:
                    serverTimestamp(),

                updatedAt:
                    serverTimestamp()
            }
        );


        /* =====================================
           SUCCESS
        ===================================== */

        if (successNickname) {

            successNickname.textContent =
                nicknameValue;
        }


        step1.style.display =
            "none";

        step2.style.display =
            "none";

        successScreen.style.display =
            "block";


        registerTitle.textContent =
            "";

        registerDescription.textContent =
            "";

        registerProgress.style.display =
            "none";

        loginLink.style.display =
            "none";


        clearError();


        console.log(
            "✅ NovaPay account created successfully."
        );


    } catch (error) {

        console.error(
            "NovaPay registration error:",
            error
        );


        let message =
            "We couldn't create your account. Please try again.";


        if (
            error.code ===
            "auth/email-already-in-use"
        ) {

            message =
                "An account with this email already exists.";

        } else if (
            error.code ===
            "auth/invalid-email"
        ) {

            message =
                "Please enter a valid email address.";

        } else if (
            error.code ===
            "auth/weak-password"
        ) {

            message =
                "Your password is too weak.";

        } else if (
            error.code ===
            "auth/network-request-failed"
        ) {

            message =
                "Network error. Please check your internet connection and try again.";

        } else if (
            error.code ===
            "auth/too-many-requests"
        ) {

            message =
                "Too many attempts. Please wait and try again.";
        }


        showError(message);


        registerBtn.disabled =
            false;

        registerBtn.textContent =
            "Create Account";
    }
});


/* =========================================================
   SUCCESS → DASHBOARD
========================================================= */

continueBtn?.addEventListener("click", () => {

    window.location.href =
        "dashboard.html";
});


/* =========================================================
   INITIAL STATE
========================================================= */

step1.style.display =
    "block";

step2.style.display =
    "none";

successScreen.style.display =
    "none";


console.log(
    "✅ NovaPay registration JS loaded correctly."
);