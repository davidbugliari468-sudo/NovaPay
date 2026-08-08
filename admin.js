// ======================================
// NOVAPAY ADMIN
// DASHBOARD
// ======================================

import {
    getAuth,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

import {
    getFirestore,
    collection,
    getDocs,
    query,
    orderBy,
    limit
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

import { app } from "./firebase-config.js";


const auth = getAuth(app);
const db = getFirestore(app);


// ======================================
// ELEMENTS
// ======================================

const totalUsers =
    document.getElementById("totalUsers");

const totalTransactions =
    document.getElementById("totalTransactions");

const totalDeposits =
    document.getElementById("totalDeposits");

const recentActivity =
    document.getElementById("recentActivity");

const logoutBtn =
    document.getElementById("logoutBtn");


// ======================================
// AUTH
// ======================================

onAuthStateChanged(auth, async (user) => {

    if (!user) {
        window.location.href = "login.html";
        return;
    }

    await loadDashboard();

});


// ======================================
// LOAD DASHBOARD
// ======================================

async function loadDashboard() {

    try {

        await Promise.all([
            loadUsers(),
            loadTransactions(),
            loadDeposits(),
            loadRecentActivity()
        ]);

    } catch (error) {

        console.error(
            "NovaPay Admin Error:",
            error
        );

    }

}


// ======================================
// USERS
// ======================================

async function loadUsers() {

    const snapshot =
        await getDocs(
            collection(db, "users")
        );

    totalUsers.textContent =
        snapshot.size;

}


// ======================================
// TRANSACTIONS
// ======================================

async function loadTransactions() {

    const snapshot =
        await getDocs(
            collection(db, "transactions")
        );

    totalTransactions.textContent =
        snapshot.size;

}


// ======================================
// DEPOSITS
// ======================================

async function loadDeposits() {

    const snapshot =
        await getDocs(
            collection(db, "transactions")
        );

    let total = 0;

    snapshot.forEach((docSnap) => {

        const data = docSnap.data();

        const type =
            String(data.type || "")
            .trim()
            .toUpperCase();

        if (
            type === "DEPOSIT" ||
            type === "CREDIT" ||
            type === "CREDIT_ALERT"
        ) {

            total += Number(
                data.amount || 0
            );

        }

    });

    totalDeposits.textContent =
        formatMoney(total);

}


// ======================================
// RECENT ACTIVITY
// ======================================

async function loadRecentActivity() {

    const activityQuery =
        query(
            collection(db, "transactions"),
            orderBy("createdAt", "desc"),
            limit(5)
        );

    const snapshot =
        await getDocs(activityQuery);


    if (snapshot.empty) {

        recentActivity.innerHTML = `
            <div class="empty-state">
                No recent activity
            </div>
        `;

        return;
    }


    recentActivity.innerHTML = "";


    snapshot.forEach((docSnap) => {

        const data = docSnap.data();

        const amount =
            Number(data.amount || 0);

        const type =
            String(data.type || "Transaction")
            .trim()
            .toUpperCase();

        const item =
            document.createElement("div");

        item.style.padding = "15px";
        item.style.borderBottom =
            "1px solid #eef0f3";

        item.innerHTML = `
            <strong style="font-size:14px;">
                ${escapeHtml(type)}
            </strong>

            <div style="
                display:flex;
                justify-content:space-between;
                margin-top:5px;
                font-size:12px;
                color:#64748b;
            ">

                <span>
                    ${escapeHtml(
                        data.uid || "Unknown user"
                    )}
                </span>

                <strong style="color:#111827;">
                    ${formatMoney(amount)}
                </strong>

            </div>
        `;

        recentActivity.appendChild(item);

    });

}


// ======================================
// LOGOUT
// ======================================

logoutBtn.addEventListener(
    "click",
    async () => {

        try {

            await signOut(auth);

            window.location.href =
                "login.html";

        } catch (error) {

            console.error(
                "Logout error:",
                error
            );

        }

    }
);


// ======================================
// MONEY FORMAT
// ======================================

function formatMoney(amount) {

    return new Intl.NumberFormat(
        "en-NG",
        {
            style: "currency",
            currency: "NGN",
            minimumFractionDigits: 2
        }
    ).format(amount);

}


// ======================================
// BASIC HTML SAFETY
// ======================================

function escapeHtml(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}