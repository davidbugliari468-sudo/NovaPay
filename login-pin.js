/* ==========================================
   NOVAPAY
   LOGIN PIN
   CREATE + CHANGE
========================================== */

import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import {
    doc,
    getDoc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";


/* ==========================================
   ELEMENTS
========================================== */

const pageTitle =
    document.getElementById("pageTitle");

const pageSubtitle =
    document.getElementById("pageSubtitle");

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

let firstPin = "";

let enteredPin = "";

let loading = false;


/*
 * CREATE MODE
 *
 * create-current
 * create-confirm
 *
 * CHANGE MODE
 *
 * change-current
 * change-new
 * change-confirm
 */

let mode = "create";

let step = "create-new";


/* ==========================================
   CHECK URL MODE
========================================== */

const urlParams =
    new URLSearchParams(
        window.location.search
    );


const changeMode =
    urlParams.get("mode") === "change";


if (changeMode) {

    mode = "change";

    step = "change-current";

}


/* ==========================================
   AUTH CHECK
========================================== */

onAuthStateChanged(
    auth,
    async (user) => {

        if (!user) {

            window.location.href =
                "login.html";

            return;

        }


        currentUser = user;

        await loadUser();

    }
);


/* ==========================================
   LOAD USER
========================================== */

async function loadUser() {

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

            alert(
                "User account not found."
            );

            window.location.href =
                "login.html";

            return;

        }


        const data =
            userSnap.data();


        savedPin =
            typeof data.loginPin === "string"
                ? data.loginPin.trim()
                : "";


        const hasExistingPin =
            data.loginPinCreated === true &&
            /^\d{6}$/.test(savedPin);


        /*
         * CHANGE MODE
         */

        if (mode === "change") {

            if (!hasExistingPin) {

                /*
                 * User tried to open
                 * Change PIN without
                 * having a PIN.
                 */

                mode = "create";

                step = "create-new";


                setCreateScreen();

                return;

            }


            setChangeCurrentScreen();

            return;

        }


        /*
         * CREATE MODE
         */

        if (hasExistingPin) {

            /*
             * If a PIN already exists,
             * don't create another one
             * accidentally.
             */

            mode = "change";

            step = "change-current";


            setChangeCurrentScreen();

            return;

        }


        setCreateScreen();

    }

    catch (error) {

        console.error(
            "LOGIN PIN LOAD ERROR:",
            error
        );

        alert(
            "Unable to load Login PIN settings."
        );

    }

}


/* ==========================================
   SCREEN — CREATE
========================================== */

function setCreateScreen() {

    if (pageTitle) {

        pageTitle.textContent =
            "Create Login PIN";

    }


    if (pageSubtitle) {

        pageSubtitle.textContent =
            "Create a secure 6-digit PIN to protect your account.";

    }


    clearPin();

}


/* ==========================================
   SCREEN — CREATE CONFIRM
========================================== */

function setCreateConfirmScreen() {

    if (pageTitle) {

        pageTitle.textContent =
            "Confirm Login PIN";

    }


    if (pageSubtitle) {

        pageSubtitle.textContent =
            "Enter the same 6-digit PIN again.";

    }


    clearPin();

}


/* ==========================================
   SCREEN — CHANGE CURRENT
========================================== */

function setChangeCurrentScreen() {

    if (pageTitle) {

        pageTitle.textContent =
            "Change Login PIN";

    }


    if (pageSubtitle) {

        pageSubtitle.textContent =
            "Enter your current 6-digit PIN.";

    }


    clearPin();

}


/* ==========================================
   SCREEN — CHANGE NEW
========================================== */

function setChangeNewScreen() {

    if (pageTitle) {

        pageTitle.textContent =
            "Create New Login PIN";

    }


    if (pageSubtitle) {

        pageSubtitle.textContent =
            "Enter a new 6-digit PIN.";

    }


    clearPin();

}


/* ==========================================
   SCREEN — CHANGE CONFIRM
========================================== */

function setChangeConfirmScreen() {

    if (pageTitle) {

        pageTitle.textContent =
            "Confirm New Login PIN";

    }


    if (pageSubtitle) {

        pageSubtitle.textContent =
            "Enter your new 6-digit PIN again.";

    }


    clearPin();

}


/* ==========================================
   NUMBER PAD
========================================== */

numberButtons.forEach(
    (button) => {

        button.addEventListener(
            "click",
            () => {

                if (loading) return;


                const number =
                    button.dataset.number;


                if (
                    number === undefined ||
                    number === null
                ) {
                    return;
                }


                if (
                    enteredPin.length >= 6
                ) {
                    return;
                }


                enteredPin += number;

                updatePinBoxes();


                if (
                    enteredPin.length === 6
                ) {

                    loading = true;


                    setTimeout(
                        processPin,
                        250
                    );

                }

            }
        );

    }
);


/* ==========================================
   DELETE
========================================== */

deleteBtn?.addEventListener(
    "click",
    () => {

        if (loading) return;


        if (!enteredPin.length) {
            return;
        }


        enteredPin =
            enteredPin.slice(0, -1);


        updatePinBoxes();

    }
);


/* ==========================================
   UPDATE PIN BOXES
========================================== */

function updatePinBoxes() {

    pinBoxes.forEach(
        (box, index) => {

            if (
                index <
                enteredPin.length
            ) {

                box.innerHTML =
                    "●";

                box.classList.add(
                    "active"
                );

            }

            else {

                box.innerHTML =
                    "";

                box.classList.remove(
                    "active"
                );

            }

        }
    );

}


/* ==========================================
   CLEAR PIN
========================================== */

function clearPin() {

    enteredPin = "";

    loading = false;

    updatePinBoxes();

}


/* ==========================================
   SHAKE
========================================== */

function shakeBoxes() {

    const container =
        document.querySelector(
            ".pin-boxes"
        );


    if (!container) return;


    container.classList.remove(
        "shake"
    );


    void container.offsetWidth;


    container.classList.add(
        "shake"
    );


    setTimeout(
        () => {

            container.classList.remove(
                "shake"
            );

        },
        450
    );

}


/* ==========================================
   PROCESS PIN
========================================== */

async function processPin() {

    /*
     * ========================================
     * CREATE MODE
     * ========================================
     */

    if (mode === "create") {

        await processCreatePin();

        return;

    }


    /*
     * ========================================
     * CHANGE MODE
     * ========================================
     */

    await processChangePin();

}


/* ==========================================
   CREATE PIN
========================================== */

async function processCreatePin() {

    /*
     * FIRST ENTRY
     */

    if (step === "create-new") {

        firstPin =
            enteredPin;


        step =
            "create-confirm";


        setCreateConfirmScreen();

        return;

    }


    /*
     * CONFIRM ENTRY
     */

    if (step === "create-confirm") {

        if (
            enteredPin !== firstPin
        ) {

            shakeBoxes();


            if (pageTitle) {

                pageTitle.textContent =
                    "PINs Don't Match";

            }


            if (pageSubtitle) {

                pageSubtitle.textContent =
                    "Please create your Login PIN again.";

            }


            setTimeout(
                () => {

                    firstPin = "";

                    step =
                        "create-new";

                    setCreateScreen();

                },
                700
            );


            return;

        }


        await saveNewPin(
            firstPin
        );

    }

}


/* ==========================================
   CHANGE PIN
========================================== */

async function processChangePin() {

    /*
     * CURRENT PIN
     */

    if (
        step === "change-current"
    ) {

        if (
            enteredPin !== savedPin
        ) {

            shakeBoxes();


            if (pageSubtitle) {

                pageSubtitle.textContent =
                    "Incorrect current PIN. Try again.";

            }


            setTimeout(
                clearPin,
                600
            );


            return;

        }


        step =
            "change-new";


        setChangeNewScreen();

        return;

    }


    /*
     * NEW PIN
     */

    if (
        step === "change-new"
    ) {

        firstPin =
            enteredPin;


        /*
         * Don't allow the
         * exact same PIN.
         */

        if (
            firstPin === savedPin
        ) {

            shakeBoxes();


            if (pageSubtitle) {

                pageSubtitle.textContent =
                    "Your new PIN must be different from the current PIN.";

            }


            setTimeout(
                () => {

                    clearPin();

                    setChangeNewScreen();

                },
                700
            );


            return;

        }


        step =
            "change-confirm";


        setChangeConfirmScreen();

        return;

    }


    /*
     * CONFIRM NEW PIN
     */

    if (
        step === "change-confirm"
    ) {

        if (
            enteredPin !== firstPin
        ) {

            shakeBoxes();


            if (pageTitle) {

                pageTitle.textContent =
                    "PINs Don't Match";

            }


            if (pageSubtitle) {

                pageSubtitle.textContent =
                    "Please enter your new PIN again.";

            }


            setTimeout(
                () => {

                    step =
                        "change-new";

                    firstPin = "";

                    setChangeNewScreen();

                },
                700
            );


            return;

        }


        await saveNewPin(
            firstPin
        );

    }

}


/* ==========================================
   SAVE PIN
========================================== */

async function saveNewPin(newPin) {

    try {

        loading = true;


        const userRef =
            doc(
                db,
                "users",
                currentUser.uid
            );


        await updateDoc(
            userRef,
            {

                loginPin:
                    newPin,

                loginPinCreated:
                    true,

                loginPinUpdatedAt:
                    new Date()

            }
        );


        /*
         * Remove old trusted-device
         * value because the new system
         * does not use it.
         */

        localStorage.removeItem(
            `trustedDevice_${currentUser.uid}`
        );


        /*
         * Clear any app-lock state.
         */

        localStorage.removeItem(
            `novaPayLock_${currentUser.uid}`
        );


        /*
         * SUCCESS
         */

        if (pageTitle) {

            pageTitle.textContent =
                mode === "change"
                    ? "Login PIN Changed"
                    : "Login PIN Created";

        }


        if (pageSubtitle) {

            pageSubtitle.textContent =
                mode === "change"
                    ? "Your Login PIN has been changed successfully."
                    : "Your Login PIN has been created successfully.";

        }


        pinBoxes.forEach(
            (box) => {

                box.style.background =
                    "#2563EB";

                box.style.borderColor =
                    "#2563EB";

            }
        );


        setTimeout(
            () => {

                window.location.replace(
                    "dashboard.html"
                );

            },
            700
        );

    }

    catch (error) {

        console.error(
            "SAVE LOGIN PIN ERROR:",
            error
        );

        loading = false;

        alert(
            "Unable to save your Login PIN. Please try again."
        );

        clearPin();

    }

}


/* ==========================================
   READY
========================================== */

console.log(
    "✅ NovaPay Login PIN Ready"
);