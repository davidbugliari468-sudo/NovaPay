/* ==========================================
   NOVAPAY TV SUBSCRIPTION
   MODULE 1
========================================== */

import { auth, db } from "./firebase.js";

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

let selectedProvider = "gotv";

/* ==========================================
BACK BUTTON
========================================== */

backBtn?.addEventListener("click", () => {

    window.location.href =
    "dashboard.html";

});

/* ==========================================
TV PROVIDER
========================================== */

providers.forEach(provider => {

    provider.addEventListener("click", () => {

        providers.forEach(item =>
            item.classList.remove("active")
        );

        provider.classList.add("active");

        selectedProvider =
        provider.dataset.provider;

    });

});

console.log("✅ TV Module 1 Loaded");
/* ==========================================
   MODULE 2
   VERIFY SMARTCARD
========================================== */

const smartcardNumber =
document.getElementById("smartcardNumber");

const packageSelect =
document.getElementById("packageSelect");

const walletBalance =
document.getElementById("walletBalance");

verifyCardBtn.addEventListener("click", () => {

    const card =
    smartcardNumber.value.trim();

    if(card === ""){

        alert("Please enter your smartcard number.");

        return;

    }

    verifyCardBtn.disabled = true;

    verifyCardBtn.textContent =
    "Verifying...";

    setTimeout(() => {

        customerName.textContent =
        "John Anderson";

        currentPackage.textContent =
        "GOtv Max";

        customerStatus.textContent =
        "Active";

        customerCard.classList.remove("hidden");

        packageSection.classList.remove("hidden");

        continueBtn.classList.remove("hidden");

        walletBalance.textContent =
        "₦0.00";

        verifyCardBtn.textContent =
        "Verified ✓";

        verifyCardBtn.disabled = false;

    },1500);

});

console.log("✅ TV Module 2 Loaded");
/* ==========================================
   MODULE 3
   CONTINUE PAYMENT
========================================== */

continueBtn.addEventListener("click", () => {

    const smartcard =
    smartcardNumber.value.trim();

    const selectedPackage =
    packageSelect.value;

    if (!smartcard) {

        alert("Please enter your smartcard number.");

        return;

    }

    if (!selectedPackage) {

        alert("Please select a TV package.");

        return;

    }

    const payment = {

        provider: selectedProvider,

        smartcardNumber: smartcard,

        package: selectedPackage,

        customerName: customerName.textContent,

        currentPackage: currentPackage.textContent,

        status: customerStatus.textContent

    };

    console.log("TV Subscription");

    console.log(payment);

    alert("TV subscription is ready for API connection.");

});

console.log("✅ TV Module 3 Loaded");