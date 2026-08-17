window.onload = () => {
    window.scrollTo(0, 0);
};


// ======================================
// NOVAPAY DASHBOARD V5
// ======================================
//
// Fresh clean rebuild.
//
// Preserved:
// - Firebase authentication
// - User profile
// - Wallet balance
// - Recent transactions
// - Secure backend transaction API
// - Dashboard navigation
// - Existing modal system
// - Existing NovaPay unlock system
//
// Improved:
// - Dashboard remains interactive while
//   transactions are loading
// - Internal navigation is separated from
//   actual app backgrounding
// - Transaction loading has its own error
//   handling
// - Existing unlock.html / unlock.js
//   remains responsible for PIN verification
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
// INTERNAL NAVIGATION STATE
// ======================================
//
// This flag means that the user is moving
// between NovaPay pages intentionally.
//
// It must NEVER be treated as the PIN
// lock itself.
//
// ======================================

const INTERNAL_NAVIGATION_KEY =
    "novaPayInternalNavigation";


// ======================================
// APP LOCK STATE KEY
// ======================================
//
// This is the same lock key used by the
// existing unlock.js system.
//
// unlock.js removes:
// novaPayLock_<uid>
//
// after the user's real 6-digit PIN
// has been successfully verified.
//
// ======================================

const LOCK_KEY_PREFIX =
    "novaPayLock_";


// ======================================
// APP LOCK STATE
// ======================================

let appLockTriggered =
    false;


// ======================================
// VISIBILITY TIMER
// ======================================

let visibilityTimer =
    null;


// ======================================
// INTERNAL NAVIGATION
// ======================================

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
            "NovaPay internal navigation state could not be read:",
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
            "NovaPay internal navigation state could not be cleared:",
            error
        );

    }

}


// ======================================
// NAVIGATE INSIDE NOVAPAY
// ======================================
//
// Every Dashboard navigation to another
// NovaPay page uses this function.
//
// This marks the navigation as intentional
// so the lock system does not mistake it
// for leaving NovaPay.
//
// ======================================

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


// ======================================
// CLOSE MODAL
// ======================================

window.closeModal =
    () => {

        if (
            modal
        ) {

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
//
// Important:
//
// This authentication listener is the
// ONLY dashboard authentication listener.
//
// We do not register a second
// onAuthStateChanged() later.
//
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


                if (
                    userName
                ) {

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

            }

            else {

                if (
                    userName
                ) {

                    userName.textContent =
                        user.email?.split("@")[0] ||
                        "User";

                }


                balance =
                    0;

            }


            // ----------------------------------
            // DISPLAY BALANCE
            // ----------------------------------

            if (
                balanceVisible &&
                walletBalance
            ) {

                walletBalance.textContent =
                    formatMoney(
                        balance
                    );

            }


            // ----------------------------------
            // RECENT TRANSACTIONS
            // ----------------------------------
            //
            // IMPORTANT:
            //
            // Do NOT await this.
            //
            // A slow transaction backend must
            // never prevent the dashboard from
            // being interactive.
            //
            // ----------------------------------

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


            // Do not freeze the dashboard if
            // profile loading has a problem.

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
// END OF PART 1
// ======================================
//
// DO NOT add anything here.
// Part 2 continues directly below.
//
// ======================================
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

    if (
        !recentTransactionsContainer
    ) {

        return;

    }


    // ----------------------------------
    // INITIAL LOADING STATE
    // ----------------------------------

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


        // ----------------------------------
        // FIREBASE ID TOKEN
        // ----------------------------------
        //
        // The token identifies the authenticated
        // Firebase user to the backend.
        //
        // ----------------------------------

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


        // ----------------------------------
        // SECURE BACKEND REQUEST
        // ----------------------------------
        //
        // The request is deliberately bounded
        // by an 8-second timeout.
        //
        // A slow Render service must never
        // leave the Dashboard loading forever.
        //
        // ----------------------------------

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


        // ----------------------------------
        // READ RESPONSE
        // ----------------------------------

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


        // ----------------------------------
        // RESPONSE VALIDATION
        // ----------------------------------

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
        // DASHBOARD SHOWS ONLY 3
        // ----------------------------------

        const recentTransactions =
            transactions.slice(
                0,
                3
            );


        // ----------------------------------
        // EMPTY STATE
        // ----------------------------------

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


        // ----------------------------------
        // RENDER TRANSACTIONS
        // ----------------------------------

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


        // ----------------------------------
        // ERROR STATE
        // ----------------------------------
        //
        // IMPORTANT:
        //
        // Transaction failure must NOT
        // disable the rest of Dashboard.
        //
        // ----------------------------------

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
//
// Converts different timestamp formats
// into a sortable number.
//
// Supported examples:
//
// - Firestore Timestamp
// - JavaScript Date
// - ISO string
// - numeric timestamp
//
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

        /*
         * Handle both seconds and
         * milliseconds timestamps.
         */

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


    /*
     * If the backend provides a positive/
     * negative signed amount, use that.
     */

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


    /*
     * Service transactions are normally
     * money-out transactions.
     */

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


    /*
     * Default to debit for an unknown
     * transaction so the dashboard does
     * not incorrectly display money-out
     * activity as income.
     */

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
// END OF PART 2
// ======================================
//
// Part 3 continues directly below.
//
// ======================================
// ======================================
// RENDER RECENT TRANSACTION
// ======================================
//
// This renderer is intentionally kept
// separate from the transaction API.
//
// API loading and UI rendering are
// independent.
//
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
//
// Transaction descriptions come from
// backend data.
//
// Escape them before inserting them
// into innerHTML.
//
// This prevents transaction data from
// becoming executable HTML/JavaScript.
//
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
// TRANSACTION COLORS
// ======================================
//
// The CSS will use these classes:
//
// money-in
// money-out
//
// status-successful
// status-pending
// status-failed
//
// This keeps the transaction renderer
// consistent with Transaction History.
//
// ======================================


// ======================================
// APP LOCK HELPERS
// ======================================
//
// IMPORTANT:
//
// Dashboard does NOT verify the PIN.
//
// Dashboard does NOT store the PIN.
//
// Dashboard does NOT create another
// PIN verification system.
//
// The existing unlock.html + unlock.js
// handles the real 6-digit PIN verification.
//
// Dashboard only manages the lock flag.
//
// ======================================

function getCurrentUserLockKey() {

    const user =
        auth.currentUser;


    if (
        !user
    ) {

        return null;

    }


    return (
        `${LOCK_KEY_PREFIX}${user.uid}`
    );

}


// ======================================
// SET LOCK FLAG
// ======================================

function setAppLockFlag() {

    const lockKey =
        getCurrentUserLockKey();


    if (
        !lockKey
    ) {

        return;

    }


    try {

        localStorage.setItem(
            lockKey,
            "true"
        );


        console.log(
            "NovaPay app lock flag set."
        );

    }

    catch (error) {

        console.error(
            "Unable to set NovaPay lock flag:",
            error
        );

    }

}


// ======================================
// CHECK LOCK FLAG
// ======================================

function hasAppLockFlag() {

    const lockKey =
        getCurrentUserLockKey();


    if (
        !lockKey
    ) {

        return false;

    }


    try {

        return (
            localStorage.getItem(
                lockKey
            ) ===
            "true"
        );

    }

    catch (error) {

        console.error(
            "Unable to read NovaPay lock flag:",
            error
        );


        return false;

    }

}


// ======================================
// CLEAR LOCK FLAG
// ======================================
//
// Normally unlock.js clears this after
// successful PIN verification.
//
// Dashboard can also clear stale state
// only when we know the user deliberately
// navigated internally.
//
// ======================================

function clearAppLockFlag() {

    const lockKey =
        getCurrentUserLockKey();


    if (
        !lockKey
    ) {

        return;

    }


    try {

        localStorage.removeItem(
            lockKey
        );

    }

    catch (error) {

        console.error(
            "Unable to clear NovaPay lock flag:",
            error
        );

    }

}


// ======================================
// REDIRECT TO EXISTING UNLOCK PAGE
// ======================================
//
// We deliberately use the existing
// unlock.html.
//
// The existing unlock.js:
//
// - loads the user's loginPin
// - accepts the 6-digit PIN
// - verifies it
// - clears novaPayLock_<uid>
// - returns to dashboard.html
//
// ======================================

function redirectToUnlock() {

    if (
        window.location.pathname.endsWith(
            "unlock.html"
        )
    ) {

        return;

    }


    markInternalNavigation();


    window.location.replace(
        "unlock.html"
    );

}


// ======================================
// APP BACKGROUND DETECTION
// ======================================
//
// This is intentionally separate from
// navigation.
//
// A normal Dashboard → Airtime navigation
// must NOT trigger the lock.
//
// ======================================

document.addEventListener(
    "visibilitychange",
    () => {

        if (
            document.visibilityState ===
            "hidden"
        ) {

            clearTimeout(
                visibilityTimer
            );


            visibilityTimer =
                setTimeout(
                    () => {

                        /*
                         * If the page remains hidden,
                         * consider it an actual app
                         * background event.
                         */

                        if (
                            document.visibilityState ===
                            "hidden"
                        ) {

                            setAppLockFlag();

                        }

                    },
                    1200
                );

        }

        else {

            clearTimeout(
                visibilityTimer
            );


            visibilityTimer =
                null;

        }

    }
);


// ======================================
// PAGE SHOW
// ======================================
//
// Do NOT lock here.
//
// pageshow also occurs during normal
// browser navigation and back/forward
// navigation.
//
// ======================================

window.addEventListener(
    "pageshow",
    () => {

        clearInternalNavigationFlag();

    }
);


// ======================================
// BEFORE UNLOAD
// ======================================
//
// We intentionally do NOT set the lock
// here.
//
// beforeunload fires during ordinary
// internal page navigation as well.
//
// Setting the lock here was one of the
// causes of the previous navigation/PIN
// problem.
//
// ======================================


// ======================================
// INTERNAL LINK DETECTION
// ======================================
//
// This covers links that may be present
// in the Dashboard HTML but aren't wired
// through navigateWithinNovaPay().
//
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


        /*
         * Ignore external URLs.
         */

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


        /*
         * Ignore anchors and JavaScript
         * links.
         */

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


        /*
         * Only mark actual NovaPay page
         * navigation.
         */

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
// APP LOCK INITIALIZATION
// ======================================
//
// We do NOT immediately redirect simply
// because a lock flag exists.
//
// Why?
//
// If Dashboard has just been reached
// through ordinary internal navigation,
// we must allow the page to load normally.
//
// ======================================

function initializeAppLock() {

    /*
     * If this page was reached through
     * intentional NovaPay navigation,
     * never redirect to unlock.
     */

    if (
        hasInternalNavigationFlag()
    ) {

        clearInternalNavigationFlag();

        appLockTriggered =
            false;

        return;

    }


    /*
     * If there is a genuine lock flag
     * from an earlier background event,
     * send the user to the existing
     * unlock.html.
     */

    if (
        hasAppLockFlag()
    ) {

        if (
            appLockTriggered
        ) {

            return;

        }


        appLockTriggered =
            true;


        redirectToUnlock();

    }

}


// ======================================
// DELAYED LOCK INITIALIZATION
// ======================================
//
// Wait briefly for Firebase auth to
// establish the current user before
// reading the user-specific lock key.
//
// ======================================

function startLockInitialization() {

    const user =
        auth.currentUser;


    if (
        user
    ) {

        initializeAppLock();

        return;

    }


    /*
     * Firebase authentication may not have
     * finished restoring the session yet.
     *
     * The main onAuthStateChanged listener
     * will handle the authenticated state.
     */

}


// ======================================
// END OF PART 3
// ======================================
//
// Part 4 continues directly below.
//
// ======================================
// ======================================
// APP LOCK AUTH INITIALIZATION
// ======================================
//
// Firebase authentication can restore the
// session asynchronously.
//
// We therefore wait until auth.currentUser
// is available before checking the
// user-specific lock flag.
//
// This does NOT register another
// onAuthStateChanged listener.
//
// ======================================

let lockInitializationAttempts =
    0;


const MAX_LOCK_INITIALIZATION_ATTEMPTS =
    40;


function waitForAuthenticatedLockState() {

    if (
        auth.currentUser
    ) {

        initializeAppLock();

        return;

    }


    lockInitializationAttempts += 1;


    if (
        lockInitializationAttempts >=
        MAX_LOCK_INITIALIZATION_ATTEMPTS
    ) {

        console.warn(
            "NovaPay lock initialization timed out waiting for authentication."
        );

        return;

    }


    setTimeout(
        waitForAuthenticatedLockState,
        250
    );

}


waitForAuthenticatedLockState();


// ======================================
// MODAL KEYBOARD SUPPORT
// ======================================
//
// Escape closes an open Dashboard modal.
//
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
// TRANSACTION RETRY KEYBOARD SUPPORT
// ======================================
//
// The retry button is created dynamically,
// so it receives its listener when the
// transaction error state is rendered.
//
// No global click interception is needed.
//
// ======================================


// ======================================
// DASHBOARD READY STATE
// ======================================
//
// This class is informational only.
//
// It does not hide or disable the page.
//
// ======================================

document.documentElement
    .classList
    .add(
        "novapay-dashboard-ready"
    );


// ======================================
// RUNTIME ERROR REPORTING
// ======================================
//
// These listeners only report unexpected
// errors to the browser console.
//
// They do NOT create a loading overlay.
// They do NOT disable Dashboard buttons.
// They do NOT redirect the user.
//
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
// SAFETY: CANCEL STALE VISIBILITY TIMER
// ======================================
//
// If the page becomes visible again,
// make sure no old background timer can
// unexpectedly set a lock.
//
// ======================================

document.addEventListener(
    "visibilitychange",
    () => {

        if (
            document.visibilityState ===
            "visible"
        ) {

            if (
                visibilityTimer
            ) {

                clearTimeout(
                    visibilityTimer
                );


                visibilityTimer =
                    null;

            }

        }

    }
);


// ======================================
// DOCUMENT FOCUS
// ======================================
//
// Focus itself must NEVER trigger the
// PIN lock.
//
// This is intentionally empty except for
// diagnostic logging.
//
// ======================================

window.addEventListener(
    "focus",
    () => {

        console.log(
            "NovaPay Dashboard focused."
        );

    }
);


// ======================================
// PAGE HIDE SAFETY
// ======================================
//
// We intentionally do NOT use pagehide
// to set the lock.
//
// pagehide can happen during ordinary
// navigation between NovaPay pages.
//
// The visibilitychange handler is the
// only mechanism that creates the lock
// flag.
//
// ======================================


// ======================================
// PART 4 END
// ======================================
//
// Part 5 will contain the final startup
// verification and closing code.
//
// ======================================
// ======================================
// FINAL DASHBOARD STARTUP
// ======================================
//
// No second authentication listener.
// No second navigation function.
// No PIN verification here.
//
// The existing unlock.html + unlock.js
// remains responsible for Login PIN
// verification.
//
// ======================================


// ======================================
// FINAL STARTUP CHECK
// ======================================

function runDashboardStartupCheck() {

    console.log(
        "======================================"
    );


    console.log(
        "NovaPay Dashboard V5 initialized"
    );


    console.log(
        "Firebase authentication: ENABLED"
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
        "Existing unlock.js PIN verification: ENABLED"
    );


    console.log(
        "Dashboard transaction rendering: ENABLED"
    );


    console.log(
        "======================================"
    );

}


// ======================================
// RUN STARTUP CHECK
// ======================================

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


// ======================================
// FINAL DASHBOARD SAFETY
// ======================================
//
// Make sure an accidental browser
// navigation does not create a lock.
//
// We intentionally leave beforeunload,
// unload and pagehide untouched.
//
// ======================================


// ======================================
// END OF DASHBOARD.JS
// ======================================
//
// IMPORTANT:
//
// Do not add another script below this.
// Do not add another onAuthStateChanged.
// Do not add another navigation function.
// Do not add another PIN verifier.
//
// ======================================