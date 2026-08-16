// ======================================
// NovaPay Add Money
// Secure Backend Version
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

const backBtn =
    document.getElementById("backBtn");

const walletBalance =
    document.getElementById("walletBalance");

const amountInput =
    document.getElementById("amount");

const continueBtn =
    document.getElementById("continueBtn");

const modal =
    document.getElementById("customModal");

const modalTitle =
    document.getElementById("modalTitle");

const modalMessage =
    document.getElementById("modalMessage");

const quickButtons =
    document.querySelectorAll(".quickBtn");

// ======================================
// Variables
// ======================================

let currentUser = null;
let balance = 0;

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
// Format Money
// ======================================

function formatMoney(amount) {

    return "₦" +
        Number(amount).toLocaleString("en-NG", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
}

// ======================================
// Authentication
// ======================================

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        window.location.href = "login.html";
        return;
    }

    currentUser = user;

    try {

        const userRef =
            doc(db, "users", user.uid);

        const userSnap =
            await getDoc(userRef);

        if (userSnap.exists()) {

            const userData =
                userSnap.data();

            balance =
                userData.walletBalance || 0;

            walletBalance.textContent =
                formatMoney(balance);
        }

    } catch (error) {

        console.error(
            "Wallet loading error:",
            error
        );

        showModal(
            "Error",
            "Unable to load your wallet."
        );
    }
});

// ======================================
// Quick Amount Buttons
// ======================================

quickButtons.forEach(button => {

    button.addEventListener("click", () => {

        amountInput.value =
            button.dataset.amount;
    });

});

// ======================================
// Continue / Create Payment
// ======================================

continueBtn.addEventListener(
    "click",
    async () => {

        const amount =
            Number(amountInput.value);

        // ------------------------------
        // Validate amount
        // ------------------------------

        if (!amount || amount < 100) {

            showModal(
                "Invalid Amount",
                "Minimum funding amount is ₦100."
            );

            return;
        }

        // ------------------------------
        // Check authentication
        // ------------------------------

        if (!currentUser) {

            showModal(
                "Authentication Error",
                "Please login again."
            );

            return;
        }

        continueBtn.disabled = true;
        continueBtn.textContent =
            "Please wait...";

        try {

            // --------------------------
            // Get Firebase ID token
            // --------------------------

            const idToken =
                await currentUser.getIdToken();

            // --------------------------
            // Send secure request
            // --------------------------

            const response =
                await fetch(
                    "https://novapay-server.onrender.com/api/create-payment",
                    {
                        method: "POST",

                        headers: {

                            "Content-Type":
                                "application/json",

                            "Authorization":
                                `Bearer ${idToken}`
                        },

                        // IMPORTANT:
                        // We intentionally do NOT send
                        // uid, customerEmail or
                        // customerName here.
                        //
                        // The Render backend obtains
                        // the authenticated user's
                        // identity from Firebase.

                        body: JSON.stringify({

                            amount: amount

                        })
                    }
                );

            const data =
                await response.json();

            // --------------------------
            // Handle backend response
            // --------------------------

            if (
                !response.ok ||
                !data.success
            ) {

                throw new Error(
                    data.message ||
                    "Unable to create payment."
                );
            }

            // --------------------------
            // Open Monnify checkout
            // --------------------------

            if (!data.checkoutUrl) {

                throw new Error(
                    "Payment checkout link was not received."
                );
            }

            window.location.href =
                data.checkoutUrl;

        } catch (error) {

            console.error(
                "Payment error:",
                error
            );

            showModal(
                "Payment Error",
                error.message ||
                "Unable to connect to payment server."
            );

        } finally {

            continueBtn.disabled = false;

            continueBtn.textContent =
                "Continue";
        }
    }
);

// ======================================
// Back
// ======================================

backBtn.addEventListener(
    "click",
    () => {

        window.location.href =
            "dashboard.html";
    }
);