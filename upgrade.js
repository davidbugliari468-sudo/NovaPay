/* =========================================================
   NovaPay — Upgrade Account
   Firebase + Render KYC frontend
   ========================================================= */

import {
  auth
} from "./firebase.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";


(() => {
  "use strict";


  /* =======================================================
     Configuration
     ======================================================= */

  const BACKEND_URL =
    "https://novapay-server.onrender.com";

  const API_BASE_URL =
    `${BACKEND_URL}/api`;

  const ENDPOINTS = {
    status:
      `${API_BASE_URL}/kyc/status`,

    nin:
      `${API_BASE_URL}/kyc/nin`,

    bvn:
      `${API_BASE_URL}/kyc/bvn`
  };

  const REQUEST_TIMEOUT =
    30000;


  /* =======================================================
     DOM
     ======================================================= */

  const backBtn =
    document.getElementById("backBtn");

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
     Validate HTML
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


  if (
    requiredElements.some(
      (element) => !element
    )
  ) {
    console.error(
      "NovaPay Upgrade: required HTML element is missing."
    );

    return;
  }


  /* =======================================================
     State
     ======================================================= */

  let accountTier = null;

  let selectedVerification =
    null;

  let isSubmitting = false;

  let currentUser = null;


  /* =======================================================
     Helpers
     ======================================================= */

  function normalizeTier(value) {
    const tier =
      Number(value);

    if (
      tier === 1 ||
      tier === 2 ||
      tier === 3
    ) {
      return tier;
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


  function getVerificationName() {
    if (
      selectedVerification === "nin"
    ) {
      return "NIN";
    }

    if (
      selectedVerification === "bvn"
    ) {
      return "BVN";
    }

    return "";
  }


  function getVerificationEndpoint() {
    if (
      selectedVerification === "nin"
    ) {
      return ENDPOINTS.nin;
    }

    if (
      selectedVerification === "bvn"
    ) {
      return ENDPOINTS.bvn;
    }

    return null;
  }


  /* =======================================================
     Page messages
     ======================================================= */

  function showPageMessage(
    message,
    type = "info"
  ) {
    pageMessage.textContent =
      message;

    pageMessage.className =
      `page-message ${type}`;

    pageMessage.hidden =
      false;
  }


  function hidePageMessage() {
    pageMessage.hidden =
      true;

    pageMessage.textContent =
      "";

    pageMessage.className =
      "page-message";
  }


  /* =======================================================
     Verification messages
     ======================================================= */

  function hideVerificationMessages() {
    verificationError.hidden =
      true;

    verificationPending.hidden =
      true;

    verificationSuccess.hidden =
      true;

    verificationError.textContent =
      "";

    verificationPending.textContent =
      "";

    verificationSuccess.textContent =
      "";
  }


  function showVerificationError(
    message
  ) {
    hideVerificationMessages();

    verificationError.textContent =
      message;

    verificationError.hidden =
      false;
  }


  function showVerificationPending(
    message
  ) {
    hideVerificationMessages();

    verificationPending.textContent =
      message;

    verificationPending.hidden =
      false;
  }


  function showVerificationSuccess(
    message
  ) {
    hideVerificationMessages();

    verificationSuccess.textContent =
      message;

    verificationSuccess.hidden =
      false;
  }


  /* =======================================================
     Safe server message
     ======================================================= */

  function getSafeServerMessage(
    response,
    fallback
  ) {
    if (
      !response ||
      typeof response !== "object"
    ) {
      return fallback;
    }


    const possibleMessage =
      typeof response.error === "string"
        ? response.error.trim()
        : typeof response.message === "string"
          ? response.message.trim()
          : "";


    if (
      !possibleMessage ||
      possibleMessage.length > 220
    ) {
      return fallback;
    }


    const blockedTerms = [
      "api_key",
      "BABSPAY_API_KEY",
      "authorization",
      "bearer",
      "secret",
      "token"
    ];


    const lowerMessage =
      possibleMessage.toLowerCase();


    const containsSensitiveTerm =
      blockedTerms.some(
        (term) =>
          lowerMessage.includes(
            term.toLowerCase()
          )
      );


    if (
      containsSensitiveTerm
    ) {
      return fallback;
    }


    return possibleMessage;
  }


  /* =======================================================
     Authenticated request
     ======================================================= */

  async function authenticatedRequest(
    endpoint,
    options = {}
  ) {
    if (!currentUser) {
      throw new Error(
        "Please sign in to your NovaPay account first."
      );
    }


    const token =
      await currentUser.getIdToken();


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
      !headers.has(
        "Content-Type"
      )
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
          endpoint,
          {
            ...options,
            headers,
            signal:
              controller.signal
          }
        );


      let data = null;


      try {
        data =
          await response.json();
      } catch {
        data = null;
      }


      if (!response.ok) {
        const error =
          new Error(
            getSafeServerMessage(
              data,
              `Request failed with status ${response.status}.`
            )
          );


        error.status =
          response.status;


        error.data =
          data;


        throw error;
      }


      return data;
    } finally {
      window.clearTimeout(
        timeoutId
      );
    }
  }


  /* =======================================================
     Account status
     ======================================================= */

  function extractTier(response) {
    if (
      !response ||
      typeof response !== "object"
    ) {
      return null;
    }


    return normalizeTier(
      response.tier ??
      response.accountTier ??
      response.currentTier
    );
  }


  async function loadAccountStatus() {
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
          ENDPOINTS.status,
          {
            method: "GET"
          }
        );


      const tier =
        extractTier(
          response
        );


      if (!tier) {
        console.error(
          "NovaPay Upgrade: unexpected status response.",
          response
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
        "NovaPay Upgrade: status request failed.",
        error
      );


      currentTier.textContent =
        "Unavailable";

      statusBadge.textContent =
        "Error";


      showPageMessage(
        getSafeServerMessage(
          error.data,
          error.message ||
            "We could not load your account status."
        ),
        "error"
      );
    }
  }


  /* =======================================================
     Tier interface
     ======================================================= */

  function updateTierInterface(
    tier
  ) {
    accountTier =
      tier;


    currentTier.textContent =
      `Tier ${tier} — ${
        tier === 1
          ? "Free"
          : tier === 2
            ? "Verified"
            : "Advanced"
      }`;


    upgradeTier2Btn.disabled =
      true;

    upgradeTier3Btn.disabled =
      true;


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
     Open verification
     ======================================================= */

  function openVerification(
    verification
  ) {
    if (
      accountTier === null
    ) {
      showPageMessage(
        "Your account status is still loading. Please wait.",
        "info"
      );

      return;
    }


    if (
      verification === "nin" &&
      accountTier !== 1
    ) {
      showPageMessage(
        "NIN verification is not available for your current account tier.",
        "error"
      );

      return;
    }


    if (
      verification === "bvn" &&
      accountTier !== 2
    ) {
      showPageMessage(
        "BVN verification is not available for your current account tier.",
        "error"
      );

      return;
    }


    selectedVerification =
      verification;


    const name =
      getVerificationName();


    verificationTierLabel.textContent =
      verification === "nin"
        ? "Tier 2 verification"
        : "Tier 3 verification";


    verificationTitle.textContent =
      `Verify your ${name}`;


    verificationDescription.textContent =
      verification === "nin"
        ? "Enter your 11-digit NIN to request Tier 2 verification."
        : "Enter your 11-digit BVN to request Tier 3 verification.";


    verificationInputLabel.textContent =
      name;


    identityNumber.placeholder =
      `Enter 11-digit ${name}`;


    identityNumber.value =
      "";


    identityNumber.maxLength =
      11;


    identityNumber.setAttribute(
      "aria-label",
      `${name} number`
    );


    identityNumber.setAttribute(
      "aria-invalid",
      "false"
    );


    submitVerificationBtn.textContent =
      `Verify ${name}`;


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


    verificationPanel.scrollIntoView({
      behavior: "smooth",
      block: "nearest"
    });
  }


  /* =======================================================
     Close verification
     ======================================================= */

  function closeVerification() {
    if (
      isSubmitting
    ) {
      return;
    }


    verificationPanel.hidden =
      true;


    selectedVerification =
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
     Validate input
     ======================================================= */

  function validateIdentityNumber() {
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
        `Enter exactly 11 digits for your ${getVerificationName()}.`
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
     Submit NIN/BVN
     ======================================================= */

  async function submitVerification() {
    if (
      isSubmitting
    ) {
      return;
    }


    if (
      !selectedVerification
    ) {
      showVerificationError(
        "Please select a verification level."
      );

      return;
    }


    if (
      !validateIdentityNumber()
    ) {
      identityNumber.focus();

      return;
    }


    const endpoint =
      getVerificationEndpoint();


    if (!endpoint) {
      showVerificationError(
        "This verification service is unavailable."
      );

      return;
    }


    const name =
      getVerificationName();


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
      `Verifying ${name}...`;


    try {
      const payload =
        selectedVerification === "nin"
          ? {
              nin: identifier
            }
          : {
              bvn: identifier
            };


      /*
       * IMPORTANT:
       *
       * The browser sends the identity number
       * only to NovaPay's Render backend.
       *
       * The browser does NOT call BabsPay.
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


      /*
       * Your backend returns:
       *
       * success
       * state
       * tier
       * message
       */

      const state =
        typeof response?.state === "string"
          ? response.state
              .trim()
              .toLowerCase()
          : "";


      const success =
        response?.success === true;


      /*
       * VERIFIED
       */

      if (
        success &&
        state === "verified"
      ) {
        showVerificationSuccess(
          response.message ||
            `${name} verification completed successfully.`
        );


        submitVerificationBtn.textContent =
          "Verification successful";


        /*
         * Do not manually set the tier.
         * Ask the backend for the new
         * authoritative account status.
         */

        await refreshAccountStatusAfterVerification();

        return;
      }


      /*
       * PENDING
       */

      if (
        state === "pending" ||
        state === "processing"
      ) {
        showVerificationPending(
          response.message ||
            `${name} verification is still processing. Your account tier will not change until verification is confirmed.`
        );


        submitVerificationBtn.disabled =
          false;


        submitVerificationBtn.textContent =
          `Check ${name} status`;


        return;
      }


      /*
       * FAILED
       */

      if (
        state === "failed" ||
        success === false
      ) {
        showVerificationError(
          getSafeServerMessage(
            response,
            `${name} verification was unsuccessful.`
          )
        );


        submitVerificationBtn.disabled =
          false;


        submitVerificationBtn.textContent =
          `Verify ${name}`;


        return;
      }


      /*
       * Unknown response
       */

      showVerificationPending(
        "The verification request was received, but its final status could not be confirmed. Refresh your account status before trying again."
      );


      submitVerificationBtn.disabled =
        false;


      submitVerificationBtn.textContent =
        `Check ${name} status`;
    } catch (error) {
      console.error(
        "NovaPay Upgrade: verification request failed.",
        error
      );


      if (
        error.name ===
        "AbortError"
      ) {
        showVerificationPending(
          "The verification request timed out. Refresh your account status before trying again."
        );
      } else if (
        error.status === 401
      ) {
        showVerificationError(
          "Your session has expired. Please sign in again."
        );
      } else if (
        error.status === 403
      ) {
        showVerificationError(
          error.message ||
            "You are not allowed to perform this verification."
        );
      } else if (
        error.status === 429
      ) {
        showVerificationError(
          error.message ||
            "Too many verification attempts. Please try again later."
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
          error.message ||
            "Verification could not be completed."
        );
      }


      submitVerificationBtn.disabled =
        false;


      submitVerificationBtn.textContent =
        `Verify ${name}`;
    } finally {
      isSubmitting =
        false;


      identityNumber.disabled =
        false;
    }
  }


  /* =======================================================
     Refresh backend account status
     ======================================================= */

  async function refreshAccountStatusAfterVerification() {
    try {
      await new Promise(
        (resolve) => {
          window.setTimeout(
            resolve,
            600
          );
        }
      );


      const response =
        await authenticatedRequest(
          ENDPOINTS.status,
          {
            method: "GET"
          }
        );


      const newTier =
        extractTier(
          response
        );


      if (!newTier) {
        throw new Error(
          "Invalid account status returned by the server."
        );
      }


      updateTierInterface(
        newTier
      );


      const requiredTier =
        selectedVerification === "nin"
          ? 2
          : 3;


      if (
        newTier >= requiredTier
      ) {
        showVerificationSuccess(
          `Your account is now Tier ${newTier}.`
        );


        submitVerificationBtn.textContent =
          "Verification successful";


        window.setTimeout(
          () => {
            if (!isSubmitting) {
              closeVerification();
            }
          },
          1200
        );


        return;
      }


      /*
       * Provider success does not automatically
       * mean the account tier has changed.
       */

      showVerificationPending(
        "Verification was received, but your account tier has not changed yet. Please check again shortly."
      );


      submitVerificationBtn.disabled =
        false;


      submitVerificationBtn.textContent =
        `Check ${
          getVerificationName()
        } status`;
    } catch (error) {
      console.error(
        "NovaPay Upgrade: account refresh failed.",
        error
      );


      showVerificationPending(
        "Verification was received, but we could not refresh your account status. Refresh this page before submitting again."
      );


      submitVerificationBtn.disabled =
        false;


      submitVerificationBtn.textContent =
        "Refresh account status";
    }
  }


  /* =======================================================
     Firebase authentication
     ======================================================= */

  onAuthStateChanged(
    auth,
    async (user) => {
      if (!user) {
        currentUser =
          null;

        accountTier =
          null;


        currentTier.textContent =
          "Sign in required";

        statusBadge.textContent =
          "Not signed in";


        upgradeTier2Btn.disabled =
          true;

        upgradeTier3Btn.disabled =
          true;


        showPageMessage(
          "Please sign in to your NovaPay account to manage your account verification.",
          "error"
        );


        return;
      }


      currentUser =
        user;


      hidePageMessage();


      /*
       * The backend requires a verified email.
       * We do not expose or log the user's
       * Firebase token.
       */

      if (
        !user.emailVerified
      ) {
        currentTier.textContent =
          "Email verification required";

        statusBadge.textContent =
          "Action required";


        upgradeTier2Btn.disabled =
          true;

        upgradeTier3Btn.disabled =
          true;


        showPageMessage(
          "Please verify your email address before upgrading your NovaPay account.",
          "error"
        );


        return;
      }


      await loadAccountStatus();
    }
  );


  /* =======================================================
     Input
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


  /* =======================================================
     Form
     ======================================================= */

  verificationForm.addEventListener(
    "submit",
    (event) => {
      event.preventDefault();

      submitVerification();
    }
  );


  /* =======================================================
     Buttons
     ======================================================= */

  upgradeTier2Btn.addEventListener(
    "click",
    () => {
      openVerification(
        "nin"
      );
    }
  );


  upgradeTier3Btn.addEventListener(
    "click",
    () => {
      openVerification(
        "bvn"
      );
    }
  );


  closeVerificationBtn.addEventListener(
    "click",
    () => {
      closeVerification();
    }
  );


  /* =======================================================
     Back
     ======================================================= */

  backBtn.addEventListener(
    "click",
    () => {
      if (
        window.history.length > 1
      ) {
        window.history.back();
      } else {
        window.location.href =
          "/";
      }
    }
  );


  /* =======================================================
     Escape
     ======================================================= */

  document.addEventListener(
    "keydown",
    (event) => {
      if (
        event.key === "Escape" &&
        !verificationPanel.hidden &&
        !isSubmitting
      ) {
        closeVerification();
      }
    }
  );


  /* =======================================================
     Initial UI state
     ======================================================= */

  verificationPanel.hidden =
    true;

  upgradeTier2Btn.disabled =
    true;

  upgradeTier3Btn.disabled =
    true;

})();