// ==========================================
// NOVAPAY SUCCESS PAGE
// ==========================================

// Get saved purchase
const airtimeData = JSON.parse(
    localStorage.getItem("airtimePurchase")
);

// Redirect if no purchase exists
if (!airtimeData) {

    window.location.href = "airtime.html";

}

// Display purchase details
document.getElementById("network").textContent =
    airtimeData.network;

document.getElementById("phone").textContent =
    airtimeData.phone;

document.getElementById("amount").textContent =
    "₦" + airtimeData.amount;

// Generate Reference Number
const reference =
    "NP" + Date.now();

document.getElementById("reference").textContent =
    reference;

// Clear temporary purchase data
localStorage.removeItem("airtimePurchase");

// Back to Dashboard
document.querySelector(".done-btn")
.addEventListener("click", () => {

    window.location.href = "dashboard.html";

}); 