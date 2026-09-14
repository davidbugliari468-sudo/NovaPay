document.addEventListener("DOMContentLoaded", () => {
    "use strict";

    // ============================================================
    // ADMIN BUTTON SYSTEM
    // ============================================================

    const adminButtonsPage = document.getElementById("adminButtonsPage");
    const adminButtonsList = document.getElementById("adminButtonsList");

    if (!adminButtonsPage || !adminButtonsList) {
        console.error(
            "NovaPay Admin: Required admin button elements were not found."
        );
        return;
    }

    const adminButtons = Array.from(
        adminButtonsList.querySelectorAll(
            ".admin-action-button[data-admin-action]"
        )
    );

    // ============================================================
    // BUTTON ACTION REGISTRY
    // ============================================================

    const adminActionRegistry = {
        "user-information": {
            name: "User Information",
            status: "ready"
        },

        "active-users": {
            name: "Active Users",
            status: "ready"
        },

        "pending-transactions": {
            name: "Pending Transactions",
            status: "ready"
        },

        "failed-transactions": {
            name: "Failed Transactions",
            status: "ready"
        },

        "transactions": {
            name: "Transactions",
            status: "ready"
        },

        "profit": {
            name: "Profit",
            status: "ready"
        },

        "verification-records": {
            name: "Verification Records",
            status: "ready"
        },

        "approve-user-kyc": {
            name: "Approve User KYC",
            status: "ready"
        },

        "live-chat": {
            name: "Live Chat",
            status: "ready"
        },

        "customer-support": {
            name: "Customer Support",
            status: "ready"
        },

        "suspended-accounts": {
            name: "Suspended Accounts",
            status: "ready"
        },

        "suspend-user": {
            name: "Suspend User",
            status: "ready"
        },

        "banned-accounts": {
            name: "Banned Accounts",
            status: "ready"
        },

        "reward-user": {
            name: "Reward User",
            status: "ready"
        },

        "system-color": {
            name: "System Color",
            status: "ready"
        },

        "notifications": {
            name: "Notifications",
            status: "ready"
        },

        "settings": {
            name: "Settings",
            status: "ready"
        },

        "legal-content": {
            name: "Legal Content",
            status: "ready"
        },

        "content": {
            name: "Content",
            status: "ready"
        },

        "system-information": {
            name: "System Information",
            status: "ready"
        },

        "fraud-risk": {
            name: "Fraud & Risk",
            status: "ready"
        },

        "audit": {
            name: "Audit",
            status: "ready"
        }
    };

    // ============================================================
    // BUTTON VALIDATION
    // ============================================================

    function validateButtons() {
        const registeredActions = new Set(
            Object.keys(adminActionRegistry)
        );

        adminButtons.forEach((button) => {
            const action = button.dataset.adminAction;

            if (!action) {
                console.warn(
                    "NovaPay Admin: An admin button is missing data-admin-action.",
                    button
                );
                return;
            }

            if (!registeredActions.has(action)) {
                console.warn(
                    `NovaPay Admin: No action is registered for "${action}".`
                );
            }
        });
    }

    // ============================================================
    // BUTTON CLICK HANDLER
    // ============================================================

    function handleAdminButtonClick(event) {
        const button = event.currentTarget;
        const action = button.dataset.adminAction;

        if (!action) {
            return;
        }

        const actionDetails = adminActionRegistry[action];

        if (!actionDetails) {
            console.error(
                `NovaPay Admin: Unknown admin action "${action}".`
            );
            return;
        }

        console.info(
            `NovaPay Admin: "${actionDetails.name}" selected.`
        );

        setSelectedButton(button);
    }

    // ============================================================
    // SELECTED BUTTON STATE
    // ============================================================

    function setSelectedButton(selectedButton) {
        adminButtons.forEach((button) => {
            const isSelected = button === selectedButton;

            button.classList.toggle(
                "is-selected",
                isSelected
            );

            if (isSelected) {
                button.setAttribute(
                    "aria-current",
                    "true"
                );
            } else {
                button.removeAttribute(
                    "aria-current"
                );
            }
        });
    }

    // ============================================================
    // KEYBOARD ACCESSIBILITY
    // ============================================================

    function handleKeyboardNavigation(event) {
        const currentButton = event.currentTarget;

        const currentIndex = adminButtons.indexOf(
            currentButton
        );

        if (currentIndex === -1) {
            return;
        }

        let nextIndex = -1;

        if (
            event.key === "ArrowDown" ||
            event.key === "ArrowRight"
        ) {
            nextIndex =
                currentIndex + 1 >= adminButtons.length
                    ? 0
                    : currentIndex + 1;
        }

        if (
            event.key === "ArrowUp" ||
            event.key === "ArrowLeft"
        ) {
            nextIndex =
                currentIndex - 1 < 0
                    ? adminButtons.length - 1
                    : currentIndex - 1;
        }

        if (nextIndex === -1) {
            return;
        }

        event.preventDefault();

        const nextButton = adminButtons[nextIndex];

        nextButton.focus();
    }

    // ============================================================
    // REGISTER BUTTON EVENTS
    // ============================================================

    adminButtons.forEach((button) => {
        button.addEventListener(
            "click",
            handleAdminButtonClick
        );

        button.addEventListener(
            "keydown",
            handleKeyboardNavigation
        );
    });

    // ============================================================
    // PUBLIC ADMIN BUTTON API
    // ============================================================

    window.NovaPayAdminButtons = {
        getButtons() {
            return [...adminButtons];
        },

        getAction(action) {
            return adminActionRegistry[action] || null;
        },

        getActions() {
            return {
                ...adminActionRegistry
            };
        },

        selectButton(action) {
            const button = adminButtons.find(
                (item) =>
                    item.dataset.adminAction === action
            );

            if (!button) {
                return false;
            }

            setSelectedButton(button);

            button.focus();

            return true;
        },

        clearSelection() {
            adminButtons.forEach((button) => {
                button.classList.remove(
                    "is-selected"
                );

                button.removeAttribute(
                    "aria-current"
                );
            });
        }
    };

    // ============================================================
    // INITIALIZE
    // ============================================================

    validateButtons();

    console.info(
        `NovaPay Admin: ${adminButtons.length} admin buttons initialized.`
    );
});