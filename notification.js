/* =========================================================
   NOVAPAY — NOTIFICATIONS
   Backend-authoritative notification history
   ---------------------------------------------------------
   Frontend responsibilities:
   - Keep existing page navigation/buttons
   - Authenticate with Firebase Auth
   - Request notifications from NovaPay backend
   - Display backend notification data
   - Search notifications
   - Filter notification tabs
   - Mark notifications as read
   - Mark all notifications as read
   - Never read notification data directly from Firestore
   ========================================================= */

import {
    auth
} from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";


/* =========================================================
   CONFIG
   ========================================================= */

const API_BASE_URL =
    "https://novapay-server.onrender.com";

const NOTIFICATIONS_API =
    `${API_BASE_URL}/api/notifications`;

const DEFAULT_LIMIT = 30;


/* =========================================================
   DOM
   ========================================================= */

const backBtn =
    document.getElementById(
        "backBtn"
    );

const notificationList =
    document.getElementById(
        "notificationList"
    );

const emptyState =
    document.getElementById(
        "emptyState"
    );

const searchInput =
    document.getElementById(
        "searchInput"
    );

const tabs =
    document.querySelectorAll(
        ".tab"
    );


/* =========================================================
   STATE
   ========================================================= */

let currentUser = null;

let allNotifications = [];

let nextCursor = null;

let hasMore = false;

let isLoading = false;

let activeTab = "All";


/* =========================================================
   BACK BUTTON
   ---------------------------------------------------------
   Existing working behavior preserved.
   ========================================================= */

backBtn?.addEventListener(
    "click",
    event => {

        event.preventDefault();

        window.location.href =
            "dashboard.html";

    }
);


/* =========================================================
   AUTHENTICATION
   ========================================================= */

onAuthStateChanged(
    auth,
    async user => {

        if (!user) {

            window.location.href =
                "login.html";

            return;

        }


        currentUser =
            user;


        console.log(
            "NovaPay notification authentication ready."
        );


        await loadNotifications(
            true
        );

    }
);


/* =========================================================
   LOAD NOTIFICATIONS
   ========================================================= */

async function loadNotifications(
    reset = false
) {

    if (isLoading) {
        return;
    }


    if (
        !reset &&
        !hasMore
    ) {

        return;

    }


    if (!currentUser) {

        return;

    }


    isLoading =
        true;


    if (reset) {

        allNotifications = [];

        nextCursor = null;

        hasMore = false;

        showLoading();

    }


    try {

        /*
         * Firebase Auth creates the identity.
         * The backend verifies this token and determines
         * the actual user ID.
         */
        const idToken =
            await currentUser.getIdToken();


        const params =
            new URLSearchParams();


        params.set(
            "limit",
            String(
                DEFAULT_LIMIT
            )
        );


        if (
            !reset &&
            nextCursor
        ) {

            params.set(
                "cursor",
                nextCursor
            );

        }


        const response =
            await fetch(
                `${NOTIFICATIONS_API}?${params.toString()}`,
                {

                    method:
                        "GET",

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


        let result = null;


        try {

            result =
                await response.json();

        } catch {

            throw new Error(
                "Unable to read the notification response."
            );

        }


        if (!response.ok) {

            throw new Error(
                result?.error ||
                "Unable to load notifications."
            );

        }


        if (
            result?.success !== true
        ) {

            throw new Error(
                result?.error ||
                "Unable to load notifications."
            );

        }


        const notifications =
            Array.isArray(
                result.notifications
            )
                ? result.notifications
                : [];


        if (reset) {

            allNotifications =
                notifications;

        } else {

            allNotifications = [

                ...allNotifications,

                ...notifications

            ];

        }


        hasMore =
            result?.pagination?.hasMore === true;


        nextCursor =
            result?.pagination?.nextCursor ||
            null;


        /*
         * Backend already returns newest first.
         * We intentionally do not sort by a client-controlled
         * field.
         */
        renderNotifications();


        console.log(
            `NovaPay: loaded ${notifications.length} notification(s).`
        );


    } catch (error) {

        console.error(
            "NovaPay notification loading error:",
            error
        );


        if (reset) {

            showError();

        }

    } finally {

        isLoading =
            false;

    }

}


/* =========================================================
   NOTIFICATION TYPE
   ========================================================= */

function getNotificationType(
    notification
) {

    return String(
        notification?.type ||
        "system"
    )
        .trim()
        .toLowerCase();

}


/* =========================================================
   NOTIFICATION TITLE
   ========================================================= */

function getNotificationTitle(
    notification
) {

    return String(
        notification?.title ||
        "Notification"
    ).trim();

}


/* =========================================================
   NOTIFICATION BODY
   ---------------------------------------------------------
   New backend uses "body".
   We deliberately do not depend on the deleted
   Firestore "message" structure.
   ========================================================= */

function getNotificationBody(
    notification
) {

    return String(
        notification?.body ||
        ""
    ).trim();

}


/* =========================================================
   READ STATE
   ========================================================= */

function isNotificationRead(
    notification
) {

    return notification?.read === true;

}


/* =========================================================
   TIMESTAMP
   ========================================================= */

function timestampToMillis(
    timestamp
) {

    if (!timestamp) {

        return 0;

    }


    if (
        typeof timestamp ===
        "number"
    ) {

        if (
            timestamp > 100000000000
        ) {

            return timestamp;

        }


        return timestamp * 1000;

    }


    if (
        typeof timestamp ===
        "string"
    ) {

        const numeric =
            Number(
                timestamp
            );


        if (
            Number.isFinite(
                numeric
            )
        ) {

            if (
                numeric > 100000000000
            ) {

                return numeric;

            }


            if (
                numeric > 1000000000
            ) {

                return numeric * 1000;

            }

        }


        const parsed =
            new Date(
                timestamp
            ).getTime();


        return Number.isFinite(
            parsed
        )
            ? parsed
            : 0;

    }


    if (
        typeof timestamp ===
        "object"
    ) {

        if (
            Number.isFinite(
                Number(
                    timestamp.seconds
                )
            )
        ) {

            return (
                Number(
                    timestamp.seconds
                ) * 1000
            );

        }


        if (
            Number.isFinite(
                Number(
                    timestamp._seconds
                )
            )
        ) {

            return (
                Number(
                    timestamp._seconds
                ) * 1000
            );

        }

    }


    return 0;

}


/* =========================================================
   DATE FORMAT
   ========================================================= */

function formatNotificationTime(
    notification
) {

    const milliseconds =
        timestampToMillis(
            notification?.createdAt
        );


    if (!milliseconds) {

        return "Just now";

    }


    const date =
        new Date(
            milliseconds
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "Just now";

    }


    return date.toLocaleString(
        "en-NG",
        {

            day:
                "numeric",

            month:
                "short",

            year:
                "numeric",

            hour:
                "numeric",

            minute:
                "2-digit"

        }
    );

}


/* =========================================================
   ICON
   ========================================================= */

function getIconClass(
    notification
) {

    const type =
        getNotificationType(
            notification
        );


    const iconMap = {

        wallet:
            "fa-wallet icon-wallet",

        payment:
            "fa-wallet icon-wallet",

        transaction:
            "fa-receipt icon-wallet",

        airtime:
            "fa-mobile-screen icon-airtime",

        data:
            "fa-wifi icon-data",

        electricity:
            "fa-bolt icon-electricity",

        tv:
            "fa-tv icon-tv",

        promotion:
            "fa-gift icon-gift",

        giveaway:
            "fa-gift icon-gift",

        security:
            "fa-shield-halved icon-security",

        account:
            "fa-user-shield icon-security",

        system:
            "fa-bullhorn icon-announcement",

        announcement:
            "fa-bullhorn icon-announcement"

    };


    return (
        iconMap[type] ||
        "fa-bell icon-announcement"
    );

}


/* =========================================================
   TAB FILTER
   ========================================================= */

function notificationMatchesTab(
    notification
) {

    if (
        activeTab ===
        "All"
    ) {

        return true;

    }


    if (
        activeTab ===
        "Unread"
    ) {

        return !isNotificationRead(
            notification
        );

    }


    if (
        activeTab ===
        "Read"
    ) {

        return isNotificationRead(
            notification
        );

    }


    /*
     * If the existing HTML contains category tabs,
     * support them without changing the buttons.
     */
    const type =
        getNotificationType(
            notification
        );


    return (
        type ===
        activeTab.toLowerCase()
    );

}


/* =========================================================
   SEARCH
   ========================================================= */

function notificationMatchesSearch(
    notification
) {

    const search =
        String(
            searchInput?.value ||
            ""
        )
            .trim()
            .toLowerCase();


    if (!search) {

        return true;

    }


    const searchable = [

        getNotificationTitle(
            notification
        ),

        getNotificationBody(
            notification
        ),

        getNotificationType(
            notification
        )

    ]
        .join(" ")
        .toLowerCase();


    return searchable.includes(
        search
    );

}


/* =========================================================
   FILTER
   ========================================================= */

function getVisibleNotifications() {

    return allNotifications.filter(
        notification => {

            return (
                notificationMatchesTab(
                    notification
                ) &&
                notificationMatchesSearch(
                    notification
                )
            );

        }
    );

}


/* =========================================================
   RENDER
   ========================================================= */

function renderNotifications() {

    if (!notificationList) {

        return;

    }


    const notifications =
        getVisibleNotifications();


    notificationList.innerHTML =
        "";


    if (
        notifications.length === 0
    ) {

        showEmptyState();

        return;

    }


    hideEmptyState();


    notifications.forEach(
        notification => {

            notificationList.appendChild(
                createNotificationCard(
                    notification
                )
            );

        }
    );

}


/* =========================================================
   NOTIFICATION CARD
   ========================================================= */

function createNotificationCard(
    notification
) {

    const card =
        document.createElement(
            "div"
        );


    card.className =
        "notification-card";


    if (
        !isNotificationRead(
            notification
        )
    ) {

        card.classList.add(
            "unread"
        );

    }


    const iconClass =
        getIconClass(
            notification
        );


    const title =
        getNotificationTitle(
            notification
        );


    const body =
        getNotificationBody(
            notification
        );


    const time =
        formatNotificationTime(
            notification
        );


    const notificationId =
        String(
            notification?.id ||
            ""
        ).trim();


    card.innerHTML = `

        <div class="notification-icon">

            <i
                class="fa-solid ${escapeHTML(
                    iconClass
                )}"
            ></i>

        </div>


        <div class="notification-content">

            <div class="notification-title">

                ${escapeHTML(
                    title
                )}

            </div>


            <div class="notification-message">

                ${escapeHTML(
                    body
                )}

            </div>


            <div class="notification-footer">

                <span class="notification-time">

                    ${escapeHTML(
                        time
                    )}

                </span>


                ${
                    !isNotificationRead(
                        notification
                    )
                        ? '<span class="unread-dot"></span>'
                        : ""
                }

            </div>

        </div>

    `;


    /*
     * Clicking an unread notification marks it read.
     * We do not invent any new navigation behavior.
     */
    if (
        notificationId
    ) {

        card.addEventListener(
            "click",
            () => {

                if (
                    !isNotificationRead(
                        notification
                    )
                ) {

                    markNotificationAsRead(
                        notificationId
                    );

                }

            }
        );

    }


    return card;

}


/* =========================================================
   MARK ONE AS READ
   ========================================================= */

async function markNotificationAsRead(
    notificationId
) {

    if (
        !currentUser ||
        !notificationId
    ) {

        return;

    }


    try {

        const idToken =
            await currentUser.getIdToken();


        const response =
            await fetch(
                `${NOTIFICATIONS_API}/${encodeURIComponent(
                    notificationId
                )}/read`,
                {

                    method:
                        "PATCH",

                    headers: {

                        "Authorization":
                            `Bearer ${idToken}`,

                        "Accept":
                            "application/json"

                    }

                }
            );


        let result = null;


        try {

            result =
                await response.json();

        } catch {

            result = null;

        }


        if (
            !response.ok ||
            result?.success !== true
        ) {

            console.error(
                "NovaPay could not mark notification as read."
            );

            return;

        }


        /*
         * Update local display only after the backend
         * confirms the operation.
         */
        const notification =
            allNotifications.find(
                item =>
                    String(
                        item?.id
                    ) ===
                    notificationId
            );


        if (notification) {

            notification.read =
                true;

        }


        renderNotifications();


    } catch (error) {

        console.error(
            "NovaPay mark notification read error:",
            error
        );

    }

}


/* =========================================================
   MARK ALL AS READ
   ---------------------------------------------------------
   This function is available for the existing UI if
   an element with one of these IDs exists.
   ========================================================= */

async function markAllNotificationsAsRead() {

    if (!currentUser) {

        return;

    }


    try {

        const idToken =
            await currentUser.getIdToken();


        const response =
            await fetch(
                `${NOTIFICATIONS_API}/read-all`,
                {

                    method:
                        "PATCH",

                    headers: {

                        "Authorization":
                            `Bearer ${idToken}`,

                        "Accept":
                            "application/json"

                    }

                }
            );


        let result = null;


        try {

            result =
                await response.json();

        } catch {

            result = null;

        }


        if (
            !response.ok ||
            result?.success !== true
        ) {

            console.error(
                "NovaPay could not mark all notifications as read."
            );

            return;

        }


        allNotifications.forEach(
            notification => {

                notification.read =
                    true;

            }
        );


        renderNotifications();


    } catch (error) {

        console.error(
            "NovaPay mark-all-notifications-read error:",
            error
        );

    }

}


/* =========================================================
   OPTIONAL MARK-ALL BUTTON HOOK
   ---------------------------------------------------------
   Does not interfere with the page if the button does
   not exist.
   ========================================================= */

const markAllBtn =
    document.getElementById(
        "markAllRead"
    );


markAllBtn?.addEventListener(
    "click",
    event => {

        event.preventDefault();

        markAllNotificationsAsRead();

    }
);


/* =========================================================
   SEARCH
   ========================================================= */

searchInput?.addEventListener(
    "input",
    () => {

        renderNotifications();

    }
);


/* =========================================================
   TABS
   ---------------------------------------------------------
   Existing tab buttons remain in control.
   ========================================================= */

tabs.forEach(
    tab => {

        tab.addEventListener(
            "click",
            () => {

                tabs.forEach(
                    button => {

                        button.classList.remove(
                            "active"
                        );

                    }
                );


                tab.classList.add(
                    "active"
                );


                activeTab =
                    String(
                        tab.dataset.tab ||
                        tab.textContent ||
                        "All"
                    )
                        .trim();


                /*
                 * Normalize common labels.
                 */
                if (
                    activeTab.toLowerCase() ===
                    "all notifications"
                ) {

                    activeTab =
                        "All";

                }


                if (
                    activeTab.toLowerCase() ===
                    "unread notifications"
                ) {

                    activeTab =
                        "Unread";

                }


                if (
                    activeTab.toLowerCase() ===
                    "read notifications"
                ) {

                    activeTab =
                        "Read";

                }


                renderNotifications();

            }
        );

    }
);


/* =========================================================
   LOADING STATE
   ========================================================= */

function showLoading() {

    if (!notificationList) {

        return;

    }


    if (emptyState) {

        emptyState.style.display =
            "none";

    }


    notificationList.innerHTML = `

        <div class="notification-loading">

            <i class="fa-solid fa-spinner fa-spin"></i>

            <span>
                Loading notifications...
            </span>

        </div>

    `;

}


/* =========================================================
   EMPTY STATE
   ========================================================= */

function showEmptyState() {

    if (notificationList) {

        notificationList.innerHTML =
            "";

    }


    if (emptyState) {

        emptyState.style.display =
            "flex";

    }

}


/* =========================================================
   HIDE EMPTY STATE
   ========================================================= */

function hideEmptyState() {

    if (emptyState) {

        emptyState.style.display =
            "none";

    }

}


/* =========================================================
   FRIENDLY ERROR STATE
   ---------------------------------------------------------
   Technical backend details are intentionally hidden
   from users.
   ========================================================= */

function showError() {

    if (notificationList) {

        notificationList.innerHTML = `

            <div class="notification-loading">

                <i class="fa-solid fa-circle-exclamation"></i>

                <span>
                    We couldn't load your notifications right now.
                    Please try again later.
                </span>

            </div>

        `;

    }


    if (emptyState) {

        emptyState.style.display =
            "none";

    }

}


/* =========================================================
   HTML ESCAPING
   ========================================================= */

function escapeHTML(
    value
) {

    return String(
        value ?? ""
    )
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );

}


/* =========================================================
   STARTUP
   ========================================================= */

console.log(
    "🔐 NovaPay Notifications frontend loaded — backend-authoritative mode."
);