/* =========================================
   NovaPay — More Services
   ========================================= */

document.addEventListener("DOMContentLoaded", () => {

    const backButton = document.getElementById("backButton");
    const serviceCards = document.querySelectorAll(".coming-soon-card");


    /* =========================================
       BACK BUTTON
       ========================================= */

    if (backButton) {
        backButton.addEventListener("click", () => {
            window.history.back();
        });
    }


    /* =========================================
       COMING SOON SERVICES
       
       These cards intentionally do not navigate
       anywhere yet.
       ========================================= */

    serviceCards.forEach((card) => {

        card.addEventListener("click", () => {

            // Give the user a small visual response.
            card.classList.add("is-pressed");

            // Remove the visual response shortly after.
            setTimeout(() => {
                card.classList.remove("is-pressed");
            }, 160);

        });

    });

});