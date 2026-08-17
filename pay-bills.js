/* =========================================
   NovaPay — Payments & Services
   ========================================= */

document.addEventListener("DOMContentLoaded", () => {

    const backButton = document.getElementById("backButton");
    const headerSearchButton =
        document.getElementById("headerSearchButton");

    const searchInput =
        document.getElementById("serviceSearchInput");

    const noResults =
        document.getElementById("noResults");

    const serviceCards =
        document.querySelectorAll(".service-card");

    const otherServiceCards =
        document.querySelectorAll(".other-service-card");


    /* =========================================
       BACK BUTTON
       ========================================= */

    if (backButton) {
        backButton.addEventListener("click", () => {
            window.history.back();
        });
    }


    /* =========================================
       HEADER SEARCH BUTTON
       ========================================= */

    if (headerSearchButton && searchInput) {
        headerSearchButton.addEventListener("click", () => {
            searchInput.focus();

            searchInput.scrollIntoView({
                behavior: "smooth",
                block: "center"
            });
        });
    }


    /* =========================================
       BUILT SERVICES
       
       These services already have pages.
       ========================================= */

    serviceCards.forEach((card) => {

        card.addEventListener("click", () => {

            const url = card.dataset.url;

            if (!url) {
                return;
            }

            window.location.href = url;

        });

    });


    /* =========================================
       ATM CARD — COMING SOON
       
       No redirect.
       ========================================= */

    document
        .querySelectorAll('[data-status="coming-soon"]')
        .forEach((card) => {

            card.addEventListener("click", () => {

                showServiceNotice(
                    "Coming Soon",
                    "NovaPay ATM Card is coming soon."
                );

                pressCard(card);

            });

        });


    /* =========================================
       UNAVAILABLE SERVICES
       
       No redirect.
       ========================================= */

    document
        .querySelectorAll(
            '[data-status="temporarily-unavailable"]'
        )
        .forEach((card) => {

            card.addEventListener("click", () => {

                showServiceNotice(
                    "Temporarily Not Available",
                    "This service is not available right now."
                );

                pressCard(card);

            });

        });


    /* =========================================
       SEARCH
       ========================================= */

    if (searchInput) {

        searchInput.addEventListener("input", () => {

            const searchTerm =
                searchInput.value
                    .trim()
                    .toLowerCase();

            let visibleCount = 0;


            /*
             * Search quick service cards.
             */

            serviceCards.forEach((card) => {

                const text =
                    card.textContent.toLowerCase();

                const matches =
                    text.includes(searchTerm);

                card.style.display =
                    matches ? "" : "none";

                if (matches) {
                    visibleCount++;
                }

            });


            /*
             * Search other service cards.
             */

            otherServiceCards.forEach((card) => {

                const text =
                    card.textContent.toLowerCase();

                const matches =
                    text.includes(searchTerm);

                card.style.display =
                    matches ? "" : "none";

                if (matches) {
                    visibleCount++;
                }

            });


            /*
             * Show / hide no-results message.
             */

            if (noResults) {

                noResults.hidden =
                    searchTerm !== "" &&
                    visibleCount === 0;

            }

        });

    }


    /* =========================================
       SMALL PRESS ANIMATION
       ========================================= */

    function pressCard(card) {

        card.classList.add("is-pressed");

        setTimeout(() => {
            card.classList.remove("is-pressed");
        }, 160);

    }


    /* =========================================
       TEMPORARY SERVICE NOTICE
       
       This is only frontend behavior for now.
       No backend connection.
       ========================================= */

    function showServiceNotice(title, message) {

        const existing =
            document.querySelector(".nova-service-notice");

        if (existing) {
            existing.remove();
        }


        const notice =
            document.createElement("div");

        notice.className =
            "nova-service-notice";


        notice.innerHTML = `
            <div class="nova-service-notice-content">
                <div class="nova-service-notice-title">
                    ${escapeHtml(title)}
                </div>

                <div class="nova-service-notice-message">
                    ${escapeHtml(message)}
                </div>
            </div>
        `;


        document.body.appendChild(notice);


        requestAnimationFrame(() => {
            notice.classList.add("show");
        });


        setTimeout(() => {

            notice.classList.remove("show");

            setTimeout(() => {
                notice.remove();
            }, 220);

        }, 2200);

    }


    /* =========================================
       BASIC HTML ESCAPING
       ========================================= */

    function escapeHtml(value) {

        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

    }

});