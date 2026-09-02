/* ==========================================
   NOVAPAY DATA
   Backend-authoritative Data purchase frontend
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

const planTabsContainer =
    document.querySelector(".plan-tabs");

const plansContainer =
    document.getElementById("plansContainer");


/* ==========================================
   STATE
========================================== */

let currentUser = null;

let selectedNetwork = "mtn";

let selectedPlan = null;

let allPlans = [];

let selectedCategory = null;

let purchaseInProgress = false;

let balanceLoading = false;

let purchaseNeedsReview = false;


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
   NETWORK ORDER
========================================== */

const NETWORK_ORDER = Object.freeze([
    "mtn",
    "airtel",
    "glo",
    "9mobile"
]);


/* ==========================================
   CATEGORY ORDER
========================================== */

const CATEGORY_ORDER = Object.freeze([
    "Hot",
    "Daily",
    "Weekly",
    "Monthly",
    "3 Months",
    "Router",
    "Social",
    "Night",
    "SME",
    "Other"
]);


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

        try {

            await Promise.all([
                loadWalletBalance(),
                loadDataPlans()
            ]);

        } catch (error) {

            console.error(
                "Data page initialization error:",
                error
            );
        }
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
        "Accept": "application/json",
        "Authorization": `Bearer ${idToken}`
    };

    if (
        options.body !== undefined
    ) {

        headers["Content-Type"] =
            "application/json";
    }

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
   JSON RESPONSE
========================================== */

async function readJsonResponse(
    response
) {

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

        if (
            response.status === 401
        ) {

            redirectToLogin();

            return;
        }

        if (!response.ok) {

            throw new Error(
                result.error ||
                "Unable to load wallet balance."
            );
        }

        const balanceKobo =
            extractBalanceKobo(
                result
            );

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

function extractBalanceKobo(
    result
) {

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

        /*
           The Data plans endpoint is protected
           by the backend.

           We therefore authenticate this request
           with the Firebase user's ID token.
        */

        const response =
            await authenticatedFetch(
                "/api/data/plans",
                {
                    method: "GET"
                }
            );

        const result =
            await readJsonResponse(
                response
            );

        if (
            response.status === 401
        ) {

            redirectToLogin();

            return;
        }

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

        buildCategoryTabs();

    } catch (error) {

        console.error(
            "Data catalog error:",
            error
        );

        planTabsContainer.innerHTML = "";

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

function isValidPlan(
    plan
) {

    return Boolean(
        plan &&
        typeof plan === "object" &&

        typeof plan.planId === "string" &&
        plan.planId.trim() &&

        typeof plan.variationId === "string" &&
        plan.variationId.trim() &&

        typeof plan.network === "string" &&
        NETWORK_ORDER.includes(
            plan.network
        ) &&

        typeof plan.serviceName === "string" &&
        plan.serviceName.trim() &&

        typeof plan.dataPlan === "string" &&
        plan.dataPlan.trim() &&

        typeof plan.dataAmount === "string" &&
        plan.dataAmount.trim() &&

        Number.isSafeInteger(
            plan.priceKobo
        ) &&
        plan.priceKobo >= 0 &&

        Number.isFinite(
            plan.priceNaira
        ) &&
        plan.priceNaira >= 0 &&

        (
            plan.customerPriceKobo === undefined ||
            (
                Number.isSafeInteger(
                    plan.customerPriceKobo
                ) &&
                plan.customerPriceKobo >= 0
            )
        )
    );
}


/* ==========================================
   BUILD CATEGORY TABS
========================================== */

function buildCategoryTabs() {

    planTabsContainer.innerHTML = "";

    const categories =
        getAvailableCategories();

    if (!categories.length) {

        selectedCategory = null;

        plansContainer.innerHTML = `
            <div class="plans-empty">
                No data plans are currently available.
            </div>
        `;

        return;
    }

    if (
        !selectedCategory ||
        !categories.includes(
            selectedCategory
        )
    ) {

        selectedCategory =
            categories[0];
    }

    categories.forEach(
        category => {

            const tab =
                document.createElement(
                    "button"
                );

            tab.type =
                "button";

            tab.className =
                "plan-tab";

            tab.dataset.category =
                category;

            tab.textContent =
                category === "Hot"
                    ? "🔥 Hot"
                    : category;

            if (
                category ===
                selectedCategory
            ) {

                tab.classList.add(
                    "active"
                );
            }

            tab.addEventListener(
                "click",
                () => {

                    if (
                        purchaseInProgress
                    ) {
                        return;
                    }

                    selectCategory(
                        category
                    );
                }
            );

            planTabsContainer.appendChild(
                tab
            );
        }
    );

    renderPlans();
}


/* ==========================================
   GET AVAILABLE CATEGORIES
========================================== */

function getAvailableCategories() {

    const categories =
        new Set();

    allPlans.forEach(
        plan => {

            if (
                plan.isHot === true
            ) {

                categories.add(
                    "Hot"
                );
            }

            const category =
                normalizeCategory(
                    plan.category
                );

            if (category) {

                categories.add(
                    category
                );
            }
        }
    );

    return Array.from(
        categories
    ).sort(
        (a, b) =>
            getCategoryOrder(
                a
            ) -
            getCategoryOrder(
                b
            )
    );
}


/* ==========================================
   NORMALIZE CATEGORY
========================================== */

function normalizeCategory(
    category
) {

    if (
        typeof category !== "string"
    ) {

        return null;
    }

    const normalized =
        category.trim();

    if (!normalized) {
        return null;
    }

    const match =
        CATEGORY_ORDER.find(
            item =>
                item.toLowerCase() ===
                normalized.toLowerCase()
        );

    return match || "Other";
}


/* ==========================================
   CATEGORY ORDER
========================================== */

function getCategoryOrder(
    category
) {

    const index =
        CATEGORY_ORDER.indexOf(
            category
        );

    return index === -1
        ? CATEGORY_ORDER.length
        : index;
}


/* ==========================================
   SELECT CATEGORY
========================================== */

function selectCategory(
    category
) {

    selectedCategory =
        category;

    document
        .querySelectorAll(
            ".plan-tab"
        )
        .forEach(
            tab => {

                tab.classList.toggle(
                    "active",
                    tab.dataset.category ===
                    category
                );
            }
        );

    renderPlans();
}


/* ==========================================
   RENDER PLANS
========================================== */

function renderPlans() {

    plansContainer.innerHTML = "";

    selectedPlan = null;

    const plans =
        allPlans
            .filter(
                plan =>
                    plan.network ===
                    selectedNetwork
            )
            .filter(
                plan =>
                    plan.availability !== false
            )
            .filter(
                matchesSelectedCategory
            )
            .sort(
                comparePlans
            );

    if (!plans.length) {

        plansContainer.innerHTML = `
            <div class="plans-empty">
                No data plans are currently available
                for this selection.
            </div>
        `;

        return;
    }

    plans.forEach(
        plan => {

            const card =
                document.createElement(
                    "button"
                );

            card.type =
                "button";

            card.className =
                "plan-card";

            card.setAttribute(
                "aria-label",
                buildPlanAriaLabel(
                    plan
                )
            );


            /* ==========================
               DATA AMOUNT
            ========================== */

            const size =
                document.createElement(
                    "div"
                );

            size.className =
                "plan-size";

            size.textContent =
                plan.dataAmount ||
                plan.dataPlan;


            /* ==========================
               VALIDITY
            ========================== */

            const validity =
                document.createElement(
                    "div"
                );

            validity.className =
                "plan-validity";

            validity.textContent =
                getPlanValidity(
                    plan
                );


            /* ==========================
               PRICE
            ========================== */

            const price =
                document.createElement(
                    "div"
                );

            price.className =
                "plan-price";

            price.textContent =
                formatPlanPrice(
                    plan
                );


            card.appendChild(
                size
            );

            card.appendChild(
                validity
            );

            card.appendChild(
                price
            );


            /* ==========================
               SELECT PLAN
            ========================== */

            card.addEventListener(
                "click",
                () => {

                    if (
                        purchaseInProgress ||
                        purchaseNeedsReview
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
   MATCH CATEGORY
========================================== */

function matchesSelectedCategory(
    plan
) {

    if (
        selectedCategory === "Hot"
    ) {

        return plan.isHot === true;
    }

    return normalizeCategory(
        plan.category
    ) === selectedCategory;
}


/* ==========================================
   PLAN SORTING
========================================== */

function comparePlans(
    a,
    b
) {

    const priceA =
        getCustomerPriceKobo(
            a
        );

    const priceB =
        getCustomerPriceKobo(
            b
        );

    if (
        priceA !== priceB
    ) {

        return priceA - priceB;
    }

    return String(
        a.planId
    ).localeCompare(
        String(
            b.planId
        )
    );
}


/* ==========================================
   CUSTOMER PRICE
========================================== */

function getCustomerPriceKobo(
    plan
) {

    if (
        Number.isSafeInteger(
            plan.customerPriceKobo
        )
    ) {

        return plan.customerPriceKobo;
    }

    return plan.priceKobo;
}


/* ==========================================
   CUSTOMER PRICE DISPLAY
========================================== */

function formatPlanPrice(
    plan
) {

    const customerPriceKobo =
        getCustomerPriceKobo(
            plan
        );

    return formatKoboAsNaira(
        customerPriceKobo
    );
}


/* ==========================================
   PLAN VALIDITY
========================================== */

function getPlanValidity(
    plan
) {

    if (
        typeof plan.validityLabel ===
        "string" &&
        plan.validityLabel.trim()
    ) {

        return plan.validityLabel;
    }

    if (
        Number.isFinite(
            plan.validityDays
        ) &&
        plan.validityDays > 0
    ) {

        return formatValidityDays(
            plan.validityDays
        );
    }

    return "Validity varies";
}


/* ==========================================
   FORMAT VALIDITY DAYS
========================================== */

function formatValidityDays(
    days
) {

    if (
        days === 1
    ) {

        return "1 Day";
    }

    if (
        days < 28
    ) {

        return `${days} Days`;
    }

    if (
        days < 60
    ) {

        return "Monthly";
    }

    if (
        days < 120
    ) {

        return "3 Months";
    }

    return `${days} Days`;
}


/* ==========================================
   PLAN ARIA LABEL
========================================== */

function buildPlanAriaLabel(
    plan
) {

    const amount =
        plan.dataAmount ||
        plan.dataPlan ||
        "Data plan";

    const validity =
        getPlanValidity(
            plan
        );

    const price =
        formatPlanPrice(
            plan
        );

    return `${amount}, ${validity}, ${price}`;
}


/* ==========================================
   FORMAT KOBO AS NAIRA
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
            purchaseInProgress ||
            purchaseNeedsReview
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
                    purchaseInProgress ||
                    purchaseNeedsReview
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
                /[\s().-]+/g,
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
            /^0[789]\d{9}$/.test(
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

        if (
            purchaseNeedsReview
        ) {

            alert(
                "We could not confirm the previous purchase. Please check your transaction history before making another purchase."
            );

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
            selectedPlan
        );
    }
);


/* ==========================================
   PURCHASE DATA
========================================== */

async function purchaseData(
    phoneNumber,
    network,
    plan
) {

    purchaseInProgress = true;

    setPurchaseButtonState(
        true
    );

    /*
       Generate ONE reference for this purchase
       attempt.

       The reference is used by the backend to
       create an idempotent transaction.

       We do not send price or amount.
    */

    const reference =
        createPurchaseReference();


    try {

        const response =
            await authenticatedFetch(
                "/api/data/purchase",
                {
                    method: "POST",

                    body: JSON.stringify({
                        phoneNumber,
                        network,
                        planId:
                            plan.planId,
                        reference
                    })
                }
            );


        const result =
            await readJsonResponse(
                response
            );


        /* ==========================
           AUTH
        ========================== */

        if (
            response.status === 401
        ) {

            redirectToLogin();

            return;
        }


        /* ==========================
           SUCCESS
        ========================== */

        if (
            response.status === 200 &&
            result.success &&
            result.status === "successful"
        ) {

            alert(
                buildSuccessMessage(
                    plan
                )
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


        /* ==========================
           PENDING / UNKNOWN
        ========================== */

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


        /* ==========================
           CONFIRMED FAILURE
        ========================== */

        if (
            result.status === "failed" ||
            response.status === 400
        ) {

            alert(
                getSafePurchaseError(
                    result
                )
            );

            await loadWalletBalance();

            return;
        }


        throw new Error(
            "Data purchase could not be completed."
        );

    } catch (error) {

        console.error(
            "Data purchase request error:",
            error
        );

        /*
           A network/client failure after sending a
           purchase request can mean that the backend
           completed the purchase but the browser did
           not receive the response.

           Therefore we MUST NOT automatically retry.

           The user must check transaction history
           before attempting another purchase.
        */

        purchaseNeedsReview = true;

        alert(
            "We could not confirm the result of your data purchase. Please check your transaction history before trying again."
        );

    } finally {

        purchaseInProgress = false;

        setPurchaseButtonState(
            false
        );

        if (
            purchaseNeedsReview
        ) {

            continueBtn.disabled =
                true;

            continueBtn.textContent =
                "Check Transaction History";
        }
    }
}


/* ==========================================
   CREATE PURCHASE REFERENCE
========================================== */

function createPurchaseReference() {

    if (
        typeof crypto !== "undefined" &&
        typeof crypto.randomUUID ===
            "function"
    ) {

        return `DATA_${crypto.randomUUID()}`;
    }

    const timestamp =
        Date.now()
            .toString(36);

    const randomPart =
        Math.random()
            .toString(36)
            .slice(2, 14);

    return `DATA_${timestamp}_${randomPart}`;
}


/* ==========================================
   SUCCESS MESSAGE
========================================== */

function buildSuccessMessage(
    plan
) {

    const amount =
        plan.dataAmount ||
        plan.dataPlan;

    return `${amount} data purchase successful.`;
}


/* ==========================================
   SAFE PURCHASE ERROR
========================================== */

function getSafePurchaseError(
    result
) {

    const allowedMessages =
        new Set([
            "Invalid network.",
            "Invalid phone number.",
            "Invalid plan.",
            "Data plan is unavailable.",
            "Insufficient wallet balance.",
            "Data purchase failed.",
            "Data purchase is already in progress.",
            "Data purchase is being processed.",
            "Data purchase is temporarily unavailable.",
            "Please try again later."
        ]);

    const message =
        typeof result?.error ===
        "string"
            ? result.error.trim()
            : "";

    if (
        allowedMessages.has(
            message
        )
    ) {

        return message;
    }

    if (
        message
            .toLowerCase()
            .includes(
                "insufficient wallet"
            )
    ) {

        return "Insufficient wallet balance.";
    }

    return "Data purchase failed. Please try again.";
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
   REDIRECT TO LOGIN
========================================== */

function redirectToLogin() {

    currentUser = null;

    window.location.href =
        "login.html";
}


/* ==========================================
   INITIAL NETWORK STATE
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
    "NovaPay Data frontend connected to backend-authoritative catalog."
);