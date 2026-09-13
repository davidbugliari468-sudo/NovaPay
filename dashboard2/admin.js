document.addEventListener("DOMContentLoaded", () => {
    "use strict";

    // ------------------------------------------------------------
    // Dashboard elements
    // ------------------------------------------------------------

    const manualToggle = document.getElementById("manualToggle");
    const manualClose = document.getElementById("manualClose");
    const manualBackdrop = document.getElementById("manualBackdrop");
    const adminManual = document.getElementById("adminManual");
    const adminManualScroll = document.getElementById("adminManualScroll");
    const adminManualContent = document.getElementById("adminManualContent");
    const adminPageStatus = document.getElementById("adminPageStatus");

    const totalUsers = document.getElementById("totalUsers");
    const todayActiveUsers = document.getElementById("todayActiveUsers");
    const totalProfit = document.getElementById("totalProfit");
    const analysisChart = document.getElementById("analysisChart");
    const recentTransactionsBody = document.getElementById("recentTransactionsBody");

    // ------------------------------------------------------------
    // State
    // ------------------------------------------------------------

    let manualButtonsLoaded = false;
    let manualButtonsLoading = false;

    // ------------------------------------------------------------
    // Utility: status message
    // ------------------------------------------------------------

    function setAdminStatus(message = "", type = "") {
        if (!adminPageStatus) {
            return;
        }

        adminPageStatus.textContent = message;
        adminPageStatus.className = "admin-page-status";

        if (type) {
            adminPageStatus.classList.add(`is-${type}`);
        }

        if (message) {
            adminPageStatus.hidden = false;
        } else {
            adminPageStatus.hidden = true;
        }
    }

    // ------------------------------------------------------------
    // Manual panel
    // ------------------------------------------------------------

    function openManual() {
        if (!adminManual || !manualBackdrop) {
            return;
        }

        adminManual.classList.add("is-open");
        manualBackdrop.classList.add("is-visible");

        document.body.classList.add("admin-manual-open");

        if (manualToggle) {
            manualToggle.setAttribute("aria-expanded", "true");
        }

        if (manualClose) {
            window.setTimeout(() => {
                manualClose.focus();
            }, 50);
        }

        loadManualButtons();
    }

    function closeManual() {
        if (!adminManual || !manualBackdrop) {
            return;
        }

        adminManual.classList.remove("is-open");
        manualBackdrop.classList.remove("is-visible");

        document.body.classList.remove("admin-manual-open");

        if (manualToggle) {
            manualToggle.setAttribute("aria-expanded", "false");
            manualToggle.focus();
        }
    }

    function toggleManual() {
        if (!adminManual) {
            return;
        }

        if (adminManual.classList.contains("is-open")) {
            closeManual();
        } else {
            openManual();
        }
    }

    // ------------------------------------------------------------
    // Load admin-buttons.css
    // ------------------------------------------------------------

    function loadAdminButtonsStylesheet() {
        const existingStylesheet = document.querySelector(
            'link[data-admin-buttons-stylesheet="true"]'
        );

        if (existingStylesheet) {
            return Promise.resolve();
        }

        return new Promise((resolve, reject) => {
            const stylesheet = document.createElement("link");

            stylesheet.rel = "stylesheet";
            stylesheet.href = "./admin-buttons.css";
            stylesheet.dataset.adminButtonsStylesheet = "true";

            stylesheet.addEventListener("load", () => {
                resolve();
            });

            stylesheet.addEventListener("error", () => {
                stylesheet.remove();
                reject(
                    new Error(
                        "The admin-buttons.css stylesheet could not be loaded."
                    )
                );
            });

            document.head.appendChild(stylesheet);
        });
    }

    // ------------------------------------------------------------
    // Load admin-buttons.html
    // ------------------------------------------------------------

    async function loadManualButtons() {
        if (!adminManualContent) {
            return;
        }

        if (manualButtonsLoaded || manualButtonsLoading) {
            return;
        }

        manualButtonsLoading = true;

        adminManualContent.innerHTML = `
            <div class="admin-buttons-loading" role="status" aria-live="polite">
                <div class="admin-buttons-loading-spinner" aria-hidden="true"></div>
                <p>Loading admin tools...</p>
            </div>
        `;

        try {
            await loadAdminButtonsStylesheet();

            const response = await fetch("./admin-buttons.html", {
                method: "GET",
                cache: "no-cache",
                headers: {
                    Accept: "text/html"
                }
            });

            if (!response.ok) {
                throw new Error(
                    `Unable to load admin-buttons.html (${response.status}).`
                );
            }

            const html = await response.text();

            if (!html.trim()) {
                throw new Error("admin-buttons.html is empty.");
            }

            const parser = new DOMParser();
            const buttonsDocument = parser.parseFromString(
                html,
                "text/html"
            );

            const buttonList = buttonsDocument.querySelector(
                ".admin-buttons-list"
            );

            if (!buttonList) {
                throw new Error(
                    "The .admin-buttons-list container was not found in admin-buttons.html."
                );
            }

            const buttonListCopy = buttonList.cloneNode(true);

            adminManualContent.replaceChildren(buttonListCopy);

            manualButtonsLoaded = true;

            setAdminStatus("");
        } catch (error) {
            console.error("NovaPay admin manual loading error:", error);

            adminManualContent.innerHTML = `
                <div class="admin-buttons-error" role="alert">
                    <h3>Admin tools could not be loaded</h3>
                    <p>
                        The manual system could not load
                        <strong>admin-buttons.html</strong>.
                    </p>
                    <button
                        type="button"
                        class="admin-buttons-retry"
                        id="adminButtonsRetry"
                    >
                        Retry
                    </button>
                </div>
            `;

            const retryButton = document.getElementById(
                "adminButtonsRetry"
            );

            if (retryButton) {
                retryButton.addEventListener("click", () => {
                    manualButtonsLoaded = false;
                    loadManualButtons();
                });
            }

            setAdminStatus(
                "Admin management tools could not be loaded.",
                "error"
            );
        } finally {
            manualButtonsLoading = false;
        }
    }

    // ------------------------------------------------------------
    // Dashboard initial state
    // ------------------------------------------------------------

    function initializeDashboard() {
        if (totalUsers) {
            totalUsers.textContent = "—";
        }

        if (todayActiveUsers) {
            todayActiveUsers.textContent = "—";
        }

        if (totalProfit) {
            totalProfit.textContent = "—";
        }

        if (analysisChart) {
            analysisChart.innerHTML = `
                <div class="admin-chart-empty">
                    <span class="admin-chart-empty-title">
                        Analysis data will appear here
                    </span>
                    <span class="admin-chart-empty-text">
                        Dashboard analytics will be connected to the backend.
                    </span>
                </div>
            `;
        }

        if (recentTransactionsBody) {
            recentTransactionsBody.innerHTML = `
                <tr>
                    <td colspan="100%">
                        No transaction data available yet.
                    </td>
                </tr>
            `;
        }

        setAdminStatus("");
    }

    // ------------------------------------------------------------
    // Event listeners
    // ------------------------------------------------------------

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

    // ------------------------------------------------------------
    // Prevent background scrolling while Manual is open
    // ------------------------------------------------------------

    if (adminManualScroll) {
        adminManualScroll.addEventListener("wheel", (event) => {
            event.stopPropagation();
        });
    }

    // ------------------------------------------------------------
    // Public dashboard API
    // ------------------------------------------------------------

    window.NovaPayAdmin = {
        openManual,
        closeManual,
        toggleManual,
        loadManualButtons,
        setAdminStatus,

        setDashboardSummary(data = {}) {
            if (totalUsers && data.totalUsers !== undefined) {
                totalUsers.textContent = String(data.totalUsers);
            }

            if (
                todayActiveUsers &&
                data.todayActiveUsers !== undefined
            ) {
                todayActiveUsers.textContent = String(
                    data.todayActiveUsers
                );
            }

            if (totalProfit && data.totalProfit !== undefined) {
                totalProfit.textContent = String(data.totalProfit);
            }
        },

        setAnalysisChart(content = "") {
            if (!analysisChart) {
                return;
            }

            if (typeof content === "string") {
                analysisChart.innerHTML = content;
                return;
            }

            if (content instanceof Node) {
                analysisChart.replaceChildren(content);
            }
        },

        setRecentTransactions(content = "") {
            if (!recentTransactionsBody) {
                return;
            }

            if (typeof content === "string") {
                recentTransactionsBody.innerHTML = content;
                return;
            }

            if (content instanceof Node) {
                recentTransactionsBody.replaceChildren(content);
            }
        }
    };

    // ------------------------------------------------------------
    // Start dashboard
    // ------------------------------------------------------------

    initializeDashboard();
});