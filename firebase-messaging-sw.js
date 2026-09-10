/* =========================================================
   NOVAPAY — FIREBASE CLOUD MESSAGING SERVICE WORKER
   ---------------------------------------------------------
   Handles background push notifications for NovaPay.

   IMPORTANT:
   - Keep this file at the frontend project root.
   - Firebase SDK version matches the frontend: 10.12.5.
   ========================================================= */

importScripts(
    "https://www.gstatic.com/firebasejs/10.12.5/firebase-app-compat.js"
);

importScripts(
    "https://www.gstatic.com/firebasejs/10.12.5/firebase-messaging-compat.js"
);


/* =========================================================
   FIREBASE INITIALIZATION
   ========================================================= */

firebase.initializeApp({
    apiKey:
        "AIzaSyDNqTAQKGGW0Km4P7VIxZw9jyv8hGEiDvc",

    authDomain:
        "novapay-a0875.firebaseapp.com",

    projectId:
        "novapay-a0875",

    storageBucket:
        "novapay-a0875.firebasestorage.app",

    messagingSenderId:
        "99118341312",

    appId:
        "1:99118341312:web:9d353e75280fa36bcee125"
});


/* =========================================================
   FIREBASE MESSAGING
   ========================================================= */

const messaging = firebase.messaging();


/* =========================================================
   BACKGROUND PUSH NOTIFICATIONS
   ========================================================= */

messaging.onBackgroundMessage(
    payload => {

        console.log(
            "NovaPay background notification received:",
            payload
        );


        const notification =
            payload?.notification || {};


        const data =
            payload?.data || {};


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


        const notificationId =
            String(
                data.notificationId ||
                ""
            ).trim();


        const notificationOptions = {

            body,

            icon:
                "/icon-192.png",

            badge:
                "/icon-192.png",

            tag:
                notificationId ||
                "novapay-notification",

            data: {
                notificationId,
                ...data
            },

            requireInteraction:
                false
        };


        return self.registration.showNotification(
            title,
            notificationOptions
        );
    }
);


/* =========================================================
   NOTIFICATION CLICK
   ========================================================= */

self.addEventListener(
    "notificationclick",
    event => {

        event.notification.close();


        const notificationData =
            event.notification?.data ||
            {};


        const notificationId =
            String(
                notificationData.notificationId ||
                ""
            ).trim();


        const targetUrl =
            notificationId
                ? `/notifications.html?notificationId=${encodeURIComponent(
                    notificationId
                )}`
                : "/notifications.html";


        event.waitUntil(

            clients.matchAll({
                type:
                    "window",

                includeUncontrolled:
                    true
            })

                .then(
                    clientList => {

                        for (
                            const client
                            of clientList
                        ) {

                            if (
                                "focus" in client
                            ) {

                                return Promise
                                    .resolve(
                                        client.navigate(
                                            targetUrl
                                        )
                                    )

                                    .then(
                                        () =>
                                            client.focus()
                                    );
                            }
                        }


                        if (
                            clients.openWindow
                        ) {

                            return clients.openWindow(
                                targetUrl
                            );
                        }


                        return undefined;
                    }
                )
        );
    }
);