"use strict";

import { auth } from "./firebase.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";


// =====================================================
// NOVAPAY BACKEND
// =====================================================

const BACKEND_URL =
  "https://novapay-server.onrender.com";


// =====================================================
// ADMIN BACKEND ENDPOINT
// =====================================================

const ADMIN_PROTECTED_URL =
  `${BACKEND_URL}/api/admin/protected`;


// =====================================================
// ELEMENTS
// =====================================================

document.addEventListener("DOMContentLoaded", () => {

  const manualToggle =
    document.getElementById("manualToggle");

  const manualClose =
    document.getElementById("manualClose");

  const adminManual =
    document.getElementById("adminManual");

  const manualBackdrop =
    document.getElementById("manualBackdrop");

  const manualScroll =
    document.getElementById("adminManualScroll");

  const adminStatus =
    document.getElementById("adminPageStatus");


  // ===================================================
  // ADMIN AUTHENTICATION STATE
  // ===================================================

  let adminAuthenticationComplete = false;

  let adminAuthenticationInProgress = false;


  // ===================================================
  // DEBUGGING
  // ===================================================

  function debugLog(stage, details = {}) {

    console.groupCollapsed(
      `%c[NOVAPAY ADMIN DEBUG] ${stage}`,
      "font-weight:bold;"
    );

    console.log(
      "Time:",
      new Date().toISOString()
    );

    console.log(
      "Page URL:",
      window.location.href
    );

    console.log(
      "Page Origin:",
      window.location.origin
    );

    console.log(
      "Backend URL:",
      BACKEND_URL
    );

    console.log(
      "Admin Protected URL:",
      ADMIN_PROTECTED_URL
    );

    console.log(
      "User Agent:",
      navigator.userAgent
    );

    if (
      details &&
      typeof details === "object"
    ) {
      console.log(
        "Details:",
        details
      );
    }

    console.groupEnd();
  }


  // ===================================================
  // STATUS
  // ===================================================

  function setStatus(message) {

    if (adminStatus) {
      adminStatus.textContent = message;
    }

  }


  // ===================================================
  // OPEN ADMIN MANUAL
  // ===================================================

  function openManual() {

    if (!adminManual) {
      return;
    }

    adminManual.classList.add("is-open");

    if (manualBackdrop) {
      manualBackdrop.classList.add("is-open");
    }

    adminManual.setAttribute(
      "aria-hidden",
      "false"
    );

    if (manualToggle) {
      manualToggle.setAttribute(
        "aria-expanded",
        "true"
      );
    }

    document.body.classList.add(
      "manual-open"
    );

    if (manualScroll) {

      requestAnimationFrame(() => {

        manualScroll.scrollTop = 0;

      });

    }

  }


  // ===================================================
  // CLOSE ADMIN MANUAL
  // ===================================================

  function closeManual() {

    if (!adminManual) {
      return;
    }

    adminManual.classList.remove(
      "is-open"
    );

    if (manualBackdrop) {
      manualBackdrop.classList.remove(
        "is-open"
      );
    }

    adminManual.setAttribute(
      "aria-hidden",
      "true"
    );

    if (manualToggle) {
      manualToggle.setAttribute(
        "aria-expanded",
        "false"
      );
    }

    document.body.classList.remove(
      "manual-open"
    );

    if (manualToggle) {
      manualToggle.focus();
    }

  }


  // ===================================================
  // TOGGLE ADMIN MANUAL
  // ===================================================

  function toggleManual() {

    const isOpen =
      adminManual &&
      adminManual.classList.contains(
        "is-open"
      );

    if (isOpen) {

      closeManual();

    } else {

      openManual();

    }

  }


  // ===================================================
  // MANUAL EVENTS
  // ===================================================

  if (manualToggle) {

    manualToggle.addEventListener(
      "click",
      toggleManual
    );

  }


  if (manualClose) {

    manualClose.addEventListener(
      "click",
      closeManual
    );

  }


  if (manualBackdrop) {

    manualBackdrop.addEventListener(
      "click",
      closeManual
    );

  }


  // ===================================================
  // ESCAPE KEY
  // ===================================================

  document.addEventListener(
    "keydown",
    (event) => {

      if (event.key !== "Escape") {
        return;
      }

      if (
        adminManual &&
        adminManual.classList.contains(
          "is-open"
        )
      ) {

        closeManual();

      }

    }
  );


  // ===================================================
  // ADMIN ACTION BUTTONS
  // ===================================================

  const actionButtons =
    document.querySelectorAll(
      "[data-admin-action]"
    );


  actionButtons.forEach(
    (button) => {

      button.addEventListener(
        "click",
        () => {

          const action =
            button.getAttribute(
              "data-admin-action"
            );

          if (!action) {
            return;
          }

          handleAdminAction(
            action
          );

        }
      );

    }
  );


  // ===================================================
  // ADMIN ACTION HANDLER
  // ===================================================

  function handleAdminAction(
    action
  ) {

    if (!adminAuthenticationComplete) {

      setStatus(
        "Admin authentication is still being verified."
      );

      return;

    }


    switch (action) {

      case "user-information":
        navigateTo("user-information");
        break;

      case "active-users":
        navigateTo("active-users");
        break;

      case "pending-transactions":
        navigateTo("pending-transactions");
        break;

      case "failed-transactions":
        navigateTo("failed-transactions");
        break;

      case "transactions":
        navigateTo("transactions");
        break;

      case "profit":
        navigateTo("profit");
        break;

      case "verification-records":
        navigateTo("verification-records");
        break;

      case "approve-user-kyc":
        navigateTo("approve-user-kyc");
        break;

      case "live-chat":
        navigateTo("live-chat");
        break;

      case "customer-support":
        navigateTo("customer-support");
        break;

      case "suspended-accounts":
        navigateTo("suspended-accounts");
        break;

      case "suspend-user":
        navigateTo("suspend-user");
        break;

      case "banned-accounts":
        navigateTo("banned-accounts");
        break;

      case "reward-user":
        navigateTo("reward-user");
        break;

      case "system-color":
        navigateTo("system-color");
        break;

      case "notifications":
        navigateTo("notifications");
        break;

      case "settings":
        navigateTo("settings");
        break;

      case "legal-content":
        navigateTo("legal-content");
        break;

      case "content":
        navigateTo("content");
        break;

      case "system-information":
        navigateTo("system-information");
        break;

      case "fraud-risk":
        navigateTo("fraud-risk");
        break;

      case "audit":
        navigateTo("audit");
        break;

      default:

        setStatus(
          "Admin action is not available."
        );

        break;

    }

  }


  // ===================================================
  // ADMIN PAGE ROUTES
  // ===================================================

  function navigateTo(
    action
  ) {

    const routes = {

      "user-information":
        "user-information.html",

      "active-users":
        "active-users.html",

      "pending-transactions":
        "pending-transactions.html",

      "failed-transactions":
        "failed-transactions.html",

      "transactions":
        "transactions.html",

      "profit":
        "profit.html",

      "verification-records":
        "verification-records.html",

      "approve-user-kyc":
        "approve-user-kyc.html",

      "live-chat":
        "live-chat.html",

      "customer-support":
        "customer-support.html",

      "suspended-accounts":
        "suspended-accounts.html",

      "suspend-user":
        "suspend-user.html",

      "banned-accounts":
        "banned-accounts.html",

      "reward-user":
        "reward-user.html",

      "system-color":
        "system-color.html",

      "notifications":
        "notifications.html",

      "settings":
        "settings.html",

      "legal-content":
        "legal-content.html",

      "content":
        "content.html",

      "system-information":
        "system-information.html",

      "fraud-risk":
        "fraud-risk.html",

      "audit":
        "audit.html"

    };


    const target =
      routes[action];


    if (!target) {

      setStatus(
        "This admin tool is not available."
      );

      return;

    }


    window.location.href =
      target;

  }


  // ===================================================
  // SET TEXT
  // ===================================================

  function setText(
    id,
    value
  ) {

    const element =
      document.getElementById(id);

    if (element) {

      element.textContent =
        value;

    }

  }


  // ===================================================
  // INITIALIZE DASHBOARD
  // ===================================================

  function initializeDashboard() {

    setText(
      "totalUsers",
      "0"
    );

    setText(
      "todayActiveUsers",
      "0"
    );

    setText(
      "totalProfit",
      "₦0"
    );


    if (adminStatus) {

      adminStatus.textContent =
        "Admin dashboard ready.";

    }


    initializeChart();

  }


  // ===================================================
  // INITIALIZE CHART
  // ===================================================

  function initializeChart() {

    const chart =
      document.getElementById(
        "analysisChart"
      );


    if (!chart) {
      return;
    }


    if (chart.children.length > 0) {
      return;
    }


    const wrapper =
      document.createElement(
        "div"
      );


    wrapper.style.width =
      "100%";

    wrapper.style.minHeight =
      "260px";

    wrapper.style.display =
      "flex";

    wrapper.style.alignItems =
      "center";

    wrapper.style.justifyContent =
      "center";

    wrapper.style.padding =
      "20px";

    wrapper.style.color =
      "#61718a";

    wrapper.style.fontSize =
      "13px";


    wrapper.textContent =
      "Analysis data will appear here.";


    chart.appendChild(
      wrapper
    );

  }


  // ===================================================
  // ADMIN AUTHENTICATION
  // ===================================================

  async function authenticateAdmin(
    user
  ) {

    if (adminAuthenticationInProgress) {
      return;
    }


    adminAuthenticationInProgress =
      true;


    try {

      debugLog(
        "ADMIN AUTHENTICATION STARTED",
        {
          firebaseUserFound:
            Boolean(user),

          uid:
            user?.uid || null,

          email:
            user?.email || null,

          emailVerified:
            user?.emailVerified === true
        }
      );


      if (!user) {

        adminAuthenticationComplete =
          false;


        setStatus(
          "Authentication required. Redirecting to login..."
        );


        debugLog(
          "NO FIREBASE USER",
          {
            reason:
              "No authenticated Firebase user was found."
          }
        );


        window.location.replace(
          "login.html"
        );


        return;

      }


      // ===============================================
      // GET FRESH FIREBASE ID TOKEN
      // ===============================================

      debugLog(
        "REQUESTING FRESH FIREBASE ID TOKEN",
        {
          uid: user.uid,
          email: user.email
        }
      );


      const idToken =
        await user.getIdToken(
          true
        );


      debugLog(
        "FIREBASE ID TOKEN RECEIVED",
        {
          tokenReceived:
            Boolean(idToken),

          tokenLength:
            idToken
              ? idToken.length
              : 0
        }
      );


      if (!idToken) {

        throw new Error(
          "Authentication token was not received."
        );

      }


      // ===============================================
      // CALL PROTECTED ADMIN BACKEND
      // ===============================================

      debugLog(
        "CALLING ADMIN PROTECTED ENDPOINT",
        {
          method: "GET",

          url:
            ADMIN_PROTECTED_URL,

          authorizationHeaderPresent:
            true,

          tokenLength:
            idToken.length
        }
      );


      let response;


      try {

        response =
          await fetch(
            ADMIN_PROTECTED_URL,
            {
              method: "GET",

              headers: {
                "Authorization":
                  `Bearer ${idToken}`,

                "Accept":
                  "application/json"
              },

              cache:
                "no-store"
            }
          );

      } catch (fetchError) {

        debugLog(
          "ADMIN BACKEND FETCH FAILED",
          {
            errorName:
              fetchError?.name,

            errorCode:
              fetchError?.code,

            errorMessage:
              fetchError?.message,

            likelyCause:
              "Possible CORS error, network error, blocked request, HTTPS/origin issue, DNS issue, or backend unavailable."
          }
        );


        throw new Error(
          "The NovaPay admin server could not be reached."
        );

      }


      debugLog(
        "ADMIN BACKEND RESPONSE RECEIVED",
        {
          status:
            response.status,

          statusText:
            response.statusText,

          ok:
            response.ok,

          url:
            response.url,

          redirected:
            response.redirected,

          type:
            response.type
        }
      );


      // ===============================================
      // READ ADMIN BACKEND RESPONSE
      // ===============================================

      const contentType =
        response.headers.get(
          "content-type"
        ) || "";


      let data = {};


      if (
        contentType.includes(
          "application/json"
        )
      ) {

        try {

          data =
            await response.json();

        } catch (jsonError) {

          debugLog(
            "ADMIN BACKEND JSON PARSE FAILED",
            {
              status:
                response.status,

              errorName:
                jsonError?.name,

              errorMessage:
                jsonError?.message
            }
          );


          throw new Error(
            "The admin server returned an invalid response."
          );

        }

      } else {

        const text =
          await response.text();


        data = {
          message: text
        };

      }


      debugLog(
        "ADMIN BACKEND RESPONSE DATA",
        {
          status:
            response.status,

          responseData:
            data
        }
      );


      // ===============================================
      // NOT AUTHENTICATED
      // ===============================================

      if (
        response.status === 401
      ) {

        adminAuthenticationComplete =
          false;


        setStatus(
          "Your authentication session has expired. Redirecting to login..."
        );


        debugLog(
          "ADMIN AUTHENTICATION REJECTED",
          {
            status: 401,

            reason:
              "Backend rejected the Firebase authentication token."
          }
        );


        window.location.replace(
          "login.html"
        );


        return;

      }


      // ===============================================
      // AUTHENTICATED BUT NOT ADMIN
      // ===============================================

      if (
        response.status === 403
      ) {

        adminAuthenticationComplete =
          false;


        setStatus(
          "Admin access required."
        );


        debugLog(
          "ADMIN AUTHORIZATION REJECTED",
          {
            status: 403,

            reason:
              "Firebase user is authenticated but does not have the required admin claim.",

            backendResponse:
              data
          }
        );


        return;

      }


      // ===============================================
      // OTHER BACKEND FAILURE
      // ===============================================

      if (
        !response.ok ||
        data?.success !== true
      ) {

        adminAuthenticationComplete =
          false;


        const backendMessage =
          data?.error ||
          data?.message ||
          "Unable to verify admin authorization.";


        debugLog(
          "ADMIN AUTHENTICATION FAILED",
          {
            status:
              response.status,

            backendMessage,

            backendResponse:
              data
          }
        );


        setStatus(
          backendMessage
        );


        return;

      }


      // ===============================================
      // ADMIN AUTHENTICATION SUCCESSFUL
      // ===============================================

      adminAuthenticationComplete =
        true;


      debugLog(
        "ADMIN AUTHENTICATION SUCCESSFUL",
        {
          status:
            response.status,

          success:
            data?.success === true,

          admin:
            data?.admin || null,

          uid:
            user.uid,

          email:
            user.email
        }
      );


      setStatus(
        "Admin dashboard ready."
      );


      // ===============================================
      // INITIALIZE DASHBOARD AFTER AUTHORIZATION
      // ===============================================

      initializeDashboard();


    } catch (error) {

      adminAuthenticationComplete =
        false;


      console.error(
        "NovaPay admin authentication error:",
        error
      );


      debugLog(
        "ADMIN AUTHENTICATION ERROR",
        {
          errorName:
            error?.name,

          errorCode:
            error?.code,

          errorMessage:
            error?.message,

          firebaseCurrentUser:
            auth.currentUser
              ? {
                  uid:
                    auth.currentUser.uid,

                  email:
                    auth.currentUser.email
                }
              : null
        }
      );


      setStatus(
        "Unable to verify admin access. Please try again."
      );

    } finally {

      adminAuthenticationInProgress =
        false;

    }

  }


  // ===================================================
  // FIREBASE AUTH STATE
  // ===================================================

  debugLog(
    "WAITING FOR FIREBASE AUTH STATE"
  );


  onAuthStateChanged(
    auth,
    (user) => {

      debugLog(
        "FIREBASE AUTH STATE CHANGED",
        {
          authenticated:
            Boolean(user),

          uid:
            user?.uid || null,

          email:
            user?.email || null
        }
      );


      authenticateAdmin(
        user
      );

    }
  );


  // ===================================================
  // PAGE SHOWS
  // ===================================================

  window.addEventListener(
    "pageshow",
    () => {

      if (!adminManual) {
        return;
      }


      adminManual.classList.remove(
        "is-open"
      );


      if (manualBackdrop) {

        manualBackdrop.classList.remove(
          "is-open"
        );

      }


      adminManual.setAttribute(
        "aria-hidden",
        "true"
      );


      if (manualToggle) {

        manualToggle.setAttribute(
          "aria-expanded",
          "false"
        );

      }


      document.body.classList.remove(
        "manual-open"
      );

    }
  );

});