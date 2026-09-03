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

        MTN: "mtn",

        Airtel: "airtel",

        Glo: "glo",

        "9mobile": "9mobile"

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

        if (
            !result.success ||
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

        if (!allPlans.length) {

            plansContainer.innerHTML = `
                <div class="plans-empty">
                    No data plans are currently available.
                </div>
            `;

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
        typeof plan.variationId !== "string" ||
        !plan.variationId.trim()
    ) {

        return false;
    }

    if (
        typeof plan.network !== "string" ||
        !NETWORK_ORDER.includes(
            plan.network
        )
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
        !Number.isSafeInteger(
            plan.priceKobo
        ) ||
        plan.priceKobo < 0
    ) {

        return false;
    }

    if (
        typeof plan.priceNaira !== "number" ||
        !Number.isFinite(
            plan.priceNaira
        )
    ) {

        return false;
    }

    if (
        plan.customerPriceKobo !== undefined &&
        (
            !Number.isSafeInteger(
                plan.customerPriceKobo
            ) ||
            plan.customerPriceKobo < 0
        )
    ) {

        return false;
    }

    if (
        plan.categories !== undefined &&
        !Array.isArray(
            plan.categories
        )
    ) {

        return false;
    }

    return true;
}


/* ==========================================
   NORMALIZE PLAN CATEGORIES
========================================== */

function getPlanCategories(
    plan
) {

    const categories =
        new Set();

    /*
       New backend format:

       categories: [
           "Hot",
           "Daily",
           "Extra Value"
       ]
    */

    if (
        Array.isArray(
            plan.categories
        )
    ) {

        plan.categories.forEach(
            category => {

                const normalized =
                    normalizeCategory(
                        category
                    );

                if (
                    normalized !== "Other"
                ) {

                    categories.add(
                        normalized
                    );
                }
            }
        );
    }


    /*
       Backward compatibility with
       the previous single category field.
    */

    if (
        typeof plan.category ===
        "string"
    ) {

        const normalized =
            normalizeCategory(
                plan.category
            );

        if (
            normalized !== "Other"
        ) {

            categories.add(
                normalized
            );
        }
    }


    /*
       Backward compatibility with
       the previous isHot field.
    */

    if (
        plan.isHot === true
    ) {

        categories.add(
            "Hot"
        );
    }


    /*
       If the backend provided no
       recognized category, use Other.
    */

    if (!categories.size) {

        categories.add(
            "Other"
        );
    }

    return Array.from(
        categories
    );
}


/* ==========================================
   CATEGORY HELPERS
========================================== */

function normalizeCategory(
    category
) {

    if (
        typeof category !== "string"
    ) {

        return "Other";
    }

    const normalized =
        category.trim();

    const match =
        CATEGORY_ORDER.find(
            item =>
                item.toLowerCase() ===
                normalized.toLowerCase()
        );

    return match || "Other";
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

    return getPlanCategories(
        plan
    ).includes(
        normalizedCategory
    );
}


/* ==========================================
   SETUP CATEGORY TABS
========================================== */

function setupCategoryTabs() {

    if (!categoryTabs.length) {
        return;
    }

    const availableCategories =
        getAvailableCategories();

    categoryTabs.forEach(
        tab => {

            const label =
                getTabLabel(tab);

            const matchingCategory =
                findCategoryForTab(
                    label
                );

            if (!matchingCategory) {

                tab.style.display =
                    "none";

                return;
            }

            /*
               Only show a tab when at least
               one real backend plan belongs
               to that category somewhere
               in the catalog.
            */

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
                            selectedCategory
                        );
                    }
                );

                renderPlans();
            };
        }
    );


    /*
       Keep the current category when it
       exists. Otherwise select the first
       category with real plans.
    */

    if (
        !availableCategories.includes(
            selectedCategory
        )
    ) {

        selectedCategory =
            availableCategories[0] ||
            "Other";
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
        tab.textContent || ""
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

    const category =
        CATEGORY_ORDER.find(
            item =>
                item.toLowerCase() ===
                normalized
        );

    return category || null;
}


/* ==========================================
   AVAILABLE CATEGORIES
========================================== */

function getAvailableCategories() {

    const categories =
        new Set();

    allPlans.forEach(
        plan => {

            if (
                plan.availability === false
            ) {

                return;
            }

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

    return CATEGORY_ORDER.filter(
        category =>
            categories.has(
                category
            )
    );
}


/* ==========================================
   GET PLANS FOR CURRENT CATEGORY
========================================== */

function getPlansForCurrentSelection() {

    return allPlans
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
                for this network.
            </div>
        `;

        return;
    }


    /*
       Sort plans by customer price first,
       then by data amount when available.

       This keeps affordable options near
       the top without changing the
       provider's actual product identity.
    */

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

                const dataA =
                    getDataMegabytes(
                        a
                    );

                const dataB =
                    getDataMegabytes(
                        b
                    );

                return dataB -
                    dataA;
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
                        event.key ===
                        "Enter" ||
                        event.key ===
                        " "
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
   GET CUSTOMER PRICE
========================================== */

function getCustomerPriceKobo(
    plan
) {

    if (
        Number.isSafeInteger(
            plan.customerPriceKobo
        ) &&
        plan.customerPriceKobo >= 0
    ) {

        return plan.customerPriceKobo;
    }

    return plan.priceKobo;
}


/* ==========================================
   DATA AMOUNT DISPLAY
========================================== */

function getDisplayDataAmount(
    plan
) {

    if (
        typeof plan.dataAmount ===
        "string" &&
        plan.dataAmount.trim()
    ) {

        return plan.dataAmount;
    }

    if (
        typeof plan.dataPlan ===
        "string" &&
        plan.dataPlan.trim()
    ) {

        return plan.dataPlan;
    }

    return "Data bundle";
}


/* ==========================================
   DATA AMOUNT FOR SORTING
========================================== */

function getDataMegabytes(
    plan
) {

    if (
        Number.isFinite(
            plan.dataMegabytes
        )
    ) {

        return Number(
            plan.dataMegabytes
        );
    }

    const text =
        String(
            plan.dataPlan || ""
        )
            .toLowerCase();

    const match =
        text.match(
            /([\d.]+)\s*(gb|mb)/
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
        )
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
   VALIDITY DISPLAY
========================================== */

function getDisplayValidity(
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
        )
    ) {

        const days =
            Number(
                plan.validityDays
            );

        return `${days} ${
            days === 1
                ? "day"
                : "days"
        }`;
    }

    return extractValidity(
        plan.dataPlan
    );
}


/* ==========================================
   PLAN PRICE
========================================== */

function formatPlanPrice(
    plan
) {

    return formatKoboAsNaira(
        getCustomerPriceKobo(
            plan
        )
    );
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
            /(\d+(?:\.\d+)?)\s*(day|days|week|weeks|month|months)/i
        );

    if (!match) {

        return "";
    }

    return `${match[1]} ${match[2]}`;
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
        /^8\d{10}$/.test(phone)
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
   GENERATE PURCHASE REFERENCE
========================================== */

function createPurchaseReference() {

    if (
        typeof crypto !==
        "undefined" &&
        typeof crypto.randomUUID ===
        "function"
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
            phoneResult.phone
        );
    }
);


/* ==========================================
   PURCHASE DATA
========================================== */

async function purchaseData(
    phoneNumber
) {

    if (
        !selectedPlan
    ) {

        alert(
            "Please select a data plan."
        );

        return;
    }

    purchaseInProgress = true;

    setPurchaseButtonState(
        true
    );


    /*
       Generate one reference for this
       purchase attempt.

       Never silently regenerate a new
       reference after an ambiguous error.
    */

    const reference =
        createPurchaseReference();

    try {

        /*
           Only send data required by the
           backend.

           The client never controls:

           - price
           - amount
           - provider cost
           - wallet balance
           - profit
           - reseller price
        */

        const response =
            await authenticatedFetch(
                "/api/data/purchase",
                {
                    method: "POST",

                    body: JSON.stringify({

                        phoneNumber,

                        network:
                            selectedNetwork,

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
            response.status === 401
        ) {

            alert(
                "Your session has expired. Please login again."
            );

            window.location.href =
                "login.html";

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
            response.status === 400 ||
            result.status === "failed"
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
           If the request may have reached
           the backend but the browser cannot
           determine the response, never
           automatically retry.

           The customer must check history
           before making another attempt.
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
        typeof result?.error ===
        "string"
            ? result.error.trim()
            : "";

    const safeMessages =
        new Set([
            "Invalid phone number.",
            "Enter a valid Nigerian phone number.",
            "Invalid network.",
            "Unsupported network.",
            "Invalid data plan.",
            "Data plan is not available.",
            "Insufficient wallet balance.",
            "Please select a data plan.",
            "Please enter a valid Nigerian phone number.",
            "A purchase with this reference already exists.",
            "Data purchase failed.",
            "Data service is temporarily unavailable. Please try again later.",
            "Data provider is temporarily unavailable. Please try again later."
        ]);

    if (
        safeMessages.has(error)
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
   DATA BALANCE
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

                /*
                   Re-evaluate categories for
                   the newly selected network.

                   This prevents the user from
                   staying on a category that has
                   no products for that network.
                */

                const networkCategories =
                    getAvailableCategoriesForNetwork();

                if (
                    !networkCategories.includes(
                        selectedCategory
                    )
                ) {

                    selectedCategory =
                        networkCategories[0] ||
                        "Other";
                }

                updateCategoryTabVisibility();

                renderPlans();
            }
        );
    }
);


/* ==========================================
   AVAILABLE CATEGORIES FOR NETWORK
========================================== */

function getAvailableCategoriesForNetwork() {

    const categories =
        new Set();

    allPlans.forEach(
        plan => {

            if (
                plan.network !==
                selectedNetwork
            ) {

                return;
            }

            if (
                plan.availability === false
            ) {

                return;
            }

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

    return CATEGORY_ORDER.filter(
        category =>
            categories.has(
                category
            )
    );
}


/* ==========================================
   UPDATE CATEGORY TAB VISIBILITY
========================================== */

function updateCategoryTabVisibility() {

    const availableCategories =
        getAvailableCategoriesForNetwork();

    categoryTabs.forEach(
        tab => {

            const category =
                tab.dataset.category;

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