"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const manualToggle = document.getElementById("manualToggle");
  const manualClose = document.getElementById("manualClose");
  const adminManual = document.getElementById("adminManual");
  const manualBackdrop = document.getElementById("manualBackdrop");
  const manualScroll = document.getElementById("adminManualScroll");
  const adminStatus = document.getElementById("adminPageStatus");

  function openManual() {
    if (!adminManual) return;

    adminManual.classList.add("is-open");

    if (manualBackdrop) {
      manualBackdrop.classList.add("is-open");
    }

    adminManual.setAttribute("aria-hidden", "false");

    if (manualToggle) {
      manualToggle.setAttribute("aria-expanded", "true");
    }

    document.body.classList.add("manual-open");

    if (manualScroll) {
      requestAnimationFrame(() => {
        manualScroll.scrollTop = 0;
      });
    }
  }

  function closeManual() {
    if (!adminManual) return;

    adminManual.classList.remove("is-open");

    if (manualBackdrop) {
      manualBackdrop.classList.remove("is-open");
    }

    adminManual.setAttribute("aria-hidden", "true");

    if (manualToggle) {
      manualToggle.setAttribute("aria-expanded", "false");
    }

    document.body.classList.remove("manual-open");

    if (manualToggle) {
      manualToggle.focus();
    }
  }

  function toggleManual() {
    const isOpen = adminManual &&
      adminManual.classList.contains("is-open");

    if (isOpen) {
      closeManual();
    } else {
      openManual();
    }
  }

  if (manualToggle) {
    manualToggle.addEventListener("click", toggleManual);
  }

  if (manualClose) {
    manualClose.addEventListener("click", closeManual);
  }

  if (manualBackdrop) {
    manualBackdrop.addEventListener("click", closeManual);
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      if (
        adminManual &&
        adminManual.classList.contains("is-open")
      ) {
        closeManual();
      }
    }
  });


  /* =========================================================
     ADMIN MANUAL BUTTONS
  ========================================================= */

  const actionButtons = document.querySelectorAll(
    "[data-admin-action]"
  );

  actionButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const action = button.getAttribute("data-admin-action");

      if (!action) return;

      handleAdminAction(action);
    });
  });


  function handleAdminAction(action) {
    switch (action) {
      case "user-information":
        navigateTo("user-information");
        break;

      case "active-users":
        navigateTo("active-users");
        break;

      case "pending-transactions":
        navigateTo("pending-transactions");
        break;

      case "failed-transactions":
        navigateTo("failed-transactions");
        break;

      case "transactions":
        navigateTo("transactions");
        break;

      case "profit":
        navigateTo("profit");
        break;

      case "verification-records":
        navigateTo("verification-records");
        break;

      case "approve-user-kyc":
        navigateTo("approve-user-kyc");
        break;

      case "live-chat":
        navigateTo("live-chat");
        break;

      case "customer-support":
        navigateTo("customer-support");
        break;

      case "suspended-accounts":
        navigateTo("suspended-accounts");
        break;

      case "suspend-user":
        navigateTo("suspend-user");
        break;

      case "banned-accounts":
        navigateTo("banned-accounts");
        break;

      case "reward-user":
        navigateTo("reward-user");
        break;

      case "system-color":
        navigateTo("system-color");
        break;

      case "notifications":
        navigateTo("notifications");
        break;

      case "settings":
        navigateTo("settings");
        break;

      case "legal-content":
        navigateTo("legal-content");
        break;

      case "content":
        navigateTo("content");
        break;

      case "system-information":
        navigateTo("system-information");
        break;

      case "fraud-risk":
        navigateTo("fraud-risk");
        break;

      case "audit":
        navigateTo("audit");
        break;

      default:
        setStatus("Admin action is not available.");
        break;
    }
  }


  /* =========================================================
     ACTION ROUTING
  ========================================================= */

  function navigateTo(action) {
    const routes = {
      "user-information": "user-information.html",
      "active-users": "active-users.html",
      "pending-transactions": "pending-transactions.html",
      "failed-transactions": "failed-transactions.html",
      "transactions": "transactions.html",
      "profit": "profit.html",
      "verification-records": "verification-records.html",
      "approve-user-kyc": "approve-user-kyc.html",
      "live-chat": "live-chat.html",
      "customer-support": "customer-support.html",
      "suspended-accounts": "suspended-accounts.html",
      "suspend-user": "suspend-user.html",
      "banned-accounts": "banned-accounts.html",
      "reward-user": "reward-user.html",
      "system-color": "system-color.html",
      "notifications": "notifications.html",
      "settings": "settings.html",
      "legal-content": "legal-content.html",
      "content": "content.html",
      "system-information": "system-information.html",
      "fraud-risk": "fraud-risk.html",
      "audit": "audit.html"
    };

    const target = routes[action];

    if (!target) {
      setStatus("This admin tool is not available.");
      return;
    }

    window.location.href = target;
  }


  /* =========================================================
     DASHBOARD HELPERS
  ========================================================= */

  function setText(id, value) {
    const element = document.getElementById(id);

    if (element) {
      element.textContent = value;
    }
  }

  function setStatus(message) {
    if (adminStatus) {
      adminStatus.textContent = message;
    }
  }


  /* =========================================================
     DASHBOARD INITIALIZATION
  ========================================================= */

  function initializeDashboard() {
    setText("totalUsers", "0");
    setText("todayActiveUsers", "0");
    setText("totalProfit", "₦0");

    if (adminStatus) {
      adminStatus.textContent = "Admin dashboard ready.";
    }

    initializeChart();
  }


  /* =========================================================
     SIMPLE ANALYSIS CHART
  ========================================================= */

  function initializeChart() {
    const chart = document.getElementById("analysisChart");

    if (!chart) return;

    if (chart.children.length > 0) {
      return;
    }

    const wrapper = document.createElement("div");

    wrapper.style.width = "100%";
    wrapper.style.minHeight = "260px";
    wrapper.style.display = "flex";
    wrapper.style.alignItems = "center";
    wrapper.style.justifyContent = "center";
    wrapper.style.padding = "20px";
    wrapper.style.color = "#61718a";
    wrapper.style.fontSize = "13px";

    wrapper.textContent = "Analysis data will appear here.";

    chart.appendChild(wrapper);
  }


  /* =========================================================
     CLOSE MANUAL WHEN WINDOW NAVIGATES
  ========================================================= */

  window.addEventListener("pageshow", () => {
    if (!adminManual) return;

    adminManual.classList.remove("is-open");

    if (manualBackdrop) {
      manualBackdrop.classList.remove("is-open");
    }

    adminManual.setAttribute("aria-hidden", "true");

    if (manualToggle) {
      manualToggle.setAttribute("aria-expanded", "false");
    }

    document.body.classList.remove("manual-open");
  });


  initializeDashboard();
});