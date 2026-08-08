/* ==========================================
   NOVAPAY
   CREATE LOGIN PIN
   MODULE 1
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

let firstPin = "";

let enteredPin = "";

let confirmMode = false;

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

        const userRef = doc(
            db,
            "users",
            currentUser.uid
        );

        const userSnap =
        await getDoc(userRef);

        if(!userSnap.exists()){

            alert("User account not found.");

            window.location.href =
            "login.html";

            return;

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

    console.log("✅ Create PIN Ready");

} 
/* ==========================================
   NOVAPAY
   CREATE LOGIN PIN
   MODULE 2
   PIN ENGINE
========================================== */

numberButtons.forEach(button => {

    button.addEventListener("click", () => {

        if (loading) return;

        const number = button.dataset.number;

        if (!number) return;

        if (enteredPin.length >= 6) return;

        enteredPin += number;

        updatePinBoxes();

        if (enteredPin.length === 6) {

            loading = true;

            setTimeout(() => {

                processPin();

            }, 250);

        }

    });

});


deleteBtn.addEventListener("click", () => {

    if (loading) return;

    if (enteredPin.length === 0) return;

    enteredPin =
    enteredPin.slice(0,-1);

    updatePinBoxes();

});


/* ==========================================
   UPDATE PIN BOXES
========================================== */

function updatePinBoxes(){

    pinBoxes.forEach((box,index)=>{

        if(index < enteredPin.length){

            box.innerHTML="●";

            box.classList.add("active");

        }

        else{

            box.innerHTML="";

            box.classList.remove("active");

        }

    });

}


/* ==========================================
   CLEAR PIN
========================================== */

function clearPin(){

    enteredPin="";

    loading=false;

    updatePinBoxes();

}


/* ==========================================
   SHAKE
========================================== */

function shakeBoxes(){

    const container =
    document.querySelector(".pin-boxes");

    container.classList.add("shake");

    setTimeout(()=>{

        container.classList.remove("shake");

    },400);

}


console.log("✅ MODULE 2 READY"); 
/* ==========================================
   NOVAPAY
   CREATE LOGIN PIN
   MODULE 3
   CREATE & CONFIRM PIN
========================================== */

async function processPin() {

    /* ------------------------------
       FIRST PIN ENTRY
    ------------------------------ */

    if (!confirmMode) {

        firstPin = enteredPin;

        enteredPin = "";

        loading = false;

        confirmMode = true;

        pageTitle.textContent =
        "Confirm Login PIN";

        pageSubtitle.textContent =
        "Enter the same 6-digit PIN again.";

        updatePinBoxes();

        return;

    }

    /* ------------------------------
       PIN MISMATCH
    ------------------------------ */

    if (enteredPin !== firstPin) {

        shakeBoxes();

        pageTitle.textContent =
        "PINs Don't Match";

        pageSubtitle.textContent =
        "Create your Login PIN again.";

        setTimeout(() => {

            confirmMode = false;

            firstPin = "";

            clearPin();

            pageTitle.textContent =
            "Create Login PIN";

            pageSubtitle.textContent =
            "Create a secure 6-digit PIN to protect your account.";

        }, 700);

        return;

    }

    /* ------------------------------
       SAVE PIN
    ------------------------------ */

    try {

        const userRef = doc(
            db,
            "users",
            currentUser.uid
        );

        await updateDoc(userRef, {

            loginPin: firstPin,

            loginPinCreated: true,

            loginPinUpdatedAt:
                new Date()

        });

        localStorage.setItem(
            `trustedDevice_${currentUser.uid}`,
            "true"
        );

        window.location.href =
        "dashboard.html";

    }

    catch (error) {

        console.error(error);

        alert(error.message);

        clearPin();

    }

}

console.log("✅ MODULE 3 READY"); 
/* ==========================================
   NOVAPAY
   LOGIN
   MODULE 2
   TRUSTED DEVICE CHECK
========================================== */

/* ==========================================
   AUTO LOGIN
========================================== */

onAuthStateChanged(auth, (user) => {

    if (!user) return;

    const trustedDevice =
        localStorage.getItem(
            `trustedDevice_${user.uid}`
        ) === "true";

    if (trustedDevice) {

        window.location.replace(
            "unlock.html"
        );

    }

});

console.log("✅ Trusted Device Ready");