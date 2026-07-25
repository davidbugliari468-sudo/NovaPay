const doneBtn = document.getElementById("doneBtn");
const supportBtn = document.getElementById("supportBtn");
const copyBtn = document.getElementById("copyBtn");

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