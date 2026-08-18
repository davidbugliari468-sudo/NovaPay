/* =========================================
   NOVAPAY — HELP CENTRE
   Frontend only
   ========================================= */


/* =========================================
   ELEMENTS
   ========================================= */

const backBtn =
    document.getElementById("backBtn");

const helpSearch =
    document.getElementById("helpSearch");

const helpItems =
    document.querySelectorAll(".help-item");

const liveChatCard =
    document.querySelector(".live-chat-card");

const noResults =
    document.getElementById("noResults");


/* =========================================
   BACK BUTTON
   ========================================= */

backBtn?.addEventListener(
    "click",
    () => {

        window.location.href =
            "profile.html";

    }
);


/* =========================================
   HELP TOPICS
   ========================================= */

helpItems.forEach((item) => {

    item.addEventListener(
        "click",
        () => {

            const topic =
                item.dataset.topic ||
                "This help topic";

            showNotice(
                "Help Topic",
                `${topic} information will be available soon.`
            );

            pressItem(item);

        }
    );

});


/* =========================================
   LIVE CHAT
   ========================================= */

liveChatCard?.addEventListener(
    "click",
    () => {

        showNotice(
            "Live Chat",
            "NovaPay Live Chat is coming soon."
        );

        pressItem(liveChatCard);

    }
);


/* =========================================
   SEARCH
   ========================================= */

helpSearch?.addEventListener(
    "input",
    () => {

        const searchTerm =
            helpSearch.value
                .trim()
                .toLowerCase();

        let visibleItems = 0;


        helpItems.forEach((item) => {

            const text =
                item.textContent
                    .toLowerCase();

            const matches =
                text.includes(searchTerm);

            item.style.display =
                matches ? "flex" : "none";

            if (matches) {
                visibleItems++;
            }

        });


        if (noResults) {

            noResults.hidden =
                searchTerm !== "" &&
                visibleItems === 0;

        }

    }
);


/* =========================================
   SMALL PRESS EFFECT
   ========================================= */

function pressItem(item) {

    item.classList.add(
        "is-pressed"
    );

    setTimeout(
        () => {

            item.classList.remove(
                "is-pressed"
            );

        },
        150
    );

}


/* =========================================
   TEMPORARY NOTICE
   ========================================= */

function showNotice(
    title,
    message
) {

    const existingNotice =
        document.querySelector(
            ".nova-help-notice"
        );

    if (existingNotice) {
        existingNotice.remove();
    }


    const notice =
        document.createElement("div");

    notice.className =
        "nova-help-notice";


    notice.innerHTML = `
        <div class="nova-help-notice-title">
            ${escapeHtml(title)}
        </div>

        <div class="nova-help-notice-message">
            ${escapeHtml(message)}
        </div>
    `;


    document.body.appendChild(
        notice
    );


    requestAnimationFrame(
        () => {

            notice.classList.add(
                "show"
            );

        }
    );


    setTimeout(
        () => {

            notice.classList.remove(
                "show"
            );


            setTimeout(
                () => {

                    notice.remove();

                },
                200

            );

        },
        2200
    );

}


/* =========================================
   BASIC HTML ESCAPE
   ========================================= */

function escapeHtml(value) {

    return String(value)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


console.log(
    "✅ NovaPay Help Centre Ready"
);