/* ==========================================
   NOVAPAY ELECTRICITY
   MODULE 1
========================================== */

import { auth, db } from "./firebase.js";

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

let selectedCompany = "ikedc";

let selectedMeterType = "prepaid";

/* ==========================================
BACK BUTTON
========================================== */

backBtn.addEventListener("click", () => {

    window.location.href =
    "dashboard.html";

});

/* ==========================================
SELECT COMPANY
========================================== */

providers.forEach(provider => {

    provider.addEventListener("click", () => {

        providers.forEach(item =>
            item.classList.remove("active")
        );

        provider.classList.add("active");

        selectedCompany =
        provider.dataset.company;

    });

});

/* ==========================================
SELECT METER TYPE
========================================== */

meterTypes.forEach(type => {

    type.addEventListener("click", () => {

        meterTypes.forEach(item =>
            item.classList.remove("active")
        );

        type.classList.add("active");

        selectedMeterType =
        type.dataset.type;

    });

});

console.log("✅ Module 1 Loaded"); 
/* ==========================================
   MODULE 2
   VERIFY METER
========================================== */

const meterNumber =
document.getElementById("meterNumber");

verifyMeterBtn.addEventListener("click", () => {

    const meter =
    meterNumber.value.trim();

    if (meter === "") {

        alert("Please enter your meter number.");

        return;

    }

    verifyMeterBtn.disabled = true;

    verifyMeterBtn.textContent =
    "Verifying...";

    setTimeout(() => {

        customerName.textContent =
        "John Doe";

        customerAddress.textContent =
        "Lekki Phase 1, Lagos";

        customerCard.classList.remove("hidden");

        amountSection.classList.remove("hidden");

        continueBtn.classList.remove("hidden");

        verifyMeterBtn.disabled = false;

        verifyMeterBtn.textContent =
        "Verified ✓";

    }, 1500);

});

console.log("✅ Module 2 Loaded");
/* ==========================================
   MODULE 3
   CONTINUE
========================================== */

const amount =
document.getElementById("amount");

const walletBalance =
document.getElementById("walletBalance");

continueBtn.addEventListener("click", () => {

    const meter =
    meterNumber.value.trim();

    const amountValue =
    amount.value.trim();

    if (!meter) {

        alert("Please enter a meter number.");

        return;

    }

    if (!amountValue) {

        alert("Please enter an amount.");

        return;

    }

    const payment = {

        company: selectedCompany,

        meterType: selectedMeterType,

        meterNumber: meter,

        amount: amountValue,

        customerName: customerName.textContent,

        customerAddress: customerAddress.textContent

    };

    console.log("Electricity Payment");

    console.log(payment);

    alert("Electricity payment is ready for API connection.");

});

console.log("✅ Module 3 Loaded");