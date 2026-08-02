/* ==========================================
NOVAPAY DATA
========================================== */

/* ========= ELEMENTS ========= */

const backBtn = document.getElementById("backBtn");

const continueBtn = document.getElementById("continueBtn");

const networkCards =
document.querySelectorAll(".network-card");

const tabs =
document.querySelectorAll(".plan-tab");

const plansContainer =
document.getElementById("plansContainer");

const phoneInput =
document.getElementById("phoneNumber");

/* ========= DEFAULT ========= */

let selectedNetwork = "MTN";

let selectedCategory = "Hot";

let selectedPlan = null;

/* ========= BACK ========= */

backBtn.addEventListener("click", () => {

history.back();

}); 
/* ========= DATA PLANS ========= */

const dataPlans = {

Hot: [

{ size: "500MB", validity: "30 Days", price: 150 },

{ size: "1GB", validity: "30 Days", price: 300 },

{ size: "2GB", validity: "30 Days", price: 600 },

{ size: "5GB", validity: "30 Days", price: 1500 },

{ size: "10GB", validity: "30 Days", price: 3000 }

],

Daily: [

{ size: "100MB", validity: "1 Day", price: 100 },

{ size: "350MB", validity: "1 Day", price: 200 },

{ size: "1GB", validity: "1 Day", price: 350 }

],

Weekly: [

{ size: "1GB", validity: "7 Days", price: 500 },

{ size: "2GB", validity: "7 Days", price: 900 }

],

Monthly: [

{ size: "2GB", validity: "30 Days", price: 600 },

{ size: "5GB", validity: "30 Days", price: 1500 }

],

Router: [],

Social: [],

Night: [],

SME: []

}; 
/* ========= RENDER PLANS ========= */

function renderPlans(category) {

    plansContainer.innerHTML = "";

    const plans = dataPlans[category] || [];

    plans.forEach(plan => {

        const card = document.createElement("div");

        card.className = "plan-card";

        card.innerHTML = `

            <h3>${plan.size}</h3>

            <p>${plan.validity}</p>

            <strong>₦${plan.price.toLocaleString()}</strong>

        `;

        card.addEventListener("click", () => {

            document.querySelectorAll(".plan-card")
                .forEach(item =>
                    item.classList.remove("active")
                );

            card.classList.add("active");

            selectedPlan = plan;

        });

        plansContainer.appendChild(card);

    });

}

renderPlans("Hot"); 
/* ========= CATEGORY TABS ========= */

tabs.forEach(tab => {

    tab.addEventListener("click", () => {

        tabs.forEach(item =>
            item.classList.remove("active")
        );

        tab.classList.add("active");

        selectedCategory =
            tab.textContent.trim();

        renderPlans(selectedCategory);

    });

});

/* ========= NETWORK ========= */

networkCards.forEach(card => {

    card.addEventListener("click", () => {

        networkCards.forEach(item =>
            item.classList.remove("active")
        );

        card.classList.add("active");

        selectedNetwork =
            card.dataset.network;

    });

});

/* ========= CONTINUE ========= */

continueBtn.addEventListener("click", () => {

    const phone =
        phoneInput.value.trim();

    if (!selectedNetwork) {

        alert("Select a network.");

        return;

    }

    if (phone.length !== 11) {

        alert("Enter a valid phone number.");

        return;

    }

    if (!selectedPlan) {

        alert("Select a data plan.");

        return;

    }

    console.log({

        network: selectedNetwork,

        category: selectedCategory,

        phone,

        plan: selectedPlan

    });

    alert("Proceeding to payment...");

});

console.log("✅ NovaPay Data Ready");