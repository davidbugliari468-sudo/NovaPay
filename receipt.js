const transaction = JSON.parse(
    localStorage.getItem("selectedTransaction")
);

const backBtn = document.getElementById("backBtn");
const doneBtn = document.getElementById("doneBtn");
const supportBtn = document.getElementById("supportBtn");
const copyBtn = document.getElementById("copyBtn");

backBtn.onclick = () => history.back();

doneBtn.onclick = () => {
    window.location.href = "transaction-history.html";
};

supportBtn.onclick = () => {
    alert("NovaPay Support coming soon.");
};

if (transaction) {

    // Title
    document.getElementById("transactionTitle").textContent =
        transaction.title || "Transaction";

    // Amount
    document.getElementById("amount").textContent =
        `₦${Number(transaction.amount).toLocaleString()}.00`;

    // Date
    document.getElementById("date").textContent =
        transaction.date || "--";

    // Reference
    document.getElementById("transactionId").textContent =
        transaction.id || "--";

    // Status
    document.getElementById("statusText").textContent =
        transaction.status || "Successful";

    document.getElementById("transactionStatus").textContent =
        transaction.status || "Successful";

    // Recipient
    let recipient = "NovaPay Wallet";

    const title =
        (transaction.title || "").toUpperCase();

    if (
        title.includes("AIRTIME") ||
        title.includes("DATA")
    ) {

        recipient =
            transaction.phone ||
            transaction.recipient ||
            "Phone Number";

    }

    else if (title.includes("ELECTRICITY")) {

        recipient =
            transaction.meterNumber ||
            "Meter Number";

    }

    else if (title.includes("TV")) {

        recipient =
            transaction.smartCard ||
            "Smart Card Number";

    }

    else if (title.includes("BET")) {

        recipient =
            transaction.customerId ||
            "Customer ID";

    }

    document.getElementById("recipient").textContent =
        recipient;

}

// Copy Reference
copyBtn.onclick = () => {

    const reference =
        document.getElementById("transactionId").innerText;

    navigator.clipboard.writeText(reference);

    copyBtn.innerHTML =
        '<i class="fas fa-check"></i>';

    setTimeout(() => {

        copyBtn.innerHTML =
            '<i class="far fa-copy"></i>';

    }, 1500);

};