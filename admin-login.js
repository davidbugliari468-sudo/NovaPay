"use strict";

/*
 * NovaPay Admin Login
 *
 * This file connects the Admin Login frontend
 * to the NovaPay Admin Management System backend.
 *
 * Backend:
 * https://novapay-server.onrender.com
 *
 * Admin authentication is completely separate
 * from normal NovaPay Firebase user authentication.
 */

const ADMIN_API_BASE_URL =
  "https://novapay-server.onrender.com/api/admin";

/*
 * Session storage keys.
 *
 * The admin session is intentionally kept separate
 * from the normal NovaPay user authentication.
 */
const ADMIN_SESSION_ID_KEY =
  "novapay_admin_session_id";

const ADMIN_SESSION_TOKEN_KEY =
  "novapay_admin_session_token";

const ADMIN_SESSION_EXPIRES_KEY =
  "novapay_admin_session_expires_at";

/*
 * Expected login field IDs.
 *
 * These IDs match the current Admin Login HTML.
 */
const ADMIN_LOGIN_FORM_ID =
  "admin-login-form";

const ADMIN_USERNAME_ID =
  "admin-username";

const ADMIN_PASSWORD_ID =
  "admin-password";

const ADMIN_LOGIN_BUTTON_ID =
  "admin-login-button";

const ADMIN_LOGIN_ERROR_ID =
  "admin-login-error";

const ADMIN_PASSWORD_TOGGLE_ID =
  "admin-password-toggle";

/*
 * Button element IDs from the current HTML.
 */
const ADMIN_LOGIN_BUTTON_TEXT_CLASS =
  "button-text";

const ADMIN_LOGIN_BUTTON_LOADING_CLASS =
  "button-loading";

/*
 * Optional dashboard location.
 *
 * We will update this when the Admin Dashboard
 * frontend file is created.
 */
const ADMIN_DASHBOARD_PATH =
  "admin-dashboard.html";

/*
 * Get an element safely.
 */
function getAdminElement(id) {
  return document.getElementById(id);
}

/*
 * Display a login error.
 */
function showAdminLoginError(message) {
  const errorElement =
    getAdminElement(ADMIN_LOGIN_ERROR_ID);

  if (!errorElement) {
    console.error("Admin Login:", message);
    return;
  }

  errorElement.textContent = message;
  errorElement.hidden = false;
}

/*
 * Clear the login error.
 */
function clearAdminLoginError() {
  const errorElement =
    getAdminElement(ADMIN_LOGIN_ERROR_ID);

  if (!errorElement) {
    return;
  }

  errorElement.textContent = "";
  errorElement.hidden = true;
}

/*
 * Set the login button loading state.
 *
 * This matches the current HTML:
 *
 * .button-text
 * .button-loading
 */
function setAdminLoginLoading(isLoading) {
  const button =
    getAdminElement(
      ADMIN_LOGIN_BUTTON_ID
    );

  if (!button) {
    return;
  }

  const buttonText =
    button.querySelector(
      "." +
        ADMIN_LOGIN_BUTTON_TEXT_CLASS
    );

  const buttonLoading =
    button.querySelector(
      "." +
        ADMIN_LOGIN_BUTTON_LOADING_CLASS
    );

  button.disabled = isLoading;
  button.setAttribute(
    "aria-busy",
    isLoading ? "true" : "false"
  );

  if (buttonText) {
    buttonText.hidden = isLoading;
  }

  if (buttonLoading) {
    buttonLoading.hidden = !isLoading;
  }

  /*
   * Fallback for unexpected HTML changes.
   */
  if (!buttonText && !buttonLoading) {
    button.textContent = isLoading
      ? "Signing in..."
      : "Continue";
  }
}

/*
 * Set the password visibility state.
 */
function setAdminPasswordVisibility(
  isVisible
) {
  const passwordInput =
    getAdminElement(
      ADMIN_PASSWORD_ID
    );

  const toggleButton =
    getAdminElement(
      ADMIN_PASSWORD_TOGGLE_ID
    );

  if (!passwordInput) {
    return;
  }

  passwordInput.type =
    isVisible
      ? "text"
      : "password";

  if (!toggleButton) {
    return;
  }

  const toggleText =
    toggleButton.querySelector(
      ".password-toggle-text"
    );

  if (toggleText) {
    toggleText.textContent =
      isVisible
        ? "Hide"
        : "Show";
  }

  toggleButton.setAttribute(
    "aria-label",
    isVisible
      ? "Hide password"
      : "Show password"
  );

  toggleButton.setAttribute(
    "aria-pressed",
    isVisible
      ? "true"
      : "false"
  );
}

/*
 * Toggle password visibility.
 */
function toggleAdminPasswordVisibility() {
  const passwordInput =
    getAdminElement(
      ADMIN_PASSWORD_ID
    );

  if (!passwordInput) {
    return;
  }

  const isCurrentlyVisible =
    passwordInput.type === "text";

  setAdminPasswordVisibility(
    !isCurrentlyVisible
  );
}

/*
 * Save the admin session returned by the backend.
 */
function saveAdminSession(session) {
  if (
    !session ||
    typeof session.sessionId !== "string" ||
    !session.sessionId ||
    typeof session.sessionToken !== "string" ||
    !session.sessionToken
  ) {
    throw new Error(
      "The server returned an invalid admin session."
    );
  }

  sessionStorage.setItem(
    ADMIN_SESSION_ID_KEY,
    session.sessionId
  );

  sessionStorage.setItem(
    ADMIN_SESSION_TOKEN_KEY,
    session.sessionToken
  );

  if (
    typeof session.expiresAt === "string" &&
    session.expiresAt
  ) {
    sessionStorage.setItem(
      ADMIN_SESSION_EXPIRES_KEY,
      session.expiresAt
    );
  } else {
    sessionStorage.removeItem(
      ADMIN_SESSION_EXPIRES_KEY
    );
  }
}

/*
 * Get the currently stored admin session.
 */
function getAdminSession() {
  const sessionId =
    sessionStorage.getItem(
      ADMIN_SESSION_ID_KEY
    );

  const sessionToken =
    sessionStorage.getItem(
      ADMIN_SESSION_TOKEN_KEY
    );

  const expiresAt =
    sessionStorage.getItem(
      ADMIN_SESSION_EXPIRES_KEY
    );

  if (!sessionId || !sessionToken) {
    return null;
  }

  return {
    sessionId,
    sessionToken,
    expiresAt: expiresAt || null,
  };
}

/*
 * Clear the local admin session.
 */
function clearAdminSession() {
  sessionStorage.removeItem(
    ADMIN_SESSION_ID_KEY
  );

  sessionStorage.removeItem(
    ADMIN_SESSION_TOKEN_KEY
  );

  sessionStorage.removeItem(
    ADMIN_SESSION_EXPIRES_KEY
  );
}

/*
 * Check whether the locally stored session has expired.
 *
 * This is only a frontend convenience check.
 *
 * The backend remains the final authority and
 * validates the session on every protected request.
 */
function isAdminSessionExpired() {
  const session =
    getAdminSession();

  if (!session) {
    return true;
  }

  if (!session.expiresAt) {
    return false;
  }

  const expirationTime =
    new Date(
      session.expiresAt
    ).getTime();

  if (
    Number.isNaN(expirationTime)
  ) {
    return false;
  }

  return Date.now() >= expirationTime;
}

/*
 * Build the Authorization header required
 * by protected Admin Management System routes.
 *
 * Backend format:
 *
 * Bearer SESSION_ID.SESSION_TOKEN
 */
function getAdminAuthorizationHeader() {
  const session =
    getAdminSession();

  if (!session) {
    return null;
  }

  if (isAdminSessionExpired()) {
    clearAdminSession();
    return null;
  }

  return (
    "Bearer " +
    session.sessionId +
    "." +
    session.sessionToken
  );
}

/*
 * Login request.
 *
 * The backend expects the initial admin credentials:
 *
 * superAdmin
 * token
 */
async function loginAdmin(
  superAdmin,
  token
) {
  let response;

  try {
    response =
      await fetch(
        ADMIN_API_BASE_URL +
          "/login",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            Accept:
              "application/json",
          },

          body: JSON.stringify({
            superAdmin,
            token,
          }),
        }
      );
  } catch (error) {
    console.error(
      "NovaPay Admin Login connection error:",
      error
    );

    throw new Error(
      "Unable to connect to the Admin Management System right now."
    );
  }

  let data = null;

  try {
    data = await response.json();
  } catch (error) {
    data = null;
  }

  /*
   * Successful login.
   */
  if (
    response.ok &&
    data &&
    data.success === true &&
    data.session
  ) {
    saveAdminSession(
      data.session
    );

    return {
      success: true,
      data,
    };
  }

  /*
   * The backend is the authority for the
   * exact reason authentication failed.
   *
   * We map the known credential errors to
   * the requested frontend messages.
   */
  if (
    response.status === 401
  ) {
    const backendError =
      typeof data?.error === "string"
        ? data.error.toLowerCase()
        : "";

    if (
      backendError.includes(
        "email"
      ) ||
      backendError.includes(
        "superadmin"
      ) ||
      backendError.includes(
        "super admin"
      ) ||
      backendError.includes(
        "identifier"
      )
    ) {
      throw new Error(
        "Email address incorrect"
      );
    }

    if (
      backendError.includes(
        "password"
      ) ||
      backendError.includes(
        "token"
      )
    ) {
      throw new Error(
        "Password incorrect"
      );
    }

    /*
     * If the backend gives a generic
     * authentication error, do not expose
     * unnecessary backend details.
     */
    throw new Error(
      "Email address or password incorrect"
    );
  }

  /*
   * Admin lockout.
   */
  if (
    response.status === 429
  ) {
    throw new Error(
      data?.error ||
        "Too many login attempts. Please try again later."
    );
  }

  /*
   * Account disabled/inactive.
   */
  if (
    response.status === 403
  ) {
    throw new Error(
      data?.error ||
        "Admin access is currently unavailable."
    );
  }

  /*
   * Server-side failure.
   */
  if (
    response.status >= 500
  ) {
    throw new Error(
      "Unable to connect to the Admin Management System right now."
    );
  }

  /*
   * Other backend response.
   */
  throw new Error(
    data?.error ||
      "Unable to sign in."
  );
}

/*
 * Submit the Admin Login form.
 */
async function handleAdminLogin(event) {
  if (event) {
    event.preventDefault();
  }

  clearAdminLoginError();

  const usernameInput =
    getAdminElement(
      ADMIN_USERNAME_ID
    );

  const passwordInput =
    getAdminElement(
      ADMIN_PASSWORD_ID
    );

  if (
    !usernameInput ||
    !passwordInput
  ) {
    console.error(
      "NovaPay Admin Login: login inputs were not found."
    );

    showAdminLoginError(
      "Admin login form is not configured correctly."
    );

    return;
  }

  const superAdmin =
    usernameInput.value.trim();

  const token =
    passwordInput.value.trim();

  /*
   * Do not allow empty login requests.
   */
  if (!superAdmin) {
    showAdminLoginError(
      "Email address incorrect"
    );

    usernameInput.focus();

    return;
  }

  if (!token) {
    showAdminLoginError(
      "Password incorrect"
    );

    passwordInput.focus();

    return;
  }

  setAdminLoginLoading(true);

  try {
    const result =
      await loginAdmin(
        superAdmin,
        token
      );

    if (
      result.success
    ) {
      /*
       * Clear the password field
       * after successful authentication.
       */
      passwordInput.value = "";

      /*
       * Redirect to the Admin Dashboard.
       *
       * This path will be changed if the
       * final dashboard filename is different.
       */
      window.location.href =
        ADMIN_DASHBOARD_PATH;
    }
  } catch (error) {
    console.error(
      "Admin login failed:",
      error
    );

    showAdminLoginError(
      error?.message ||
        "Unable to sign in."
    );
  } finally {
    setAdminLoginLoading(false);
  }
}

/*
 * Automatically connect the form when
 * the Admin Login HTML has loaded.
 */
function initializeAdminLogin() {
  const form =
    getAdminElement(
      ADMIN_LOGIN_FORM_ID
    );

  if (!form) {
    /*
     * The HTML has not been created yet.
     */
    return;
  }

  form.addEventListener(
    "submit",
    handleAdminLogin
  );

  /*
   * Connect the Show/Hide password button.
   */
  const passwordToggle =
    getAdminElement(
      ADMIN_PASSWORD_TOGGLE_ID
    );

  if (passwordToggle) {
    passwordToggle.addEventListener(
      "click",
      toggleAdminPasswordVisibility
    );
  }

  /*
   * Start with the password hidden.
   */
  setAdminPasswordVisibility(
    false
  );
}

/*
 * Export useful functions globally so
 * the future Admin Dashboard frontend
 * can reuse the session connection.
 */
window.NovaPayAdmin = {
  loginAdmin,
  getAdminSession,
  saveAdminSession,
  clearAdminSession,
  getAdminAuthorizationHeader,
  isAdminSessionExpired,
};

/*
 * Start when the document is ready.
 */
if (
  document.readyState ===
  "loading"
) {
  document.addEventListener(
    "DOMContentLoaded",
    initializeAdminLogin
  );
} else {
  initializeAdminLogin();
}