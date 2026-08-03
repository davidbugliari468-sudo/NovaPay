/* ==========================================
NOVAPAY CREATE SECURITY PIN
========================================== */

import {
    auth,
    db,
    doc,
    updateDoc
} from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

/* ========= ELEMENTS ========= */

const backBtn = document.getElementById("backBtn");

const createPinBtn =
document.getElementById("createPinBtn");

const statusMessage =
document.getElementById("statusMessage");

const enterPin =
document.getElementById("enterPin");

const confirmPin =
document.getElementById("confirmPin");

const enterDots =
document.querySelectorAll("#enterPinDots .dot");

const confirmDots =
document.querySelectorAll("#confirmPinDots .dot");

let currentUser = null;

/* ========= AUTH ========= */

onAuthStateChanged(auth, (user) => {

    if (!user) {

        window.location.href = "login.html";
        return;

    }

    currentUser = user;

});

/* ========= BACK ========= */

backBtn.addEventListener("click", () => {

    history.back();

}); 
/* ========= OPEN KEYBOARD ========= */

document
.getElementById("enterPinDots")
.addEventListener("click", () => {

    enterPin.focus();

});

document
.getElementById("confirmPinDots")
.addEventListener("click", () => {

    confirmPin.focus();

});

/* ========= UPDATE DOTS ========= */

function updateDots(input, dots){

    dots.forEach((dot,index)=>{

        if(index < input.value.length){

            dot.classList.add("active");

        }else{

            dot.classList.remove("active");

        }

    });

}

enterPin.addEventListener("input",()=>{

    enterPin.value=
    enterPin.value.replace(/\D/g,"").slice(0,6);

    updateDots(enterPin,enterDots);

});

confirmPin.addEventListener("input",()=>{

    confirmPin.value=
    confirmPin.value.replace(/\D/g,"").slice(0,6);

    updateDots(confirmPin,confirmDots);

});
/* ========= CREATE PIN ========= */

createPinBtn.addEventListener("click", async()=>{

    if(enterPin.value.length!==6){

        statusMessage.textContent=
        "Enter a 6-digit Security PIN.";

        statusMessage.style.color="#DC2626";

        return;

    }

    if(confirmPin.value.length!==6){

        statusMessage.textContent=
        "Confirm your Security PIN.";

        statusMessage.style.color="#DC2626";

        return;

    }

    if(enterPin.value!==confirmPin.value){

        statusMessage.textContent=
        "PINs do not match.";

        statusMessage.style.color="#DC2626";

        confirmPin.value="";

        updateDots(confirmPin,confirmDots);

        confirmPin.focus();

        return;

    }

    createPinBtn.disabled=true;

    createPinBtn.textContent=
    "Creating...";

    try{

        await updateDoc(

            doc(db,"users",currentUser.uid),

            {

                hasSecurityPin:true,

                securityPin:enterPin.value

            }

        );

        statusMessage.textContent=
        "✅ Security PIN created successfully.";

        statusMessage.style.color="#16A34A";

        setTimeout(()=>{

            window.location.href=
            "dashboard.html";

        },1500);

    }catch(error){

        console.error(error);

        statusMessage.textContent=
        "Unable to create Security PIN.";

        statusMessage.style.color="#DC2626";

        createPinBtn.disabled=false;

        createPinBtn.textContent=
        "Create Security PIN";

    }

});