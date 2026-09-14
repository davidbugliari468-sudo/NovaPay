// admin-button.js

document.addEventListener("DOMContentLoaded", () => {
  const buttons = document.querySelectorAll("[data-admin-action]");

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

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const action = button.dataset.adminAction;
      const destination = routes[action];

      if (!destination) {
        return;
      }

      window.location.href = destination;
    });
  });
});