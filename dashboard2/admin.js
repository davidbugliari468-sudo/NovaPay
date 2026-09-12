/* ================================================================
   NOVAPAY ADMIN DASHBOARD
   admin.js
   =================================================================

   Current stage:
   - Dashboard
   - MANUAL open/close
   - Manual scrolling
   - Keyboard accessibility
   - Dashboard placeholder state

   Individual manual-button pages will be handled later by:
   - admin-buttons.html
   - admin-buttons.css
   - admin-button.js
   ================================================================= */


/* ================================================================
   1. DOM REFERENCES
   ================================================================= */

const adminApp = document.getElementById("adminApp");

const manualToggle = document.getElementById("manualToggle");
const manualClose = document.getElementById("manualClose");
const adminManual = document.getElementById("adminManual");
const manualBackdrop = document.getElementById("manualBackdrop");
const adminManualScroll = document.getElementById("adminManualScroll");

const dashboardView = document.getElementById("dashboardView");
const adminPageStatus = document.getElementById("adminPageStatus");

const totalUsersElement = document.getElementById("totalUsers");
const todayActiveUsersElement = document.getElementById("todayActiveUsers");
const totalProfitElement = document.getElementById("totalProfit");

const analysisChart = document.getElementById("analysisChart");
const recentTransactionsBody = document.getElementById(
    "recentTransactionsBody"
);

const manualItems = document.querySelectorAll(
    ".admin-manual-item[data-admin-view]"
);


/* ================================================================
   2. APPLICATION STATE
   ================================================================= */

const adminState = {
    manualOpen: false,
    selectedManualView: null,
    dashboardReady: false
};


/* ================================================================
   3. BASIC DOM SAFETY
   ================================================================= */

if (!adminApp) {
    throw new Error(
        "NovaPay Admin: #adminApp was not found in admin.html."
    );
}


/* ================================================================
   4. ACCESSIBILITY STATUS
   ================================================================= */

function announceStatus(message) {
    if (!adminPageStatus) {
        return;
    }

    adminPageStatus.textContent = "";

    window.setTimeout(() => {
        adminPageStatus.textContent = message;
    }, 20);
}


/* ================================================================
   5. MANUAL OPEN
   ================================================================= */

function openManual() {
    if (!adminManual || !manualToggle) {
        return;
    }

    adminState.manualOpen = true;

    adminManual.hidden = false;

    if (manualBackdrop) {
        manualBackdrop.hidden = false;
    }

    manualToggle.setAttribute(
        "aria-expanded",
        "true"
    );

    document.body.classList.add("manual-is-open");

    announceStatus(
        "Admin manual opened."
    );

    window.setTimeout(() => {
        if (manualClose) {
            manualClose.focus();
        }
    }, 50);
}


/* ================================================================
   6. MANUAL CLOSE
   ================================================================= */

function closeManual() {
    if (!adminManual || !manualToggle) {
        return;
    }

    adminState.manualOpen = false;

    adminManual.hidden = true;

    if (manualBackdrop) {
        manualBackdrop.hidden = true;
    }

    manualToggle.setAttribute(
        "aria-expanded",
        "false"
    );

    document.body.classList.remove("manual-is-open");

    announceStatus(
        "Admin manual closed."
    );

    window.setTimeout(() => {
        manualToggle.focus();
    }, 20);
}


/* ================================================================
   7. TOGGLE MANUAL
   ================================================================= */

function toggleManual() {
    if (adminState.manualOpen) {
        closeManual();
        return;
    }

    openManual();
}


/* ================================================================
   8. MANUAL BUTTON HANDLING
   =================================================================

   IMPORTANT:

   These buttons are NOT building the individual pages yet.

   For now they:
   - identify which manual button was selected
   - close the manual
   - preserve the selected view in application state

   The actual pages will be connected later through:
   admin-buttons.html
   admin-buttons.css
   admin-button.js
   ================================================================= */

function handleManualItemClick(event) {
    const button = event.currentTarget;

    if (!(button instanceof HTMLButtonElement)) {
        return;
    }

    const selectedView = button.dataset.adminView;

    if (!selectedView) {
        return;
    }

    adminState.selectedManualView = selectedView;

    /*
        The individual page is intentionally NOT opened here yet.

        That functionality belongs to the next build stage.
    */

    announceStatus(
        `${button.textContent.trim()} selected.`
    );

    closeManual();
}


/* ================================================================
   9. ESCAPE KEY
   ================================================================= */

function handleGlobalKeydown(event) {
    if (event.key !== "Escape") {
        return;
    }

    if (!adminState.manualOpen) {
        return;
    }

    closeManual();
}


/* ================================================================
   10. PREVENT BACKGROUND INTERACTION STATE
   =================================================================

   We do not disable scrolling on the entire document.

   This is intentional because the dashboard is designed to allow
   vertical and horizontal scrolling on smaller screens.

   The manual panel itself has its own vertical scroll container.
   ================================================================= */

function updateManualScrollState() {
    if (!adminManualScroll) {
        return;
    }

    /*
        Force the browser to preserve the scroll position naturally.

        No artificial height or JavaScript scrolling is applied.
        CSS controls the actual scroll behavior.
    */

    adminManualScroll.style.overscrollBehavior = "contain";
}


/* ================================================================
   11. DASHBOARD INITIALIZATION
   ================================================================= */

function initializeDashboard() {
    /*
        The backend connection is deliberately not added yet.

        Therefore we keep the dashboard values as "—" rather than
        inventing production data.
    */

    if (totalUsersElement) {
        totalUsersElement.textContent = "—";
    }

    if (todayActiveUsersElement) {
        todayActiveUsersElement.textContent = "—";
    }

    if (totalProfitElement) {
        totalProfitElement.textContent = "—";
    }

    /*
        Keep the current empty analysis state until real dashboard
        data is connected.
    */

    if (analysisChart) {
        analysisChart.setAttribute(
            "data-state",
            "waiting-for-data"
        );
    }

    /*
        Keep the current empty transaction state until real
        transaction data is connected.
    */

    if (recentTransactionsBody) {
        recentTransactionsBody.setAttribute(
            "data-state",
            "waiting-for-data"
        );
    }

    adminState.dashboardReady = true;
}


/* ================================================================
   12. DASHBOARD DATA API
   =================================================================

   These functions are intentionally prepared for the next stage.

   They allow real backend data to replace the placeholders without
   changing the dashboard HTML structure.

   No fake data is inserted.
   ================================================================= */

function updateDashboardSummary(data) {
    if (!data || typeof data !== "object") {
        return;
    }

    if (
        totalUsersElement &&
        Object.prototype.hasOwnProperty.call(data, "totalUsers")
    ) {
        totalUsersElement.textContent =
            formatInteger(data.totalUsers);
    }

    if (
        todayActiveUsersElement &&
        Object.prototype.hasOwnProperty.call(data, "todayActiveUsers")
    ) {
        todayActiveUsersElement.textContent =
            formatInteger(data.todayActiveUsers);
    }

    if (
        totalProfitElement &&
        Object.prototype.hasOwnProperty.call(data, "totalProfit")
    ) {
        totalProfitElement.textContent =
            formatCurrency(data.totalProfit);
    }
}


/* ================================================================
   13. INTEGER FORMATTER
   ================================================================= */

function formatInteger(value) {
    const number = Number(value);

    if (!Number.isFinite(number)) {
        return "—";
    }

    return new Intl.NumberFormat(
        "en-NG",
        {
            maximumFractionDigits: 0
        }
    ).format(number);
}


/* ================================================================
   14. CURRENCY FORMATTER
   ================================================================= */

function formatCurrency(value) {
    const number = Number(value);

    if (!Number.isFinite(number)) {
        return "—";
    }

    return new Intl.NumberFormat(
        "en-NG",
        {
            style: "currency",
            currency: "NGN",
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    ).format(number);
}


/* ================================================================
   15. TRANSACTION DATA RENDERER
   =================================================================

   This is ready for the real transaction data later.

   Expected object shape:

   {
       date: "...",
       user: "...",
       type: "...",
       amount: 0,
       status: "..."
   }

   No transaction data is fabricated.
   ================================================================= */

function renderRecentTransactions(transactions) {
    if (!recentTransactionsBody) {
        return;
    }

    if (!Array.isArray(transactions) || transactions.length === 0) {
        recentTransactionsBody.innerHTML = `
            <tr class="dashboard-empty-row">
                <td
                    colspan="5"
                    class="dashboard-empty-cell"
                >
                    <div class="dashboard-empty-state">
                        <div
                            class="dashboard-empty-icon"
                            aria-hidden="true"
                        >
                            —
                        </div>

                        <strong>
                            No transaction data loaded
                        </strong>

                        <span>
                            Recent transactions will appear here.
                        </span>
                    </div>
                </td>
            </tr>
        `;

        return;
    }

    recentTransactionsBody.innerHTML = "";

    transactions.forEach((transaction) => {
        if (
            !transaction ||
            typeof transaction !== "object"
        ) {
            return;
        }

        const row = document.createElement("tr");

        const dateCell = document.createElement("td");
        const userCell = document.createElement("td");
        const typeCell = document.createElement("td");
        const amountCell = document.createElement("td");
        const statusCell = document.createElement("td");

        dateCell.textContent =
            transaction.date || "—";

        userCell.textContent =
            transaction.user || "—";

        typeCell.textContent =
            transaction.type || "—";

        amountCell.textContent =
            formatCurrency(transaction.amount);

        statusCell.textContent =
            transaction.status || "—";

        row.appendChild(dateCell);
        row.appendChild(userCell);
        row.appendChild(typeCell);
        row.appendChild(amountCell);
        row.appendChild(statusCell);

        recentTransactionsBody.appendChild(row);
    });
}


/* ================================================================
   16. ANALYSIS STATE
   =================================================================

   The actual analysis chart will be connected when the dashboard
   backend/data layer is built.

   We deliberately do not invent chart values.
   ================================================================= */

function setAnalysisState(state, message) {
    if (!analysisChart) {
        return;
    }

    analysisChart.dataset.state = state;

    if (!message) {
        return;
    }

    const existingMessage =
        analysisChart.querySelector(
            ".analysis-empty-state p"
        );

    if (existingMessage) {
        existingMessage.textContent = message;
    }
}


/* ================================================================
   17. EVENT LISTENERS
   ================================================================= */

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
        closeManual
    );
}

manualItems.forEach((button) => {
    button.addEventListener(
        "click",
        handleManualItemClick
    );
});

document.addEventListener(
    "keydown",
    handleGlobalKeydown
);


/* ================================================================
   18. INITIAL SETUP
   ================================================================= */

updateManualScrollState();

initializeDashboard();


/* ================================================================
   19. INITIAL ACCESSIBILITY STATE
   ================================================================= */

if (manualToggle) {
    manualToggle.setAttribute(
        "aria-expanded",
        "false"
    );
}


/* ================================================================
   20. DEVELOPMENT API
   =================================================================

   These methods are exposed only through the NovaPayAdmin namespace
   so the next development stages can connect real backend data
   without rewriting this dashboard.

   They do not expose credentials or private information.
   ================================================================= */

window.NovaPayAdmin = {
    openManual,
    closeManual,
    toggleManual,
    updateDashboardSummary,
    renderRecentTransactions,
    setAnalysisState
};