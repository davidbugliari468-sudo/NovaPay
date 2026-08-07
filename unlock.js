/* ==========================================
   NOVAPAY
   UNLOCK
   MODULE 1
========================================== */

import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";


/* ==========================================
   ELEMENTS
========================================== */

const welcomeText =
document.getElementById("welcomeText");

const userAvatar =
document.getElementById("userAvatar");

const helpBtn =
document.getElementById("helpBtn");

const passwordLoginBtn =
document.getElementById("passwordLoginBtn");

const deleteBtn =
document.getElementById("deleteBtn");

const pinBoxes =
document.querySelectorAll(".pin-box");

const numberButtons =
document.querySelectorAll(".num-btn");


/* ==========================================
   VARIABLES
========================================== */

let currentUser = null;

let savedPin = "";

let enteredPin = "";

let userData = null;

let loading = false;


/* ==========================================
   CHECK LOGIN
========================================== */

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        window.location.href = "login.html";

        return;

    }

    currentUser = user;

    await loadUser();

});


/* ==========================================
   LOAD USER
========================================== */

async function loadUser(){

    try{

        const userRef =
        doc(
            db,
            "users",
            currentUser.uid
        );

        const snap =
        await getDoc(userRef);

        if(!snap.exists()){

            alert("Account not found.");

            await signOut(auth);

            return;

        }

        userData =
        snap.data();

        savedPin =
        userData.loginPin || "";

        welcomeText.textContent =
        `Hello, ${
            userData.fullName ||
            currentUser.email.split("@")[0]
        }`;

        if(userData.photoURL){

            userAvatar.src =
            userData.photoURL;

        }

        initializeKeypad();

    }

    catch(error){

        console.error(error);

        alert(error.message);

    }

}


/* ==========================================
   INITIALIZE
========================================== */

function initializeKeypad(){

    console.log("✅ Unlock Ready");

} /* ==========================================
   NOVAPAY
   UNLOCK
   MODULE 2
   PIN ENGINE
========================================== */

numberButtons.forEach(button => {

    button.addEventListener("click", () => {

        if (loading) return;

        const number = button.dataset.number;

        if (number === undefined) return;

        if (enteredPin.length >= 6) return;

        enteredPin += number;

        updatePinBoxes();

        if (enteredPin.length === 6) {

            loading = true;

            setTimeout(() => {

                verifyPin();

            }, 250);

        }

    });

});


deleteBtn.addEventListener("click", () => {

    if (loading) return;

    if (enteredPin.length === 0) return;

    enteredPin =
    enteredPin.slice(0, -1);

    updatePinBoxes();

});


/* ==========================================
   UPDATE PIN BOXES
========================================== */

function updatePinBoxes() {

    pinBoxes.forEach((box, index) => {

        if (index < enteredPin.length) {

            box.innerHTML = "●";

            box.classList.add("active");

        } else {

            box.innerHTML = "";

            box.classList.remove("active");

        }

    });

}


/* ==========================================
   RESET PIN
========================================== */

function clearPin() {

    enteredPin = "";

    loading = false;

    updatePinBoxes();

}


/* ==========================================
   SHAKE ANIMATION
========================================== */

function shakePinBoxes() {

    const container =
    document.querySelector(".pin-boxes");

    container.classList.add("shake");

    setTimeout(() => {

        container.classList.remove("shake");

    }, 500);

}


console.log("✅ Module 2 Loaded");
/* ==========================================
   NOVAPAY
   UNLOCK
   MODULE 3
   VERIFY PIN
========================================== */

async function verifyPin() {

    try {

        /* ------------------------------
           CHECK PIN
        ------------------------------ */

        if (enteredPin !== savedPin) {

            shakePinBoxes();

            setTimeout(() => {

                clearPin();

            }, 500);

            return;

        }

        /* ------------------------------
           TRUST THIS DEVICE
        ------------------------------ */

        localStorage.setItem(
            `trustedDevice_${currentUser.uid}`,
            "true"
        );

        localStorage.setItem(
            "trustedUser",
            currentUser.uid
        );

        /* ------------------------------
           SUCCESS ANIMATION
        ------------------------------ */

        pinBoxes.forEach(box => {

            box.style.background = "#2563EB";
            box.style.borderColor = "#2563EB";

        });

        /* ------------------------------
           GO TO DASHBOARD
        ------------------------------ */

        setTimeout(() => {

            window.location.href =
            "dashboard.html";

        }, 600);

    }

    catch (error) {

        console.error(error);

        alert(error.message);

        clearPin();

    }

}

console.log("✅ Module 3 Loaded");
/* ==========================================
   NOVAPAY
   UNLOCK
   MODULE 4
   TRUSTED DEVICE
========================================== */

/* ------------------------------
   LOGIN WITH PASSWORD
------------------------------ */

passwordLoginBtn?.addEventListener("click", async () => {

    try {

        /* Remove this device trust */

        localStorage.removeItem(
            `trustedDevice_${currentUser.uid}`
        );

        localStorage.removeItem(
            "trustedUser"
        );

        /* Sign out */

        await signOut(auth);

        /* Go back to login */

        window.location.href = "login.html";

    }

    catch (error) {

        console.error(error);

        alert(error.message);

    }

});


/* ------------------------------
   GET HELP
------------------------------ */

helpBtn?.addEventListener("click", () => {

    alert(
`NovaPay Help

• Forgot your PIN?
Tap "Login with Password".

• If you're using a new phone,
log in with your email and password first.

Need more help?
Contact NovaPay Support.`
    );

});


/* ------------------------------
   AUTO TRUST CHECK
------------------------------ */

function isTrustedDevice() {

    return (
        localStorage.getItem(
            `trustedDevice_${currentUser.uid}`
        ) === "true"
    );

}

console.log("✅ Module 4 Loaded");
/* ==========================================
   NOVAPAY
   UNLOCK
   MODULE 5
   FINAL INITIALIZATION
========================================== */

/* ------------------------------
   PREVENT RIGHT CLICK
------------------------------ */

document.addEventListener("contextmenu", (e) => {
    e.preventDefault();
});

/* ------------------------------
   PREVENT DRAGGING
------------------------------ */

document.addEventListener("dragstart", (e) => {
    e.preventDefault();
});

/* ------------------------------
   PRELOAD
------------------------------ */

window.addEventListener("load", () => {

    pinBoxes.forEach(box => {

        box.classList.remove("active");

        box.innerHTML = "";

    });

});

/* ------------------------------
   APP READY
------------------------------ */

console.log("==================================");
console.log(" NovaPay Unlock Ready");
console.log(" User:", currentUser);
console.log("==================================");