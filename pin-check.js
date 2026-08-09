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

        const userRef =
            doc(
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

        console.error(
            "PIN CHECK ERROR:",
            error
        );

        alert(
            "Unable to check your Login PIN. Please try again."
        );

    }

}


/* ==========================================
   DECISION ENGINE
========================================== */

function decideNextStep() {

    const savedPin =
        typeof userData.loginPin === "string"
            ? userData.loginPin.trim()
            : "";


    const hasPin =
        userData.loginPinCreated === true &&
        /^\d{6}$/.test(savedPin);


    /*
     * NO LOGIN PIN
     * First-time user
     */

    if (!hasPin) {

        window.location.href =
            "login-pin.html";

        return;

    }


    /*
     * LOGIN PIN EXISTS
     */

    window.location.href =
        "unlock.html";

}


console.log(
    "✅ NovaPay PIN CHECK READY"
);