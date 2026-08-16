/* ==========================================
   NOVAPAY AIRTIME
   SECURE BACKEND VERSION
   ========================================== */

import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

/* ==========================================
   MODULE 1
   NETWORK
   ========================================== */

const backBtn =
    document.getElementById("backBtn");

const providers =
    document.querySelectorAll(".provider");

let selectedNetwork = "mtn";

backBtn.addEventListener("click", () => {
    history.back();
});

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
            "Selected network:",
            selectedNetwork
        );
    });
});

/* ==========================================
   MODULE 2
   PHONE + AMOUNT
   ========================================== */

const phoneInput =
    document.getElementById("phoneNumber");

const amountInput =
    document.getElementById("amount");

/* ---------- PHONE ---------- */

phoneInput.addEventListener("input", () => {

    phoneInput.value =
        phoneInput.value
            .replace(/\D/g, "")
            .slice(0, 11);

});

/* ---------- AMOUNT ---------- */

amountInput.addEventListener("input", () => {

    amountInput.value =
        amountInput.value
            .replace(/\D/g, "");

});

/* ---------- BLOCK INVALID KEYS ---------- */

["e", "E", "+", "-", "."].forEach(key => {

    amountInput.addEventListener(
        "keydown",
        event => {

            if (event.key === key) {
                event.preventDefault();
            }

        }
    );

});

/* ==========================================
   MODULE 3
   FIREBASE AUTH + WALLET
   ========================================== */

const walletBalance =
    document.getElementById("walletBalance");

let currentUser = null;

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        window.location.href =
            "login.html";

        return;
    }

    currentUser = user;

    await loadWallet();

});

/* ==========================================
   LOAD WALLET
   ========================================== */

async function loadWallet() {

    try {

        if (!currentUser) {
            return;
        }

        const userRef =
            doc(
                db,
                "users",
                currentUser.uid
            );

        const userSnap =
            await getDoc(userRef);

        if (!userSnap.exists()) {

            walletBalance.textContent =
                "₦0.00";

            return;
        }

        const userData =
            userSnap.data();

        const balance =
            Number(
                userData.walletBalance || 0
            );

        walletBalance.textContent =
            "₦" +
            balance.toLocaleString(
                "en-NG",
                {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                }
            );

    } catch (error) {

        console.error(
            "Wallet loading error:",
            error
        );

        walletBalance.textContent =
            "₦0.00";
    }
}

/* ==========================================
   MODULE 4
   BUY AIRTIME
   ========================================== */

const continueBtn =
    document.getElementById(
        "continueBtn"
    );

continueBtn.addEventListener(
    "click",
    async () => {

        const phone =
            phoneInput.value.trim();

        const amount =
            Number(amountInput.value);

        /* ----------------------------------
           AUTHENTICATION CHECK
           ---------------------------------- */

        if (!currentUser) {

            alert(
                "Your session has expired. Please login again."
            );

            window.location.href =
                "login.html";

            return;
        }

        /* ----------------------------------
           PHONE VALIDATION
           ---------------------------------- */

        if (!/^0\d{10}$/.test(phone)) {

            alert(
                "Enter a valid Nigerian phone number."
            );

            return;
        }

        /* ----------------------------------
           AMOUNT VALIDATION
           ---------------------------------- */

        if (
            !Number.isFinite(amount) ||
            amount < 50
        ) {

            alert(
                "Minimum airtime amount is ₦50."
            );

            return;
        }

        continueBtn.disabled = true;

        continueBtn.textContent =
            "Processing...";

        try {

            /* ------------------------------
               GET FIREBASE ID TOKEN
               ------------------------------ */

            const idToken =
                await currentUser.getIdToken();

            /* ------------------------------
               SEND SECURE REQUEST TO RENDER
               ------------------------------ */

            const response =
                await fetch(
                    "https://novapay-server.onrender.com/api/buy-airtime",
                    {
                        method: "POST",

                        headers: {

                            "Content-Type":
                                "application/json",

                            "Authorization":
                                `Bearer ${idToken}`

                        },

                        /*
                         * IMPORTANT:
                         *
                         * We DO NOT send uid.
                         *
                         * Render obtains the UID
                         * from the verified Firebase
                         * ID token.
                         */

                        body: JSON.stringify({

                            network:
                                selectedNetwork,

                            phone:
                                phone,

                            amount:
                                amount

                        })
                    }
                );

            /* ------------------------------
               READ RESPONSE
               ------------------------------ */

            const result =
                await response.json();

            /* ------------------------------
               HANDLE AUTHENTICATION ERROR
               ------------------------------ */

            if (response.status === 401) {

                alert(
                    "Your session has expired. Please login again."
                );

                window.location.href =
                    "login.html";

                return;
            }

            /* ------------------------------
               HANDLE OTHER ERRORS
               ------------------------------ */

            if (
                !response.ok ||
                !result.success
            ) {

                throw new Error(
                    result.message ||
                    "Airtime purchase failed."
                );
            }

            /* ------------------------------
               SUCCESS
               ------------------------------ */

            alert(
                "Airtime purchased successfully."
            );

            phoneInput.value = "";

            amountInput.value = "";

            /*
             * The backend returns the new
             * wallet balance after a successful
             * transaction.
             */
            if (
                typeof result.walletBalance ===
                "number"
            ) {

                walletBalance.textContent =
                    "₦" +
                    result.walletBalance
                        .toLocaleString(
                            "en-NG",
                            {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            }
                        );

            } else {

                await loadWallet();

            }

        } catch (error) {

            console.error(
                "Airtime purchase error:",
                error
            );

            alert(
                error.message ||
                "Purchase failed. Please try again."
            );

        } finally {

            continueBtn.disabled = false;

            continueBtn.textContent =
                "Continue";

        }

    }
);

console.log(
    "✅ NovaPay Secure Airtime Module Loaded"
);