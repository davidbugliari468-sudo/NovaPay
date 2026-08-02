/* ======================================
NOVAPAY TRANSACTION HISTORY V2
PART 1
====================================== */

import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import {
    collection,
    query,
    where,
    getDocs
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

/* ======================================
ELEMENTS
====================================== */

const backBtn = document.getElementById("backBtn");
const exportBtn = document.getElementById("exportBtn");

const categoryBtn = document.getElementById("categoryBtn");
const statusBtn = document.getElementById("statusBtn");
const monthBtn = document.getElementById("monthBtn");

const categorySheet = document.getElementById("categorySheet");
const statusSheet = document.getElementById("statusSheet");
const monthSheet = document.getElementById("monthSheet");
const exportSheet = document.getElementById("exportSheet");

const overlay = document.getElementById("sheetOverlay");

const searchInput = document.getElementById("searchInput");

const transactionContainer =
document.getElementById("transactionContainer");

const transactionCount =
document.getElementById("transactionCount");

const moneyIn =
document.getElementById("moneyIn");

const moneyOut =
document.getElementById("moneyOut");

const netAmount =
document.getElementById("netAmount");

/* ======================================
VARIABLES
====================================== */

let transactions = [];

let currentCategory = "All Categories";

let currentStatus = "All Status";

let currentMonth = "This Month";

let searchText = ""; 
/* ======================================
BOTTOM SHEETS
====================================== */

function closeSheets(){

    categorySheet.classList.remove("active");
    statusSheet.classList.remove("active");
    monthSheet.classList.remove("active");
    exportSheet.classList.remove("active");

    overlay.classList.remove("active");

}

function openSheet(sheet){

    closeSheets();

    sheet.classList.add("active");

    overlay.classList.add("active");

}

/* ======================================
BUTTON EVENTS
====================================== */

categoryBtn.onclick = () => openSheet(categorySheet);

statusBtn.onclick = () => openSheet(statusSheet);

monthBtn.onclick = () => openSheet(monthSheet);

exportBtn.onclick = () => openSheet(exportSheet);

overlay.onclick = closeSheets;

backBtn.onclick = () => {

    window.history.back();

};

/* ======================================
SEARCH
====================================== */

searchInput.addEventListener("input", () => {

    searchText = searchInput.value.trim().toLowerCase();

    renderTransactions();

});

/* ======================================
FILTERS
====================================== */

document.querySelectorAll("[data-category]").forEach(button => {

    button.onclick = () => {

        currentCategory = button.dataset.category;

        categoryBtn.querySelector("span").textContent =
        currentCategory;

        closeSheets();

        renderTransactions();

    };

});

document.querySelectorAll("[data-status]").forEach(button => {

    button.onclick = () => {

        currentStatus = button.dataset.status;

        statusBtn.querySelector("span").textContent =
        currentStatus;

        closeSheets();

        renderTransactions();

    };

});

document.querySelectorAll("[data-month]").forEach(button => {

    button.onclick = () => {

        currentMonth = button.dataset.month;

        monthBtn.querySelector("span").textContent =
        currentMonth;

        closeSheets();

        renderTransactions();

    };

}); 
/* ======================================
RENDER TRANSACTIONS
====================================== */

function renderTransactions(){

    transactionContainer.innerHTML = "";

    let filtered = [...transactions];

    /* Newest first */

    filtered.sort((a, b) => b.time - a.time);

    /* Search */

    if(searchText){

        filtered = filtered.filter(item =>

            item.title.toLowerCase().includes(searchText) ||

            item.category.toLowerCase().includes(searchText) ||

            item.status.toLowerCase().includes(searchText)

        );

    }

    /* Category */

    if(currentCategory !== "All Categories"){

        filtered = filtered.filter(item =>
            item.category === currentCategory
        );

    }

    /* Status */

if(currentStatus !== "All Status"){

    filtered = filtered.filter(item =>
        item.status === currentStatus
    );

}

    /* Month */

    if(currentMonth !== "This Month"){

        filtered = filtered.filter(item =>
            item.month === currentMonth
        );

    }

    if(filtered.length === 0){

        transactionContainer.innerHTML = `

<div class="empty-state">

<i class="fas fa-receipt"></i>

<h3>No transactions found</h3>

<p>Try changing your filters.</p>

</div>

`;

        transactionCount.textContent =
        "Showing 0 Transactions";

        moneyIn.textContent = "₦0.00";
        moneyOut.textContent = "₦0.00";
        netAmount.textContent = "₦0.00";

        return;

    }

    let totalIn = 0;
    let totalOut = 0;

    filtered.forEach(item => {

        if(item.type === "in"){

            totalIn += item.amount;

        }else{

            totalOut += item.amount;

        }

        transactionContainer.innerHTML += `

<div class="transaction-item" data-id="${item.id}">

<div class="transaction-icon"
style="background:${item.color};">

<i class="fas ${item.icon}"></i>

</div>

<div class="transaction-content">

<div class="transaction-top">

<div class="transaction-title">

${item.title}

</div>

<div class="transaction-amount ${item.type==="in"?"amount-in":"amount-out"}">

${item.type==="in"?"+":"-"}₦${item.amount.toLocaleString()}

</div>

</div>

<div class="transaction-bottom">

<div class="transaction-date">

${item.date}

</div>

<div class="transaction-status">

<span class="status-dot status-${item.status.toLowerCase()}"></span>

${item.status}

</div>

</div>

</div>

<div class="transaction-arrow">

<i class="fas fa-chevron-right"></i>

</div>

</div>

`;

    });

    transactionCount.textContent =
    `Showing ${filtered.length} Transaction${filtered.length>1?"s":""}`;

    moneyIn.textContent =
    `₦${totalIn.toLocaleString()}.00`;

    moneyOut.textContent =
    `₦${totalOut.toLocaleString()}.00`;

    netAmount.textContent =
    `₦${(totalIn-totalOut).toLocaleString()}.00`;

} 
/* ======================================
LOAD TRANSACTIONS
====================================== */

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        window.location.href = "login.html";
        return;

    }

    try {

        const q = query(
            collection(db, "transactions"),
            where("uid", "==", user.uid)
        );

        const snapshot = await getDocs(q);

        transactions = snapshot.docs.map(doc => {

            const data = doc.data();

            /* Display title */

            let title = "Transaction";

            switch ((data.type || "").toUpperCase()) {

                case "DEPOSIT":
                    title = "Credit Alert";
                    break;

                case "AIRTIME":
                    title = "Airtime Purchase";
                    break;

                case "DATA":
                    title = "Data Purchase";
                    break;

                case "ELECTRICITY":
                    title = "Electricity Payment";
                    break;

                case "TV":
                    title = "TV Subscription";
                    break;

                case "BETTING":
                    title = "Betting";
                    break;

                case "TRANSFER":
                    title = "Transfer";
                    break;

            }

            /* Status */
const rawStatus = String(data.status || "")
    .trim()
    .toUpperCase();

let status = "Pending";

if (
    rawStatus === "SUCCESS" ||
    rawStatus === "COMPLETED" ||
    rawStatus === "SUCCESSFUL"
) {

    status = "Successful";

} else if (rawStatus === "FAILED") {

    status = "Failed";

}
    

            /* Credit / Debit */

            const isCredit =
                (data.type || "").toUpperCase() === "DEPOSIT";

            return {

                id: doc.id,

                title,

                category: title,

                status,

                amount: Number(data.amount || 0),

                type: isCredit ? "in" : "out",

                icon: isCredit
    ? "fa-circle-arrow-down"
    : "fa-circle-arrow-up",

                color: isCredit
                    ? "#10B981"
                    : "#EF4444",

                date: data.createdAt
                    ? data.createdAt
                        .toDate()
                        .toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric"
                        })
                    : "",

                month: data.createdAt
                    ? data.createdAt
                        .toDate()
                        .toLocaleString("default", {
                            month: "long"
                        })
                    : "",

                time: data.createdAt
                    ? data.createdAt.toDate().getTime()
                    : 0

            };

        });

        renderTransactions();

    } catch (error) {

        console.error(error);

        renderTransactions();

    }

}); 
/* ======================================
RECEIPT
====================================== */

document.addEventListener("click", (event) => {

    const card = event.target.closest(".transaction-item");

    if (!card) return;

    const id = card.dataset.id;

    const transaction = transactions.find(item => item.id === id);

    if (!transaction) return;

    localStorage.setItem(
        "selectedTransaction",
        JSON.stringify(transaction)
    );

    window.location.href = "receipt.html";

});

/* ======================================
START
====================================== */

console.log("✅ Transaction History Loaded");