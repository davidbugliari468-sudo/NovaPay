"use strict";

/*
 * NovaPay Admin Forgot Password
 *
 * This file connects the Admin Forgot Password frontend
 * to the NovaPay Admin Management System backend.
 *
 * Backend:
 * POST /api/admin/forgot-password
 *
 * The backend verifies the admin UID and generates
 * a new secure admin password/token.
 */


/* =====================================================
   CONFIGURATION
===================================================== */

const ADMIN_API_BASE_URL =
  "https://novapay-server.onrender.com/api/admin";


/* =====================================================
   ELEMENTS
===================================================== */

const forgotPasswordForm =
  document.getElementById("admin-forgot-password-form");

const adminUidInput =
  document.getElementById("admin-uid");

const forgotPasswordMessage =
  document.getElementById("forgot-password-message");

const newPasswordContainer =
  document.getElementById("new-password-container");

const newPasswordElement =
  document.getElementById("new-password");

const copyPasswordButton =
  document.getElementById("copy-password-button");

const forgotPasswordButton =
  document.getElementById("forgot-password-button");


/* =====================================================
   BASIC ELEMENT CHECK
===================================================== */

if (
  !forgotPasswordForm ||
  !adminUidInput ||
  !forgotPasswordMessage ||
  !newPasswordContainer ||
  !newPasswordElement ||
  !copyPasswordButton ||
  !forgotPasswordButton
) {
  console.error(
    "NovaPay Forgot Password: One or more required HTML elements were not found."
  );
}


/* =====================================================
   MESSAGE HELPERS
===================================================== */

function showMessage(message, type) {
  forgotPasswordMessage.textContent = message;

  forgotPasswordMessage.className =
    "form-message " + type;
}


function clearMessage() {
  forgotPasswordMessage.textContent = "";
  forgotPasswordMessage.className = "form-message";
}


/* =====================================================
   RESET PASSWORD RESULT
===================================================== */

function hideNewPassword() {
  newPasswordContainer.hidden = true;
  newPasswordElement.textContent = "";
}


function showNewPassword(password) {
  newPasswordElement.textContent = password;
  newPasswordContainer.hidden = false;
}


/* =====================================================
   BUTTON STATE
===================================================== */

function setLoadingState(isLoading) {
  forgotPasswordButton.disabled = isLoading;

  if (isLoading) {
    forgotPasswordButton.textContent = "Resetting...";
  } else {
    forgotPasswordButton.textContent = "Reset Password";
  }
}


/* =====================================================
   FORGOT PASSWORD REQUEST
===================================================== */

async function recoverAdminPassword(uid) {
  const response = await fetch(
    `${ADMIN_API_BASE_URL}/forgot-password`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        uid
      })
    }
  );

  let data = null;

  try {
    data = await response.json();
  } catch (error) {
    data = null;
  }

  return {
    response,
    data
  };
}


/* =====================================================
   FORM SUBMISSION
===================================================== */

if (forgotPasswordForm) {
  forgotPasswordForm.addEventListener(
    "submit",
    async function (event) {
      event.preventDefault();

      clearMessage();
      hideNewPassword();

      const uid = adminUidInput.value.trim();

      /* -----------------------------------------------
         VALIDATE UID INPUT
      ------------------------------------------------ */

      if (!uid) {
        showMessage(
          "UID incorrect",
          "error"
        );

        adminUidInput.focus();

        return;
      }


      /* -----------------------------------------------
         START REQUEST
      ------------------------------------------------ */

      setLoadingState(true);


      try {
        const result =
          await recoverAdminPassword(uid);

        const response =
          result.response;

        const data =
          result.data;


        /* -------------------------------------------
           SUCCESS
        -------------------------------------------- */

        if (
          response.ok &&
          data &&
          data.success === true &&
          typeof data.token === "string" &&
          data.token.length > 0
        ) {
          showMessage(
            "Password reset successfully.",
            "success"
          );

          showNewPassword(data.token);

          /*
           * Clear the UID after successful recovery.
           * The newly generated password/token remains
           * visible until the page is left or refreshed.
           */
          adminUidInput.value = "";

          return;
        }


        /* -------------------------------------------
           UID INCORRECT
        -------------------------------------------- */

        if (
          response.status === 401
        ) {
          showMessage(
            "UID incorrect",
            "error"
          );

          adminUidInput.focus();

          return;
        }


        /* -------------------------------------------
           ADMIN NOT ACTIVE
        -------------------------------------------- */

        if (
          response.status === 403
        ) {
          showMessage(
            data && data.error
              ? data.error
              : "Admin account is not active.",
            "error"
          );

          return;
        }


        /* -------------------------------------------
           SYSTEM NOT INITIALIZED
        -------------------------------------------- */

        if (
          response.status === 503
        ) {
          showMessage(
            data && data.error
              ? data.error
              : "Admin security system is not initialized.",
            "error"
          );

          return;
        }


        /* -------------------------------------------
           SERVER ERROR
        -------------------------------------------- */

        if (
          response.status >= 500
        ) {
          showMessage(
            data && data.error
              ? data.error
              : "Unable to reset admin password. Please try again later.",
            "error"
          );

          return;
        }


        /* -------------------------------------------
           OTHER RESPONSE
        -------------------------------------------- */

        showMessage(
          data && data.error
            ? data.error
            : "Unable to reset admin password.",
          "error"
        );

      } catch (error) {

        console.error(
          "NovaPay Forgot Password request failed:",
          error
        );

        showMessage(
          "Unable to connect to the admin server. Please try again.",
          "error"
        );

      } finally {

        setLoadingState(false);

      }
    }
  );
}


/* =====================================================
   COPY NEW PASSWORD
===================================================== */

if (copyPasswordButton) {
  copyPasswordButton.addEventListener(
    "click",
    async function () {

      const password =
        newPasswordElement.textContent.trim();

      if (!password) {
        return;
      }


      try {

        await navigator.clipboard.writeText(password);

        copyPasswordButton.textContent =
          "Copied";

        setTimeout(function () {
          copyPasswordButton.textContent =
            "Copy";
        }, 1600);

      } catch (error) {

        console.error(
          "NovaPay Forgot Password: Copy failed:",
          error
        );

        showMessage(
          "Password generated successfully. Please copy it manually.",
          "success"
        );

      }
    }
  );
}


/* =====================================================
   CLEAR RESULT WHEN UID CHANGES
===================================================== */

if (adminUidInput) {
  adminUidInput.addEventListener(
    "input",
    function () {

      /*
       * If the user starts entering another UID,
       * remove the previous generated password from
       * the visible result area.
       */
      if (!newPasswordContainer.hidden) {
        hideNewPassword();
        clearMessage();
      }

    }
  );
}


/* =====================================================
   INITIAL STATE
===================================================== */

hideNewPassword();
clearMessage();