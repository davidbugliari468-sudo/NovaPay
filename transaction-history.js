import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import {
    collection,
    query,
    where,
    orderBy,
    getDocs
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
/* =====================================
   NOVAPAY TRANSACTION HISTORY
   PART 1
===================================== */

// Buttons
const backBtn = document.getElementById("backBtn");
const exportBtn = document.getElementById("exportBtn");

const categoryBtn = document.getElementById("categoryBtn");
const statusBtn = document.getElementById("statusBtn");
const monthBtn = document.getElementById("monthBtn");

// Bottom Sheets
const categorySheet = document.getElementById("categorySheet");
const statusSheet = document.getElementById("statusSheet");
const monthSheet = document.getElementById("monthSheet");
const exportSheet = document.getElementById("exportSheet");

const overlay = document.getElementById("sheetOverlay");

const searchInput = document.getElementById("searchInput");

// Transaction container
const transactionContainer =
document.getElementById("transactionContainer");

// Summary
const transactionCount =
document.getElementById("transactionCount");

const moneyIn =
document.getElementById("moneyIn");

const moneyOut =
document.getElementById("moneyOut");

const netAmount =
document.getElementById("netAmount");

// Current Filters
let currentCategory = "All Categories";
let currentStatus = "All Status";
let currentMonth = "All Months";
let searchText = "";

// =====================================
// Bottom Sheet Functions
// =====================================

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

// =====================================
// Button Events look
// =====================================

categoryBtn.onclick = () => openSheet(categorySheet);

statusBtn.onclick = () => openSheet(statusSheet);

monthBtn.onclick = () => openSheet(monthSheet);

exportBtn.onclick = () => openSheet(exportSheet);

overlay.onclick = closeSheets;

// =====================================
// Back
// =====================================

backBtn.onclick = () => {

    window.history.back();

};

// =====================================
// Search
// =====================================

searchInput.addEventListener("input", function(){

    searchText = this.value.toLowerCase();

    renderTransactions();

}); 
/* =====================================
   DEMO DATA
===================================== */
let transactions = [];


/* =====================================
   FILTER BUTTONS
===================================== */

document.querySelectorAll("[data-category]").forEach(btn=>{

    btn.onclick=()=>{

        currentCategory=btn.dataset.category;

        categoryBtn.querySelector("span").textContent=currentCategory;

        closeSheets();

        renderTransactions();

    };

});

document.querySelectorAll("[data-status]").forEach(btn=>{

    btn.onclick=()=>{

        currentStatus=btn.dataset.status;

        statusBtn.querySelector("span").textContent=currentStatus;

        closeSheets();

        renderTransactions();

    };

});

document.querySelectorAll("[data-month]").forEach(btn=>{

    btn.onclick=()=>{

        currentMonth=btn.dataset.month;

        monthBtn.querySelector("span").textContent=currentMonth;

        closeSheets();

        renderTransactions();

    };

});

/* =====================================
   RENDER
===================================== */

function renderTransactions(){

    transactionContainer.innerHTML="";

    let filtered=transactions.filter(item=>{

        const matchCategory=
        currentCategory==="All Categories" ||
        item.category===currentCategory;

        const matchStatus=
        currentStatus==="All Status" ||
        item.status===currentStatus;

        const matchMonth=
        currentMonth==="All Months" ||
        currentMonth==="Custom Range" ||
        item.month===currentMonth;

        const matchSearch=

        item.title.toLowerCase().includes(searchText) ||

        item.category.toLowerCase().includes(searchText) ||

        item.status.toLowerCase().includes(searchText);

        return matchCategory &&
               matchStatus &&
               matchMonth &&
               matchSearch;

    });

    if(filtered.length===0){

        transactionContainer.innerHTML=`

<div class="empty-state">

<i class="fas fa-file-invoice"></i>

<h3>No transactions found</h3>

<p>
Try changing your search or filters.
</p>

</div>

`;

        transactionCount.textContent="Showing 0 transactions";

        moneyIn.textContent="₦0.00";
        moneyOut.textContent="₦0.00";
        netAmount.textContent="₦0.00";

        return;

    }

    let totalIn=0;
    let totalOut=0;

    filtered.forEach(item=>{

        if(item.type==="in"){

            totalIn+=item.amount;

        }else{

            totalOut+=item.amount;

        }

        transactionContainer.innerHTML+=`

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

<span class="status-dot ${item.status==="Successful"?"status-success":item.status==="Pending"?"status-pending":"status-failed"}"></span>

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

document.querySelectorAll(".transaction-item").forEach((card, index) => {

    card.addEventListener("click", () => {

        localStorage.setItem(
            "selectedTransaction",
            JSON.stringify(filtered[index])
        );

        window.location.href = "receipt.html";

    });

});

transactionCount.textContent =
`Showing ${filtered.length} transaction${filtered.length>1?"s":""}`;

    transactionCount.textContent=
`Showing ${filtered.length} transaction${filtered.length>1?"s":""}`;

    moneyIn.textContent=
`₦${totalIn.toLocaleString()}.00`;

    moneyOut.textContent=
`₦${totalOut.toLocaleString()}.00`;

    netAmount.textContent=
`₦${(totalIn-totalOut).toLocaleString()}.00`;

}

/* =====================================
   START
===================================== */

/* =====================================
   LOAD FROM FIRESTORE
===================================== */

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

        console.log("Snapshot size:", snapshot.size);
console.log("Current UID:", user.uid);
console.log(snapshot.docs.map(doc => doc.data()));
        
transactions = snapshot.docs.map(doc => {

    const data = doc.data();

    return {

        id: doc.id,

        ...data,

        title: data.type || "Transaction",

        category: data.type || "Other",

        status: data.status === "COMPLETED"
            ? "Successful"
            : (data.status || "Pending"),

                amount: Number(data.amount || 0),

                type: data.type === "DEPOSIT"
                    ? "in"
                    : "out",

                date: data.createdAt
                    ? data.createdAt.toDate().toLocaleDateString()
                    : "",

                month: data.createdAt
                    ? data.createdAt.toDate().toLocaleString("default", {
                        month: "long"
                    })
                    : "",

                icon: "fa-wallet",

                color: "#10b981"

            };

        });

        console.log("Transactions:", transactions);

        renderTransactions();

    } catch (error) {

        console.error("Firestore Error:", error);

        renderTransactions();

    }

});