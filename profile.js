/* ==========================================
   NOVAPAY SETTINGS
   MODULE 1
========================================== */

import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

/* ==========================================
   ELEMENTS
========================================== */

const backBtn = document.getElementById("backBtn");

const logoutBtn = document.getElementById("logoutBtn");

const personalInformationBtn =
document.getElementById("personalInformationBtn");

const userName =
document.getElementById("userName");

const userEmail =
document.getElementById("userEmail");

const userPoints =
document.getElementById("userPoints");

const userRewards =
document.getElementById("userRewards");

let currentUser = null;

/* ==========================================
   BACK BUTTON
========================================== */

backBtn?.addEventListener("click", () => {

    window.location.href = "dashboard.html";

});

/* ==========================================
   PERSONAL INFORMATION
========================================== */

personalInformationBtn?.addEventListener("click", () => {

    window.location.href =
    "personal-information.html";

});

/* ==========================================
   LOGOUT
========================================== */

logoutBtn?.addEventListener("click", async () => {

    try{

        await signOut(auth);

        window.location.href =
        "login.html";

    }

    catch(error){

        console.error(error);

    }

});

console.log("✅ Module 1 Loaded");
/* ==========================================
   MODULE 2
   LOAD USER PROFILE
========================================== */

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        window.location.href = "login.html";

        return;

    }

    currentUser = user;

    userEmail.textContent = user.email;

    try {

        const userRef = doc(
            db,
            "users",
            user.uid
        );

        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {

            const data = userSnap.data();

            userName.textContent =
                data.fullName || "NovaPay User";

            userPoints.textContent =
                `${data.points || 0} Points`;

            userRewards.textContent =
                `${data.rewards || 0} Rewards`;

        } else {

            userName.textContent = "NovaPay User";

            userPoints.textContent = "0 Points";

            userRewards.textContent = "0 Rewards";

        }

    } catch (error) {

        console.error("Profile Error:", error);

    }

});

console.log("✅ Module 2 Loaded");
/* ==========================================
   MODULE 3
   SETTINGS NAVIGATION
========================================== */

const menuItems = {

    loginPin: document.querySelector(
        'a[href="login-pin.html"]'
    ),

    transactionPin: document.querySelector(
        'a[href="transaction-pin.html"]'
    ),

    notifications: document.querySelector(
        'a[href="notifications.html"]'
    ),

    language: document.querySelector(
        'a[href="language.html"]'
    ),

    help: document.querySelector(
        'a[href="help.html"]'
    ),

    support: document.querySelector(
        'a[href="contact-support.html"]'
    ),

    privacy: document.querySelector(
        'a[href="privacy-policy.html"]'
    ),

    terms: document.querySelector(
        'a[href="terms.html"]'
    ),

    about: document.querySelector(
        'a[href="about.html"]'
    )

};

Object.values(menuItems).forEach(item => {

    if (!item) return;

    item.addEventListener("click", () => {

        console.log("Opening:", item.href);

    });

});

console.log("✅ Module 3 Loaded");