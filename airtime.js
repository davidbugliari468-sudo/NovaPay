/* ==========================================
NOVAPAY AIRTIME
PART 1
========================================== */

import { auth, db } from "./firebase-config.js";

import {

    doc,
    getDoc

} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

const API_URL =
"https://novapay-server.onrender.com";

/* ==========================================
ELEMENTS
========================================== */

const backBtn =
document.getElementById("backBtn");

const continueBtn =
document.getElementById("continueBtn");

const phoneInput =
document.getElementById("phoneNumber");

const amountInput =
document.getElementById("amount");

const walletBalance =
document.getElementById("walletBalance");

const airtimeMessage =
document.getElementById("airtimeMessage");

const beneficiaryBtn =
document.querySelector(".beneficiary-btn");

const networkCards =
document.querySelectorAll(".network-card");

/* ==========================================
STATE
========================================== */

let currentUser = null;

let selectedNetwork = "mtn";

/* ==========================================
BACK
========================================== */

backBtn.addEventListener("click", () => {

    history.back();

});
/* ==========================================
AUTH
========================================== */

auth.onAuthStateChanged(async (user) => {

    if (!user) {

        window.location.href = "login.html";

        return;

    }

    currentUser = user;

    loadWalletBalance();

});

/* ==========================================
LOAD WALLET
========================================== */

async function loadWalletBalance() {

    try {

        const userRef =
            doc(db, "users", currentUser.uid);

        const userSnap =
            await getDoc(userRef);

        if (!userSnap.exists()) return;

        const userData =
            userSnap.data();

        walletBalance.textContent =
            "₦" + Number(
                userData.walletBalance || 0
            ).toLocaleString();

    } catch (error) {

        console.error(error);

        airtimeMessage.textContent =
            "Unable to load wallet balance.";

    }

} 
/* ==========================================
NETWORK
========================================== */

networkCards.forEach(card => {

    if (card.dataset.network.toLowerCase() === "mtn") {

        card.classList.add("active");

    } else {

        card.classList.remove("active");

    }

    card.addEventListener("click", () => {

        networkCards.forEach(item =>
            item.classList.remove("active")
        );

        card.classList.add("active");

        selectedNetwork =
            card.dataset.network.toLowerCase();

        airtimeMessage.textContent = "";

    });

});

/* ==========================================
PHONE
========================================== */

phoneInput.addEventListener("input", () => {

    phoneInput.value =
        phoneInput.value.replace(/\D/g, "");

    if (phoneInput.value.length > 11) {

        phoneInput.value =
            phoneInput.value.slice(0, 11);

    }

});

/* ==========================================
AMOUNT
========================================== */

amountInput.addEventListener("input", () => {

    amountInput.value =
        amountInput.value.replace(/\D/g, "");

});

/* ==========================================
BENEFICIARIES
========================================== */

beneficiaryBtn.addEventListener("click", () => {

    airtimeMessage.textContent =
        "Beneficiaries coming soon.";

});

/* ==========================================
VALIDATION
========================================== */

function validateForm() {

    const phone =
        phoneInput.value.trim();

    const amount =
        Number(amountInput.value);

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

    airtimeMessage.textContent = "";
    airtimeMessage.classList.remove("success");

    const validationError = validateForm();

    if (validationError) {

        airtimeMessage.textContent = validationError;

        return;

    }

    try {

        continueBtn.disabled = true;

        continueBtn.textContent = "Processing...";

        const response = await fetch(

            `${API_URL}/api/buy-airtime`,

            {

                method: "POST",

                headers: {

                    "Content-Type": "application/json"

                },

                body: JSON.stringify({

                    uid: currentUser.uid,

                    phone: phoneInput.value.trim(),

                    network: selectedNetwork,

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

        airtimeMessage.classList.add("success");

        airtimeMessage.textContent =
            "Airtime purchased successfully.";

        amountInput.value = "";

        phoneInput.value = "";

        await loadWalletBalance();

    } catch (error) {

        console.error(error);

        airtimeMessage.classList.remove("success");

        airtimeMessage.textContent =
            error.message;

    } finally {

        continueBtn.disabled = false;

        continueBtn.textContent = "Continue";

    }

});

console.log("✅ NovaPay Airtime Ready");