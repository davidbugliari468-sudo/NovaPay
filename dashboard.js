window.onload = () => {
    window.scrollTo(0, 0);
};

// ======================================
// NOVAPAY DASHBOARD V2
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
// ELEMENTS
// ======================================

const userName = document.getElementById("userName");
const greetingText = document.getElementById("greetingText");

const walletBalance = document.getElementById("walletBalance");
const hideBalanceBtn = document.getElementById("hideBalance");

const supportBtn = document.getElementById("supportBtn");
const notificationBtn = document.getElementById("notificationBtn");
const profileBtn = document.getElementById("profileBtn");

const addMoneyBtn = document.getElementById("addMoneyBtn");
const historyBtn = document.getElementById("historyBtn");

const airtimeBtn = document.getElementById("airtimeBtn");
const dataBtn = document.getElementById("dataBtn");
const electricityBtn = document.getElementById("electricityBtn");
const tvBtn = document.getElementById("tvBtn");
const bettingBtn = document.getElementById("bettingBtn");
const moreBtn = document.getElementById("moreBtn");

const inviteBtn = document.getElementById("inviteBtn");

const viewAllTransactionsBtn =
document.getElementById("viewAllTransactionsBtn");

const walletBtn = document.getElementById("walletBtn");
const payBillsBtn = document.getElementById("payBillsBtn");
const profileNavBtn = document.getElementById("profileNavBtn");

const modal = document.getElementById("customModal");
const modalTitle = document.getElementById("modalTitle");
const modalMessage = document.getElementById("modalMessage");

// ======================================
// VARIABLES
// ======================================

let balance = 0;
let balanceVisible = true; 
// ======================================
// MODAL
// ======================================

function showModal(title, message){

    modalTitle.textContent = title;
    modalMessage.textContent = message;
    modal.style.display = "flex";

}

window.closeModal = () => {

    modal.style.display = "none";

};

modal?.addEventListener("click",(e)=>{

    if(e.target===modal){

        closeModal();

    }

});

// ======================================
// FORMAT MONEY
// ======================================

function formatMoney(amount){

    return "₦" + Number(amount).toLocaleString("en-NG",{
        minimumFractionDigits:2,
        maximumFractionDigits:2
    });

}

// ======================================
// GREETING
// ======================================

function updateGreeting(){

    const hour = new Date().getHours();

    if(hour < 12){

        greetingText.textContent = "☀️ Good Morning";

    }else if(hour < 18){

        greetingText.textContent = "🌤 Good Afternoon";

    }else{

        greetingText.textContent = "🌙 Good Evening";

    }

}

updateGreeting();

// ======================================
// HIDE / SHOW BALANCE
// ======================================

hideBalanceBtn?.addEventListener("click",()=>{

    balanceVisible = !balanceVisible;

    if(balanceVisible){

        walletBalance.textContent = formatMoney(balance);
        hideBalanceBtn.innerHTML =
        `Hide <i class="fa-regular fa-eye"></i>`;

    }else{

        walletBalance.textContent = "••••••";
        hideBalanceBtn.innerHTML =
        `Show <i class="fa-regular fa-eye-slash"></i>`;

    }

}); 
// ======================================
// LOAD USER
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

            if (balanceVisible) {

                walletBalance.textContent =
                    formatMoney(balance);

            }

        } else {

            userName.textContent =
                user.email.split("@")[0];

            balance = 0;

            walletBalance.textContent =
                formatMoney(balance);

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
// NAVIGATION
// ======================================

profileBtn?.addEventListener("click", () => {

    window.location.href = "profile.html";

});

profileNavBtn?.addEventListener("click", () => {

    window.location.href = "profile.html";

});

addMoneyBtn?.addEventListener("click", () => {

    window.location.href = "add-money.html";

});

historyBtn?.addEventListener("click", () => {

    window.location.href = "transaction-history.html";

});

viewAllTransactionsBtn?.addEventListener("click", () => {

    window.location.href = "transaction-history.html";

});

// ======================================
// HEADER
// ======================================

supportBtn?.addEventListener("click", () => {

    showModal(
        "Live Support",
        "Live Support will be available in a future NovaPay update."
    );

});

notificationBtn?.addEventListener("click", () => {

    window.location.href = "notifications.html";

});
// ======================================
// BOTTOM NAVIGATION
// ======================================

walletBtn?.addEventListener("click", () => {

    showModal(
        "Wallet",
        "Wallet page is coming soon."
    );

});

payBillsBtn?.addEventListener("click", () => {

    

}); 
// ======================================
// QUICK SERVICES
// ======================================

function comingSoon(feature){

    showModal(
        feature,
        `${feature} will be available in a future NovaPay update.`
    );

}

airtimeBtn?.addEventListener("click", () => {

    window.location.href = "airtime.html";

});

dataBtn?.addEventListener("click", () => {

    window.location.href = "data.html";

});

electricityBtn?.addEventListener("click", () => {

    comingSoon("Electricity");

});

tvBtn?.addEventListener("click", () => {

    comingSoon("TV Subscription");

});

bettingBtn?.addEventListener("click", () => {

    comingSoon("Betting");

});

moreBtn?.addEventListener("click", () => {

    comingSoon("More Services");

});

inviteBtn?.addEventListener("click", () => {

    comingSoon("Invite & Earn");

}); 
// ======================================
// RECENT TRANSACTIONS
// ======================================

// This will be connected to Firebase
// in the next rebuild.

const recentTransactionsContainer =
document.getElementById("recentTransactionsContainer");

// ======================================
// DASHBOARD READY
// ======================================

console.log("✅ NovaPay Dashboard V2 Loaded");