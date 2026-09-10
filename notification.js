/* =========================================================
   NOVAPAY — NOTIFICATIONS
   ---------------------------------------------------------
   Responsibilities:
   - Authenticate the current Firebase user
   - Load notification history from NovaPay backend
   - Search notifications
   - Filter notification tabs
   - Mark notifications as read
   - Mark all notifications as read
   - Register the browser/PWA for Firebase Cloud Messaging
   - Send the FCM device token to NovaPay backend
   - Display foreground push notifications
   - Refresh notification history when a foreground
     push message arrives
   - Preserve existing page navigation and UI
   ========================================================= */

import {
    auth
} from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import {
    getMessaging,
    getToken,
    onMessage,
    isSupported
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-messaging.js";


/* =========================================================
   CONFIG
   ========================================================= */

const API_BASE_URL =
    "https://novapay-server.onrender.com";

const NOTIFICATIONS_API =
    `${API_BASE_URL}/api/notifications`;

const DEFAULT_LIMIT =
    30;

const FCM_SERVICE_WORKER_PATH =
    "/firebase-messaging-sw.js";

/*
 * Firebase Web Push public VAPID key.
 *
 * This is the public key generated in Firebase Console.
 */
const FCM_VAPID_KEY =
    "BFMyRPGHe8g5MPJOjkd8DaVZX_rwVrYnR1nyGQMMU44GMA6zVb2rKbblTTFWdfj2CKSwenno3w7nHwNOFDD5FMA";


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

const markAllBtn =
    document.getElementById(
        "markAllRead"
    );


/* =========================================================
   STATE
   ========================================================= */

let currentUser =
    null;

let allNotifications =
    [];

let nextCursor =
    null;

let hasMore =
    false;

let isLoading =
    false;

let activeTab =
    "All";

let messagingInstance =
    null;

let foregroundListenerStarted =
    false;

let pushSetupStarted =
    false;


/* =========================================================
   BACK BUTTON
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

            currentUser =
                null;

            window.location.href =
                "login.html";

            return;

        }


        currentUser =
            user;


        console.log(
            "NovaPay notification authentication ready."
        );


        console.log(
            "Authenticated UID:",
            currentUser.uid
        );


        /*
         * Load existing notification history.
         */
        await loadNotifications(
            true
        );


        /*
         * Register this authenticated browser/PWA
         * for push notifications.
         *
         * Prevent duplicate setup if Firebase
         * fires the auth observer more than once.
         */
        if (!pushSetupStarted) {

            pushSetupStarted =
                true;

            await setupPushNotifications();

        }

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

        allNotifications =
            [];

        nextCursor =
            null;

        hasMore =
            false;

        showLoading();

    }


    try {

        /*
         * Firebase Auth supplies the identity token.
         *
         * The backend verifies this token and determines
         * the user's UID itself.
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


        let result =
            null;


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
   PUSH NOTIFICATION SETUP
   ========================================================= */

async function setupPushNotifications() {

    if (!currentUser) {

        return;

    }


    /*
     * Check Firebase Messaging browser support.
     */
    try {

        const supported =
            await isSupported();


        if (!supported) {

            console.log(
                "NovaPay push notifications are not supported in this browser."
            );

            return;

        }

    } catch (error) {

        console.error(
            "NovaPay push support check failed:",
            error
        );

        return;

    }


    /*
     * Service workers are required for web push.
     */
    if (
        !("serviceWorker" in navigator)
    ) {

        console.log(
            "NovaPay: Service workers are not supported."
        );

        return;

    }


    /*
     * Browser Notification API is required.
     */
    if (
        !("Notification" in window)
    ) {

        console.log(
            "NovaPay: Browser notifications are unavailable."
        );

        return;

    }


    try {

        /*
         * Register the Firebase Messaging service worker.
         */
        const serviceWorkerRegistration =
            await navigator.serviceWorker.register(
                FCM_SERVICE_WORKER_PATH,
                {
                    scope:
                        "/"
                }
            );


        console.log(
            "NovaPay FCM service worker registered.",
            serviceWorkerRegistration.scope
        );


        /*
         * Wait for the service worker to become ready.
         */
        await navigator.serviceWorker.ready;


        /*
         * Check notification permission.
         */
        let permission =
            Notification.permission;


        /*
         * Only request permission when the browser
         * has not decided yet.
         */
        if (
            permission ===
            "default"
        ) {

            permission =
                await Notification.requestPermission();

        }


        if (
            permission !==
            "granted"
        ) {

            console.log(
                "NovaPay notification permission was not granted."
            );

            return;

        }


        /*
         * Create Firebase Messaging instance.
         */
        messagingInstance =
            getMessaging();


        /*
         * Obtain the browser/PWA FCM registration token.
         *
         * IMPORTANT:
         * The VAPID public key is required for web push.
         */
        const token =
            await getToken(
                messagingInstance,
                {
                    vapidKey:
                        FCM_VAPID_KEY,

                    serviceWorkerRegistration
                }
            );


        if (!token) {

            console.error(
                "NovaPay: Firebase did not return an FCM token."
            );

            return;

        }


        console.log(
            "NovaPay FCM token obtained successfully."
        );


        /*
         * Send the token to our backend.
         */
        const registered =
            await registerDeviceToken(
                token
            );


        if (!registered) {

            console.error(
                "NovaPay: FCM token could not be registered with the backend."
            );

            return;

        }


        /*
         * Start foreground listener once.
         */
        setupForegroundMessageListener();


        console.log(
            "✅ NovaPay push notification setup completed."
        );


    } catch (error) {

        console.error(
            "NovaPay push notification setup error:",
            error
        );

    }

}


/* =========================================================
   REGISTER DEVICE TOKEN WITH BACKEND
   ========================================================= */

async function registerDeviceToken(
    token
) {

    if (
        !currentUser ||
        !token
    ) {

        return false;

    }


    try {

        const idToken =
            await currentUser.getIdToken();


        const platform =
            detectPlatform();


        const response =
            await fetch(
                `${NOTIFICATIONS_API}/device-token`,
                {

                    method:
                        "POST",

                    headers: {

                        "Authorization":
                            `Bearer ${idToken}`,

                        "Content-Type":
                            "application/json",

                        "Accept":
                            "application/json"

                    },

                    body:
                        JSON.stringify({

                            token,

                            platform

                        })

                }
            );


        let result =
            null;


        try {

            result =
                await response.json();

        } catch {

            result =
                null;

        }


        if (
            !response.ok ||
            result?.success !== true
        ) {

            console.error(
                "NovaPay device token registration failed:",
                result?.error ||
                `HTTP ${response.status}`
            );

            return false;

        }


        console.log(
            "✅ NovaPay device token registered with backend."
        );


        return true;


    } catch (error) {

        console.error(
            "NovaPay device token request error:",
            error
        );

        return false;

    }

}


/* =========================================================
   PLATFORM DETECTION
   ========================================================= */

function detectPlatform() {

    const userAgent =
        navigator.userAgent ||
        "";

    const platform =
        navigator.platform ||
        "";


    /*
     * iPhone / iPad / iPod.
     */
    if (
        /iPhone|iPad|iPod/i.test(
            userAgent
        )
    ) {

        return "ios";

    }


    /*
     * Modern iPad browsers may identify themselves
     * as Macintosh devices.
     */
    if (
        /Macintosh/i.test(
            userAgent
        ) &&
        "ontouchend" in document
    ) {

        return "ios";

    }


    /*
     * Android.
     */
    if (
        /Android/i.test(
            userAgent
        )
    ) {

        return "android";

    }


    /*
     * Windows.
     */
    if (
        /Win/i.test(
            platform
        )
    ) {

        return "windows";

    }


    /*
     * macOS.
     */
    if (
        /Mac/i.test(
            platform
        )
    ) {

        return "macos";

    }


    return "web";

}


/* =========================================================
   FOREGROUND PUSH MESSAGE LISTENER
   ========================================================= */

function setupForegroundMessageListener() {

    if (
        !messagingInstance
    ) {

        return;

    }


    /*
     * Prevent duplicate listeners.
     */
    if (
        foregroundListenerStarted
    ) {

        return;

    }


    foregroundListenerStarted =
        true;


    onMessage(
        messagingInstance,
        payload => {

            console.log(
                "🔔 NovaPay foreground push received:",
                payload
            );


            /*
             * Backend remains authoritative for notification
             * history.
             */
            loadNotifications(
                true
            );


            /*
             * Display an actual browser notification
             * while the NovaPay page is open.
             */
            showForegroundPushNotification(
                payload
            );

        }
    );


    console.log(
        "NovaPay foreground push listener ready."
    );

}


/* =========================================================
   FOREGROUND PUSH NOTIFICATION
   ========================================================= */

function showForegroundPushNotification(
    payload
) {

    if (
        !("Notification" in window)
    ) {

        return;

    }


    if (
        Notification.permission !==
        "granted"
    ) {

        return;

    }


    const title =
        String(
            payload?.notification?.title ||
            payload?.data?.title ||
            "NovaPay"
        )
            .trim();


    const body =
        String(
            payload?.notification?.body ||
            payload?.data?.body ||
            "You have a new notification."
        )
            .trim();


    const notificationId =
        String(
            payload?.data?.notificationId ||
            ""
        )
            .trim();


    try {

        const browserNotification =
            new Notification(
                title,
                {

                    body,

                    icon:
                        "/icon-192.png",

                    badge:
                        "/icon-192.png",

                    tag:
                        notificationId ||
                        "novapay-notification",

                    data: {

                        notificationId

                    }

                }
            );


        /*
         * Open the notification page when the
         * foreground browser notification is clicked.
         */
        browserNotification.onclick =
            () => {

                window.focus();

                if (
                    notificationId
                ) {

                    window.location.href =
                        `notifications.html?notificationId=${encodeURIComponent(
                            notificationId
                        )}`;

                }

                browserNotification.close();

            };


    } catch (error) {

        console.error(
            "NovaPay foreground browser notification error:",
            error
        );

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
    )
        .trim();

}


/* =========================================================
   NOTIFICATION BODY
   ========================================================= */

function getNotificationBody(
    notification
) {

    return String(
        notification?.body ||
        ""
    )
        .trim();

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
            timestamp >
            100000000000
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
                numeric >
                100000000000
            ) {

                return numeric;

            }


            if (
                numeric >
                1000000000
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
                ) *
                1000
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
                ) *
                1000
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


    const type =
        getNotificationType(
            notification
        );


    /*
     * Transactions.
     */
    if (
        activeTab.toLowerCase() ===
        "transactions"
    ) {

        return [

            "transaction",

            "payment",

            "wallet"

        ].includes(
            type
        );

    }


    /*
     * Services.
     */
    if (
        activeTab.toLowerCase() ===
        "services"
    ) {

        return [

            "airtime",

            "data",

            "electricity",

            "tv"

        ].includes(
            type
        );

    }


    /*
     * NovaPay.
     */
    if (
        activeTab.toLowerCase() ===
        "novapay"
    ) {

        return [

            "system",

            "promotion",

            "announcement",

            "security",

            "account"

        ].includes(
            type
        );

    }


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
   VISIBLE NOTIFICATIONS
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
        notifications.length ===
        0
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
        )
            .trim();


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
     * Clicking an unread notification marks it as read.
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


        let result =
            null;


        try {

            result =
                await response.json();

        } catch {

            result =
                null;

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


        let result =
            null;


        try {

            result =
                await response.json();

        } catch {

            result =
                null;

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
   MARK-ALL BUTTON
   ========================================================= */

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
   ERROR STATE
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
    "🔐 NovaPay Notifications frontend loaded — backend-authoritative + FCM push mode."
);