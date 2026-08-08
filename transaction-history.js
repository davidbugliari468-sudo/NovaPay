/* =========================================================
   NOVAPAY — TRANSACTION HISTORY
   ========================================================= */

import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";


/* =========================================================
   ELEMENTS
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

let currentUser = null;

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

    currentUser = user;

    await loadTransactions();

});


/* =========================================================
   LOAD TRANSACTIONS
   ========================================================= */

async function loadTransactions() {

    showLoading();

    try {

        const snapshot =
            await getDocs(
                collection(db, "transactions")
            );

        allTransactions = [];

        snapshot.forEach((docSnap) => {

            const data = docSnap.data();

            /*
             * Only show transactions belonging
             * to the logged-in user.
             */

            if (data.uid === currentUser.uid) {

                allTransactions.push({
                    id: docSnap.id,
                    ...data
                });

            }

        });


        /*
         * Newest transaction first.
         */

        allTransactions.sort((a, b) => {

            return getDateValue(b) -
                   getDateValue(a);

        });


        renderTransactions();

    } catch (error) {

        console.error(
            "NovaPay transaction history error:",
            error
        );

        showError();

    }

}


/* =========================================================
   TRANSACTION TYPE
   ========================================================= */

function getTransactionType(transaction) {

    return String(
        transaction.type || ""
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
            return "Transfer";


        case "AIRTIME":
            return "Airtime";


        case "DATA":
            return "Data";


        case "ELECTRICITY":
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
     * Wallet deposits are Money In.
     */

    return (
        type === "DEPOSIT" ||
        type === "CREDIT" ||
        type === "CREDIT_ALERT"
    );

}


/* =========================================================
   STATUS
   ========================================================= */

function getStatus(transaction) {

    const rawStatus =
        String(
            transaction.status || ""
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
        rawStatus === "CANCELED"
    ) {

        return "Failed";

    }


    return "Pending";

}


/* =========================================================
   DATE VALUE
   ========================================================= */

function getDateValue(transaction) {

    const timestamp =
        transaction.completedAt ||
        transaction.createdAt;


    if (!timestamp) {

        return 0;

    }


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

        return timestamp.toDate().getTime();

    }


    if (
        timestamp.seconds !== undefined
    ) {

        return timestamp.seconds * 1000;

    }


    const date =
        new Date(timestamp);


    return isNaN(date.getTime())
        ? 0
        : date.getTime();

}


/* =========================================================
   DATE OBJECT
   ========================================================= */

function getTransactionDate(transaction) {

    const timestamp =
        transaction.completedAt ||
        transaction.createdAt;


    if (!timestamp) {

        return new Date();

    }


    if (
        typeof timestamp.toDate ===
        "function"
    ) {

        return timestamp.toDate();

    }


    if (
        typeof timestamp.toMillis ===
        "function"
    ) {

        return new Date(
            timestamp.toMillis()
        );

    }


    if (
        timestamp.seconds !== undefined
    ) {

        return new Date(
            timestamp.seconds * 1000
        );

    }


    const date =
        new Date(timestamp);


    return isNaN(date.getTime())
        ? new Date()
        : date;

}


/* =========================================================
   DATE FORMAT
   ========================================================= */

function formatDate(transaction) {

    return getTransactionDate(transaction)
        .toLocaleDateString(
            "en-NG",
            {
                day: "numeric",
                month: "short",
                year: "numeric"
            }
        );

}


/* =========================================================
   TIME FORMAT
   ========================================================= */

function formatTime(transaction) {

    return getTransactionDate(transaction)
        .toLocaleTimeString(
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
        Number(transaction.amount);


    if (isNaN(amount)) {

        return 0;

    }


    return Math.abs(amount);

}


/* =========================================================
   MONEY FORMAT
   ========================================================= */

function formatMoney(amount) {

    return Number(amount)
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

    const category =
        getCategory(transaction);


    if (category === "Credit Alert") {

        return "Credit Alert";

    }


    return category;

}


/* =========================================================
   ICON
   ========================================================= */

function getIcon(transaction) {

    const category =
        getCategory(transaction);


    switch (category) {

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

    const category =
        getCategory(transaction);


    switch (category) {

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
   FILTER TRANSACTIONS
   ========================================================= */

function getFilteredTransactions() {

    const search =
        searchInput
            ? searchInput.value
                .trim()
                .toLowerCase()
            : "";


    return allTransactions.filter(
        (transaction) => {

            const category =
                getCategory(transaction);

            const status =
                getStatus(transaction);

            const date =
                getTransactionDate(transaction);


            /* -------------------------
               CATEGORY
            ------------------------- */

            if (
                selectedCategory !==
                "All Categories"
            ) {

                if (
                    category !==
                    selectedCategory
                ) {

                    return false;

                }

            }


            /* -------------------------
               STATUS
            ------------------------- */

            if (
                selectedStatus !==
                "All Status"
            ) {

                if (
                    status !==
                    selectedStatus
                ) {

                    return false;

                }

            }


            /* -------------------------
               MONTH
            ------------------------- */

            if (
                selectedMonth ===
                "This Month"
            ) {

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


            /* -------------------------
               SEARCH
            ------------------------- */

            if (search) {

                const searchable = [

                    getTitle(transaction),

                    transaction.customerEmail,

                    transaction.transactionReference,

                    transaction.paymentReference,

                    transaction.reference,

                    transaction.uid,

                    transaction.type,

                    transaction.status

                ]
                .filter(Boolean)
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


    updateSummary(transactions);


    container.innerHTML = "";


    if (
        transactions.length === 0
    ) {

        showEmptyState();

        return;

    }


    transactions.forEach(
        (transaction) => {

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

                    ${prefix} ₦${formatMoney(amount)}

                </div>

            </div>


            <div class="transaction-bottom">

                <div class="transaction-date">

                    ${formatDate(transaction)}
                    ·
                    ${formatTime(transaction)}

                </div>


                <div class="transaction-status">

                    <span
                        class="status-dot ${statusClass}"
                    ></span>

                    ${status}

                </div>

            </div>

        </div>


        <div class="transaction-arrow">

            <i class="fas fa-chevron-right"></i>

        </div>

    `;


    return item;

}


/* =========================================================
   SUMMARY
   ========================================================= */

function updateSummary(transactions) {

    let totalIn = 0;

    let totalOut = 0;


    transactions.forEach(
        (transaction) => {

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

    container.innerHTML = `

        <div class="empty-state">

            <i class="fas fa-receipt"></i>

            <h3>No Transactions Found</h3>

            <p>
                Your transaction history
                will appear here.
            </p>

        </div>

    `;

}


/* =========================================================
   ERROR
   ========================================================= */

function showError() {

    if (!container) {

        return;

    }


    container.innerHTML = `

        <div class="empty-state">

            <i class="fas fa-circle-exclamation"></i>

            <h3>Unable to Load Transactions</h3>

            <p>
                We couldn't load your transaction
                history right now. Please try again.
            </p>

        </div>

    `;

}


/* =========================================================
   SHEETS
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

    ].forEach(
        (sheet) => {

            if (sheet) {

                sheet.classList.remove(
                    "active"
                );

            }

        }
    );


    if (sheetOverlay) {

        sheetOverlay.classList.remove(
            "active"
        );

    }

}


/* =========================================================
   FILTER BUTTONS
   ========================================================= */

categoryBtn?.addEventListener(
    "click",
    () => {

        openSheet(categorySheet);

    }
);


statusBtn?.addEventListener(
    "click",
    () => {

        openSheet(statusSheet);

    }
);


monthBtn?.addEventListener(
    "click",
    () => {

        openSheet(monthSheet);

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
    .forEach(
        (button) => {

            button.addEventListener(
                "click",
                () => {

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

        }
    );


/* =========================================================
   STATUS OPTIONS
   ========================================================= */

document
    .querySelectorAll(
        "#statusSheet .sheet-option"
    )
    .forEach(
        (button) => {

            button.addEventListener(
                "click",
                () => {

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

        }
    );


/* =========================================================
   MONTH OPTIONS
   ========================================================= */

document
    .querySelectorAll(
        "#monthSheet .sheet-option"
    )
    .forEach(
        (button) => {

            button.addEventListener(
                "click",
                () => {

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

        }
    );


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
    () => {

        window.history.back();

    }
);


/* =========================================================
   EXPORT MENU
   ========================================================= */

exportBtn?.addEventListener(
    "click",
    () => {

        openSheet(exportSheet);

    }
);


/* =========================================================
   CSV EXPORT
   ========================================================= */

document
    .getElementById("exportCSV")
    ?.addEventListener(
        "click",
        () => {

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
            "Status",
            "Reference"
        ]

    ];


    transactions.forEach(
        (transaction) => {

            rows.push([

                `${formatDate(transaction)} ${formatTime(transaction)}`,

                getCategory(transaction),

                getTransactionType(transaction),

                getAmount(transaction),

                getStatus(transaction),

                transaction.transactionReference ||
                transaction.paymentReference ||
                transaction.reference ||
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
                                    .replaceAll('"', '""')}"`
                        )
                        .join(",")
            )
            .join("\n");


    const blob =
        new Blob(
            [csv],
            {
                type: "text/csv;charset=utf-8;"
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
   PRINT
   ========================================================= */

document
    .getElementById("printHistory")
    ?.addEventListener(
        "click",
        () => {

            closeSheets();

            window.print();

        }
    );


/* =========================================================
   PDF
   ========================================================= */

document
    .getElementById("exportPDF")
    ?.addEventListener(
        "click",
        () => {

            closeSheets();

            window.print();

        }
    );


/* =========================================================
   ESCAPE HTML
   ========================================================= */

function escapeHTML(value) {

    return String(value || "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


console.log(
    "NovaPay Transaction History loaded successfully."
);