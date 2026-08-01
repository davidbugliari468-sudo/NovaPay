// ==========================================
// NOVAPAY AIRTIME
// ==========================================

// Selected values
let selectedNetwork = "";
let selectedAmount = "";

// Elements
const networkCards = document.querySelectorAll(".network-card");
const amountButtons = document.querySelectorAll(".amount-btn");
const phoneInput = document.getElementById("phone");
const customAmount = document.getElementById("customAmount");
const continueButton = document.querySelector(".continue-btn");

// Disable Continue initially
continueButton.disabled = true;

// =========================
// SELECT NETWORK
// =========================

networkCards.forEach(card => {

    card.addEventListener("click", () => {

        networkCards.forEach(item => {
            item.classList.remove("active");
        });

        card.classList.add("active");

        selectedNetwork = card.innerText.trim();

        checkForm();

    });

});

// =========================
// SELECT AMOUNT
// =========================

amountButtons.forEach(button => {

    button.addEventListener("click", () => {

        amountButtons.forEach(item => {
            item.classList.remove("active");
        });

        button.classList.add("active");

        selectedAmount = button.innerText.replace("₦","").trim();

        customAmount.value = "";

        checkForm();

    });

});

// =========================
// CUSTOM AMOUNT
// =========================

customAmount.addEventListener("input", () => {

    amountButtons.forEach(item => {
        item.classList.remove("active");
    });

    selectedAmount = customAmount.value.trim();

    checkForm();

});

// =========================
// PHONE NUMBER
// =========================

phoneInput.addEventListener("input", () => {

    phoneInput.value = phoneInput.value.replace(/\D/g, "");

    checkForm();

});

// =========================
// CHECK FORM
// =========================

function checkForm(){ 
    // ==========================================
// CONTINUE
// ==========================================

continueButton.addEventListener("click", () => {

    const airtimeData = {

        network: selectedNetwork,

        phone: phoneInput.value,

        amount: selectedAmount,

        saveBeneficiary:
            document.querySelector(".save-box input").checked

    };

    localStorage.setItem(

        "airtimePurchase",

        JSON.stringify(airtimeData)

    );

    window.location.href = "review-airtime.html";

});

    const validPhone = phoneInput.value.length >= 11;

    const validAmount = selectedAmount !== "";

    const validNetwork = selectedNetwork !== "";

    continueButton.disabled = !(validPhone && validAmount && validNetwork);

}