/* ==========================================
   NOVAPAY ELECTRICITY
========================================== */

import { auth } from "./firebase.js";

/* ==========================================
   ELEMENTS
========================================== */

const backBtn =
    document.getElementById("backBtn");

const providers =
    document.querySelectorAll(".provider");

const meterTypes =
    document.querySelectorAll(".meter-type");

const verifyMeterBtn =
    document.getElementById("verifyMeterBtn");

const customerCard =
    document.getElementById("customerCard");

const amountSection =
    document.getElementById("amountSection");

const continueBtn =
    document.getElementById("continueBtn");

const customerName =
    document.getElementById("customerName");

const customerAddress =
    document.getElementById("customerAddress");

const meterNumber =
    document.getElementById("meterNumber");

const amount =
    document.getElementById("amount");

const walletBalance =
    document.getElementById("walletBalance");

/* ==========================================
   STATE
========================================== */

let selectedCompany = "ikedc";
let selectedMeterType = "prepaid";

let verifiedCustomer = null;
let isMeterVerified = false;

/* ==========================================
   API BASE URL
========================================== */

const API_BASE_URL =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
        ? "http://localhost:3000"
        : "";

/* ==========================================
   AUTH TOKEN
========================================== */

async function getAuthToken() {

    const user = auth.currentUser;

    if (!user) {
        throw new Error(
            "You must be logged in to perform this action."
        );
    }

    return await user.getIdToken();
}

/* ==========================================
   BACKEND REQUEST
========================================== */

async function backendRequest(path, options = {}) {

    const token =
        await getAuthToken();

    const response =
        await fetch(
            `${API_BASE_URL}${path}`,
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
            `Server returned an invalid response (${response.status}).`
        );

    }

    if (!response.ok) {

        throw new Error(
            result?.message ||
            result?.error ||
            `Request failed (${response.status}).`
        );

    }

    return result;
}

/* ==========================================
   BACK BUTTON
========================================== */

backBtn.addEventListener(
    "click",
    () => {

        window.location.href =
            "dashboard.html";

    }
);

/* ==========================================
   SELECT COMPANY
========================================== */

providers.forEach(
    provider => {

        provider.addEventListener(
            "click",
            () => {

                providers.forEach(
                    item =>
                        item.classList.remove(
                            "active"
                        )
                );

                provider.classList.add(
                    "active"
                );

                selectedCompany =
                    provider.dataset.company;

                resetVerification();

            }
        );

    }
);

/* ==========================================
   SELECT METER TYPE
========================================== */

meterTypes.forEach(
    type => {

        type.addEventListener(
            "click",
            () => {

                meterTypes.forEach(
                    item =>
                        item.classList.remove(
                            "active"
                        )
                );

                type.classList.add(
                    "active"
                );

                selectedMeterType =
                    type.dataset.type;

                resetVerification();

            }
        );

    }
);

/* ==========================================
   RESET VERIFICATION
========================================== */

function resetVerification() {

    isMeterVerified = false;

    verifiedCustomer = null;

    customerName.textContent = "";

    customerAddress.textContent = "";

    customerCard.classList.add(
        "hidden"
    );

    amountSection.classList.add(
        "hidden"
    );

    continueBtn.classList.add(
        "hidden"
    );

    verifyMeterBtn.disabled = false;

    verifyMeterBtn.textContent =
        "Verify Meter";

}

/* ==========================================
   VERIFY METER
========================================== */

verifyMeterBtn.addEventListener(
    "click",
    async () => {

        const meter =
            meterNumber.value.trim();

        if (!meter) {

            alert(
                "Please enter your meter number."
            );

            return;

        }

        resetVerification();

        verifyMeterBtn.disabled = true;

        verifyMeterBtn.textContent =
            "Verifying...";

        try {

            const result =
                await backendRequest(
                    "/api/electricity/verify",
                    {
                        method: "POST",

                        body: JSON.stringify({

                            serviceId:
                                selectedCompany,

                            meterType:
                                selectedMeterType,

                            customerId:
                                meter,

                            meterNumber:
                                meter

                        })
                    }
                );

            if (
                !result ||
                result.success !== true
            ) {

                throw new Error(
                    result?.message ||
                    "Meter verification failed."
                );

            }

            const customer =
                result.data ||
                result.customer ||
                result.verification;

            if (!customer) {

                throw new Error(
                    "The electricity provider did not return customer information."
                );

            }

            verifiedCustomer =
                customer;

            isMeterVerified = true;

            const name =
                customer.customer_name ||
                customer.customerName ||
                customer.name ||
                "";

            const address =
                customer.address ||
                customer.customer_address ||
                customer.customerAddress ||
                "";

            if (!name) {

                throw new Error(
                    "The provider did not return a customer name."
                );

            }

            customerName.textContent =
                name;

            customerAddress.textContent =
                address || "Address not provided";

            customerCard.classList.remove(
                "hidden"
            );

            amountSection.classList.remove(
                "hidden"
            );

            continueBtn.classList.remove(
                "hidden"
            );

            verifyMeterBtn.textContent =
                "Verified ✓";

        } catch (error) {

            console.error(
                "Electricity meter verification error:",
                error
            );

            isMeterVerified = false;

            verifiedCustomer = null;

            customerCard.classList.add(
                "hidden"
            );

            amountSection.classList.add(
                "hidden"
            );

            continueBtn.classList.add(
                "hidden"
            );

            verifyMeterBtn.textContent =
                "Verify Meter";

            alert(
                error?.message ||
                "Meter verification failed. Please check the meter number and try again."
            );

        } finally {

            verifyMeterBtn.disabled =
                false;

        }

    }
);

/* ==========================================
   CONTINUE / PURCHASE
========================================== */

continueBtn.addEventListener(
    "click",
    async () => {

        const meter =
            meterNumber.value.trim();

        const amountValue =
            amount.value.trim();

        if (!isMeterVerified) {

            alert(
                "Please verify your meter before continuing."
            );

            return;

        }

        if (!meter) {

            alert(
                "Please enter a meter number."
            );

            return;

        }

        if (!amountValue) {

            alert(
                "Please enter an amount."
            );

            return;

        }

        const amountNumber =
            Number(amountValue);

        if (
            !Number.isInteger(
                amountNumber
            ) ||
            amountNumber <= 0
        ) {

            alert(
                "Please enter a valid whole-number amount."
            );

            return;

        }

        continueBtn.disabled = true;

        continueBtn.textContent =
            "Processing...";

        try {

            const result =
                await backendRequest(
                    "/api/electricity/purchase",
                    {
                        method: "POST",

                        body: JSON.stringify({

                            serviceId:
                                selectedCompany,

                            meterType:
                                selectedMeterType,

                            customerId:
                                meter,

                            meterNumber:
                                meter,

                            amount:
                                amountNumber

                        })
                    }
                );

            const status =
                String(
                    result?.status || ""
                ).toUpperCase();

            if (
                status === "SUCCESS" ||
                status === "COMPLETED"
            ) {

                alert(
                    "Electricity purchase completed successfully."
                );

                console.log(
                    "Electricity purchase:",
                    result
                );

                return;

            }

            if (
                status === "FAILED"
            ) {

                alert(
                    result?.message ||
                    "Electricity purchase failed. Your funds should remain available."
                );

                return;

            }

            if (
                status === "UNKNOWN" ||
                status === "PENDING" ||
                result?.reconciliationRequired === true
            ) {

                alert(
                    "Your electricity purchase is still being confirmed. Your funds remain reserved while we check the provider."
                );

                console.log(
                    "Electricity purchase requires reconciliation:",
                    result
                );

                return;

            }

            alert(
                result?.message ||
                "The purchase status could not be confirmed. Please check your transaction history."
            );

            console.log(
                "Electricity purchase response:",
                result
            );

        } catch (error) {

            console.error(
                "Electricity purchase error:",
                error
            );

            alert(
                "We could not confirm the electricity purchase. Please check your transaction history before trying again."
            );

        } finally {

            continueBtn.disabled =
                false;

            continueBtn.textContent =
                "Continue";

        }

    }
);

console.log(
    "✅ NovaPay Electricity Module Loaded"
);