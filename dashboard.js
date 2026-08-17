window.onload = () => {
    window.scrollTo(0, 0);
};

// ======================================
// NOVAPAY DASHBOARD V3
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
// ELEMENTS
// ======================================

const userName = document.getElementById("userName");
const greetingText = document.getElementById("greetingText");

const walletBalance = document.getElementById("walletBalance");
const hideBalanceBtn = document.getElementById("hideBalance");

const supportBtn = document.getElementById("supportBtn");
const notificationBtn = document.getElementById("notificationBtn");
const profileBtn = document.getElementById("profileBtn");

const addMoneyBtn = document.getElementById("addMoneyBtn");
const historyBtn = document.getElementById("historyBtn");

const airtimeBtn = document.getElementById("airtimeBtn");
const dataBtn = document.getElementById("dataBtn");
const electricityBtn = document.getElementById("electricityBtn");
const tvBtn = document.getElementById("tvBtn");
const bettingBtn = document.getElementById("bettingBtn");
const moreBtn = document.getElementById("moreBtn");

const inviteBtn = document.getElementById("inviteBtn");

const viewAllTransactionsBtn =
    document.getElementById("viewAllTransactionsBtn");

const walletBtn = document.getElementById("walletBtn");
const payBillsBtn = document.getElementById("payBillsBtn");
const profileNavBtn = document.getElementById("profileNavBtn");

const modal = document.getElementById("customModal");
const modalTitle = document.getElementById("modalTitle");
const modalMessage = document.getElementById("modalMessage");

const recentTransactionsContainer =
    document.getElementById("recentTransactionsContainer");


// ======================================
// VARIABLES
// ======================================

let balance = 0;
let balanceVisible = true;


// ======================================
// MODAL
// ======================================

function showModal(title, message) {

    if (modalTitle) {
        modalTitle.textContent = title;
    }

    if (modalMessage) {
        modalMessage.textContent = message;
    }

    if (modal) {
        modal.style.display = "flex";
    }
}


window.closeModal = () => {

    if (modal) {
        modal.style.display = "none";
    }

};


modal?.addEventListener("click", (e) => {

    if (e.target === modal) {
        closeModal();
    }

});


// ======================================
// FORMAT MONEY
// ======================================

function formatMoney(amount) {

    return "₦" + Number(amount).toLocaleString("en-NG", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

}


// ======================================
// GREETING
// ======================================

function updateGreeting() {

    const hour = new Date().getHours();

    if (hour < 12) {

        greetingText.textContent = "☀️ Good Morning";

    } else if (hour < 18) {

        greetingText.textContent = "🌤 Good Afternoon";

    } else {

        greetingText.textContent = "🌙 Good Evening";

    }

}


updateGreeting();


// ======================================
// HIDE / SHOW BALANCE
// ======================================

hideBalanceBtn?.addEventListener("click", () => {

    balanceVisible = !balanceVisible;

    if (balanceVisible) {

        walletBalance.textContent = formatMoney(balance);

        hideBalanceBtn.innerHTML =
            `Hide <i class="fa-regular fa-eye"></i>`;

    } else {

        walletBalance.textContent = "••••••";

        hideBalanceBtn.innerHTML =
            `Show <i class="fa-regular fa-eye-slash"></i>`;

    }

});


// ======================================
// LOAD USER
// ======================================

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        window.location.href = "login.html";

        return;
    }

    try {

        // --------------------------------------
        // USER PROFILE / BALANCE
        // --------------------------------------

        const userRef = doc(db, "users", user.uid);

        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {

            const data = userSnap.data();

            userName.textContent =
                data.fullName || user.email.split("@")[0];

            balance = Number(data.walletBalance || 0);

            if (balanceVisible) {

                walletBalance.textContent =
                    formatMoney(balance);

            }

        } else {

            userName.textContent =
                user.email.split("@")[0];

            balance = 0;

            walletBalance.textContent =
                formatMoney(balance);

        }


        // --------------------------------------
        // RECENT TRANSACTIONS
        //
        // IMPORTANT:
        // Transactions are now loaded through
        // the authenticated backend.
        // The frontend does NOT send a UID.
        // --------------------------------------

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

});


// ======================================
// NAVIGATION
// ======================================

profileBtn?.addEventListener("click", () => {

    window.location.href = "profile.html";

});


profileNavBtn?.addEventListener("click", () => {

    window.location.href = "profile.html";

});


addMoneyBtn?.addEventListener("click", () => {

    window.location.href = "add-money.html";

});


historyBtn?.addEventListener("click", () => {

    window.location.href = "transaction-history.html";

});


viewAllTransactionsBtn?.addEventListener("click", () => {

    window.location.href = "transaction-history.html";

});


// ======================================
// HEADER
// ======================================

supportBtn?.addEventListener("click", () => {

    showModal(
        "Live Support",
        "Live Support will be available in a future NovaPay update."
    );

});


notificationBtn?.addEventListener("click", () => {

    window.location.href = "notifications.html";

});


// ======================================
// BOTTOM NAVIGATION
// ======================================

walletBtn?.addEventListener("click", () => {

    showModal(
        "Wallet",
        "Wallet page is coming soon."
    );

});


payBillsBtn?.addEventListener("click", () => {

});


// ======================================
// QUICK SERVICES
// ======================================

function comingSoon(feature) {

    showModal(
        feature,
        `${feature} will be available in a future NovaPay update.`
    );

}


airtimeBtn?.addEventListener("click", () => {

    window.location.href = "airtime.html";

});


dataBtn?.addEventListener("click", () => {

    window.location.href = "data.html";

});


electricityBtn?.addEventListener("click", () => {

    window.location.href = "electricity.html";

});


tvBtn?.addEventListener("click", () => {

    window.location.href = "tv.html";

});


bettingBtn?.addEventListener("click", () => {

    window.location.href = "betting.html";

});


moreBtn?.addEventListener("click", () => {

    comingSoon("More Services");

});


inviteBtn?.addEventListener("click", () => {

    comingSoon("Invite & Earn");

});


// ======================================
// RECENT TRANSACTIONS
// ======================================
//
// SECURITY:
// The frontend no longer reads the entire
// transactions collection.
//
// It obtains a Firebase ID token and sends
// that token to the backend.
//
// Backend:
//   1. verifies Firebase token
//   2. gets authenticated req.uid
//   3. queries only that user's transactions
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
                <h4>Loading Transactions</h4>
                <p>Your recent transactions are loading...</p>
            </div>
        </div>
    `;


    try {

        const user = auth.currentUser;

        if (!user) {

            throw new Error(
                "Authentication required."
            );

        }


        // --------------------------------------
        // GET VERIFIED FIREBASE ID TOKEN
        // --------------------------------------

        const idToken =
            await user.getIdToken();


        // --------------------------------------
        // CALL SECURE BACKEND
        // --------------------------------------

        const response = await fetch(
            "https://novapay-server.onrender.com/api/transactions?limit=50",
            {
                method: "GET",

                headers: {
                    "Authorization":
                        `Bearer ${idToken}`,

                    "Content-Type":
                        "application/json"
                }
            }
        );


        let result;

        try {

            result = await response.json();

        } catch {

            throw new Error(
                "Invalid response from NovaPay server."
            );

        }


        if (!response.ok || !result.success) {

            throw new Error(
                result.message ||
                "Unable to load transactions."
            );

        }


        const transactions =
            Array.isArray(result.transactions)
                ? result.transactions
                : [];


        // --------------------------------------
        // BACKEND ALREADY FILTERED BY UID
        // --------------------------------------

        transactions.sort((a, b) => {

            return getTransactionDateValue(b) -
                   getTransactionDateValue(a);

        });


        // Dashboard only shows latest 3.

        const recent =
            transactions.slice(0, 3);


        if (recent.length === 0) {

            showNoTransactions();

            return;

        }


        recentTransactionsContainer.innerHTML = "";


        recent.forEach((transaction) => {

            recentTransactionsContainer.appendChild(
                createRecentTransaction(transaction)
            );

        });


    } catch (error) {

        console.error(
            "Failed to load recent transactions:",
            error
        );


        recentTransactionsContainer.innerHTML = `
            <div class="transaction-card">
                <div class="transaction-icon">
                    <i class="fa-solid fa-receipt"></i>
                </div>

                <div class="transaction-details">
                    <h4>Unable to Load</h4>
                    <p>Please try again later.</p>
                </div>
            </div>
        `;

    }

}


// ======================================
// TRANSACTION DATE
// ======================================

function getTransactionDateValue(transaction) {

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
        timestamp.seconds !==
        undefined
    ) {

        return timestamp.seconds * 1000;

    }


    const date =
        new Date(timestamp);


    return isNaN(date.getTime())
        ? 0
        : date.getTime();

}


// ======================================
// TRANSACTION DATE FORMAT
// ======================================

function formatTransactionDate(transaction) {

    const timestamp =
        transaction.completedAt ||
        transaction.createdAt;

    let date;


    if (!timestamp) {

        date = new Date();

    } else if (
        typeof timestamp.toDate ===
        "function"
    ) {

        date = timestamp.toDate();

    } else if (
        typeof timestamp.toMillis ===
        "function"
    ) {

        date =
            new Date(timestamp.toMillis());

    } else if (
        timestamp.seconds !==
        undefined
    ) {

        date =
            new Date(timestamp.seconds * 1000);

    } else {

        date =
            new Date(timestamp);

    }


    if (isNaN(date.getTime())) {

        date = new Date();

    }


    const dateText =
        date.toLocaleDateString(
            "en-NG",
            {
                day: "numeric",
                month: "short",
                year: "numeric"
            }
        );


    const timeText =
        date.toLocaleTimeString(
            "en-NG",
            {
                hour: "numeric",
                minute: "2-digit"
            }
        );


    return `${dateText} · ${timeText}`;

}


// ======================================
// TRANSACTION TYPE
// ======================================

function getTransactionType(transaction) {

    return String(
        transaction.type || ""
    )
        .trim()
        .toUpperCase();

}


// ======================================
// MONEY IN
// ======================================

function isMoneyIn(transaction) {

    const type =
        getTransactionType(transaction);


    return (
        type === "DEPOSIT" ||
        type === "CREDIT" ||
        type === "CREDIT_ALERT"
    );

}


// ======================================
// TRANSACTION TITLE
// ======================================

function getTransactionTitle(transaction) {

    const type =
        getTransactionType(transaction);


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
            return "Transfer";


        default:
            return "Transaction";

    }

}


// ======================================
// TRANSACTION ICON
// ======================================

function getTransactionIcon(transaction) {

    const type =
        getTransactionType(transaction);


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
            return "fa-money-bill-transfer";


        default:
            return "fa-receipt";

    }

}


// ======================================
// TRANSACTION ICON CLASS
// ======================================

function getTransactionIconClass(transaction) {

    const type =
        getTransactionType(transaction);


    if (
        type === "DEPOSIT" ||
        type === "CREDIT" ||
        type === "CREDIT_ALERT"
    ) {

        return "credit";

    }


    return "debit";

}


// ======================================
// TRANSACTION STATUS
// ======================================

function getTransactionStatus(transaction) {

    const status =
        String(
            transaction.status || ""
        )
            .trim()
            .toUpperCase();


    if (
        status === "SUCCESS" ||
        status === "SUCCESSFUL" ||
        status === "COMPLETED" ||
        status === "COMPLETE" ||
        status === "PAID"
    ) {

        return "Successful";

    }


    if (
        status === "FAILED" ||
        status === "FAIL" ||
        status === "CANCELLED" ||
        status === "CANCELED"
    ) {

        return "Failed";

    }


    return "Pending";

}


// ======================================
// CREATE RECENT TRANSACTION
// ======================================

function createRecentTransaction(transaction) {

    const card =
        document.createElement("div");


    card.className =
        "transaction-card";


    const title =
        getTransactionTitle(transaction);


    const icon =
        getTransactionIcon(transaction);


    const iconClass =
        getTransactionIconClass(transaction);


    const status =
        getTransactionStatus(transaction);


    const amount =
        Math.abs(
            Number(transaction.amount || 0)
        );


    const moneyInTransaction =
        isMoneyIn(transaction);


    const sign =
        moneyInTransaction
            ? "+"
            : "-";


    card.innerHTML = `

        <div class="transaction-icon ${iconClass}">
            <i class="fa-solid ${icon}"></i>
        </div>

        <div class="transaction-details">

            <h4>
                ${title}
            </h4>

            <p>
                ${formatTransactionDate(transaction)}
                ·
                ${status}
            </p>

        </div>

        <div class="transaction-amount ${
            moneyInTransaction
                ? "money-in"
                : "money-out"
        }">

            ${sign} ${formatMoney(amount)}

        </div>

    `;


    return card;

}


// ======================================
// NO TRANSACTIONS
// ======================================

function showNoTransactions() {

    recentTransactionsContainer.innerHTML = `

        <div class="transaction-card">

            <div class="transaction-icon">

                <i class="fa-solid fa-receipt"></i>

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

}


// ======================================
// DASHBOARD READY
// ======================================

console.log(
    "✅ NovaPay Dashboard V3 Loaded"
);


// ======================================
// NOVAPAY APP LOCK
// ======================================

let novaPayAppLocked = false;


// ======================================
// GET CURRENT USER
// ======================================

function getNovaPayLockKey() {

    const user =
        auth.currentUser;


    if (!user) {
        return null;
    }


    return `novaPayLock_${user.uid}`;

}


// ======================================
// CHECK IF NOVAPAY IS ALREADY LOCKED
// ======================================

function checkNovaPayLock() {

    const lockKey =
        getNovaPayLockKey();


    if (!lockKey) {
        return;
    }


    if (
        localStorage.getItem(lockKey) ===
        "true"
    ) {

        novaPayAppLocked = true;


        window.location.replace(
            "unlock.html"
        );

    }

}


// ======================================
// APP GOES INTO BACKGROUND
// ======================================

document.addEventListener(
    "visibilitychange",
    () => {

        if (
            document.visibilityState ===
            "hidden"
        ) {

            const lockKey =
                getNovaPayLockKey();


            if (!lockKey) {
                return;
            }


            localStorage.setItem(
                lockKey,
                "true"
            );


            novaPayAppLocked = true;

        }

    }
);


// ======================================
// APP RETURNS TO FOREGROUND
// ======================================

document.addEventListener(
    "visibilitychange",
    () => {

        if (
            document.visibilityState !==
            "visible"
        ) {

            return;

        }


        if (!novaPayAppLocked) {

            return;

        }


        window.location.replace(
            "unlock.html"
        );

    }
);


// ======================================
// INITIAL APP LOCK CHECK
// ======================================

onAuthStateChanged(
    auth,
    (user) => {

        if (!user) {
            return;
        }


        checkNovaPayLock();

    }
);


console.log(
    "🔐 NovaPay App Lock Ready"
);