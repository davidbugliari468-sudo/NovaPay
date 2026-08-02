/* ==========================================
NOVAPAY AIRTIME
========================================== */

/* ========= ELEMENTS ========= */

const backBtn = document.getElementById("backBtn");
const continueBtn = document.getElementById("continueBtn");

const phoneInput = document.getElementById("phoneNumber");
const amountInput = document.getElementById("amount");

const beneficiaryBtn = document.querySelector(".beneficiary-btn");

const networkCards =
document.querySelectorAll(".network-card");

/* ========= DEFAULT ========= */

let selectedNetwork = "";

/* ========= BACK ========= */

backBtn.addEventListener("click", () => {

    history.back();

});

/* ========= NETWORK ========= */

networkCards.forEach(card => {

    card.addEventListener("click", () => {

        networkCards.forEach(item =>
            item.classList.remove("active")
        );

        card.classList.add("active");

        selectedNetwork =
            card.dataset.network;

    });

});

/* ========= BENEFICIARY ========= */

beneficiaryBtn.addEventListener("click", () => {

    alert("Beneficiaries coming soon.");

});

/* ========= CONTINUE ========= */

continueBtn.addEventListener("click", () => {

    const phone =
        phoneInput.value.trim();

    const amount =
        amountInput.value.trim();

    if (!selectedNetwork) {

        alert("Please select a network.");

        return;

    }

    if (phone.length !== 11) {

        alert("Enter a valid 11-digit phone number.");

        return;

    }

    if (amount === "") {

        alert("Enter an amount.");

        return;

    }

    if (Number(amount) < 50) {

        alert("Minimum airtime amount is ₦50.");

        return;

    }

    // Save airtime purchase details

localStorage.setItem("paymentType", "airtime");

localStorage.setItem("airtimeNetwork", selectedNetwork);

localStorage.setItem("airtimePhone", phone);

localStorage.setItem("airtimeAmount", amount);

// Go to Transaction PIN page

window.location.href = "transaction-pin.html";

});

console.log("✅ Airtime Ready");