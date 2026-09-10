/* =========================================================
   NOVAPAY - PERSONAL INFORMATION
   ========================================================= */

import {
    auth,
    db,
    doc
} from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import {
    getDoc
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";


/* =========================================================
   DOM ELEMENTS
   ========================================================= */

const nicknameElement =
    document.getElementById("nickname");

const fullNameElement =
    document.getElementById("fullName");

const middleNameElement =
    document.getElementById("middleName");

const surnameElement =
    document.getElementById("surname");

const emailElement =
    document.getElementById("email");

const phoneNumberElement =
    document.getElementById("phoneNumber");

const userIdElement =
    document.getElementById("userId");

const dateJoinedElement =
    document.getElementById("dateJoined");

const accountTierElement =
    document.getElementById("accountTier");


/* =========================================================
   CONSTANTS
   ========================================================= */

const NOT_AVAILABLE =
    "Not available";

const SIGN_IN_REQUIRED =
    "Please sign in to view your personal information.";


/* =========================================================
   SAFE DISPLAY
   ========================================================= */

function setText(
    element,
    value
) {

    if (!element) {
        return;
    }

    const text =
        String(value ?? "").trim();

    element.textContent =
        text || NOT_AVAILABLE;
}


/* =========================================================
   DATE FORMAT
   ========================================================= */

function formatDate(
    date
) {

    if (!(date instanceof Date)) {
        return NOT_AVAILABLE;
    }

    if (Number.isNaN(date.getTime())) {
        return NOT_AVAILABLE;
    }

    return new Intl.DateTimeFormat(
        "en-NG",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    ).format(date);
}


/* =========================================================
   CLEAR PROFILE
   ========================================================= */

function clearProfile() {

    setText(
        nicknameElement,
        ""
    );

    setText(
        fullNameElement,
        ""
    );

    setText(
        middleNameElement,
        ""
    );

    setText(
        surnameElement,
        ""
    );

    setText(
        emailElement,
        ""
    );

    setText(
        phoneNumberElement,
        ""
    );

    /*
     * Account section intentionally keeps its
     * existing Tier 1 display.
     */

    setText(
        userIdElement,
        ""
    );

    setText(
        dateJoinedElement,
        ""
    );

    if (accountTierElement) {

        accountTierElement.textContent =
            "Tier 1";
    }
}


/* =========================================================
   LOAD USER PROFILE
   ========================================================= */

async function loadUserProfile(
    firebaseUser
) {

    if (!firebaseUser?.uid) {

        throw new Error(
            "Authenticated user identity is unavailable."
        );
    }


    /*
     * IMPORTANT SECURITY DESIGN:
     *
     * We NEVER accept a UID from:
     *
     * - the URL
     * - query parameters
     * - localStorage
     * - HTML
     * - user input
     *
     * The UID comes directly from Firebase Authentication.
     */

    const userUid =
        firebaseUser.uid;


    const userReference =
        doc(
            db,
            "users",
            userUid
        );


    const userSnapshot =
        await getDoc(
            userReference
        );


    if (!userSnapshot.exists()) {

        throw new Error(
            "Your NovaPay profile could not be found."
        );
    }


    const profile =
        userSnapshot.data();


    /* =====================================================
       PERSONAL INFORMATION
    ===================================================== */

    setText(
        nicknameElement,
        profile.nickname
    );


    /*
     * register.js stores the first name under
     * "firstName".
     *
     * The Personal Information page displays
     * that value using the requested "Full Name" label.
     */

    setText(
        fullNameElement,
        profile.firstName
    );


    setText(
        middleNameElement,
        profile.middleName
    );


    setText(
        surnameElement,
        profile.surname
    );


    /*
     * Firebase Authentication is the authoritative
     * source for the authenticated user's email.
     *
     * We do not rely on an email supplied by the URL
     * or by the page.
     */

    setText(
        emailElement,
        firebaseUser.email ||
        profile.email
    );


    setText(
        phoneNumberElement,
        profile.phone
    );


    /* =====================================================
       ACCOUNT INFORMATION
    ===================================================== */

    setText(
        userIdElement,
        userUid
    );


    /*
     * Firebase Authentication provides the account
     * creation timestamp independently of Firestore.
     *
     * This means we do not need to trust a date supplied
     * by the webpage.
     */

    const creationTime =
        firebaseUser.metadata?.creationTime;


    if (creationTime) {

        setText(
            dateJoinedElement,
            formatDate(
                new Date(
                    creationTime
                )
            )
        );

    } else {

        /*
         * Fallback to Firestore createdAt if Firebase
         * Authentication does not provide creationTime.
         */

        const createdAt =
            profile.createdAt;


        if (
            createdAt &&
            typeof createdAt.toDate === "function"
        ) {

            setText(
                dateJoinedElement,
                formatDate(
                    createdAt.toDate()
                )
            );

        } else {

            setText(
                dateJoinedElement,
                ""
            );
        }
    }


    /*
     * Tier remains Tier 1 until the NovaPay backend
     * and account-tier system are implemented.
     */

    if (accountTierElement) {

        accountTierElement.textContent =
            "Tier 1";
    }
}


/* =========================================================
   AUTHENTICATION STATE
   ========================================================= */

onAuthStateChanged(
    auth,
    async firebaseUser => {

        clearProfile();


        if (!firebaseUser) {

            console.warn(
                "Personal information: no authenticated user."
            );

            /*
             * Do not attempt to load a profile when
             * there is no authenticated Firebase user.
             */

            return;
        }


        try {

            await loadUserProfile(
                firebaseUser
            );


            console.log(
                "NovaPay personal information loaded."
            );

        } catch (error) {

            console.error(
                "Could not load personal information:",
                error
            );


            /*
             * Do not expose raw Firestore/Firebase
             * errors to the user.
             */

            clearProfile();

            if (nicknameElement) {

                nicknameElement.textContent =
                    "Unable to load";
            }
        }
    }
); 
