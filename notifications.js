/* ==========================================
NOVAPAY NOTIFICATIONS
MODULE 1
========================================== */

import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

const backBtn =
document.getElementById("backBtn");

const notificationList =
document.getElementById("notificationList");

const emptyState =
document.getElementById("emptyState");

const searchInput =
document.getElementById("searchInput");

const tabs =
document.querySelectorAll(".tab");

let currentUser = null;

/* ==========================================
BACK BUTTON
========================================== */

backBtn?.addEventListener("click", () => {

    window.location.href = "dashboard.html";

});

/* ==========================================
AUTH
========================================== */

onAuthStateChanged(auth, (user) => {

    if (!user) {

        window.location.href = "login.html";

        return;

    }

    currentUser = user;

    loadNotifications();

    console.log("✅ User Logged In");

    console.log(currentUser.uid);

});

/* ==========================================
SEARCH
========================================== */

searchInput?.addEventListener("input", () => {

    console.log(searchInput.value);

});

/* ==========================================
TABS
========================================== */

tabs.forEach(tab => {

    tab.addEventListener("click", () => {

        tabs.forEach(btn =>
            btn.classList.remove("active")
        );

        tab.classList.add("active");

        console.log(tab.textContent);

    });

});

console.log("✅ Module 1 Loaded");
/* ==========================================
MODULE 2
FIRESTORE
========================================== */

import {
    collection,
    query,
    orderBy,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

function loadNotifications() {

    const notificationsRef = collection(
        db,
        "users",
        currentUser.uid,
        "notifications"
    );

    const q = query(
        notificationsRef,
        orderBy("createdAt", "desc")
    );

     onSnapshot(q, (snapshot) => {

    notificationList.innerHTML = "";

    if (snapshot.empty) {

        emptyState.style.display = "flex";

        return;

    }

    emptyState.style.display = "none";

    snapshot.forEach((doc) => {

        const data = doc.data();

        const card = document.createElement("div");

        card.className = "notification-card";

        const iconMap = {

            wallet: "fa-wallet icon-wallet",

            airtime: "fa-mobile-screen icon-airtime",

            data: "fa-wifi icon-data",

            electricity: "fa-bolt icon-electricity",

            tv: "fa-tv icon-tv",

            giveaway: "fa-gift icon-gift",

            security: "fa-shield-halved icon-security",

            announcement: "fa-bullhorn icon-announcement"

        };

        const iconClass =
            iconMap[data.type] ||
            "fa-bell icon-announcement";

        card.innerHTML = `

            <div class="notification-icon">

                <i class="fa-solid ${iconClass}"></i>

            </div>

            <div class="notification-content">

                <div class="notification-title">

                    ${data.title || "Notification"}

                </div>

                <div class="notification-message">

                    ${data.message || ""}

                </div>

                <div class="notification-footer">

                    <span class="notification-time">

                        ${data.time || "Just now"}

                    </span>

                    ${
                        !data.isRead
                        ? '<span class="unread-dot"></span>'
                        : ""
                    }

                </div>

            </div>

        `;

        notificationList.appendChild(card);

    });

}, (error) => {

    console.error("Notification Error:", error);

});
}