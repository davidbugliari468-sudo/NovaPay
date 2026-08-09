/* ==========================================
   NOVAPAY
   UNLOCK
   LOGIN PIN VERIFICATION
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

let loading = false;


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


        const snap =
            await getDoc(userRef);


        if (!snap.exists()) {

            await signOut(auth);

            window.location.href =
                "login.html";

            return;

        }


        const data =
            snap.data();


        savedPin =
            typeof data.loginPin === "string"
                ? data.loginPin.trim()
                : "";


        /*
         * Safety:
         * If this account doesn't actually have
         * a valid 6-digit PIN, send it to PIN creation.
         */

        if (!/^\d{6}$/.test(savedPin)) {

            window.location.replace(
                "login-pin.html"
            );

            return;

        }


        const displayName =
            data.fullName ||
            currentUser.displayName ||
            (
                currentUser.email
                    ? currentUser.email.split("@")[0]
                    : "NovaPay User"
            );


        if (welcomeText) {

            welcomeText.textContent =
                `Hello, ${displayName}`;

        }


        if (
            userAvatar &&
            data.photoURL
        ) {

            userAvatar.src =
                data.photoURL;

        }


        clearPin();

        console.log(
            "✅ NovaPay Unlock Ready"
        );

    }

    catch (error) {

        console.error(
            "UNLOCK LOAD ERROR:",
            error
        );

        alert(
            "Unable to load your account. Please try again."
        );

    }

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
                        verifyPin,
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

function shakePinBoxes() {

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
        500
    );

}


/* ==========================================
   VERIFY PIN
========================================== */

async function verifyPin() {

    try {

        if (
            enteredPin !== savedPin
        ) {

            shakePinBoxes();


            setTimeout(
                clearPin,
                500
            );


            return;

        }


        /*
         * Correct PIN
         */

        pinBoxes.forEach(
            (box) => {

                box.style.background =
                    "#2563EB";

                box.style.borderColor =
                    "#2563EB";

            }
        );


        /*
         * Remove any previous
         * app-lock flag.
         */

        localStorage.removeItem(
            `novaPayLock_${currentUser.uid}`
        );


        setTimeout(
            () => {

                window.location.replace(
                    "dashboard.html"
                );

            },
            450
        );

    }

    catch (error) {

        console.error(
            "PIN VERIFY ERROR:",
            error
        );

        clearPin();

        alert(
            "Unable to verify PIN. Please try again."
        );

    }

}


/* ==========================================
   LOGIN WITH PASSWORD
========================================== */

passwordLoginBtn?.addEventListener(
    "click",
    async () => {

        try {

            /*
             * This is intentional:
             * "Login with Password" means
             * completely leave the current session.
             */

            localStorage.removeItem(
                `novaPayLock_${currentUser?.uid}`
            );


            await signOut(auth);


            window.location.href =
                "login.html";

        }

        catch (error) {

            console.error(error);

            alert(
                "Unable to return to password login."
            );

        }

    }
);


/* ==========================================
   HELP
========================================== */

helpBtn?.addEventListener(
    "click",
    () => {

        alert(
`NovaPay Help

• Forgot your PIN?
Tap "Login with Password".

• Correct PIN
Enter your 6-digit Login PIN to continue.

Need more help?
Contact NovaPay Support.`
        );

    }
);


/* ==========================================
   PREVENT RIGHT CLICK
========================================== */

document.addEventListener(
    "contextmenu",
    (event) => {

        event.preventDefault();

    }
);


/* ==========================================
   PREVENT DRAGGING
========================================== */

document.addEventListener(
    "dragstart",
    (event) => {

        event.preventDefault();

    }
);


/* ==========================================
   INITIAL LOAD
========================================== */

window.addEventListener(
    "load",
    () => {

        clearPin();

    }
);