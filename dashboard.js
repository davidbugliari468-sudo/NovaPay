window.onload = () => {
    window.scrollTo(0, 0);
};

import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";


// ======================================
// DOM ELEMENTS
// ======================================

const userName =
    document.getElementById(
        "userName"
    );

const greetingText =
    document.getElementById(
        "greetingText"
    );

const walletBalance =
    document.getElementById(
        "walletBalance"
    );

const hideBalanceBtn =
    document.getElementById(
        "hideBalance"
    );

const supportBtn =
    document.getElementById(
        "supportBtn"
    );

const notificationBtn =
    document.getElementById(
        "notificationBtn"
    );

const profileBtn =
    document.getElementById(
        "profileBtn"
    );

const addMoneyBtn =
    document.getElementById(
        "addMoneyBtn"
    );

const historyBtn =
    document.getElementById(
        "historyBtn"
    );

const airtimeBtn =
    document.getElementById(
        "airtimeBtn"
    );

const dataBtn =
    document.getElementById(
        "dataBtn"
    );

const electricityBtn =
    document.getElementById(
        "electricityBtn"
    );

const tvBtn =
    document.getElementById(
        "tvBtn"
    );

const bettingBtn =
    document.getElementById(
        "bettingBtn"
    );

const moreBtn =
    document.getElementById(
        "moreBtn"
    );

const inviteBtn =
    document.getElementById(
        "inviteBtn"
    );

const viewAllTransactionsBtn =
    document.getElementById(
        "viewAllTransactionsBtn"
    );

const walletBtn =
    document.getElementById(
        "walletBtn"
    );

const payBillsBtn =
    document.getElementById(
        "payBillsBtn"
    );

const profileNavBtn =
    document.getElementById(
        "profileNavBtn"
    );

const modal =
    document.getElementById(
        "customModal"
    );

const modalTitle =
    document.getElementById(
        "modalTitle"
    );

const modalMessage =
    document.getElementById(
        "modalMessage"
    );

const recentTransactionsContainer =
    document.getElementById(
        "recentTransactionsContainer"
    );


// ======================================
// DASHBOARD STATE
// ======================================

let balance = 0;

let balanceVisible = true;


// ======================================
// INTERNAL NAVIGATION
// ======================================

const INTERNAL_NAVIGATION_KEY =
    "novaPayInternalNavigation";


function markInternalNavigation() {

    try {

        sessionStorage.setItem(
            INTERNAL_NAVIGATION_KEY,
            "true"
        );

    } catch (error) {

        console.warn(
            "NovaPay internal navigation state could not be saved:",
            error
        );

    }

}


function navigateWithinNovaPay(
    destination
) {

    if (
        !destination
    ) {

        return;

    }

    markInternalNavigation();

    window.location.assign(
        destination
    );

}


// ======================================
// MODAL
// ======================================

function showModal(
    title,
    message
) {

    if (
        modalTitle
    ) {

        modalTitle.textContent =
            title;

    }

    if (
        modalMessage
    ) {

        modalMessage.textContent =
            message;

    }

    if (
        modal
    ) {

        modal.style.display =
            "flex";

    }

}


window.closeModal =
    () => {

        if (
            modal
        ) {

            modal.style.display =
                "none";

        }

    };


modal?.addEventListener(
    "click",
    (event) => {

        if (
            event.target ===
            modal
        ) {

            closeModal();

        }

    }
);


// ======================================
// MONEY FORMAT
// ======================================

function formatMoney(
    amount
) {

    const numericAmount =
        Number(
            amount
        );

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
// GREETING
// ======================================

function updateGreeting() {

    if (
        !greetingText
    ) {

        return;

    }

    const hour =
        new Date().getHours();

    if (
        hour < 12
    ) {

        greetingText.textContent =
            "☀️ Good Morning";

    }

    else if (
        hour < 18
    ) {

        greetingText.textContent =
            "🌤 Good Afternoon";

    }

    else {

        greetingText.textContent =
            "🌙 Good Evening";

    }

}


updateGreeting();


// ======================================
// HIDE / SHOW BALANCE
// ======================================

hideBalanceBtn?.addEventListener(
    "click",
    () => {

        balanceVisible =
            !balanceVisible;

        if (
            balanceVisible
        ) {

            if (
                walletBalance
            ) {

                walletBalance.textContent =
                    formatMoney(
                        balance
                    );

            }

            hideBalanceBtn.innerHTML =
                `Hide <i class="fa-regular fa-eye"></i>`;

        }

        else {

            if (
                walletBalance
            ) {

                walletBalance.textContent =
                    "••••••";

            }

            hideBalanceBtn.innerHTML =
                `Show <i class="fa-regular fa-eye-slash"></i>`;

        }

    }
);


// ======================================
// AUTHENTICATED USER
// ======================================

onAuthStateChanged(
    auth,
    async (user) => {

        if (
            !user
        ) {

            window.location.href =
                "login.html";

            return;

        }

        try {

            const userRef =
                doc(
                    db,
                    "users",
                    user.uid
                );

            const userSnap =
                await getDoc(
                    userRef
                );

            if (
                userSnap.exists()
            ) {

                const data =
                    userSnap.data();

                if (userName) {

    userName.textContent =
        data.nickname ||
        "User";

}

                balance =
                    Number(
                        data.walletBalance ||
                        0
                    );

            }

            else {

                if (userName) {

    userName.textContent =
        "User";

}

                balance =
                    0;

            }


            if (
                balanceVisible &&
                walletBalance
            ) {

                walletBalance.textContent =
                    formatMoney(
                        balance
                    );

            }


            loadRecentTransactions();

        }

        catch (error) {

            console.error(
                "NovaPay dashboard profile error:",
                error
            );

            if (
                userName &&
                !userName.textContent
            ) {

                userName.textContent =
                    user.email?.split("@")[0] ||
                    "User";

            }

            if (
                walletBalance &&
                balanceVisible
            ) {

                walletBalance.textContent =
                    formatMoney(
                        balance
                    );

            }

            console.warn(
                "NovaPay dashboard will remain interactive despite profile loading error."
            );

        }

    }
);


// ======================================
// DASHBOARD NAVIGATION
// ======================================

profileBtn?.addEventListener(
    "click",
    () => {

        navigateWithinNovaPay(
            "profile.html"
        );

    }
);


profileNavBtn?.addEventListener(
    "click",
    () => {

        navigateWithinNovaPay(
            "profile.html"
        );

    }
);


addMoneyBtn?.addEventListener(
    "click",
    () => {

        navigateWithinNovaPay(
            "add-money.html"
        );

    }
);


historyBtn?.addEventListener(
    "click",
    () => {

        navigateWithinNovaPay(
            "transaction-history.html"
        );

    }
);


viewAllTransactionsBtn?.addEventListener(
    "click",
    () => {

        navigateWithinNovaPay(
            "transaction-history.html"
        );

    }
);


// ======================================
// HEADER ACTIONS
// ======================================

supportBtn?.addEventListener(
    "click",
    () => {

        showModal(
            "Live Support",
            "Live Support will be available in a future NovaPay update."
        );

    }
);


notificationBtn?.addEventListener(
    "click",
    () => {

        navigateWithinNovaPay(
            "notifications.html"
        );

    }
);


// ======================================
// BOTTOM NAVIGATION
// ======================================

walletBtn?.addEventListener(
    "click",
    () => {

        showModal(
            "Wallet",
            "Wallet page is coming soon."
        );

    }
);


payBillsBtn?.addEventListener(
    "click",
    () => {

        navigateWithinNovaPay(
            "pay-bills.html"
        );

    }
);


// ======================================
// QUICK SERVICES
// ======================================

airtimeBtn?.addEventListener(
    "click",
    () => {

        navigateWithinNovaPay(
            "airtime.html"
        );

    }
);


dataBtn?.addEventListener(
    "click",
    () => {

        navigateWithinNovaPay(
            "data.html"
        );

    }
);


electricityBtn?.addEventListener(
    "click",
    () => {

        navigateWithinNovaPay(
            "electricity.html"
        );

    }
);


tvBtn?.addEventListener(
    "click",
    () => {

        navigateWithinNovaPay(
            "tv.html"
        );

    }
);


bettingBtn?.addEventListener(
    "click",
    () => {

        navigateWithinNovaPay(
            "betting.html"
        );

    }
);


moreBtn?.addEventListener(
    "click",
    () => {

        navigateWithinNovaPay(
            "more-services.html"
        );

    }
);


inviteBtn?.addEventListener(
    "click",
    () => {

        navigateWithinNovaPay(
            "invite.html"
        );

    }
);


// ======================================
// RECENT TRANSACTIONS
// ======================================

async function loadRecentTransactions() {

    if (
        !recentTransactionsContainer
    ) {

        return;

    }


    recentTransactionsContainer.innerHTML = `

        <div class="transaction-card">

            <div class="transaction-icon">

                <i
                    class="fa-solid fa-spinner fa-spin"
                ></i>

            </div>

            <div class="transaction-details">

                <h4>
                    Loading Transactions
                </h4>

                <p>
                    Your recent transactions are loading...
                </p>

            </div>

        </div>

    `;


    try {

        const user =
            auth.currentUser;


        if (
            !user
        ) {

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
                    "https://novapay-server.onrender.com/api/transactions?limit=50",
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

        catch (fetchError) {

            if (
                fetchError?.name ===
                "AbortError"
            ) {

                throw new Error(
                    "Transaction server timed out."
                );

            }

            throw fetchError;

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
                "Invalid response from NovaPay server."
            );

        }


        if (
            !response.ok
        ) {

            throw new Error(
                result?.message ||
                `Server error (${response.status}).`
            );

        }


        if (
            !result?.success
        ) {

            throw new Error(
                result?.message ||
                "Unable to load transactions."
            );

        }


        const transactions =
            Array.isArray(
                result.transactions
            )
                ? result.transactions
                : [];


        transactions.sort(
            (a, b) => {

                return (
                    getTransactionDateValue(b) -
                    getTransactionDateValue(a)
                );

            }
        );


        const recentTransactions =
            transactions.slice(
                0,
                3
            );


        if (
            recentTransactions.length ===
            0
        ) {

            recentTransactionsContainer.innerHTML = `

                <div class="transaction-card">

                    <div class="transaction-icon">

                        <i
                            class="fa-solid fa-receipt"
                        ></i>

                    </div>

                    <div class="transaction-details">

                        <h4>
                            No Transactions Yet
                        </h4>

                        <p>
                            Your recent transactions will appear here.
                        </p>

                    </div>

                </div>

            `;

            return;

        }


        recentTransactionsContainer.innerHTML =
            recentTransactions
                .map(
                    transaction =>
                        renderRecentTransaction(
                            transaction
                        )
                )
                .join("");

    }

    catch (error) {

        console.error(
            "RECENT TRANSACTIONS ERROR:",
            error
        );


        recentTransactionsContainer.innerHTML = `

            <div class="transaction-card">

                <div class="transaction-icon">

                    <i
                        class="fa-solid fa-circle-exclamation"
                    ></i>

                </div>

                <div class="transaction-details">

                    <h4>
                        Unable to Load
                    </h4>

                    <p>
                        Transactions are temporarily unavailable.
                    </p>

                    <button
                        type="button"
                        id="retryTransactionsBtn"
                        style="
                            margin-top:8px;
                            border:0;
                            background:none;
                            padding:0;
                            color:inherit;
                            font:inherit;
                            font-weight:700;
                            cursor:pointer;
                        "
                    >
                        Tap to retry
                    </button>

                </div>

            </div>

        `;


        const retryButton =
            document.getElementById(
                "retryTransactionsBtn"
            );


        retryButton?.addEventListener(
            "click",
            () => {

                loadRecentTransactions();

            }
        );

    }

}


// ======================================
// TRANSACTION DATE VALUE
// ======================================

function getTransactionDateValue(
    transaction
) {

    if (
        !transaction
    ) {

        return 0;

    }


    const timestamp =
        transaction.timestamp ??
        transaction.createdAt ??
        transaction.date ??
        transaction.created_at;


    if (
        timestamp &&
        typeof timestamp.toDate ===
        "function"
    ) {

        const date =
            timestamp.toDate();


        return (
            date instanceof Date &&
            !Number.isNaN(
                date.getTime()
            )
        )
            ? date.getTime()
            : 0;

    }


    if (
        timestamp instanceof Date
    ) {

        return Number.isNaN(
            timestamp.getTime()
        )
            ? 0
            : timestamp.getTime();

    }


    if (
        typeof timestamp ===
        "number"
    ) {

        return timestamp <
            100000000000
            ? timestamp * 1000
            : timestamp;

    }


    if (
        typeof timestamp ===
        "string"
    ) {

        const parsed =
            Date.parse(
                timestamp
            );


        return Number.isNaN(
            parsed
        )
            ? 0
            : parsed;

    }


    return 0;

}


// ======================================
// TRANSACTION LABEL
// ======================================

function getTransactionTitle(
    transaction
) {

    return (
        transaction.title ||
        transaction.description ||
        transaction.service ||
        transaction.type ||
        "Transaction"
    );

}


// ======================================
// TRANSACTION STATUS
// ======================================

function getTransactionStatus(
    transaction
) {

    const rawStatus =
        String(
            transaction.status ||
            transaction.state ||
            "successful"
        )
            .trim()
            .toLowerCase();


    if (
        rawStatus ===
        "success"
    ) {

        return "successful";

    }


    if (
        rawStatus ===
        "completed"
    ) {

        return "successful";

    }


    if (
        rawStatus ===
        "complete"
    ) {

        return "successful";

    }


    if (
        rawStatus ===
        "processing"
    ) {

        return "pending";

    }


    if (
        rawStatus ===
        "in_progress"
    ) {

        return "pending";

    }


    if (
        rawStatus ===
        "in-progress"
    ) {

        return "pending";

    }


    if (
        rawStatus ===
        "failed"
    ) {

        return "failed";

    }


    if (
        rawStatus ===
        "error"
    ) {

        return "failed";

    }


    if (
        rawStatus ===
        "cancelled"
    ) {

        return "failed";

    }


    if (
        rawStatus ===
        "canceled"
    ) {

        return "failed";

    }


    return "successful";

}


// ======================================
// TRANSACTION DIRECTION
// ======================================

function getTransactionDirection(
    transaction
) {

    const explicitDirection =
        String(
            transaction.direction ||
            transaction.transactionType ||
            ""
        )
            .trim()
            .toLowerCase();


    if (
        explicitDirection ===
        "credit"
    ) {

        return "credit";

    }


    if (
        explicitDirection ===
        "income"
    ) {

        return "credit";

    }


    if (
        explicitDirection ===
        "deposit"
    ) {

        return "credit";

    }


    if (
        explicitDirection ===
        "debit"
    ) {

        return "debit";

    }


    if (
        explicitDirection ===
        "expense"
    ) {

        return "debit";

    }


    if (
        explicitDirection ===
        "withdrawal"
    ) {

        return "debit";

    }


    const amount =
        Number(
            transaction.amount
        );


    if (
        Number.isFinite(
            amount
        ) &&
        amount < 0
    ) {

        return "debit";

    }


    const service =
        String(
            transaction.service ||
            transaction.category ||
            transaction.type ||
            ""
        )
            .trim()
            .toLowerCase();


    const debitServices = [

        "airtime",

        "data",

        "electricity",

        "tv",

        "cable",

        "betting",

        "withdrawal",

        "payment",

        "transfer"

    ];


    if (
        debitServices.some(
            item =>
                service.includes(
                    item
                )
        )
    ) {

        return "debit";

    }


    return "debit";

}


// ======================================
// TRANSACTION AMOUNT
// ======================================

function getTransactionAmount(
    transaction
) {

    const amount =
        Number(
            transaction.amount ??
            transaction.value ??
            transaction.total ??
            0
        );


    return Number.isFinite(
        amount
    )
        ? Math.abs(
            amount
        )
        : 0;

}


// ======================================
// TRANSACTION DATE DISPLAY
// ======================================

function formatTransactionDate(
    transaction
) {

    const timestamp =
        getTransactionDateValue(
            transaction
        );


    if (
        !timestamp
    ) {

        return "Date unavailable";

    }


    const date =
        new Date(
            timestamp
        );


    return date.toLocaleString(
        "en-NG",
        {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit"
        }
    );

}


// ======================================
// RENDER RECENT TRANSACTION
// ======================================

function renderRecentTransaction(
    transaction
) {

    const title =
        getTransactionTitle(
            transaction
        );


    const status =
        getTransactionStatus(
            transaction
        );


    const direction =
        getTransactionDirection(
            transaction
        );


    const amount =
        getTransactionAmount(
            transaction
        );


    const date =
        formatTransactionDate(
            transaction
        );


    const isCredit =
        direction ===
        "credit";


    const amountClass =
        isCredit
            ? "money-in"
            : "money-out";


    const directionClass =
        isCredit
            ? "credit"
            : "debit";


    const statusClass =
        `status-${status}`;


    const amountPrefix =
        isCredit
            ? "+"
            : "-";


    const icon =
        isCredit
            ? "fa-arrow-down"
            : "fa-arrow-up";


    const safeTitle =
        escapeHtml(
            title
        );


    const safeDate =
        escapeHtml(
            date
        );


    const safeStatus =
        escapeHtml(
            capitalizeStatus(
                status
            )
        );


    return `

        <div
            class="transaction-card"
        >

            <div
                class="transaction-icon ${directionClass}"
            >

                <i
                    class="fa-solid ${icon}"
                ></i>

            </div>


            <div
                class="transaction-details"
            >

                <h4>
                    ${safeTitle}
                </h4>


                <p>
                    ${safeDate}
                    •
                    <span
                        class="${statusClass}"
                    >
                        ${safeStatus}
                    </span>
                </p>

            </div>


            <div
                class="transaction-amount ${amountClass}"
            >

                ${amountPrefix}${formatMoney(amount)}

            </div>

        </div>

    `;

}


// ======================================
// CAPITALIZE STATUS
// ======================================

function capitalizeStatus(
    status
) {

    const normalized =
        String(
            status ||
            ""
        )
            .toLowerCase();


    if (
        normalized ===
        "successful"
    ) {

        return "Successful";

    }


    if (
        normalized ===
        "pending"
    ) {

        return "Pending";

    }


    if (
        normalized ===
        "failed"
    ) {

        return "Failed";

    }


    return (
        normalized.charAt(0)
            .toUpperCase() +
        normalized.slice(1)
    );

}


// ======================================
// ESCAPE HTML
// ======================================

function escapeHtml(
    value
) {

    return String(
        value ?? ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


// ======================================
// INTERNAL HTML LINK DETECTION
// ======================================

document.addEventListener(
    "click",
    event => {

        const link =
            event.target.closest(
                "a"
            );


        if (
            !link
        ) {

            return;

        }


        const href =
            link.getAttribute(
                "href"
            );


        if (
            !href
        ) {

            return;

        }


        if (
            href.startsWith(
                "http://"
            ) ||
            href.startsWith(
                "https://"
            ) ||
            href.startsWith(
                "//"
            ) ||
            href.startsWith(
                "mailto:"
            ) ||
            href.startsWith(
                "tel:"
            )
        ) {

            return;

        }


        if (
            href.startsWith(
                "#"
            ) ||
            href.startsWith(
                "javascript:"
            )
        ) {

            return;

        }


        if (
            href.endsWith(
                ".html"
            )
        ) {

            markInternalNavigation();

        }

    },
    true
);


// ======================================
// MODAL KEYBOARD SUPPORT
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

            closeModal();

        }

    }
);


// ======================================
// DASHBOARD READY STATE
// ======================================

document.documentElement
    .classList
    .add(
        "novapay-dashboard-ready"
    );


// ======================================
// RUNTIME ERROR REPORTING
// ======================================

window.addEventListener(
    "error",
    event => {

        console.error(
            "NovaPay Dashboard runtime error:",
            event.error ||
            event.message
        );

    }
);


window.addEventListener(
    "unhandledrejection",
    event => {

        console.error(
            "NovaPay Dashboard promise rejection:",
            event.reason
        );

    }
);


// ======================================
// FINAL DASHBOARD STARTUP
// ======================================

function runDashboardStartupCheck() {

    console.log(
        "NovaPay Dashboard initialized."
    );

    console.log(
        "Firebase authentication: ENABLED"
    );

    console.log(
        "Secure transaction history: ENABLED"
    );

    console.log(
        "Dashboard navigation: ENABLED"
    );

    console.log(
        "Dashboard transaction rendering: ENABLED"
    );

}


if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        runDashboardStartupCheck,
        {
            once: true
        }
    );

}

else {

    runDashboardStartupCheck();

}