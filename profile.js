// ======================================
// NovaPay Profile
// Part 1
// ======================================

import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import {
    doc,
    getDoc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

// ======================================
// Elements
// ======================================

const profileForm = document.getElementById("profileForm");
const fullName = document.getElementById("fullName");
const phone = document.getElementById("phone");
const email = document.getElementById("email");
const saveBtn = document.getElementById("saveBtn");
const backBtn = document.getElementById("backBtn");

const modal = document.getElementById("customModal");
const modalTitle = document.getElementById("modalTitle");
const modalMessage = document.getElementById("modalMessage");

let currentUser = null;

// ======================================
// Modal
// ======================================

function showModal(title, message) {

    modalTitle.textContent = title;
    modalMessage.textContent = message;
    modal.style.display = "flex";

}

window.closeModal = function () {

    modal.style.display = "none";

    if (modalTitle.textContent === "🎉 Profile Completed") {

        window.location.href = "dashboard.html";

    }

};

// ======================================
// Authentication
// ======================================

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        window.location.href = "login.html";
        return;

    }

    currentUser = user;

    email.value = user.email;

    try {

        const userRef = doc(db, "users", user.uid);

        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {

            const data = userSnap.data();

            fullName.value = data.fullName || "";
            phone.value = data.phone || "";

        }

    } catch (error) {

        console.error(error);

        showModal(
            "Error",
            error.message
        );

    }

}); 
// ======================================
// Save Profile
// ======================================

profileForm.addEventListener("submit", async (e) => {

    e.preventDefault();

    if (!currentUser) {
        showModal("Error", "No user is currently signed in.");
        return;
    }

    const name = fullName.value.trim();
    const phoneNumber = phone.value.trim();

    if (name.length < 3) {
        showModal(
            "Full Name Required",
            "Please enter your full name."
        );
        return;
    }

    if (!/^0\d{10}$/.test(phoneNumber)) {
        showModal(
            "Invalid Phone Number",
            "Please enter a valid 11-digit Nigerian phone number."
        );
        return;
    }

    saveBtn.disabled = true;
    saveBtn.textContent = "Saving...";

    try {

        const userRef = doc(db, "users", currentUser.uid);

        const existing = await getDoc(userRef);

        let balance = 0;

        if (existing.exists()) {
            balance = existing.data().balance || 0;
        }

        await setDoc(userRef, {

            uid: currentUser.uid,
            fullName: name,
            phone: phoneNumber,
            email: currentUser.email,
            balance: balance,
            profileCompleted: true,
            createdAt: existing.exists()
                ? existing.data().createdAt || serverTimestamp()
                : serverTimestamp(),
            updatedAt: serverTimestamp()

        }, { merge: true });

        saveBtn.textContent = "Saved";

        showModal(
            "🎉 Profile Completed",
            "Your profile has been completed successfully.\n\nWelcome to NovaPay! You can now enjoy all available features.\n\nTap OK to continue to your dashboard."
        );

    } catch (error) {

        console.error(error);

        saveBtn.disabled = false;
        saveBtn.textContent = "Save Profile";

        showModal(
            "Error",
            error.message
        );

    }

});

// ======================================
// Back Button
// ======================================

backBtn.addEventListener("click", () => {

    window.location.href = "dashboard.html";

});