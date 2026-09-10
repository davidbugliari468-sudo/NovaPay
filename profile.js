/* ==========================================
   NOVAPAY SETTINGS
========================================== */

import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";


/* ==========================================
   ELEMENTS
========================================== */

const backBtn =
    document.getElementById("backBtn");

const logoutBtn =
    document.getElementById("logoutBtn");

const personalInformationBtn =
    document.getElementById("personalInformationBtn");

const userName =
    document.getElementById("userName");

const userPoints =
    document.getElementById("userPoints");

const userRewards =
    document.getElementById("userRewards");


let currentUser = null;


/* ==========================================
   BACK BUTTON
========================================== */

backBtn?.addEventListener("click", () => {

    window.location.href =
        "dashboard.html";

});


/* ==========================================
   PERSONAL INFORMATION
========================================== */

personalInformationBtn?.addEventListener("click", () => {

    window.location.href =
        "personal-information.html";

});


/* ==========================================
   LOGOUT
========================================== */

logoutBtn?.addEventListener("click", async () => {

    const confirmed =
        window.confirm(
            "Are you sure you want to logout?"
        );


    if (!confirmed) {

        return;

    }


    try {

        await signOut(auth);

        window.location.href =
            "login.html";

    }

    catch (error) {

        console.error(
            "Logout Error:",
            error
        );

    }

});


console.log("✅ Logout system ready");


/* ==========================================
   LOAD USER PROFILE
========================================== */

onAuthStateChanged(
    auth,
    async (user) => {

        /* ----------------------------------
           AUTH CHECK
        ---------------------------------- */

        if (!user) {

            window.location.href =
                "login.html";

            return;

        }


        currentUser = user;


        /* ----------------------------------
           DEFAULT PROFILE INFORMATION
        ---------------------------------- */

        if (userName) {

            userName.textContent =
                "Loading...";

        }


        if (userPoints) {

            userPoints.textContent =
                "0 Points";

        }


        if (userRewards) {

            userRewards.textContent =
                "0 Rewards";

        }


        /* ----------------------------------
           LOAD FIRESTORE USER
        ---------------------------------- */

        try {

            const userRef =
                doc(
                    db,
                    "users",
                    user.uid
                );


            const userSnap =
                await getDoc(userRef);


            if (!userSnap.exists()) {

                console.warn(
                    "NovaPay user document not found."
                );


                if (userName) {

                    userName.textContent =
                        "NovaPay User";

                }


                updateLoginPinButton(false);

                return;

            }


            const data =
                userSnap.data();


            /* --------------------------------
               NICKNAME
            -------------------------------- */

            if (userName) {

                const nickname =
                    typeof data.nickname === "string"
                        ? data.nickname.trim()
                        : "";


                userName.textContent =
                    nickname ||
                    "NovaPay User";

            }


            /* --------------------------------
               POINTS
            -------------------------------- */

            if (userPoints) {

                userPoints.textContent =
                    `${data.points || 0} Points`;

            }


            /* --------------------------------
               REWARDS
            -------------------------------- */

            if (userRewards) {

                userRewards.textContent =
                    `${data.rewards || 0} Rewards`;

            }


            /* --------------------------------
               LOGIN PIN
            -------------------------------- */

            const hasLoginPin =
                data.loginPinCreated === true;


            updateLoginPinButton(
                hasLoginPin
            );

        }

        catch (error) {

            console.error(
                "Profile Error:",
                error
            );


            /*
             * Never display email here.
             */

            if (userName) {

                userName.textContent =
                    "NovaPay User";

            }


            updateLoginPinButton(false);

        }

    }
);


/* ==========================================
   UPDATE LOGIN PIN BUTTON
========================================== */

function updateLoginPinButton(
    hasLoginPin
) {

    const loginPinLink =
        document.querySelector(
            'a[href="login-pin.html"]'
        );


    if (!loginPinLink) {

        console.warn(
            "Login PIN link was not found."
        );

        return;

    }


    const newText =
        hasLoginPin
            ? "Change Login PIN"
            : "Login PIN";


    const walker =
        document.createTreeWalker(
            loginPinLink,
            NodeFilter.SHOW_TEXT
        );


    const textNodes = [];

    let node;


    while (
        node =
        walker.nextNode()
    ) {

        textNodes.push(node);

    }


    let changed = false;


    /* ----------------------------------
       Find existing Login PIN text
    ---------------------------------- */

    for (
        const textNode of textNodes
    ) {

        const text =
            textNode.textContent.trim();


        if (
            text === "Login PIN" ||
            text === "Change Login PIN"
        ) {

            textNode.textContent =
                textNode.textContent.replace(
                    text,
                    newText
                );

            changed = true;

            break;

        }

    }


    /* ----------------------------------
       Safety fallback
    ---------------------------------- */

    if (!changed) {

        const possibleTextElement =
            loginPinLink.querySelector(
                "span, p, div"
            );


        if (possibleTextElement) {

            possibleTextElement.textContent =
                newText;

            return;

        }


        const label =
            document.createElement("span");

        label.textContent =
            newText;

        loginPinLink.appendChild(
            label
        );

    }


    console.log(
        hasLoginPin
            ? "🔐 Change Login PIN enabled"
            : "🔐 Login PIN enabled"
    );

}


/* ==========================================
   SETTINGS NAVIGATION
========================================== */

const menuItems = {

    loginPin:
        document.querySelector(
            'a[href="login-pin.html"]'
        ),

    transactionPin:
        document.querySelector(
            'a[href="transaction-pin.html"]'
        ),

    notifications:
        document.querySelector(
            'a[href="notifications.html"]'
        ),

    language:
        document.querySelector(
            'a[href="language.html"]'
        ),

    help:
        document.querySelector(
            'a[href="help.html"]'
        ),

    support:
        document.querySelector(
            'a[href="contact-support.html"]'
        ),

    privacy:
        document.querySelector(
            'a[href="privacy-policy.html"]'
        ),

    terms:
        document.querySelector(
            'a[href="terms.html"]'
        ),

    about:
        document.querySelector(
            'a[href="about.html"]'
        )

};


Object.values(
    menuItems
).forEach(item => {

    if (!item) return;

    item.addEventListener(
        "click",
        () => {

            console.log(
                "Opening:",
                item.href
            );

        }
    );

});


console.log(
    "✅ NovaPay Profile Ready"
);


/* ==========================================
   LANGUAGE DROPDOWN
========================================== */

const languageBtn =
    document.getElementById("languageBtn");

const languageDropdown =
    document.getElementById("languageDropdown");

const languageOption =
    document.querySelector(".language-option");

const selectedLanguage =
    document.querySelector(".language-current span");


/* ------------------------------------------
   OPEN / CLOSE DROPDOWN
------------------------------------------ */

languageBtn?.addEventListener(
    "click",
    () => {

        const isOpen =
            languageBtn.getAttribute(
                "aria-expanded"
            ) === "true";


        languageBtn.setAttribute(
            "aria-expanded",
            String(!isOpen)
        );


        if (languageDropdown) {

            languageDropdown.hidden =
                isOpen;

        }

    }
);


/* ------------------------------------------
   SELECT LANGUAGE
------------------------------------------ */

languageOption?.addEventListener(
    "click",
    () => {

        const language =
            languageOption.dataset.language ||
            "English (UK)";


        if (selectedLanguage) {

            selectedLanguage.textContent =
                language;

        }


        if (languageDropdown) {

            languageDropdown.hidden =
                true;

        }


        languageBtn?.setAttribute(
            "aria-expanded",
            "false"
        );

    }
);


/* ------------------------------------------
   CLOSE WHEN CLICKING OUTSIDE
------------------------------------------ */

document.addEventListener(
    "click",
    (event) => {

        if (
            !languageBtn ||
            !languageDropdown
        ) {
            return;
        }


        if (
            !languageBtn.contains(event.target) &&
            !languageDropdown.contains(event.target)
        ) {

            languageDropdown.hidden =
                true;


            languageBtn.setAttribute(
                "aria-expanded",
                "false"
            );

        }

    }
);


console.log(
    "🌐 NovaPay Language Selector Ready"
);