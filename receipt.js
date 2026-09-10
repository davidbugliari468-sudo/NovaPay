import { auth } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";


// =====================================================
// NOVAPAY BACKEND
// =====================================================

const BACKEND_URL = "https://novapay-server.onrender.com";


// =====================================================
// ELEMENTS
// =====================================================

const elements = {
    title: document.getElementById("transactionTitle"),
    status: document.getElementById("transactionStatus"),
    amount: document.getElementById("amount"),

    recipient: document.getElementById("recipient"),
    amountText: document.getElementById("amountText"),
    date: document.getElementById("date"),
    transactionId: document.getElementById("transactionId"),
    category: document.getElementById("category"),
    statusText: document.getElementById("statusText"),

    receiptIcon: document.getElementById("receiptIcon"),

    supportBtn: document.getElementById("supportBtn"),
    doneBtn: document.getElementById("doneBtn"),
    backBtn: document.getElementById("backBtn")
};


// =====================================================
// BASIC VALUE HELPER
// =====================================================

function firstValue(...values) {
    for (const value of values) {
        if (
            value !== undefined &&
            value !== null &&
            String(value).trim() !== ""
        ) {
            return value;
        }
    }

    return null;
}


// =====================================================
// NORMALIZE ID
// =====================================================

function normalizeId(value) {
    if (value === undefined || value === null) {
        return "";
    }

    return String(value).trim();
}


// =====================================================
// GET LOCAL NOVAPAY TRANSACTION ID
// =====================================================

function getTransactionId(transaction) {
    return normalizeId(
        firstValue(
            transaction.id,
            transaction.transactionId,
            transaction.transaction_id,
            transaction.txId,
            transaction.tx_id,
            transaction.reference,
            transaction.referenceId,
            transaction.reference_id
        )
    );
}


// =====================================================
// GET PROVIDER REFERENCE
// =====================================================

function getProviderReference(transaction) {
    return normalizeId(
        firstValue(
            transaction.providerReference,
            transaction.provider_reference,

            transaction.providerTransactionId,
            transaction.provider_transaction_id,

            transaction.providerRequestId,
            transaction.provider_request_id,

            transaction.requestId,
            transaction.request_id
        )
    );
}


// =====================================================
// GET AMOUNT IN NAIRA
// =====================================================

function getAmountNaira(transaction) {

    const koboAmount = firstValue(
        transaction.amountKobo,
        transaction.amount_kobo,

        transaction.valueKobo,
        transaction.value_kobo,

        transaction.totalKobo,
        transaction.total_kobo
    );


    if (koboAmount !== null) {

        const numericKobo = Number(koboAmount);

        if (Number.isFinite(numericKobo)) {
            return Math.abs(numericKobo) / 100;
        }
    }


    const nairaAmount = firstValue(
        transaction.amount,
        transaction.value,
        transaction.total,

        transaction.amountNaira,
        transaction.amount_naira
    );


    if (nairaAmount !== null) {

        const numericAmount = Number(nairaAmount);

        if (Number.isFinite(numericAmount)) {
            return Math.abs(numericAmount);
        }
    }


    return 0;
}


// =====================================================
// FORMAT NAIRA
// =====================================================

function formatCurrency(amount) {

    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount)) {
        return "₦0.00";
    }


    return `₦${numericAmount.toLocaleString("en-NG", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;
}


// =====================================================
// GET TRANSACTION DIRECTION
// =====================================================

function getTransactionDirection(transaction) {

    const values = [
        transaction.direction,

        transaction.transactionDirection,
        transaction.transaction_direction,

        transaction.type,

        transaction.transactionType,
        transaction.transaction_type,

        transaction.category,

        transaction.service
    ]
        .filter(Boolean)
        .map(value => String(value).toLowerCase());


    const creditWords = [
        "credit",
        "deposit",
        "funding",
        "fund",
        "cash in",
        "cash-in",
        "refund",
        "reversal",
        "topup",
        "top-up"
    ];


    const debitWords = [
        "debit",
        "withdraw",
        "withdrawal",
        "purchase",
        "payment",
        "data",
        "airtime",
        "electricity",
        "betting",
        "bill"
    ];


    if (
        values.some(value =>
            creditWords.some(word =>
                value.includes(word)
            )
        )
    ) {
        return "credit";
    }


    if (
        values.some(value =>
            debitWords.some(word =>
                value.includes(word)
            )
        )
    ) {
        return "debit";
    }


    const rawAmount = firstValue(
        transaction.amountKobo,
        transaction.amount_kobo,

        transaction.amount,
        transaction.value,
        transaction.total
    );


    if (
        typeof rawAmount === "number" &&
        rawAmount < 0
    ) {
        return "debit";
    }


    if (
        typeof rawAmount === "string" &&
        rawAmount.trim().startsWith("-")
    ) {
        return "debit";
    }


    return "debit";
}


// =====================================================
// GET RAW STATUS
// =====================================================

function getStatus(transaction) {

    return String(
        firstValue(
            transaction.status,

            transaction.transactionStatus,
            transaction.transaction_status,

            "pending"
        )
    ).toLowerCase();
}


// =====================================================
// SUCCESS STATUS
// =====================================================

function isSuccessful(status) {

    return [
        "successful",
        "success",
        "completed",
        "completed-api",
        "complete",
        "paid",
        "approved"
    ].some(value =>
        status.includes(value)
    );
}


// =====================================================
// FAILED STATUS
// =====================================================

function isFailed(status) {

    return [
        "failed",
        "failure",
        "cancelled",
        "canceled",
        "refunded",
        "rejected",
        "declined"
    ].some(value =>
        status.includes(value)
    );
}


// =====================================================
// DISPLAY STATUS
// =====================================================

function getDisplayStatus(status) {

    if (isSuccessful(status)) {
        return "Successful";
    }


    if (isFailed(status)) {
        return "Failed";
    }


    return "Pending";
}


// =====================================================
// TRANSACTION TITLE
// =====================================================

function getTransactionTitle(transaction) {

    const explicitTitle = firstValue(
        transaction.title,

        transaction.transactionTitle,
        transaction.transaction_title,

        transaction.description
    );


    if (explicitTitle) {
        return String(explicitTitle);
    }


    const type = String(
        firstValue(
            transaction.transactionType,
            transaction.transaction_type,

            transaction.type,

            transaction.category,

            transaction.service,

            "Transaction"
        )
    ).toLowerCase();


    if (type.includes("deposit")) {
        return "Deposit";
    }


    if (type.includes("data")) {
        return "Data";
    }


    if (type.includes("airtime")) {
        return "Airtime";
    }


    if (type.includes("electric")) {
        return "Electricity";
    }


    if (type.includes("bet")) {
        return "Betting";
    }


    if (type.includes("withdraw")) {
        return "Withdrawal";
    }


    if (type.includes("refund")) {
        return "Refund";
    }


    return "Transaction";
}


// =====================================================
// RECIPIENT
// =====================================================

function getRecipient(transaction) {

    return String(
        firstValue(
            transaction.recipientName,
            transaction.recipient_name,

            transaction.recipient,

            transaction.customerName,
            transaction.customer_name,

            transaction.customerId,
            transaction.customer_id,

            transaction.phoneNumber,
            transaction.phone,

            transaction.mobile,

            transaction.beneficiary,

            transaction.description,

            "—"
        )
    );
}


// =====================================================
// CATEGORY
// =====================================================

function getCategory(transaction) {

    const category = firstValue(
        transaction.category,

        transaction.service,

        transaction.transactionType,
        transaction.transaction_type,

        transaction.type
    );


    if (!category) {
        return "General";
    }


    return String(category)
        .replace(/[-_]/g, " ")
        .replace(/\b\w/g, letter =>
            letter.toUpperCase()
        );
}


// =====================================================
// PARSE DATE
// =====================================================

function parseDateValue(value) {

    if (!value) {
        return null;
    }


    if (value instanceof Date) {
        return value;
    }


    if (typeof value === "object") {

        if (typeof value.toDate === "function") {
            return value.toDate();
        }


        if (typeof value.seconds === "number") {
            return new Date(
                value.seconds * 1000
            );
        }


        if (typeof value._seconds === "number") {
            return new Date(
                value._seconds * 1000
            );
        }
    }


    if (typeof value === "number") {

        if (value < 10000000000) {
            return new Date(
                value * 1000
            );
        }


        return new Date(value);
    }


    const parsed = new Date(value);


    if (!Number.isNaN(parsed.getTime())) {
        return parsed;
    }


    return null;
}


// =====================================================
// TRANSACTION DATE
// =====================================================

function getTransactionDate(transaction) {

    return firstValue(
        transaction.createdAt,
        transaction.created_at,

        transaction.timestamp,

        transaction.date,

        transaction.transactionDate,
        transaction.transaction_date,

        transaction.completedAt,
        transaction.completed_at
    );
}


// =====================================================
// FORMAT DATE
// =====================================================

function formatDate(value) {

    const date = parseDateValue(value);


    if (!date) {
        return "—";
    }


    return date.toLocaleString("en-NG", {
        day: "2-digit",
        month: "short",
        year: "numeric",

        hour: "2-digit",
        minute: "2-digit"
    });
}


// =====================================================
// GET TRANSACTION ID FROM URL
// =====================================================

function getRequestedTransactionId() {

    const params =
        new URLSearchParams(
            window.location.search
        );


    return normalizeId(
        firstValue(

            params.get("transactionId"),

            params.get("transaction_id"),

            params.get("txId"),

            params.get("tx_id"),

            params.get("id"),

            params.get("reference")
        )
    );
}


// =====================================================
// GET FIREBASE TOKEN
// =====================================================

async function getFirebaseToken(user) {

    if (!user) {
        throw new Error(
            "No authenticated user was found."
        );
    }


    const token =
        await user.getIdToken(true);


    if (!token) {
        throw new Error(
            "Authentication token was not received."
        );
    }


    return token;
}


// =====================================================
// FETCH TRANSACTIONS
// =====================================================

async function fetchTransactions(token) {

    const response = await fetch(
        `${BACKEND_URL}/api/transactions?limit=50`,
        {
            method: "GET",

            headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/json"
            },

            cache: "no-store"
        }
    );


    if (!response.ok) {

        let message =
            `Unable to load transactions. Server returned ${response.status}.`;


        try {

            const errorData =
                await response.json();


            if (
                typeof errorData?.error === "string"
            ) {
                message = errorData.error;
            } else if (
                typeof errorData?.message === "string"
            ) {
                message = errorData.message;
            }

        } catch {
            // Keep the HTTP status message.
        }


        throw new Error(message);
    }


    const payload =
        await response.json();


    if (Array.isArray(payload)) {
        return payload;
    }


    if (Array.isArray(payload.transactions)) {
        return payload.transactions;
    }


    if (Array.isArray(payload.data)) {
        return payload.data;
    }


    if (
        payload.data &&
        Array.isArray(
            payload.data.transactions
        )
    ) {
        return payload.data.transactions;
    }


    return [];
}


// =====================================================
// FIND TRANSACTION
// =====================================================

function findTransaction(
    transactions,
    requestedId
) {

    if (!requestedId) {
        return null;
    }


    const wanted =
        requestedId.toLowerCase();


    // -----------------------------------------------
    // FIRST: NOVAPAY TRANSACTION ID
    // -----------------------------------------------

    const exactMatch =
        transactions.find(transaction => {

            const id =
                getTransactionId(transaction);


            return (
                id &&
                id.toLowerCase() === wanted
            );
        });


    if (exactMatch) {
        return exactMatch;
    }


    // -----------------------------------------------
    // SECOND: PROVIDER REFERENCE
    // -----------------------------------------------

    const providerMatch =
        transactions.find(transaction => {

            const reference =
                getProviderReference(transaction);


            return (
                reference &&
                reference.toLowerCase() === wanted
            );
        });


    if (providerMatch) {
        return providerMatch;
    }


    return null;
}


// =====================================================
// LOADING STATE
// =====================================================

function setLoadingState() {

    if (elements.title) {
        elements.title.textContent =
            "Loading transaction";
    }


    if (elements.status) {
        elements.status.textContent =
            "Please wait";
    }


    if (elements.amount) {
        elements.amount.textContent =
            "₦0.00";
    }


    if (elements.recipient) {
        elements.recipient.textContent =
            "Loading...";
    }


    if (elements.amountText) {
        elements.amountText.textContent =
            "Loading...";
    }


    if (elements.date) {
        elements.date.textContent =
            "Loading...";
    }


    if (elements.transactionId) {
        elements.transactionId.textContent =
            "Loading...";
    }


    if (elements.category) {
        elements.category.textContent =
            "Loading...";
    }


    if (elements.statusText) {
        elements.statusText.textContent =
            "Loading...";
    }


    if (elements.receiptIcon) {

        elements.receiptIcon.classList.remove(
            "success",
            "failed",
            "pending"
        );

        elements.receiptIcon.classList.add(
            "pending"
        );
    }
}


// =====================================================
// ERROR STATE
// =====================================================

function setErrorState(message) {

    if (elements.title) {
        elements.title.textContent =
            "Transaction unavailable";
    }


    if (elements.status) {
        elements.status.textContent =
            "Unable to load";
    }


    if (elements.amount) {
        elements.amount.textContent =
            "₦0.00";
    }


    if (elements.recipient) {
        elements.recipient.textContent =
            "—";
    }


    if (elements.amountText) {
        elements.amountText.textContent =
            "—";
    }


    if (elements.date) {
        elements.date.textContent =
            "—";
    }


    if (elements.transactionId) {
        elements.transactionId.textContent =
            "Not available";
    }


    if (elements.category) {
        elements.category.textContent =
            "—";
    }


    if (elements.statusText) {
        elements.statusText.textContent =
            "Unavailable";
    }


    if (elements.receiptIcon) {

        elements.receiptIcon.classList.remove(
            "success",
            "failed",
            "pending"
        );

        elements.receiptIcon.classList.add(
            "failed"
        );
    }


    console.error(
        "NovaPay receipt error:",
        message
    );
}


// =====================================================
// RENDER TRANSACTION
// =====================================================

function renderTransaction(transaction) {

    const amount =
        getAmountNaira(transaction);


    const direction =
        getTransactionDirection(transaction);


    const rawStatus =
        getStatus(transaction);


    const displayStatus =
        getDisplayStatus(rawStatus);


    const title =
        getTransactionTitle(transaction);


    const recipient =
        getRecipient(transaction);


    const category =
        getCategory(transaction);


    const date =
        formatDate(
            getTransactionDate(transaction)
        );


    const transactionId =
        getTransactionId(transaction);


    const providerReference =
        getProviderReference(transaction);


    /*
    |--------------------------------------------------------------------------
    | IMPORTANT
    |--------------------------------------------------------------------------
    | Prefer the actual NovaPay transaction ID.
    | Provider reference is only a fallback.
    |--------------------------------------------------------------------------
    */

    const reference =
        transactionId ||
        providerReference ||
        "Not available";


    // -----------------------------------------------
    // TITLE
    // -----------------------------------------------

    if (elements.title) {
        elements.title.textContent =
            title;
    }


    // -----------------------------------------------
    // STATUS
    // -----------------------------------------------

    if (elements.status) {
        elements.status.textContent =
            displayStatus;
    }


    if (elements.statusText) {
        elements.statusText.textContent =
            displayStatus;
    }


    // -----------------------------------------------
    // AMOUNT
    // -----------------------------------------------

    const prefix =
        direction === "credit"
            ? "+"
            : "-";


    const formattedAmount =
        `${prefix}${formatCurrency(amount)}`;


    if (elements.amount) {

        elements.amount.textContent =
            formattedAmount;


        elements.amount.classList.remove(
            "credit-amount",
            "debit-amount",
            "pending-amount"
        );


        if (
            displayStatus === "Pending"
        ) {

            elements.amount.classList.add(
                "pending-amount"
            );

        } else if (
            direction === "credit"
        ) {

            elements.amount.classList.add(
                "credit-amount"
            );

        } else {

            elements.amount.classList.add(
                "debit-amount"
            );
        }
    }


    // -----------------------------------------------
    // DETAILS
    // -----------------------------------------------

    if (elements.recipient) {
        elements.recipient.textContent =
            recipient;
    }


    if (elements.amountText) {
        elements.amountText.textContent =
            formattedAmount;
    }


    if (elements.date) {
        elements.date.textContent =
            date;
    }


    if (elements.transactionId) {
        elements.transactionId.textContent =
            reference;
    }


    if (elements.category) {
        elements.category.textContent =
            category;
    }


    // -----------------------------------------------
    // RECEIPT ICON
    // -----------------------------------------------

    if (elements.receiptIcon) {

        elements.receiptIcon.classList.remove(
            "success",
            "failed",
            "pending"
        );


        if (
            displayStatus === "Successful"
        ) {

            elements.receiptIcon.classList.add(
                "success"
            );

        } else if (
            displayStatus === "Failed"
        ) {

            elements.receiptIcon.classList.add(
                "failed"
            );

        } else {

            elements.receiptIcon.classList.add(
                "pending"
            );
        }
    }


    // -----------------------------------------------
    // DEBUG INFORMATION
    // -----------------------------------------------

    console.log(
        "NovaPay receipt loaded:",
        {
            transactionId: reference,
            amount,
            direction,
            status: displayStatus,
            category
        }
    );
}


// =====================================================
// BUTTONS
// =====================================================

function setupButtons() {

    // -----------------------------------------------
    // DONE
    // -----------------------------------------------

    if (elements.doneBtn) {

        elements.doneBtn.addEventListener(
            "click",
            () => {

                window.location.replace(
                    "dashboard.html"
                );
            }
        );
    }


    // -----------------------------------------------
    // BACK
    // -----------------------------------------------

    if (elements.backBtn) {

        elements.backBtn.addEventListener(
            "click",
            () => {

                if (
                    window.history.length > 1
                ) {

                    window.history.back();

                } else {

                    window.location.replace(
                        "dashboard.html"
                    );
                }
            }
        );
    }


    // -----------------------------------------------
    // SUPPORT
    // -----------------------------------------------

    if (elements.supportBtn) {

        elements.supportBtn.addEventListener(
            "click",
            () => {

                const transactionId =
                    getRequestedTransactionId();


                const subject =
                    encodeURIComponent(
                        "NovaPay transaction support"
                    );


                const body =
                    encodeURIComponent(
                        transactionId
                            ? `I need help with transaction ${transactionId}.`
                            : "I need help with a transaction."
                    );


                window.location.href =
                    `mailto:support@novapay.com?subject=${subject}&body=${body}`;
            }
        );
    }
}


// =====================================================
// LOAD RECEIPT
// =====================================================

async function loadReceipt(user) {

    setLoadingState();


    try {

        // -------------------------------------------
        // GET TRANSACTION ID
        // -------------------------------------------

        const requestedId =
            getRequestedTransactionId();


        if (!requestedId) {

            throw new Error(
                "No transaction ID was supplied to the receipt page."
            );
        }


        // -------------------------------------------
        // FIREBASE TOKEN
        // -------------------------------------------

        const token =
            await getFirebaseToken(user);


        // -------------------------------------------
        // LOAD TRANSACTIONS
        // -------------------------------------------

        const transactions =
            await fetchTransactions(token);


        // -------------------------------------------
        // FIND EXACT TRANSACTION
        // -------------------------------------------

        const transaction =
            findTransaction(
                transactions,
                requestedId
            );


        if (!transaction) {

            throw new Error(
                `Transaction "${requestedId}" was not found in the user's transactions.`
            );
        }


        // -------------------------------------------
        // RENDER
        // -------------------------------------------

        renderTransaction(
            transaction
        );

    } catch (error) {

        setErrorState(
            error?.message ||
            "Unable to load transaction."
        );
    }
}


// =====================================================
// START
// =====================================================

setupButtons();


onAuthStateChanged(
    auth,
    user => {

        if (!user) {

            window.location.replace(
                "login.html"
            );

            return;
        }


        loadReceipt(user);
    }
);