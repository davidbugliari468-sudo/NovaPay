import { auth } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

/* =========================================================
   NOVAPAY — NOTIFICATIONS
   PART 1 OF 2
   ========================================================= */

const API_BASE_URL = "https://novapay-server.onrender.com";
const NOTIFICATIONS_API = `${API_BASE_URL}/api/notifications`;
const SERVICE_WORKER_PATH = "/firebase-messaging-sw.js";

const state = {
    user: null,
    notifications: [],
    filteredNotifications: [],
    activeTab: "all",
    searchTerm: "",
    unreadCount: 0,
    nextPageToken: null,
    loading: false,
    pushSetupRunning: false,
    pushEnabled: false
};

/* =========================================================
   DOM
   ========================================================= */

const notificationsContainer =
    document.getElementById("notificationsList") ||
    document.getElementById("notifications-container") ||
    document.querySelector(".notifications-list") ||
    document.querySelector(".notifications-container");

const emptyState =
    document.getElementById("emptyState") ||
    document.querySelector(".empty-state");

const loadingState =
    document.getElementById("loadingState") ||
    document.querySelector(".loading-state");

const searchInput =
    document.getElementById("notificationSearch") ||
    document.getElementById("searchNotifications") ||
    document.querySelector('input[type="search"]');

const backButton =
    document.getElementById("backBtn") ||
    document.getElementById("backButton") ||
    document.querySelector("[data-back]");

const markAllButton =
    document.getElementById("markAllReadBtn") ||
    document.getElementById("markAllBtn") ||
    document.querySelector("[data-mark-all-read]");

const loadMoreButton =
    document.getElementById("loadMoreBtn") ||
    document.querySelector("[data-load-more]");

const pushButton =
    document.getElementById("enablePushBtn") ||
    document.getElementById("pushNotificationBtn") ||
    document.querySelector("[data-enable-push]");

const pushStatus =
    document.getElementById("pushStatus") ||
    document.querySelector("[data-push-status]");

const unreadBadge =
    document.getElementById("unreadBadge") ||
    document.querySelector("[data-unread-badge]");

/* =========================================================
   BACK BUTTON
   ========================================================= */

if (backButton) {
    backButton.addEventListener("click", () => {
        if (window.history.length > 1) {
            window.history.back();
        } else {
            window.location.href = "/dashboard.html";
        }
    });
}

/* =========================================================
   PUSH UI
   ========================================================= */

function setPushStatus(type, message) {
    if (!pushStatus) {
        return;
    }

    pushStatus.textContent = message;
    pushStatus.dataset.status = type;
    pushStatus.className = `push-status ${type}`;
}

function setPushButtonState(stateName) {
    if (!pushButton) {
        return;
    }

    pushButton.disabled = false;

    if (stateName === "loading") {
        pushButton.disabled = true;
        pushButton.textContent = "Enabling...";
        return;
    }

    if (stateName === "enabled") {
        pushButton.disabled = true;
        pushButton.textContent = "Notifications enabled";
        return;
    }

    if (stateName === "unsupported") {
        pushButton.disabled = true;
        pushButton.textContent = "Push unavailable";
        return;
    }

    if (stateName === "ios-home-screen") {
        pushButton.disabled = false;
        pushButton.textContent = "Enable notifications";
        return;
    }

    pushButton.textContent = "Enable notifications";
}

/* =========================================================
   DEVICE / WEB APP DETECTION
   ========================================================= */

function isIOSDevice() {
    const userAgent = navigator.userAgent || "";
    const platform = navigator.platform || "";

    return (
        /iPhone|iPad|iPod/i.test(userAgent) ||
        (
            platform === "MacIntel" &&
            navigator.maxTouchPoints > 1
        )
    );
}

function getDisplayMode() {
    const modes = [
        "standalone",
        "fullscreen",
        "minimal-ui",
        "browser"
    ];

    for (const mode of modes) {
        try {
            if (
                window.matchMedia &&
                window.matchMedia(`(display-mode: ${mode})`).matches
            ) {
                return mode;
            }
        } catch (error) {
            /* Ignore unsupported display-mode checks. */
        }
    }

    if (
        window.navigator &&
        window.navigator.standalone === true
    ) {
        return "standalone";
    }

    return "browser";
}

function isStandaloneWebApp() {
    const displayMode = getDisplayMode();

    return (
        displayMode === "standalone" ||
        displayMode === "fullscreen"
    );
}

function getHomeScreenDiagnostic() {
    const displayMode = getDisplayMode();

    let navigatorStandalone = false;

    try {
        navigatorStandalone =
            window.navigator &&
            window.navigator.standalone === true;
    } catch (error) {
        navigatorStandalone = false;
    }

    return {
        displayMode,
        navigatorStandalone,
        isStandalone:
            displayMode === "standalone" ||
            displayMode === "fullscreen" ||
            navigatorStandalone
    };
}

/* =========================================================
   WEB PUSH SUPPORT
   ========================================================= */
function isWebPushSupported() {
    const hasServiceWorker =
        "serviceWorker" in navigator;

    const hasNotification =
        "Notification" in window;

    const hasPushManager =
        "PushManager" in window ||
        (
            typeof ServiceWorkerRegistration !== "undefined" &&
            "pushManager" in ServiceWorkerRegistration.prototype
        );

    return (
        hasServiceWorker &&
        hasNotification &&
        hasPushManager
    );
}


/* =========================================================
   AUTH STATE
   ========================================================= */

onAuthStateChanged(auth, async (user) => {
    state.user = user;

    if (!user) {
        state.notifications = [];
        state.filteredNotifications = [];
        state.unreadCount = 0;
        state.nextPageToken = null;
        state.pushEnabled = false;
        state.pushSetupRunning = false;

        renderNotifications();
        updateUnreadBadge();

        return;
    }

    await loadNotifications(true);

    /*
     * Only silently initialise push when permission was
     * already granted. New permission requests must happen
     * from the user's button click.
     */
    if (
        "Notification" in window &&
        Notification.permission === "granted"
    ) {
        await setupPushNotifications(false);
    } else {
        setPushButtonState("default");
        setPushStatus(
            "default",
            "Push notifications are not enabled."
        );
    }
});

/* =========================================================
   PUSH BUTTON
   ========================================================= */

if (pushButton) {
    pushButton.addEventListener("click", async () => {
        await setupPushNotifications(true);
    });
}

/* =========================================================
   PUSH SETUP
   ========================================================= */

async function setupPushNotifications(requestPermission = false) {
    if (!state.user) {
        setPushStatus(
            "error",
            "Please sign in before enabling notifications."
        );
        return false;
    }

    if (state.pushSetupRunning) {
        return false;
    }

    state.pushSetupRunning = true;
    setPushButtonState("loading");

    try {
        /*
         * Register the service worker first.
         * This is safe on both normal browsers and iOS.
         */
        if (!("serviceWorker" in navigator)) {
            setPushButtonState("unsupported");
            setPushStatus(
                "error",
                "This browser does not support service workers."
            );
            return false;
        }

        const registration =
            await navigator.serviceWorker.register(
                SERVICE_WORKER_PATH,
                {
                    scope: "/",
                    updateViaCache: "none"
                }
            );

        await navigator.serviceWorker.ready;

        /*
         * iOS/iPadOS Web Push requires the website to be
         * running as a Home Screen web app.
         *
         * We check this AFTER registering the worker so the
         * service worker itself is not the source of the error.
         */
        if (
            isIOSDevice() &&
            !isStandaloneWebApp()
        ) {
            const diagnostic =
                getHomeScreenDiagnostic();

            setPushButtonState("ios-home-screen");

            setPushStatus(
                "ios-home-screen",
                `NovaPay is not running as a Home Screen web app. Display mode: ${diagnostic.displayMode}. Open NovaPay from the Home Screen icon, not Safari.`
            );

            return false;
        }

        if (!isWebPushSupported()) {
            setPushButtonState("unsupported");
            setPushStatus(
                "error",
                "Web Push is not supported by this browser."
            );
            return false;
        }

        let permission =
            Notification.permission;

        /*
         * Permission must be requested from the user's
         * interaction with the Enable button.
         */
        if (
            permission === "default" &&
            requestPermission === true
        ) {
            permission =
                await Notification.requestPermission();
        }

        if (permission !== "granted") {
            setPushButtonState("default");

            if (permission === "denied") {
                setPushStatus(
                    "error",
                    "Notifications are blocked. Allow notifications for NovaPay in your browser settings."
                );
            } else {
                setPushStatus(
                    "default",
                    "Notification permission was not granted."
                );
            }

            return false;
        }

        /*
         * Reuse an existing subscription when possible.
         */
        let subscription =
            await registration.pushManager.getSubscription();

        /*
         * Create a new Web Push subscription if the user
         * does not have one yet.
         */
        if (!subscription) {
            const publicKey =
                await getWebPushPublicKey();

            if (!publicKey) {
                setPushButtonState("default");
                setPushStatus(
                    "error",
                    "NovaPay could not get the push notification key from the server."
                );
                return false;
            }

            const applicationServerKey =
                urlBase64ToUint8Array(publicKey);

            subscription =
                await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey
                });
        }

        const registered =
            await registerPushSubscription(
                subscription
            );

        if (!registered) {
            setPushButtonState("default");
            setPushStatus(
                "error",
                "NovaPay could not register this device for push notifications."
            );
            return false;
        }

        state.pushEnabled = true;

        setPushButtonState("enabled");
        setPushStatus(
            "success",
            "Push notifications are enabled for NovaPay."
        );

        return true;

    } catch (error) {
        console.error(
            "NovaPay push setup error:",
            error
        );

        setPushButtonState("default");

        setPushStatus(
            "error",
            error?.message ||
            "Unable to enable push notifications."
        );

        return false;

    } finally {
        state.pushSetupRunning = false;
    }
}

/* =========================================================
   GET VAPID PUBLIC KEY
   ========================================================= */

async function getWebPushPublicKey() {
    if (!state.user) {
        return null;
    }

    try {
        const idToken =
            await state.user.getIdToken();

        const response =
            await fetch(
                `${NOTIFICATIONS_API}/push-public-key`,
                {
                    method: "GET",
                    headers: {
                        Authorization:
                            `Bearer ${idToken}`
                    }
                }
            );

        let result = null;

        try {
            result =
                await response.json();
        } catch (error) {
            result = null;
        }

        if (!response.ok) {
            throw new Error(
                result?.error ||
                result?.message ||
                `Unable to get push public key. Status ${response.status}.`
            );
        }

        return (
            result?.publicKey ||
            result?.key ||
            null
        );

    } catch (error) {
        console.error(
            "NovaPay VAPID public key error:",
            error
        );

        return null;
    }
}

/* =========================================================
   REGISTER PUSH SUBSCRIPTION
   ========================================================= */

async function registerPushSubscription(subscription) {
    if (!state.user || !subscription) {
        return false;
    }

    try {
        const idToken =
            await state.user.getIdToken();

        const subscriptionJson =
            subscription.toJSON();

        const response =
            await fetch(
                `${NOTIFICATIONS_API}/push-subscription`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json",
                        Authorization:
                            `Bearer ${idToken}`
                    },
                    body: JSON.stringify({
                        subscription:
                            subscriptionJson,
                        platform:
                            getPlatformName()
                    })
                }
            );

        let result = null;

        try {
            result =
                await response.json();
        } catch (error) {
            result = null;
        }

        if (!response.ok) {
            throw new Error(
                result?.error ||
                result?.message ||
                `Push registration failed with status ${response.status}.`
            );
        }

        return result?.success !== false;

    } catch (error) {
        console.error(
            "NovaPay push subscription registration error:",
            error
        );

        return false;
    }
}

/* =========================================================
   REMOVE PUSH SUBSCRIPTION
   ========================================================= */

async function removePushSubscription(subscription) {
    if (!state.user || !subscription) {
        return false;
    }

    try {
        const idToken =
            await state.user.getIdToken();

        const subscriptionJson =
            typeof subscription.toJSON === "function"
                ? subscription.toJSON()
                : subscription;

        const response =
            await fetch(
                `${NOTIFICATIONS_API}/push-subscription`,
                {
                    method: "DELETE",
                    headers: {
                        "Content-Type":
                            "application/json",
                        Authorization:
                            `Bearer ${idToken}`
                    },
                    body: JSON.stringify({
                        subscription:
                            subscriptionJson
                    })
                }
            );

        return response.ok;

    } catch (error) {
        console.error(
            "NovaPay remove push subscription error:",
            error
        );

        return false;
    }
}

/* =========================================================
   BASE64 URL → UINT8 ARRAY
   ========================================================= */

function urlBase64ToUint8Array(base64String) {
    const padding =
        "=".repeat(
            (4 - (base64String.length % 4)) % 4
        );

    const base64 =
        (
            base64String +
            padding
        )
            .replace(/-/g, "+")
            .replace(/_/g, "/");

    const rawData =
        window.atob(base64);

    const outputArray =
        new Uint8Array(
            rawData.length
        );

    for (
        let i = 0;
        i < rawData.length;
        i++
    ) {
        outputArray[i] =
            rawData.charCodeAt(i);
    }

    return outputArray;
}

/* =========================================================
   PLATFORM
   ========================================================= */

function getPlatformName() {
    if (isIOSDevice()) {
        return "ios";
    }

    if (/Android/i.test(navigator.userAgent)) {
        return "android";
    }

    if (/Windows/i.test(navigator.userAgent)) {
        return "windows";
    }

    if (/Macintosh|Mac OS X/i.test(navigator.userAgent)) {
        return "mac";
    }

    return "web";
}

/* =========================================================
   NOTIFICATION LOADING
   ========================================================= */

async function loadNotifications(reset = true) {
    if (!state.user || state.loading) {
        return;
    }

    state.loading = true;

    if (reset) {
        state.notifications = [];
        state.filteredNotifications = [];
        state.nextPageToken = null;
    }

    showLoading(true);

    try {
        const idToken =
            await state.user.getIdToken();

        const params =
            new URLSearchParams();

        params.set("limit", "50");

        if (
            !reset &&
            state.nextPageToken
        ) {
            params.set(
                "pageToken",
                state.nextPageToken
            );
        }

        const response =
            await fetch(
                `${NOTIFICATIONS_API}?${params.toString()}`,
                {
                    method: "GET",
                    headers: {
                        Authorization:
                            `Bearer ${idToken}`
                    }
                }
            );

        let result = null;

        try {
            result =
                await response.json();
        } catch (error) {
            result = null;
        }

        if (!response.ok) {
            throw new Error(
                result?.error ||
                result?.message ||
                `Unable to load notifications. Status ${response.status}.`
            );
        }

        const incoming =
            Array.isArray(result?.notifications)
                ? result.notifications
                : [];

        if (reset) {
            state.notifications =
                incoming;
        } else {
            state.notifications = [
                ...state.notifications,
                ...incoming
            ];
        }

        state.nextPageToken =
            result?.nextPageToken ||
            null;

        state.unreadCount =
            Number(
                result?.unreadCount ??
                state.notifications.filter(
                    notification =>
                        !notification.read
                ).length
            );

        applyFilters();
        updateUnreadBadge();

    } catch (error) {
        console.error(
            "NovaPay notification loading error:",
            error
        );

        if (reset) {
            state.notifications = [];
            applyFilters();
        }

        showNotificationError(
            error?.message ||
            "Unable to load notifications."
        );

    } finally {
        state.loading = false;
        showLoading(false);
    }
}

/* =========================================================
   LOADING UI
   ========================================================= */

function showLoading(show) {
    if (!loadingState) {
        return;
    }

    loadingState.style.display =
        show ? "" : "none";
}

function showNotificationError(message) {
    if (!notificationsContainer) {
        return;
    }

    if (state.notifications.length > 0) {
        return;
    }

    notificationsContainer.innerHTML = "";

    const errorElement =
        document.createElement("div");

    errorElement.className =
        "notification-error";

    errorElement.textContent =
        message;

    notificationsContainer.appendChild(
        errorElement
    );
}

/* =========================================================
   UNREAD BADGE
   ========================================================= */

function updateUnreadBadge() {
    const unread =
        state.notifications.filter(
            notification =>
                !isNotificationRead(notification)
        ).length;

    state.unreadCount = unread;

    if (unreadBadge) {
        unreadBadge.textContent =
            String(unread);

        unreadBadge.style.display =
            unread > 0
                ? ""
                : "none";
    }

    document
        .querySelectorAll(
            "[data-unread-count]"
        )
        .forEach(element => {
            element.textContent =
                String(unread);
        });
}

/* =========================================================
   READ STATE
   ========================================================= */

function isNotificationRead(notification) {
    return (
        notification?.read === true ||
        notification?.isRead === true
    );
}

async function markNotificationRead(notificationId) {
    if (!state.user || !notificationId) {
        return false;
    }

    try {
        const idToken =
            await state.user.getIdToken();

        const response =
            await fetch(
                `${NOTIFICATIONS_API}/${encodeURIComponent(notificationId)}/read`,
                {
                    method: "PATCH",
                    headers: {
                        Authorization:
                            `Bearer ${idToken}`
                    }
                }
            );

        if (!response.ok) {
            let result = null;

            try {
                result =
                    await response.json();
            } catch (error) {
                result = null;
            }

            throw new Error(
                result?.error ||
                result?.message ||
                `Unable to mark notification as read. Status ${response.status}.`
            );
        }

        const notification =
            state.notifications.find(
                item =>
                    String(item.id) ===
                    String(notificationId)
            );

        if (notification) {
            notification.read = true;
            notification.isRead = true;
        }

        updateUnreadBadge();
        applyFilters();

        return true;

    } catch (error) {
        console.error(
            "NovaPay mark notification read error:",
            error
        );

        return false;
    }
}

/* =========================================================
   MARK ALL READ
   ========================================================= */

async function markAllNotificationsRead() {
    if (!state.user) {
        return false;
    }

    try {
        const idToken =
            await state.user.getIdToken();

        const response =
            await fetch(
                `${NOTIFICATIONS_API}/read-all`,
                {
                    method: "PATCH",
                    headers: {
                        Authorization:
                            `Bearer ${idToken}`
                    }
                }
            );

        if (!response.ok) {
            let result = null;

            try {
                result =
                    await response.json();
            } catch (error) {
                result = null;
            }

            throw new Error(
                result?.error ||
                result?.message ||
                `Unable to mark all notifications as read. Status ${response.status}.`
            );
        }

        state.notifications.forEach(
            notification => {
                notification.read = true;
                notification.isRead = true;
            }
        );

        state.unreadCount = 0;

        updateUnreadBadge();
        applyFilters();

        return true;

    } catch (error) {
        console.error(
            "NovaPay mark all notifications read error:",
            error
        );

        return false;
    }
}

/* =========================================================
   MARK ALL BUTTON
   ========================================================= */

if (markAllButton) {
    markAllButton.addEventListener(
        "click",
        async () => {
            markAllButton.disabled = true;

            await markAllNotificationsRead();

            markAllButton.disabled = false;
        }
    );
}

/* =========================================================
   SEARCH
   ========================================================= */

if (searchInput) {
    searchInput.addEventListener(
        "input",
        () => {
            state.searchTerm =
                String(
                    searchInput.value || ""
                )
                    .trim()
                    .toLowerCase();

            applyFilters();
        }
    );
}

/* =========================================================
   TABS
   ========================================================= */

document
    .querySelectorAll(
        "[data-notification-tab]"
    )
    .forEach(tab => {
        tab.addEventListener(
            "click",
            () => {
                const tabName =
                    String(
                        tab.dataset.notificationTab ||
                        "all"
                    ).toLowerCase();

                state.activeTab =
                    ["all", "unread", "read"]
                        .includes(tabName)
                        ? tabName
                        : "all";

                document
                    .querySelectorAll(
                        "[data-notification-tab]"
                    )
                    .forEach(item => {
                        item.classList.toggle(
                            "active",
                            item === tab
                        );
                    });

                applyFilters();
            }
        );
    });

/* =========================================================
   FILTERS
   ========================================================= */

function applyFilters() {
    let filtered =
        [...state.notifications];

    if (state.activeTab === "unread") {
        filtered =
            filtered.filter(
                notification =>
                    !isNotificationRead(
                        notification
                    )
            );
    }

    if (state.activeTab === "read") {
        filtered =
            filtered.filter(
                notification =>
                    isNotificationRead(
                        notification
                    )
            );
    }

    if (state.searchTerm) {
        filtered =
            filtered.filter(
                notification => {
                    const searchableText =
                        [
                            notification?.title,
                            notification?.body,
                            notification?.message,
                            notification?.type
                        ]
                            .map(value =>
                                String(
                                    value ?? ""
                                )
                            )
                            .join(" ")
                            .toLowerCase();

                    return searchableText.includes(
                        state.searchTerm
                    );
                }
            );
    }

    state.filteredNotifications =
        filtered;

    renderNotifications();
} 
/* =========================================================
   NOTIFICATION CATEGORIES
   ========================================================= */

function getNotificationCategory(type) {
    const normalizedType =
        String(type || "system")
            .trim()
            .toLowerCase();

    const categoryMap = {
        transaction: "Transaction",
        payment: "Payment",
        wallet: "Wallet",
        airtime: "Airtime",
        data: "Data",
        electricity: "Electricity",
        tv: "TV Subscription",
        add_money: "Add Money",
        failed: "Failed Transaction",
        reversed: "Reversed Transaction",
        refund: "Refund",
        security: "Security",
        account: "Account",
        promotion: "Promotion",
        system: "System"
    };

    return (
        categoryMap[normalizedType] ||
        "Notification"
    );
}

/* =========================================================
   RENDER NOTIFICATIONS
   ========================================================= */

function renderNotifications() {
    if (!notificationsContainer) {
        return;
    }

    notificationsContainer.innerHTML = "";

    if (
        state.filteredNotifications.length === 0
    ) {
        renderEmptyState();
        updateLoadMoreButton();
        return;
    }

    if (emptyState) {
        emptyState.style.display = "none";
    }

    state.filteredNotifications.forEach(
        notification => {
            const card =
                createNotificationCard(
                    notification
                );

            notificationsContainer.appendChild(
                card
            );
        }
    );

    updateLoadMoreButton();
}

/* =========================================================
   EMPTY STATE
   ========================================================= */

function renderEmptyState() {
    if (emptyState) {
        emptyState.style.display = "";
        return;
    }

    const element =
        document.createElement("div");

    element.className =
        "notification-empty";

    element.textContent =
        state.searchTerm
            ? "No notifications match your search."
            : state.activeTab === "unread"
                ? "You have no unread notifications."
                : state.activeTab === "read"
                    ? "You have no read notifications."
                    : "You have no notifications yet.";

    notificationsContainer.appendChild(
        element
    );
}

/* =========================================================
   NOTIFICATION CARD
   ========================================================= */

function createNotificationCard(notification) {
    const card =
        document.createElement("article");

    const notificationId =
        String(
            notification?.id ||
            notification?.notificationId ||
            ""
        );

    const type =
        String(
            notification?.type ||
            "system"
        )
            .trim()
            .toLowerCase();

    const title =
        String(
            notification?.title ||
            getNotificationCategory(type)
        ).trim();

    const body =
        String(
            notification?.body ||
            notification?.message ||
            ""
        ).trim();

    const read =
        isNotificationRead(notification);

    card.className =
        `notification-card ${read ? "read" : "unread"}`;

    card.dataset.notificationId =
        notificationId;

    const icon =
        document.createElement("div");

    icon.className =
        "notification-icon";

    icon.textContent =
        getNotificationIcon(type);

    const content =
        document.createElement("div");

    content.className =
        "notification-content";

    const header =
        document.createElement("div");

    header.className =
        "notification-header";

    const titleElement =
        document.createElement("h3");

    titleElement.className =
        "notification-title";

    titleElement.textContent =
        title;

    const category =
        document.createElement("span");

    category.className =
        "notification-category";

    category.textContent =
        getNotificationCategory(type);

    header.appendChild(titleElement);
    header.appendChild(category);

    const bodyElement =
        document.createElement("p");

    bodyElement.className =
        "notification-message";

    bodyElement.textContent =
        body;

    const footer =
        document.createElement("div");

    footer.className =
        "notification-footer";

    const timestamp =
        document.createElement("span");

    timestamp.className =
        "notification-time";

    timestamp.textContent =
        formatNotificationTime(
            notification?.createdAt ||
            notification?.timestamp ||
            notification?.created_at
        );

    footer.appendChild(timestamp);

    if (!read && notificationId) {
        const readButton =
            document.createElement("button");

        readButton.type = "button";
        readButton.className =
            "notification-read-btn";

        readButton.textContent =
            "Mark as read";

        readButton.addEventListener(
            "click",
            async event => {
                event.stopPropagation();

                readButton.disabled = true;

                const success =
                    await markNotificationRead(
                        notificationId
                    );

                if (!success) {
                    readButton.disabled =
                        false;
                }
            }
        );

        footer.appendChild(readButton);
    }

    content.appendChild(header);
    content.appendChild(bodyElement);
    content.appendChild(footer);

    card.appendChild(icon);
    card.appendChild(content);

    card.addEventListener(
        "click",
        async () => {
            if (
                notificationId &&
                !read
            ) {
                await markNotificationRead(
                    notificationId
                );
            }

            openNotificationDestination(
                notification
            );
        }
    );

    return card;
}

/* =========================================================
   NOTIFICATION ICONS
   ========================================================= */

function getNotificationIcon(type) {
    const icons = {
        transaction: "↔",
        payment: "₦",
        wallet: "▣",
        airtime: "☎",
        data: "◉",
        electricity: "⚡",
        tv: "▣",
        add_money: "+",
        failed: "!",
        reversed: "↶",
        refund: "↩",
        security: "🔒",
        account: "●",
        promotion: "★",
        system: "i"
    };

    return icons[type] || "i";
}

/* =========================================================
   NOTIFICATION TIME
   ========================================================= */

function formatNotificationTime(value) {
    if (!value) {
        return "Just now";
    }

    let date = null;

    if (
        typeof value === "object" &&
        typeof value.toDate === "function"
    ) {
        date = value.toDate();
    } else if (
        typeof value === "object" &&
        typeof value.seconds === "number"
    ) {
        date =
            new Date(
                value.seconds * 1000
            );
    } else {
        date =
            new Date(value);
    }

    if (
        !date ||
        Number.isNaN(date.getTime())
    ) {
        return "Recently";
    }

    const now =
        new Date();

    const difference =
        now.getTime() -
        date.getTime();

    const minute =
        60 * 1000;

    const hour =
        60 * minute;

    const day =
        24 * hour;

    if (difference < minute) {
        return "Just now";
    }

    if (difference < hour) {
        const minutes =
            Math.floor(
                difference / minute
            );

        return `${minutes}m ago`;
    }

    if (difference < day) {
        const hours =
            Math.floor(
                difference / hour
            );

        return `${hours}h ago`;
    }

    if (difference < 7 * day) {
        const days =
            Math.floor(
                difference / day
            );

        return `${days}d ago`;
    }

    return date.toLocaleDateString(
        undefined,
        {
            day: "numeric",
            month: "short",
            year:
                date.getFullYear() !==
                now.getFullYear()
                    ? "numeric"
                    : undefined
        }
    );
}

/* =========================================================
   NOTIFICATION DESTINATION
   ========================================================= */

function openNotificationDestination(
    notification
) {
    const data =
        notification?.data &&
        typeof notification.data === "object"
            ? notification.data
            : {};

    const explicitUrl =
        data.url ||
        notification?.url ||
        notification?.actionUrl;

    if (
        typeof explicitUrl === "string" &&
        explicitUrl.trim()
    ) {
        const url =
            explicitUrl.trim();

        if (
            url.startsWith("/") ||
            url.startsWith(window.location.origin)
        ) {
            window.location.href = url;
            return;
        }
    }

    const type =
        String(
            notification?.type ||
            data.type ||
            ""
        )
            .trim()
            .toLowerCase();

    const destinations = {
        airtime: "/airtime.html",
        data: "/data.html",
        electricity: "/electricity.html",
        tv: "/tv.html",
        add_money: "/add-money.html",
        security: "/security.html",
        account: "/profile.html"
    };

    const destination =
        destinations[type];

    if (destination) {
        window.location.href =
            destination;
        return;
    }

    /*
     * Notifications without a specific
     * destination remain on this page.
     */
}

/* =========================================================
   LOAD MORE
   ========================================================= */

if (loadMoreButton) {
    loadMoreButton.addEventListener(
        "click",
        async () => {
            if (
                state.loading ||
                !state.nextPageToken
            ) {
                return;
            }

            loadMoreButton.disabled = true;

            /*
             * IMPORTANT:
             * false means append the next page
             * instead of resetting the current list.
             */
            await loadNotifications(false);

            loadMoreButton.disabled = false;
        }
    );
}

function updateLoadMoreButton() {
    if (!loadMoreButton) {
        return;
    }

    loadMoreButton.style.display =
        state.nextPageToken
            ? ""
            : "none";
}

/* =========================================================
   URL NOTIFICATION HANDLING
   ========================================================= */

async function handleNotificationUrl() {
    const params =
        new URLSearchParams(
            window.location.search
        );

    const notificationId =
        params.get("notificationId");

    if (!notificationId) {
        return;
    }

    const notification =
        state.notifications.find(
            item =>
                String(
                    item?.id ||
                    item?.notificationId ||
                    ""
                ) ===
                String(notificationId)
        );

    if (notification) {
        if (
            !isNotificationRead(
                notification
            )
        ) {
            await markNotificationRead(
                notificationId
            );
        }

        const card =
            notificationsContainer?.querySelector(
                `[data-notification-id="${CSS.escape(notificationId)}"]`
            );

        if (card) {
            card.scrollIntoView({
                behavior: "smooth",
                block: "center"
            });
        }
    }
}

/* =========================================================
   SERVICE WORKER MESSAGE
   ========================================================= */

if ("serviceWorker" in navigator) {
    navigator.serviceWorker.addEventListener(
        "message",
        event => {
            const message =
                event.data;

            if (
                !message ||
                message.type !==
                    "NOVAPAY_PUSH"
            ) {
                return;
            }

            /*
             * A push arrived while NovaPay is
             * open. Refresh the history so the
             * new notification appears in-app.
             */
            loadNotifications(true);
        }
    );
}

/* =========================================================
   VISIBILITY REFRESH
   ========================================================= */

document.addEventListener(
    "visibilitychange",
    () => {
        if (
            document.visibilityState ===
            "visible"
        ) {
            if (state.user) {
                loadNotifications(true);
            }
        }
    }
);

/* =========================================================
   PERIODIC REFRESH
   ========================================================= */

setInterval(
    () => {
        if (
            document.visibilityState ===
                "visible" &&
            state.user &&
            !state.loading
        ) {
            loadNotifications(true);
        }
    },
    30000
);

/* =========================================================
   LOGOUT RESET
   ========================================================= */

window.addEventListener(
    "beforeunload",
    () => {
        state.user = null;
        state.notifications = [];
        state.filteredNotifications = [];
        state.nextPageToken = null;
        state.unreadCount = 0;
    }
);

/* =========================================================
   STARTUP
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {
        updateUnreadBadge();

        if (state.user) {
            loadNotifications(true);
        }
    }
);

/* =========================================================
   INITIAL PUSH UI
   ========================================================= */

(function initialisePushUI() {
    if (!pushButton) {
        return;
    }

    if (!isWebPushSupported()) {
        setPushButtonState(
            "unsupported"
        );

        setPushStatus(
            "error",
            "Push notifications are not supported by this browser."
        );

        return;
    }

    if (
        "Notification" in window &&
        Notification.permission === "granted"
    ) {
        setPushButtonState(
            "enabled"
        );

        setPushStatus(
            "success",
            "Notification permission is already enabled."
        );

        return;
    }

    setPushButtonState("default");

    setPushStatus(
        "default",
        "Enable push notifications to receive NovaPay alerts."
    );
})();

/* =========================================================
   END OF NOVAPAY NOTIFICATIONS
   ========================================================= */