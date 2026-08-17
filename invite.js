// ==========================================
// NOVAPAY — INVITE & EARN
// FRONTEND-ONLY VERSION
// ==========================================


// ==========================================
// ELEMENTS
// ==========================================

const backButton =
    document.querySelector(".back-btn");

const helpButton =
    document.querySelector(".help-btn");

const copyButton =
    document.querySelector(".copy-btn");

const shareButton =
    document.querySelector(".share-btn");

const inviteNowButton =
    document.querySelector(".invite-now-btn");

const historyButton =
    document.querySelector(".history-btn");

const filterButton =
    document.querySelector(".filter-btn");

const referralCodeElement =
    document.querySelector(".code-header h2");

const faqItems =
    document.querySelectorAll(".faq-item");


// ==========================================
// NOVAPAY FRONTEND DEMO DATA
// ==========================================
//
// This is temporary UI data only.
//
// It is NOT connected to Firebase.
// It does NOT represent real earnings.
// It does NOT create referrals.
//
// The backend will replace this later.
// ==========================================

const referralDemoData = {

    code: "NPAY-000000",

    referrals: 0,

    maximumReferrals: 10,

    qualifiedReferrals: 0,

    totalEarned: 0

};


// ==========================================
// UPDATE REFERRAL DISPLAY
// ==========================================

function updateReferralDisplay() {

    const countElement =
        document.querySelector(".limit-label");

    const progressCount =
        document.querySelector(".progress-percent");

    const progressFill =
        document.querySelector(".progress-fill");

    const qualifiedText =
        document.querySelector(".progress-top strong");

    const totalEarned =
        document.querySelector(".earnings-info strong");


    // --------------------------------------
    // Referral count
    // --------------------------------------

    if (countElement) {

        countElement.textContent =
            `${referralDemoData.referrals} / ${referralDemoData.maximumReferrals}`;

    }


    // --------------------------------------
    // Progress percentage
    // --------------------------------------

    const percentage =
        Math.min(
            (
                referralDemoData.referrals /
                referralDemoData.maximumReferrals
            ) * 100,
            100
        );


    if (progressCount) {

        progressCount.textContent =
            `${Math.round(percentage)}%`;

    }


    if (progressFill) {

        progressFill.style.width =
            `${percentage}%`;

    }


    // --------------------------------------
    // Qualified referrals
    // --------------------------------------

    if (qualifiedText) {

        qualifiedText.textContent =
            `${referralDemoData.qualifiedReferrals} qualified referrals`;

    }


    // --------------------------------------
    // Total earnings
    // --------------------------------------

    if (totalEarned) {

        totalEarned.textContent =
            formatMoney(
                referralDemoData.totalEarned
            );

    }

}


// ==========================================
// MONEY FORMAT
// ==========================================

function formatMoney(
    amount
) {

    const value =
        Number(amount);


    if (
        !Number.isFinite(value)
    ) {

        return "₦0.00";

    }


    return (
        "₦" +
        value.toLocaleString(
            "en-NG",
            {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }
        )
    );

}


// ==========================================
// UPDATE CODE
// ==========================================

function updateReferralCode() {

    if (
        !referralCodeElement
    ) {

        return;

    }


    referralCodeElement.textContent =
        referralDemoData.code;

}


updateReferralCode();

updateReferralDisplay();


// ==========================================
// BACK BUTTON
// ==========================================
//
// For now we return to the previous page.
// During the final navigation integration,
// this can point directly to Dashboard.
//
// ==========================================

backButton?.addEventListener(
    "click",
    () => {

        if (
            window.history.length > 1
        ) {

            window.history.back();

        }

        else {

            window.location.href =
                "dashboard.html";

        }

    }
);


// ==========================================
// COPY REFERRAL CODE
// ==========================================

copyButton?.addEventListener(
    "click",
    async () => {

        const code =
            referralDemoData.code;


        try {

            if (
                navigator.clipboard &&
                window.isSecureContext
            ) {

                await navigator.clipboard.writeText(
                    code
                );

            }

            else {

                copyTextFallback(
                    code
                );

            }


            showTemporaryButtonMessage(
                copyButton,
                "Copied ✓"
            );

        }

        catch (error) {

            console.error(
                "NovaPay copy error:",
                error
            );


            showTemporaryButtonMessage(
                copyButton,
                "Copy failed"
            );

        }

    }
);


// ==========================================
// COPY FALLBACK
// ==========================================

function copyTextFallback(
    text
) {

    const textarea =
        document.createElement(
            "textarea"
        );


    textarea.value =
        text;


    textarea.setAttribute(
        "readonly",
        ""
    );


    textarea.style.position =
        "fixed";

    textarea.style.opacity =
        "0";

    textarea.style.pointerEvents =
        "none";


    document.body.appendChild(
        textarea
    );


    textarea.select();


    const copied =
        document.execCommand(
            "copy"
        );


    document.body.removeChild(
        textarea
    );


    if (
        !copied
    ) {

        throw new Error(
            "Clipboard operation failed."
        );

    }

}


// ==========================================
// TEMPORARY BUTTON MESSAGE
// ==========================================

function showTemporaryButtonMessage(
    button,
    message
) {

    if (
        !button
    ) {

        return;

    }


    const originalText =
        button.textContent;


    button.textContent =
        message;


    setTimeout(
        () => {

            button.textContent =
                originalText;

        },
        1600
    );

}


// ==========================================
// SHARE INVITATION
// ==========================================

shareButton?.addEventListener(
    "click",
    async () => {

        const code =
            referralDemoData.code;


        const shareUrl =
            `${window.location.origin}/register.html?ref=${encodeURIComponent(code)}`;


        const shareText =
            `Join me on NovaPay. Use my invitation code ${code}.`;


        // ----------------------------------
        // Native share
        // ----------------------------------

        if (
            navigator.share
        ) {

            try {

                await navigator.share(
                    {
                        title:
                            "Join NovaPay",

                        text:
                            shareText,

                        url:
                            shareUrl
                    }
                );

                return;

            }

            catch (error) {

                /*
                 * User cancellation is not an
                 * application error.
                 */

                if (
                    error?.name ===
                    "AbortError"
                ) {

                    return;

                }


                console.warn(
                    "Native share unavailable:",
                    error
                );

            }

        }


        // ----------------------------------
        // Clipboard fallback
        // ----------------------------------

        try {

            const shareContent =
                `${shareText}\n${shareUrl}`;


            if (
                navigator.clipboard &&
                window.isSecureContext
            ) {

                await navigator.clipboard.writeText(
                    shareContent
                );

            }

            else {

                copyTextFallback(
                    shareContent
                );

            }


            showTemporaryButtonMessage(
                shareButton,
                "Link copied ✓"
            );

        }

        catch (error) {

            console.error(
                "NovaPay share error:",
                error
            );


            showTemporaryButtonMessage(
                shareButton,
                "Share unavailable"
            );

        }

    }
);


// ==========================================
// INVITE A FRIEND BUTTON
// ==========================================
//
// This button currently opens the native
// sharing flow through the main Share
// button instead of creating another
// referral system.
//
// ==========================================

inviteNowButton?.addEventListener(
    "click",
    () => {

        shareButton?.click();

    }
);


// ==========================================
// HELP BUTTON
// ==========================================

helpButton?.addEventListener(
    "click",
    () => {

        alert(
            "Invite & Earn\n\n" +
            "Share your NovaPay invitation " +
            "code with friends. Referral " +
            "rewards will become available " +
            "when the applicable campaign " +
            "requirements are met."
        );

    }
);


// ==========================================
// FAQ
// ==========================================

faqItems.forEach(
    (item) => {

        item.addEventListener(
            "click",
            () => {

                const isOpen =
                    item.classList.contains(
                        "open"
                    );


                // Close every other FAQ

                faqItems.forEach(
                    (otherItem) => {

                        otherItem.classList.remove(
                            "open"
                        );

                    }
                );


                // Toggle selected FAQ

                if (
                    !isOpen
                ) {

                    item.classList.add(
                        "open"
                    );

                }

            }
        );

    }
);


// ==========================================
// REFERRAL HISTORY
// ==========================================

historyButton?.addEventListener(
    "click",
    () => {

        alert(
            "Referral History\n\n" +
            "Your referral history will " +
            "appear here once the NovaPay " +
            "referral system is connected."
        );

    }
);


// ==========================================
// FILTER BUTTON
// ==========================================

filterButton?.addEventListener(
    "click",
    () => {

        alert(
            "Referral filters will be " +
            "available when referral data " +
            "is connected."
        );

    }
);


// ==========================================
// TERMS / PRIVACY PLACEHOLDERS
// ==========================================

const termsButtons =
    document.querySelectorAll(
        ".terms button"
    );


termsButtons.forEach(
    (button) => {

        button.addEventListener(
            "click",
            () => {

                alert(
                    "NovaPay referral terms " +
                    "will be displayed here " +
                    "during the final integration."
                );

            }
        );

    }
);


// ==========================================
// PREVENT ACCIDENTAL DOUBLE TAP
// ==========================================

let shareProcessing =
    false;


shareButton?.addEventListener(
    "click",
    () => {

        if (
            shareProcessing
        ) {

            return;

        }


        shareProcessing =
            true;


        setTimeout(
            () => {

                shareProcessing =
                    false;

            },
            1000
        );

    },
    true
);


// ==========================================
// PAGE READY
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        console.log(
            "NovaPay Invite & Earn page ready."
        );

    }
);


// ==========================================
// END
// ==========================================