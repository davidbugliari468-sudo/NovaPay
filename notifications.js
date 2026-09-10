import { auth } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import {
    getMessaging,
    getToken,
    onMessage,
    isSupported
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-messaging.js";


// ============================================================
// NOVAPAY NOTIFICATIONS
// ============================================================

const API_BASE_URL =
    "https://novapay-server.onrender.com";

const NOTIFICATIONS_API =
    `${API_BASE_URL}/api/notifications`;

const VAPID_KEY =
    "BFMyRPGHe8g5MPJOjkd8DaVZX_rwVrYnR1nyGQMMU44GMA6zVb2rKbblTTFWdfj2CKSwenno3w7nHwNOFDD5FMA";

const SERVICE_WORKER_PATH =
    "/firebase-messaging-sw.js";

const DEFAULT_LIMIT = 30;


// ============================================================
// DOM ELEMENTS
// ============================================================

const notificationList =
    document.getElementById("notificationList");

const emptyState =
    document.getElementById("emptyState");

const searchInput =
    document.getElementById("searchInput");

const backBtn =
    document.getElementById("backBtn");

const tabs =
    document.querySelectorAll(".tab");


// ============================================================
// STATE
// ============================================================

let currentUser = null;

let notifications = [];

let currentTab = "all";

let currentSearch = "";

let nextCursor = null;

let hasMore = false;

let loading = false;

let pushSetupInProgress = false;

let pushSetupCompleted = false;

let foregroundListenerStarted = false;

let pushControl = null;

let pushButton = null;

let pushStatus = null;


// ============================================================
// BACK BUTTON
// ============================================================

if (backBtn) {

    backBtn.addEventListener("click", () => {

        if (
            document.referrer &&
            document.referrer !== window.location.href
        ) {
            window.history.back();
            return;
        }

        window.location.href =
            "dashboard.html";
    });
}


// ============================================================
// CREATE PUSH NOTIFICATION CONTROL
// ============================================================

function createPushControl() {

    if (pushControl) {
        return;
    }

    const header =
        document.querySelector(".header");

    if (!header) {
        return;
    }

    pushControl =
        document.createElement("div");

    pushControl.id =
        "pushControl";

    pushControl.style.width =
        "100%";

    pushControl.style.margin =
        "14px 0 4px";

    pushControl.style.padding =
        "12px 14px";

    pushControl.style.borderRadius =
        "16px";

    pushControl.style.background =
        "#f5f8ff";

    pushControl.style.border =
        "1px solid #dce7ff";

    pushControl.style.boxSizing =
        "border-box";


    pushButton =
        document.createElement("button");

    pushButton.id =
        "enablePushBtn";

    pushButton.type =
        "button";

    pushButton.innerHTML =
        `<i class="fa-solid fa-bell"></i>
         <span>Enable Push Notifications</span>`;

    pushButton.style.width =
        "100%";

    pushButton.style.minHeight =
        "44px";

    pushButton.style.border =
        "none";

    pushButton.style.borderRadius =
        "12px";

    pushButton.style.background =
        "#1769ff";

    pushButton.style.color =
        "#ffffff";

    pushButton.style.fontSize =
        "14px";

    pushButton.style.fontWeight =
        "700";

    pushButton.style.cursor =
        "pointer";

    pushButton.style.display =
        "flex";

    pushButton.style.alignItems =
        "center";

    pushButton.style.justifyContent =
        "center";

    pushButton.style.gap =
        "8px";

    pushButton.style.padding =
        "10px 14px";


    pushStatus =
        document.createElement("div");

    pushStatus.id =
        "pushStatus";

    pushStatus.style.marginTop =
        "7px";

    pushStatus.style.textAlign =
        "center";

    pushStatus.style.fontSize =
        "11px";

    pushStatus.style.lineHeight =
        "1.4";

    pushStatus.style.color =
        "#64748b";


    pushControl.appendChild(
        pushButton
    );

    pushControl.appendChild(
        pushStatus
    );


    header.insertAdjacentElement(
        "afterend",
        pushControl
    );


    pushButton.addEventListener(
        "click",
        async () => {

            if (
                pushSetupInProgress
            ) {
                return;
            }

            await setupPushNotifications(
                true
            );
        }
    );
}


// ============================================================
// PUSH STATUS
// ============================================================

function setPushStatus(
    message,
    color = "#64748b"
) {

    if (!pushStatus) {
        return;
    }

    pushStatus.textContent =
        message;

    pushStatus.style.color =
        color;
}


// ============================================================
// UPDATE PUSH UI
// ============================================================

function updatePushUI(
    state
) {

    if (
        !pushButton ||
        !pushStatus
    ) {
        return;
    }


    if (state === "enabled") {

        pushButton.disabled =
            true;

        pushButton.style.background =
            "#16a34a";

        pushButton.innerHTML =
            `<i class="fa-solid fa-check"></i>
             <span>Push Notifications Enabled</span>`;

        setPushStatus(
            "NovaPay can now send alerts to this device.",
            "#15803d"
        );

        return;
    }


    if (state === "loading") {

        pushButton.disabled =
            true;

        pushButton.style.background =
            "#64748b";

        pushButton.innerHTML =
            `<i class="fa-solid fa-spinner fa-spin"></i>
             <span>Enabling Notifications...</span>`;

        setPushStatus(
            "Please wait...",
            "#64748b"
        );

        return;
    }


    if (state === "blocked") {

        pushButton.disabled =
            true;

        pushButton.style.background =
            "#94a3b8";

        pushButton.innerHTML =
            `<i class="fa-solid fa-bell-slash"></i>
             <span>Push Notifications Blocked</span>`;

        setPushStatus(
            "Notifications are blocked. Enable them in your browser or device settings.",
            "#b45309"
        );

        return;
    }


    if (state === "ios-home-screen") {

        pushButton.disabled =
            false;

        pushButton.style.background =
            "#1769ff";

        pushButton.innerHTML =
            `<i class="fa-solid fa-mobile-screen-button"></i>
             <span>Enable Push Notifications</span>`;

        setPushStatus(
            "On iPhone, first add NovaPay to your Home Screen and open it there.",
            "#475569"
        );

        return;
    }


    if (state === "unsupported") {

        pushButton.disabled =
            true;

        pushButton.style.background =
            "#94a3b8";

        pushButton.innerHTML =
            `<i class="fa-solid fa-bell-slash"></i>
             <span>Push Not Available</span>`;

        setPushStatus(
            "Push notifications are not supported in this browser.",
            "#b45309"
        );

        return;
    }


    pushButton.disabled =
        false;

    pushButton.style.background =
        "#1769ff";

    pushButton.innerHTML =
        `<i class="fa-solid fa-bell"></i>
         <span>Enable Push Notifications</span>`;

    setPushStatus(
        "Get important NovaPay alerts on this device.",
        "#64748b"
    );
}


// ============================================================
// IOS DETECTION
// ============================================================

function isIOSDevice() {

    const userAgent =
        navigator.userAgent ||
        navigator.vendor ||
        window.opera ||
        "";

    const classicIOS =
        /iPhone|iPad|iPod/i.test(
            userAgent
        );

    const iPadDesktopMode =
        /Macintosh/i.test(
            userAgent
        ) &&
        "ontouchend" in document;

    return (
        classicIOS ||
        iPadDesktopMode
    );
}


// ============================================================
// HOME SCREEN / STANDALONE DETECTION
// ============================================================

function isStandaloneWebApp() {

    const standaloneMedia =
        window.matchMedia &&
        window.matchMedia(
            "(display-mode: standalone)"
        ).matches;

    const navigatorStandalone =
        window.navigator &&
        window.navigator.standalone === true;

    return (
        standaloneMedia ||
        navigatorStandalone
    );
}


// ============================================================
// AUTH STATE
// ============================================================

onAuthStateChanged(
    auth,
    async user => {

        currentUser =
            user;

        createPushControl();


        if (!user) {

            notifications = [];

            renderNotifications();

            updatePushUI(
                "unsupported"
            );

            return;
        }


        await loadNotifications(
            true
        );


        /*
         * IMPORTANT:
         *
         * We do NOT request notification
         * permission automatically here.
         *
         * iPhone requires permission requests
         * to happen after a direct user action.
         *
         * If permission was already granted,
         * we can silently finish setup.
         */

        if (
            typeof Notification !==
            "undefined" &&
            Notification.permission ===
            "granted"
        ) {

            await setupPushNotifications(
                false
            );

        } else {

            updatePushUI(
                "default"
            );
        }
    }
);


// ============================================================
// LOAD NOTIFICATIONS
// ============================================================

async function loadNotifications(
    reset = false
) {

    if (
        !currentUser ||
        loading
    ) {
        return;
    }

    loading = true;


    try {

        if (reset) {

            nextCursor =
                null;

            hasMore =
                false;
        }


        const idToken =
            await currentUser.getIdToken();


        const params =
            new URLSearchParams();


        params.set(
            "limit",
            String(DEFAULT_LIMIT)
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

        } catch {

            result =
                null;
        }


        if (!response.ok) {

            throw new Error(
                result?.error ||
                result?.message ||
                `Unable to load notifications. Status ${response.status}.`
            );
        }


        const incoming =
            Array.isArray(
                result?.notifications
            )
                ? result.notifications
                : [];


        if (reset) {

            notifications =
                incoming;

        } else {

            const existingIds =
                new Set(
                    notifications.map(
                        item => item.id
                    )
                );


            const newItems =
                incoming.filter(
                    item =>
                        !existingIds.has(
                            item.id
                        )
                );


            notifications =
                [
                    ...notifications,
                    ...newItems
                ];
        }


        hasMore =
            result?.pagination?.hasMore ===
            true;


        nextCursor =
            result?.pagination?.nextCursor ||
            null;


        renderNotifications();

    } catch (error) {

        console.error(
            "NovaPay notification loading error:",
            error
        );

        if (reset) {

            notifications = [];

            renderNotifications(
                "Unable to load notifications right now."
            );
        }

    } finally {

        loading = false;
    }
}


// ============================================================
// PUSH NOTIFICATION SETUP
// ============================================================

async function setupPushNotifications(
    requestPermission = false
) {

    if (
        !currentUser
    ) {
        return false;
    }


    if (
        pushSetupInProgress
    ) {
        return false;
    }


    if (
        pushSetupCompleted
    ) {

        updatePushUI(
            "enabled"
        );

        return true;
    }


    /*
     * iPhone / iPad:
     *
     * Web Push works for Home Screen
     * web apps. A normal Safari/Chrome
     * browser tab is not the correct
     * environment for this flow.
     */

    if (
        isIOSDevice() &&
        !isStandaloneWebApp()
    ) {

        updatePushUI(
            "ios-home-screen"
        );

        return false;
    }


    pushSetupInProgress =
        true;


    updatePushUI(
        "loading"
    );


    try {

        const supported =
            await isSupported();


        if (!supported) {

            updatePushUI(
                "unsupported"
            );

            return false;
        }


        if (
            typeof Notification ===
            "undefined"
        ) {

            updatePushUI(
                "unsupported"
            );

            return false;
        }


        /*
         * Register the Firebase
         * messaging service worker.
         */

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
         * Only request permission after
         * the user presses the button.
         */

        let permission =
            Notification.permission;


        if (
            permission ===
            "default"
        ) {

            if (!requestPermission) {

                updatePushUI(
                    "default"
                );

                return false;
            }


            permission =
                await Notification.requestPermission();
        }


        if (
            permission !==
            "granted"
        ) {

            if (
                permission ===
                "denied"
            ) {

                updatePushUI(
                    "blocked"
                );

            } else {

                updatePushUI(
                    "default"
                );
            }

            return false;
        }


        /*
         * Get the Firebase Cloud
         * Messaging registration token.
         */

        const messaging =
            getMessaging();


        const token =
            await getToken(
                messaging,
                {
                    vapidKey:
                        VAPID_KEY,

                    serviceWorkerRegistration:
                        registration
                }
            );


        if (!token) {

            throw new Error(
                "Firebase did not return a push notification token."
            );
        }


        /*
         * Register the device token
         * with NovaPay backend.
         */

        const registered =
            await registerDeviceToken(
                token
            );


        if (!registered) {

            throw new Error(
                "NovaPay could not register this device for push notifications."
            );
        }


        pushSetupCompleted =
            true;


        updatePushUI(
            "enabled"
        );


        setupForegroundListener(
            messaging
        );


        return true;

    } catch (error) {

        console.error(
            "NovaPay push notification setup error:",
            error
        );


        const errorMessage =
            String(
                error?.message ||
                ""
            ).toLowerCase();


        if (
            errorMessage.includes(
                "permission"
            ) &&
            errorMessage.includes(
                "denied"
            )
        ) {

            updatePushUI(
                "blocked"
            );

        } else {

            updatePushUI(
                "default"
            );

            setPushStatus(
                "Push setup could not be completed. Tap the button to try again.",
                "#b45309"
            );
        }


        return false;

    } finally {

        pushSetupInProgress =
            false;
    }
}


// ============================================================
// REGISTER DEVICE TOKEN
// ============================================================

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


        const response =
            await fetch(
                `${NOTIFICATIONS_API}/device-token`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        Authorization:
                            `Bearer ${idToken}`
                    },

                    body:
                        JSON.stringify({
                            token,
                            platform:
                                detectPlatform()
                        })
                }
            );


        let result = null;


        try {

            result =
                await response.json();

        } catch {

            result =
                null;
        }


        if (!response.ok) {

            console.error(
                "NovaPay device token registration failed:",
                result
            );

            return false;
        }


        if (
            result &&
            result.success === false
        ) {

            console.error(
                "NovaPay device token registration failed:",
                result
            );

            return false;
        }


        console.log(
            "✅ NovaPay push token registered."
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


// ============================================================
// PLATFORM DETECTION
// ============================================================

function detectPlatform() {

    const userAgent =
        navigator.userAgent ||
        "";


    if (
        /iPhone|iPad|iPod/i.test(
            userAgent
        )
    ) {

        return "ios";
    }


    if (
        /Android/i.test(
            userAgent
        )
    ) {

        return "android";
    }


    if (
        /Windows/i.test(
            userAgent
        )
    ) {

        return "windows";
    }


    if (
        /Macintosh|Mac OS X/i.test(
            userAgent
        )
    ) {

        return "macos";
    }


    if (
        /Linux/i.test(
            userAgent
        )
    ) {

        return "linux";
    }


    return "web";
}


// ============================================================
// FOREGROUND PUSH LISTENER
// ============================================================

function setupForegroundListener(
    messaging
) {

    if (
        foregroundListenerStarted
    ) {
        return;
    }


    foregroundListenerStarted =
        true;


    onMessage(
        messaging,
        async payload => {

            console.log(
                "NovaPay foreground notification received:",
                payload
            );


            /*
             * Reload notification history
             * so the new notification appears
             * inside the website.
             */

            await loadNotifications(
                true
            );


            /*
             * Show a browser notification
             * while NovaPay is open.
             */

            showForegroundNotification(
                payload
            );
        }
    );
}


// ============================================================
// FOREGROUND NOTIFICATION DISPLAY
// ============================================================

function showForegroundNotification(
    payload
) {

    if (
        typeof Notification ===
        "undefined"
    ) {
        return;
    }


    if (
        Notification.permission !==
        "granted"
    ) {
        return;
    }


    const notification =
        payload?.notification ||
        {};

    const data =
        payload?.data ||
        {};


    const title =
        String(
            notification.title ||
            data.title ||
            "NovaPay"
        ).trim();


    const body =
        String(
            notification.body ||
            data.body ||
            "You have a new notification."
        ).trim();


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
                        String(
                            data.notificationId ||
                            "novapay-notification"
                        )
                }
            );


        browserNotification.onclick =
            () => {

                window.focus();

                const notificationId =
                    String(
                        data.notificationId ||
                        ""
                    ).trim();


                if (
                    notificationId
                ) {

                    window.location.href =
                        `notifications.html?notificationId=${encodeURIComponent(notificationId)}`;
                }
            };

    } catch (error) {

        console.warn(
            "NovaPay could not display foreground browser notification:",
            error
        );
    }
}


// ============================================================
// FILTER NOTIFICATIONS
// ============================================================

function getFilteredNotifications() {

    let filtered =
        [...notifications];


    /*
     * Tabs
     */

    if (
        currentTab ===
        "transactions"
    ) {

        filtered =
            filtered.filter(
                notification =>
                    isTransactionNotification(
                        notification
                    )
            );
    }


    if (
        currentTab ===
        "services"
    ) {

        filtered =
            filtered.filter(
                notification =>
                    isServiceNotification(
                        notification
                    )
            );
    }


    if (
        currentTab ===
        "novapay"
    ) {

        filtered =
            filtered.filter(
                notification =>
                    isNovaPayNotification(
                        notification
                    )
            );
    }


    if (
        currentTab ===
        "unread"
    ) {

        filtered =
            filtered.filter(
                notification =>
                    notification.read !==
                    true
            );
    }


    if (
        currentTab ===
        "read"
    ) {

        filtered =
            filtered.filter(
                notification =>
                    notification.read ===
                    true
            );
    }


    /*
     * Search
     */

    const search =
        currentSearch
            .trim()
            .toLowerCase();


    if (search) {

        filtered =
            filtered.filter(
                notification => {

                    const text =
                        [
                            notification.title,
                            notification.body,
                            notification.message,
                            notification.type
                        ]
                            .filter(Boolean)
                            .join(" ")
                            .toLowerCase();


                    return text.includes(
                        search
                    );
                }
            );
    }


    /*
     * Newest first
     */

    filtered.sort(
        (
            a,
            b
        ) =>
            getTimestamp(
                b.createdAt
            ) -
            getTimestamp(
                a.createdAt
            )
    );


    return filtered;
}


// ============================================================
// NOTIFICATION CATEGORIES
// ============================================================

function isTransactionNotification(
    notification
) {

    const type =
        String(
            notification?.type ||
            ""
        ).toLowerCase();


    return [
        "transaction",
        "payment",
        "wallet",
        "airtime",
        "data",
        "electricity",
        "tv",
        "refund",
        "failed",
        "reversed",
        "add_money"
    ].includes(type);
}


function isServiceNotification(
    notification
) {

    const type =
        String(
            notification?.type ||
            ""
        ).toLowerCase();


    return [
        "airtime",
        "data",
        "electricity",
        "tv",
        "service"
    ].includes(type);
}


function isNovaPayNotification(
    notification
) {

    const type =
        String(
            notification?.type ||
            ""
        ).toLowerCase();


    return [
        "security",
        "account",
        "promotion",
        "system"
    ].includes(type);
}


// ============================================================
// RENDER NOTIFICATIONS
// ============================================================

function renderNotifications(
    errorMessage = ""
) {

    if (
        !notificationList ||
        !emptyState
    ) {
        return;
    }


    const filtered =
        getFilteredNotifications();


    notificationList.innerHTML =
        "";


    if (errorMessage) {

        emptyState.style.display =
            "flex";

        emptyState.innerHTML =
            `
            <i class="fa-solid fa-triangle-exclamation"></i>

            <h2>
                Unable to Load
            </h2>

            <p>
                ${escapeHTML(errorMessage)}
            </p>
            `;

        return;
    }


    if (
        filtered.length ===
        0
    ) {

        notificationList.style.display =
            "none";

        emptyState.style.display =
            "flex";

        emptyState.innerHTML =
            `
            <i class="fa-regular fa-bell"></i>

            <h2>
                No Notifications
            </h2>

            <p>
                You're all caught up.
                New transactions, services
                and NovaPay updates will
                appear here.
            </p>
            `;

        return;
    }


    notificationList.style.display =
        "flex";

    emptyState.style.display =
        "none";


    for (
        const notification of filtered
    ) {

        const card =
            createNotificationCard(
                notification
            );


        notificationList.appendChild(
            card
        );
    }
}


// ============================================================
// CREATE NOTIFICATION CARD
// ============================================================

function createNotificationCard(
    notification
) {

    const card =
        document.createElement(
            "article"
        );


    card.className =
        "notification-card";


    if (
        notification.read !==
        true
    ) {

        card.classList.add(
            "unread"
        );
    }


    const icon =
        document.createElement(
            "div"
        );


    icon.className =
        "notification-icon";


    icon.innerHTML =
        getNotificationIcon(
            notification.type
        );


    const content =
        document.createElement(
            "div"
        );


    content.className =
        "notification-content";


    const title =
        document.createElement(
            "h3"
        );


    title.className =
        "notification-title";


    title.textContent =
        String(
            notification.title ||
            "NovaPay"
        );


    const message =
        document.createElement(
            "p"
        );


    message.className =
        "notification-message";


    message.textContent =
        String(
            notification.body ||
            notification.message ||
            ""
        );


    const time =
        document.createElement(
            "span"
        );


    time.className =
        "notification-time";


    time.textContent =
        formatTimestamp(
            notification.createdAt
        );


    content.appendChild(
        title
    );

    content.appendChild(
        message
    );

    content.appendChild(
        time
    );


    card.appendChild(
        icon
    );

    card.appendChild(
        content
    );


    if (
        notification.read !==
        true
    ) {

        const unreadDot =
            document.createElement(
                "span"
            );


        unreadDot.className =
            "unread-dot";


        card.appendChild(
            unreadDot
        );
    }


    card.addEventListener(
        "click",
        async () => {

            if (
                notification.read !==
                true
            ) {

                await markNotificationAsRead(
                    notification.id
                );
            }
        }
    );


    return card;
}


// ============================================================
// NOTIFICATION ICON
// ============================================================

function getNotificationIcon(
    type
) {

    const normalizedType =
        String(
            type ||
            ""
        ).toLowerCase();


    const icons = {

        airtime:
            "fa-solid fa-phone",

        data:
            "fa-solid fa-wifi",

        electricity:
            "fa-solid fa-bolt",

        tv:
            "fa-solid fa-tv",

        refund:
            "fa-solid fa-rotate-left",

        failed:
            "fa-solid fa-circle-xmark",

        reversed:
            "fa-solid fa-arrow-rotate-left",

        add_money:
            "fa-solid fa-circle-plus",

        transaction:
            "fa-solid fa-money-bill-transfer",

        payment:
            "fa-solid fa-credit-card",

        wallet:
            "fa-solid fa-wallet",

        security:
            "fa-solid fa-shield-halved",

        account:
            "fa-solid fa-user",

        promotion:
            "fa-solid fa-gift",

        system:
            "fa-solid fa-bell"
    };


    const icon =
        icons[
            normalizedType
        ] ||
        "fa-solid fa-bell";


    return `<i class="${icon}"></i>`;
}


// ============================================================
// MARK ONE NOTIFICATION AS READ
// ============================================================

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

            return;
        }


        const notification =
            notifications.find(
                item =>
                    item.id ===
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


// ============================================================
// MARK ALL AS READ
// ============================================================

async function markAllNotificationsAsRead() {

    if (
        !currentUser
    ) {
        return;
    }


    try {

        const idToken =
            await currentUser.getIdToken();


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

            throw new Error(
                "Unable to mark all notifications as read."
            );
        }


        notifications =
            notifications.map(
                notification => ({
                    ...notification,
                    read: true
                })
            );


        renderNotifications();

    } catch (error) {

        console.error(
            "NovaPay mark all notifications read error:",
            error
        );
    }
}


// ============================================================
// MARK-ALL BUTTON
// ============================================================

const markAllBtn =
    document.getElementById(
        "markAllRead"
    );


if (markAllBtn) {

    markAllBtn.addEventListener(
        "click",
        async () => {

            await markAllNotificationsAsRead();
        }
    );
}


// ============================================================
// SEARCH
// ============================================================

if (searchInput) {

    searchInput.addEventListener(
        "input",
        event => {

            currentSearch =
                event.target.value ||
                "";

            renderNotifications();
        }
    );
}


// ============================================================
// TABS
// ============================================================

tabs.forEach(
    (tab, index) => {

        tab.addEventListener(
            "click",
            () => {

                tabs.forEach(
                    item =>
                        item.classList.remove(
                            "active"
                        )
                );


                tab.classList.add(
                    "active"
                );


                const tabText =
                    String(
                        tab.textContent ||
                        ""
                    )
                        .trim()
                        .toLowerCase();


                if (
                    tabText ===
                    "transactions"
                ) {

                    currentTab =
                        "transactions";

                } else if (
                    tabText ===
                    "services"
                ) {

                    currentTab =
                        "services";

                } else if (
                    tabText ===
                    "novapay"
                ) {

                    currentTab =
                        "novapay";

                } else if (
                    tabText ===
                    "unread"
                ) {

                    currentTab =
                        "unread";

                } else if (
                    tabText ===
                    "read"
                ) {

                    currentTab =
                        "read";

                } else {

                    currentTab =
                        "all";
                }


                renderNotifications();
            }
        );
    }
);


// ============================================================
// TIMESTAMP
// ============================================================

function getTimestamp(
    value
) {

    if (!value) {
        return 0;
    }


    if (
        typeof value ===
        "number"
    ) {

        return value;
    }


    if (
        typeof value?.seconds ===
        "number"
    ) {

        return (
            value.seconds *
            1000
        );
    }


    if (
        typeof value?._seconds ===
        "number"
    ) {

        return (
            value._seconds *
            1000
        );
    }


    if (
        typeof value ===
        "string"
    ) {

        const parsed =
            Date.parse(
                value
            );


        if (
            !Number.isNaN(
                parsed
            )
        ) {

            return parsed;
        }
    }


    return 0;
}


// ============================================================
// FORMAT TIMESTAMP
// ============================================================

function formatTimestamp(
    value
) {

    const timestamp =
        getTimestamp(
            value
        );


    if (!timestamp) {

        return "Just now";
    }


    const date =
        new Date(
            timestamp
        );


    const now =
        new Date();


    const difference =
        now.getTime() -
        date.getTime();


    if (
        difference <
        60 * 1000
    ) {

        return "Just now";
    }


    if (
        difference <
        60 * 60 * 1000
    ) {

        const minutes =
            Math.floor(
                difference /
                (60 * 1000)
            );


        return `${minutes} min ago`;
    }


    if (
        difference <
        24 * 60 * 60 * 1000
    ) {

        const hours =
            Math.floor(
                difference /
                (60 * 60 * 1000)
            );


        return `${hours} hr ago`;
    }


    if (
        difference <
        7 * 24 * 60 * 60 * 1000
    ) {

        const days =
            Math.floor(
                difference /
                (24 * 60 * 60 * 1000)
            );


        return `${days} day${days === 1 ? "" : "s"} ago`;
    }


    return date.toLocaleString(
        undefined,
        {
            day: "numeric",
            month: "short",
            year:
                date.getFullYear() !==
                now.getFullYear()
                    ? "numeric"
                    : undefined,
            hour: "numeric",
            minute: "2-digit"
        }
    );
}


// ============================================================
// ESCAPE HTML
// ============================================================

function escapeHTML(
    value
) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        String(
            value ??
            ""
        );


    return div.innerHTML;
}


// ============================================================
// LOAD MORE WHEN NEEDED
// ============================================================

window.addEventListener(
    "scroll",
    () => {

        if (
            !hasMore ||
            loading
        ) {
            return;
        }


        const scrollPosition =
            window.innerHeight +
            window.scrollY;


        const pageHeight =
            document.documentElement
                .scrollHeight;


        if (
            scrollPosition >=
            pageHeight - 300
        ) {

            loadNotifications(
                false
            );
        }
    },
    {
        passive: true
    }
);


// ============================================================
// NOTIFICATION LINK HANDLING
// ============================================================

function openNotificationFromURL() {

    const params =
        new URLSearchParams(
            window.location.search
        );


    const notificationId =
        params.get(
            "notificationId"
        );


    if (!notificationId) {
        return;
    }


    const notification =
        notifications.find(
            item =>
                item.id ===
                notificationId
        );


    if (!notification) {
        return;
    }


    setTimeout(
        () => {

            const cards =
                document.querySelectorAll(
                    ".notification-card"
                );


            const index =
                notifications.findIndex(
                    item =>
                        item.id ===
                        notificationId
                );


            if (
                index >= 0 &&
                cards[index]
            ) {

                cards[index].scrollIntoView(
                    {
                        behavior: "smooth",
                        block: "center"
                    }
                );


                cards[index].style.outline =
                    "3px solid rgba(23,105,255,0.25)";


                setTimeout(
                    () => {

                        cards[index].style.outline =
                            "";

                    },
                    2500
                );
            }

        },
        300
    );
}


// ============================================================
// ONLINE / OFFLINE REFRESH
// ============================================================

window.addEventListener(
    "online",
    async () => {

        if (!currentUser) {
            return;
        }


        await loadNotifications(
            true
        );
    }
);


// ============================================================
// STARTUP
// ============================================================

createPushControl();

updatePushUI(
    "default"
);