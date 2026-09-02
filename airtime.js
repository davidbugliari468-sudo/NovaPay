/* ==========================================
   NOVAPAY AIRTIME
   BACKEND-DRIVEN VERSION
   TEMPORARY DIAGNOSTIC BUILD
   ========================================== */

/*
 * IMPORTANT
 *
 * The frontend is only responsible for:
 *
 * - collecting user input
 * - authenticating the user
 * - sending the request to NovaPay backend
 * - displaying the result
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
 *
 * TEMPORARY DIAGNOSTIC:
 *
 * This version exposes the HTTP/network failure instead of
 * replacing every failure with the generic:
 *
 * "We could not confirm the Airtime request..."
 *
 * It NEVER displays the Firebase ID token.
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


                console.log(
                    "Selected Airtime network:",
                    selectedNetwork
                );

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


        console.log(
            "NovaPay Airtime: authenticated user available."
        );


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
            "Your session has expired. Please login again."
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
 * The old frontend read:
 *
 * users/{uid}.walletBalance
 *
 * directly from Firestore.
 *
 * That logic has been removed.
 *
 * The backend is now responsible for returning
 * the authenticated user's wallet balance.
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
                "The wallet service returned an invalid response."
            );

        }


        if (
            !response.ok ||
            !result.success
        ) {

            throw new Error(
                result.error ||
                "Unable to retrieve wallet balance."
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
                "The wallet service returned an invalid balance."
            );

        }


        setWalletBalance(
            balanceKobo
        );

    }

    catch (error) {

        console.error(
            "NovaPay wallet loading error:",
            error
        );


        /*
         * Do not invent a balance.
         *
         * If the backend cannot provide the balance,
         * show a neutral value rather than trusting
         * an old client-side Firestore value.
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
     * The frontend therefore never sends decimals.
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
     * The new backend does not need the frontend
     * to calculate the new wallet balance.
     *
     * If the transaction response contains the
     * balance in a future compatible response,
     * use it. Otherwise reload it securely.
     */

    if (
        Number.isSafeInteger(
            Number(
                result?.walletBalanceKobo
            )
        )
    ) {

        setWalletBalance(
            Number(
                result.walletBalanceKobo
            )
        );

    }

    else {

        loadWallet();

    }

}


/* ==========================================
   MODULE 14
   HANDLE FAILED PURCHASE
   ========================================== */

function handleFailedPurchase(
    result
) {

    const message =
        String(
            result?.message ||
            result?.error ||
            "Airtime could not be completed."
        ).trim();


    alert(
        message
    );


    /*
     * Refresh the wallet from the backend.
     *
     * This is useful because a confirmed provider
     * failure should have its reservation released
     * by the backend service.
     */

    loadWallet();

}


/* ==========================================
   MODULE 15
   HANDLE PENDING PURCHASE
   ========================================== */

function handlePendingPurchase(
    result
) {

    const transactionId =
        String(
            result?.transactionId ||
            ""
        ).trim();


    /*
     * IMPORTANT:
     *
     * We do NOT submit another Airtime purchase.
     *
     * The backend has already created the transaction
     * and may still be waiting for VTU.ng confirmation.
     */

    alert(
        result?.message ||
        "Your Airtime request is being processed. Please do not retry yet."
    );


    if (
        transactionId
    ) {

        console.log(
            "Airtime transaction is pending:",
            transactionId
        );

    }


    /*
     * Refresh the wallet because the backend owns
     * the authoritative wallet state.
     */

    loadWallet();

}


/* ==========================================
   MODULE 16
   TEMPORARY DIAGNOSTIC HELPERS
   ========================================== */

/*
 * Convert a response body into something safe to display.
 *
 * We intentionally do not display:
 *
 * - Authorization headers
 * - Firebase ID tokens
 * - cookies
 * - credentials
 * - provider secrets
 */

function buildDiagnosticMessage({
    stage,
    url,
    method,
    status,
    statusText,
    responseBody,
    error
}) {

    const lines = [

        "NOVAPAY AIRTIME DIAGNOSTIC",

        `Stage: ${stage}`,

        `Method: ${method}`,

        `URL: ${url}`

    ];


    if (
        Number.isInteger(
            status
        )
    ) {

        lines.push(
            `HTTP Status: ${status}`
        );

    }


    if (
        statusText
    ) {

        lines.push(
            `HTTP Status Text: ${statusText}`
        );

    }


    if (
        responseBody
    ) {

        lines.push(
            `Response: ${responseBody}`
        );

    }


    if (
        error
    ) {

        lines.push(
            `Error: ${String(error)}`
        );

    }


    lines.push(
        "",
        "This diagnostic is temporary. Do not retry the purchase repeatedly until the cause is identified."
    );


    return lines.join(
        "\n"
    );

}


/*
 * Safely parse JSON without losing the raw response.
 *
 * We read the body as text first because this allows us
 * to distinguish:
 *
 * - valid JSON
 * - invalid JSON
 * - empty response
 * - HTML/server error page
 * - proxy/CORS response
 */

async function readResponseBody(
    response
) {

    const text =
        await response.text();


    const trimmed =
        text.trim();


    if (!trimmed) {

        return {

            raw:
                "",

            json:
                null

        };

    }


    try {

        return {

            raw:
                trimmed,

            json:
                JSON.parse(
                    trimmed
                )

        };

    }

    catch {

        return {

            raw:
                trimmed,

            json:
                null

        };

    }

}


/* ==========================================
   MODULE 17
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


    const endpoint =
        `${API_BASE_URL}/api/airtime/purchase`;


    /*
     * Keep the exact request structure that was already
     * implemented.
     *
     * The backend expects:
     *
     * network
     * phoneNumber
     * amount
     */

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
         * DIAGNOSTIC REQUEST LOG
         * -----------------------------------------------
         *
         * IMPORTANT:
         *
         * Never log the Firebase token.
         */

        console.log(
            "NovaPay Airtime diagnostic request:",
            {
                method:
                    "POST",

                url:
                    endpoint,

                body:
                    requestBody
            }
        );


        /*
         * -----------------------------------------------
         * SEND REQUEST
         * -----------------------------------------------
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

            const authBody =
                await readResponseBody(
                    response
                );


            console.error(
                "NovaPay Airtime authentication failure:",
                {
                    status:
                        response.status,

                    body:
                        authBody.raw
                }
            );


            alert(
                buildDiagnosticMessage({

                    stage:
                        "BACKEND REACHED — AUTHENTICATION REJECTED",

                    url:
                        endpoint,

                    method:
                        "POST",

                    status:
                        response.status,

                    statusText:
                        response.statusText,

                    responseBody:
                        authBody.raw

                })
            );


            handleExpiredSession();

            return;

        }


        /*
         * -----------------------------------------------
         * READ RESPONSE BODY
         * -----------------------------------------------
         */

        const responseData =
            await readResponseBody(
                response
            );


        const result =
            responseData.json;


        /*
         * -----------------------------------------------
         * DIAGNOSTIC RESPONSE LOG
         * -----------------------------------------------
         */

        console.log(
            "NovaPay Airtime diagnostic response:",
            {

                status:
                    response.status,

                statusText:
                    response.statusText,

                body:
                    result ||
                    responseData.raw ||
                    null

            }
        );


        /*
         * -----------------------------------------------
         * INVALID / EMPTY RESPONSE
         * -----------------------------------------------
         */

        if (
            !result
        ) {

            alert(
                buildDiagnosticMessage({

                    stage:
                        response.ok
                            ? "BACKEND REACHED — INVALID RESPONSE BODY"
                            : "BACKEND REACHED — NON-JSON ERROR RESPONSE",

                    url:
                        endpoint,

                    method:
                        "POST",

                    status:
                        response.status,

                    statusText:
                        response.statusText,

                    responseBody:
                        responseData.raw ||
                        "(empty response)"

                })
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
         * IMPORTANT:
         *
         * This is the part that was previously hidden
         * behind the generic catch message.
         *
         * Now we expose the actual HTTP status and the
         * safe backend response.
         */

        console.error(
            "NovaPay Airtime backend returned an unexpected response:",
            {

                status:
                    response.status,

                statusText:
                    response.statusText,

                body:
                    result

            }
        );


        alert(
            buildDiagnosticMessage({

                stage:
                    "BACKEND REACHED — UNEXPECTED RESPONSE",

                url:
                    endpoint,

                method:
                    "POST",

                status:
                    response.status,

                statusText:
                    response.statusText,

                responseBody:
                    JSON.stringify(
                        result,
                        null,
                        2
                    )

            })
        );


        loadWallet();

    }

    catch (error) {

        /*
         * -----------------------------------------------
         * NETWORK / FETCH FAILURE
         * -----------------------------------------------
         *
         * This means fetch itself failed before we
         * received a normal HTTP response.
         *
         * Typical examples:
         *
         * - CORS failure
         * - DNS failure
         * - connection failure
         * - browser/network failure
         * - blocked request
         * - Render unreachable
         *
         * IMPORTANT:
         *
         * We do NOT automatically assume the backend
         * did not receive the request.
         */

        console.error(
            "NovaPay Airtime fetch/network failure:",
            error
        );


        alert(
            buildDiagnosticMessage({

                stage:
                    "FETCH FAILED — NO NORMAL HTTP RESPONSE RECEIVED",

                url:
                    endpoint,

                method:
                    "POST",

                error:
                    error?.message ||
                    String(
                        error
                    )

            })
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
   MODULE 18
   CONTINUE BUTTON
   ========================================== */

if (continueBtn) {

    continueBtn.addEventListener(
        "click",
        purchaseAirtime
    );

}


/* ==========================================
   MODULE 19
   OPTIONAL TRANSACTION STATUS LOOKUP
   ========================================== */

/*
 * This function does NOT create another Airtime purchase.
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

        handleExpiredSession();

        return null;

    }


    const responseData =
        await readResponseBody(
            response
        );


    const result =
        responseData.json;


    if (
        !result
    ) {

        throw new Error(
            "The transaction service returned an invalid response."
        );

    }


    if (
        !response.ok ||
        !result.success
    ) {

        throw new Error(
            result.error ||
            "Unable to retrieve Airtime transaction."
        );

    }


    return result.transaction;

}


/* ==========================================
   MODULE 20
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
   MODULE 21
   DEBUG / DEVELOPMENT INFORMATION
   ========================================== */

console.log(
    "NovaPay Secure Airtime Frontend Loaded"
);

console.log(
    "Airtime API:",
    `${API_BASE_URL}/api/airtime/purchase`
);

console.log(
    "Airtime diagnostic mode:",
    true
);