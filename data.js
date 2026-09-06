/* ==========================================
   NOVAPAY DATA
   Secure backend-connected frontend
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
   DOM ELEMENTS
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
   DOM SAFETY
========================================== */

const requiredElements = [
    ["backBtn", backBtn],
    ["continueBtn", continueBtn],
    ["phoneNumber", phoneInput],
    ["beneficiaryBtn", beneficiaryBtn],
    ["refreshBalanceBtn", refreshBalanceBtn],
    ["checkBalanceBtn", checkBalanceBtn],
    ["walletBalance", walletBalance],
    ["plansContainer", plansContainer]
];

for (
    const [name, element]
    of requiredElements
) {

    if (!element) {

        console.error(
            `NovaPay Data: missing HTML element #${name}`
        );
    }
}


/* ==========================================
   STATE
========================================== */

let currentUser = null;

let selectedNetwork = "mtn";

let selectedPlan = null;

let allPlans = [];

let selectedCategory = "Hot";

let purchaseInProgress = false;

let balanceLoading = false;


/* ==========================================
   NETWORK MAP
========================================== */

const NETWORK_MAP =
    Object.freeze({

        MTN: "1",

        Airtel: "3",

        Glo: "2",

        "9mobile": "4"

    });


/* ==========================================
   NETWORK ORDER
========================================== */

const NETWORK_ORDER =
    Object.freeze([
        "mtn",
        "airtel",
        "glo",
        "9mobile"
    ]);


/* ==========================================
   CATEGORY ORDER
========================================== */

const CATEGORY_ORDER =
    Object.freeze([
        "Hot",
        "Daily",
        "Weekly",
        "Monthly",
        "3 Months",
        "Extra Value",
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
        "Accept": "application/json",
        "Authorization":
            `Bearer ${idToken}`
    };

    if (
        options.body &&
        !(options.body instanceof FormData)
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
            .includes(
                "application/json"
            )
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

    if (
        balanceLoading ||
        !walletBalance
    ) {

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

            window.location.href =
                "login.html";

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
            "NovaPay wallet balance error:",
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

    if (!plansContainer) {
        return;
    }

    plansContainer.innerHTML = `
        <div class="plans-loading">
            Loading data plans...
        </div>
    `;

    try {

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

            window.location.href =
                "login.html";

            return;
        }

        if (!response.ok) {

            throw new Error(
                result.error ||
                "Unable to load data plans."
            );
        }

        /*
         * The Data route uses `ok: true`.
         *
         * Accept that authoritative backend
         * response instead of requiring a
         * different `success` property.
         */

        if (
            result.ok !== true ||
            !Array.isArray(
                result.plans
            )
        ) {

            throw new Error(
                "Server returned an invalid data catalog."
            );
        }

        /*
         * Convert the backend BabsPay catalogue
         * into the exact shape used by the
         * existing frontend renderer.
         *
         * No price is invented here.
         * priceKobo comes directly from the
         * backend catalogue.
         */

        allPlans =
            result.plans
                .map(
                    normalizeBackendPlan
                )
                .filter(
                    isValidPlan
                );

        if (!allPlans.length) {

            plansContainer.innerHTML = `
                <div class="plans-empty">
                    No data plans are currently available.
                </div>
            `;

            return;
        }

        setupCategoryTabs();

        updateCategoryTabVisibility();

        renderPlans();

    } catch (error) {

        console.error(
            "NovaPay data catalog error:",
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
   NORMALIZE BACKEND PLAN
========================================== */

function normalizeBackendPlan(
    plan
) {

    if (
        !plan ||
        typeof plan !== "object"
    ) {

        return null;
    }

    const planId =
        String(
            plan.planId ??
            ""
        ).trim();

    const networkId =
        String(
            plan.networkId ??
            ""
        ).trim();

    const networkName =
        String(
            plan.networkName ??
            ""
        ).trim();

    const planName =
        String(
            plan.planName ??
            ""
        ).trim();

    const planType =
        String(
            plan.planType ??
            ""
        ).trim();

    const validity =
        String(
            plan.validity ??
            ""
        ).trim();

    const priceKobo =
        Number(
            plan.priceKobo
        );

    /*
     * Map BabsPay's numeric network ID
     * to the frontend network key.
     */

    let network = "";

    if (
        networkId === "1"
    ) {

        network = "mtn";

    } else if (
        networkId === "2"
    ) {

        network = "glo";

    } else if (
        networkId === "3"
    ) {

        network = "airtel";

    } else if (
        networkId === "4"
    ) {

        network = "9mobile";
    }

    return {
        planId,

        variationId:
            planId,

        networkId,

        network,

        networkName,

        planName,

        planType,

        validity,

        dataPlan:
            planName,

        dataAmount:
            extractDataAmount(
                planName
            ),

        validityLabel:
            validity,

        priceKobo,

        status:
            String(
                plan.status ||
                ""
            ).trim().toLowerCase(),

        availability:
            String(
                plan.status ||
                ""
            ).trim().toLowerCase() ===
            "active"
    };
}


/* ==========================================
   PLAN VALIDATION
========================================== */

function isValidPlan(
    plan
) {

    if (
        !plan ||
        typeof plan !== "object"
    ) {

        return false;
    }

    if (
        typeof plan.planId !== "string" ||
        !/^\d+$/.test(
            plan.planId
        )
    ) {

        return false;
    }

    if (
        typeof plan.networkId !== "string" ||
        !NETWORK_ORDER.includes(
            plan.network
        )
    ) {

        return false;
    }

    if (
        typeof plan.networkName !== "string" ||
        !plan.networkName.trim()
    ) {

        return false;
    }

    if (
        typeof plan.planName !== "string" ||
        !plan.planName.trim()
    ) {

        return false;
    }

    if (
        typeof plan.planType !== "string" ||
        !plan.planType.trim()
    ) {

        return false;
    }

    if (
        typeof plan.validity !== "string" ||
        !plan.validity.trim()
    ) {

        return false;
    }

    if (
        !Number.isSafeInteger(
            plan.priceKobo
        ) ||
        plan.priceKobo <= 0
    ) {

        return false;
    }

    if (
        plan.status !== "active"
    ) {

        return false;
    }

    return true;
}


/* ==========================================
   EXTRACT DATA AMOUNT
========================================== */

function extractDataAmount(
    planName
) {

    const text =
        String(
            planName || ""
        ).trim();

    const match =
        text.match(
            /(\d+(?:\.\d+)?)\s*(GB|MB)/i
        );

    if (!match) {

        return text;
    }

    return `${match[1]} ${match[2].toUpperCase()}`;
} 
/* ==========================================
   CATEGORY SETUP
========================================== */

function setupCategoryTabs() {

    if (!categoryTabs.length) {
        return;
    }

    categoryTabs.forEach((tab) => {

        tab.addEventListener(
            "click",
            () => {

                const category =
                    String(
                        tab.dataset.category ||
                        tab.textContent ||
                        ""
                    ).trim();

                if (!category) {
                    return;
                }

                selectedCategory =
                    category;

                categoryTabs.forEach(
                    (item) => {

                        item.classList.toggle(
                            "active",
                            item === tab
                        );
                    }
                );

                renderPlans();
            }
        );
    });
}


/* ==========================================
   CATEGORY VISIBILITY
========================================== */

function updateCategoryTabVisibility() {

    categoryTabs.forEach((tab) => {

        const category =
            String(
                tab.dataset.category ||
                tab.textContent ||
                ""
            ).trim();

        const available =
            getPlansForCategory(
                category
            ).length > 0;

        tab.style.display =
            available ? "" : "none";
    });

    const selectedStillAvailable =
        getPlansForCategory(
            selectedCategory
        ).length > 0;

    if (
        !selectedStillAvailable
    ) {

        const firstAvailable =
            CATEGORY_ORDER.find(
                (category) =>
                    getPlansForCategory(
                        category
                    ).length > 0
            );

        if (firstAvailable) {

            selectedCategory =
                firstAvailable;
        }
    }

    categoryTabs.forEach(
        (tab) => {

            const category =
                String(
                    tab.dataset.category ||
                    tab.textContent ||
                    ""
                ).trim();

            tab.classList.toggle(
                "active",
                category ===
                selectedCategory
            );
        }
    );
}


/* ==========================================
   GET CURRENT NETWORK PLANS
========================================== */

function getCurrentNetworkPlans() {

    return allPlans.filter(
        (plan) =>
            plan.network ===
            selectedNetwork
    );
}


/* ==========================================
   GET PLANS FOR CATEGORY
========================================== */

function getPlansForCategory(
    category
) {

    const networkPlans =
        getCurrentNetworkPlans();

    if (!networkPlans.length) {
        return [];
    }

    const normalizedCategory =
        String(
            category || ""
        ).trim().toLowerCase();

    if (
        normalizedCategory ===
        "hot"
    ) {

        return getHotPlans(
            networkPlans
        );
    }

    if (
        normalizedCategory ===
        "daily"
    ) {

        return networkPlans.filter(
            (plan) =>
                getValidityDays(
                    plan.validity
                ) <= 3
        );
    }

    if (
        normalizedCategory ===
        "weekly"
    ) {

        return networkPlans.filter(
            (plan) => {

                const days =
                    getValidityDays(
                        plan.validity
                    );

                return (
                    days >= 4 &&
                    days <= 14
                );
            }
        );
    }

    if (
        normalizedCategory ===
        "monthly"
    ) {

        return networkPlans.filter(
            (plan) => {

                const days =
                    getValidityDays(
                        plan.validity
                    );

                return (
                    days >= 15 &&
                    days <= 45
                );
            }
        );
    }

    if (
        normalizedCategory ===
        "3 months"
    ) {

        return networkPlans.filter(
            (plan) => {

                const days =
                    getValidityDays(
                        plan.validity
                    );

                return days >= 60;
            }
        );
    }

    if (
        normalizedCategory ===
        "extra value"
    ) {

        return getExtraValuePlans(
            networkPlans
        );
    }

    if (
        normalizedCategory ===
        "router"
    ) {

        return networkPlans.filter(
            (plan) =>
                /router|mifi|modem/i.test(
                    `${plan.planName} ${plan.planType}`
                )
        );
    }

    if (
        normalizedCategory ===
        "social"
    ) {

        return networkPlans.filter(
            (plan) =>
                /social|facebook|whatsapp|instagram|twitter|tiktok/i.test(
                    `${plan.planName} ${plan.planType}`
                )
        );
    }

    if (
        normalizedCategory ===
        "night"
    ) {

        return networkPlans.filter(
            (plan) =>
                /night/i.test(
                    `${plan.planName} ${plan.planType}`
                )
        );
    }

    if (
        normalizedCategory ===
        "sme"
    ) {

        return networkPlans.filter(
            (plan) =>
                /sme/i.test(
                    `${plan.planName} ${plan.planType}`
                )
        );
    }

    return networkPlans;
}


/* ==========================================
   HOT PLANS
========================================== */

function getHotPlans(
    plans
) {

    return [...plans]
        .sort(
            comparePlans
        )
        .slice(0, 6);
}


/* ==========================================
   EXTRA VALUE PLANS
========================================== */

function getExtraValuePlans(
    plans
) {

    const validPlans =
        plans.filter(
            (plan) =>
                getDataMegabytes(
                    plan
                ) > 0 &&
                getCustomerPriceKobo(
                    plan
                ) > 0
        );

    if (!validPlans.length) {
        return [];
    }

    /*
     * Rank plans by data received per ₦1.
     * This does not alter the price.
     * It is only used to determine which
     * existing provider plans offer better
     * value.
     */

    return [...validPlans]
        .sort(
            (a, b) => {

                const aValue =
                    getDataMegabytes(a) /
                    getCustomerPriceKobo(a);

                const bValue =
                    getDataMegabytes(b) /
                    getCustomerPriceKobo(b);

                return bValue - aValue;
            }
        )
        .slice(0, 6);
}


/* ==========================================
   PLAN COMPARISON
========================================== */

function comparePlans(
    a,
    b
) {

    const priceA =
        getCustomerPriceKobo(a);

    const priceB =
        getCustomerPriceKobo(b);

    if (
        priceA !== priceB
    ) {

        return priceA - priceB;
    }

    const dataA =
        getDataMegabytes(a);

    const dataB =
        getDataMegabytes(b);

    if (
        dataA !== dataB
    ) {

        return dataA - dataB;
    }

    return (
        getValidityDays(
            a.validity
        ) -
        getValidityDays(
            b.validity
        )
    );
}


/* ==========================================
   VALIDITY DAYS
========================================== */

function getValidityDays(
    validity
) {

    const text =
        String(
            validity || ""
        ).toLowerCase();

    const match =
        text.match(
            /(\d+(?:\.\d+)?)\s*(day|days|week|weeks|month|months|year|years)/
        );

    if (!match) {

        return 0;
    }

    const value =
        Number(
            match[1]
        );

    const unit =
        match[2];

    if (
        !Number.isFinite(value) ||
        value <= 0
    ) {

        return 0;
    }

    if (
        unit.startsWith("week")
    ) {

        return value * 7;
    }

    if (
        unit.startsWith("month")
    ) {

        return value * 30;
    }

    if (
        unit.startsWith("year")
    ) {

        return value * 365;
    }

    return value;
}


/* ==========================================
   DATA MEGABYTES
========================================== */

function getDataMegabytes(
    plan
) {

    if (
        !plan ||
        typeof plan !== "object"
    ) {

        return 0;
    }

    const text =
        String(
            plan.planName ||
            plan.dataPlan ||
            ""
        );

    const match =
        text.match(
            /(\d+(?:\.\d+)?)\s*(GB|MB)/i
        );

    if (!match) {

        return 0;
    }

    const value =
        Number(
            match[1]
        );

    if (
        !Number.isFinite(value) ||
        value <= 0
    ) {

        return 0;
    }

    const unit =
        match[2].toUpperCase();

    if (
        unit === "GB"
    ) {

        return value * 1024;
    }

    return value;
}


/* ==========================================
   RENDER PLANS
========================================== */

function renderPlans() {

    if (!plansContainer) {
        return;
    }

    const plans =
        getPlansForCategory(
            selectedCategory
        );

    selectedPlan = null;

    if (!plans.length) {

        plansContainer.innerHTML = `
            <div class="plans-empty">
                No plans available in this category.
            </div>
        `;

        updateContinueButton();

        return;
    }

    const sortedPlans =
        [...plans].sort(
            comparePlans
        );

    plansContainer.innerHTML =
        sortedPlans
            .map(
                renderPlanCard
            )
            .join("");

    bindPlanCards();

    updateContinueButton();
}


/* ==========================================
   RENDER PLAN CARD
========================================== */

function renderPlanCard(
    plan
) {

    const priceKobo =
        getCustomerPriceKobo(
            plan
        );

    const price =
        formatPlanPrice(
            priceKobo
        );

    const dataAmount =
        plan.dataAmount ||
        extractDataAmount(
            plan.planName
        );

    const validity =
        plan.validityLabel ||
        plan.validity;

    const planId =
        escapeHtml(
            plan.planId
        );

    const name =
        escapeHtml(
            plan.planName
        );

    const amount =
        escapeHtml(
            dataAmount
        );

    const validityText =
        escapeHtml(
            validity
        );

    return `
        <button
            type="button"
            class="plan-card"
            data-plan-id="${planId}"
            aria-label="${name}, ${amount}, ${validityText}, ${price}"
        >
            <div class="plan-card-content">

                <div class="plan-card-top">

                    <div class="plan-data">
                        ${amount}
                    </div>

                    <div class="plan-price">
                        ${price}
                    </div>

                </div>

                <div class="plan-card-bottom">

                    <div class="plan-name">
                        ${name}
                    </div>

                    <div class="plan-validity">
                        ${validityText}
                    </div>

                </div>

            </div>
        </button>
    `;
}


/* ==========================================
   PLAN CARD EVENTS
========================================== */

function bindPlanCards() {

    const cards =
        plansContainer.querySelectorAll(
            ".plan-card"
        );

    cards.forEach(
        (card) => {

            card.addEventListener(
                "click",
                () => {

                    const planId =
                        card.dataset.planId;

                    const plan =
                        allPlans.find(
                            (item) =>
                                item.planId ===
                                planId &&
                                item.network ===
                                selectedNetwork
                        );

                    if (!plan) {
                        return;
                    }

                    selectedPlan =
                        plan;

                    cards.forEach(
                        (item) => {

                            item.classList.toggle(
                                "selected",
                                item === card
                            );
                        }
                    );

                    updateContinueButton();
                }
            );
        }
    );
}


/* ==========================================
   FORMAT PLAN PRICE
========================================== */

function formatPlanPrice(
    priceKobo
) {

    if (
        !Number.isSafeInteger(
            priceKobo
        ) ||
        priceKobo <= 0
    ) {

        return "₦--";
    }

    return formatKoboAsNaira(
        priceKobo
    );
}


/* ==========================================
   NETWORK SELECTION
========================================== */

networkCards.forEach(
    (card) => {

        card.addEventListener(
            "click",
            async () => {

                const network =
                    String(
                        card.dataset.network ||
                        ""
                    ).trim().toLowerCase();

                if (
                    !NETWORK_ORDER.includes(
                        network
                    )
                ) {

                    return;
                }

                selectedNetwork =
                    network;

                selectedPlan = null;

                networkCards.forEach(
                    (item) => {

                        item.classList.toggle(
                            "active",
                            item === card
                        );

                        item.setAttribute(
                            "aria-selected",
                            item === card
                                ? "true"
                                : "false"
                        );
                    }
                );

                updateCategoryTabVisibility();

                renderPlans();
            }
        );
    }
);


/* ==========================================
   INITIAL NETWORK STATE
========================================== */

function initializeNetworkSelection() {

    const matchingCard =
        [...networkCards].find(
            (card) =>
                String(
                    card.dataset.network ||
                    ""
                ).trim().toLowerCase() ===
                selectedNetwork
        );

    networkCards.forEach(
        (card) => {

            const active =
                card === matchingCard;

            card.classList.toggle(
                "active",
                active
            );

            card.setAttribute(
                "aria-selected",
                active
                    ? "true"
                    : "false"
            );
        }
    );
}

initializeNetworkSelection();


/* ==========================================
   PHONE NORMALIZATION
========================================== */

function normalizePhoneNumber(
    value
) {

    const digits =
        String(
            value || ""
        ).replace(
            /\D/g,
            ""
        );

    if (
        digits.startsWith("234")
    ) {

        return `0${digits.slice(3)}`;
    }

    return digits;
}


/* ==========================================
   PHONE VALIDATION
========================================== */

function isValidPhoneNumber(
    value
) {

    const phone =
        normalizePhoneNumber(
            value
        );

    return /^0\d{10}$/.test(
        phone
    );
}


/* ==========================================
   CONTINUE BUTTON
========================================== */

function updateContinueButton() {

    if (!continueBtn) {
        return;
    }

    const phoneValid =
        isValidPhoneNumber(
            phoneInput?.value
        );

    const planSelected =
        Boolean(
            selectedPlan
        );

    continueBtn.disabled =
        !phoneValid ||
        !planSelected ||
        purchaseInProgress;
}


/* ==========================================
   PHONE INPUT EVENTS
========================================== */

if (phoneInput) {

    phoneInput.addEventListener(
        "input",
        () => {

            updateContinueButton();
        }
    );

    phoneInput.addEventListener(
        "blur",
        () => {

            const value =
                phoneInput.value.trim();

            if (
                value &&
                !isValidPhoneNumber(
                    value
                )
            ) {

                showMessage(
                    "Enter a valid Nigerian phone number.",
                    "error"
                );
            }
        }
    );
}


/* ==========================================
   PURCHASE
========================================== */

if (continueBtn) {

    continueBtn.addEventListener(
        "click",
        async () => {

            await purchaseSelectedPlan();
        }
    );
}


/* ==========================================
   PURCHASE SELECTED PLAN
========================================== */

async function purchaseSelectedPlan() {

    if (
        purchaseInProgress
    ) {

        return;
    }

    if (!currentUser) {

        showMessage(
            "Please login again.",
            "error"
        );

        return;
    }

    if (!selectedPlan) {

        showMessage(
            "Please select a data plan.",
            "error"
        );

        return;
    }

    const phoneNumber =
        normalizePhoneNumber(
            phoneInput?.value
        );

    if (
        !isValidPhoneNumber(
            phoneNumber
        )
    ) {

        showMessage(
            "Enter a valid Nigerian phone number.",
            "error"
        );

        return;
    }

    /*
     * IMPORTANT:
     *
     * The frontend sends the identity of the
     * selected provider plan.
     *
     * It does NOT send:
     * - wallet balance
     * - price
     * - debit amount
     * - provider cost
     *
     * The backend remains authoritative.
     */

    purchaseInProgress = true;

    updateContinueButton();

    const originalText =
        continueBtn.textContent;

    continueBtn.textContent =
        "Processing...";

    try {

        const reference =
            createPurchaseReference();

        const response =
            await authenticatedFetch(
                "/api/data/purchase",
                {
                    method: "POST",

                    body: JSON.stringify({
                        phoneNumber,

                        network:
                            selectedPlan.networkId,

                        planId:
                            selectedPlan.planId,

                        reference
                    })
                }
            );

        const result =
            await readJsonResponse(
                response
            );

        if (
            response.status === 401
        ) {

            window.location.href =
                "login.html";

            return;
        }

        if (!response.ok) {

            throw new Error(
                result.error ||
                "Data purchase could not be completed."
            );
        }

        /*
         * Success is based on the backend
         * transaction state, not the frontend
         * card state.
         */

        if (
            result.status ===
            "successful"
        ) {

            showMessage(
                "Data purchase successful.",
                "success"
            );

            selectedPlan = null;

            await loadWalletBalance();

            renderPlans();

            return;
        }

        if (
            result.status ===
                "pending" ||
            result.status ===
                "unknown"
        ) {

            showMessage(
                "Your data purchase is being verified. Please check your transaction history shortly.",
                "info"
            );

            await loadWalletBalance();

            return;
        }

        throw new Error(
            result.error ||
            "Data purchase could not be completed."
        );

    } catch (error) {

        console.error(
            "NovaPay data purchase error:",
            error
        );

        showMessage(
            getSafePurchaseError(
                error
            ),
            "error"
        );

    } finally {

        purchaseInProgress =
            false;

        continueBtn.textContent =
            originalText;

        updateContinueButton();
    }
}


/* ==========================================
   PURCHASE REFERENCE
========================================== */

function createPurchaseReference() {

    if (
        window.crypto &&
        typeof window.crypto.randomUUID ===
            "function"
    ) {

        return `DATA_${window.crypto.randomUUID()}`;
    }

    const randomPart =
        Math.random()
            .toString(36)
            .slice(2, 12);

    return `DATA_${Date.now()}_${randomPart}`;
}


/* ==========================================
   SAFE PURCHASE ERROR
========================================== */

function getSafePurchaseError(
    error
) {

    const message =
        String(
            error?.message || ""
        ).toLowerCase();

    if (
        message.includes(
            "insufficient"
        ) ||
        message.includes(
            "balance"
        )
    ) {

        return "Insufficient wallet balance.";
    }

    if (
        message.includes(
            "phone"
        ) ||
        message.includes(
            "number"
        )
    ) {

        return "Please check the phone number and try again.";
    }

    if (
        message.includes(
            "plan"
        ) ||
        message.includes(
            "available"
        )
    ) {

        return "This data plan is currently unavailable.";
    }

    return (
        "We could not complete the data purchase. Please try again."
    );
}


/* ==========================================
   REFRESH BALANCE
========================================== */

if (refreshBalanceBtn) {

    refreshBalanceBtn.addEventListener(
        "click",
        async () => {

            await loadWalletBalance();
        }
    );
}


/* ==========================================
   CHECK BALANCE
========================================== */

if (checkBalanceBtn) {

    checkBalanceBtn.addEventListener(
        "click",
        async () => {

            await loadWalletBalance();

            showMessage(
                "Wallet balance refreshed.",
                "success"
            );
        }
    );
}


/* ==========================================
   BENEFICIARY
========================================== */

if (beneficiaryBtn) {

    beneficiaryBtn.addEventListener(
        "click",
        () => {

            showMessage(
                "Beneficiary management is not available on this page yet.",
                "info"
            );
        }
    );
}


/* ==========================================
   BACK BUTTON
========================================== */

if (backBtn) {

    backBtn.addEventListener(
        "click",
        () => {

            if (
                window.history.length > 1
            ) {

                window.history.back();

                return;
            }

            window.location.href =
                "index.html";
        }
    );
}


/* ==========================================
   SAFE HTML
========================================== */

function escapeHtml(
    value
) {

    return String(
        value ?? ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );
}


/* ==========================================
   USER MESSAGE
========================================== */

function showMessage(
    message,
    type = "info"
) {

    let element =
        document.getElementById(
            "dataMessage"
        );

    if (!element) {

        element =
            document.createElement(
                "div"
            );

        element.id =
            "dataMessage";

        element.setAttribute(
            "role",
            "status"
        );

        document.body.prepend(
            element
        );
    }

    element.textContent =
        String(
            message || ""
        );

    element.className =
        `data-message data-message-${type}`;

    clearTimeout(
        showMessage.timeout
    );

    showMessage.timeout =
        setTimeout(
            () => {

                element.textContent =
                    "";

                element.className =
                    "data-message";

            },
            5000
        );
}