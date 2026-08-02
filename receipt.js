/* ==========================================
NOVAPAY RECEIPT
========================================== */

const transaction = JSON.parse(
    localStorage.getItem("selectedTransaction")
);

/* ==========================================
ELEMENTS
========================================== */

const backBtn = document.getElementById("backBtn");
const doneBtn = document.getElementById("doneBtn");
const supportBtn = document.getElementById("supportBtn");

/* ==========================================
BUTTONS
========================================== */

backBtn.onclick = () => {

    history.back();

};

doneBtn.onclick = () => {

    window.location.href = "transaction-history.html";

};

supportBtn.onclick = () => {

    alert("NovaPay Support will be available soon.");

};

/* ==========================================
LOAD RECEIPT
========================================== */

if (transaction) {

    const title = transaction.title || "Transaction";

    const amount = Number(transaction.amount || 0);

    const isCredit = transaction.type === "in";

    const amountText =
        `${isCredit ? "+" : "-"}₦${amount.toLocaleString()}.00`;

    /* Top */

    document.getElementById("transactionTitle").textContent =
        title;

    document.getElementById("transactionStatus").textContent =
        transaction.status || "Successful";

    document.getElementById("amount").textContent =
        amountText;

    /* Details */

    document.getElementById("amountText").textContent =
        amountText;

    document.getElementById("date").textContent =
        transaction.date || "--";

    document.getElementById("transactionId").textContent =
        transaction.id || "--";

    document.getElementById("category").textContent =
        title;

    document.getElementById("statusText").textContent =
        transaction.status || "Successful";

    /* Amount Color */

    const color = isCredit ? "#10B981" : "#EF4444";

    document.getElementById("amount").style.color =
        color;

    document.getElementById("amountText").style.color =
        color;

    /* Recipient */

    let recipient = "NovaPay Wallet";

    if (
        title.includes("Airtime") ||
        title.includes("Data")
    ) {

        recipient =
            transaction.phone ||
            transaction.recipient ||
            "Phone Number";

    }

    else if (title.includes("Electricity")) {

        recipient =
            transaction.meterNumber ||
            "Meter Number";

    }

    else if (title.includes("TV")) {

        recipient =
            transaction.smartCard ||
            "Smart Card Number";

    }

    else if (title.includes("Bet")) {

        recipient =
            transaction.customerId ||
            "Customer ID";

    }

    document.getElementById("recipient").textContent =
        recipient;

    /* Status Icon */

    const icon = document.getElementById("receiptIcon");

    if (transaction.status === "Pending") {

        icon.style.background = "#F59E0B";

        icon.innerHTML =
            '<i class="fas fa-clock"></i>';

    }

    else if (transaction.status === "Failed") {

        icon.style.background = "#EF4444";

        icon.innerHTML =
            '<i class="fas fa-times"></i>';

    }

    else {

        icon.style.background = "#10B981";

        icon.innerHTML =
            '<i class="fas fa-check"></i>';

    }

}

console.log("✅ Receipt Loaded");