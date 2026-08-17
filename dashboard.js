window.onload = () => {
    window.scrollTo(0, 0);
};


// ======================================
// NOVAPAY DASHBOARD V4
// ======================================
//
// Fresh rebuild.
//
// Preserved:
// - Firebase authentication
// - User profile
// - Wallet balance
// - Recent transactions
// - Backend transaction API
// - Dashboard navigation
// - Existing modal system
//
// Rebuilt:
// - Internal navigation handling
// - App lock handling
// - Transaction direction/status rendering
// - Timestamp normalization
//
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
// DOM ELEMENTS
// ======================================

const userName =
    document.getElementById("userName");

const greetingText =
    document.getElementById("greetingText");

const walletBalance =
    document.getElementById("walletBalance");

const hideBalanceBtn =
    document.getElementById("hideBalance");

const supportBtn =
    document.getElementById("supportBtn");

const notificationBtn =
    document.getElementById("notificationBtn");

const profileBtn =
    document.getElementById("profileBtn");

const addMoneyBtn =
    document.getElementById("addMoneyBtn");

const historyBtn =
    document.getElementById("historyBtn");

const airtimeBtn =
    document.getElementById("airtimeBtn");

const dataBtn =
    document.getElementById("dataBtn");

const electricityBtn =
    document.getElementById("electricityBtn");

const tvBtn =
    document.getElementById("tvBtn");

const bettingBtn =
    document.getElementById("bettingBtn");

const moreBtn =
    document.getElementById("moreBtn");

const inviteBtn =
    document.getElementById("inviteBtn");

const viewAllTransactionsBtn =
    document.getElementById(
        "viewAllTransactionsBtn"
    );

const walletBtn =
    document.getElementById("walletBtn");

const payBillsBtn =
    document.getElementById("payBillsBtn");

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
// INTERNAL NAVIGATION STATE
// ======================================
//
// This value is kept in sessionStorage.
//
// It means:
// "The current page is intentionally
// navigating to another NovaPay page."
//
// It does NOT mean the user has
// backgrounded the app.
//
// ======================================

const INTERNAL_NAVIGATION_KEY =
    "novaPayInternalNavigation";


// ======================================
// MARK INTERNAL NAVIGATION
// ======================================

function markInternalNavigation() {

    try {

        sessionStorage.setItem(
            INTERNAL_NAVIGATION_KEY,
            "true"
        );

    } catch (error) {

        console.warn(
            "NovaPay navigation state could not be saved:",
            error
        );

    }
}


// ======================================
// CHECK INTERNAL NAVIGATION
// ======================================

function hasInternalNavigationFlag() {

    try {

        return (
            sessionStorage.getItem(
                INTERNAL_NAVIGATION_KEY
            ) === "true"
        );

    } catch (error) {

        console.warn(
            "NovaPay navigation state could not be read:",
            error
        );

        return false;
    }
}


// ======================================
// CLEAR INTERNAL NAVIGATION
// ======================================

function clearInternalNavigationFlag() {

    try {

        sessionStorage.removeItem(
            INTERNAL_NAVIGATION_KEY
        );

    } catch (error) {

        console.warn(
            "NovaPay navigation state could not be cleared:",
            error
        );

    }
}


// ======================================
// NAVIGATE INSIDE NOVAPAY
// ======================================
//
// Every Dashboard link to another
// NovaPay page goes through this function.
//
// This is what prevents normal internal
// navigation from being mistaken for
// the user leaving NovaPay.
//
// ======================================

function navigateWithinNovaPay(
    destination
) {

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


window.closeModal = () => {

    if (modal) {

        modal.style.display =
            "none";

    }

};


modal?.addEventListener(
    "click",
    (event) => {

        if (
            event.target === modal
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
// GREETING
// ======================================

function updateGreeting() {

    if (!greetingText) {
        return;
    }


    const hour =
        new Date().getHours();


    if (hour < 12) {

        greetingText.textContent =
            "☀️ Good Morning";

    } else if (hour < 18) {

        greetingText.textContent =
            "🌤 Good Afternoon";

    } else {

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


        if (balanceVisible) {

            if (walletBalance) {

                walletBalance.textContent =
                    formatMoney(balance);

            }


            hideBalanceBtn.innerHTML =
                `Hide <i class="fa-regular fa-eye"></i>`;

        } else {

            if (walletBalance) {

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

        if (!user) {

            window.location.href =
                "login.html";

            return;

        }


        try {

            // ----------------------------------
            // USER PROFILE
            // ----------------------------------

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
                        data.fullName ||
                        user.email?.split("@")[0] ||
                        "User";

                }


                balance =
                    Number(
                        data.walletBalance ||
                        0
                    );


            } else {

                if (userName) {

                    userName.textContent =
                        user.email?.split("@")[0] ||
                        "User";

                }


                balance = 0;

            }


            if (
                balanceVisible &&
                walletBalance
            ) {

                walletBalance.textContent =
                    formatMoney(balance);

            }


            // ----------------------------------
            // RECENT TRANSACTIONS
            // ----------------------------------

            await loadRecentTransactions();


        } catch (error) {

            console.error(
                "NovaPay dashboard error:",
                error
            );


            showModal(
                "Dashboard Error",
                "Unable to load your dashboard right now."
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

        showModal(
            "Pay Bills",
            "Pay Bills will be available in a future NovaPay update."
        );

    }
);


// ======================================
// QUICK SERVICES
// ======================================

function comingSoon(
    feature
) {

    showModal(
        feature,
        `${feature} will be available in a future NovaPay update.`
    );

}


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

        comingSoon(
            "More Services"
        );

    }
);


inviteBtn?.addEventListener(
    "click",
    () => {

        comingSoon(
            "Invite & Earn"
        );

    }
);
// ======================================
// RECENT TRANSACTIONS
// ======================================
//
// SECURITY:
//
// The frontend does NOT send a UID.
//
// It sends the Firebase ID token.
//
// The backend verifies the token and
// determines the authenticated user's UID.
//
// ======================================

async function loadRecentTransactions() {

    if (!recentTransactionsContainer) {
        return;
    }


    recentTransactionsContainer.innerHTML = `
        <div class="transaction-card">

            <div class="transaction-icon">
                <i class="fa-solid fa-spinner fa-spin"></i>
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


        if (!user) {

            throw new Error(
                "Authentication required."
            );

        }


        // ----------------------------------
        // FIREBASE ID TOKEN
        // ----------------------------------

        const idToken =
            await user.getIdToken();


        // ----------------------------------
        // SECURE BACKEND REQUEST
        // ----------------------------------

        const response =
            await fetch(
                "https://novapay-server.onrender.com/api/transactions?limit=50",
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


        let result;


        try {

            result =
                await response.json();

        } catch {

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


        // ----------------------------------
        // SORT NEWEST FIRST
        // ----------------------------------

        transactions.sort(
            (a, b) => {

                return (
                    getTransactionDateValue(b) -
                    getTransactionDateValue(a)
                );

            }
        );


        // ----------------------------------
        // DASHBOARD ONLY SHOWS 3
        // ----------------------------------

        const recentTransactions =
            transactions.slice(
                0,
                3
            );


        if (
            recentTransactions.length === 0
        ) {

            showNoTransactions();

            return;

        }


        recentTransactionsContainer.innerHTML =
            "";


        recentTransactions.forEach(
            transaction => {

                const card =
                    createRecentTransaction(
                        transaction
                    );


                recentTransactionsContainer
                    .appendChild(card);

            }
        );


    } catch (error) {

        console.error(
            "NovaPay recent transactions error:",
            error
        );


        recentTransactionsContainer.innerHTML = `
            <div class="transaction-card">

                <div class="transaction-icon">
                    <i class="fa-solid fa-circle-exclamation"></i>
                </div>

                <div class="transaction-details">

                    <h4>
                        Unable to Load
                    </h4>

                    <p>
                        Please try again later.
                    </p>

                </div>

            </div>
        `;

    }

}


// ======================================
// TIMESTAMP → MILLISECONDS
// ======================================
//
// Handles the timestamp formats that can
// arrive from the backend.
//
// ======================================

function timestampToMilliseconds(
    timestamp
) {

    if (!timestamp) {
        return 0;
    }


    // Firebase Timestamp instance

    if (
        typeof timestamp.toMillis ===
        "function"
    ) {

        const value =
            timestamp.toMillis();


        return Number.isFinite(value)
            ? value
            : 0;

    }


    // Firebase Timestamp with toDate()

    if (
        typeof timestamp.toDate ===
        "function"
    ) {

        const date =
            timestamp.toDate();


        const value =
            date?.getTime();


        return Number.isFinite(value)
            ? value
            : 0;

    }


    // Firestore JSON timestamp

    if (
        timestamp.seconds !==
        undefined
    ) {

        const seconds =
            Number(
                timestamp.seconds
            );


        if (
            Number.isFinite(seconds)
        ) {

            return seconds * 1000;

        }

    }


    // Firestore JSON using _seconds

    if (
        timestamp._seconds !==
        undefined
    ) {

        const seconds =
            Number(
                timestamp._seconds
            );


        if (
            Number.isFinite(seconds)
        ) {

            return seconds * 1000;

        }

    }


    // Milliseconds

    if (
        timestamp.milliseconds !==
        undefined
    ) {

        const milliseconds =
            Number(
                timestamp.milliseconds
            );


        if (
            Number.isFinite(
                milliseconds
            )
        ) {

            return milliseconds;

        }

    }


    // Numeric timestamp

    if (
        typeof timestamp ===
        "number"
    ) {

        if (
            Number.isFinite(timestamp)
        ) {

            /*
             * Values around 1e12 are
             * milliseconds.
             *
             * Smaller Unix timestamps
             * are seconds.
             */

            if (
                timestamp > 100000000000
            ) {

                return timestamp;

            }


            return timestamp * 1000;

        }

    }


    // String timestamp

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


        return Number.isFinite(
            parsed
        )
            ? parsed
            : 0;

    }


    return 0;

}


// ======================================
// TRANSACTION DATE VALUE
// ======================================

function getTransactionDateValue(
    transaction
) {

    const timestamp =
        transaction?.completedAt ||
        transaction?.createdAt ||
        transaction?.updatedAt;


    return timestampToMilliseconds(
        timestamp
    );

}


// ======================================
// TRANSACTION DATE OBJECT
// ======================================

function getTransactionDate(
    transaction
) {

    const milliseconds =
        getTransactionDateValue(
            transaction
        );


    if (!milliseconds) {
        return null;
    }


    const date =
        new Date(
            milliseconds
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return null;

    }


    return date;

}


// ======================================
// TRANSACTION DATE FORMAT
// ======================================

function formatTransactionDate(
    transaction
) {

    const date =
        getTransactionDate(
            transaction
        );


    if (!date) {

        return "Date unavailable";

    }


    const dateText =
        date.toLocaleDateString(
            "en-NG",
            {
                day:
                    "numeric",

                month:
                    "short",

                year:
                    "numeric"

            }
        );


    const timeText =
        date.toLocaleTimeString(
            "en-NG",
            {
                hour:
                    "numeric",

                minute:
                    "2-digit"

            }
        );


    return (
        `${dateText} · ${timeText}`
    );

}


// ======================================
// TRANSACTION TYPE
// ======================================

function getTransactionType(
    transaction
) {

    return String(
        transaction?.type ||
        transaction?.category ||
        ""
    )
        .trim()
        .toUpperCase();

}


// ======================================
// TRANSACTION DIRECTION
// ======================================
//
// We prefer an explicit backend direction
// when it exists.
//
// Otherwise known credit types are
// treated as money-in.
//
// ======================================

function isMoneyIn(
    transaction
) {

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


    const type =
        getTransactionType(
            transaction
        );


    return (
        type === "DEPOSIT" ||
        type === "CREDIT" ||
        type === "CREDIT_ALERT" ||
        type === "TRANSFER_IN"
    );

}


// ======================================
// TRANSACTION TITLE
// ======================================

function getTransactionTitle(
    transaction
) {

    const type =
        getTransactionType(
            transaction
        );


    switch (type) {

        case "DEPOSIT":

        case "CREDIT":

        case "CREDIT_ALERT":

            return "Credit Alert";


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


        case "TRANSFER":

        case "BANK_TRANSFER":

        case "TRANSFER_IN":

        case "TRANSFER_OUT":

            return "Transfer";


        default:

            return "Transaction";

    }

}


// ======================================
// TRANSACTION ICON
// ======================================

function getTransactionIcon(
    transaction
) {

    const type =
        getTransactionType(
            transaction
        );


    switch (type) {

        case "DEPOSIT":

        case "CREDIT":

        case "CREDIT_ALERT":

            return "fa-arrow-down";


        case "AIRTIME":

            return "fa-mobile-screen";


        case "DATA":

            return "fa-wifi";


        case "ELECTRICITY":

        case "POWER":

            return "fa-bolt";


        case "TV":

        case "DSTV":

        case "GOTV":

        case "STARTIMES":

            return "fa-tv";


        case "BETTING":

            return "fa-futbol";


        case "TRANSFER":

        case "BANK_TRANSFER":

        case "TRANSFER_IN":

        case "TRANSFER_OUT":

            return "fa-money-bill-transfer";


        default:

            return "fa-receipt";

    }

}


// ======================================
// TRANSACTION STATUS
// ======================================

function getTransactionStatus(
    transaction
) {

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
// ======================================
// TRANSACTION CARD
// ======================================

function createRecentTransaction(
    transaction
) {

    const card =
        document.createElement(
            "div"
        );


    card.className =
        "transaction-card";


    const amount =
        Math.abs(
            Number(
                transaction?.amount ||
                transaction?.amountPaid ||
                0
            )
        );


    const moneyInTransaction =
        isMoneyIn(
            transaction
        );


    const title =
        getTransactionTitle(
            transaction
        );


    const icon =
        getTransactionIcon(
            transaction
        );


    const status =
        getTransactionStatus(
            transaction
        );


    const sign =
        moneyInTransaction
            ? "+"
            : "-";


    /*
     * These classes are deliberately
     * aligned with the transaction-history
     * color system.
     *
     * money-in  → green
     * money-out → red
     */

    const amountClass =
        moneyInTransaction
            ? "money-in"
            : "money-out";


    /*
     * Status class allows dashboard.css
     * to display the same state colors.
     */

    const statusClass =
        status === "Successful"
            ? "status-successful"
            : status === "Failed"
                ? "status-failed"
                : "status-pending";


    const iconClass =
        moneyInTransaction
            ? "credit"
            : "debit";


    card.innerHTML = `

        <div
            class="transaction-icon ${iconClass}"
        >

            <i
                class="fa-solid ${icon}"
            ></i>

        </div>


        <div
            class="transaction-details"
        >

            <h4>
                ${escapeHTML(title)}
            </h4>


            <p>

                ${escapeHTML(
                    formatTransactionDate(
                        transaction
                    )
                )}

                ·

                <span
                    class="${statusClass}"
                >
                    ${escapeHTML(status)}
                </span>

            </p>

        </div>


        <div
            class="transaction-amount ${amountClass}"
        >

            ${sign} ${formatMoney(amount)}

        </div>

    `;


    /*
     * Recent transactions on Dashboard
     * are informational.
     *
     * Transaction History remains the
     * full transaction-detail page.
     */

    return card;

}


// ======================================
// ESCAPE HTML
// ======================================
//
// Transaction data comes from the backend.
// Escape values before inserting them into
// innerHTML.
//
// ======================================

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


// ======================================
// EMPTY TRANSACTION STATE
// ======================================

function showNoTransactions() {

    if (
        !recentTransactionsContainer
    ) {

        return;

    }


    recentTransactionsContainer.innerHTML = `

        <div
            class="transaction-card"
        >

            <div
                class="transaction-icon"
            >

                <i
                    class="fa-solid fa-receipt"
                ></i>

            </div>


            <div
                class="transaction-details"
            >

                <h4>
                    No Transactions Yet
                </h4>


                <p>
                    Your recent transactions
                    will appear here.
                </p>

            </div>

        </div>

    `;

}


// ======================================
// APP LOCK
// ======================================
//
// IMPORTANT:
//
// A normal navigation from one NovaPay
// page to another must NOT lock the user.
//
// Example:
//
// Dashboard → Airtime
// Airtime → Dashboard
// Dashboard → Data
// Data → Dashboard
//
// These are internal NovaPay navigations.
//
// Backgrounding/minimizing NovaPay is
// different and should lock the session.
//
// ======================================

const LOCK_KEY_PREFIX =
    "novaPayLock_";


let appLockTriggered =
    false;


// ======================================
// USER LOCK KEY
// ======================================

function getLockKey() {

    const user =
        auth.currentUser;


    if (!user) {

        return null;

    }


    return (
        LOCK_KEY_PREFIX +
        user.uid
    );

}


// ======================================
// MARK INTERNAL NAVIGATION
// ======================================
//
// This flag exists only for the current
// browser session.
//
// It is NOT the lock itself.
//
// ======================================

function markInternalNavigation() {

    try {

        sessionStorage.setItem(
            INTERNAL_NAVIGATION_KEY,
            "true"
        );

    } catch (error) {

        console.warn(
            "NovaPay navigation marker error:",
            error
        );

    }

}


// ======================================
// CHECK INTERNAL NAVIGATION
// ======================================

function isInternalNavigation() {

    try {

        return (
            sessionStorage.getItem(
                INTERNAL_NAVIGATION_KEY
            ) === "true"
        );

    } catch (error) {

        console.warn(
            "NovaPay navigation check error:",
            error
        );

        return false;

    }

}


// ======================================
// CLEAR INTERNAL NAVIGATION
// ======================================

function clearInternalNavigation() {

    try {

        sessionStorage.removeItem(
            INTERNAL_NAVIGATION_KEY
        );

    } catch (error) {

        console.warn(
            "NovaPay navigation cleanup error:",
            error
        );

    }

}


// ======================================
// LOCK APPLICATION
// ======================================

function lockNovaPay() {

    const lockKey =
        getLockKey();


    if (!lockKey) {

        return;

    }


    localStorage.setItem(
        lockKey,
        "true"
    );


    appLockTriggered =
        true;

}


// ======================================
// UNLOCK APPLICATION
// ======================================
//
// This function is intentionally available
// globally so unlock.html can use it if it
// calls window.unlockNovaPay().
//
// ======================================

window.unlockNovaPay = () => {

    const lockKey =
        getLockKey();


    if (lockKey) {

        localStorage.removeItem(
            lockKey
        );

    }


    appLockTriggered =
        false;

};


// ======================================
// PAGE VISIBILITY
// ======================================
//
// ONE listener.
//
// The previous implementation had multiple
// visibilitychange handlers. This replacement
// uses one central handler.
//
// ======================================

document.addEventListener(
    "visibilitychange",
    () => {

        /*
         * ----------------------------------
         * PAGE BECOMES HIDDEN
         * ----------------------------------
         */

        if (
            document.visibilityState ===
            "hidden"
        ) {

            /*
             * If NovaPay is intentionally
             * navigating internally, do NOT
             * create a lock.
             */

            if (
                isInternalNavigation()
            ) {

                return;

            }


            /*
             * Otherwise the Dashboard is being
             * backgrounded.
             */

            lockNovaPay();

            return;

        }


        /*
         * ----------------------------------
         * PAGE BECOMES VISIBLE
         * ----------------------------------
         */

        if (
            document.visibilityState !==
            "visible"
        ) {

            return;

        }


        /*
         * If we arrived here because the
         * Dashboard is navigating internally,
         * clear the marker and do nothing.
         */

        if (
            isInternalNavigation()
        ) {

            clearInternalNavigation();

            appLockTriggered =
                false;

            return;

        }


        /*
         * If the app was genuinely locked,
         * send the user through the PIN screen.
         */

        const lockKey =
            getLockKey();


        if (!lockKey) {

            return;

        }


        const isLocked =
            localStorage.getItem(
                lockKey
            ) === "true";


        if (!isLocked) {

            appLockTriggered =
                false;

            return;

        }


        /*
         * Don't repeatedly redirect.
         */

        if (
            appLockTriggered
        ) {

            return;

        }


        appLockTriggered =
            true;


        window.location.replace(
            "unlock.html"
        );

    }
);


// ======================================
// INITIAL LOCK CHECK
// ======================================
//
// This checks a lock that already existed
// before Dashboard loaded.
//
// Internal navigation is excluded.
//
// ======================================

function checkExistingLock() {

    const lockKey =
        getLockKey();


    if (!lockKey) {

        return;

    }


    if (
        isInternalNavigation()
    ) {

        clearInternalNavigation();

        appLockTriggered =
            false;

        return;

    }


    const isLocked =
        localStorage.getItem(
            lockKey
        ) === "true";


    if (!isLocked) {

        appLockTriggered =
            false;

        return;

    }


    appLockTriggered =
        true;


    window.location.replace(
        "unlock.html"
    );

}
// ======================================
// AUTHENTICATION / INITIAL LOCK STARTUP
// ======================================
//
// This listener is intentionally separate
// from the main dashboard user-loading
// listener.
//
// Its only responsibility is checking whether
// this session was already locked before the
// Dashboard loaded.
//
// ======================================

onAuthStateChanged(
    auth,
    (user) => {

        if (!user) {
            return;
        }


        /*
         * If Dashboard was reached through
         * normal NovaPay navigation, do not
         * show the PIN screen.
         */

        if (
            isInternalNavigation()
        ) {

            clearInternalNavigation();

            appLockTriggered =
                false;

            return;

        }


        /*
         * Otherwise check whether a previous
         * background event locked the account.
         */

        checkExistingLock();

    }
);


// ======================================
// PAGE EXIT SAFETY
// ======================================
//
// We deliberately DO NOT lock NovaPay from
// beforeunload/pagehide.
//
// Those events also occur during normal
// navigation between NovaPay pages.
//
// The visibilitychange handler above is the
// single source of truth for background lock.
// ======================================


// ======================================
// MODAL ESCAPE SUPPORT
// ======================================

document.addEventListener(
    "keydown",
    (event) => {

        if (
            event.key === "Escape" &&
            modal &&
            modal.style.display === "flex"
        ) {

            closeModal();

        }

    }
);


// ======================================
// FINAL DASHBOARD STARTUP
// ======================================

console.log(
    "======================================"
);

console.log(
    "NovaPay Dashboard V4 initialized"
);

console.log(
    "Secure transaction history: ENABLED"
);

console.log(
    "Internal navigation protection: ENABLED"
);

console.log(
    "Background app lock: ENABLED"
);

console.log(
    "Dashboard transaction direction styling: ENABLED"
);

console.log(
    "======================================"
);