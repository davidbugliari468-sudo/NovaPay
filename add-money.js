// ======================================
// NovaPay Add Money
// Secure Paystack Backend Version
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
// CONFIGURATION
// ======================================

const API_BASE_URL =
    "https://novapay-server.onrender.com";

const MINIMUM_DEPOSIT =
    100;


// ======================================
// DOM ELEMENTS
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
// STATE
// ======================================

let currentUser = null;

let balance = 0;


// ======================================
// MODAL
// ======================================

function showModal(
    title,
    message
) {

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


window.closeModal =
    function () {

        if (modal) {

            modal.style.display =
                "none";

        }

    };


// ======================================
// MODAL BACKDROP
// ======================================

modal?.addEventListener(
    "click",
    (event) => {

        if (
            event.target ===
            modal
        ) {

            window.closeModal();

        }

    }
);


// ======================================
// FORMAT MONEY
// ======================================

function formatMoney(
    amount
) {

    const numericAmount =
        Number(amount);

    const safeAmount =
        Number.isFinite(
            numericAmount
        )
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
// LOAD WALLET BALANCE
// ======================================
//
// IMPORTANT:
//
// Wallet balance is loaded from the
// authenticated backend.
//
// We do NOT use Firestore walletBalance
// as the authoritative wallet balance.
//
// ======================================

async function loadWalletBalance(
    user
) {

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
            10000
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
        !response.ok ||
        !result?.success
    ) {

        throw new Error(
            result?.error ||
            result?.message ||
            `Wallet server error (${response.status}).`
        );

    }


    const balanceKobo =
        Number(
            result.wallet?.balanceKobo
        );


    if (
        !Number.isSafeInteger(
            balanceKobo
        ) ||
        balanceKobo < 0
    ) {

        throw new Error(
            "Wallet server returned an invalid balance."
        );

    }


    balance =
        balanceKobo /
        100;


    if (walletBalance) {

        walletBalance.textContent =
            formatMoney(
                balance
            );

    }

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
                "NovaPay Add Money wallet error:",
                error
            );


            if (walletBalance) {

                walletBalance.textContent =
                    "₦0.00";

            }

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

                const amount =
                    button.dataset.amount;

                if (!amountInput) {

                    return;

                }


                amountInput.value =
                    amount;


                amountInput.dispatchEvent(
                    new Event(
                        "input",
                        {
                            bubbles: true
                        }
                    )
                );


                amountInput.focus();

            }
        );

    }
);


// ======================================
// CREATE ADD-MONEY PAYMENT
// ======================================
//
// Backend route:
//
// POST /api/add-money/create
//
// The frontend sends ONLY:
//
// {
//     amount
// }
//
// The backend gets the authenticated
// UID from the Firebase ID token.
//
// ======================================

async function createDeposit(
    amount
) {

    if (!currentUser) {

        throw new Error(
            "Authentication required. Please login again."
        );

    }


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
                `${API_BASE_URL}/api/add-money/create`,
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

                            amount

                        })

                }
            );

    }

    catch (error) {

        if (
            error?.name ===
            "AbortError"
        ) {

            throw new Error(
                "Payment server timed out. Please try again."
            );

        }


        throw new Error(
            "Unable to connect to the payment server."
        );

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
            "The payment server returned an invalid response."
        );

    }


    if (
        !response.ok ||
        !result?.success
    ) {

        throw new Error(
            result?.error ||
            result?.message ||
            `Payment server error (${response.status}).`
        );

    }


    if (
        !result.deposit
    ) {

        throw new Error(
            "Payment server did not return deposit details."
        );

    }


    return result.deposit;

}


// ======================================
// SHOW TRANSFER ACCOUNT
// ======================================

function showTransferDetails(
    deposit
) {

    const amount =
        Number(
            deposit.amount
        );


    const formattedAmount =
        formatMoney(
            amount
        );


    const accountName =
        deposit.accountName ||
        "Unavailable";


    const accountNumber =
        deposit.accountNumber ||
        "Unavailable";


    const bankName =
        deposit.bankName ||
        "Unavailable";


    const reference =
        deposit.reference ||
        "Unavailable";


    const expiry =
        deposit.accountExpiresAt;


    let expiryText =
        "";


    if (expiry) {

        const expiryDate =
            new Date(
                expiry
            );


        if (
            !Number.isNaN(
                expiryDate.getTime()
            )
        ) {

            expiryText =
                `\n\nAccount expiry: ${expiryDate.toLocaleString(
                    "en-NG"
                )}`;

        }

    }


    showModal(
        "Transfer Account Created",
        `Transfer ${formattedAmount} to the account below.\n\n` +
        `Bank: ${bankName}\n` +
        `Account Name: ${accountName}\n` +
        `Account Number: ${accountNumber}\n\n` +
        `Reference: ${reference}` +
        expiryText
    );

}


// ======================================
// CONTINUE BUTTON
// ======================================

continueBtn?.addEventListener(
    "click",
    async () => {

        if (!amountInput) {

            showModal(
                "Error",
                "Amount input could not be found."
            );

            return;

        }


        const rawAmount =
            String(
                amountInput.value ||
                ""
            )
                .replace(
                    /,/g,
                    ""
                )
                .trim();


        const amount =
            Number(
                rawAmount
            );


        // ----------------------------------
        // VALIDATE AMOUNT
        // ----------------------------------

        if (
            !Number.isFinite(
                amount
            )
        ) {

            showModal(
                "Invalid Amount",
                "Please enter a valid amount."
            );

            return;

        }


        if (
            amount < MINIMUM_DEPOSIT
        ) {

            showModal(
                "Invalid Amount",
                `Minimum funding amount is ${formatMoney(
                    MINIMUM_DEPOSIT
                )}.`
            );

            return;

        }


        if (
            !currentUser
        ) {

            showModal(
                "Authentication Error",
                "Your login session is no longer available. Please login again."
            );

            return;

        }


        // ----------------------------------
        // LOCK BUTTON
        // ----------------------------------

        continueBtn.disabled =
            true;

        continueBtn.textContent =
            "Creating account...";


        try {

            const deposit =
                await createDeposit(
                    amount
                );


            console.log(
                "NovaPay deposit created:",
                deposit
            );


            showTransferDetails(
                deposit
            );

        }

        catch (error) {

            console.error(
                "NovaPay Add Money payment error:",
                error
            );


            showModal(
                "Payment Error",
                error.message ||
                "Unable to create your payment."
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
// BACK BUTTON
// ======================================

backBtn?.addEventListener(
    "click",
    () => {

        window.location.href =
            "dashboard.html";

    }
);


// ======================================
// ESCAPE KEY
// ======================================

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key ===
            "Escape"
        ) {

            if (
                modal &&
                modal.style.display ===
                "flex"
            ) {

                window.closeModal();

            }

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
    "Paystack backend route:",
    `${API_BASE_URL}/api/add-money/create`
);

console.log(
    "Secure Firebase authentication: ENABLED"
);

console.log(
    "Backend wallet balance: ENABLED"
);