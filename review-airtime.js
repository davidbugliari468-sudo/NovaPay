// ==========================================
// NOVAPAY REVIEW AIRTIME
// ==========================================

// Read Airtime Data
const airtimeData = JSON.parse(
    localStorage.getItem("airtimePurchase")
);

// If no data exists, return to Airtime page
if (!airtimeData) {

    window.location.href = "airtime.html";

}

// Display data
document.getElementById("network").textContent =
    airtimeData.network;

document.getElementById("phone").textContent =
    airtimeData.phone;

document.getElementById("amount").textContent =
    "₦" + airtimeData.amount;

document.getElementById("beneficiary").textContent =
    airtimeData.saveBeneficiary ? "Yes" : "No";

// Confirm Purchase
const confirmButton =
    document.querySelector(".confirm-btn");

confirmButton.addEventListener("click", () => {

    window.location.href = "success-airtime.html";

});