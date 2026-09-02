/* ==========================================
   NOVAPAY AIRTIME
   SECURE BACKEND-DRIVEN VERSION
   ========================================== */

/*
 * IMPORTANT
 *
 * The frontend is only responsible for:
 *
 * - collecting user input
 * - authenticating the user
 * - sending the request to NovaPay backend
 * - displaying safe customer-facing results
 *
 * The frontend does NOT:
 *
 * - call VTU.ng
 * - calculate provider cost
 * - debit the wallet
 * - reserve wallet funds
 * - release wallet funds
 * - determine provider success/failure
 * - create financial transactions
 * - trust client-side wallet balances
 *
 * SECURITY:
 *
 * Backend errors, provider errors, HTTP details, raw
 * responses, network errors, and internal errors are
 * never displayed directly to the customer.
 */


/* ==========================================
   FIREBASE
   ========================================== */

import { auth } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";


/* ==========================================
   CONFIGURATION
   ========================================== */

const API_BASE_URL =
    "https://novapay-server.onrender.com";


/* ==========================================
   DOM ELEMENTS
   ========================================== */

const backBtn =
    document.getElementById("backBtn");

const providers =
    document.querySelectorAll(".provider");

const phoneInput =
    document.getElementById("phoneNumber");

const amountInput =
    document.getElementById("amount");

const walletBalance =
    document.getElementById("walletBalance");

const continueBtn =
    document.getElementById("continueBtn");


/* ==========================================
   STATE
   ========================================== */

let selectedNetwork =
    "mtn";

let currentUser =
    null;

let purchaseInProgress =
    false;


/* ==========================================
   BASIC DOM VALIDATION
   ========================================== */

if (!backBtn) {

    console.error(
        "NovaPay Airtime: #backBtn was not found."
    );

}


if (!providers.length) {

    console.warn(
        "NovaPay Airtime: No .provider elements were found."
    );

}


if (!phoneInput) {

    console.error(
        "NovaPay Airtime: #phoneNumber was not found."
    );

}


if (!amountInput) {

    console.error(
        "NovaPay Airtime: #amount was not found."
    );

}


if (!walletBalance) {

    console.error(
        "NovaPay Airtime: #walletBalance was not found."
    );

}


if (!continueBtn) {

    console.error(
        "NovaPay Airtime: #continueBtn was not found."
    );

}


/* ==========================================
   MODULE 1
   BACK BUTTON
   ========================================== */

if (backBtn) {

    backBtn.addEventListener(
        "click",
        () => {

            history.back();

        }
    );

}


/* ==========================================
   MODULE 2
   NETWORK SELECTION
   ========================================== */

providers.forEach(
    card => {

        const network =
            String(
                card.dataset.network ||
                ""
            )
                .trim()
                .toLowerCase();


        /*
         * Keep MTN as the default selection if
         * the existing HTML contains the MTN card.
         */

        if (
            network ===
            "mtn"
        ) {

            card.classList.add(
                "active"
            );

        }


        card.addEventListener(
            "click",
            () => {

                if (
                    purchaseInProgress
                ) {

                    return;

                }


                providers.forEach(
                    item => {

                        item.classList.remove(
                            "active"
                        );

                    }
                );


                card.classList.add(
                    "active"
                );


                selectedNetwork =
                    network;

            }
        );

    }
);


/* ==========================================
   MODULE 3
   PHONE INPUT
   ========================================== */

if (phoneInput) {

    phoneInput.addEventListener(
        "input",
        () => {

            phoneInput.value =
                phoneInput.value
                    .replace(
                        /\D/g,
                        ""
                    )
                    .slice(
                        0,
                        11
                    );

        }
    );

}


/* ==========================================
   MODULE 4
   AMOUNT INPUT
   ========================================== */

if (amountInput) {

    amountInput.addEventListener(
        "input",
        () => {

            amountInput.value =
                amountInput.value
                    .replace(
                        /\D/g,
                        ""
                    );

        }
    );


    /*
     * Airtime amounts are whole-naira values.
     *
     * Prevent:
     *
     * e
     * E
     * +
     * -
     * .
     */

    [
        "e",
        "E",
        "+",
        "-",
        "."
    ].forEach(
        key => {

            amountInput.addEventListener(
                "keydown",
                event => {

                    if (
                        event.key ===
                        key
                    ) {

                        event.preventDefault();

                    }

                }
            );

        }
    );

}


/* ==========================================
   MODULE 5
   MONEY FORMATTING
   ========================================== */

function formatNairaFromKobo(
    amountKobo
) {

    const value =
        Number(
            amountKobo
        );


    if (
        !Number.isFinite(
            value
        )
    ) {

        return "₦0.00";

    }


    return (
        "₦" +
        (
            value / 100
        ).toLocaleString(
            "en-NG",
            {
                minimumFractionDigits:
                    2,

                maximumFractionDigits:
                    2
            }
        )
    );

}


/* ==========================================
   MODULE 6
   SET WALLET DISPLAY
   ========================================== */

function setWalletBalance(
    balanceKobo
) {

    if (!walletBalance) {

        return;

    }


    walletBalance.textContent =
        formatNairaFromKobo(
            balanceKobo
        );

}


/* ==========================================
   MODULE 7
   AUTHENTICATION
   ========================================== */

onAuthStateChanged(
    auth,
    async user => {

        if (!user) {

            currentUser =
                null;


            window.location.href =
                "login.html";


            return;

        }


        currentUser =
            user;


        await loadWallet();

    }
);


/* ==========================================
   MODULE 8
   BACKEND REQUEST HELPER
   ========================================== */

/*
 * Every protected backend request goes through
 * this helper.
 *
 * The Firebase ID token is generated here.
 *
 * The UID is NOT manually supplied to the backend.
 *
 * IMPORTANT:
 *
 * The token is never logged or displayed.
 */

async function authenticatedFetch(
    path,
    options = {}
) {

    if (!currentUser) {

        throw new Error(
            "SESSION_EXPIRED"
        );

    }


    const idToken =
        await currentUser.getIdToken();


    const headers = {

        "Content-Type":
            "application/json",

        "Authorization":
            `Bearer ${idToken}`

    };


    /*
     * Allow callers to provide additional headers
     * without replacing authentication.
     */

    if (
        options.headers
    ) {

        Object.assign(
            headers,
            options.headers
        );

    }


    return fetch(
        `${API_BASE_URL}${path}`,
        {
            ...options,
            headers
        }
    );

}


/* ==========================================
   MODULE 9
   LOAD WALLET
   ========================================== */

/*
 * The frontend does not read wallet data directly
 * from Firestore.
 *
 * The backend is authoritative.
 */

async function loadWallet() {

    if (!walletBalance) {

        return;

    }


    try {

        const response =
            await authenticatedFetch(
                "/api/wallet",
                {
                    method:
                        "GET"
                }
            );


        if (
            response.status ===
            401
        ) {

            handleExpiredSession();

            return;

        }


        let result =
            null;


        try {

            result =
                await response.json();

        }

        catch {

            throw new Error(
                "WALLET_INVALID_RESPONSE"
            );

        }


        if (
            !response.ok ||
            !result.success
        ) {

            throw new Error(
                "WALLET_UNAVAILABLE"
            );

        }


        const balanceKobo =
            Number(
                result?.wallet?.balanceKobo
            );


        if (
            !Number.isSafeInteger(
                balanceKobo
            ) ||
            balanceKobo < 0
        ) {

            throw new Error(
                "WALLET_INVALID_BALANCE"
            );

        }


        setWalletBalance(
            balanceKobo
        );

    }

    catch (error) {

        /*
         * Internal wallet errors are logged for
         * development purposes only.
         *
         * They are never shown to the customer.
         */

        console.error(
            "NovaPay wallet loading error:",
            error?.message ||
            error
        );


        /*
         * Do not invent a wallet balance.
         *
         * Preserve the existing neutral display
         * behavior if the backend cannot provide
         * the authoritative balance.
         */

        setWalletBalance(
            0
        );

    }

}


/* ==========================================
   MODULE 10
   SESSION EXPIRATION
   ========================================== */

function handleExpiredSession() {

    currentUser =
        null;


    alert(
        "Your session has expired. Please login again."
    );


    window.location.href =
        "login.html";

}


/* ==========================================
   MODULE 11
   INPUT VALIDATION
   ========================================== */

function validatePurchaseInput() {

    if (!currentUser) {

        return {

            valid:
                false,

            message:
                "Your session has expired. Please login again."

        };

    }


    const phone =
        phoneInput
            ? phoneInput.value.trim()
            : "";


    const amountText =
        amountInput
            ? amountInput.value.trim()
            : "";


    const amount =
        Number(
            amountText
        );


    /* --------------------------------------
       NETWORK
       -------------------------------------- */

    if (
        !selectedNetwork
    ) {

        return {

            valid:
                false,

            message:
                "Please select an Airtime network."

        };

    }


    /* --------------------------------------
       PHONE
       -------------------------------------- */

    if (
        !/^0\d{10}$/.test(
            phone
        )
    ) {

        return {

            valid:
                false,

            message:
                "Enter a valid Nigerian phone number."

        };

    }


    /* --------------------------------------
       AMOUNT
       -------------------------------------- */

    if (
        !Number.isSafeInteger(
            amount
        )
    ) {

        return {

            valid:
                false,

            message:
                "Enter a valid Airtime amount."

        };

    }


    if (
        amount < 50
    ) {

        return {

            valid:
                false,

            message:
                "Minimum Airtime amount is ₦50."

        };

    }


    /*
     * The backend expects whole-naira amounts.
     *
     * The frontend never sends decimals.
     */

    return {

        valid:
            true,

        phone,
        amount

    };

}


/* ==========================================
   MODULE 12
   BUTTON STATE
   ========================================== */

function setPurchaseButtonState(
    processing
) {

    if (!continueBtn) {

        return;

    }


    purchaseInProgress =
        processing;


    continueBtn.disabled =
        processing;


    continueBtn.textContent =
        processing
            ? "Processing..."
            : "Continue";


    /*
     * Prevent changing networks while a financial
     * request is in progress.
     */

    providers.forEach(
        card => {

            card.style.pointerEvents =
                processing
                    ? "none"
                    : "";

        }
    );

}


/* ==========================================
   MODULE 13
   HANDLE SUCCESS
   ========================================== */

function handleSuccessfulPurchase(
    result
) {

    alert(
        "Airtime purchased successfully."
    );


    if (phoneInput) {

        phoneInput.value =
            "";

    }


    if (amountInput) {

        amountInput.value =
            "";

    }


    /*
     * The backend remains authoritative.
     *
     * If a compatible wallet balance is returned,
     * it may be displayed. Otherwise reload from
     * the backend.
     */

    const walletBalanceKobo =
        Number(
            result?.walletBalanceKobo
        );


    if (
        Number.isSafeInteger(
            walletBalanceKobo
        ) &&
        walletBalanceKobo >= 0
    ) {

        setWalletBalance(
            walletBalanceKobo
        );

    }

    else {

        loadWallet();

    }

}


/* ==========================================
   MODULE 14
   SAFE BACKEND ERROR MAPPING
   ========================================== */

/*
 * The backend already returns deliberately safe
 * business messages.
 *
 * The frontend still uses an allowlist so that a future
 * backend/internal error cannot accidentally become a
 * customer-facing raw error.
 */

const SAFE_AIRTIME_MESSAGES =
    new Set([

        "Your wallet balance is insufficient.",

        "Insufficient wallet balance.",

        "Airtime request is required.",

        "Airtime network is required.",

        "Unsupported Airtime network.",

        "Airtime phone number is required.",

        "Enter a valid Nigerian Airtime phone number.",

        "Enter a valid Nigerian phone number.",

        "Invalid Airtime amount.",

        "Airtime amount must be a positive integer in kobo.",

        "Airtime amount must be a valid whole-naira amount.",

        "Unable to reserve wallet funds."

    ]);


/*
 * Preserve the configured minimum Airtime message.
 */

function isSafeAirtimeMessage(
    message
) {

    const normalized =
        String(
            message ||
            ""
        ).trim();


    if (
        !normalized
    ) {

        return false;

    }


    if (
        SAFE_AIRTIME_MESSAGES.has(
            normalized
        )
    ) {

        return true;

    }


    if (
        normalized.startsWith(
            "Minimum Airtime amount is"
        )
    ) {

        return true;

    }


    if (
        normalized.startsWith(
            "Maximum Airtime amount is"
        )
    ) {

        return true;

    }


    return false;

}


/*
 * Convert any backend response into a safe
 * customer-facing message.
 *
 * Raw backend content is never returned unless it
 * matches the explicit allowlist above.
 */

function getSafePurchaseMessage(
    result,
    fallback =
        "Unable to process Airtime request."
) {

    const candidate =
        String(
            result?.error ||
            result?.message ||
            ""
        ).trim();


    if (
        isSafeAirtimeMessage(
            candidate
        )
    ) {

        return candidate;

    }


    return fallback;

}


/* ==========================================
   MODULE 15
   HANDLE FAILED PURCHASE
   ========================================== */

function handleFailedPurchase(
    result
) {

    const message =
        getSafePurchaseMessage(
            result,
            "Airtime could not be completed."
        );


    alert(
        message
    );


    /*
     * Refresh the wallet from the authoritative
     * backend.
     */

    loadWallet();

}


/* ==========================================
   MODULE 16
   HANDLE PENDING PURCHASE
   ========================================== */

function handlePendingPurchase(
    result
) {

    /*
     * IMPORTANT:
     *
     * We do NOT submit another Airtime purchase.
     *
     * The backend may still be waiting for
     * VTU.ng confirmation.
     */

    const message =
        getSafePurchaseMessage(
            result,
            "Your Airtime request is being processed. Please do not retry yet."
        );


    alert(
        message
    );


    /*
     * Refresh the authoritative wallet display.
     */

    loadWallet();

}


/* ==========================================
   MODULE 17
   READ RESPONSE BODY
   ========================================== */

/*
 * Read JSON safely.
 *
 * IMPORTANT:
 *
 * This function deliberately does not return raw
 * response text to the customer.
 */

async function readResponseBody(
    response
) {

    const text =
        await response.text();


    const trimmed =
        text.trim();


    if (!trimmed) {

        return null;

    }


    try {

        return JSON.parse(
            trimmed
        );

    }

    catch {

        return null;

    }

}


/* ==========================================
   MODULE 18
   PURCHASE AIRTIME
   ========================================== */

async function purchaseAirtime() {

    if (
        purchaseInProgress
    ) {

        return;

    }


    const validation =
        validatePurchaseInput();


    if (
        !validation.valid
    ) {

        alert(
            validation.message
        );

        return;

    }


    setPurchaseButtonState(
        true
    );


    const requestBody = {

        network:
            selectedNetwork,

        phoneNumber:
            validation.phone,

        amount:
            validation.amount

    };


    try {

        /*
         * -----------------------------------------------
         * SEND REQUEST
         * -----------------------------------------------
         *
         * The Firebase ID token is handled internally
         * by authenticatedFetch().
         *
         * It is never logged.
         */

        const response =
            await authenticatedFetch(
                "/api/airtime/purchase",
                {

                    method:
                        "POST",

                    body:
                        JSON.stringify(
                            requestBody
                        )

                }
            );


        /*
         * -----------------------------------------------
         * AUTHENTICATION ERROR
         * -----------------------------------------------
         */

        if (
            response.status ===
            401
        ) {

            /*
             * Consume the response body without exposing
             * it to the customer.
             */

            await readResponseBody(
                response
            );


            handleExpiredSession();

            return;

        }


        /*
         * -----------------------------------------------
         * READ RESPONSE
         * -----------------------------------------------
         */

        const result =
            await readResponseBody(
                response
            );


        /*
         * -----------------------------------------------
         * INVALID RESPONSE
         * -----------------------------------------------
         *
         * Do not expose:
         *
         * - raw HTML
         * - proxy errors
         * - Render errors
         * - HTTP details
         * - backend internals
         */

        if (
            !result
        ) {

            alert(
                "Unable to process Airtime request right now. Please try again later."
            );


            loadWallet();

            return;

        }


        /*
         * -----------------------------------------------
         * SUCCESS
         * -----------------------------------------------
         *
         * HTTP 200
         * success === true
         * status === successful
         */

        if (
            response.ok &&
            result.success === true &&
            result.status ===
                "successful"
        ) {

            handleSuccessfulPurchase(
                result
            );

            return;

        }


        /*
         * -----------------------------------------------
         * PENDING
         * -----------------------------------------------
         *
         * HTTP 202 is intentional.
         *
         * Pending is NOT a failure.
         */

        if (
            response.status ===
                202 ||
            result.pending === true ||
            result.status ===
                "pending"
        ) {

            handlePendingPurchase(
                result
            );

            return;

        }


        /*
         * -----------------------------------------------
         * CONFIRMED FAILURE
         * -----------------------------------------------
         */

        if (
            result.status ===
            "failed"
        ) {

            handleFailedPurchase(
                result
            );

            return;

        }


        /*
         * -----------------------------------------------
         * BACKEND ERROR
         * -----------------------------------------------
         *
         * Only explicitly allowlisted business messages
         * can reach the customer.
         *
         * Everything else becomes a generic message.
         */

        alert(
            getSafePurchaseMessage(
                result,
                "Unable to process Airtime request right now. Please try again later."
            )
        );


        loadWallet();

    }

    catch (error) {

        /*
         * -----------------------------------------------
         * FETCH / NETWORK FAILURE
         * -----------------------------------------------
         *
         * IMPORTANT:
         *
         * A failed fetch does NOT prove whether the
         * backend received or processed the request.
         *
         * Therefore we do not automatically retry.
         *
         * We also do not show the browser's raw error.
         */

        console.error(
            "NovaPay Airtime request failed:",
            error?.message ||
            error
        );


        alert(
            "We could not confirm your Airtime request. Please check your transaction status before trying again."
        );


        /*
         * Refresh the authoritative wallet display.
         */

        loadWallet();

    }

    finally {

        setPurchaseButtonState(
            false
        );

    }

}


/* ==========================================
   MODULE 19
   CONTINUE BUTTON
   ========================================== */

if (continueBtn) {

    continueBtn.addEventListener(
        "click",
        purchaseAirtime
    );

}


/* ==========================================
   MODULE 20
   TRANSACTION STATUS LOOKUP
   ========================================== */

/*
 * This function does NOT create another Airtime
 * purchase.
 *
 * It only retrieves the authenticated user's
 * existing transaction.
 */

async function getAirtimeTransaction(
    transactionId
) {

    const normalizedId =
        String(
            transactionId ||
            ""
        ).trim();


    if (!normalizedId) {

        throw new Error(
            "Airtime transaction ID is required."
        );

    }


    const response =
        await authenticatedFetch(
            `/api/airtime/transaction/${encodeURIComponent(normalizedId)}`,
            {
                method:
                    "GET"
            }
        );


    if (
        response.status ===
        401
    ) {

        await readResponseBody(
            response
        );


        handleExpiredSession();

        return null;

    }


    const result =
        await readResponseBody(
            response
        );


    if (
        !result
    ) {

        throw new Error(
            "TRANSACTION_INVALID_RESPONSE"
        );

    }


    if (
        !response.ok ||
        !result.success
    ) {

        /*
         * Do not expose the backend error directly.
         */

        throw new Error(
            isSafeAirtimeMessage(
                result?.error
            )
                ? result.error
                : "Unable to retrieve Airtime transaction."
        );

    }


    return result.transaction;

}


/* ==========================================
   MODULE 21
   INITIAL UI
   ========================================== */

if (walletBalance) {

    walletBalance.textContent =
        "₦0.00";

}


if (providers.length) {

    /*
     * Restore MTN as the default selected network.
     *
     * This preserves the existing UI behavior.
     */

    const mtnCard =
        Array.from(
            providers
        ).find(
            card =>
                String(
                    card.dataset.network ||
                    ""
                )
                    .trim()
                    .toLowerCase() ===
                "mtn"
        );


    if (mtnCard) {

        providers.forEach(
            card => {

                card.classList.remove(
                    "active"
                );

            }
        );


        mtnCard.classList.add(
            "active"
        );


        selectedNetwork =
            "mtn";

    }

}


/* ==========================================
   MODULE 22
   SECURE FRONTEND STATUS
   ========================================== */

console.log(
    "NovaPay Secure Airtime Frontend Loaded"
);