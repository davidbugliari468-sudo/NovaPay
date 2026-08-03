/* ==========================================
NOVAPAY AIRTIME
MODULE 1
========================================== */

const backBtn =
document.getElementById("backBtn");

const providers =
document.querySelectorAll(".provider");

let selectedNetwork = "mtn";

/* ==========================================
BACK
========================================== */

backBtn.addEventListener("click", () => {

    history.back();

});

/* ==========================================
NETWORK
========================================== */

providers.forEach(card => {

    if (card.dataset.network === "mtn") {

        card.classList.add("active");

    }

    card.addEventListener("click", () => {

        providers.forEach(item => {

            item.classList.remove("active");

        });

        card.classList.add("active");

        selectedNetwork =
            card.dataset.network;

        console.log(
            "Selected:",
            selectedNetwork
        );

    });

});

console.log("✅ Module 1 Loaded");
/* ==========================================
MODULE 2
PHONE + AMOUNT
========================================== */

const phoneInput =
document.getElementById("phoneNumber");

const amountInput =
document.getElementById("amount");

/* ========= PHONE ========= */

phoneInput.addEventListener("input", () => {

    phoneInput.value =
        phoneInput.value
        .replace(/\D/g, "")
        .slice(0, 11);

});

/* ========= AMOUNT ========= */

amountInput.addEventListener("input", () => {

    amountInput.value =
        amountInput.value
        .replace(/\D/g, "");

});

/* ========= BLOCK INVALID KEYS ========= */

["e","E","+","-","."].forEach(key => {

    amountInput.addEventListener("keydown", event => {

        if (event.key === key) {

            event.preventDefault();

        }

    });

});

console.log("✅ Module 2 Loaded");
/* ==========================================
MODULE 3
FIREBASE + WALLET
========================================== */

import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const walletBalance =
document.getElementById("walletBalance");

let currentUser = null;

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        window.location.href = "login.html";

        return;

    }

    currentUser = user;

    await loadWallet();

});

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

        const userData =
            userSnap.data();

        walletBalance.textContent =
            "₦" +
            Number(
                userData.walletBalance || 0
            ).toLocaleString("en-NG", {

                minimumFractionDigits: 2,
                maximumFractionDigits: 2

            });

    } catch (error) {

        console.error("Wallet Error:", error);

        walletBalance.textContent = "₦0.00";

    }

}

console.log("✅ Module 3 Loaded");
/* ==========================================
MODULE 4
BUY AIRTIME
========================================== */

const continueBtn =
document.getElementById("continueBtn");

continueBtn.addEventListener("click", async () => {

    const phone =
        phoneInput.value.trim();

    const amount =
        Number(amountInput.value);

    if (phone.length !== 11) {

        alert("Enter a valid phone number.");

        return;

    }

    if (amount < 50) {

        alert("Minimum airtime amount is ₦50.");

        return;

    }

    continueBtn.disabled = true;

    continueBtn.textContent = "Processing...";

    try {

        const response =
            await fetch(
                "https://novapay-server.onrender.com/api/buy-airtime",
                {

                    method: "POST",

                    headers: {

                        "Content-Type":"application/json"

                    },

                    body: JSON.stringify({

                        uid: currentUser.uid,

                        network: selectedNetwork,

                        phone,

                        amount

                    })

                }
            );

        const result =
            await response.json();

        if (!result.success) {

            throw new Error(
                result.message
            );

        }

        alert("Airtime purchased successfully.");

        phoneInput.value = "";

        amountInput.value = "";

        await loadWallet();

    } catch (error) {

        alert(
            error.message ||
            "Purchase failed."
        );

    }

    continueBtn.disabled = false;

    continueBtn.textContent = "Continue";

});

console.log("✅ Module 4 Loaded");