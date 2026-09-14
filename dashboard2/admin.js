"use strict";

/*
 * NovaPay Admin Dashboard
 *
 * This file controls the dashboard only.
 *
 * IMPORTANT:
 * - admin-button.html is connected directly from admin.html.
 * - This file does NOT fetch admin-button.html.
 * - This file does NOT inject admin-button.html into the dashboard.
 * - Management buttons belong to admin-button.html / admin-button.js.
 */

document.addEventListener("DOMContentLoaded", () => {
  const adminApp = document.getElementById("adminApp");

  const adminPageStatus =
    document.getElementById("adminPageStatus");

  const totalUsers =
    document.getElementById("totalUsers");

  const todayActiveUsers =
    document.getElementById("todayActiveUsers");

  const totalProfit =
    document.getElementById("totalProfit");

  const analysisChart =
    document.getElementById("analysisChart");

  const recentTransactionsBody =
    document.getElementById("recentTransactionsBody");


  /* =========================================
     DASHBOARD STATUS
  ========================================== */

  function setStatus(message = "") {
    if (!adminPageStatus) {
      return;
    }

    adminPageStatus.textContent = String(message);
  }


  /* =========================================
     SUMMARY DATA
  ========================================== */

  function setDashboardSummary(data = {}) {
    if (totalUsers && data.totalUsers !== undefined) {
      totalUsers.textContent = formatValue(data.totalUsers);
    }

    if (
      todayActiveUsers &&
      data.todayActiveUsers !== undefined
    ) {
      todayActiveUsers.textContent =
        formatValue(data.todayActiveUsers);
    }

    if (totalProfit && data.totalProfit !== undefined) {
      totalProfit.textContent =
        formatValue(data.totalProfit);
    }
  }


  function formatValue(value) {
    if (value === null || value === undefined) {
      return "—";
    }

    if (typeof value === "number") {
      return value.toLocaleString();
    }

    return String(value);
  }


  /* =========================================
     ANALYSIS
  ========================================== */

  function setAnalysisChart(content) {
    if (!analysisChart) {
      return;
    }

    if (content === null || content === undefined) {
      analysisChart.innerHTML = `
        <div class="dashboard-placeholder">
          <div
            class="dashboard-placeholder-icon"
            aria-hidden="true"
          >
            ◌
          </div>

          <strong>
            Analysis data will appear here
          </strong>

          <span>
            Platform analytics will be connected to the backend.
          </span>
        </div>
      `;

      return;
    }

    if (typeof content === "string") {
      analysisChart.innerHTML = content;
      return;
    }

    if (content instanceof Node) {
      analysisChart.replaceChildren(content);
      return;
    }

    analysisChart.textContent = String(content);
  }


  /* =========================================
     RECENT TRANSACTIONS
  ========================================== */

  function setRecentTransactions(transactions = []) {
    if (!recentTransactionsBody) {
      return;
    }

    if (!Array.isArray(transactions) || transactions.length === 0) {
      recentTransactionsBody.innerHTML = `
        <tr>
          <td colspan="5">
            <div class="dashboard-table-empty">
              Recent transactions will appear here.
            </div>
          </td>
        </tr>
      `;

      return;
    }

    recentTransactionsBody.innerHTML = "";

    transactions.forEach((transaction) => {
      const row = document.createElement("tr");

      const transactionCell =
        document.createElement("td");

      const userCell =
        document.createElement("td");

      const amountCell =
        document.createElement("td");

      const statusCell =
        document.createElement("td");

      const timeCell =
        document.createElement("td");


      transactionCell.textContent =
        transaction.transaction ??
        transaction.id ??
        "—";

      userCell.textContent =
        transaction.user ??
        transaction.userName ??
        "—";

      amountCell.textContent =
        transaction.amount ??
        "—";

      statusCell.textContent =
        transaction.status ??
        "—";

      timeCell.textContent =
        transaction.time ??
        transaction.createdAt ??
        "—";


      row.appendChild(transactionCell);
      row.appendChild(userCell);
      row.appendChild(amountCell);
      row.appendChild(statusCell);
      row.appendChild(timeCell);

      recentTransactionsBody.appendChild(row);
    });
  }


  /* =========================================
     DASHBOARD INITIALIZATION
  ========================================== */

  function initializeDashboard() {
    setDashboardSummary({
      totalUsers: "—",
      todayActiveUsers: "—",
      totalProfit: "—"
    });

    setAnalysisChart(null);

    setRecentTransactions([]);

    setStatus("");
  }


  /* =========================================
     OPTIONAL DASHBOARD API
  ========================================== */

  window.NovaPayAdmin = {
    setStatus,

    setDashboardSummary,

    setAnalysisChart,

    setRecentTransactions,

    initializeDashboard
  };


  /* =========================================
     START
  ========================================== */

  initializeDashboard();

  if (adminApp) {
    adminApp.classList.add("is-ready");
  }
});