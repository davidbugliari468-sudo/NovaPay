// Animate progress bar
const progressFill = document.getElementById("progressFill");
const amountPaid = document.getElementById("amountPaid");

let progress = 0;

const interval = setInterval(() => {
    progress += 2;
    progressFill.style.width = progress + "%";

    if (progress >= 100) {
        clearInterval(interval);

        // Redirect to dashboard
        window.location.href = "dashboard.html";
    }
}, 60);

// Get amount from URL (optional for now)
const params = new URLSearchParams(window.location.search);
const amount = params.get("amount");

if (amount) {
    amountPaid.textContent = `₦${Number(amount).toLocaleString()}`;
}