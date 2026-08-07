/* ==========================================
   NOVAPAY BETTING
   MODULE 1
========================================== */

import { auth, db } from "./firebase.js";

const backBtn =
document.getElementById("backBtn");

const providers =
document.querySelectorAll(".provider");

const verifyAccountBtn =
document.getElementById("verifyAccountBtn");

const accountCard =
document.getElementById("accountCard");

const amountSection =
document.getElementById("amountSection");

const continueBtn =
document.getElementById("continueBtn");

const accountName =
document.getElementById("accountName");

const accountProvider =
document.getElementById("accountProvider");

const accountStatus =
document.getElementById("accountStatus");

let selectedProvider = "bet9ja";

/* ==========================================
BACK BUTTON
========================================== */

backBtn?.addEventListener("click", () => {

    window.location.href =
    "dashboard.html";

});

/* ==========================================
BETTING PROVIDER
========================================== */

providers.forEach(provider => {

    provider.addEventListener("click", () => {

        providers.forEach(item =>
            item.classList.remove("active")
        );

        provider.classList.add("active");

        selectedProvider =
        provider.dataset.provider;

    });

});

console.log("✅ Betting Module 1 Loaded");
/* ==========================================
   MODULE 2
   VERIFY ACCOUNT
========================================== */

const customerId =
document.getElementById("customerId");

const amount =
document.getElementById("amount");

const walletBalance =
document.getElementById("walletBalance");

verifyAccountBtn.addEventListener("click", () => {

    const customer =
    customerId.value.trim();

    if (!customer) {

        alert("Please enter your Customer ID.");

        return;

    }

    verifyAccountBtn.disabled = true;

    verifyAccountBtn.textContent =
    "Verifying...";

    setTimeout(() => {

        accountName.textContent =
        "John Anderson";

        accountProvider.textContent =
        selectedProvider.toUpperCase();

        accountStatus.textContent =
        "Active";

        accountCard.classList.remove("hidden");

        amountSection.classList.remove("hidden");

        continueBtn.classList.remove("hidden");

        walletBalance.textContent =
        "₦0.00";

        verifyAccountBtn.disabled = false;

        verifyAccountBtn.textContent =
        "Verified ✓";

    },1500);

});

console.log("✅ Betting Module 2 Loaded");
/* ==========================================
   MODULE 3
   CONTINUE PAYMENT
========================================== */

continueBtn.addEventListener("click", () => {

    const customer = customerId.value.trim();

    const amountValue = amount.value.trim();

    if (!customer) {

        alert("Please enter your Customer ID.");

        return;

    }

    if (!amountValue) {

        alert("Please enter an amount.");

        return;

    }

    const payment = {

        provider: selectedProvider,

        customerId: customer,

        accountName: accountName.textContent,

        accountStatus: accountStatus.textContent,

        amount: amountValue

    };

    console.log("Betting Payment");

    console.log(payment);

    alert("Betting payment is ready for API connection.");

});

console.log("✅ Betting Module 3 Loaded");