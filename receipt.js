const transaction = JSON.parse(
    localStorage.getItem("selectedTransaction")
);
const doneBtn = document.getElementById("doneBtn");
const supportBtn = document.getElementById("supportBtn");
const copyBtn = document.getElementById("copyBtn");
if (transaction) {

    document.getElementById("transactionTitle").textContent =
        transaction.title || "Transaction";

    document.getElementById("amount").textContent =
        `₦${Number(transaction.amount).toLocaleString()}`;

    document.getElementById("date").textContent =
        transaction.date || "-";

    document.getElementById("transactionId").textContent =
        transaction.id || "-";

}
doneBtn.addEventListener("click", () => {
    window.location.href = "transaction-history.html";
});

supportBtn.addEventListener("click", () => {
    alert("Support page coming soon.");
});

copyBtn.addEventListener("click", () => {

    const id = document.getElementById("transactionId").innerText;

    navigator.clipboard.writeText(id);

    alert("Transaction ID copied.");

});