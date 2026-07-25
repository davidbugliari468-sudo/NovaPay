const okBtn = document.getElementById("okBtn");

// Redirect immediately when OK is clicked
okBtn.addEventListener("click", () => {
    window.location.href = "dashboard.html";
});

// Automatically redirect after 2 minutes
setTimeout(() => {
    window.location.href = "dashboard.html";
}, 120000);