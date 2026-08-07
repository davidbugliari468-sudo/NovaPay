/* ==========================================
   NOVAPAY
   PIN CHECK
   MODULE 1
========================================== */

import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";


/* ==========================================
   VARIABLES
========================================== */

let currentUser = null;

let userData = null;


/* ==========================================
   AUTH CHECK
========================================== */

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        window.location.href = "login.html";

        return;

    }

    currentUser = user;

    await checkUser();

});


/* ==========================================
   LOAD USER
========================================== */

async function checkUser() {

    try {

        const userRef = doc(
            db,
            "users",
            currentUser.uid
        );

        const userSnap =
        await getDoc(userRef);

        if (!userSnap.exists()) {

            alert("User account not found.");

            window.location.href =
            "login.html";

            return;

        }

        userData =
        userSnap.data();

        decideNextStep();

    }

    catch (error) {

        console.error(error);

        alert(error.message);

    }

}

console.log("✅ PIN CHECK MODULE 1 READY");
/* ==========================================
   NOVAPAY
   PIN CHECK
   MODULE 2
   DECISION ENGINE
========================================== */

function decideNextStep() {

    /* ------------------------------
       CHECK IF PIN EXISTS
    ------------------------------ */

    const hasPin =
        userData.loginPinCreated === true &&
        userData.loginPin &&
        userData.loginPin.length === 6;

    /* ------------------------------
       TRUSTED DEVICE
    ------------------------------ */

    const trustedDevice =
        localStorage.getItem(
            `trustedDevice_${currentUser.uid}`
        ) === "true";

    /* ------------------------------
       FIRST LOGIN
    ------------------------------ */

    if (!hasPin) {

        window.location.href =
            "login-pin.html";

        return;

    }

    /* ------------------------------
       USER HAS PIN
    ------------------------------ */

    window.location.href =
        "unlock.html";

}

console.log("✅ PIN CHECK MODULE 2 READY");