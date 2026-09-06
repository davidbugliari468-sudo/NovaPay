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

for (const [name, element] of requiredElements) {

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

let selectedNetwork = "1";

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
        "1",
        "3",
        "2",
        "4"
    ]);


/* ==========================================
   NETWORK DISPLAY NAMES
========================================== */

const NETWORK_NAMES =
    Object.freeze({

        "1": "MTN",

        "2": "GLO",

        "3": "Airtel",

        "4": "9mobile"

    });


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
        "SME"
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
                "NovaPay Data initialization error:",
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
   HANDLE AUTH FAILURE
========================================== */

function handleUnauthorized(
    response
) {

    if (
        response.status !== 401
    ) {

        return false;
    }

    currentUser = null;

    window.location.href =
        "login.html";

    return true;
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
            handleUnauthorized(
                response
            )
        ) {

            return;
        }

        if (!response.ok) {

            throw new Error(
                result?.error ||
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

        if (walletBalance) {

            walletBalance.textContent =
                "₦--";
        }

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

    const candidates = [
        result?.balanceKobo,
        result?.wallet?.balanceKobo,
        result?.data?.balanceKobo
    ];

    for (
        const candidate
        of candidates
    ) {

        if (
            Number.isSafeInteger(
                candidate
            )
        ) {

            return candidate;
        }
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

    if (
        !Number.isSafeInteger(
            kobo
        ) ||
        kobo < 0
    ) {

        return "₦--";
    }

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
            handleUnauthorized(
                response
            )
        ) {

            return;
        }

        if (!response.ok) {

            throw new Error(
                result?.error ||
                "Unable to load data plans."
            );
        }

        if (
            result?.ok !== true ||
            !Array.isArray(
                result.plans
            )
        ) {

            throw new Error(
                "Server returned an invalid data catalog."
            );
        }

        const validPlans =
            result.plans.filter(
                isValidPlan
            );

        allPlans =
            validPlans.map(
                plan => ({
                    ...plan,
                    _isHot: false
                })
            );

        if (!allPlans.length) {

            plansContainer.innerHTML = `
                <div class="plans-empty">
                    No data plans are currently available.
                </div>
            `;

            updateCategoryTabVisibility();

            return;
        }

        setupCategoryTabs();

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
        !plan.planId.trim()
    ) {

        return false;
    }

    if (
        typeof plan.networkId !== "string" ||
        !NETWORK_ORDER.includes(
            plan.networkId
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

    /*
       priceKobo is the customer-facing
       amount returned by the NovaPay backend.

       The frontend never calculates or
       overrides the purchase amount.
    */

    if (
        !Number.isSafeInteger(
            plan.priceKobo
        ) ||
        plan.priceKobo <= 0
    ) {

        return false;
    }

    /*
       priceNaira is optional because
       priceKobo is the authoritative
       money representation.
    */

    if (
        plan.priceNaira !== undefined &&
        (
            typeof plan.priceNaira !== "number" ||
            !Number.isFinite(
                plan.priceNaira
            ) ||
            plan.priceNaira <= 0
        )
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
   CUSTOMER PRICE
========================================== */

function getCustomerPriceKobo(
    plan
) {

    if (
        !plan ||
        !Number.isSafeInteger(
            plan.priceKobo
        ) ||
        plan.priceKobo <= 0
    ) {

        return 0;
    }

    return plan.priceKobo;
}


/* ==========================================
   DATA AMOUNT EXTRACTION
========================================== */

function getDataMegabytes(
    plan
) {

    const text =
        String(
            plan?.planName || ""
        )
            .toLowerCase();

    const match =
        text.match(
            /([\d.]+)\s*(gb|mb)\b/
        );

    if (!match) {

        return 0;
    }

    const value =
        Number(
            match[1]
        );

    if (
        !Number.isFinite(
            value
        ) ||
        value <= 0
    ) {

        return 0;
    }

    if (
        match[2] === "gb"
    ) {

        return value * 1024;
    }

    return value;
}


/* ==========================================
   DISPLAY DATA AMOUNT
========================================== */

function getDisplayDataAmount(
    plan
) {

    const text =
        String(
            plan?.planName || ""
        ).trim();

    const match =
        text.match(
            /([\d.]+\s*(?:GB|MB))/i
        );

    if (match) {

        return match[1];
    }

    return text || "Data bundle";
}


/* ==========================================
   DISPLAY VALIDITY
========================================== */

function getDisplayValidity(
    plan
) {

    return String(
        plan?.validity || ""
    ).trim();
}


/* ==========================================
   PLAN PRICE
========================================== */

function formatPlanPrice(
    plan
) {

    const priceKobo =
        getCustomerPriceKobo(
            plan
        );

    if (
        priceKobo <= 0
    ) {

        return "Price unavailable";
    }

    return formatKoboAsNaira(
        priceKobo
    );
}


/* ==========================================
   PARSE VALIDITY DAYS
========================================== */

function getValidityDays(
    plan
) {

    const validity =
        String(
            plan?.validity || ""
        )
            .trim()
            .toLowerCase();

    const match =
        validity.match(
            /(\d+(?:\.\d+)?)\s*(day|days|week|weeks|month|months)/
        );

    if (!match) {

        return 0;
    }

    const value =
        Number(
            match[1]
        );

    if (
        !Number.isFinite(
            value
        ) ||
        value <= 0
    ) {

        return 0;
    }

    const unit =
        match[2];

    if (
        unit === "day" ||
        unit === "days"
    ) {

        return value;
    }

    if (
        unit === "week" ||
        unit === "weeks"
    ) {

        return value * 7;
    }

    return value * 30;
}


/* ==========================================
   CATEGORY HELPERS
========================================== */

function getPlanCategories(
    plan
) {

    const categories =
        new Set();

    const validityDays =
        getValidityDays(
            plan
        );

    const planType =
        String(
            plan?.planType || ""
        )
            .trim()
            .toLowerCase();

    const planName =
        String(
            plan?.planName || ""
        )
            .trim()
            .toLowerCase();


    /* ==========================
       REAL PLAN TYPE
    ========================== */

    if (
        planType === "sme"
    ) {

        categories.add(
            "SME"
        );
    }


    /* ==========================
       VALIDITY CATEGORIES
    ========================== */

    if (
        validityDays > 0 &&
        validityDays <= 3
    ) {

        categories.add(
            "Daily"
        );
    }

    if (
        validityDays >= 4 &&
        validityDays <= 14
    ) {

        categories.add(
            "Weekly"
        );
    }

    if (
        validityDays >= 15 &&
        validityDays <= 45
    ) {

        categories.add(
            "Monthly"
        );
    }

    if (
        validityDays >= 60 &&
        validityDays <= 120
    ) {

        categories.add(
            "3 Months"
        );
    }


    /* ==========================
       PROVIDER-NAME CATEGORIES
    ========================== */

    if (
        /\brouter\b/i.test(
            planName
        )
    ) {

        categories.add(
            "Router"
        );
    }

    if (
        /\bsocial\b/i.test(
            planName
        )
    ) {

        categories.add(
            "Social"
        );
    }

    if (
        /\bnight\b/i.test(
            planName
        )
    ) {

        categories.add(
            "Night"
        );
    }


    /* ==========================
       NOVAPAY EXTRA VALUE
    ========================== */

    if (
        isExtraValuePlan(
            plan
        )
    ) {

        categories.add(
            "Extra Value"
        );
    }


    return Array.from(
        categories
    );
}


/* ==========================================
   EXTRA VALUE
========================================== */

function isExtraValuePlan(
    plan
) {

    const megabytes =
        getDataMegabytes(
            plan
        );

    const priceKobo =
        getCustomerPriceKobo(
            plan
        );

    if (
        megabytes <= 0 ||
        priceKobo <= 0
    ) {

        return false;
    }

    const naira =
        priceKobo / 100;

    if (
        naira <= 0
    ) {

        return false;
    }

    const mbPerNaira =
        megabytes / naira;

    return mbPerNaira >= 8;
} 
/* ==========================================
   HOT PLANS
========================================== */

function getHotPlans(
    plans
) {

    const sorted =
        [...plans].sort(
            (a, b) => {

                const priceDifference =
                    getCustomerPriceKobo(a) -
                    getCustomerPriceKobo(b);

                if (
                    priceDifference !== 0
                ) {

                    return priceDifference;
                }

                const dataDifference =
                    getDataMegabytes(b) -
                    getDataMegabytes(a);

                if (
                    dataDifference !== 0
                ) {

                    return dataDifference;
                }

                return String(
                    a.planId
                ).localeCompare(
                    String(
                        b.planId
                    )
                );
            }
        );

    return new Set(
        sorted
            .slice(0, 6)
            .map(
                plan =>
                    plan.planId
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
        category
            .trim()
            .toLowerCase();

    return (
        CATEGORY_ORDER.find(
            item =>
                item.toLowerCase() ===
                normalized
        ) || null
    );
}


/* ==========================================
   PLAN BELONGS TO CATEGORY
========================================== */

function planBelongsToCategory(
    plan,
    category
) {

    const normalizedCategory =
        normalizeCategory(
            category
        );

    if (!normalizedCategory) {

        return false;
    }

    if (
        normalizedCategory === "Hot"
    ) {

        return Boolean(
            plan?._isHot
        );
    }

    return getPlanCategories(
        plan
    ).includes(
        normalizedCategory
    );
}


/* ==========================================
   GET AVAILABLE CATEGORIES
========================================== */

function getAvailableCategoriesForNetwork() {

    const networkPlans =
        allPlans.filter(
            plan =>
                plan.networkId ===
                selectedNetwork
        );

    if (!networkPlans.length) {

        return [];
    }

    const categories =
        new Set();

    networkPlans.forEach(
        plan => {

            getPlanCategories(
                plan
            ).forEach(
                category => {

                    categories.add(
                        category
                    );
                }
            );
        }
    );

    if (
        networkPlans.some(
            plan =>
                plan._isHot
        )
    ) {

        categories.add(
            "Hot"
        );
    }

    return CATEGORY_ORDER.filter(
        category =>
            categories.has(
                category
            )
    );
}


/* ==========================================
   SETUP CATEGORY TABS
========================================== */

function setupCategoryTabs() {

    if (!categoryTabs.length) {

        return;
    }

    const networkPlans =
        allPlans.filter(
            plan =>
                plan.networkId ===
                selectedNetwork
        );

    const hotPlanIds =
        getHotPlans(
            networkPlans
        );

    allPlans =
        allPlans.map(
            plan => ({
                ...plan,
                _isHot:
                    hotPlanIds.has(
                        plan.planId
                    )
            })
        );

    const availableCategories =
        getAvailableCategoriesForNetwork();

    categoryTabs.forEach(
        tab => {

            const label =
                getTabLabel(
                    tab
                );

            const matchingCategory =
                findCategoryForTab(
                    label
                );

            if (!matchingCategory) {

                tab.style.display =
                    "none";

                return;
            }

            const categoryExists =
                availableCategories.includes(
                    matchingCategory
                );

            tab.style.display =
                categoryExists
                    ? ""
                    : "none";

            tab.dataset.category =
                matchingCategory;

            tab.classList.toggle(
                "active",
                matchingCategory ===
                selectedCategory &&
                categoryExists
            );

            tab.onclick = () => {

                if (
                    purchaseInProgress
                ) {

                    return;
                }

                if (
                    !availableCategories.includes(
                        matchingCategory
                    )
                ) {

                    return;
                }

                selectedCategory =
                    matchingCategory;

                categoryTabs.forEach(
                    item => {

                        item.classList.toggle(
                            "active",
                            item.dataset.category ===
                            selectedCategory &&
                            item.style.display !==
                            "none"
                        );
                    }
                );

                renderPlans();
            };
        }
    );

    if (
        !availableCategories.includes(
            selectedCategory
        )
    ) {

        selectedCategory =
            availableCategories[0] ||
            "Hot";
    }

    categoryTabs.forEach(
        tab => {

            tab.classList.toggle(
                "active",
                tab.dataset.category ===
                selectedCategory &&
                tab.style.display !==
                "none"
            );
        }
    );
}


/* ==========================================
   GET TAB LABEL
========================================== */

function getTabLabel(
    tab
) {

    return String(
        tab?.textContent || ""
    )
        .replace(
            "🔥",
            ""
        )
        .trim();
}


/* ==========================================
   FIND CATEGORY FOR TAB
========================================== */

function findCategoryForTab(
    label
) {

    const normalized =
        String(
            label || ""
        )
            .trim()
            .toLowerCase();

    return (
        CATEGORY_ORDER.find(
            item =>
                item.toLowerCase() ===
                normalized
        ) || null
    );
}


/* ==========================================
   UPDATE CATEGORY VISIBILITY
========================================== */

function updateCategoryTabVisibility() {

    const availableCategories =
        getAvailableCategoriesForNetwork();

    categoryTabs.forEach(
        tab => {

            const category =
                tab.dataset.category ||
                findCategoryForTab(
                    getTabLabel(tab)
                );

            if (!category) {

                tab.style.display =
                    "none";

                return;
            }

            const available =
                availableCategories.includes(
                    category
                );

            tab.style.display =
                available
                    ? ""
                    : "none";

            tab.dataset.category =
                category;

            tab.classList.toggle(
                "active",
                available &&
                category ===
                selectedCategory
            );
        }
    );
}


/* ==========================================
   GET PLANS FOR CURRENT SELECTION
========================================== */

function getPlansForCurrentSelection() {

    return allPlans
        .filter(
            plan =>
                plan.networkId ===
                selectedNetwork
        )
        .filter(
            plan =>
                plan.status ===
                "active"
        )
        .filter(
            plan =>
                planBelongsToCategory(
                    plan,
                    selectedCategory
                )
        );
}


/* ==========================================
   RENDER PLANS
========================================== */

function renderPlans() {

    if (!plansContainer) {

        return;
    }

    selectedPlan = null;

    plansContainer.innerHTML = "";

    const plans =
        getPlansForCurrentSelection();

    if (!plans.length) {

        plansContainer.innerHTML = `
            <div class="plans-empty">
                No ${escapeHtml(
                    selectedCategory
                ).toLowerCase()}
                data plans are currently available
                for ${escapeHtml(
                    NETWORK_NAMES[selectedNetwork] ||
                    "this network"
                )}.
            </div>
        `;

        return;
    }

    const sortedPlans =
        [...plans].sort(
            (a, b) => {

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

                    return priceA -
                        priceB;
                }

                const dataDifference =
                    getDataMegabytes(b) -
                    getDataMegabytes(a);

                if (
                    dataDifference !== 0
                ) {

                    return dataDifference;
                }

                return String(
                    a.planId
                ).localeCompare(
                    String(
                        b.planId
                    )
                );
            }
        );

    sortedPlans.forEach(
        plan => {

            const card =
                document.createElement(
                    "div"
                );

            card.className =
                "plan-card";

            card.setAttribute(
                "role",
                "button"
            );

            card.setAttribute(
                "tabindex",
                "0"
            );

            card.setAttribute(
                "aria-label",
                `${getDisplayDataAmount(plan)} ${getDisplayValidity(plan)} ${formatPlanPrice(plan)}`
            );

            card.dataset.planId =
                plan.planId;


            /* ==========================
               DATA SIZE
            ========================== */

            const size =
                document.createElement(
                    "div"
                );

            size.className =
                "plan-size";

            size.textContent =
                getDisplayDataAmount(
                    plan
                );


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
                getDisplayValidity(
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

            const selectPlan =
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
                };


            card.addEventListener(
                "click",
                selectPlan
            );


            card.addEventListener(
                "keydown",
                event => {

                    if (
                        event.key === "Enter" ||
                        event.key === " "
                    ) {

                        event.preventDefault();

                        selectPlan();
                    }
                }
            );

            plansContainer.appendChild(
                card
            );
        }
    );
}


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
                /[\s\-().]/g,
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

    } else if (
        /^8\d{9}$/.test(
            phone
        )
    ) {

        phone =
            "0" +
            phone;
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
   PURCHASE REFERENCE
========================================== */

function createPurchaseReference() {

    if (
        typeof crypto !== "undefined" &&
        typeof crypto.randomUUID === "function"
    ) {

        return crypto.randomUUID();
    }

    const timestamp =
        Date.now().toString(36);

    const random =
        Math.random()
            .toString(36)
            .slice(2, 14);

    return `DATA-${timestamp}-${random}`;
}


/* ==========================================
   CONTINUE BUTTON
========================================== */

if (continueBtn) {

    continueBtn.addEventListener(
        "click",
        async () => {

            if (
                purchaseInProgress
            ) {

                return;
            }

            if (!currentUser) {

                alert(
                    "Your session has expired. Please login again."
                );

                window.location.href =
                    "login.html";

                return;
            }

            const phoneResult =
                validatePhoneNumber(
                    phoneInput?.value
                );

            if (!phoneResult.valid) {

                alert(
                    "Please enter a valid Nigerian phone number."
                );

                phoneInput?.focus();

                return;
            }

            if (!selectedPlan) {

                alert(
                    "Please select a data plan."
                );

                return;
            }

            await purchaseData(
                phoneResult.phone
            );
        }
    );
}


/* ==========================================
   PURCHASE DATA
========================================== */

async function purchaseData(
    phoneNumber
) {

    if (!selectedPlan) {

        alert(
            "Please select a data plan."
        );

        return;
    }

    if (!currentUser) {

        alert(
            "Your session has expired. Please login again."
        );

        window.location.href =
            "login.html";

        return;
    }

    purchaseInProgress = true;

    setPurchaseButtonState(
        true
    );

    /*
       One reference belongs to this
       purchase attempt.

       Never automatically create a
       second reference after an
       ambiguous response.
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


        /* ==========================
           AUTH
        ========================== */

        if (
            handleUnauthorized(
                response
            )
        ) {

            return;
        }


        /* ==========================
           SUCCESS
        ========================== */

        if (
            response.ok &&
            result?.ok === true &&
            result?.status === "successful"
        ) {

            alert(
                "Data purchase successful."
            );

            selectedPlan =
                null;

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
            result?.status === "pending" ||
            result?.status === "unknown"
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
            response.status === 400 ||
            result?.status === "failed" ||
            result?.ok === false
        ) {

            alert(
                getSafePurchaseError(
                    result
                )
            );

            await loadWalletBalance();

            return;
        }


        /* ==========================
           OTHER SERVER ERROR
        ========================== */

        throw new Error(
            "Data purchase could not be completed."
        );

    } catch (error) {

        console.error(
            "NovaPay Data purchase error:",
            error
        );

        /*
           If the browser cannot establish
           what happened, never retry
           automatically.

           The backend may already have
           created a reservation or sent
           the provider request.
        */

        alert(
            "We could not confirm the purchase status. Please check your transaction history before trying again."
        );

    } finally {

        purchaseInProgress = false;

        setPurchaseButtonState(
            false
        );
    }
}


/* ==========================================
   SAFE PURCHASE ERROR
========================================== */

function getSafePurchaseError(
    result
) {

    const error =
        typeof result?.error === "string"
            ? result.error.trim()
            : "";

    const safeMessages =
        new Set([
            "Invalid Data purchase information.",
            "Invalid Data plan filter",
            "Invalid phone number.",
            "Enter a valid Nigerian phone number.",
            "Invalid network.",
            "Unsupported network.",
            "Invalid data plan.",
            "Data plan is not available.",
            "The selected Data plan is no longer available. Please refresh and try again.",
            "Selected Data plan is no longer available",
            "Selected Data plan does not match the network",
            "Selected Data plan is invalid",
            "Insufficient wallet balance",
            "Insufficient wallet balance.",
            "Please select a data plan.",
            "Please enter a valid Nigerian phone number.",
            "A purchase with this reference already exists.",
            "Data purchase failed.",
            "Data purchase could not be completed.",
            "Data service is temporarily unavailable.",
            "Data service is temporarily busy."
        ]);

    if (
        safeMessages.has(
            error
        )
    ) {

        return error;
    }

    return "Data purchase failed. Please try again.";
}


/* ==========================================
   BUTTON STATE
========================================== */

function setPurchaseButtonState(
    processing
) {

    if (!continueBtn) {

        return;
    }

    continueBtn.disabled =
        processing;

    if (processing) {

        if (
            !continueBtn.dataset
                .originalText
        ) {

            continueBtn.dataset
                .originalText =
                continueBtn.textContent;
        }

        continueBtn.textContent =
            "Processing...";

    } else {

        continueBtn.textContent =
            continueBtn.dataset
                .originalText ||
            "Continue";
    }
}


/* ==========================================
   BACK BUTTON
========================================== */

if (backBtn) {

    backBtn.addEventListener(
        "click",
        () => {

            history.back();
        }
    );
}


/* ==========================================
   BENEFICIARIES
========================================== */

if (beneficiaryBtn) {

    beneficiaryBtn.addEventListener(
        "click",
        () => {

            alert(
                "Beneficiaries coming soon."
            );
        }
    );
}


/* ==========================================
   REFRESH WALLET
========================================== */

if (refreshBalanceBtn) {

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
}


/* ==========================================
   DATA BALANCE
========================================== */

if (checkBalanceBtn) {

    checkBalanceBtn.addEventListener(
        "click",
        () => {

            alert(
                "Use *323*4# on your phone to check your data balance."
            );
        }
    );
}


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

                const networkCategories =
                    getAvailableCategoriesForNetwork();

                if (
                    !networkCategories.includes(
                        selectedCategory
                    )
                ) {

                    selectedCategory =
                        networkCategories[0] ||
                        "Hot";
                }

                updateCategoryTabVisibility();

                renderPlans();
            }
        );
    }
);


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

        card.classList.toggle(
            "active",
            backendNetwork ===
            selectedNetwork
        );
    }
);


/* ==========================================
   ESCAPE HTML
========================================== */

function escapeHtml(
    value
) {

    return String(
        value || ""
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
   READY
========================================== */

console.log(
    "NovaPay Data frontend connected."
);