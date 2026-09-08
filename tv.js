/* ==========================================
   NOVAPAY TV SUBSCRIPTION
   MODULE 1
   REAL BACKEND VERIFICATION
========================================== */

import { auth } from "./firebase.js";

/* ==========================================
   CONFIGURATION
========================================== */

const API_BASE_URL =
    "https://novapay-server.onrender.com";

/* ==========================================
   DOM ELEMENTS
========================================== */

const backBtn =
    document.getElementById("backBtn");

const providers =
    document.querySelectorAll(".provider");

const verifyCardBtn =
    document.getElementById("verifyCardBtn");

const customerCard =
    document.getElementById("customerCard");

const packageSection =
    document.getElementById("packageSection");

const continueBtn =
    document.getElementById("continueBtn");

const customerName =
    document.getElementById("customerName");

const currentPackage =
    document.getElementById("currentPackage");

const customerStatus =
    document.getElementById("customerStatus");

const smartcardNumber =
    document.getElementById("smartcardNumber");

const packageSelect =
    document.getElementById("packageSelect");

const walletBalance =
    document.getElementById("walletBalance");

/* ==========================================
   STATE
========================================== */

let selectedProvider = "gotv";

let verifiedCustomer = null;

/* ==========================================
   BACK BUTTON
========================================== */

backBtn?.addEventListener("click", () => {

    window.location.href =
        "dashboard.html";

});

/* ==========================================
   RESET VERIFICATION
========================================== */

function resetVerification() {

    verifiedCustomer = null;

    customerCard?.classList.add("hidden");

    packageSection?.classList.add("hidden");

    continueBtn?.classList.add("hidden");

    if (customerName) {
        customerName.textContent = "";
    }

    if (currentPackage) {
        currentPackage.textContent = "";
    }

    if (customerStatus) {
        customerStatus.textContent = "";
    }

    if (walletBalance) {
        walletBalance.textContent = "—";
    }

    if (verifyCardBtn) {
        verifyCardBtn.textContent =
            "Verify Customer";
    }

}

/* ==========================================
   TV PROVIDER
========================================== */

providers.forEach(provider => {

    provider.addEventListener("click", () => {

        providers.forEach(item => {

            item.classList.remove("active");

        });

        provider.classList.add("active");

        selectedProvider =
            String(
                provider.dataset.provider || ""
            )
                .trim()
                .toLowerCase();

        resetVerification();

    });

});

console.log("✅ TV Module 1 Loaded");

/* ==========================================
   AUTHENTICATION
========================================== */

async function getAuthToken() {

    const user = auth.currentUser;

    if (!user) {

        throw new Error(
            "Please sign in before using TV subscription."
        );

    }

    return await user.getIdToken();

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
                ...options,

                headers: {
                    "Content-Type":
                        "application/json",

                    "Authorization":
                        `Bearer ${token}`,

                    ...(options.headers || {})
                }
            }
        );

    let result = null;

    try {

        result =
            await response.json();

    } catch {

        throw new Error(
            "The server returned an invalid response."
        );

    }

    if (!response.ok) {

        throw new Error(
            result?.error ||
            result?.message ||
            "The request could not be completed."
        );

    }

    return result;

}

/* ==========================================
   MODULE 2
   VERIFY SMARTCARD / IUC
========================================== */

verifyCardBtn?.addEventListener(
    "click",
    async () => {

        const card =
            smartcardNumber?.value.trim();

        if (!card) {

            alert(
                "Please enter your smartcard number."
            );

            return;

        }

        if (!selectedProvider) {

            alert(
                "Please select a TV provider."
            );

            return;

        }

        verifyCardBtn.disabled = true;

        verifyCardBtn.textContent =
            "Verifying...";

        resetVerification();

        /*
         * resetVerification() restores the button text.
         * Set the loading text again after the reset.
         */

        verifyCardBtn.disabled = true;

        verifyCardBtn.textContent =
            "Verifying...";

        try {

            const result =
                await backendRequest(
                    "/api/tv/verify",
                    {
                        method: "POST",

                        body: JSON.stringify({
                            provider:
                                selectedProvider,

                            smartcardNumber:
                                card
                        })
                    }
                );

            if (result?.success !== true) {

                throw new Error(
                    result?.error ||
                    "Unable to verify TV customer."
                );

            }

            const data =
                result?.data &&
                typeof result.data === "object"
                    ? result.data
                    : {};

            /*
             * The backend returns the normalized TV
             * verification result. Keep the exact backend
             * identity attached to the verified state.
             */

            const verifiedProvider =
                String(
                    data.serviceId ||
                    selectedProvider
                )
                    .trim()
                    .toLowerCase();

            const verifiedCustomerId =
                String(
                    data.customerId ||
                    data.requestedCustomerId ||
                    card
                )
                    .trim();

            if (
                verifiedProvider !==
                selectedProvider
            ) {

                throw new Error(
                    "The verified TV provider does not match the selected provider."
                );

            }

            if (
                verifiedCustomerId !== card
            ) {

                throw new Error(
                    "The verified customer number does not match the number entered."
                );

            }

            verifiedCustomer = {

                ...data,

                provider:
                    selectedProvider,

                smartcardNumber:
                    card

            };

            /* ==========================================
               CUSTOMER NAME
            ========================================== */

            const name =
                data.customerName ||
                data.customer_name ||
                data.name ||
                "Customer";

            if (customerName) {

                customerName.textContent =
                    name;

            }

            /* ==========================================
               CURRENT PACKAGE
            ========================================== */

            /*
             * VTU customer verification does not guarantee
             * that a current package is returned.
             *
             * Only display one if the provider actually
             * supplied it.
             */

            const activePackage =
                data.currentPackage ||
                data.current_package ||
                data.package ||
                "";

            if (currentPackage) {

                currentPackage.textContent =
                    activePackage ||
                    "Not available";

            }

            /* ==========================================
               CUSTOMER STATUS
            ========================================== */

            const status =
                data.status ||
                data.customerStatus ||
                data.customer_status ||
                "Verified";

            if (customerStatus) {

                customerStatus.textContent =
                    status;

            }

            /* ==========================================
               WALLET BALANCE
            ========================================== */

            /*
             * Important:
             * data.balance from TV verification is provider
             * data, NOT the NovaPay wallet balance.
             *
             * Therefore we do not pretend it is the user's
             * NovaPay wallet balance.
             */

            if (walletBalance) {

                walletBalance.textContent =
                    "—";

            }

            /* ==========================================
               SHOW VERIFIED CUSTOMER
            ========================================== */

            customerCard?.classList.remove(
                "hidden"
            );

            packageSection?.classList.remove(
                "hidden"
            );

            continueBtn?.classList.remove(
                "hidden"
            );

            verifyCardBtn.textContent =
                "Verified ✓";

            alert(
                "TV customer verified successfully."
            );

        } catch (error) {

            console.error(
                "TV verification error:",
                error
            );

            resetVerification();

            alert(
                error?.message ||
                "Unable to verify TV customer."
            );

        } finally {

            verifyCardBtn.disabled = false;

        }

    }
);

console.log("✅ TV Module 2 Loaded");

/* ==========================================
   MODULE 3
   CONTINUE PAYMENT
========================================== */

continueBtn?.addEventListener(
    "click",
    () => {

        const smartcard =
            smartcardNumber?.value.trim();

        const selectedPackage =
            packageSelect?.value;

        if (!smartcard) {

            alert(
                "Please enter your smartcard number."
            );

            return;

        }

        if (!verifiedCustomer) {

            alert(
                "Please verify the TV customer first."
            );

            return;

        }

        if (
            verifiedCustomer.provider !==
            selectedProvider
        ) {

            alert(
                "The selected TV provider has changed. Please verify the customer again."
            );

            resetVerification();

            return;

        }

        if (
            verifiedCustomer.smartcardNumber !==
            smartcard
        ) {

            alert(
                "The smartcard number has changed. Please verify the customer again."
            );

            resetVerification();

            return;

        }

        if (!selectedPackage) {

            alert(
                "Please select a TV package."
            );

            return;

        }

        const payment = {

            provider:
                selectedProvider,

            smartcardNumber:
                smartcard,

            package:
                selectedPackage,

            customerName:
                customerName?.textContent || "",

            currentPackage:
                currentPackage?.textContent || "",

            status:
                customerStatus?.textContent || ""

        };

        console.log(
            "TV Subscription:",
            payment
        );

        alert(
            "TV customer verified. Purchase API will be connected next."
        );

    }
);

console.log("✅ TV Module 3 Loaded");