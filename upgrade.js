/* =========================================================
   NovaPay — Upgrade Account
   Frontend KYC controller
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

  const REQUEST_TIMEOUT = 30000;

  const TIERS = {
    1: {
      name: "Free",
      verification: null
    },

    2: {
      name: "Verified",
      verification: "NIN"
    },

    3: {
      name: "Advanced",
      verification: "BVN"
    }
  };


  /* =======================================================
     DOM
     ======================================================= */

  const backBtn =
    document.getElementById("backBtn");

  const accountStatus =
    document.getElementById("accountStatus");

  const currentTier =
    document.getElementById("currentTier");

  const statusBadge =
    document.getElementById("statusBadge");

  const upgradeTier2Btn =
    document.getElementById("upgradeTier2Btn");

  const upgradeTier3Btn =
    document.getElementById("upgradeTier3Btn");

  const verificationPanel =
    document.getElementById("verificationPanel");

  const verificationTierLabel =
    document.getElementById("verificationTierLabel");

  const verificationTitle =
    document.getElementById("verificationTitle");

  const verificationDescription =
    document.getElementById("verificationDescription");

  const closeVerificationBtn =
    document.getElementById("closeVerificationBtn");

  const verificationForm =
    document.getElementById("verificationForm");

  const verificationInputLabel =
    document.getElementById("verificationInputLabel");

  const identityNumber =
    document.getElementById("identityNumber");

  const submitVerificationBtn =
    document.getElementById("submitVerificationBtn");

  const verificationError =
    document.getElementById("verificationError");

  const verificationPending =
    document.getElementById("verificationPending");

  const verificationSuccess =
    document.getElementById("verificationSuccess");

  const pageMessage =
    document.getElementById("pageMessage");


  /* =======================================================
     Required element validation
     ======================================================= */

  const requiredElements = [
    backBtn,
    accountStatus,
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

  if (
    requiredElements.some(
      (element) => !element
    )
  ) {
    console.error(
      "NovaPay Upgrade: one or more required HTML elements are missing."
    );

    return;
  }


  /* =======================================================
     State
     ======================================================= */

  let accountTier = null;

  let selectedVerificationTier = null;

  let isSubmitting = false;


  /* =======================================================
     Messages
     ======================================================= */

  function showPageMessage(
    message,
    type = "info"
  ) {
    pageMessage.textContent = message;

    pageMessage.className =
      `page-message ${type}`;

    pageMessage.hidden = false;
  }


  function hidePageMessage() {
    pageMessage.hidden = true;

    pageMessage.textContent = "";

    pageMessage.className =
      "page-message";
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

    verificationError.textContent =
      message;

    verificationError.hidden = false;
  }


  function showVerificationPending(message) {
    hideVerificationMessages();

    verificationPending.textContent =
      message;

    verificationPending.hidden = false;
  }


  function showVerificationSuccess(message) {
    hideVerificationMessages();

    verificationSuccess.textContent =
      message;

    verificationSuccess.hidden = false;
  }


  /* =======================================================
     Tier helpers
     ======================================================= */

  function normalizeTier(value) {
    const tier = Number(value);

    if (
      tier === 1 ||
      tier === 2 ||
      tier === 3
    ) {
      return tier;
    }

    return null;
  }


  function getVerificationName(tier) {
    if (tier === 2) {
      return "NIN";
    }

    if (tier === 3) {
      return "BVN";
    }

    return null;
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
     Identity number validation
     ======================================================= */

  function sanitizeIdentityNumber(value) {
    return String(value || "")
      .replace(/\D/g, "")
      .slice(0, 11);
  }


  function isValidIdentityNumber(value) {
    return /^\d{11}$/.test(value);
  }


  /* =======================================================
     Firebase authentication
     ======================================================= */

  async function getFirebaseIdToken() {
    /*
     * NovaPay backend requires a Firebase ID token.
     *
     * This supports the Firebase compat/global setup used
     * by the existing frontend.
     */

    if (
      typeof window.firebase === "undefined"
    ) {
      throw new Error(
        "Firebase is not available on this page."
      );
    }


    if (
      typeof window.firebase.auth !== "function"
    ) {
      throw new Error(
        "Firebase Authentication is not available on this page."
      );
    }


    const auth =
      window.firebase.auth();


    const user =
      auth.currentUser;


    if (!user) {
      throw new Error(
        "Please sign in to your NovaPay account first."
      );
    }


    return user.getIdToken(true);
  }


  /* =======================================================
     Authenticated backend request
     ======================================================= */

  async function authenticatedRequest(
    url,
    options = {}
  ) {
    const token =
      await getFirebaseIdToken();


    const headers =
      new Headers(
        options.headers || {}
      );


    headers.set(
      "Authorization",
      `Bearer ${token}`
    );


    headers.set(
      "Accept",
      "application/json"
    );


    if (
      options.body &&
      !(options.body instanceof FormData) &&
      !headers.has("Content-Type")
    ) {
      headers.set(
        "Content-Type",
        "application/json"
      );
    }


    const controller =
      new AbortController();


    const timeoutId =
      window.setTimeout(
        () => {
          controller.abort();
        },
        REQUEST_TIMEOUT
      );


    try {
      const response =
        await fetch(
          url,
          {
            ...options,
            headers,
            signal:
              controller.signal,
            credentials:
              "same-origin"
          }
        );


      let responseData = null;


      try {
        responseData =
          await response.json();
      } catch {
        responseData = null;
      }


      if (!response.ok) {
        const error =
          new Error(
            getBackendErrorMessage(
              responseData,
              response.status
            )
          );


        error.status =
          response.status;


        error.data =
          responseData;


        throw error;
      }


      return responseData;
    } finally {
      window.clearTimeout(
        timeoutId
      );
    }
  }


  /* =======================================================
     Backend error handling
     ======================================================= */

  function getBackendErrorMessage(
    data,
    status
  ) {
    if (
      data &&
      typeof data.message === "string" &&
      data.message.trim()
    ) {
      return data.message.trim();
    }


    if (
      data &&
      typeof data.msg === "string" &&
      data.msg.trim()
    ) {
      return data.msg.trim();
    }


    if (status === 401) {
      return "Your session has expired. Please sign in again.";
    }


    if (status === 403) {
      return "You are not allowed to perform this verification.";
    }


    if (status === 404) {
      return "The requested verification service was not found.";
    }


    if (status === 429) {
      return "Too many verification requests. Please try again later.";
    }


    if (status >= 500) {
      return "The verification service is temporarily unavailable.";
    }


    return "The request could not be completed.";
  }


  function getSafeErrorMessage(
    error,
    fallback
  ) {
    if (!error) {
      return fallback;
    }


    const message =
      typeof error.message === "string"
        ? error.message.trim()
        : "";


    if (!message) {
      return fallback;
    }


    /*
     * Never expose provider credentials,
     * provider internals or authorization
     * details to the user.
     */

    const blockedTerms = [
      "BABSPAY",
      "api_key",
      "API_KEY",
      "Authorization",
      "Bearer",
      "secret",
      "token"
    ];


    const containsBlockedTerm =
      blockedTerms.some(
        (term) =>
          message
            .toLowerCase()
            .includes(
              term.toLowerCase()
            )
      );


    if (
      containsBlockedTerm ||
      message.length > 180
    ) {
      return fallback;
    }


    return message;
  }


  /* =======================================================
     Extract account status
     ======================================================= */

  function extractAccountData(response) {
    if (
      response &&
      response.data &&
      typeof response.data === "object"
    ) {
      return response.data;
    }


    return response;
  }


  function extractTier(data) {
    if (!data) {
      return null;
    }


    return normalizeTier(
      data.tier ??
      data.accountTier ??
      data.currentTier
    );
  }


  /* =======================================================
     Update tier UI
     ======================================================= */

  function updateTierInterface(tier) {
    if (
      !TIERS[tier]
    ) {
      return;
    }


    accountTier = tier;


    currentTier.textContent =
      `Tier ${tier} — ${TIERS[tier].name}`;


    upgradeTier2Btn.disabled = true;
    upgradeTier3Btn.disabled = true;


    if (tier === 1) {
      statusBadge.textContent =
        "Current";

      upgradeTier2Btn.disabled =
        false;

      return;
    }


    if (tier === 2) {
      statusBadge.textContent =
        "Current";

      upgradeTier3Btn.disabled =
        false;

      return;
    }


    if (tier === 3) {
      statusBadge.textContent =
        "Maximum tier";

      return;
    }
  }


  /* =======================================================
     Load account status
     ======================================================= */

  async function loadAccountStatus() {
    accountTier = null;


    currentTier.textContent =
      "Checking...";


    statusBadge.textContent =
      "Loading";


    upgradeTier2Btn.disabled =
      true;

    upgradeTier3Btn.disabled =
      true;


    hidePageMessage();


    try {
      const response =
        await authenticatedRequest(
          ENDPOINTS.accountStatus,
          {
            method: "GET"
          }
        );


      const data =
        extractAccountData(
          response
        );


      const tier =
        extractTier(data);


      if (!tier) {
        console.error(
          "NovaPay Upgrade: invalid account status response.",
          {
            hasResponse:
              Boolean(response),
            responseKeys:
              response &&
              typeof response === "object"
                ? Object.keys(response)
                : []
          }
        );


        throw new Error(
          "The server returned an invalid account status."
        );
      }


      updateTierInterface(
        tier
      );
    } catch (error) {
      console.error(
        "NovaPay Upgrade: account status request failed.",
        error
      );


      currentTier.textContent =
        "Unavailable";


      statusBadge.textContent =
        "Error";


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
     Open verification panel
     ======================================================= */

  function openVerificationPanel(
    targetTier
  ) {
    const tier =
      normalizeTier(
        targetTier
      );


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


    /*
     * The frontend only allows the next
     * tier. The backend remains authoritative.
     */

    if (
      tier !== accountTier + 1
    ) {
      showPageMessage(
        "This verification is not available for your current account tier.",
        "error"
      );

      return;
    }


    const verificationName =
      getVerificationName(
        tier
      );


    if (!verificationName) {
      return;
    }


    selectedVerificationTier =
      tier;


    verificationTierLabel.textContent =
      `Tier ${tier} verification`;


    verificationTitle.textContent =
      `Verify your ${verificationName}`;


    if (tier === 2) {
      verificationDescription.textContent =
        "Enter your 11-digit NIN to request Tier 2 verification.";
    } else {
      verificationDescription.textContent =
        "Enter your 11-digit BVN to request Tier 3 verification.";
    }


    verificationInputLabel.textContent =
      verificationName;


    identityNumber.placeholder =
      `Enter 11-digit ${verificationName}`;


    identityNumber.value =
      "";


    identityNumber.maxLength =
      11;


    identityNumber.inputMode =
      "numeric";


    identityNumber.autocomplete =
      "off";


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


    submitVerificationBtn.disabled =
      false;


    identityNumber.disabled =
      false;


    hideVerificationMessages();


    verificationPanel.hidden =
      false;


    window.requestAnimationFrame(
      () => {
        identityNumber.focus();
      }
    );
  }


  /* =======================================================
     Close verification panel
     ======================================================= */

  function closeVerificationPanel() {
    if (isSubmitting) {
      return;
    }


    verificationPanel.hidden =
      true;


    selectedVerificationTier =
      null;


    identityNumber.value =
      "";


    identityNumber.disabled =
      false;


    identityNumber.setAttribute(
      "aria-invalid",
      "false"
    );


    hideVerificationMessages();
  }


  /* =======================================================
     Validate identity number
     ======================================================= */

  function validateIdentityInput() {
    const value =
      sanitizeIdentityNumber(
        identityNumber.value
      );


    identityNumber.value =
      value;


    if (
      !isValidIdentityNumber(
        value
      )
    ) {
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
     Extract verification result
     ======================================================= */

  function extractVerificationResult(
    response
  ) {
    if (
      response &&
      response.data &&
      typeof response.data === "object"
    ) {
      return response.data;
    }


    return response;
  }


  function getVerificationStatus(
    result
  ) {
    if (
      !result ||
      typeof result !== "object"
    ) {
      return "";
    }


    return String(
      result.status ??
      result.state ??
      result.verificationStatus ??
      ""
    )
      .trim()
      .toLowerCase();
  }


  /* =======================================================
     Submit verification
     ======================================================= */

  async function submitVerification() {
    if (isSubmitting) {
      return;
    }


    if (
      !selectedVerificationTier
    ) {
      showVerificationError(
        "Please select a verification level."
      );

      return;
    }


    const valid =
      validateIdentityInput();


    if (!valid) {
      identityNumber.focus();

      return;
    }


    const endpoint =
      getVerificationEndpoint(
        selectedVerificationTier
      );


    if (!endpoint) {
      showVerificationError(
        "This verification level is not available."
      );

      return;
    }


    const verificationName =
      getVerificationName(
        selectedVerificationTier
      );


    const identifier =
      identityNumber.value;


    isSubmitting =
      true;


    submitVerificationBtn.disabled =
      true;


    identityNumber.disabled =
      true;


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


      /*
       * The identity number is sent only to
       * the NovaPay backend.
       *
       * It is NOT sent directly from the
       * browser to BabsPay.
       */

      const response =
        await authenticatedRequest(
          endpoint,
          {
            method: "POST",
            body:
              JSON.stringify(
                payload
              )
          }
        );


      const result =
        extractVerificationResult(
          response
        );


      const verificationStatus =
        getVerificationStatus(
          result
        );


      /*
       * SUCCESS
       *
       * The backend has confirmed the
       * verification request.
       *
       * We still refresh the account status
       * rather than changing the tier
       * ourselves.
       */

      if (
        verificationStatus ===
          "success" ||
        verificationStatus ===
          "verified"
      ) {
        showVerificationSuccess(
          `${verificationName} verification was completed successfully.`
        );


        submitVerificationBtn.textContent =
          "Verification successful";


        await refreshAccountAfterVerification();


        return;
      }


      /*
       * PENDING
       *
       * Never upgrade the account while
       * verification is pending.
       */

      if (
        verificationStatus ===
          "pending" ||
        verificationStatus ===
          "processing"
      ) {
        showVerificationPending(
          `${verificationName} verification is still processing. Your account tier will not change until verification is confirmed.`
        );


        submitVerificationBtn.disabled =
          false;


        submitVerificationBtn.textContent =
          `Check ${verificationName} status`;


        return;
      }


      /*
       * FAILURE / UNKNOWN PROVIDER RESULT
       */

      showVerificationError(
        getSafeVerificationResultMessage(
          result,
          `${verificationName} verification was not successful.`
        )
      );


      submitVerificationBtn.disabled =
        false;


      submitVerificationBtn.textContent =
        `Verify ${verificationName}`;
    } catch (error) {
      console.error(
        "NovaPay Upgrade: verification request failed.",
        error
      );


      /*
       * A timeout/network/server error does
       * NOT automatically mean the provider
       * failed the verification.
       */

      if (
        error.name ===
        "AbortError"
      ) {
        showVerificationPending(
          "The verification request timed out. Refresh your account status before trying again."
        );
      } else if (
        error.status >= 500 ||
        !error.status
      ) {
        showVerificationPending(
          "We could not confirm the verification result. Refresh your account status before trying again."
        );
      } else {
        showVerificationError(
          getSafeErrorMessage(
            error,
            "Verification could not be completed."
          )
        );
      }


      submitVerificationBtn.disabled =
        false;


      submitVerificationBtn.textContent =
        `Verify ${verificationName}`;
    } finally {
      isSubmitting =
        false;


      identityNumber.disabled =
        false;
    }
  }


  /* =======================================================
     Safe verification message
     ======================================================= */

  function getSafeVerificationResultMessage(
    result,
    fallback
  ) {
    if (
      !result ||
      typeof result !== "object"
    ) {
      return fallback;
    }


    const message =
      typeof result.message === "string"
        ? result.message.trim()
        : typeof result.msg === "string"
          ? result.msg.trim()
          : "";


    if (
      !message ||
      message.length > 180
    ) {
      return fallback;
    }


    const blockedTerms = [
      "BABSPAY",
      "api_key",
      "API_KEY",
      "Authorization",
      "Bearer",
      "secret"
    ];


    const unsafe =
      blockedTerms.some(
        (term) =>
          message
            .toLowerCase()
            .includes(
              term.toLowerCase()
            )
      );


    if (unsafe) {
      return fallback;
    }


    return message;
  }


  /* =======================================================
     Refresh account after verification
     ======================================================= */

  async function refreshAccountAfterVerification() {
    try {
      /*
       * Give Firestore persistence a short
       * moment before requesting the
       * authoritative account status.
       */

      await new Promise(
        (resolve) => {
          window.setTimeout(
            resolve,
            700
          );
        }
      );


      const response =
        await authenticatedRequest(
          ENDPOINTS.accountStatus,
          {
            method: "GET"
          }
        );


      const data =
        extractAccountData(
          response
        );


      const newTier =
        extractTier(data);


      if (!newTier) {
        throw new Error(
          "The server returned an invalid account status."
        );
      }


      const requestedTier =
        selectedVerificationTier;


      updateTierInterface(
        newTier
      );


      /*
       * Only consider the upgrade complete
       * when the backend's account status
       * actually reflects the requested tier.
       */

      if (
        requestedTier &&
        newTier >= requestedTier
      ) {
        showVerificationSuccess(
          `Your account is now Tier ${newTier}.`
        );


        submitVerificationBtn.textContent =
          "Verification successful";


        window.setTimeout(
          () => {
            if (
              !isSubmitting
            ) {
              closeVerificationPanel();
            }
          },
          1200
        );


        return;
      }


      /*
       * Provider returned success but the
       * authoritative account status has
       * not changed yet.
       */

      showVerificationPending(
        "Verification was received, but your account tier has not changed yet. Please check again shortly."
      );


      submitVerificationBtn.disabled =
        false;


      if (requestedTier) {
        submitVerificationBtn.textContent =
          `Check ${getVerificationName(
            requestedTier
          )} status`;
      }
    } catch (error) {
      console.error(
        "NovaPay Upgrade: failed to refresh account status.",
        error
      );


      showVerificationPending(
        "Verification was received, but we could not refresh your account status. Refresh the page before submitting again."
      );


      submitVerificationBtn.disabled =
        false;


      submitVerificationBtn.textContent =
        "Refresh account status";
    }
  }


  /* =======================================================
     Input handling
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
      window.setTimeout(
        () => {
          identityNumber.value =
            sanitizeIdentityNumber(
              identityNumber.value
            );
        },
        0
      );
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
     Back button
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


  /* =======================================================
     Tier buttons
     ======================================================= */

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


  /* =======================================================
     Close verification
     ======================================================= */

  closeVerificationBtn.addEventListener(
    "click",
    () => {
      closeVerificationPanel();
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
     Initial state
     ======================================================= */

  verificationPanel.hidden =
    true;


  upgradeTier2Btn.disabled =
    true;


  upgradeTier3Btn.disabled =
    true;


  /* =======================================================
     Start
     ======================================================= */

  loadAccountStatus();

})();