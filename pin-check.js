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


/* ==========================================
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
       DETERMINE DESTINATION
    ------------------------------ */

    let destination;


    if (!hasPin) {

        destination =
            "login-pin.html";

    } else {

        destination =
            "unlock.html";

    }


    /* ------------------------------
       START NOVAPAY LOADER
    ------------------------------ */

    startNovaPayLoader(destination);

}


/* ==========================================
   NOVAPAY CIRCLE LOADER
========================================== */

function startNovaPayLoader(destination) {

    const progressNumber =
        document.getElementById(
            "progress-number"
        );

    const progressBar =
        document.querySelector(
            ".progress-bar"
        );


    /* ------------------------------
       SAFETY CHECK
    ------------------------------ */

    if (!progressNumber || !progressBar) {

        window.location.href =
            destination;

        return;

    }


    /* ------------------------------
       CIRCLE SETTINGS
    ------------------------------ */

    const circleLength = 314.16;

    const totalTime = 1800;

    const startTime =
        performance.now();


    /* ------------------------------
       PROGRESS ANIMATION
    ------------------------------ */

    function animateProgress(currentTime) {

        const elapsed =
            currentTime - startTime;


        let progress =
            Math.min(
                elapsed / totalTime,
                1
            );


        /* ------------------------------
           SMOOTH PROGRESS
        ------------------------------ */

        const percentage =
            Math.round(
                progress * 100
            );


        progressNumber.textContent =
            percentage;


        const offset =
            circleLength -
            (percentage / 100) *
            circleLength;


        progressBar.style.strokeDashoffset =
            offset;


        /* ------------------------------
           CONTINUE
        ------------------------------ */

        if (progress < 1) {

            requestAnimationFrame(
                animateProgress
            );

            return;

        }


        /* ------------------------------
           COMPLETE
        ------------------------------ */

        progressNumber.textContent =
            "✓";


        progressNumber.style.fontSize =
            "28px";

        progressNumber.style.color =
            "#2563EB";


        /* ------------------------------
           SHORT FINISH MOMENT
        ------------------------------ */

        setTimeout(() => {

            window.location.href =
                destination;

        }, 180);

    }


    /* ------------------------------
       START
    ------------------------------ */

    requestAnimationFrame(
        animateProgress
    );

}


/* ==========================================
   MODULE READY
========================================== */

console.log(
    "✅ NovaPay PIN CHECK READY"
);