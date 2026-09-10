import { auth } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";


// =====================================================
// NOVAPAY BACKEND
// =====================================================

const API_BASE_URL =
    "https://novapay-server.onrender.com";


// =====================================================
// DOM ELEMENTS
// =====================================================

const elements = {

    title:
        document.getElementById(
            "transactionTitle"
        ),

    status:
        document.getElementById(
            "transactionStatus"
        ),

    amount:
        document.getElementById(
            "amount"
        ),

    recipient:
        document.getElementById(
            "recipient"
        ),

    amountText:
        document.getElementById(
            "amountText"
        ),

    date:
        document.getElementById(
            "date"
        ),

    transactionId:
        document.getElementById(
            "transactionId"
        ),

    category:
        document.getElementById(
            "category"
        ),

    statusText:
        document.getElementById(
            "statusText"
        ),

    receiptIcon:
        document.getElementById(
            "receiptIcon"
        ),

    supportBtn:
        document.getElementById(
            "supportBtn"
        ),

    doneBtn:
        document.getElementById(
            "doneBtn"
        ),

    backBtn:
        document.getElementById(
            "backBtn"
        )

};


// =====================================================
// VALUE HELPER
// =====================================================

function firstValue(
    ...values
) {

    for (
        const value
        of values
    ) {

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

function normalizeId(
    value
) {

    if (
        value === undefined ||
        value === null
    ) {

        return "";

    }


    return String(
        value
    ).trim();

}


// =====================================================
// READ SELECTED TRANSACTION
// =====================================================
//
// transaction-history.js stores the selected
// transaction here before opening receipt.html.
//
// This is the PRIMARY receipt data source.
// =====================================================

function getStoredTransaction() {

    try {

        const stored =
            localStorage.getItem(
                "selectedTransaction"
            );


        if (
            !stored
        ) {

            return null;

        }


        const transaction =
            JSON.parse(
                stored
            );


        if (
            !transaction ||
            typeof transaction !== "object"
        ) {

            return null;

        }


        return transaction;

    }

    catch (error) {

        console.error(
            "NovaPay could not read selected transaction:",
            error
        );


        return null;

    }

}


// =====================================================
// TRANSACTION ID
// =====================================================

function getTransactionId(
    transaction
) {

    return normalizeId(

        firstValue(

            transaction?.id,

            transaction?.transactionId,

            transaction?.transaction_id,

            transaction?.txId,

            transaction?.tx_id

        )

    );

}


// =====================================================
// REFERENCE
// =====================================================

function getReference(
    transaction
) {

    return normalizeId(

        firstValue(

            transaction?.reference,

            transaction?.referenceId,

            transaction?.reference_id,

            transaction?.providerReference,

            transaction?.provider_reference

        )

    );

}


// =====================================================
// AMOUNT
// =====================================================
//
// History already stores both:
//
// amount     = Naira
// amountKobo = Kobo
//
// Prefer amountKobo because it is the authoritative
// money representation.
// =====================================================

function getAmountNaira(
    transaction
) {

    const amountKobo =
        Number(
            transaction?.amountKobo
        );


    if (
        Number.isSafeInteger(
            amountKobo
        ) &&
        amountKobo >= 0
    ) {

        return (
            amountKobo /
            100
        );

    }


    const amount =
        Number(
            transaction?.amount
        );


    if (
        Number.isFinite(
            amount
        )
    ) {

        return Math.abs(
            amount
        );

    }


    return 0;

}


// =====================================================
// FORMAT MONEY
// =====================================================

function formatMoney(
    amount
) {

    const numericAmount =
        Number(
            amount
        );


    if (
        !Number.isFinite(
            numericAmount
        )
    ) {

        return "₦0.00";

    }


    return (
        "₦" +
        numericAmount.toLocaleString(
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


// =====================================================
// DIRECTION
// =====================================================
//
// History stores:
//
// type: "in"
// type: "out"
//
// This is the first thing we use.
// =====================================================

function getDirection(
    transaction
) {

    const type =
        String(
            transaction?.type ||
            ""
        )
            .trim()
            .toLowerCase();


    if (
        type === "in"
    ) {

        return "credit";

    }


    if (
        type === "out"
    ) {

        return "debit";

    }


    const direction =
        String(
            transaction?.direction ||
            ""
        )
            .trim()
            .toLowerCase();


    if (
        direction === "credit"
    ) {

        return "credit";

    }


    if (
        direction === "debit"
    ) {

        return "debit";

    }


    const category =
        String(
            transaction?.title ||
            transaction?.category ||
            ""
        )
            .trim()
            .toLowerCase();


    if (
        category.includes(
            "credit"
        ) ||
        category.includes(
            "deposit"
        ) ||
        category.includes(
            "refund"
        )
    ) {

        return "credit";

    }


    return "debit";

}


// =====================================================
// STATUS
// =====================================================

function getStatus(
    transaction
) {

    const rawStatus =
        String(
            transaction?.status ||
            ""
        )
            .trim()
            .toLowerCase();


    if (
        rawStatus === "successful" ||
        rawStatus === "success" ||
        rawStatus === "completed" ||
        rawStatus === "complete" ||
        rawStatus === "paid" ||
        rawStatus === "approved" ||
        rawStatus === "completed-api"
    ) {

        return "Successful";

    }


    if (
        rawStatus === "failed" ||
        rawStatus === "fail" ||
        rawStatus === "cancelled" ||
        rawStatus === "canceled" ||
        rawStatus === "reversed" ||
        rawStatus === "refunded"
    ) {

        return "Failed";

    }


    if (
        rawStatus === "pending" ||
        rawStatus === "processing" ||
        rawStatus === "initiated-api" ||
        rawStatus === "queued-api" ||
        rawStatus === "on-hold"
    ) {

        return "Pending";

    }


    // History already normalizes its own status,
    // so preserve it when it is present.
    if (
        rawStatus
    ) {

        return (
            rawStatus.charAt(0).toUpperCase() +
            rawStatus.slice(1)
        );

    }


    return "Successful";

}


// =====================================================
// TITLE
// =====================================================

function getTitle(
    transaction
) {

    const title =
        firstValue(

            transaction?.title,

            transaction?.description,

            transaction?.category,

            transaction?.service

        );


    if (
        title
    ) {

        return String(
            title
        );

    }


    return "Transaction";

}


// =====================================================
// CATEGORY
// =====================================================

function getCategory(
    transaction
) {

    const category =
        String(
            firstValue(

                transaction?.category,

                transaction?.title,

                transaction?.service,

                transaction?.type

            ) ||
            ""
        )
            .trim()
            .toLowerCase();


    if (
        category.includes(
            "deposit"
        ) ||
        category.includes(
            "credit"
        ) ||
        category.includes(
            "refund"
        )
    ) {

        return "Credit Alert";

    }


    if (
        category.includes(
            "transfer"
        )
    ) {

        return "Transfer";

    }


    if (
        category.includes(
            "airtime"
        )
    ) {

        return "Airtime";

    }


    if (
        category.includes(
            "data"
        )
    ) {

        return "Data";

    }


    if (
        category.includes(
            "electric"
        ) ||
        category.includes(
            "power"
        )
    ) {

        return "Electricity";

    }


    if (
        category.includes(
            "tv"
        ) ||
        category.includes(
            "dstv"
        ) ||
        category.includes(
            "gotv"
        ) ||
        category.includes(
            "startimes"
        )
    ) {

        return "TV";

    }


    if (
        category.includes(
            "bet"
        )
    ) {

        return "Betting";

    }


    if (
        category
    ) {

        return (
            category.charAt(0).toUpperCase() +
            category.slice(1)
        );

    }


    return "Transaction";

}


// =====================================================
// RECIPIENT
// =====================================================

function getRecipient(
    transaction
) {

    const recipient =
        firstValue(

            transaction?.recipientName,

            transaction?.recipient_name,

            transaction?.recipient,

            transaction?.customerName,

            transaction?.customer_name,

            transaction?.customerId,

            transaction?.customer_id,

            transaction?.phoneNumber,

            transaction?.phone,

            transaction?.mobile,

            transaction?.beneficiary

        );


    if (
        recipient
    ) {

        return String(
            recipient
        );

    }


    const category =
        getCategory(
            transaction
        );


    if (
        category ===
        "Credit Alert"
    ) {

        return "NovaPay Wallet";

    }


    return "—";

}


// =====================================================
// DATE
// =====================================================
//
// transaction-history already stores:
//
// "10 Sep 2026 · 5:20 PM"
//
// We preserve that exact formatted date.
// =====================================================

function getDate(
    transaction
) {

    if (
        transaction?.date
    ) {

        return String(
            transaction.date
        );

    }


    const timestamp =
        firstValue(

            transaction?.createdAt,

            transaction?.timestamp,

            transaction?.created_at

        );


    if (
        !timestamp
    ) {

        return "Date unavailable";

    }


    let milliseconds = 0;


    if (
        typeof timestamp?.toMillis ===
        "function"
    ) {

        milliseconds =
            timestamp.toMillis();

    }


    else if (
        typeof timestamp?.toDate ===
        "function"
    ) {

        const date =
            timestamp.toDate();


        milliseconds =
            date.getTime();

    }


    else if (
        typeof timestamp ===
        "object"
    ) {

        if (
            Number.isFinite(
                Number(
                    timestamp.seconds
                )
            )
        ) {

            milliseconds =
                Number(
                    timestamp.seconds
                ) *
                1000;

        }

        else if (
            Number.isFinite(
                Number(
                    timestamp._seconds
                )
            )
        ) {

            milliseconds =
                Number(
                    timestamp._seconds
                ) *
                1000;

        }

    }


    else if (
        typeof timestamp ===
        "number"
    ) {

        milliseconds =
            timestamp < 100000000000
                ? timestamp * 1000
                : timestamp;

    }


    else if (
        typeof timestamp ===
        "string"
    ) {

        milliseconds =
            Date.parse(
                timestamp
            );

    }


    if (
        !Number.isFinite(
            milliseconds
        ) ||
        milliseconds <= 0
    ) {

        return "Date unavailable";

    }


    return new Date(
        milliseconds
    ).toLocaleString(
        "en-NG",
        {
            day:
                "numeric",

            month:
                "short",

            year:
                "numeric",

            hour:
                "numeric",

            minute:
                "2-digit"
        }
    );

}


// =====================================================
// LOADING STATE
// =====================================================

function setLoadingState() {

    if (
        elements.title
    ) {

        elements.title.textContent =
            "Loading transaction";

    }


    if (
        elements.status
    ) {

        elements.status.textContent =
            "Please wait";

    }


    if (
        elements.amount
    ) {

        elements.amount.textContent =
            "₦0.00";

    }


    if (
        elements.recipient
    ) {

        elements.recipient.textContent =
            "Loading...";

    }


    if (
        elements.amountText
    ) {

        elements.amountText.textContent =
            "Loading...";

    }


    if (
        elements.date
    ) {

        elements.date.textContent =
            "Loading...";

    }


    if (
        elements.transactionId
    ) {

        elements.transactionId.textContent =
            "Loading...";

    }


    if (
        elements.category
    ) {

        elements.category.textContent =
            "Loading...";

    }


    if (
        elements.statusText
    ) {

        elements.statusText.textContent =
            "Loading...";

    }


    if (
        elements.receiptIcon
    ) {

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

function setErrorState(
    message
) {

    if (
        elements.title
    ) {

        elements.title.textContent =
            "Transaction unavailable";

    }


    if (
        elements.status
    ) {

        elements.status.textContent =
            "Unable to load";

    }


    if (
        elements.amount
    ) {

        elements.amount.textContent =
            "₦0.00";

    }


    if (
        elements.recipient
    ) {

        elements.recipient.textContent =
            "—";

    }


    if (
        elements.amountText
    ) {

        elements.amountText.textContent =
            "—";

    }


    if (
        elements.date
    ) {

        elements.date.textContent =
            "—";

    }


    if (
        elements.transactionId
    ) {

        elements.transactionId.textContent =
            "Not available";

    }


    if (
        elements.category
    ) {

        elements.category.textContent =
            "—";

    }


    if (
        elements.statusText
    ) {

        elements.statusText.textContent =
            "Unavailable";

    }


    if (
        elements.receiptIcon
    ) {

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
// RENDER RECEIPT
// =====================================================

function renderReceipt(
    transaction
) {

    const amount =
        getAmountNaira(
            transaction
        );


    const direction =
        getDirection(
            transaction
        );


    const status =
        getStatus(
            transaction
        );


    const title =
        getTitle(
            transaction
        );


    const category =
        getCategory(
            transaction
        );


    const recipient =
        getRecipient(
            transaction
        );


    const date =
        getDate(
            transaction
        );


    const transactionId =
        getTransactionId(
            transaction
        );


    const reference =
        getReference(
            transaction
        );


    /*
    |--------------------------------------------------------------------------
    | IMPORTANT
    |--------------------------------------------------------------------------
    | The local NovaPay transaction ID is preferred.
    | Reference is only a fallback.
    |--------------------------------------------------------------------------
    */

    const displayedReference =
        transactionId ||
        reference ||
        "Not available";


    const prefix =
        direction === "credit"
            ? "+"
            : "-";


    const formattedAmount =
        `${prefix}${formatMoney(amount)}`;


    // =================================================
    // TITLE
    // =================================================

    if (
        elements.title
    ) {

        elements.title.textContent =
            title;

    }


    // =================================================
    // STATUS
    // =================================================

    if (
        elements.status
    ) {

        elements.status.textContent =
            status;

    }


    if (
        elements.statusText
    ) {

        elements.statusText.textContent =
            status;

    }


    // =================================================
    // AMOUNT
    // =================================================

    if (
        elements.amount
    ) {

        elements.amount.textContent =
            formattedAmount;


        elements.amount.classList.remove(
            "credit-amount",
            "debit-amount",
            "pending-amount"
        );


        if (
            status ===
            "Pending"
        ) {

            elements.amount.classList.add(
                "pending-amount"
            );

        }

        else if (
            direction ===
            "credit"
        ) {

            elements.amount.classList.add(
                "credit-amount"
            );

        }

        else {

            elements.amount.classList.add(
                "debit-amount"
            );

        }

    }


    // =================================================
    // DETAILS
    // =================================================

    if (
        elements.recipient
    ) {

        elements.recipient.textContent =
            recipient;

    }


    if (
        elements.amountText
    ) {

        elements.amountText.textContent =
            formattedAmount;

    }


    if (
        elements.date
    ) {

        elements.date.textContent =
            date;

    }


    if (
        elements.transactionId
    ) {

        elements.transactionId.textContent =
            displayedReference;

    }


    if (
        elements.category
    ) {

        elements.category.textContent =
            category;

    }


    // =================================================
    // ICON STATE
    // =================================================

    if (
        elements.receiptIcon
    ) {

        elements.receiptIcon.classList.remove(
            "success",
            "failed",
            "pending"
        );


        if (
            status ===
            "Successful"
        ) {

            elements.receiptIcon.classList.add(
                "success"
            );

        }

        else if (
            status ===
            "Failed"
        ) {

            elements.receiptIcon.classList.add(
                "failed"
            );

        }

        else {

            elements.receiptIcon.classList.add(
                "pending"
            );

        }

    }


    // =================================================
    // DEVELOPER CONSOLE
    // =================================================

    console.log(
        "NovaPay receipt loaded:",
        {
            transactionId:
                displayedReference,

            amount:
                amount,

            direction:
                direction,

            status:
                status,

            category:
                category
        }
    );

}


// =====================================================
// OPTIONAL API FALLBACK
// =====================================================
//
// This is only used if localStorage does not contain
// the selected transaction.
//
// We do NOT make the API the primary source because
// your existing History page already passes the exact
// selected transaction to the receipt.
// =====================================================

async function loadTransactionFromAPI(
    user,
    transactionId
) {

    if (
        !user ||
        !transactionId
    ) {

        return null;

    }


    const token =
        await user.getIdToken();


    const response =
        await fetch(
            `${API_BASE_URL}/api/transactions?limit=50`,
            {

                method:
                    "GET",

                headers: {

                    Authorization:
                        `Bearer ${token}`,

                    Accept:
                        "application/json"

                },

                cache:
                    "no-store"

            }
        );


    if (
        !response.ok
    ) {

        throw new Error(
            `Transaction request failed (${response.status}).`
        );

    }


    const result =
        await response.json();


    if (
        !result?.success ||
        !Array.isArray(
            result.transactions
        )
    ) {

        throw new Error(
            "Invalid transaction response."
        );

    }


    const wantedId =
        transactionId.toLowerCase();


    const transaction =
        result.transactions.find(
            item => {

                const id =
                    getTransactionId(
                        item
                    );


                return (
                    id &&
                    id.toLowerCase() ===
                    wantedId
                );

            }
        );


    return transaction || null;

}


// =====================================================
// BUTTONS
// =====================================================

function setupButtons() {

    // -----------------------------------------------
    // DONE
    // -----------------------------------------------

    elements.doneBtn?.addEventListener(
        "click",
        () => {

            window.location.replace(
                "dashboard.html"
            );

        }
    );


    // -----------------------------------------------
    // BACK
    // -----------------------------------------------

    elements.backBtn?.addEventListener(
        "click",
        () => {

            if (
                window.history.length > 1
            ) {

                window.history.back();

            }

            else {

                window.location.replace(
                    "transaction-history.html"
                );

            }

        }
    );


    // -----------------------------------------------
    // SUPPORT
    // -----------------------------------------------

    elements.supportBtn?.addEventListener(
        "click",
        () => {

            const transaction =
                getStoredTransaction();


            const transactionId =
                getTransactionId(
                    transaction || {}
                );


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


// =====================================================
// MAIN RECEIPT LOADER
// =====================================================

async function loadReceipt(
    user
) {

    setLoadingState();


    try {

        // =================================================
        // FIRST: READ THE TRANSACTION THAT HISTORY SAVED
        // =================================================

        const storedTransaction =
            getStoredTransaction();


        if (
            storedTransaction
        ) {

            /*
            * This is the normal NovaPay flow.
            *
            * History already selected the transaction
            * and stored it before opening receipt.html.
            */

            renderReceipt(
                storedTransaction
            );

            return;

        }


        // =================================================
        // FALLBACK: URL ID
        // =================================================

        const params =
            new URLSearchParams(
                window.location.search
            );


        const requestedId =
            normalizeId(

                firstValue(

                    params.get(
                        "transactionId"
                    ),

                    params.get(
                        "transaction_id"
                    ),

                    params.get(
                        "txId"
                    ),

                    params.get(
                        "tx_id"
                    ),

                    params.get(
                        "id"
                    ),

                    params.get(
                        "reference"
                    )

                )

            );


        if (
            requestedId
        ) {

            const transaction =
                await loadTransactionFromAPI(
                    user,
                    requestedId
                );


            if (
                transaction
            ) {

                renderReceipt(
                    transaction
                );

                return;

            }

        }


        // =================================================
        // NOTHING FOUND
        // =================================================

        throw new Error(
            "No selected transaction was found."
        );

    }

    catch (error) {

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

        if (
            !user
        ) {

            window.location.replace(
                "login.html"
            );

            return;

        }


        loadReceipt(
            user
        );

    }
);