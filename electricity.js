/* ==========================================
   NOVAPAY ELECTRICITY
   BACKEND CONNECTED VERSION
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

let selectedCompany =
    "ikedc";

let selectedMeterType =
    "prepaid";

let verifiedCustomer = null;


/* ==========================================
   BACKEND URL
========================================== */

const API_BASE_URL =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
        ? "http://localhost:3000"
        : "";


/* ==========================================
   HELPER — GET AUTH TOKEN
========================================== */

async function getAuthToken() {

    const user =
        auth.currentUser;

    if (!user) {

        throw new Error(
            "You must be logged in to use electricity services."
        );

    }

    return user.getIdToken();

}


/* ==========================================
   HELPER — BACKEND REQUEST
========================================== */

async function backendRequest(
    endpoint,
    options = {}
) {

    const token =
        await getAuthToken();

    const headers = {
        ...(options.headers || {}),
        Authorization:
            `Bearer ${token}`,
        "Content-Type":
            "application/json"
    };


    const response =
        await fetch(
            `${API_BASE_URL}${endpoint}`,
            {
                ...options,
                headers
            }
        );


    let data = null;

    try {

        data =
            await response.json();

    }

    catch (error) {

        data = null;

    }


    if (!response.ok) {

        const message =
            data &&
            (
                data.error ||
                data.message
            )
                ? (
                    data.error ||
                    data.message
                )
                : "Request failed.";

        throw new Error(
            message
        );

    }


    return data;

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


                /*
                 * A previous verification belongs to the
                 * previous electricity company, so it must
                 * not be reused.
                 */
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


                /*
                 * Meter type is part of the provider
                 * verification, so previous verification
                 * must not be reused.
                 */
                resetVerification();

            }
        );

    }
);


/* ==========================================
   RESET VERIFICATION
========================================== */

function resetVerification() {

    verifiedCustomer =
        null;


    customerCard.classList.add(
        "hidden"
    );


    amountSection.classList.add(
        "hidden"
    );


    continueBtn.classList.add(
        "hidden"
    );


    customerName.textContent =
        "";


    customerAddress.textContent =
        "";


    verifyMeterBtn.disabled =
        false;


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

            meterNumber.focus();

            return;

        }


        /*
         * Require an authenticated Firebase user
         * before contacting the backend.
         */
        if (!auth.currentUser) {

            alert(
                "Please log in before verifying your meter."
            );

            return;

        }


        verifyMeterBtn.disabled =
            true;

        verifyMeterBtn.textContent =
            "Verifying...";


        try {

            const result =
                await backendRequest(
                    "/api/electricity/verify",
                    {
                        method:
                            "POST",

                        body:
                            JSON.stringify({

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


            /*
             * Backend/provider verification must
             * explicitly succeed.
             */
            if (
                !result ||
                result.success !== true
            ) {

                throw new Error(
                    result?.error ||
                    "Meter verification failed."
                );

            }


            const customer =
                result.data ||
                result.customer ||
                result.verification ||
                null;


            if (!customer) {

                throw new Error(
                    "The electricity provider did not return customer information."
                );

            }


            /*
             * Do not manufacture customer information.
             *
             * Everything displayed below comes from
             * the backend/provider response.
             */
            verifiedCustomer =
                customer;


            const verifiedName =
                customer.customer_name ||
                customer.customerName ||
                customer.name ||
                "";


            const verifiedAddress =
                customer.address ||
                customer.customer_address ||
                "";


            if (!verifiedName) {

                throw new Error(
                    "Customer verification did not return a customer name."
                );

            }


            customerName.textContent =
                verifiedName;


            customerAddress.textContent =
                verifiedAddress ||
                "Address not provided by provider.";


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


            /*
             * The meter/customer information is now
             * verified for the selected company and
             * meter type.
             */
            console.log(
                "Electricity customer verified:",
                {
                    company:
                        selectedCompany,

                    meterType:
                        selectedMeterType,

                    customer:
                        verifiedCustomer
                }
            );

        }

        catch (error) {

            console.error(
                "Electricity meter verification error:",
                error
            );


            verifiedCustomer =
                null;


            customerCard.classList.add(
                "hidden"
            );


            amountSection.classList.add(
                "hidden"
            );


            continueBtn.classList.add(
                "hidden"
            );


            verifyMeterBtn.disabled =
                false;

            verifyMeterBtn.textContent =
                "Verify Meter";


            alert(
                error.message ||
                "Unable to verify meter. Please try again."
            );

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


        if (!meter) {

            alert(
                "Please enter a meter number."
            );

            meterNumber.focus();

            return;

        }


        if (!verifiedCustomer) {

            alert(
                "Please verify your meter first."
            );

            return;

        }


        if (!amountValue) {

            alert(
                "Please enter an amount."
            );

            amount.focus();

            return;

        }


        const numericAmount =
            Number(
                amountValue
            );


        if (
            !Number.isFinite(
                numericAmount
            ) ||
            numericAmount <= 0
        ) {

            alert(
                "Please enter a valid amount."
            );

            amount.focus();

            return;

        }


        /*
         * VTU electricity purchases use NGN at the
         * provider boundary, while NovaPay internally
         * works in kobo.
         *
         * Only send a whole NGN amount to the backend.
         */
        if (
            !Number.isInteger(
                numericAmount
            )
        ) {

            alert(
                "Please enter a whole naira amount."
            );

            amount.focus();

            return;

        }


        if (!auth.currentUser) {

            alert(
                "Please log in before making an electricity purchase."
            );

            return;

        }


        continueBtn.disabled =
            true;

        continueBtn.textContent =
            "Processing...";


        try {

            const result =
                await backendRequest(
                    "/api/electricity/purchase",
                    {
                        method:
                            "POST",

                        body:
                            JSON.stringify({

                                serviceId:
                                    selectedCompany,

                                meterType:
                                    selectedMeterType,

                                customerId:
                                    meter,

                                meterNumber:
                                    meter,

                                amount:
                                    numericAmount

                            })
                    }
                );


            /*
             * The backend is authoritative.
             *
             * Never assume success just because the
             * HTTP request itself succeeded.
             */
            const status =
                String(
                    result?.status ||
                    result?.transaction?.status ||
                    ""
                ).toUpperCase();


            /* ======================================
               SUCCESS
            ====================================== */

            if (
                result.success === true &&
                (
                    status === "SUCCESS" ||
                    status === "COMPLETED"
                )
            ) {

                continueBtn.textContent =
                    "Successful ✓";


                alert(
                    result.message ||
                    "Electricity purchase successful."
                );


                console.log(
                    "Electricity purchase successful:",
                    result
                );


                /*
                 * Do not locally subtract wallet balance.
                 *
                 * The backend has already handled the
                 * reservation and final wallet state.
                 */
                return;

            }


            /* ======================================
               DEFINITE FAILURE
            ====================================== */

            if (
                status === "FAILED"
            ) {

                continueBtn.disabled =
                    false;

                continueBtn.textContent =
                    "Continue";


                alert(
                    result.error ||
                    result.message ||
                    "Electricity purchase failed. Your reserved funds were not charged."
                );


                console.log(
                    "Electricity purchase failed:",
                    result
                );


                return;

            }


            /* ======================================
               UNKNOWN / PENDING
            ====================================== */

            if (
                status === "UNKNOWN" ||
                status === "PENDING" ||
                result.reconciliationRequired === true
            ) {

                continueBtn.disabled =
                    false;

                continueBtn.textContent =
                    "Continue";


                alert(
                    "Your electricity purchase is being checked. Your funds remain protected while we confirm the provider result."
                );


                console.log(
                    "Electricity purchase pending reconciliation:",
                    result
                );


                return;

            }


            /*
             * If the backend gives an unexpected response,
             * do NOT call it successful.
             */
            continueBtn.disabled =
                false;

            continueBtn.textContent =
                "Continue";


            alert(
                "We could not confirm the electricity purchase status. Please check your transaction history."
            );


            console.warn(
                "Unexpected electricity purchase response:",
                result
            );

        }

        catch (error) {

            console.error(
                "Electricity purchase error:",
                error
            );


            /*
             * A network/HTTP error is NOT treated as a
             * definite provider failure.
             *
             * The backend is responsible for determining
             * whether the transaction is unknown and
             * keeping the reservation protected.
             */
            continueBtn.disabled =
                false;

            continueBtn.textContent =
                "Continue";


            alert(
                "We could not confirm the purchase status. Please check your transaction history before trying again."
            );

        }

    }
);


/* ==========================================
   INITIAL UI STATE
========================================== */

continueBtn.classList.add(
    "hidden"
);

customerCard.classList.add(
    "hidden"
);

amountSection.classList.add(
    "hidden"
);


/* ==========================================
   MODULE LOADED
========================================== */

console.log(
    "✅ NovaPay Electricity frontend connected to backend"
);