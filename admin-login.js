const ADMIN_API_BASE_URL =
    "https://novapay-server.onrender.com/api/admin";

const SESSION_ID_KEY =
    "novapay_admin_session_id";

const SESSION_TOKEN_KEY =
    "novapay_admin_session_token";

const SESSION_EXPIRES_AT_KEY =
    "novapay_admin_session_expires_at";

const form =
    document.getElementById("admin-login-form");

const usernameInput =
    document.getElementById("admin-username");

const passwordInput =
    document.getElementById("admin-password");

const passwordToggle =
    document.getElementById("admin-password-toggle");

const errorBox =
    document.getElementById("admin-login-error");

const loginButton =
    document.getElementById("admin-login-button");


function showError(message) {
    if (!errorBox) return;

    errorBox.textContent = message;
    errorBox.hidden = false;
}


function hideError() {
    if (!errorBox) return;

    errorBox.textContent = "";
    errorBox.hidden = true;
}


function setLoading(isLoading) {
    if (!loginButton) return;

    loginButton.disabled = isLoading;

    const normalText =
        loginButton.querySelector(".button-text");

    const loadingText =
        loginButton.querySelector(".button-loading");

    if (normalText) {
        normalText.hidden = isLoading;
    }

    if (loadingText) {
        loadingText.hidden = !isLoading;
    }
}


function clearAdminSession() {
    sessionStorage.removeItem(SESSION_ID_KEY);
    sessionStorage.removeItem(SESSION_TOKEN_KEY);
    sessionStorage.removeItem(SESSION_EXPIRES_AT_KEY);
}


function saveAdminSession(session) {
    if (!session || typeof session !== "object") {
        throw new Error("Invalid admin session.");
    }

    if (
        typeof session.sessionId !== "string" ||
        !session.sessionId
    ) {
        throw new Error("Admin session ID is missing.");
    }

    if (
        typeof session.sessionToken !== "string" ||
        !session.sessionToken
    ) {
        throw new Error("Admin session token is missing.");
    }

    sessionStorage.setItem(
        SESSION_ID_KEY,
        session.sessionId
    );

    sessionStorage.setItem(
        SESSION_TOKEN_KEY,
        session.sessionToken
    );

    if (session.expiresAt) {
        sessionStorage.setItem(
            SESSION_EXPIRES_AT_KEY,
            String(session.expiresAt)
        );
    } else {
        sessionStorage.removeItem(
            SESSION_EXPIRES_AT_KEY
        );
    }
}


function getAdminSession() {
    const sessionId =
        sessionStorage.getItem(SESSION_ID_KEY);

    const sessionToken =
        sessionStorage.getItem(SESSION_TOKEN_KEY);

    const expiresAt =
        sessionStorage.getItem(SESSION_EXPIRES_AT_KEY);

    if (!sessionId || !sessionToken) {
        return null;
    }

    return {
        sessionId,
        sessionToken,
        expiresAt
    };
}


function isSessionExpired() {
    const expiresAt =
        sessionStorage.getItem(SESSION_EXPIRES_AT_KEY);

    if (!expiresAt) {
        return false;
    }

    const timestamp =
        new Date(expiresAt).getTime();

    if (Number.isNaN(timestamp)) {
        return false;
    }

    return timestamp <= Date.now();
}


if (isSessionExpired()) {
    clearAdminSession();
}


if (passwordToggle && passwordInput) {
    passwordToggle.addEventListener(
        "click",
        function () {
            const isPassword =
                passwordInput.type === "password";

            passwordInput.type =
                isPassword ? "text" : "password";

            passwordToggle.textContent =
                isPassword ? "Hide" : "Show";

            passwordToggle.setAttribute(
                "aria-label",
                isPassword
                    ? "Hide password"
                    : "Show password"
            );
        }
    );
}


if (form) {
    form.addEventListener(
        "submit",
        async function (event) {
            event.preventDefault();

            hideError();

            const superAdmin =
                usernameInput
                    ? usernameInput.value.trim()
                    : "";

            const token =
                passwordInput
                    ? passwordInput.value
                    : "";

            if (!superAdmin) {
                showError("Email address incorrect");

                if (usernameInput) {
                    usernameInput.focus();
                }

                return;
            }

            if (!token) {
                showError("Password incorrect");

                if (passwordInput) {
                    passwordInput.focus();
                }

                return;
            }

            setLoading(true);

            try {
                const response =
                    await fetch(
                        `${ADMIN_API_BASE_URL}/login`,
                        {
                            method: "POST",
                            headers: {
                                "Content-Type":
                                    "application/json"
                            },
                            body: JSON.stringify({
                                superAdmin,
                                token
                            })
                        }
                    );

                let data = null;

                try {
                    data = await response.json();
                } catch (jsonError) {
                    data = null;
                }

                if (!response.ok) {
                    if (response.status === 401) {
                        const serverError =
                            data &&
                            typeof data.error === "string"
                                ? data.error
                                : "";

                        if (
                            serverError
                                .toLowerCase()
                                .includes("email")
                        ) {
                            showError(
                                "Email address incorrect"
                            );
                        } else if (
                            serverError
                                .toLowerCase()
                                .includes("password")
                        ) {
                            showError(
                                "Password incorrect"
                            );
                        } else {
                            showError(
                                "Email address or password incorrect"
                            );
                        }

                        return;
                    }

                    if (response.status === 429) {
                        showError(
                            data &&
                            typeof data.error === "string"
                                ? data.error
                                : "Too many failed attempts. Please try again later."
                        );

                        return;
                    }

                    if (response.status === 403) {
                        showError(
                            data &&
                            typeof data.error === "string"
                                ? data.error
                                : "Admin account is not active."
                        );

                        return;
                    }

                    if (response.status >= 500) {
                        showError(
                            "Unable to connect to the admin security system."
                        );

                        return;
                    }

                    showError(
                        data &&
                        typeof data.error === "string"
                            ? data.error
                            : "Unable to sign in."
                    );

                    return;
                }

                if (
                    !data ||
                    data.success !== true ||
                    !data.session
                ) {
                    showError(
                        "Invalid response from the admin security system."
                    );

                    return;
                }

                try {
                    saveAdminSession(data.session);
                } catch (sessionError) {
                    clearAdminSession();

                    console.error(
                        "Admin session storage error:",
                        sessionError.message
                    );

                    showError(
                        "Unable to securely create your admin session."
                    );

                    return;
                }

                /*
                 * Successful admin authentication.
                 *
                 * The user is now sent to the new
                 * NovaPay admin dashboard.
                 */
                window.location.href = "dashboard2/admin.html";
            } catch (error) {
                console.error(
                    "Admin login request failed:",
                    error
                );

                showError(
                    "Unable to connect to the admin security system."
                );
            } finally {
                setLoading(false);
            }
        }
    );
}