"use strict";

/* =========================================================
   NOVAPAY ADMIN DASHBOARD
   Dashboard / Admin Tools Controller
   ========================================================= */


/* =========================================================
   DOM ELEMENTS
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {

  const manualToggle =
    document.getElementById("manualToggle");

  const manualClose =
    document.getElementById("manualClose");

  const adminManual =
    document.getElementById("adminManual");

  const manualBackdrop =
    document.getElementById("manualBackdrop");

  const adminManualScroll =
    document.getElementById("adminManualScroll");

  const adminPageStatus =
    document.getElementById("adminPageStatus");

  const totalUsers =
    document.getElementById("totalUsers");

  const activeUsers =
    document.getElementById("activeUsers");

  const totalSales =
    document.getElementById("totalSales");

  const totalEarnings =
    document.getElementById("totalEarnings");

  const analysisStatus =
    document.getElementById("analysisStatus");

  const transactionsStatus =
    document.getElementById("transactionsStatus");

  const recentTransactionsBody =
    document.getElementById("recentTransactionsBody");


  /* =======================================================
     REQUIRED ELEMENT CHECK
     ======================================================= */

  if (
    !manualToggle ||
    !manualClose ||
    !adminManual ||
    !manualBackdrop ||
    !adminManualScroll ||
    !adminPageStatus
  ) {
    console.error(
      "NovaPay Admin Dashboard: One or more required elements were not found."
    );

    return;
  }


  /* =======================================================
     PANEL STATE
     ======================================================= */

  let manualIsOpen = false;


  /* =======================================================
     SHOW STATUS MESSAGE
     ======================================================= */

  function showPageStatus(message) {

    if (!adminPageStatus) {
      return;
    }

    adminPageStatus.textContent = message;

    adminPageStatus.classList.add("show");

    window.clearTimeout(
      showPageStatus.timeoutId
    );

    showPageStatus.timeoutId =
      window.setTimeout(function () {

        adminPageStatus.classList.remove("show");

      }, 2600);
  }


  /* =======================================================
     OPEN ADMIN TOOLS
     ======================================================= */

  function openAdminTools() {

    if (manualIsOpen) {
      return;
    }

    manualIsOpen = true;

    adminManual.classList.add("is-open");

    manualBackdrop.classList.add("is-visible");

    manualToggle.setAttribute(
      "aria-expanded",
      "true"
    );

    adminManual.setAttribute(
      "aria-hidden",
      "false"
    );

    manualBackdrop.setAttribute(
      "aria-hidden",
      "false"
    );

    document.body.classList.add(
      "admin-tools-open"
    );

    /*
     * Start the admin tools at the top
     * whenever the panel is opened.
     */

    adminManualScroll.scrollTop = 0;

    /*
     * Move keyboard focus into the panel.
     */

    window.setTimeout(function () {

      manualClose.focus();

    }, 50);
  }


  /* =======================================================
     CLOSE ADMIN TOOLS
     ======================================================= */

  function closeAdminTools(
    returnFocus = true
  ) {

    if (!manualIsOpen) {
      return;
    }

    manualIsOpen = false;

    adminManual.classList.remove(
      "is-open"
    );

    manualBackdrop.classList.remove(
      "is-visible"
    );

    manualToggle.setAttribute(
      "aria-expanded",
      "false"
    );

    adminManual.setAttribute(
      "aria-hidden",
      "true"
    );

    manualBackdrop.setAttribute(
      "aria-hidden",
      "true"
    );

    document.body.classList.remove(
      "admin-tools-open"
    );

    if (
      returnFocus &&
      document.visibilityState !== "hidden"
    ) {

      window.setTimeout(function () {

        manualToggle.focus();

      }, 50);

    }
  }


  /* =======================================================
     TOGGLE ADMIN TOOLS
     ======================================================= */

  function toggleAdminTools() {

    if (manualIsOpen) {

      closeAdminTools();

    } else {

      openAdminTools();

    }
  }


  /* =======================================================
     OPEN BUTTON
     ======================================================= */

  manualToggle.addEventListener(
    "click",
    function () {

      toggleAdminTools();

    }
  );


  /* =======================================================
     CLOSE BUTTON
     ======================================================= */

  manualClose.addEventListener(
    "click",
    function () {

      closeAdminTools();

    }
  );


  /* =======================================================
     BACKDROP CLOSE
     ======================================================= */

  manualBackdrop.addEventListener(
    "click",
    function () {

      closeAdminTools();

    }
  );


  /* =======================================================
     ESCAPE KEY
     ======================================================= */

  document.addEventListener(
    "keydown",
    function (event) {

      if (
        event.key === "Escape" &&
        manualIsOpen
      ) {

        closeAdminTools();

      }

    }
  );


  /* =======================================================
     PREVENT PANEL CLICK FROM CLOSING IT
     ======================================================= */

  adminManual.addEventListener(
    "click",
    function (event) {

      event.stopPropagation();

    }
  );


  /* =======================================================
     ADMIN TOOL ROUTES
     ======================================================= */

  const adminRoutes = {

    "user-information":
      "./user-information.html",

    "active-users":
      "./active-users.html",

    "pending-transactions":
      "./pending-transactions.html",

    "failed-transactions":
      "./failed-transactions.html",

    "transactions":
      "./transactions.html",

    "profit":
      "./profit.html",

    "verification-records":
      "./verification-records.html",

    "approve-user-kyc":
      "./approve-user-kyc.html",

    "live-chat":
      "./live-chat.html",

    "customer-support":
      "./customer-support.html",

    "suspended-accounts":
      "./suspended-accounts.html",

    "suspend-user":
      "./suspend-user.html",

    "banned-accounts":
      "./banned-accounts.html",

    "reward-user":
      "./reward-user.html",

    "system-color":
      "./system-color.html",

    "notifications":
      "./notifications.html",

    "settings":
      "./settings.html",

    "legal-content":
      "./legal-content.html",

    "content":
      "./content.html",

    "system-information":
      "./system-information.html",

    "fraud-risk":
      "./fraud-risk.html",

    "audit":
      "./audit.html"

  };


  /* =======================================================
     HANDLE ADMIN TOOL
     ======================================================= */

  function handleAdminAction(action) {

    if (
      typeof action !== "string" ||
      !action
    ) {

      showPageStatus(
        "Admin action unavailable."
      );

      return;

    }


    const target =
      adminRoutes[action];


    if (!target) {

      console.error(
        "NovaPay Admin Dashboard: No route found for action:",
        action
      );

      showPageStatus(
        "This admin tool is not available yet."
      );

      return;

    }


    /*
     * Close the sliding panel before
     * moving to the selected admin page.
     */

    closeAdminTools(false);


    /*
     * Navigate to the selected admin page.
     */

    window.location.href = target;

  }


  /* =======================================================
     ADMIN TOOL BUTTONS
     ======================================================= */

  const adminActionButtons =
    document.querySelectorAll(
      "[data-admin-action]"
    );


  adminActionButtons.forEach(
    function (button) {

      button.addEventListener(
        "click",
        function () {

          const action =
            button.getAttribute(
              "data-admin-action"
            );

          handleAdminAction(action);

        }
      );

    }
  );


  /* =======================================================
     KEYBOARD ACCESS FOR ADMIN TOOLS
     ======================================================= */

  adminActionButtons.forEach(
    function (button) {

      button.addEventListener(
        "keydown",
        function (event) {

          if (
            event.key === "Enter" ||
            event.key === " "
          ) {

            event.preventDefault();

            button.click();

          }

        }
      );

    }
  );


  /* =======================================================
     DASHBOARD PLACEHOLDER VALUES
     ======================================================= */

  function initializeDashboardValues() {

    /*
     * The admin backend is not connected yet.
     *
     * Do not display fake numbers.
     */

    if (totalUsers) {
      totalUsers.textContent = "—";
    }

    if (activeUsers) {
      activeUsers.textContent = "—";
    }

    if (totalSales) {
      totalSales.textContent = "—";
    }

    if (totalEarnings) {
      totalEarnings.textContent = "—";
    }


    if (analysisStatus) {

      analysisStatus.textContent =
        "Awaiting data";

    }


    if (transactionsStatus) {

      transactionsStatus.textContent =
        "Awaiting data";

    }

  }


  /* =======================================================
     INITIALIZE EMPTY TRANSACTION STATE
     ======================================================= */

  function initializeTransactions() {

    if (!recentTransactionsBody) {
      return;
    }


    /*
     * Keep the table empty until the real
     * admin backend supplies transaction data.
     */

    recentTransactionsBody.innerHTML = `
      <tr>
        <td colspan="5">
          <div class="dashboard-table-empty">
            Recent transactions will appear here.
          </div>
        </td>
      </tr>
    `;

  }


  /* =======================================================
     DASHBOARD INITIALIZATION
     ======================================================= */

  function initializeDashboard() {

    initializeDashboardValues();

    initializeTransactions();

  }


  /* =======================================================
     CLOSE PANEL WHEN PAGE IS HIDDEN
     ======================================================= */

  window.addEventListener(
    "pagehide",
    function () {

      closeAdminTools(false);

    }
  );


  /* =======================================================
     BROWSER BACK / FORWARD
     ======================================================= */

  window.addEventListener(
    "pageshow",
    function () {

      closeAdminTools(false);

    }
  );


  /* =======================================================
     PREVENT ACCIDENTAL SCROLL LOCK
     ======================================================= */

  window.addEventListener(
    "resize",
    function () {

      if (
        !manualIsOpen &&
        document.body.classList.contains(
          "admin-tools-open"
        )
      ) {

        document.body.classList.remove(
          "admin-tools-open"
        );

      }

    }
  );


  /* =======================================================
     START DASHBOARD
     ======================================================= */

  initializeDashboard();

});