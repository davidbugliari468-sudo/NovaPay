/* ==========================================
   NOVAPAY DATA
========================================== */

import { auth } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";


/* ==========================================
   CONFIG
========================================== */

const API_BASE_URL =
    "https://novapay-server.onrender.com";


/* ==========================================
   ELEMENTS
========================================== */

const backBtn =
    document.getElementById("backBtn");

const continueBtn =
    document.getElementById("continueBtn");

const phoneInput =
    document.getElementById("phoneNumber");

const beneficiaryBtn =
    document.getElementById("beneficiaryBtn");

const refreshBalanceBtn =
    document.getElementById("refreshBalanceBtn");

const checkBalanceBtn =
    document.getElementById("checkBalanceBtn");

const walletBalance =
    document.getElementById("walletBalance");

const networkCards =
    document.querySelectorAll(".network-card");

const categoryTabs =
    document.querySelectorAll(".plan-tab");

const plansContainer =
    document.getElementById("plansContainer");


/* ==========================================
   STATE
========================================== */

let currentUser = null;

let selectedNetwork = "mtn";

let selectedPlan = null;

let allPlans = [];

let purchaseInProgress = false;

let balanceLoading = false;


/* ==========================================
   NETWORK MAP
========================================== */

const NETWORK_MAP = Object.freeze({
    MTN: "mtn",
    Airtel: "airtel",
    Glo: "glo",
    "9mobile": "9mobile"
});


/* ==========================================
   AUTH STATE
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

        await Promise.all([
            loadWalletBalance(),
            loadDataPlans()
        ]);
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
   PUBLIC FETCH
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
   JSON RESPONSE
========================================== */

async function readJsonResponse(response) {

    const contentType =
        response.headers.get(
            "content-type"
        ) || "";

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
   LOAD WALLET BALANCE
========================================== */

async function loadWalletBalance() {

    if (balanceLoading) {
        return;
    }

    balanceLoading = true;

    walletBalance.textContent =
        "Loading...";

    try {

        const response =
            await authenticatedFetch(
                "/api/wallet",
                {
                    method: "GET"
                }
            );

        const result =
            await readJsonResponse(
                response
            );

        if (!response.ok) {

            if (
                response.status === 401
            ) {

                window.location.href =
                    "login.html";

                return;
            }

            throw new Error(
                result.error ||
                "Unable to load wallet balance."
            );
        }

        /*
           Your wallet endpoint is authoritative.

           We support the common response shapes
           without allowing the value to be sent
           back as a purchase amount.
        */

        const balanceKobo =
            extractBalanceKobo(result);

        if (
            !Number.isSafeInteger(
                balanceKobo
            ) ||
            balanceKobo < 0
        ) {

            throw new Error(
                "Server returned an invalid wallet balance."
            );
        }

        walletBalance.textContent =
            formatKoboAsNaira(
                balanceKobo
            );

    } catch (error) {

        console.error(
            "Wallet balance error:",
            error
        );

        walletBalance.textContent =
            "₦--";

    } finally {

        balanceLoading = false;
    }
}


/* ==========================================
   EXTRACT WALLET BALANCE
========================================== */

function extractBalanceKobo(result) {

    if (
        Number.isSafeInteger(
            result?.balanceKobo
        )
    ) {

        return result.balanceKobo;
    }

    if (
        Number.isSafeInteger(
            result?.wallet?.balanceKobo
        )
    ) {

        return result.wallet.balanceKobo;
    }

    if (
        Number.isSafeInteger(
            result?.data?.balanceKobo
        )
    ) {

        return result.data.balanceKobo;
    }

    throw new Error(
        "Wallet balance was not included in the server response."
    );
}


/* ==========================================
   FORMAT KOBO
========================================== */

function formatKoboAsNaira(
    kobo
) {

    const naira =
        kobo / 100;

    return `₦${naira.toLocaleString(
        "en-NG",
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    )}`;
}


/* ==========================================
   LOAD DATA PLANS
========================================== */

async function loadDataPlans() {

    plansContainer.innerHTML = `
        <div class="plans-loading">
            Loading data plans...
        </div>
    `;

    try {

        const response =
            await publicFetch(
                "/api/data/plans"
            );

        const result =
            await readJsonResponse(
                response
            );

        if (
            !response.ok ||
            !result.success
        ) {

            throw new Error(
                result.error ||
                "Unable to load data plans."
            );
        }

        if (
            !Array.isArray(
                result.plans
            )
        ) {

            throw new Error(
                "Server returned an invalid data catalog."
            );
        }

        allPlans =
            result.plans.filter(
                isValidPlan
            );

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
    }
}


/* ==========================================
   PLAN VALIDATION
========================================== */

function isValidPlan(plan) {

    return Boolean(
        plan &&
        typeof plan === "object" &&
        typeof plan.planId === "string" &&
        plan.planId.trim() &&
        typeof plan.variationId === "string" &&
        plan.variationId.trim() &&
        typeof plan.network === "string" &&
        typeof plan.serviceName === "string" &&
        typeof plan.dataPlan === "string" &&
        typeof plan.priceNaira === "number" &&
        Number.isFinite(
            plan.priceNaira
        ) &&
        Number.isSafeInteger(
            plan.priceKobo
        ) &&
        plan.priceKobo >= 0
    );
}


/* ==========================================
   RENDER PLANS
========================================== */

function renderPlans() {

    plansContainer.innerHTML = "";

    selectedPlan = null;

    const plans =
        allPlans.filter(
            plan =>
                plan.network ===
                selectedNetwork &&
                plan.availability !== false
        );

    if (!plans.length) {

        plansContainer.innerHTML = `
            <div class="plans-empty">
                No data plans are currently available
                for this network.
            </div>
        `;

        return;
    }

    plans.forEach(
        plan => {

            const card =
                document.createElement(
                    "div"
                );

            card.className =
                "plan-card";


            const size =
                document.createElement(
                    "div"
                );

            size.className =
                "plan-size";

            size.textContent =
                plan.dataPlan;


            const validity =
                document.createElement(
                    "div"
                );

            validity.className =
                "plan-validity";

            validity.textContent =
                extractValidity(
                    plan.dataPlan
                );


            const price =
                document.createElement(
                    "div"
                );

            price.className =
                "plan-price";

            price.textContent =
                formatNaira(
                    plan.priceNaira
                );


            card.appendChild(size);
            card.appendChild(validity);
            card.appendChild(price);


            card.addEventListener(
                "click",
                () => {

                    if (
                        purchaseInProgress
                    ) {
                        return;
                    }

                    document
                        .querySelectorAll(
                            ".plan-card"
                        )
                        .forEach(
                            item =>
                                item.classList.remove(
                                    "active"
                                )
                        );

                    card.classList.add(
                        "active"
                    );

                    selectedPlan =
                        plan;
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

function formatNaira(
    amount
) {

    return `₦${Number(
        amount
    ).toLocaleString(
        "en-NG",
        {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }
    )}`;
}


/* ==========================================
   EXTRACT VALIDITY
========================================== */

function extractValidity(
    dataPlan
) {

    const match =
        String(
            dataPlan || ""
        ).match(
            /(\d+)\s*(day|days|week|weeks|month|months)/i
        );

    if (!match) {
        return "";
    }

    return `${match[1]} ${match[2]}`;
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
   REFRESH WALLET
========================================== */

refreshBalanceBtn.addEventListener(
    "click",
    async () => {

        if (
            balanceLoading ||
            purchaseInProgress
        ) {
            return;
        }

        await loadWalletBalance();
    }
);


/* ==========================================
   DATA BALANCE BUTTON
========================================== */

checkBalanceBtn.addEventListener(
    "click",
    () => {

        alert(
            "Use *323*4# on your phone to check your data balance."
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

                if (
                    purchaseInProgress
                ) {
                    return;
                }

                const displayNetwork =
                    card.dataset.network;

                const backendNetwork =
                    NETWORK_MAP[
                        displayNetwork
                    ];

                if (!backendNetwork) {

                    alert(
                        "Unsupported network."
                    );

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

                selectedNetwork =
                    backendNetwork;

                renderPlans();
            }
        );
    }
);


/* ==========================================
   CATEGORY TABS
========================================== */

categoryTabs.forEach(
    tab => {

        tab.addEventListener(
            "click",
            () => {

                if (
                    purchaseInProgress
                ) {
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

                /*
                   The current backend catalog does not
                   provide Hot/Daily/Weekly/etc. as a
                   provider field.

                   Therefore we do not falsely filter
                   plans by an invented category.

                   Network filtering remains real and
                   authoritative.
                */

                renderPlans();
            }
        );
    }
);


/* ==========================================
   PHONE NORMALIZATION
========================================== */

function normalizePhoneNumber(
    value
) {

    let phone =
        String(
            value || ""
        )
            .trim()
            .replace(
                /\s+/g,
                ""
            );

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

function validatePhoneNumber(
    value
) {

    const phone =
        normalizePhoneNumber(
            value
        );

    return {
        valid:
            /^0\d{10}$/.test(
                phone
            ),
        phone
    };
}


/* ==========================================
   CONTINUE
========================================== */

continueBtn.addEventListener(
    "click",
    async () => {

        if (
            purchaseInProgress
        ) {
            return;
        }

        const phoneResult =
            validatePhoneNumber(
                phoneInput.value
            );

        if (!phoneResult.valid) {

            alert(
                "Please enter a valid Nigerian phone number."
            );

            phoneInput.focus();

            return;
        }

        if (!selectedPlan) {

            alert(
                "Please select a data plan."
            );

            return;
        }

        await purchaseData(
            phoneResult.phone,
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

    setPurchaseButtonState(
        true
    );

    try {

        /*
           IMPORTANT SECURITY RULE:

           We intentionally send ONLY:

           phoneNumber
           network
           planId

           We do NOT send:

           price
           priceKobo
           balance
           providerCost
           profit
           amount

           The backend determines those values.
        */

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

            selectedPlan = null;

            document
                .querySelectorAll(
                    ".plan-card"
                )
                .forEach(
                    card =>
                        card.classList.remove(
                            "active"
                        )
                );

            await loadWalletBalance();

            return;
        }


        /* ========= PENDING ========= */

        if (
            response.status === 202 ||
            result.status === "pending" ||
            result.status === "unknown"
        ) {

            alert(
                "Your data purchase is being processed. Please check your transaction history for the final status."
            );

            await loadWalletBalance();

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

            await loadWalletBalance();

            return;
        }


        /* ========= AUTH ========= */

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

        setPurchaseButtonState(
            false
        );
    }
}


/* ==========================================
   BUTTON STATE
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
   INITIAL NETWORK
========================================== */

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


/* ==========================================
   READY
========================================== */

console.log(
    "✅ NovaPay Data frontend connected."
);