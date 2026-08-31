/* =========================================================
   NOVAPAY — TRANSACTION HISTORY
   Backend-authoritative transaction history
   ========================================================= */

import { auth } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";


/* =========================================================
   CONFIG
   ========================================================= */

const API_BASE_URL =
    "https://novapay-server.onrender.com";

const TRANSACTIONS_API =
    `${API_BASE_URL}/api/transactions`;

const DEFAULT_LIMIT = 50;


/* =========================================================
   DOM
   ========================================================= */

const container =
    document.getElementById(
        "transactionContainer"
    );

const transactionCount =
    document.getElementById(
        "transactionCount"
    );

const moneyIn =
    document.getElementById(
        "moneyIn"
    );

const moneyOut =
    document.getElementById(
        "moneyOut"
    );

const netAmount =
    document.getElementById(
        "netAmount"
    );

const searchInput =
    document.getElementById(
        "searchInput"
    );

const categoryBtn =
    document.getElementById(
        "categoryBtn"
    );

const statusBtn =
    document.getElementById(
        "statusBtn"
    );

const monthBtn =
    document.getElementById(
        "monthBtn"
    );

const categorySheet =
    document.getElementById(
        "categorySheet"
    );

const statusSheet =
    document.getElementById(
        "statusSheet"
    );

const monthSheet =
    document.getElementById(
        "monthSheet"
    );

const exportSheet =
    document.getElementById(
        "exportSheet"
    );

const sheetOverlay =
    document.getElementById(
        "sheetOverlay"
    );

const backBtn =
    document.getElementById(
        "backBtn"
    );

const exportBtn =
    document.getElementById(
        "exportBtn"
    );


/* =========================================================
   STATE
   ========================================================= */

let allTransactions = [];

let nextCursor = null;

let hasMore = false;

let isLoading = false;

let selectedCategory =
    "All Categories";

let selectedStatus =
    "All Status";

let selectedMonth =
    "This Month";


/* =========================================================
   AUTHENTICATION
   ========================================================= */

onAuthStateChanged(
    auth,
    async (user) => {

        if (!user) {

            window.location.href =
                "login.html";

            return;
        }

        await loadTransactions(
            true
        );

    }
);


/* =========================================================
   LOAD TRANSACTIONS
   ========================================================= */

async function loadTransactions(
    reset = false
) {

    if (isLoading) {
        return;
    }

    if (
        !reset &&
        !hasMore
    ) {
        return;
    }

    const user =
        auth.currentUser;

    if (!user) {

        window.location.href =
            "login.html";

        return;
    }

    isLoading = true;

    if (reset) {

        nextCursor = null;

        hasMore = false;

        allTransactions = [];

        showLoading();

    }

    try {

        const idToken =
            await user.getIdToken();

        const params =
            new URLSearchParams();

        params.set(
            "limit",
            String(
                DEFAULT_LIMIT
            )
        );

        if (
            !reset &&
            nextCursor
        ) {

            params.set(
                "cursor",
                nextCursor
            );

        }

        const response =
            await fetch(
                `${TRANSACTIONS_API}?${params.toString()}`,
                {
                    method: "GET",

                    headers: {

                        "Authorization":
                            `Bearer ${idToken}`,

                        "Accept":
                            "application/json"

                    },

                    cache:
                        "no-store"

                }
            );


        let result = null;


        try {

            result =
                await response.json();

        } catch {

            throw new Error(
                "NovaPay server returned an invalid response."
            );

        }


        if (!response.ok) {

            throw new Error(
                result?.error ||
                "Unable to load transaction history."
            );

        }


        if (
            result?.success !== true
        ) {

            throw new Error(
                result?.error ||
                "Unable to load transaction history."
            );

        }


        const transactions =
            Array.isArray(
                result.transactions
            )
                ? result.transactions
                : [];


        if (reset) {

            allTransactions =
                transactions;

        } else {

            allTransactions =
                [
                    ...allTransactions,
                    ...transactions
                ];

        }


        hasMore =
            result?.pagination?.hasMore === true;

        nextCursor =
            result?.pagination?.nextCursor ||
            null;


        allTransactions.sort(
            (a, b) =>
                getDateValue(b) -
                getDateValue(a)
        );


        renderTransactions();


        console.log(
            `NovaPay: loaded ${transactions.length} transaction(s).`
        );


    } catch (error) {

        console.error(
            "NovaPay transaction history error:",
            error
        );


        if (reset) {

            showError(
                error?.message ||
                "Unable to load your transaction history."
            );

        }

    } finally {

        isLoading = false;

    }

}


/* =========================================================
   TRANSACTION TYPE
   ========================================================= */

function getTransactionType(
    transaction
) {

    return String(
        transaction?.type ||
        ""
    )
        .trim()
        .toUpperCase();

}


/* =========================================================
   CATEGORY
   ========================================================= */

function getCategory(
    transaction
) {

    const type =
        getTransactionType(
            transaction
        );


    switch (type) {

        case "DEPOSIT":
        case "CREDIT":
        case "REFUND":
        case "WALLET_DEPOSIT":
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
   DIRECTION
   ========================================================= */

function isMoneyIn(
    transaction
) {

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

        return true;

    }


    if (
        direction === "debit"
    ) {

        return false;

    }


    /*
     * Backend normally supplies direction.
     * This fallback protects the UI if an older
     * ledger record does not contain it.
     */

    const type =
        getTransactionType(
            transaction
        );


    return (
        type === "DEPOSIT" ||
        type === "CREDIT" ||
        type === "REFUND" ||
        type === "WALLET_DEPOSIT"
    );

}


/* =========================================================
   STATUS
   ========================================================= */

function getStatus(
    transaction
) {

    const status =
        String(
            transaction?.status ||
            ""
        )
            .trim()
            .toLowerCase();


    switch (status) {

        case "successful":
        case "success":
        case "completed":
        case "complete":
        case "paid":
            return "Successful";


        case "failed":
        case "fail":
        case "cancelled":
        case "canceled":
        case "reversed":
            return "Failed";


        case "pending":
            return "Pending";


        default:
            return "Successful";

    }

}


/* =========================================================
   TIMESTAMP
   ========================================================= */

function timestampToMillis(
    timestamp
) {

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

        const date =
            timestamp.toDate();

        return Number.isFinite(
            date.getTime()
        )
            ? date.getTime()
            : 0;

    }


    if (
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

            return (
                Number(
                    timestamp.seconds
                ) * 1000
            );

        }


        if (
            Number.isFinite(
                Number(
                    timestamp._seconds
                )
            )
        ) {

            return (
                Number(
                    timestamp._seconds
                ) * 1000
            );

        }


        if (
            Number.isFinite(
                Number(
                    timestamp.milliseconds
                )
            )
        ) {

            return Number(
                timestamp.milliseconds
            );

        }


        if (
            Number.isFinite(
                Number(
                    timestamp._milliseconds
                )
            )
        ) {

            return Number(
                timestamp._milliseconds
            );

        }

    }


    if (
        typeof timestamp ===
        "number"
    ) {

        if (
            timestamp > 100000000000
        ) {

            return timestamp;

        }

        return timestamp * 1000;

    }


    if (
        typeof timestamp ===
        "string"
    ) {

        const numeric =
            Number(timestamp);

        if (
            Number.isFinite(numeric)
        ) {

            if (
                numeric > 100000000000
            ) {

                return numeric;

            }

            if (
                numeric > 1000000000
            ) {

                return numeric * 1000;

            }

        }


        const parsed =
            new Date(
                timestamp
            ).getTime();


        return Number.isFinite(parsed)
            ? parsed
            : 0;

    }


    return 0;

}


/* =========================================================
   DATE
   ========================================================= */

function getDateValue(
    transaction
) {

    return timestampToMillis(
        transaction?.createdAt
    );

}


function getTransactionDate(
    transaction
) {

    const milliseconds =
        getDateValue(
            transaction
        );


    if (!milliseconds) {
        return null;
    }


    const date =
        new Date(
            milliseconds
        );


    return Number.isNaN(
        date.getTime()
    )
        ? null
        : date;

}


/* =========================================================
   DATE FORMAT
   ========================================================= */

function formatDate(
    transaction
) {

    const date =
        getTransactionDate(
            transaction
        );


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


function formatTime(
    transaction
) {

    const date =
        getTransactionDate(
            transaction
        );


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

function getAmountKobo(
    transaction
) {

    const amount =
        Number(
            transaction?.amountKobo
        );


    if (
        !Number.isSafeInteger(
            amount
        ) ||
        amount < 0
    ) {

        return 0;

    }


    return amount;

}


function getAmountNaira(
    transaction
) {

    return (
        getAmountKobo(
            transaction
        ) / 100
    );

}


/* =========================================================
   MONEY FORMAT
   ========================================================= */

function formatMoney(
    amount
) {

    return Number(
        amount || 0
    )
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

function getTitle(
    transaction
) {

    return getCategory(
        transaction
    );

}


/* =========================================================
   ICON
   ========================================================= */

function getIcon(
    transaction
) {

    switch (
        getCategory(
            transaction
        )
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

function getIconColor(
    transaction
) {

    switch (
        getCategory(
            transaction
        )
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
        transaction => {

            const category =
                getCategory(
                    transaction
                );

            const status =
                getStatus(
                    transaction
                );

            const date =
                getTransactionDate(
                    transaction
                );


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
                            month:
                                "long"
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

                    getTitle(
                        transaction
                    ),

                    getTransactionType(
                        transaction
                    ),

                    getStatus(
                        transaction
                    ),

                    transaction?.reference,

                    transaction?.provider,

                    transaction?.id

                ]
                    .filter(
                        value =>
                            value !==
                            undefined &&
                            value !==
                            null
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
        document.createElement(
            "div"
        );


    item.className =
        "transaction-item";


    const amount =
        getAmountNaira(
            transaction
        );


    const moneyInTransaction =
        isMoneyIn(
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


    const icon =
        getIcon(
            transaction
        );


    const iconColor =
        getIconColor(
            transaction
        );


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

                    ${escapeHTML(
                        formatDate(
                            transaction
                        )
                    )}

                    ·

                    ${escapeHTML(
                        formatTime(
                            transaction
                        )
                    )}

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


    item.addEventListener(
        "click",
        () => {

            openReceipt(
                transaction
            );

        }
    );


    return item;

}


/* =========================================================
   RECEIPT
   ========================================================= */

function openReceipt(
    transaction
) {

    const selectedTransaction = {

        id:
            transaction?.id ||
            "--",

        reference:
            transaction?.reference ||
            "--",

        title:
            getTitle(
                transaction
            ),

        amount:
            getAmountNaira(
                transaction
            ),

        amountKobo:
            getAmountKobo(
                transaction
            ),

        type:
            isMoneyIn(
                transaction
            )
                ? "in"
                : "out",

        direction:
            transaction?.direction ||
            null,

        status:
            getStatus(
                transaction
            ),

        currency:
            transaction?.currency ||
            "NGN",

        provider:
            transaction?.provider ||
            null,

        date:
            `${formatDate(
                transaction
            )} · ${formatTime(
                transaction
            )}`

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


/* =========================================================
   SUMMARY
   ========================================================= */

function updateSummary(
    transactions
) {

    let totalInKobo = 0;

    let totalOutKobo = 0;


    transactions.forEach(
        transaction => {

            const amountKobo =
                getAmountKobo(
                    transaction
                );


            if (
                isMoneyIn(
                    transaction
                )
            ) {

                totalInKobo +=
                    amountKobo;

            } else {

                totalOutKobo +=
                    amountKobo;

            }

        }
    );


    const netKobo =
        totalInKobo -
        totalOutKobo;


    if (moneyIn) {

        moneyIn.textContent =
            `₦${formatMoney(
                totalInKobo / 100
            )}`;

    }


    if (moneyOut) {

        moneyOut.textContent =
            `₦${formatMoney(
                totalOutKobo / 100
            )}`;

    }


    if (netAmount) {

        netAmount.textContent =
            netKobo < 0
                ? `-₦${formatMoney(
                    Math.abs(
                        netKobo
                    ) / 100
                )}`
                : `₦${formatMoney(
                    netKobo / 100
                )}`;

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

            <h3>
                Loading transactions
            </h3>

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

            <h3>
                No Transactions Found
            </h3>

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

function showError(
    message
) {

    if (!container) {
        return;
    }


    container.innerHTML = `

        <div class="empty-state">

            <i class="fas fa-circle-exclamation"></i>

            <h3>
                Unable to Load Transactions
            </h3>

            <p>
                ${escapeHTML(message)}
            </p>

        </div>

    `;

}


/* =========================================================
   BOTTOM SHEETS
   ========================================================= */

function openSheet(
    sheet
) {

    closeSheets();


    if (!sheet) {
        return;
    }


    sheet.classList.add(
        "active"
    );


    sheetOverlay?.classList.add(
        "active"
    );

}


function closeSheets() {

    [
        categorySheet,
        statusSheet,
        monthSheet,
        exportSheet
    ].forEach(
        sheet => {

            sheet?.classList.remove(
                "active"
            );

        }
    );


    sheetOverlay?.classList.remove(
        "active"
    );

}


/* =========================================================
   CATEGORY BUTTON
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


/* =========================================================
   STATUS BUTTON
   ========================================================= */

statusBtn?.addEventListener(
    "click",
    event => {

        event.preventDefault();

        openSheet(
            statusSheet
        );

    }
);


/* =========================================================
   MONTH BUTTON
   ========================================================= */

monthBtn?.addEventListener(
    "click",
    event => {

        event.preventDefault();

        openSheet(
            monthSheet
        );

    }
);


/* =========================================================
   OVERLAY
   ========================================================= */

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
        button => {

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
        button => {

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
        button => {

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
    .getElementById(
        "exportCSV"
    )
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
            "Amount (NGN)",
            "Amount (Kobo)",
            "Direction",
            "Status",
            "Provider",
            "Reference"
        ]

    ];


    transactions.forEach(
        transaction => {

            rows.push([

                `${formatDate(
                    transaction
                )} ${formatTime(
                    transaction
                )}`,

                getCategory(
                    transaction
                ),

                getTransactionType(
                    transaction
                ),

                getAmountNaira(
                    transaction
                ).toFixed(2),

                getAmountKobo(
                    transaction
                ),

                isMoneyIn(
                    transaction
                )
                    ? "Money In"
                    : "Money Out",

                getStatus(
                    transaction
                ),

                transaction?.provider ||
                "",

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
                                `"${String(
                                    value
                                )
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
        URL.createObjectURL(
            blob
        );


    const link =
        document.createElement(
            "a"
        );


    link.href = url;

    link.download =
        "NovaPay-Transaction-History.csv";


    document.body.appendChild(
        link
    );


    link.click();

    link.remove();


    URL.revokeObjectURL(
        url
    );

}


/* =========================================================
   PRINT
   ========================================================= */

document
    .getElementById(
        "printHistory"
    )
    ?.addEventListener(
        "click",
        event => {

            event.preventDefault();

            closeSheets();

            window.print();

        }
    );


/* =========================================================
   PDF
   ========================================================= */

document
    .getElementById(
        "exportPDF"
    )
    ?.addEventListener(
        "click",
        event => {

            event.preventDefault();

            closeSheets();

            window.print();

        }
    );


/* =========================================================
   HTML ESCAPING
   ========================================================= */

function escapeHTML(
    value
) {

    return String(
        value ?? ""
    )
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
    "🔐 NovaPay Transaction History frontend loaded."
);