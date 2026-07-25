// ======================================
// NovaPay Dashboard
// Part 1
// ======================================

import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

// ======================================
// Elements
// ======================================

const userName = document.getElementById("userName");
const walletBalance = document.getElementById("walletBalance");
const hideBalanceBtn = document.getElementById("hideBalance");
const completeProfileCard = document.getElementById("completeProfileCard");

const modal = document.getElementById("customModal");
const modalTitle = document.getElementById("modalTitle");
const modalMessage = document.getElementById("modalMessage");

// ======================================
// Variables
// ======================================

let balance = 0;
let balanceVisible = true;

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

};

// ======================================
// Currency Formatter
// ======================================

function formatMoney(amount) {

    return "₦" + Number(amount).toLocaleString("en-NG", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

}

// ======================================
// Hide / Show Balance
// ======================================

hideBalanceBtn.addEventListener("click", () => {

    balanceVisible = !balanceVisible;

    if (balanceVisible) {

        walletBalance.textContent = formatMoney(balance);
        hideBalanceBtn.textContent = "Hide";

    } else {

        walletBalance.textContent = "••••••";
        hideBalanceBtn.textContent = "Show";

    }

});

// ======================================
// Load User
// ======================================

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        window.location.href = "login.html";
        return;

    }

    try {

        const userRef = doc(db, "users", user.uid);

        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {

            const data = userSnap.data();

            userName.textContent =
                data.fullName || user.email.split("@")[0];

            balance = data.walletBalance || 0;

            walletBalance.textContent =
                formatMoney(balance);

            if (data.profileCompleted === true) {

                completeProfileCard.style.display = "none";

            }

        } else {

            userName.textContent =
                user.email.split("@")[0];

            walletBalance.textContent =
                formatMoney(0);

            completeProfileCard.style.display = "block";

        }

    } catch (error) {

        console.error(error);

        showModal(
            "Dashboard Error",
            error.message
        );

    }

}); 
// ======================================
// Dashboard Buttons
// ======================================

const profileBtn = document.getElementById("profileBtn");
const supportBtn = document.getElementById("supportBtn");
const notificationBtn = document.getElementById("notificationBtn");

const historyBtn = document.getElementById("historyBtn");
const addMoneyBtn = document.getElementById("addMoneyBtn");
const completeProfileBtn = document.getElementById("completeProfileBtn");

const inviteBtn = document.getElementById("inviteBtn");
const cardsBtn = document.getElementById("cardsBtn");

const airtimeBtn = document.getElementById("airtimeBtn");
const dataBtn = document.getElementById("dataBtn");
const tvBtn = document.getElementById("tvBtn");
const electricityBtn = document.getElementById("electricityBtn");
const bettingBtn = document.getElementById("bettingBtn");
const pocketBtn = document.getElementById("pocketBtn");

const walletBtn = document.getElementById("walletBtn");
const historyNavBtn = document.getElementById("historyNavBtn");
const profileNavBtn = document.getElementById("profileNavBtn");

// ======================================
// Coming Soon
// ======================================

function comingSoon(feature) {

    showModal(
        feature,
        `${feature} will be available in a future NovaPay update.`
    );

}

// ======================================
// Navigation
// ======================================

profileBtn?.addEventListener("click", () => {
    window.location.href = "profile.html";
});

profileNavBtn?.addEventListener("click", () => {
    window.location.href = "profile.html";
});

completeProfileBtn?.addEventListener("click", () => {
    window.location.href = "profile.html";
});

// ======================================
// Wallet
// ======================================

addMoneyBtn.addEventListener("click", () => {
    window.location.href = "add-money.html";
});

historyBtn?.addEventListener("click", () => {
    window.location.href = "transaction-history.html";
});

walletBtn?.addEventListener("click", () => {
    comingSoon("Wallet");
});

historyBtn?.addEventListener("click", () => {
    window.location.href = "transaction-history.html";
});

// ======================================
// Header
// ======================================

supportBtn?.addEventListener("click", () => {
    comingSoon("Live Support");
});

notificationBtn?.addEventListener("click", () => {
    comingSoon("Notifications");
});

// ======================================
// Cards
// ======================================

inviteBtn?.addEventListener("click", () => {
    comingSoon("Invite & Earn");
});

cardsBtn?.addEventListener("click", () => {
    comingSoon("Virtual Cards");
});

// ======================================
// Services
// ======================================

airtimeBtn?.addEventListener("click", () => {
    comingSoon("Airtime");
});

dataBtn?.addEventListener("click", () => {
    comingSoon("Data");
});

tvBtn?.addEventListener("click", () => {
    comingSoon("TV Subscription");
});

electricityBtn?.addEventListener("click", () => {
    comingSoon("Electricity Bills");
});

bettingBtn?.addEventListener("click", () => {
    comingSoon("Betting");
});

pocketBtn?.addEventListener("click", () => {
    comingSoon("Smart Pocket");
});

// ======================================
// Close Modal
// ======================================

modal?.addEventListener("click", (event) => {

    if (event.target === modal) {
        window.closeModal();
    }

});

console.log("✅ NovaPay Dashboard Loaded");