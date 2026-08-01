// ==========================================
// NOVAPAY REVIEW AIRTIME
// ==========================================

import { auth } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

// Airtime Data
const airtimeData = JSON.parse(
    localStorage.getItem("airtimePurchase")
);

if (!airtimeData) {

    window.location.href = "airtime.html";

}

// Display Purchase Details
document.getElementById("network").textContent =
    airtimeData.network;

document.getElementById("phone").textContent =
    airtimeData.phone;

document.getElementById("amount").textContent =
    "₦" + airtimeData.amount;

document.getElementById("beneficiary").textContent =
    airtimeData.saveBeneficiary ? "Yes" : "No";

const confirmButton =
    document.querySelector(".confirm-btn");

let currentUser = null;

// Check Authentication
onAuthStateChanged(auth, (user) => {

    if (!user) {

        window.location.href = "login.html";
        return;

    }

    currentUser = user;

});

// Confirm Purchase
confirmButton.addEventListener("click", async () => {

    if (!currentUser) {

        alert("Please login again.");

        return;

    }

    confirmButton.disabled = true;
    confirmButton.textContent = "Processing...";

    try {

        const response = await fetch(

            "https://novapay-server.onrender.com/api/buy-airtime",

            {

                method: "POST",

                headers: {

                    "Content-Type": "application/json"

                },

                body: JSON.stringify({

                    uid: currentUser.uid,

                    network: airtimeData.network,

                    phone: airtimeData.phone,

                    amount: Number(airtimeData.amount)

                })

            }

        );

        const result = await response.json();

        if (!response.ok || !result.success) {

            alert(result.message);

            confirmButton.disabled = false;
            confirmButton.textContent = "Confirm Purchase";

            return;

        }

        localStorage.setItem(
            "lastReference",
            result.reference || ""
        );

        localStorage.removeItem(
            "airtimePurchase"
        );

        window.location.href =
            "success-airtime.html";

    } catch (error) {

        console.error(error);

        alert("Unable to connect to NovaPay server.");

        confirmButton.disabled = false;
        confirmButton.textContent =
            "Confirm Purchase";

    }

});