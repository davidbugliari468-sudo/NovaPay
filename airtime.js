/* ==========================================
NOVAPAY AIRTIME
Clean Version
========================================== */

import { auth, db } from "./firebase-config.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

/* ==========================================
BACKEND
========================================== */

const API_URL = "https://novapay-server.onrender.com";

/* ==========================================
ELEMENTS
========================================== */

const backBtn = document.getElementById("backBtn");
const continueBtn = document.getElementById("continueBtn");

const phoneInput = document.getElementById("phoneNumber");
const amountInput = document.getElementById("amount");

const walletBalance = document.getElementById("walletBalance");

const loadingOverlay = document.getElementById("loadingOverlay");
const messageBox = document.getElementById("messageBox");

const beneficiaryBtn = document.getElementById("beneficiaryBtn");

const providers = document.querySelectorAll(".provider");

/* ==========================================
STATE
========================================== */

let currentUser = null;
let selectedNetwork = "mtn";

/* ==========================================
UTILITIES
========================================== */

function showLoading() {
    loadingOverlay.classList.remove("hidden");
}

function hideLoading() {
    loadingOverlay.classList.add("hidden");
}

function showMessage(text) {

    messageBox.textContent = text;

    messageBox.classList.remove("hidden");

    setTimeout(() => {

        messageBox.classList.add("hidden");

    },3000);

} 
/* ==========================================
AUTH
========================================== */

auth.onAuthStateChanged(async (user) => {

    hideLoading();

    if (!user) {

        window.location.href = "login.html";

        return;

    }

    currentUser = user;

    await loadWallet();

    setupNetworks();

});

/* ==========================================
LOAD WALLET
========================================== */

async function loadWallet() {

    try {

        const userRef =
            doc(db, "users", currentUser.uid);

        const userSnap =
            await getDoc(userRef);

        if (!userSnap.exists()) {

            walletBalance.textContent = "₦0.00";

            return;

        }

        const data =
            userSnap.data();

        walletBalance.textContent =
            "₦" +
            Number(
                data.walletBalance || 0
            ).toLocaleString("en-NG", {

                minimumFractionDigits: 2,
                maximumFractionDigits: 2

            });

    } catch (error) {

        console.error(error);

        showMessage(
            "Unable to load wallet balance."
        );

    }

} 
/* ==========================================
NETWORK
========================================== */

function setupNetworks() {

    providers.forEach(card => {

        if (card.dataset.network === "mtn") {

            card.classList.add("active");

        } else {

            card.classList.remove("active");

        }

        card.addEventListener("click", () => {

            providers.forEach(item =>
                item.classList.remove("active")
            );

            card.classList.add("active");

            selectedNetwork =
                card.dataset.network;

        });

    });

}

/* ==========================================
BACK BUTTON
========================================== */

backBtn.addEventListener("click", () => {

    history.back();

});

/* ==========================================
BENEFICIARIES
========================================== */

beneficiaryBtn.addEventListener("click", () => {

    showMessage(
        "Beneficiaries coming soon."
    );

}); 
/* ==========================================
PHONE INPUT
========================================== */

phoneInput.addEventListener("input", () => {

    phoneInput.value = phoneInput.value
        .replace(/\D/g, "")
        .slice(0, 11);

});

/* ==========================================
AMOUNT INPUT
========================================== */

amountInput.addEventListener("input", () => {

    amountInput.value = amountInput.value
        .replace(/\D/g, "");

});

amountInput.addEventListener("keydown", (event) => {

    if (["e", "E", "+", "-", "."].includes(event.key)) {

        event.preventDefault();

    }

});

phoneInput.addEventListener("keydown", (event) => {

    if (["e", "E", "+", "-", "."].includes(event.key)) {

        event.preventDefault();

    }

});

/* ==========================================
VALIDATION
========================================== */

function validateForm() {

    const phone = phoneInput.value.trim();

    const amount = Number(amountInput.value);

    if (phone.length !== 11) {

        return "Enter a valid 11-digit phone number.";

    }

    if (!amount || amount < 50) {

        return "Minimum airtime amount is ₦50.";

    }

    return null;

} 
/* ==========================================
BUY AIRTIME
========================================== */

continueBtn.addEventListener("click", async () => {

    const error = validateForm();

    if (error) {

        showMessage(error);

        return;

    }

    try {

        showLoading();

        continueBtn.disabled = true;

        const response = await fetch(

            `${API_URL}/api/buy-airtime`,

            {

                method: "POST",

                headers: {

                    "Content-Type": "application/json"

                },

                body: JSON.stringify({

                    uid: currentUser.uid,

                    network: selectedNetwork,

                    phone: phoneInput.value.trim(),

                    amount: Number(amountInput.value)

                })

            }

        );

        const result = await response.json();

        if (!response.ok || !result.success) {

            throw new Error(

                result.message || "Purchase failed."

            );

        }

        showMessage("Airtime purchased successfully.");

        phoneInput.value = "";

        amountInput.value = "";

        await loadWallet();

    } catch (error) {

        console.error(error);

        showMessage(

            error.message || "Unable to purchase airtime."

        );

    } finally {

        hideLoading();

        continueBtn.disabled = false;

    }

});

console.log("✅ NovaPay Airtime Ready");