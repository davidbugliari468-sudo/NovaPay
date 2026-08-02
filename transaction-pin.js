/* ==========================================
NOVAPAY TRANSACTION PIN
========================================== */

/* ========= ELEMENTS ========= */

const backBtn =
document.getElementById("backBtn");

const createPinBtn =
document.getElementById("createPinBtn");

const pinStrength =
document.getElementById("pinStrength");

const pinMatch =
document.getElementById("pinMatch");

const newPinInputs =
document.querySelectorAll(".pin-input");

const confirmPinInputs =
document.querySelectorAll(".confirm-pin-input");

/* ========= VARIABLES ========= */

let newPin = "";

let confirmPin = "";

/* ========= BACK ========= */

backBtn.addEventListener("click", () => {

    history.back();

}); 
/* ==========================================
WEAK PIN CHECK
========================================== */

function isWeakPin(pin){

    const repeatedPins = [

        "0000",
        "1111",
        "2222",
        "3333",
        "4444",
        "5555",
        "6666",
        "7777",
        "8888",
        "9999",

        "1122",
        "2211",
        "2233",
        "3322",
        "3344",
        "4433",
        "4455",
        "5544",
        "5566",
        "6655",
        "6677",
        "7766",
        "7788",
        "8877",
        "8899",
        "9988"

    ];

    return repeatedPins.includes(pin);

}

/* ==========================================
READ PIN
========================================== */

function getPin(inputs){

    return [...inputs]

        .map(input => input.value)

        .join("");

} 
/* ==========================================
PIN INPUT EVENTS
========================================== */

function setupPinInputs(inputs, nextInputs = null) {

    inputs.forEach((input, index) => {

        input.addEventListener("input", () => {

            input.value = input.value.replace(/\D/g, "");

            if (input.value && index < inputs.length - 1) {

                inputs[index + 1].focus();

            }

            if (
                input.value &&
                index === inputs.length - 1 &&
                nextInputs
            ) {

                nextInputs[0].focus();

            }

            newPin = getPin(newPinInputs);
            confirmPin = getPin(confirmPinInputs);

            /* ===== Weak PIN ===== */

            if (newPin.length === 4) {

                if (isWeakPin(newPin)) {

                    pinStrength.textContent = "PIN is too weak";

                    pinStrength.style.color = "#DC2626";

                } else {

                    pinStrength.textContent = "";

                }

            } else {

                pinStrength.textContent = "";

            }

            /* ===== PIN Match ===== */

            if (confirmPin.length === 4) {

                if (newPin === confirmPin) {

                    pinMatch.textContent = "PINs match";

                    pinMatch.style.color = "#16A34A";

                } else {

                    pinMatch.textContent = "PINs do not match";

                    pinMatch.style.color = "#DC2626";

                }

            } else {

                pinMatch.textContent = "";

            }

            /* ===== Enable Button ===== */

            createPinBtn.disabled = !(
                newPin.length === 4 &&
                confirmPin.length === 4 &&
                newPin === confirmPin &&
                !isWeakPin(newPin)
            );

        });

        input.addEventListener("keydown", (e) => {

            if (
                e.key === "Backspace" &&
                !input.value &&
                index > 0
            ) {

                inputs[index - 1].focus();

            }

        });

    });

}

setupPinInputs(newPinInputs, confirmPinInputs);

setupPinInputs(confirmPinInputs);
/* ==========================================
CREATE TRANSACTION PIN
========================================== */

createPinBtn.addEventListener("click", () => {

    if (createPinBtn.disabled) return;

    /* Temporary storage
       Firebase will replace this later */

    localStorage.setItem(
        "novaTransactionPin",
        newPin
    );

    alert("Transaction PIN created successfully.");

    window.location.href = "dashboard.html";

});

console.log("✅ NovaPay Transaction PIN Ready");