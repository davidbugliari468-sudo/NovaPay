/* =========================================================
   NOVAPAY — TRANSACTION HISTORY
   Secure backend-powered transaction history
   ========================================================= */

import { auth } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

/* =========================================================
   CONFIG
   ========================================================= */

const API_URL =
    "https://novapay-server.onrender.com/api/transactions?limit=100";

/* =========================================================
   DOM
   ========================================================= */

const container =
    document.getElementById("transactionContainer");

const transactionCount =
    document.getElementById("transactionCount");

const moneyIn =
    document.getElementById("moneyIn");

const moneyOut =
    document.getElementById("moneyOut");

const netAmount =
    document.getElementById("netAmount");

const searchInput =
    document.getElementById("searchInput");

const categoryBtn =
    document.getElementById("categoryBtn");

const statusBtn =
    document.getElementById("statusBtn");

const monthBtn =
    document.getElementById("monthBtn");

const categorySheet =
    document.getElementById("categorySheet");

const statusSheet =
    document.getElementById("statusSheet");

const monthSheet =
    document.getElementById("monthSheet");

const exportSheet =
    document.getElementById("exportSheet");

const sheetOverlay =
    document.getElementById("sheetOverlay");

const backBtn =
    document.getElementById("backBtn");

const exportBtn =
    document.getElementById("exportBtn");

/* =========================================================
   STATE
   ========================================================= */

let allTransactions = [];

let selectedCategory = "All Categories";
let selectedStatus = "All Status";
let selectedMonth = "This Month";

/* =========================================================
   AUTH
   ========================================================= */

onAuthStateChanged(auth, async (user) => {

    if (!user) {
        window.location.href = "login.html";
        return;
    }

    await loadTransactions();
});

/* =========================================================
   LOAD TRANSACTIONS
   ========================================================= */

async function loadTransactions() {

    showLoading();

    try {

        const user = auth.currentUser;

        if (!user) {
            throw new Error("Authentication required.");
        }

        /*
         * IMPORTANT SECURITY RULE:
         *
         * We do NOT send a UID.
         *
         * The backend gets the UID from the
         * verified Firebase ID token.
         */

        const idToken =
            await user.getIdToken(true);

        const response =
            await fetch(API_URL, {
                method: "GET",

                headers: {
                    "Authorization":
                        `Bearer ${idToken}`,

                    "Accept":
                        "application/json"
                },

                cache: "no-store"
            });

        let result;

        try {
            result = await response.json();
        } catch {
            throw new Error(
                "NovaPay server returned an invalid response."
            );
        }

        if (!response.ok) {

            throw new Error(
                result?.message ||
                `Server error (${response.status}).`
            );
        }

        if (!result?.success) {

            throw new Error(
                result?.message ||
                "Unable to load transaction history."
            );
        }

        allTransactions =
            Array.isArray(result.transactions)
                ? result.transactions
                : [];

        /*
         * Normalize and sort newest first.
         */

        allTransactions.sort(
            (a, b) =>
                getDateValue(b) -
                getDateValue(a)
        );

        renderTransactions();

        console.log(
            `NovaPay: loaded ${allTransactions.length} transactions.`
        );

    } catch (error) {

        console.error(
            "NovaPay transaction history error:",
            error
        );

        showError(
            error?.message ||
            "Unable to load your transaction history."
        );
    }
}

/* =========================================================
   TRANSACTION TYPE
   ========================================================= */

function getTransactionType(transaction) {

    return String(
        transaction?.type ||
        transaction?.category ||
        ""
    )
        .trim()
        .toUpperCase();
}

/* =========================================================
   CATEGORY
   ========================================================= */

function getCategory(transaction) {

    const type =
        getTransactionType(transaction);

    switch (type) {

        case "DEPOSIT":
        case "CREDIT":
        case "CREDIT_ALERT":
            return "Credit Alert";

        case "TRANSFER":
        case "BANK_TRANSFER":
        case "TRANSFER_IN":
        case "TRANSFER_OUT":
            return "Transfer";

        case "AIRTIME":
            return "Airtime";

        case "DATA":
            return "Data";

        case "ELECTRICITY":
        case "POWER":
            return "Electricity";

        case "TV":
        case "DSTV":
        case "GOTV":
        case "STARTIMES":
            return "TV";

        case "BETTING":
            return "Betting";

        default:
            return "Transaction";
    }
}

/* =========================================================
   MONEY DIRECTION
   ========================================================= */

function isMoneyIn(transaction) {

    const type =
        getTransactionType(transaction);

    /*
     * Explicit backend direction wins if present.
     */

    const direction =
        String(
            transaction?.direction ||
            transaction?.flow ||
            ""
        )
            .trim()
            .toUpperCase();

    if (
        direction === "IN" ||
        direction === "CREDIT" ||
        direction === "CREDITED"
    ) {
        return true;
    }

    if (
        direction === "OUT" ||
        direction === "DEBIT" ||
        direction === "DEBITED"
    ) {
        return false;
    }

    /*
     * Known credit transaction types.
     */

    return (
        type === "DEPOSIT" ||
        type === "CREDIT" ||
        type === "CREDIT_ALERT" ||
        type === "TRANSFER_IN"
    );
}

/* =========================================================
   STATUS
   ========================================================= */

function getStatus(transaction) {

    const rawStatus =
        String(
            transaction?.status ||
            ""
        )
            .trim()
            .toUpperCase();

    if (
        rawStatus === "SUCCESS" ||
        rawStatus === "SUCCESSFUL" ||
        rawStatus === "COMPLETED" ||
        rawStatus === "COMPLETE" ||
        rawStatus === "PAID"
    ) {
        return "Successful";
    }

    if (
        rawStatus === "FAILED" ||
        rawStatus === "FAIL" ||
        rawStatus === "CANCELLED" ||
        rawStatus === "CANCELED" ||
        rawStatus === "REVERSED"
    ) {
        return "Failed";
    }

    return "Pending";
}

/* =========================================================
   TIMESTAMP NORMALIZATION
   ========================================================= */

function timestampToMillis(timestamp) {

    if (!timestamp) {
        return 0;
    }

    /*
     * Firebase Timestamp object.
     */

    if (
        typeof timestamp.toMillis ===
        "function"
    ) {
        return timestamp.toMillis();
    }

    if (
        typeof timestamp.toDate ===
        "function"
    ) {
        const date =
            timestamp.toDate();

        const value =
            date.getTime();

        return Number.isFinite(value)
            ? value
            : 0;
    }

    /*
     * Firestore JSON formats.
     *
     * Different transports can produce:
     *
     * seconds
     * _seconds
     * milliseconds
     * _milliseconds
     */

    if (
        Number.isFinite(
            Number(timestamp.seconds)
        )
    ) {
        return (
            Number(timestamp.seconds) *
            1000
        );
    }

    if (
        Number.isFinite(
            Number(timestamp._seconds)
        )
    ) {
        return (
            Number(timestamp._seconds) *
            1000
        );
    }

    if (
        Number.isFinite(
            Number(timestamp.milliseconds)
        )
    ) {
        return Number(
            timestamp.milliseconds
        );
    }

    if (
        Number.isFinite(
            Number(timestamp._milliseconds)
        )
    ) {
        return Number(
            timestamp._milliseconds
        );
    }

    /*
     * ISO string / numeric string.
     */

    if (
        typeof timestamp === "string" ||
        typeof timestamp === "number"
    ) {

        const numeric =
            Number(timestamp);

        if (
            Number.isFinite(numeric) &&
            numeric > 100000000000
        ) {
            return numeric;
        }

        const parsed =
            new Date(timestamp).getTime();

        return Number.isFinite(parsed)
            ? parsed
            : 0;
    }

    /*
     * Firestore Timestamp JSON can contain
     * a date string inside toJSON().
     */

    try {

        if (
            typeof timestamp.toJSON ===
            "function"
        ) {

            const json =
                timestamp.toJSON();

            if (
                json?.seconds !== undefined
            ) {
                return (
                    Number(json.seconds) *
                    1000
                );
            }

            if (
                json?.timestamp
            ) {

                const parsed =
                    new Date(
                        json.timestamp
                    ).getTime();

                return Number.isFinite(parsed)
                    ? parsed
                    : 0;
            }
        }

    } catch {
        /* Ignore and continue. */
    }

    /*
     * Final attempt.
     */

    const parsed =
        new Date(timestamp).getTime();

    return Number.isFinite(parsed)
        ? parsed
        : 0;
}

/* =========================================================
   DATE
   ========================================================= */

function getDateValue(transaction) {

    const timestamp =
        transaction?.completedAt ||
        transaction?.createdAt ||
        transaction?.updatedAt;

    return timestampToMillis(timestamp);
}

function getTransactionDate(transaction) {

    const value =
        getDateValue(transaction);

    if (!value) {
        return null;
    }

    const date =
        new Date(value);

    return Number.isNaN(
        date.getTime()
    )
        ? null
        : date;
}

/* =========================================================
   DATE FORMAT
   ========================================================= */

function formatDate(transaction) {

    const date =
        getTransactionDate(transaction);

    if (!date) {
        return "Date unavailable";
    }

    return date.toLocaleDateString(
        "en-NG",
        {
            day: "numeric",
            month: "short",
            year: "numeric"
        }
    );
}

function formatTime(transaction) {

    const date =
        getTransactionDate(transaction);

    if (!date) {
        return "--:--";
    }

    return date.toLocaleTimeString(
        "en-NG",
        {
            hour: "numeric",
            minute: "2-digit"
        }
    );
}

/* =========================================================
   AMOUNT
   ========================================================= */

function getAmount(transaction) {

    const amount =
        Number(
            transaction?.amount ??
            transaction?.amountPaid ??
            0
        );

    if (!Number.isFinite(amount)) {
        return 0;
    }

    return Math.abs(amount);
}

/* =========================================================
   MONEY FORMAT
   ========================================================= */

function formatMoney(amount) {

    return Number(amount || 0)
        .toLocaleString(
            "en-NG",
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }
        );
}

/* =========================================================
   TITLE
   ========================================================= */

function getTitle(transaction) {

    return getCategory(transaction);
}

/* =========================================================
   ICON
   ========================================================= */

function getIcon(transaction) {

    switch (
        getCategory(transaction)
    ) {

        case "Credit Alert":
            return "fa-arrow-down";

        case "Transfer":
            return "fa-money-bill-transfer";

        case "Airtime":
            return "fa-mobile-screen-button";

        case "Data":
            return "fa-signal";

        case "Electricity":
            return "fa-bolt";

        case "TV":
            return "fa-tv";

        case "Betting":
            return "fa-bullseye";

        default:
            return "fa-receipt";
    }
}

/* =========================================================
   ICON COLOR
   ========================================================= */

function getIconColor(transaction) {

    switch (
        getCategory(transaction)
    ) {

        case "Credit Alert":
            return "#16A34A";

        case "Electricity":
            return "#F59E0B";

        case "TV":
            return "#7C3AED";

        case "Betting":
            return "#EC4899";

        default:
            return "#2563EB";
    }
}

/* =========================================================
   FILTERING
   ========================================================= */

function getFilteredTransactions() {

    const search =
        String(
            searchInput?.value ||
            ""
        )
            .trim()
            .toLowerCase();

    return allTransactions.filter(
        (transaction) => {

            const category =
                getCategory(transaction);

            const status =
                getStatus(transaction);

            const date =
                getTransactionDate(transaction);

            /* CATEGORY */

            if (
                selectedCategory !==
                "All Categories" &&
                category !==
                selectedCategory
            ) {
                return false;
            }

            /* STATUS */

            if (
                selectedStatus !==
                "All Status" &&
                status !==
                selectedStatus
            ) {
                return false;
            }

            /* MONTH */

            if (
                selectedMonth ===
                "This Month"
            ) {

                if (!date) {
                    return false;
                }

                const now =
                    new Date();

                if (
                    date.getMonth() !==
                    now.getMonth() ||
                    date.getFullYear() !==
                    now.getFullYear()
                ) {
                    return false;
                }

            } else if (
                selectedMonth !==
                "All Months"
            ) {

                if (!date) {
                    return false;
                }

                const monthName =
                    date.toLocaleString(
                        "en-US",
                        {
                            month: "long"
                        }
                    );

                if (
                    monthName !==
                    selectedMonth
                ) {
                    return false;
                }
            }

            /* SEARCH */

            if (search) {

                const searchable = [

                    getTitle(transaction),

                    getCategory(transaction),

                    getTransactionType(transaction),

                    getStatus(transaction),

                    transaction?.customerEmail,

                    transaction?.phoneNumber,

                    transaction?.recipient,

                    transaction?.transactionReference,

                    transaction?.paymentReference,

                    transaction?.reference,

                    transaction?.description

                ]
                    .filter(
                        value =>
                            value !==
                            undefined &&
                            value !== null
                    )
                    .join(" ")
                    .toLowerCase();

                if (
                    !searchable.includes(
                        search
                    )
                ) {
                    return false;
                }
            }

            return true;
        }
    );
}

/* =========================================================
   RENDER
   ========================================================= */

function renderTransactions() {

    if (!container) {
        return;
    }

    const transactions =
        getFilteredTransactions();

    updateSummary(
        transactions
    );

    container.innerHTML = "";

    if (
        transactions.length === 0
    ) {

        showEmptyState();

        return;
    }

    transactions.forEach(
        transaction => {

            container.appendChild(
                createTransactionCard(
                    transaction
                )
            );
        }
    );
}

/* =========================================================
   TRANSACTION CARD
   ========================================================= */

function createTransactionCard(
    transaction
) {

    const item =
        document.createElement("div");

    item.className =
        "transaction-item";

    const amount =
        getAmount(transaction);

    const moneyInTransaction =
        isMoneyIn(transaction);

    const status =
        getStatus(transaction);

    const title =
        getTitle(transaction);

    const icon =
        getIcon(transaction);

    const iconColor =
        getIconColor(transaction);

    const amountClass =
        moneyInTransaction
            ? "amount-in"
            : "amount-out";

    const prefix =
        moneyInTransaction
            ? "+"
            : "-";

    const statusClass =
        status === "Successful"
            ? "status-successful"
            : status === "Failed"
                ? "status-failed"
                : "status-pending";

    item.innerHTML = `

        <div
            class="transaction-icon"
            style="background:${iconColor};"
        >
            <i class="fas ${icon}"></i>
        </div>

        <div class="transaction-content">

            <div class="transaction-top">

                <div class="transaction-title">
                    ${escapeHTML(title)}
                </div>

                <div
                    class="transaction-amount ${amountClass}"
                >
                    ${prefix}₦${formatMoney(amount)}
                </div>

            </div>

            <div class="transaction-bottom">

                <div class="transaction-date">
                    ${escapeHTML(formatDate(transaction))}
                    ·
                    ${escapeHTML(formatTime(transaction))}
                </div>

                <div class="transaction-status">

                    <span
                        class="status-dot ${statusClass}"
                    ></span>

                    ${escapeHTML(status)}

                </div>

            </div>

        </div>

        <div class="transaction-arrow">
            <i class="fas fa-chevron-right"></i>
        </div>
    `;

    /* RECEIPT */

    item.addEventListener(
        "click",
        () => {

            const selectedTransaction = {

                title:
                    getTitle(transaction),

                amount:
                    getAmount(transaction),

                type:
                    moneyInTransaction
                        ? "in"
                        : "out",

                status,

                date:
                    `${formatDate(transaction)} · ${formatTime(transaction)}`,

                id:
                    transaction?.transactionReference ||
                    transaction?.paymentReference ||
                    transaction?.reference ||
                    transaction?.id ||
                    "--"
            };

            localStorage.setItem(
                "selectedTransaction",
                JSON.stringify(
                    selectedTransaction
                )
            );

            window.location.href =
                "receipt.html";
        }
    );

    return item;
}

/* =========================================================
   SUMMARY
   ========================================================= */

function updateSummary(
    transactions
) {

    let totalIn = 0;
    let totalOut = 0;

    transactions.forEach(
        transaction => {

            const amount =
                getAmount(transaction);

            if (
                isMoneyIn(transaction)
            ) {
                totalIn += amount;
            } else {
                totalOut += amount;
            }
        }
    );

    const balance =
        totalIn - totalOut;

    if (moneyIn) {

        moneyIn.textContent =
            `₦${formatMoney(totalIn)}`;
    }

    if (moneyOut) {

        moneyOut.textContent =
            `₦${formatMoney(totalOut)}`;
    }

    if (netAmount) {

        netAmount.textContent =
            balance < 0
                ? `-₦${formatMoney(Math.abs(balance))}`
                : `₦${formatMoney(balance)}`;
    }

    if (transactionCount) {

        transactionCount.textContent =
            `Showing ${transactions.length} Transaction${
                transactions.length === 1
                    ? ""
                    : "s"
            }`;
    }
}

/* =========================================================
   LOADING
   ========================================================= */

function showLoading() {

    if (!container) {
        return;
    }

    container.innerHTML = `

        <div class="empty-state">

            <i class="fas fa-spinner fa-spin"></i>

            <h3>Loading transactions</h3>

            <p>
                Please wait while we load
                your transaction history.
            </p>

        </div>
    `;
}

/* =========================================================
   EMPTY
   ========================================================= */

function showEmptyState() {

    if (!container) {
        return;
    }

    container.innerHTML = `

        <div class="empty-state">

            <i class="fas fa-receipt"></i>

            <h3>No Transactions Found</h3>

            <p>
                No transactions match
                your current filters.
            </p>

        </div>
    `;
}

/* =========================================================
   ERROR
   ========================================================= */

function showError(message) {

    if (!container) {
        return;
    }

    container.innerHTML = `

        <div class="empty-state">

            <i class="fas fa-circle-exclamation"></i>

            <h3>Unable to Load Transactions</h3>

            <p>
                ${escapeHTML(message)}
            </p>

        </div>
    `;
}

/* =========================================================
   BOTTOM SHEETS
   ========================================================= */

function openSheet(sheet) {

    closeSheets();

    if (!sheet) {
        return;
    }

    sheet.classList.add("active");

    if (sheetOverlay) {
        sheetOverlay.classList.add("active");
    }
}

function closeSheets() {

    [
        categorySheet,
        statusSheet,
        monthSheet,
        exportSheet
    ].forEach(sheet => {

        sheet?.classList.remove(
            "active"
        );
    });

    sheetOverlay?.classList.remove(
        "active"
    );
}

/* =========================================================
   FILTER BUTTONS
   ========================================================= */

categoryBtn?.addEventListener(
    "click",
    event => {

        event.preventDefault();

        openSheet(
            categorySheet
        );
    }
);

statusBtn?.addEventListener(
    "click",
    event => {

        event.preventDefault();

        openSheet(
            statusSheet
        );
    }
);

monthBtn?.addEventListener(
    "click",
    event => {

        event.preventDefault();

        openSheet(
            monthSheet
        );
    }
);

sheetOverlay?.addEventListener(
    "click",
    closeSheets
);

/* =========================================================
   CATEGORY OPTIONS
   ========================================================= */

document
    .querySelectorAll(
        "#categorySheet .sheet-option"
    )
    .forEach(button => {

        button.addEventListener(
            "click",
            event => {

                event.preventDefault();

                selectedCategory =
                    button.dataset.category ||
                    button.textContent.trim() ||
                    "All Categories";

                const span =
                    categoryBtn?.querySelector(
                        "span"
                    );

                if (span) {
                    span.textContent =
                        selectedCategory;
                }

                closeSheets();

                renderTransactions();
            }
        );
    });

/* =========================================================
   STATUS OPTIONS
   ========================================================= */

document
    .querySelectorAll(
        "#statusSheet .sheet-option"
    )
    .forEach(button => {

        button.addEventListener(
            "click",
            event => {

                event.preventDefault();

                selectedStatus =
                    button.dataset.status ||
                    button.textContent.trim() ||
                    "All Status";

                const span =
                    statusBtn?.querySelector(
                        "span"
                    );

                if (span) {
                    span.textContent =
                        selectedStatus;
                }

                closeSheets();

                renderTransactions();
            }
        );
    });

/* =========================================================
   MONTH OPTIONS
   ========================================================= */

document
    .querySelectorAll(
        "#monthSheet .sheet-option"
    )
    .forEach(button => {

        button.addEventListener(
            "click",
            event => {

                event.preventDefault();

                selectedMonth =
                    button.dataset.month ||
                    button.textContent.trim() ||
                    "This Month";

                const span =
                    monthBtn?.querySelector(
                        "span"
                    );

                if (span) {
                    span.textContent =
                        selectedMonth;
                }

                closeSheets();

                renderTransactions();
            }
        );
    });

/* =========================================================
   SEARCH
   ========================================================= */

searchInput?.addEventListener(
    "input",
    () => {
        renderTransactions();
    }
);

/* =========================================================
   BACK
   ========================================================= */

backBtn?.addEventListener(
    "click",
    event => {

        event.preventDefault();

        window.history.back();
    }
);

/* =========================================================
   EXPORT MENU
   ========================================================= */

exportBtn?.addEventListener(
    "click",
    event => {

        event.preventDefault();

        openSheet(
            exportSheet
        );
    }
);

/* =========================================================
   CSV EXPORT
   ========================================================= */

document
    .getElementById("exportCSV")
    ?.addEventListener(
        "click",
        event => {

            event.preventDefault();

            exportCSV();

            closeSheets();
        }
    );

function exportCSV() {

    const transactions =
        getFilteredTransactions();

    const rows = [

        [
            "Date",
            "Category",
            "Type",
            "Amount",
            "Direction",
            "Status",
            "Reference"
        ]
    ];

    transactions.forEach(
        transaction => {

            rows.push([

                `${formatDate(transaction)} ${formatTime(transaction)}`,

                getCategory(transaction),

                getTransactionType(transaction),

                getAmount(transaction),

                isMoneyIn(transaction)
                    ? "Money In"
                    : "Money Out",

                getStatus(transaction),

                transaction?.transactionReference ||
                transaction?.paymentReference ||
                transaction?.reference ||
                ""
            ]);
        }
    );

    const csv =
        rows
            .map(
                row =>
                    row
                        .map(
                            value =>
                                `"${String(value)
                                    .replaceAll(
                                        '"',
                                        '""'
                                    )}"`
                        )
                        .join(",")
            )
            .join("\n");

    const blob =
        new Blob(
            [csv],
            {
                type:
                    "text/csv;charset=utf-8;"
            }
        );

    const url =
        URL.createObjectURL(blob);

    const link =
        document.createElement("a");

    link.href = url;

    link.download =
        "NovaPay-Transaction-History.csv";

    document.body.appendChild(link);

    link.click();

    link.remove();

    URL.revokeObjectURL(url);
}

/* =========================================================
   PRINT / PDF
   ========================================================= */

document
    .getElementById("printHistory")
    ?.addEventListener(
        "click",
        event => {

            event.preventDefault();

            closeSheets();

            window.print();
        }
    );

document
    .getElementById("exportPDF")
    ?.addEventListener(
        "click",
        event => {

            event.preventDefault();

            closeSheets();

            window.print();
        }
    );

/* =========================================================
   ESCAPE HTML
   ========================================================= */

function escapeHTML(value) {

    return String(value ?? "")
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );
}

/* =========================================================
   STARTUP
   ========================================================= */

console.log(
    "🔐 NovaPay Transaction History loaded."
);