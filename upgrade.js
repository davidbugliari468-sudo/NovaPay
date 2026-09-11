/* =========================================================
   NovaPay — Upgrade Account
   Complete frontend controller
   ========================================================= */

(() => {
  "use strict";

  /* =======================================================
     Configuration
     ======================================================= */

  const API_BASE_URL = "/api";

  const ENDPOINTS = {
    accountStatus: `${API_BASE_URL}/kyc/status`,
    verifyNin: `${API_BASE_URL}/kyc/verify-nin`,
    verifyBvn: `${API_BASE_URL}/kyc/verify-bvn`
  };

  const TIERS = {
    1: {
      name: "Free"
    },
    2: {
      name: "Verified"
    },
    3: {
      name: "Advanced"
    }
  };

  /* =======================================================
     DOM elements
     ======================================================= */

  const backBtn = document.getElementById("backBtn");

  const accountStatus = document.getElementById("accountStatus");
  const currentTier = document.getElementById("currentTier");
  const statusBadge = document.getElementById("statusBadge");

  const upgradeTier2Btn = document.getElementById("upgradeTier2Btn");
  const upgradeTier3Btn = document.getElementById("upgradeTier3Btn");

  const verificationPanel = document.getElementById("verificationPanel");
  const verificationTierLabel = document.getElementById(
    "verificationTierLabel"
  );
  const verificationTitle = document.getElementById("verificationTitle");
  const verificationDescription = document.getElementById(
    "verificationDescription"
  );

  const closeVerificationBtn = document.getElementById(
    "closeVerificationBtn"
  );

  const verificationForm = document.getElementById("verificationForm");

  const verificationInputLabel = document.getElementById(
    "verificationInputLabel"
  );

  const identityNumber = document.getElementById("identityNumber");

  const submitVerificationBtn = document.getElementById(
    "submitVerificationBtn"
  );

  const verificationError = document.getElementById("verificationError");
  const verificationPending = document.getElementById(
    "verificationPending"
  );
  const verificationSuccess = document.getElementById(
    "verificationSuccess"
  );

  const pageMessage = document.getElementById("pageMessage");

  /* =======================================================
     State
     ======================================================= */

  let accountTier = null;
  let selectedVerificationTier = null;
  let isSubmitting = false;

  /* =======================================================
     Basic safety check
     ======================================================= */

  const requiredElements = [
    backBtn,
    currentTier,
    statusBadge,
    upgradeTier2Btn,
    upgradeTier3Btn,
    verificationPanel,
    verificationTierLabel,
    verificationTitle,
    verificationDescription,
    closeVerificationBtn,
    verificationForm,
    verificationInputLabel,
    identityNumber,
    submitVerificationBtn,
    verificationError,
    verificationPending,
    verificationSuccess,
    pageMessage
  ];

  if (requiredElements.some((element) => !element)) {
    console.error("NovaPay upgrade page: required HTML element is missing.");
    return;
  }

  /* =======================================================
     Helpers
     ======================================================= */

  function showPageMessage(message, type = "info") {
    pageMessage.textContent = message;
    pageMessage.className = `page-message ${type}`;
    pageMessage.hidden = false;
  }

  function hidePageMessage() {
    pageMessage.hidden = true;
    pageMessage.textContent = "";
    pageMessage.className = "page-message";
  }

  function hideVerificationMessages() {
    verificationError.hidden = true;
    verificationPending.hidden = true;
    verificationSuccess.hidden = true;

    verificationError.textContent = "";
    verificationPending.textContent = "";
    verificationSuccess.textContent = "";
  }

  function showVerificationError(message) {
    hideVerificationMessages();

    verificationError.textContent = message;
    verificationError.hidden = false;
  }

  function showVerificationPending(message) {
    hideVerificationMessages();

    verificationPending.textContent = message;
    verificationPending.hidden = false;
  }

  function showVerificationSuccess(message) {
    hideVerificationMessages();

    verificationSuccess.textContent = message;
    verificationSuccess.hidden = false;
  }

  function normalizeTier(value) {
    const numericTier = Number(value);

    if (numericTier === 1 || numericTier === 2 || numericTier === 3) {
      return numericTier;
    }

    return null;
  }

  function sanitizeIdentityNumber(value) {
    return String(value || "")
      .replace(/\D/g, "")
      .slice(0, 11);
  }

  function isValidIdentityNumber(value) {
    return /^\d{11}$/.test(value);
  }

  function getVerificationName(tier) {
    return tier === 2 ? "NIN" : "BVN";
  }

  function getVerificationEndpoint(tier) {
    if (tier === 2) {
      return ENDPOINTS.verifyNin;
    }

    if (tier === 3) {
      return ENDPOINTS.verifyBvn;
    }

    return null;
  }

  /* =======================================================
     Firebase authentication
     ======================================================= */

  async function getFirebaseIdToken() {
    /*
     * This expects your existing Firebase application to expose
     * the authenticated user through the normal Firebase Auth
     * global object.
     *
     * If your project initializes Firebase differently, this
     * function is the only authentication section that needs
     * to be connected to that existing initialization.
     */

    if (
      typeof window.firebase === "undefined" ||
      !window.firebase.auth
    ) {
      throw new Error(
        "Firebase authentication is not available on this page."
      );
    }

    const user = window.firebase.auth().currentUser;

    if (!user) {
      throw new Error("Please sign in to continue.");
    }

    return user.getIdToken(true);
  }

  /* =======================================================
     Authenticated API request
     ======================================================= */

  async function authenticatedRequest(url, options = {}) {
    const token = await getFirebaseIdToken();

    const headers = new Headers(options.headers || {});

    headers.set("Authorization", `Bearer ${token}`);
    headers.set("Accept", "application/json");

    if (
      options.body &&
      !(options.body instanceof FormData) &&
      !headers.has("Content-Type")
    ) {
      headers.set("Content-Type", "application/json");
    }

    const controller = new AbortController();

    const timeoutId = window.setTimeout(() => {
      controller.abort();
    }, 30000);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
        credentials: "same-origin"
      });

      let data = null;

      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (!response.ok) {
        const errorMessage =
          data &&
          typeof data.message === "string" &&
          data.message.trim()
            ? data.message
            : "The request could not be completed.";

        const error = new Error(errorMessage);
        error.status = response.status;
        error.data = data;

        throw error;
      }

      return data;
    } finally {
      window.clearTimeout(timeoutId);
    }
  }

  /* =======================================================
     Account status
     ======================================================= */

  async function loadAccountStatus() {
    currentTier.textContent = "Checking...";
    statusBadge.textContent = "Loading";

    upgradeTier2Btn.disabled = true;
    upgradeTier3Btn.disabled = true;

    hidePageMessage();

    try {
      const response = await authenticatedRequest(
        ENDPOINTS.accountStatus,
        {
          method: "GET"
        }
      );

      const data = response && response.data
        ? response.data
        : response;

      const tier = normalizeTier(
        data &&
          (
            data.tier ??
            data.accountTier ??
            data.currentTier
          )
      );

      if (!tier) {
        throw new Error(
          "The server returned an invalid account tier."
        );
      }

      accountTier = tier;

      updateTierInterface(tier);
    } catch (error) {
      console.error(
        "NovaPay account status error:",
        error
      );

      currentTier.textContent = "Unavailable";
      statusBadge.textContent = "Error";

      showPageMessage(
        getSafeErrorMessage(
          error,
          "We could not load your account status. Please try again."
        ),
        "error"
      );
    }
  }

  /* =======================================================
     Update tier interface
     ======================================================= */

  function updateTierInterface(tier) {
    currentTier.textContent =
      `Tier ${tier} — ${TIERS[tier].name}`;

    statusBadge.textContent =
      tier === 3 ? "Maximum tier" : "Current";

    upgradeTier2Btn.disabled = true;
    upgradeTier3Btn.disabled = true;

    if (tier === 1) {
      upgradeTier2Btn.disabled = false;
      return;
    }

    if (tier === 2) {
      upgradeTier3Btn.disabled = false;
      return;
    }

    if (tier === 3) {
      upgradeTier2Btn.disabled = true;
      upgradeTier3Btn.disabled = true;
    }
  }

  /* =======================================================
     Open verification panel
     ======================================================= */

  function openVerificationPanel(targetTier) {
    const tier = normalizeTier(targetTier);

    if (!tier) {
      return;
    }

    if (accountTier === null) {
      showPageMessage(
        "Your account status is still loading. Please wait.",
        "info"
      );

      return;
    }

    if (tier !== accountTier + 1) {
      showPageMessage(
        "This verification is not available for your current account tier.",
        "error"
      );

      return;
    }

    selectedVerificationTier = tier;

    const verificationName = getVerificationName(tier);

    verificationTierLabel.textContent =
      `Tier ${tier} verification`;

    verificationTitle.textContent =
      `Verify your ${verificationName}`;

    verificationDescription.textContent =
      tier === 2
        ? "Enter your 11-digit NIN to request Tier 2 verification."
        : "Enter your 11-digit BVN to request Tier 3 verification.";

    verificationInputLabel.textContent =
      verificationName;

    identityNumber.placeholder =
      `Enter 11-digit ${verificationName}`;

    identityNumber.value = "";
    identityNumber.maxLength = 11;
    identityNumber.inputMode = "numeric";
    identityNumber.setAttribute(
      "aria-label",
      `${verificationName} number`
    );
    identityNumber.setAttribute(
      "aria-invalid",
      "false"
    );

    submitVerificationBtn.textContent =
      `Verify ${verificationName}`;

    submitVerificationBtn.disabled = false;

    hideVerificationMessages();

    verificationPanel.hidden = false;

    window.requestAnimationFrame(() => {
      identityNumber.focus();
    });
  }

  /* =======================================================
     Close verification panel
     ======================================================= */

  function closeVerificationPanel() {
    if (isSubmitting) {
      return;
    }

    verificationPanel.hidden = true;
    selectedVerificationTier = null;

    identityNumber.value = "";
    identityNumber.setAttribute(
      "aria-invalid",
      "false"
    );

    hideVerificationMessages();
  }

  /* =======================================================
     Validate input
     ======================================================= */

  function validateIdentityInput() {
    const value = sanitizeIdentityNumber(
      identityNumber.value
    );

    identityNumber.value = value;

    if (!isValidIdentityNumber(value)) {
      identityNumber.setAttribute(
        "aria-invalid",
        "true"
      );

      showVerificationError(
        "Enter exactly 11 digits."
      );

      return false;
    }

    identityNumber.setAttribute(
      "aria-invalid",
      "false"
    );

    return true;
  }

  /* =======================================================
     Submit verification
     ======================================================= */

  async function submitVerification() {
    if (isSubmitting) {
      return;
    }

    if (!selectedVerificationTier) {
      showVerificationError(
        "Please select a verification level."
      );

      return;
    }

    const valid = validateIdentityInput();

    if (!valid) {
      identityNumber.focus();
      return;
    }

    const endpoint = getVerificationEndpoint(
      selectedVerificationTier
    );

    if (!endpoint) {
      showVerificationError(
        "This verification level is not available."
      );

      return;
    }

    const verificationName =
      getVerificationName(selectedVerificationTier);

    const identifier = identityNumber.value;

    isSubmitting = true;

    submitVerificationBtn.disabled = true;
    identityNumber.disabled = true;

    hideVerificationMessages();

    submitVerificationBtn.textContent =
      `Verifying ${verificationName}...`;

    try {
      const payload =
        selectedVerificationTier === 2
          ? {
              nin: identifier
            }
          : {
              bvn: identifier
            };

      const response = await authenticatedRequest(
        endpoint,
        {
          method: "POST",
          body: JSON.stringify(payload)
        }
      );

      const result =
        response && response.data
          ? response.data
          : response;

      const providerStatus =
        String(
          result &&
            (
              result.status ??
              result.state ??
              result.verificationStatus
            )
        ).toLowerCase();

      /*
       * IMPORTANT:
       * The frontend does not upgrade the account itself.
       * It only reacts to the backend result.
       */

      if (
        providerStatus === "success" ||
        providerStatus === "verified"
      ) {
        showVerificationSuccess(
          `${verificationName} verification completed successfully.`
        );

        submitVerificationBtn.textContent =
          "Verification successful";

        /*
         * Give the backend a moment to persist the new tier,
         * then fetch the authoritative account status again.
         */
        await refreshAccountAfterVerification();

        return;
      }

      if (
        providerStatus === "pending" ||
        providerStatus === "processing"
      ) {
        showVerificationPending(
          `${verificationName} verification is still processing. Your account tier will not change until verification is confirmed.`
        );

        submitVerificationBtn.disabled = false;
        submitVerificationBtn.textContent =
          `Check ${verificationName} status`;

        return;
      }

      showVerificationError(
        getSafeVerificationMessage(
          result,
          `${verificationName} verification was not successful.`
        )
      );

      submitVerificationBtn.disabled = false;
      submitVerificationBtn.textContent =
        `Verify ${verificationName}`;
    } catch (error) {
      console.error(
        "NovaPay verification request failed:",
        error
      );

      /*
       * Never tell the user that verification failed merely
       * because the browser lost connection.
       */
      if (error.name === "AbortError") {
        showVerificationPending(
          "The verification request timed out. Please refresh your account status before trying again."
        );
      } else if (
        error.status >= 500 ||
        !error.status
      ) {
        showVerificationPending(
          "We could not confirm the verification result. Please refresh your account status before trying again."
        );
      } else {
        showVerificationError(
          getSafeErrorMessage(
            error,
            "Verification could not be completed."
          )
        );
      }

      submitVerificationBtn.disabled = false;
      submitVerificationBtn.textContent =
        `Verify ${verificationName}`;
    } finally {
      isSubmitting = false;
      identityNumber.disabled = false;
    }
  }

  /* =======================================================
     Refresh account status
     ======================================================= */

  async function refreshAccountAfterVerification() {
    try {
      await new Promise((resolve) => {
        window.setTimeout(resolve, 700);
      });

      const response = await authenticatedRequest(
        ENDPOINTS.accountStatus,
        {
          method: "GET"
        }
      );

      const data = response && response.data
        ? response.data
        : response;

      const newTier = normalizeTier(
        data &&
          (
            data.tier ??
            data.accountTier ??
            data.currentTier
          )
      );

      if (!newTier) {
        throw new Error(
          "The server returned an invalid account tier."
        );
      }

      accountTier = newTier;

      updateTierInterface(newTier);

      if (
        selectedVerificationTier &&
        newTier >= selectedVerificationTier
      ) {
        submitVerificationBtn.textContent =
          "Verification successful";

        showVerificationSuccess(
          `Your account is now Tier ${newTier}.`
        );

        window.setTimeout(() => {
          closeVerificationPanel();
        }, 1200);

        return;
      }

      /*
       * Verification response succeeded but the tier has not
       * changed yet. Do not assume an upgrade.
       */
      showVerificationPending(
        "Verification was received, but your account tier has not changed yet. Please check again shortly."
      );

      submitVerificationBtn.disabled = false;

      submitVerificationBtn.textContent =
        `Check ${getVerificationName(
          selectedVerificationTier
        )} status`;
    } catch (error) {
      console.error(
        "NovaPay tier refresh failed:",
        error
      );

      showVerificationPending(
        "Verification was received, but we could not refresh your account status. Please refresh this page before submitting again."
      );

      submitVerificationBtn.disabled = false;
      submitVerificationBtn.textContent =
        "Refresh account status";
    }
  }

  /* =======================================================
     Safe error handling
     ======================================================= */

  function getSafeErrorMessage(
    error,
    fallback
  ) {
    if (!error) {
      return fallback;
    }

    if (
      error.message &&
      typeof error.message === "string"
    ) {
      const message = error.message.trim();

      /*
       * Only display short, controlled messages.
       * Do not expose raw provider responses or internal
       * backend details.
       */
      if (
        message &&
        message.length <= 180 &&
        !message.includes("BABSPAY") &&
        !message.includes("api_key") &&
        !message.includes("Authorization")
      ) {
        return message;
      }
    }

    return fallback;
  }

  function getSafeVerificationMessage(
    result,
    fallback
  ) {
    if (!result || typeof result !== "object") {
      return fallback;
    }

    const message =
      typeof result.message === "string"
        ? result.message
        : typeof result.msg === "string"
          ? result.msg
          : "";

    if (
      message &&
      message.length <= 180
    ) {
      return message;
    }

    return fallback;
  }

  /* =======================================================
     Button events
     ======================================================= */

  backBtn.addEventListener(
    "click",
    () => {
      if (
        window.history.length > 1
      ) {
        window.history.back();
      } else {
        window.location.href = "/";
      }
    }
  );

  upgradeTier2Btn.addEventListener(
    "click",
    () => {
      openVerificationPanel(2);
    }
  );

  upgradeTier3Btn.addEventListener(
    "click",
    () => {
      openVerificationPanel(3);
    }
  );

  closeVerificationBtn.addEventListener(
    "click",
    () => {
      closeVerificationPanel();
    }
  );

  /* =======================================================
     Input events
     ======================================================= */

  identityNumber.addEventListener(
    "input",
    () => {
      identityNumber.value =
        sanitizeIdentityNumber(
          identityNumber.value
        );

      identityNumber.setAttribute(
        "aria-invalid",
        "false"
      );

      if (
        !verificationError.hidden
      ) {
        hideVerificationMessages();
      }
    }
  );

  identityNumber.addEventListener(
    "paste",
    () => {
      window.setTimeout(() => {
        identityNumber.value =
          sanitizeIdentityNumber(
            identityNumber.value
          );
      }, 0);
    }
  );

  /* =======================================================
     Form submit
     ======================================================= */

  verificationForm.addEventListener(
    "submit",
    (event) => {
      event.preventDefault();
      submitVerification();
    }
  );

  /* =======================================================
     Escape key
     ======================================================= */

  document.addEventListener(
    "keydown",
    (event) => {
      if (
        event.key === "Escape" &&
        !verificationPanel.hidden &&
        !isSubmitting
      ) {
        closeVerificationPanel();
      }
    }
  );

  /* =======================================================
     Initial page load
     ======================================================= */

  loadAccountStatus();
})();