/* ==========================================
   NOVAPAY BETTING
   MODULE 1 + 2 + 3
   BACKEND CONNECTED
========================================== */

import { auth, db } from "./firebase.js";

/* ==========================================
   BACKEND CONFIG
========================================== */

const API_BASE_URL =
    "https://novapay-server.onrender.com";

/* ==========================================
   ELEMENTS
========================================== */

const backBtn =
    document.getElementById("backBtn");

const providers =
    document.querySelectorAll(".provider");

const verifyAccountBtn =
    document.getElementById("verifyAccountBtn");

const accountCard =
    document.getElementById("accountCard");

const amountSection =
    document.getElementById("amountSection");

const continueBtn =
    document.getElementById("continueBtn");

const accountName =
    document.getElementById("accountName");

const accountProvider =
    document.getElementById("accountProvider");

const accountStatus =
    document.getElementById("accountStatus");

const customerId =
    document.getElementById("customerId");

const amount =
    document.getElementById("amount");

const walletBalance =
    document.getElementById("walletBalance");

/* ==========================================
   STATE
========================================== */

let selectedProvider = "bet9ja";

let verifiedAccount = null;

/* ==========================================
   SAFE ELEMENT HELPERS
========================================== */

function showElement(element) {

    if (!element) {
        return;
    }

    element.classList.remove("hidden");
}

function hideElement(element) {

    if (!element) {
        return;
    }

    element.classList.add("hidden");
}

/* ==========================================
   AUTHENTICATION
========================================== */

async function getAuthToken() {

    const user = auth.currentUser;

    if (!user) {
        throw new Error(
            "Please sign in to your NovaPay account."
        );
    }

    return user.getIdToken();
}

/* ==========================================
   BACKEND REQUEST
========================================== */

async function backendRequest(
    endpoint,
    options = {}
) {

    const token =
        await getAuthToken();

    const response =
        await fetch(
            `${API_BASE_URL}${endpoint}`,
            {
                method:
                    options.method || "GET",

                headers: {
                    "Content-Type":
                        "application/json",

                    Authorization:
                        `Bearer ${token}`,

                    ...(options.headers || {})
                },

                body:
                    options.body
                        ? JSON.stringify(options.body)
                        : undefined
            }
        );

    let data = null;

    try {

        data =
            await response.json();

    } catch {

        data = null;

    }

    if (!response.ok) {

        const message =
            data?.error ||
            data?.message ||
            "The betting service could not complete the request.";

        const error =
            new Error(message);

        error.status =
            response.status;

        error.data =
            data;

        throw error;
    }

    return data;
}

/* ==========================================
   BACK BUTTON
========================================== */

backBtn?.addEventListener(
    "click",
    () => {

        window.location.href =
            "dashboard.html";

    }
);

/* ==========================================
   BETTING PROVIDER
========================================== */

providers.forEach(provider => {

    provider.addEventListener(
        "click",
        () => {

            providers.forEach(item => {

                item.classList.remove(
                    "active"
                );

            });

            provider.classList.add(
                "active"
            );

            selectedProvider =
                String(
                    provider.dataset.provider || ""
                )
                .trim()
                .toLowerCase();

            /*
             * Changing provider invalidates
             * the previous verification.
             */

            verifiedAccount = null;

            hideElement(accountCard);
            hideElement(amountSection);
            hideElement(continueBtn);

            if (verifyAccountBtn) {

                verifyAccountBtn.disabled =
                    false;

                verifyAccountBtn.textContent =
                    "Verify Account";

            }

            if (accountName) {

                accountName.textContent =
                    "—";

            }

            if (accountProvider) {

                accountProvider.textContent =
                    "—";

            }

            if (accountStatus) {

                accountStatus.textContent =
                    "—";

            }

        }
    );

});

/* ==========================================
   VERIFY BETTING ACCOUNT
========================================== */

verifyAccountBtn?.addEventListener(
    "click",
    async () => {

        const customer =
            customerId?.value.trim();

        if (!customer) {

            alert(
                "Please enter your Customer ID."
            );

            customerId?.focus();

            return;
        }

        if (!selectedProvider) {

            alert(
                "Please select a betting provider."
            );

            return;
        }

        verifyAccountBtn.disabled =
            true;

        verifyAccountBtn.textContent =
            "Verifying...";

        try {

            const result =
                await backendRequest(
                    "/api/betting/verify",
                    {
                        method: "POST",

                        body: {
                            provider:
                                selectedProvider,

                            customerId:
                                customer
                        }
                    }
                );

            /*
             * Backend response is authoritative.
             */

            const account =
                result?.customer ||
                result?.account ||
                result?.data ||
                result;

            verifiedAccount = {
                customerId:
                    account?.customerId ||
                    customer,

                provider:
                    account?.provider ||
                    selectedProvider,

                name:
                    account?.name ||
                    account?.customerName ||
                    account?.accountName ||
                    "",

                status:
                    account?.status ||
                    "Verified"
            };

            if (accountName) {

                accountName.textContent =
                    verifiedAccount.name ||
                    "Verified account";

            }

            if (accountProvider) {

                accountProvider.textContent =
                    String(
                        verifiedAccount.provider
                    ).toUpperCase();

            }

            if (accountStatus) {

                accountStatus.textContent =
                    verifiedAccount.status;

            }

            /*
             * Wallet balance is not fabricated.
             * The betting verification endpoint
             * does not establish a betting wallet
             * balance, so leave the UI neutral.
             */

            if (walletBalance) {

                walletBalance.textContent =
                    "—";

            }

            showElement(accountCard);
            showElement(amountSection);
            showElement(continueBtn);

            verifyAccountBtn.textContent =
                "Verified ✓";

            alert(
                "Betting account verified successfully."
            );

        } catch (error) {

            verifiedAccount = null;

            hideElement(accountCard);
            hideElement(amountSection);
            hideElement(continueBtn);

            if (walletBalance) {

                walletBalance.textContent =
                    "—";

            }

            verifyAccountBtn.textContent =
                "Verify Account";

            alert(
                error?.message ||
                "Unable to verify betting account."
            );

        } finally {

            verifyAccountBtn.disabled =
                false;

        }

    }
);

/* ==========================================
   CONTINUE PAYMENT
========================================== */

continueBtn?.addEventListener(
    "click",
    async () => {

        const customer =
            customerId?.value.trim();

        const amountValue =
            amount?.value.trim();

        if (!customer) {

            alert(
                "Please enter your Customer ID."
            );

            customerId?.focus();

            return;
        }

        if (!verifiedAccount) {

            alert(
                "Please verify the betting account first."
            );

            return;
        }

        if (!amountValue) {

            alert(
                "Please enter an amount."
            );

            amount?.focus();

            return;
        }

        const numericAmount =
            Number(amountValue);

        if (
            !Number.isFinite(numericAmount) ||
            numericAmount <= 0
        ) {

            alert(
                "Please enter a valid amount."
            );

            amount?.focus();

            return;
        }

        /*
         * Backend expects amountKobo.
         *
         * Example:
         * ₦1,000 = 100000 kobo
         */

        const amountKobo =
            Math.round(
                numericAmount * 100
            );

        continueBtn.disabled =
            true;

        const originalText =
            continueBtn.textContent;

        continueBtn.textContent =
            "Processing...";

        try {

            const result =
                await backendRequest(
                    "/api/betting/fund",
                    {
                        method: "POST",

                        body: {
                            provider:
                                selectedProvider,

                            customerId:
                                customer,

                            amountKobo
                        }
                    }
                );

            /*
             * Do not fabricate success.
             * The backend/provider response determines
             * the actual transaction state.
             */

            const transaction =
                result?.transaction ||
                result?.data ||
                result;

            const status =
                String(
                    transaction?.status ||
                    result?.status ||
                    ""
                ).toLowerCase();

            const transactionId =
                transaction?.id ||
                transaction?.transactionId ||
                "";

            if (
                status === "successful" ||
                status === "success"
            ) {

                alert(
                    transactionId
                        ? `Betting account funded successfully.\nTransaction: ${transactionId}`
                        : "Betting account funded successfully."
                );

            } else if (
                status === "pending"
            ) {

                alert(
                    transactionId
                        ? `Your betting funding is pending confirmation.\nTransaction: ${transactionId}`
                        : "Your betting funding is pending confirmation."
                );

            } else if (
                status === "failed"
            ) {

                alert(
                    transaction?.failureReason ||
                    transaction?.message ||
                    "Betting funding failed."
                );

            } else {

                alert(
                    transactionId
                        ? `Betting funding request received.\nTransaction: ${transactionId}`
                        : "Betting funding request received."
                );

            }

        } catch (error) {

            console.error(
                "Betting funding error:",
                error
            );

            alert(
                error?.message ||
                "Unable to process the betting payment."
            );

        } finally {

            continueBtn.disabled =
                false;

            continueBtn.textContent =
                originalText;
        }

    }
);

console.log(
    "✅ NovaPay Betting frontend connected to backend"
);