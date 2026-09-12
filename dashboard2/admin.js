/* =========================================================
   NOVAPAY ADMIN DASHBOARD
   admin.js
   ========================================================= */

"use strict";


/* =========================================================
   DOM REFERENCES
   ========================================================= */

const adminApp = document.getElementById("adminApp");

const manualToggle = document.getElementById("manualToggle");
const manualClose = document.getElementById("manualClose");
const manualBackdrop = document.getElementById("manualBackdrop");
const adminManual = document.getElementById("adminManual");
const adminManualScroll = document.getElementById("adminManualScroll");
const adminManualContent = document.getElementById("adminManualContent");

const adminPageStatus = document.getElementById("adminPageStatus");

const totalUsersElement = document.getElementById("totalUsers");
const todayActiveUsersElement = document.getElementById("todayActiveUsers");
const totalProfitElement = document.getElementById("totalProfit");

const analysisChart = document.getElementById("analysisChart");
const recentTransactionsBody = document.getElementById(
    "recentTransactionsBody"
);


/* =========================================================
   APPLICATION STATE
   ========================================================= */

const state = {
    manualOpen: false,
    dashboardReady: false
};


/* =========================================================
   STATUS ANNOUNCEMENT
   ========================================================= */

function announce(message) {
    if (!adminPageStatus) {
        return;
    }

    adminPageStatus.textContent = "";

    window.requestAnimationFrame(() => {
        adminPageStatus.textContent = message;
    });
}


/* =========================================================
   OPEN MANUAL
   ========================================================= */

function openManual() {
    if (
        !adminManual ||
        !manualToggle ||
        !manualBackdrop
    ) {
        return;
    }

    state.manualOpen = true;

    adminManual.hidden = false;
    manualBackdrop.hidden = false;

    adminManual.setAttribute("aria-hidden", "false");
    manualToggle.setAttribute("aria-expanded", "true");
    manualBackdrop.setAttribute("aria-hidden", "false");

    document.body.classList.add("manual-is-open");

    announce("Admin manual opened.");

    if (adminManualScroll) {
        adminManualScroll.scrollTop = 0;
    }

    window.requestAnimationFrame(() => {
        if (manualClose) {
            manualClose.focus();
        }
    });
}


/* =========================================================
   CLOSE MANUAL
   ========================================================= */

function closeManual() {
    if (
        !adminManual ||
        !manualToggle ||
        !manualBackdrop
    ) {
        return;
    }

    state.manualOpen = false;

    adminManual.hidden = true;
    manualBackdrop.hidden = true;

    adminManual.setAttribute("aria-hidden", "true");
    manualToggle.setAttribute("aria-expanded", "false");
    manualBackdrop.setAttribute("aria-hidden", "true");

    document.body.classList.remove("manual-is-open");

    announce("Admin manual closed.");

    window.requestAnimationFrame(() => {
        manualToggle.focus();
    });
}


/* =========================================================
   TOGGLE MANUAL
   ========================================================= */

function toggleManual() {
    if (state.manualOpen) {
        closeManual();
        return;
    }

    openManual();
}


/* =========================================================
   ESCAPE KEY
   ========================================================= */

function handleKeyboard(event) {
    if (event.key !== "Escape") {
        return;
    }

    if (!state.manualOpen) {
        return;
    }

    closeManual();
}


/* =========================================================
   BACKDROP CLICK
   ========================================================= */

function handleBackdropClick(event) {
    if (event.target !== manualBackdrop) {
        return;
    }

    closeManual();
}


/* =========================================================
   DASHBOARD SUMMARY
   ========================================================= */

function updateDashboardSummary({
    totalUsers = null,
    todayActiveUsers = null,
    totalProfit = null
} = {}) {
    if (totalUsersElement) {
        totalUsersElement.textContent =
            totalUsers === null
                ? "—"
                : formatInteger(totalUsers);
    }

    if (todayActiveUsersElement) {
        todayActiveUsersElement.textContent =
            todayActiveUsers === null
                ? "—"
                : formatInteger(todayActiveUsers);
    }

    if (totalProfitElement) {
        totalProfitElement.textContent =
            totalProfit === null
                ? "—"
                : formatCurrency(totalProfit);
    }
}


/* =========================================================
   INTEGER FORMATTER
   ========================================================= */

function formatInteger(value) {
    const numericValue = Number(value);

    if (!Number.isFinite(numericValue)) {
        return "—";
    }

    return new Intl.NumberFormat("en-NG", {
        maximumFractionDigits: 0
    }).format(numericValue);
}


/* =========================================================
   CURRENCY FORMATTER
   ========================================================= */

function formatCurrency(value) {
    const numericValue = Number(value);

    if (!Number.isFinite(numericValue)) {
        return "—";
    }

    return new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency: "NGN",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(numericValue);
}


/* =========================================================
   ANALYSIS STATE
   ========================================================= */

function setAnalysisState(message) {
    if (!analysisChart) {
        return;
    }

    analysisChart.innerHTML = "";

    const wrapper = document.createElement("div");
    wrapper.className = "analysis-empty";

    const title = document.createElement("span");
    title.className = "analysis-empty-title";
    title.textContent = "Analysis data";

    const text = document.createElement("span");
    text.className = "analysis-empty-text";
    text.textContent = message;

    wrapper.appendChild(title);
    wrapper.appendChild(text);

    analysisChart.appendChild(wrapper);
}


/* =========================================================
   RECENT TRANSACTIONS
   ========================================================= */

function renderRecentTransactions(transactions = []) {
    if (!recentTransactionsBody) {
        return;
    }

    recentTransactionsBody.innerHTML = "";

    if (!Array.isArray(transactions) || transactions.length === 0) {
        const row = document.createElement("tr");
        row.className = "transactions-empty-row";

        const cell = document.createElement("td");
        cell.className = "transactions-empty";
        cell.colSpan = 5;
        cell.textContent =
            "No recent transactions available.";

        row.appendChild(cell);
        recentTransactionsBody.appendChild(row);

        return;
    }

    transactions.forEach((transaction) => {
        const row = document.createElement("tr");

        const dateCell = document.createElement("td");
        dateCell.textContent =
            transaction.date ?? "—";

        const userCell = document.createElement("td");
        userCell.textContent =
            transaction.user ?? "—";

        const typeCell = document.createElement("td");
        typeCell.textContent =
            transaction.type ?? "—";

        const amountCell = document.createElement("td");
        amountCell.textContent =
            transaction.amount === undefined ||
            transaction.amount === null
                ? "—"
                : formatCurrency(transaction.amount);

        const statusCell = document.createElement("td");
        statusCell.textContent =
            transaction.status ?? "—";

        row.appendChild(dateCell);
        row.appendChild(userCell);
        row.appendChild(typeCell);
        row.appendChild(amountCell);
        row.appendChild(statusCell);

        recentTransactionsBody.appendChild(row);
    });
}


/* =========================================================
   DASHBOARD INITIALIZATION
   ========================================================= */

function initializeDashboard() {
    updateDashboardSummary({
        totalUsers: null,
        todayActiveUsers: null,
        totalProfit: null
    });

    setAnalysisState(
        "No analysis data available yet."
    );

    renderRecentTransactions([]);

    state.dashboardReady = true;

    announce("NovaPay admin dashboard ready.");
}


/* =========================================================
   MANUAL CONTENT PREPARATION
   ========================================================= */

function initializeManual() {
    if (!adminManualContent) {
        return;
    }

    /*
     * Individual admin tools intentionally do not live here.
     *
     * They will be implemented separately through:
     *
     * admin-buttons.html
     * admin-buttons.css
     * admin-button.js
     *
     * This keeps the dashboard separate from the actual
     * admin management tools.
     */

    adminManualContent.innerHTML = "";

    const placeholder = document.createElement("div");
    placeholder.className = "manual-placeholder";

    const icon = document.createElement("div");
    icon.className = "manual-placeholder-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = "☰";

    const title = document.createElement("h3");
    title.textContent = "Admin Manual";

    const description = document.createElement("p");
    description.textContent =
        "Admin management tools will be added here one feature at a time.";

    placeholder.appendChild(icon);
    placeholder.appendChild(title);
    placeholder.appendChild(description);

    adminManualContent.appendChild(placeholder);
}


/* =========================================================
   EVENT LISTENERS
   ========================================================= */

if (manualToggle) {
    manualToggle.addEventListener(
        "click",
        toggleManual
    );
}


if (manualClose) {
    manualClose.addEventListener(
        "click",
        closeManual
    );
}


if (manualBackdrop) {
    manualBackdrop.addEventListener(
        "click",
        handleBackdropClick
    );
}


document.addEventListener(
    "keydown",
    handleKeyboard
);


/* =========================================================
   PREVENT BACKGROUND SCROLL WHILE MANUAL IS OPEN
   ========================================================= */

document.addEventListener(
    "wheel",
    (event) => {
        if (!state.manualOpen) {
            return;
        }

        if (
            adminManualScroll &&
            adminManualScroll.contains(event.target)
        ) {
            return;
        }

        event.preventDefault();
    },
    {
        passive: false
    }
);


/* =========================================================
   PUBLIC ADMIN API
   ========================================================= */

window.NovaPayAdmin = Object.freeze({
    openManual,
    closeManual,
    toggleManual,
    updateDashboardSummary,
    renderRecentTransactions,
    setAnalysisState,
    formatInteger,
    formatCurrency
});


/* =========================================================
   START APPLICATION
   ========================================================= */

initializeManual();
initializeDashboard();