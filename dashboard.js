window.onload = () => {

    window.scrollTo(0, 0);

};
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
const greetingText = document.getElementById("greetingText");

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
// Greeting
// ======================================

function updateGreeting() {

    const hour = new Date().getHours();

    if (hour < 12) {

        greetingText.textContent = "☀️ Good Morning";

    } else if (hour < 18) {

        greetingText.textContent = "🌤 Good Afternoon";

    } else {

        greetingText.textContent = "🌙 Good Evening";

    }

}

updateGreeting();
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

} else {

    userName.textContent =
        user.email.split("@")[0];

    walletBalance.textContent =
        formatMoney(0);

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

const payBillsBtn = document.getElementById("payBillsBtn");
const addMoneyBtn = document.getElementById("addMoneyBtn");

const inviteBtn = document.getElementById("inviteBtn");
const moreBtn = document.getElementById("moreBtn");

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


// ======================================
// Wallet
// ======================================

addMoneyBtn.addEventListener("click", () => {
    window.location.href = "add-money.html";
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

moreBtn?.addEventListener("click", () => {
    comingSoon("More Services");
});

// ======================================
// Services
// ======================================

airtimeBtn?.addEventListener("click", () => {
    window.location.href = "airtime.html";
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