import { auth } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";


// ============================================================
// NOVAPAY NOTIFICATIONS
// ============================================================

const API_BASE_URL =
    "https://novapay-server.onrender.com";

const NOTIFICATIONS_API =
    `${API_BASE_URL}/api/notifications`;

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

let pushControl = null;

let pushButton = null;

let pushStatus = null;


// ============================================================
// BACK BUTTON
// ============================================================

if (backBtn) {

    backBtn.addEventListener(
        "click",
        () => {

            if (
                document.referrer &&
                document.referrer !==
                    window.location.href
            ) {

                window.history.back();

                return;
            }


            window.location.href =
                "dashboard.html";
        }
    );
}


// ============================================================
// CREATE PUSH CONTROL
// ============================================================

function createPushControl() {

    if (pushControl) {
        return;
    }


    const header =
        document.querySelector(
            ".header"
        );


    if (!header) {
        return;
    }


    pushControl =
        document.createElement(
            "div"
        );


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
        document.createElement(
            "button"
        );


    pushButton.id =
        "enablePushBtn";


    pushButton.type =
        "button";


    pushButton.innerHTML =
        `
        <i class="fa-solid fa-bell"></i>
        <span>Enable Push Notifications</span>
        `;


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
        document.createElement(
            "div"
        );


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


    if (
        state === "enabled"
    ) {

        pushButton.disabled =
            true;


        pushButton.style.background =
            "#16a34a";


        pushButton.innerHTML =
            `
            <i class="fa-solid fa-check"></i>
            <span>Push Notifications Enabled</span>
            `;


        setPushStatus(
            "NovaPay can now send alerts to this device.",
            "#15803d"
        );


        return;
    }


    if (
        state === "loading"
    ) {

        pushButton.disabled =
            true;


        pushButton.style.background =
            "#64748b";


        pushButton.innerHTML =
            `
            <i class="fa-solid fa-spinner fa-spin"></i>
            <span>Enabling Notifications...</span>
            `;


        setPushStatus(
            "Please wait...",
            "#64748b"
        );


        return;
    }


    if (
        state === "blocked"
    ) {

        pushButton.disabled =
            true;


        pushButton.style.background =
            "#94a3b8";


        pushButton.innerHTML =
            `
            <i class="fa-solid fa-bell-slash"></i>
            <span>Push Notifications Blocked</span>
            `;


        setPushStatus(
            "Notifications are blocked. Enable them in your browser or device settings.",
            "#b45309"
        );


        return;
    }


    if (
        state === "ios-home-screen"
    ) {

        pushButton.disabled =
            false;


        pushButton.style.background =
            "#1769ff";


        pushButton.innerHTML =
            `
            <i class="fa-solid fa-mobile-screen-button"></i>
            <span>Enable Push Notifications</span>
            `;


        setPushStatus(
            "On iPhone, add NovaPay to your Home Screen and open it there before enabling notifications.",
            "#475569"
        );


        return;
    }


    if (
        state === "unsupported"
    ) {

        pushButton.disabled =
            true;


        pushButton.style.background =
            "#94a3b8";


        pushButton.innerHTML =
            `
            <i class="fa-solid fa-bell-slash"></i>
            <span>Push Not Available</span>
            `;


        setPushStatus(
            "This browser or device does not provide the required Web Push features.",
            "#b45309"
        );


        return;
    }


    pushButton.disabled =
        false;


    pushButton.style.background =
        "#1769ff";


    pushButton.innerHTML =
        `
        <i class="fa-solid fa-bell"></i>
        <span>Enable Push Notifications</span>
        `;


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
// STANDALONE / HOME SCREEN DETECTION
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
// WEB PUSH SUPPORT CHECK
// ============================================================

function isWebPushSupported() {

    const hasServiceWorker =
        "serviceWorker" in navigator;

    const hasNotification =
        "Notification" in window;

    const hasServiceWorkerRegistration =
        typeof ServiceWorkerRegistration !== "undefined";

    const hasPushManager =
        hasServiceWorkerRegistration &&
        "pushManager" in ServiceWorkerRegistration.prototype;

    console.log("NovaPay Web Push diagnostic:", {
        hasServiceWorker,
        hasNotification,
        hasServiceWorkerRegistration,
        hasPushManager,
        isIOS: isIOSDevice(),
        isStandalone: isStandaloneWebApp()
    });

    if (!hasServiceWorker) {
        setPushStatus(
            "Web Push check failed: Service Workers are unavailable.",
            "#b45309"
        );
        return false;
    }

    if (!hasNotification) {
        setPushStatus(
            "Web Push check failed: Notifications API is unavailable.",
            "#b45309"
        );
        return false;
    }

    if (!hasServiceWorkerRegistration) {
        setPushStatus(
            "Web Push check failed: Service Worker Registration is unavailable.",
            "#b45309"
        );
        return false;
    }

    if (!hasPushManager) {
        setPushStatus(
            "Web Push check failed: Push Manager is unavailable in this Home Screen app.",
            "#b45309"
        );
        return false;
    }

    return true;
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

            nextCursor = null;

            hasMore = false;

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
         * Do not request permission
         * automatically.
         *
         * iPhone requires the permission
         * request to happen after a direct
         * user action.
         *
         * If permission has already been
         * granted, we can restore the
         * existing subscription silently.
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

            nextCursor = null;

            hasMore = false;
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
                        item =>
                            item.id
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

    if (!currentUser) {
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
     * iPhone/iPad Web Push requires
     * NovaPay to be running as a
     * Home Screen web app.
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


    /*
     * Check native browser APIs.
     *
     * This intentionally does NOT use
     * Firebase Messaging isSupported().
     */

    if (
        !isWebPushSupported()
    ) {

        updatePushUI(
            "unsupported"
        );

        return false;
    }


    pushSetupInProgress =
        true;


    updatePushUI(
        "loading"
    );


    try {

        /*
         * Register our normal Web Push
         * service worker.
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
         * Check existing permission.
         */

        let permission =
            Notification.permission;


        /*
         * Permission is requested ONLY
         * after the Enable Push button
         * is pressed.
         */

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
         * Get an existing subscription
         * if this browser already has one.
         */

        let subscription =
            await registration.pushManager
                .getSubscription();


        /*
         * If there is no subscription,
         * create one using NovaPay's
         * VAPID public key.
         */

        if (!subscription) {

            const publicKey =
                await getWebPushPublicKey();


            if (!publicKey) {

                throw new Error(
                    "NovaPay Web Push public key is unavailable."
                );
            }


            const applicationServerKey =
                urlBase64ToUint8Array(
                    publicKey
                );


            subscription =
                await registration.pushManager
                    .subscribe({

                        userVisibleOnly:
                            true,

                        applicationServerKey

                    });
        }


        /*
         * Send the browser subscription
         * to NovaPay backend.
         */

        const registered =
            await registerPushSubscription(
                subscription
            );


        if (!registered) {

            throw new Error(
                "NovaPay could not register this browser for push notifications."
            );
        }


        pushSetupCompleted =
            true;


        updatePushUI(
            "enabled"
        );


        return true;


    } catch (error) {

        console.error(
            "NovaPay Web Push setup error:",
            error
        );


        const message =
            String(
                error?.message ||
                ""
            ).toLowerCase();


        if (
            message.includes(
                "permission"
            ) &&
            message.includes(
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
// GET WEB PUSH PUBLIC KEY
// ============================================================

async function getWebPushPublicKey() {

    if (!currentUser) {
        return null;
    }


    try {

        const idToken =
            await currentUser.getIdToken();


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

        } catch {

            result = null;
        }


        if (!response.ok) {

            console.error(
                "NovaPay Web Push public key request failed:",
                result
            );

            return null;
        }


        const publicKey =
            String(
                result?.publicKey ||
                ""
            ).trim();


        if (!publicKey) {

            console.error(
                "NovaPay returned an empty Web Push public key."
            );

            return null;
        }


        return publicKey;


    } catch (error) {

        console.error(
            "NovaPay Web Push public key error:",
            error
        );


        return null;
    }
}


// ============================================================
// REGISTER WEB PUSH SUBSCRIPTION
// ============================================================

async function registerPushSubscription(
    subscription
) {

    if (
        !currentUser ||
        !subscription
    ) {
        return false;
    }


    try {

        const idToken =
            await currentUser.getIdToken();


        const subscriptionJSON =
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

                    body:
                        JSON.stringify({
                            subscription:
                                subscriptionJSON,

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

            result = null;
        }


        if (!response.ok) {

            console.error(
                "NovaPay push subscription registration failed:",
                result
            );

            return false;
        }


        if (
            result &&
            result.success === false
        ) {

            console.error(
                "NovaPay push subscription registration failed:",
                result
            );

            return false;
        }


        console.log(
            "NovaPay Web Push subscription registered."
        );


        return true;


    } catch (error) {

        console.error(
            "NovaPay Web Push subscription request error:",
            error
        );


        return false;
    }
}


// ============================================================
// REMOVE WEB PUSH SUBSCRIPTION
// ============================================================

async function removePushSubscription(
    subscription
) {

    if (
        !currentUser ||
        !subscription
    ) {
        return false;
    }


    try {

        const idToken =
            await currentUser.getIdToken();


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

                    body:
                        JSON.stringify({
                            subscription:
                                subscription.toJSON()
                        })
                }
            );


        if (!response.ok) {

            return false;
        }


        return true;


    } catch (error) {

        console.error(
            "NovaPay remove Web Push subscription error:",
            error
        );


        return false;
    }
}


// ============================================================
// BASE64URL → UINT8ARRAY
// ============================================================

function urlBase64ToUint8Array(
    base64String
) {

    const padding =
        "=".repeat(
            (
                4 -
                (
                    base64String.length %
                    4
                )
            ) % 4
        );


    const base64 =
        (
            base64String
                .replace(
                    /-/g,
                    "+"
                )
                .replace(
                    /_/g,
                    "/"
                ) +
            padding
        );


    const rawData =
        window.atob(
            base64
        );


    const outputArray =
        new Uint8Array(
            rawData.length
        );


    for (
        let index = 0;
        index < rawData.length;
        index++
    ) {

        outputArray[index] =
            rawData.charCodeAt(
                index
            );
    }


    return outputArray;
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
// END OF PART 1
// ============================================================
// ==============================
// NOVAPAY NOTIFICATIONS.JS
// PART 2 OF 2
// ==============================


// ---------------------------------
// Notification read state
// ---------------------------------

function isNotificationRead(notification) {
    return notification?.isRead === true || notification?.read === true;
}


// ---------------------------------
// Mark one notification as read
// ---------------------------------

async function markNotificationAsRead(notificationId) {
    if (!currentUser || !notificationId) {
        return false;
    }

    try {
        const idToken = await currentUser.getIdToken();

        const response = await fetch(
            `${NOTIFICATIONS_API}/${encodeURIComponent(notificationId)}/read`,
            {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${idToken}`
                }
            }
        );

        if (!response.ok) {
            throw new Error(`Failed to mark notification as read (${response.status})`);
        }

        const notification = notifications.find(
            item => item.id === notificationId
        );

        if (notification) {
            notification.isRead = true;
            notification.read = true;
        }

        renderNotifications();

        return true;

    } catch (error) {
        console.error("NovaPay: failed to mark notification as read:", error);
        return false;
    }
}


// ---------------------------------
// Mark all notifications as read
// ---------------------------------

async function markAllNotificationsAsRead() {
    if (!currentUser) {
        return false;
    }

    try {
        const idToken = await currentUser.getIdToken();

        const response = await fetch(
            `${NOTIFICATIONS_API}/read-all`,
            {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${idToken}`
                }
            }
        );

        if (!response.ok) {
            throw new Error(`Failed to mark all notifications as read (${response.status})`);
        }

        notifications.forEach(notification => {
            notification.isRead = true;
            notification.read = true;
        });

        renderNotifications();

        return true;

    } catch (error) {
        console.error("NovaPay: failed to mark all notifications as read:", error);
        return false;
    }
}


// ---------------------------------
// Mark-all button
// ---------------------------------

function setupMarkAllButton() {
    let button = document.getElementById("markAllReadBtn");

    if (!button) {
        button = document.createElement("button");
        button.id = "markAllReadBtn";
        button.type = "button";
        button.className = "mark-all-btn";
        button.textContent = "Mark all as read";

        const header = document.querySelector(".header");

        if (header) {
            header.appendChild(button);
        }
    }

    button.addEventListener("click", async () => {
        if (!currentUser) {
            return;
        }

        button.disabled = true;
        button.textContent = "Marking...";

        const success = await markAllNotificationsAsRead();

        button.disabled = false;
        button.textContent = "Mark all as read";

        if (!success) {
            button.textContent = "Try again";

            setTimeout(() => {
                button.textContent = "Mark all as read";
            }, 2000);
        }
    });

    updateMarkAllButton();
}


// ---------------------------------
// Update mark-all button visibility
// ---------------------------------

function updateMarkAllButton() {
    const button = document.getElementById("markAllReadBtn");

    if (!button) {
        return;
    }

    const unreadExists = notifications.some(
        notification => !isNotificationRead(notification)
    );

    button.style.display = unreadExists ? "inline-flex" : "none";
}


// ---------------------------------
// Search
// ---------------------------------

function setupSearch() {
    const searchInput = document.getElementById("searchInput");

    if (!searchInput) {
        return;
    }

    searchInput.addEventListener("input", event => {
        currentSearch = event.target.value.trim().toLowerCase();

        renderNotifications();
    });
}


// ---------------------------------
// Tabs
// ---------------------------------

function setupTabs() {
    const tabs = document.querySelectorAll(".tab");

    if (!tabs.length) {
        return;
    }

    tabs.forEach(tab => {
        tab.addEventListener("click", () => {
            tabs.forEach(item => {
                item.classList.remove("active");
            });

            tab.classList.add("active");

            currentTab = tab.textContent.trim().toLowerCase();

            renderNotifications();
        });
    });
}


// ---------------------------------
// Notification category
// ---------------------------------

function getNotificationCategory(notification) {
    const type = String(
        notification?.type ||
        notification?.data?.type ||
        ""
    ).toLowerCase();

    const serviceTypes = [
        "airtime",
        "data",
        "electricity",
        "tv",
        "payment",
        "wallet",
        "add_money"
    ];

    const transactionTypes = [
        "transaction",
        "failed",
        "reversed",
        "refund"
    ];

    const novaPayTypes = [
        "security",
        "account",
        "promotion",
        "system"
    ];

    if (transactionTypes.includes(type)) {
        return "transactions";
    }

    if (serviceTypes.includes(type)) {
        return "services";
    }

    if (novaPayTypes.includes(type)) {
        return "novapay";
    }

    return "novapay";
}


// ---------------------------------
// Filter notifications
// ---------------------------------

function getFilteredNotifications() {
    let result = [...notifications];

    if (currentTab === "transactions") {
        result = result.filter(notification => {
            return getNotificationCategory(notification) === "transactions";
        });
    }

    if (currentTab === "services") {
        result = result.filter(notification => {
            return getNotificationCategory(notification) === "services";
        });
    }

    if (currentTab === "novapay") {
        result = result.filter(notification => {
            return getNotificationCategory(notification) === "novapay";
        });
    }

    if (currentSearch) {
        result = result.filter(notification => {
            const title = String(notification?.title || "").toLowerCase();
            const body = String(
                notification?.body ||
                notification?.message ||
                ""
            ).toLowerCase();

            const type = String(notification?.type || "").toLowerCase();

            return (
                title.includes(currentSearch) ||
                body.includes(currentSearch) ||
                type.includes(currentSearch)
            );
        });
    }

    return result;
}


// ---------------------------------
// Render notifications
// ---------------------------------

function renderNotifications() {
    const notificationList = document.getElementById("notificationList");
    const emptyState = document.getElementById("emptyState");

    if (!notificationList) {
        return;
    }

    const filteredNotifications = getFilteredNotifications();

    notificationList.innerHTML = "";

    if (!filteredNotifications.length) {
        notificationList.style.display = "none";

        if (emptyState) {
            emptyState.style.display = "flex";
        }

        updateMarkAllButton();
        return;
    }

    notificationList.style.display = "flex";

    if (emptyState) {
        emptyState.style.display = "none";
    }

    filteredNotifications.forEach(notification => {
        const card = createNotificationCard(notification);

        notificationList.appendChild(card);
    });

    updateMarkAllButton();
}


// ---------------------------------
// Create notification card
// ---------------------------------

function createNotificationCard(notification) {
    const card = document.createElement("article");

    card.className = "notification-card";

    if (!isNotificationRead(notification)) {
        card.classList.add("unread");
    }

    card.dataset.notificationId = notification.id || "";

    const iconWrapper = document.createElement("div");

    iconWrapper.className = "notification-icon";

    const icon = document.createElement("i");

    icon.className = getNotificationIcon(notification);

    iconWrapper.appendChild(icon);


    const content = document.createElement("div");

    content.className = "notification-content";


    const title = document.createElement("h3");

    title.className = "notification-title";

    title.textContent =
        notification.title ||
        "NovaPay Notification";


    const message = document.createElement("p");

    message.className = "notification-message";

    message.textContent =
        notification.body ||
        notification.message ||
        "You have a new NovaPay notification.";


    const footer = document.createElement("div");

    footer.className = "notification-footer";


    const time = document.createElement("span");

    time.className = "notification-time";

    time.textContent = formatNotificationTime(
        notification.createdAt ||
        notification.timestamp ||
        notification.created_at
    );


    footer.appendChild(time);


    if (!isNotificationRead(notification)) {
        const unreadLabel = document.createElement("span");

        unreadLabel.className = "unread-label";

        unreadLabel.textContent = "New";

        footer.appendChild(unreadLabel);
    }


    content.appendChild(title);
    content.appendChild(message);
    content.appendChild(footer);


    card.appendChild(iconWrapper);
    card.appendChild(content);


    card.addEventListener("click", async () => {
        if (!isNotificationRead(notification)) {
            await markNotificationAsRead(notification.id);
        }

        openNotificationDestination(notification);
    });


    return card;
}


// ---------------------------------
// Notification icons
// ---------------------------------

function getNotificationIcon(notification) {
    const type = String(
        notification?.type ||
        notification?.data?.type ||
        ""
    ).toLowerCase();

    const iconMap = {
        airtime: "fa-solid fa-mobile-screen-button",
        data: "fa-solid fa-wifi",
        electricity: "fa-solid fa-bolt",
        tv: "fa-solid fa-tv",
        add_money: "fa-solid fa-wallet",

        payment: "fa-solid fa-credit-card",
        wallet: "fa-solid fa-wallet",

        transaction: "fa-solid fa-arrow-right-arrow-left",
        failed: "fa-solid fa-circle-exclamation",
        reversed: "fa-solid fa-rotate-left",
        refund: "fa-solid fa-money-bill-transfer",

        security: "fa-solid fa-shield-halved",
        account: "fa-solid fa-user",
        promotion: "fa-solid fa-gift",
        system: "fa-solid fa-bell"
    };

    return iconMap[type] || "fa-regular fa-bell";
}


// ---------------------------------
// Open notification destination
// ---------------------------------

function openNotificationDestination(notification) {
    const data = notification?.data || {};

    const possibleUrls = [
        data.url,
        data.link,
        notification?.url,
        notification?.link
    ];

    const destination = possibleUrls.find(
        value => typeof value === "string" && value.trim()
    );

    if (!destination) {
        return;
    }

    try {
        const url = new URL(destination, window.location.origin);

        if (url.origin !== window.location.origin) {
            return;
        }

        window.location.href = url.href;

    } catch (error) {
        console.error(
            "NovaPay: invalid notification destination:",
            error
        );
    }
}


// ---------------------------------
// Notification timestamp
// ---------------------------------

function formatNotificationTime(value) {
    if (!value) {
        return "Just now";
    }

    let date;

    if (
        typeof value === "object" &&
        typeof value.toDate === "function"
    ) {
        date = value.toDate();
    } else if (
        typeof value === "object" &&
        typeof value.seconds === "number"
    ) {
        date = new Date(value.seconds * 1000);
    } else {
        date = new Date(value);
    }

    if (Number.isNaN(date.getTime())) {
        return "Just now";
    }

    const now = new Date();

    const difference = now.getTime() - date.getTime();

    if (difference < 0) {
        return formatExactDate(date);
    }

    const seconds = Math.floor(difference / 1000);

    if (seconds < 60) {
        return "Just now";
    }

    const minutes = Math.floor(seconds / 60);

    if (minutes < 60) {
        return `${minutes}m ago`;
    }

    const hours = Math.floor(minutes / 60);

    if (hours < 24) {
        return `${hours}h ago`;
    }

    const days = Math.floor(hours / 24);

    if (days < 7) {
        return `${days}d ago`;
    }

    return formatExactDate(date);
}


// ---------------------------------
// Exact date
// ---------------------------------

function formatExactDate(date) {
    return new Intl.DateTimeFormat(
        undefined,
        {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit"
        }
    ).format(date);
}


// ---------------------------------
// Load more button
// ---------------------------------

function setupLoadMore() {
    let button = document.getElementById("loadMoreNotifications");

    if (!button) {
        button = document.createElement("button");

        button.id = "loadMoreNotifications";
        button.type = "button";
        button.className = "load-more-btn";
        button.textContent = "Load more";

        const page = document.querySelector(".page");

        if (page) {
            page.appendChild(button);
        }
    }

    button.addEventListener("click", async () => {
        if (!hasMore || loading) {
            return;
        }

        button.disabled = true;
        button.textContent = "Loading...";

        await loadNotifications(true);

        button.disabled = false;

        updateLoadMoreButton();
    });

    updateLoadMoreButton();
}


// ---------------------------------
// Update load-more button
// ---------------------------------

function updateLoadMoreButton() {
    const button = document.getElementById(
        "loadMoreNotifications"
    );

    if (!button) {
        return;
    }

    button.style.display = hasMore ? "inline-flex" : "none";
}


// ---------------------------------
// URL notification handling
// ---------------------------------

function openNotificationFromURL() {
    const params = new URLSearchParams(
        window.location.search
    );

    const notificationId =
        params.get("notificationId");

    if (!notificationId) {
        return;
    }

    const notification = notifications.find(
        item => item.id === notificationId
    );

    if (!notification) {
        return;
    }

    const card = document.querySelector(
        `[data-notification-id="${CSS.escape(notificationId)}"]`
    );

    if (!card) {
        return;
    }

    card.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });

    card.classList.add("notification-highlight");

    setTimeout(() => {
        card.classList.remove("notification-highlight");
    }, 2500);

    if (!isNotificationRead(notification)) {
        markNotificationAsRead(notificationId);
    }
}


// ---------------------------------
// Service worker message listener
// ---------------------------------

function setupServiceWorkerMessages() {
    if (!("serviceWorker" in navigator)) {
        return;
    }

    navigator.serviceWorker.addEventListener(
        "message",
        event => {
            if (
                event.data &&
                event.data.type === "NOVAPAY_PUSH"
            ) {
                loadNotifications(true);
            }
        }
    );
}


// ---------------------------------
// Refresh notifications when page
// becomes visible again
// ---------------------------------

function setupVisibilityRefresh() {
    document.addEventListener(
        "visibilitychange",
        () => {
            if (
                document.visibilityState === "visible" &&
                currentUser
            ) {
                loadNotifications(true);
            }
        }
    );
}


// ---------------------------------
// Automatic in-app refresh
// ---------------------------------

function setupNotificationPolling() {
    setInterval(() => {
        if (
            currentUser &&
            document.visibilityState === "visible"
        ) {
            loadNotifications(true);
        }
    }, 30000);
}


// ---------------------------------
// Reset push state when user logs out
// ---------------------------------

onAuthStateChanged(auth, user => {
    if (!user) {
        pushSetupCompleted = false;
        pushSetupInProgress = false;
    }
});


// ---------------------------------
// Startup
// ---------------------------------

function initializeNotificationsPage() {
    setupSearch();
    setupTabs();
    setupMarkAllButton();
    setupLoadMore();
    setupServiceWorkerMessages();
    setupVisibilityRefresh();
    setupNotificationPolling();

    renderNotifications();

    /*
     * The authentication observer in Part 1
     * loads the user's notifications.
     *
     * Give that request time to finish before
     * attempting to open a notification from
     * the URL.
     */
    let attempts = 0;

    const urlTimer = setInterval(() => {
        attempts += 1;

        if (notifications.length > 0) {
            openNotificationFromURL();
            clearInterval(urlTimer);
            return;
        }

        if (attempts >= 20) {
            clearInterval(urlTimer);
        }
    }, 500);
}


// ---------------------------------
// Start
// ---------------------------------

if (document.readyState === "loading") {
    document.addEventListener(
        "DOMContentLoaded",
        initializeNotificationsPage
    );
} else {
    initializeNotificationsPage();
}


// END OF PART 2