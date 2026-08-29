// ======================================
// NovaPay Add Money
// Secure Backend Version
// ======================================

import { auth } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

// ======================================
// API
// ======================================

const API_BASE_URL =
    "https://novapay-server.onrender.com";

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

    if (modalTitle) {

        modalTitle.textContent =
            title;

    }

    if (modalMessage) {

        modalMessage.textContent =
            message;

    }

    if (modal) {

        modal.style.display =
            "flex";

    }

}


window.closeModal = function () {

    if (modal) {

        modal.style.display =
            "none";

    }

};


// ======================================
// Format Money
// ======================================

function formatMoney(amount) {

    const numericAmount =
        Number(amount);

    const safeAmount =
        Number.isFinite(numericAmount)
            ? numericAmount
            : 0;

    return (
        "₦" +
        safeAmount.toLocaleString(
            "en-NG",
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }
        )
    );

}


// ======================================
// KOBO → NAIRA
// ======================================

function koboToNaira(amountKobo) {

    const numericKobo =
        Number(amountKobo);

    if (
        !Number.isSafeInteger(
            numericKobo
        ) ||
        numericKobo < 0
    ) {

        throw new Error(
            "Invalid wallet balance received from server."
        );

    }

    return (
        numericKobo / 100
    );

}


// ======================================
// LOAD WALLET FROM SECURE BACKEND
// ======================================
//
// IMPORTANT:
//
// The frontend does NOT read
// walletBalance from Firestore.
//
// Firebase authentication provides
// the ID token.
//
// The backend verifies the token,
// identifies the user and returns
// the authoritative wallet balance.
// ======================================

async function loadWalletBalance(user) {

    if (!user) {

        throw new Error(
            "Authentication required."
        );

    }


    const idToken =
        await Promise.race([

            user.getIdToken(),

            new Promise(
                (_, reject) => {

                    setTimeout(
                        () => {

                            reject(
                                new Error(
                                    "Authentication token request timed out."
                                )
                            );

                        },
                        8000
                    );

                }
            )

        ]);


    const controller =
        new AbortController();


    const timeoutId =
        setTimeout(
            () => {

                controller.abort();

            },
            8000
        );


    let response;


    try {

        response =
            await fetch(
                `${API_BASE_URL}/api/wallet`,
                {

                    method:
                        "GET",

                    headers: {

                        "Authorization":
                            `Bearer ${idToken}`,

                        "Accept":
                            "application/json"

                    },

                    cache:
                        "no-store",

                    signal:
                        controller.signal

                }
            );

    }

    catch (error) {

        if (
            error?.name ===
            "AbortError"
        ) {

            throw new Error(
                "Wallet server timed out."
            );

        }

        throw error;

    }

    finally {

        clearTimeout(
            timeoutId
        );

    }


    let result;


    try {

        result =
            await response.json();

    }

    catch {

        throw new Error(
            "Invalid response from NovaPay wallet server."
        );

    }


    if (
        !response.ok
    ) {

        throw new Error(
            result?.error ||
            result?.message ||
            `Wallet server error (${response.status}).`
        );

    }


    if (
        !result?.success ||
        !result?.wallet
    ) {

        throw new Error(
            result?.error ||
            result?.message ||
            "Unable to load wallet balance."
        );

    }


    const balanceKobo =
        Number(
            result.wallet.balanceKobo
        );


    balance =
        koboToNaira(
            balanceKobo
        );


    if (walletBalance) {

        walletBalance.textContent =
            formatMoney(balance);

    }


    return balance;

}


// ======================================
// AUTHENTICATION
// ======================================

onAuthStateChanged(
    auth,
    async (user) => {

        if (!user) {

            window.location.href =
                "login.html";

            return;

        }


        currentUser =
            user;


        try {

            await loadWalletBalance(
                user
            );

        }

        catch (error) {

            console.error(
                "NovaPay wallet loading error:",
                error
            );


            balance =
                0;


            if (walletBalance) {

                walletBalance.textContent =
                    "₦0.00";

            }


            showModal(
                "Wallet Error",
                error.message ||
                "Unable to load your wallet."
            );

        }

    }
);


// ======================================
// QUICK AMOUNT BUTTONS
// ======================================

quickButtons.forEach(
    button => {

        button.addEventListener(
            "click",
            () => {

                if (!amountInput) {

                    return;

                }


                const amount =
                    button.dataset.amount;


                amountInput.value =
                    amount;

            }
        );

    }
);


// ======================================
// CONTINUE / CREATE PAYMENT
// ======================================

continueBtn?.addEventListener(
    "click",
    async () => {

        const amount =
            Number(
                amountInput?.value
            );


        // ------------------------------
        // Validate amount
        // ------------------------------

        if (
            !Number.isFinite(amount) ||
            amount < 100
        ) {

            showModal(
                "Invalid Amount",
                "Minimum funding amount is ₦100."
            );

            return;

        }


        // ------------------------------
        // Validate authentication
        // ------------------------------

        if (!currentUser) {

            showModal(
                "Authentication Error",
                "Please login again."
            );

            return;

        }


        // ------------------------------
        // Validate whole naira amount
        // ------------------------------

        if (
            !Number.isInteger(amount)
        ) {

            showModal(
                "Invalid Amount",
                "Please enter a whole naira amount."
            );

            return;

        }


        continueBtn.disabled =
            true;


        continueBtn.textContent =
            "Please wait...";


        try {

            // --------------------------
            // Get Firebase ID token
            // --------------------------

            const idToken =
                await Promise.race([

                    currentUser.getIdToken(),

                    new Promise(
                        (_, reject) => {

                            setTimeout(
                                () => {

                                    reject(
                                        new Error(
                                            "Authentication token request timed out."
                                        )
                                    );

                                },
                                8000
                            );

                        }
                    )

                ]);


            // --------------------------
            // Create payment
            // --------------------------
            //
            // IMPORTANT:
            //
            // Do NOT send:
            // - uid
            // - customerEmail
            // - customerName
            //
            // The backend should obtain
            // the authenticated identity
            // from the verified Firebase
            // ID token.
            // --------------------------

            const controller =
                new AbortController();


            const timeoutId =
                setTimeout(
                    () => {

                        controller.abort();

                    },
                    15000
                );


            let response;


            try {

                response =
                    await fetch(
                        `${API_BASE_URL}/api/create-payment`,
                        {

                            method:
                                "POST",

                            headers: {

                                "Content-Type":
                                    "application/json",

                                "Authorization":
                                    `Bearer ${idToken}`,

                                "Accept":
                                    "application/json"

                            },

                            cache:
                                "no-store",

                            signal:
                                controller.signal,

                            body:
                                JSON.stringify({

                                    amount:
                                        amount

                                })

                        }
                    );

            }

            catch (fetchError) {

                if (
                    fetchError?.name ===
                    "AbortError"
                ) {

                    throw new Error(
                        "Payment server timed out."
                    );

                }

                throw fetchError;

            }

            finally {

                clearTimeout(
                    timeoutId
                );

            }


            // --------------------------
            // Parse response
            // --------------------------

            let data;


            try {

                data =
                    await response.json();

            }

            catch {

                throw new Error(
                    "Invalid response from payment server."
                );

            }


            // --------------------------
            // Handle backend response
            // --------------------------

            if (
                !response.ok ||
                !data?.success
            ) {

                throw new Error(
                    data?.message ||
                    data?.error ||
                    `Payment server error (${response.status}).`
                );

            }


            // --------------------------
            // Validate checkout URL
            // --------------------------

            if (
                !data.checkoutUrl ||
                typeof data.checkoutUrl !==
                "string"
            ) {

                throw new Error(
                    "Payment checkout link was not received."
                );

            }


            // --------------------------
            // Open payment checkout
            // --------------------------

            window.location.href =
                data.checkoutUrl;

        }

        catch (error) {

            console.error(
                "NovaPay payment error:",
                error
            );


            showModal(
                "Payment Error",
                error.message ||
                "Unable to connect to payment server."
            );

        }

        finally {

            continueBtn.disabled =
                false;


            continueBtn.textContent =
                "Continue";

        }

    }
);


// ======================================
// BACK
// ======================================

backBtn?.addEventListener(
    "click",
    () => {

        window.location.href =
            "dashboard.html";

    }
);


// ======================================
// MODAL BACKDROP
// ======================================

modal?.addEventListener(
    "click",
    event => {

        if (
            event.target ===
            modal
        ) {

            window.closeModal();

        }

    }
);


// ======================================
// ESC KEY
// ======================================

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key !==
            "Escape"
        ) {

            return;

        }


        if (
            modal &&
            modal.style.display ===
            "flex"
        ) {

            window.closeModal();

        }

    }
);


// ======================================
// STARTUP
// ======================================

console.log(
    "NovaPay Add Money initialized."
);

console.log(
    "Firebase authentication: ENABLED"
);

console.log(
    "Secure backend wallet loading: ENABLED"
);

console.log(
    "Payment creation: ENABLED"
);