/* ==========================================
   NOVAPAY DATA
   Frontend is untrusted.
   Backend remains authoritative for:
   - plan
   - price
   - wallet balance
   - transaction state
   - provider result
   - profit
========================================== */

import { auth } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";


/* ========= CONFIG ========= */

const API_BASE_URL =
    "https://novapay-server.onrender.com";


/* ========= ELEMENTS ========= */

const backBtn =
    document.getElementById("backBtn");

const continueBtn =
    document.getElementById("continueBtn");

const phoneInput =
    document.getElementById("phoneNumber");

const beneficiaryBtn =
    document.getElementById("beneficiaryBtn");

const networkCards =
    document.querySelectorAll(".network-card");

const categoryTabs =
    document.querySelectorAll(".plan-tab");

const plansContainer =
    document.getElementById("plansContainer");


/* ========= STATE ========= */

let currentUser = null;

let selectedNetwork = "mtn";

let selectedCategory = "Hot";

let selectedPlan = null;

let allPlans = [];

let purchaseInProgress = false;


/* ========= NETWORK MAP ========= */
/*
   Backend/catalog uses lowercase network IDs.
   HTML uses display names.
*/

const NETWORK_MAP = Object.freeze({
    MTN: "mtn",
    Airtel: "airtel",
    Glo: "glo",
    "9mobile": "9mobile"
});


/* ==========================================
   AUTHENTICATION
========================================== */

onAuthStateChanged(
    auth,
    async (user) => {

        if (!user) {

            currentUser = null;

            window.location.href =
                "login.html";

            return;
        }

        currentUser = user;

        await loadDataPlans();
    }
);


/* ==========================================
   AUTHENTICATED FETCH
========================================== */

async function authenticatedFetch(
    path,
    options = {}
) {

    if (!currentUser) {

        throw new Error(
            "Your session has expired. Please login again."
        );
    }

    const idToken =
        await currentUser.getIdToken();

    const headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${idToken}`
    };

    if (options.headers) {

        Object.assign(
            headers,
            options.headers
        );
    }

    return fetch(
        `${API_BASE_URL}${path}`,
        {
            ...options,
            headers
        }
    );
}


/* ==========================================
   PUBLIC API FETCH
   Used only for catalog retrieval.
========================================== */

async function publicFetch(path) {

    return fetch(
        `${API_BASE_URL}${path}`,
        {
            method: "GET",
            headers: {
                "Accept": "application/json"
            }
        }
    );
}


/* ==========================================
   SAFE JSON RESPONSE
========================================== */

async function readJsonResponse(response) {

    const contentType =
        response.headers.get("content-type") || "";

    if (
        !contentType
            .toLowerCase()
            .includes("application/json")
    ) {

        throw new Error(
            `Server returned an unexpected response (${response.status}).`
        );
    }

    return response.json();
}


/* ==========================================
   LOAD REAL DATA PLANS
========================================== */

async function loadDataPlans() {

    try {

        plansContainer.innerHTML = `
            <div class="plans-loading">
                Loading data plans...
            </div>
        `;

        const response =
            await publicFetch("/api/data/plans");

        const result =
            await readJsonResponse(response);

        if (!response.ok || !result.success) {

            throw new Error(
                result.error ||
                "Unable to load data plans."
            );
        }

        if (!Array.isArray(result.plans)) {

            throw new Error(
                "Server returned an invalid data catalog."
            );
        }

        /*
           Do not calculate or modify prices here.

           The server's planId is what will be submitted
           during purchase. The backend will look up the
           current plan and authoritative price again.
        */

        allPlans =
            result.plans.filter(
                isValidCatalogPlan
            );

        selectedPlan = null;

        renderPlans();

    } catch (error) {

        console.error(
            "Data catalog error:",
            error
        );

        plansContainer.innerHTML = `
            <div class="plans-error">
                Unable to load data plans.
                Please try again.
            </div>
        `;

        selectedPlan = null;
    }
}


/* ==========================================
   CATALOG PLAN VALIDATION
========================================== */

function isValidCatalogPlan(plan) {

    if (
        !plan ||
        typeof plan !== "object"
    ) {

        return false;
    }

    if (
        typeof plan.planId !== "string" ||
        !plan.planId.trim()
    ) {

        return false;
    }

    if (
        typeof plan.variationId !== "string" ||
        !plan.variationId.trim()
    ) {

        return false;
    }

    if (
        typeof plan.network !== "string" ||
        !NETWORK_MAP_VALUE_EXISTS(plan.network)
    ) {

        return false;
    }

    if (
        typeof plan.serviceName !== "string" ||
        !plan.serviceName.trim()
    ) {

        return false;
    }

    if (
        typeof plan.dataPlan !== "string" ||
        !plan.dataPlan.trim()
    ) {

        return false;
    }

    if (
        typeof plan.priceNaira !== "number" ||
        !Number.isFinite(plan.priceNaira) ||
        plan.priceNaira < 0
    ) {

        return false;
    }

    if (
        typeof plan.priceKobo !== "number" ||
        !Number.isSafeInteger(plan.priceKobo) ||
        plan.priceKobo < 0
    ) {

        return false;
    }

    return true;
}


/* ==========================================
   NETWORK VALIDATION
========================================== */

function NETWORK_MAP_VALUE_EXISTS(network) {

    const normalized =
        String(network)
            .trim()
            .toLowerCase();

    return (
        normalized === "mtn" ||
        normalized === "airtel" ||
        normalized === "glo" ||
        normalized === "9mobile"
    );
}


/* ==========================================
   BACK BUTTON
========================================== */

backBtn.addEventListener(
    "click",
    () => {

        history.back();
    }
);


/* ==========================================
   BENEFICIARIES
========================================== */

beneficiaryBtn.addEventListener(
    "click",
    () => {

        alert(
            "Beneficiaries coming soon."
        );
    }
);


/* ==========================================
   RENDER PLANS
========================================== */

function renderPlans() {

    plansContainer.innerHTML = "";

    selectedPlan = null;

    const networkPlans =
        allPlans.filter(
            plan =>
                plan.network ===
                selectedNetwork
        );

    const availablePlans =
        networkPlans.filter(
            plan =>
                plan.availability !== false
        );

    if (!availablePlans.length) {

        plansContainer.innerHTML = `
            <div class="plans-empty">
                No data plans are currently available
                for this network.
            </div>
        `;

        return;
    }

    availablePlans.forEach(
        (plan) => {

            const card =
                document.createElement("div");

            card.className =
                "plan-card";

            /*
               All displayed values come from the
               server catalog.

               The displayed price is NOT sent back
               as an authoritative purchase amount.
            */

            const sizeElement =
                document.createElement("div");

            sizeElement.className =
                "plan-size";

            sizeElement.textContent =
                plan.dataPlan;


            const validityElement =
                document.createElement("div");

            validityElement.className =
                "plan-validity";

            validityElement.textContent =
                getPlanValidity(plan.dataPlan);


            const priceElement =
                document.createElement("div");

            priceElement.className =
                "plan-price";

            priceElement.textContent =
                formatNaira(plan.priceNaira);


            card.appendChild(
                sizeElement
            );

            card.appendChild(
                validityElement
            );

            card.appendChild(
                priceElement
            );


            card.addEventListener(
                "click",
                () => {

                    if (purchaseInProgress) {
                        return;
                    }

                    document
                        .querySelectorAll(".plan-card")
                        .forEach(
                            item =>
                                item.classList.remove(
                                    "active"
                                )
                        );

                    card.classList.add(
                        "active"
                    );

                    /*
                       Store the entire server plan
                       locally for UI purposes.

                       During purchase we send ONLY
                       the planId.
                    */

                    selectedPlan = plan;
                }
            );


            plansContainer.appendChild(
                card
            );
        }
    );
}


/* ==========================================
   FORMAT NAIRA
========================================== */

function formatNaira(amount) {

    const numericAmount =
        Number(amount);

    if (
        !Number.isFinite(numericAmount)
    ) {

        return "₦--";
    }

    return `₦${numericAmount.toLocaleString(
        "en-NG",
        {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }
    )}`;
}


/* ==========================================
   PLAN VALIDITY DISPLAY
========================================== */
/*
   The backend catalog does not currently expose
   a separate validity field.

   Therefore we extract it only for display when
   the provider's dataPlan text contains it.

   This NEVER affects the purchase request.
========================================== */

function getPlanValidity(dataPlan) {

    const text =
        String(dataPlan || "")
            .trim();

    const match =
        text.match(
            /(\d+)\s*(day|days|week|weeks|month|months)/i
        );

    if (!match) {

        return "";
    }

    const number =
        match[1];

    const unit =
        match[2];

    return `${number} ${unit}`;
}


/* ==========================================
   CATEGORY TABS
========================================== */

categoryTabs.forEach(
    tab => {

        tab.addEventListener(
            "click",
            () => {

                if (purchaseInProgress) {
                    return;
                }

                categoryTabs.forEach(
                    item =>
                        item.classList.remove(
                            "active"
                        )
                );

                tab.classList.add(
                    "active"
                );

                selectedCategory =
                    tab.textContent
                        .trim()
                        .replace(
                            "🔥 ",
                            ""
                        );

                /*
                   IMPORTANT:

                   The current backend catalog does not
                   contain a category field.

                   Therefore we do NOT pretend that
                   Hot/Daily/Weekly/etc. are provider
                   categories.

                   For now, changing the tab simply
                   refreshes the same authoritative
                   network catalog.

                   Category mapping can be added later
                   when the backend has an authoritative
                   category source.
                */

                renderPlans();
            }
        );
    }
);


/* ==========================================
   NETWORK SELECTION
========================================== */

networkCards.forEach(
    card => {

        card.addEventListener(
            "click",
            () => {

                if (purchaseInProgress) {
                    return;
                }

                networkCards.forEach(
                    item =>
                        item.classList.remove(
                            "active"
                        )
                );

                card.classList.add(
                    "active"
                );

                const displayNetwork =
                    card.dataset.network;

                const backendNetwork =
                    NETWORK_MAP[
                        displayNetwork
                    ];

                if (!backendNetwork) {

                    console.error(
                        "Unsupported network:",
                        displayNetwork
                    );

                    selectedNetwork = null;

                    selectedPlan = null;

                    plansContainer.innerHTML = `
                        <div class="plans-error">
                            Unsupported network.
                        </div>
                    `;

                    return;
                }

                selectedNetwork =
                    backendNetwork;

                renderPlans();
            }
        );
    }
);


/* ==========================================
   PHONE NORMALIZATION
========================================== */

function normalizePhoneNumber(value) {

    let phone =
        String(value || "")
            .trim()
            .replace(/\s+/g, "");

    if (
        phone.startsWith("+234")
    ) {

        phone =
            "0" +
            phone.slice(4);

    } else if (
        phone.startsWith("234")
    ) {

        phone =
            "0" +
            phone.slice(3);
    }

    return phone;
}


/* ==========================================
   PHONE VALIDATION
========================================== */

function validatePhoneNumber(value) {

    const phone =
        normalizePhoneNumber(value);

    if (!/^0\d{10}$/.test(phone)) {

        return {
            valid: false,
            phone
        };
    }

    return {
        valid: true,
        phone
    };
}


/* ==========================================
   CONTINUE / PURCHASE
========================================== */

continueBtn.addEventListener(
    "click",
    async () => {

        if (purchaseInProgress) {
            return;
        }

        const validation =
            validatePhoneNumber(
                phoneInput.value
            );

        if (!validation.valid) {

            alert(
                "Please enter a valid Nigerian phone number."
            );

            phoneInput.focus();

            return;
        }

        if (!selectedNetwork) {

            alert(
                "Please select a valid network."
            );

            return;
        }

        if (!selectedPlan) {

            alert(
                "Please select a data plan."
            );

            return;
        }

        /*
           We intentionally do NOT send:

           - price
           - priceKobo
           - balance
           - profit
           - amount
           - provider cost
           - availability

           The backend determines all financial values.
        */

        await purchaseData(
            validation.phone,
            selectedNetwork,
            selectedPlan.planId
        );
    }
);


/* ==========================================
   PURCHASE DATA
========================================== */

async function purchaseData(
    phoneNumber,
    network,
    planId
) {

    purchaseInProgress = true;

    setPurchaseButtonState(true);

    try {

        const response =
            await authenticatedFetch(
                "/api/data/purchase",
                {
                    method: "POST",

                    body: JSON.stringify({
                        phoneNumber,
                        network,
                        planId
                    })
                }
            );

        const result =
            await readJsonResponse(
                response
            );


        /* ========= SUCCESS ========= */

        if (
            response.status === 200 &&
            result.success &&
            result.status === "successful"
        ) {

            alert(
                "Data purchase successful."
            );

            console.log(
                "Data transaction:",
                result
            );

            /*
               Clear selection after a confirmed
               successful transaction.
            */

            selectedPlan = null;

            document
                .querySelectorAll(".plan-card")
                .forEach(
                    card =>
                        card.classList.remove(
                            "active"
                        )
                );

            return;
        }


        /* ========= PENDING / UNKNOWN ========= */

        if (
            response.status === 202 ||
            result.status === "pending" ||
            result.status === "unknown"
        ) {

            alert(
                "Your data purchase is being processed. Please check your transaction history for the final status."
            );

            console.log(
                "Data transaction pending:",
                result
            );

            return;
        }


        /* ========= CONFIRMED FAILURE ========= */

        if (
            response.status === 400 ||
            result.status === "failed"
        ) {

            alert(
                result.error ||
                "Data purchase failed."
            );

            console.error(
                "Data purchase failed:",
                result
            );

            return;
        }


        /* ========= AUTH ERROR ========= */

        if (
            response.status === 401
        ) {

            alert(
                "Your session has expired. Please login again."
            );

            window.location.href =
                "login.html";

            return;
        }


        /* ========= OTHER SERVER ERROR ========= */

        throw new Error(
            result.error ||
            `Data purchase failed (${response.status}).`
        );

    } catch (error) {

        console.error(
            "Data purchase error:",
            error
        );

        alert(
            error.message ||
            "Unable to complete the data purchase. Please try again."
        );

    } finally {

        purchaseInProgress = false;

        setPurchaseButtonState(false);
    }
}


/* ==========================================
   PURCHASE BUTTON STATE
========================================== */

function setPurchaseButtonState(
    processing
) {

    continueBtn.disabled =
        processing;

    if (processing) {

        continueBtn.dataset.originalText =
            continueBtn.textContent;

        continueBtn.textContent =
            "Processing...";

    } else {

        continueBtn.textContent =
            continueBtn.dataset.originalText ||
            "Continue";
    }
}


/* ==========================================
   INITIAL NETWORK STATE
========================================== */

function initializeNetwork() {

    networkCards.forEach(
        card => {

            const displayNetwork =
                card.dataset.network;

            const backendNetwork =
                NETWORK_MAP[
                    displayNetwork
                ];

            if (
                backendNetwork ===
                selectedNetwork
            ) {

                card.classList.add(
                    "active"
                );

            } else {

                card.classList.remove(
                    "active"
                );
            }
        }
    );
}


/* ==========================================
   STARTUP
========================================== */

initializeNetwork();

console.log(
    "✅ NovaPay Data frontend ready."
);