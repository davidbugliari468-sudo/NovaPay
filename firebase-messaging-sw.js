/* =========================================================
   NOVAPAY — FIREBASE CLOUD MESSAGING SERVICE WORKER
   ---------------------------------------------------------
   Handles background push notifications for NovaPay.
   This file must remain at the frontend project root so
   the service worker has the correct scope.
   ========================================================= */

importScripts(
    "https://www.gstatic.com/firebasejs/12.2.1/firebase-app-compat.js"
);

importScripts(
    "https://www.gstatic.com/firebasejs/12.2.1/firebase-messaging-compat.js"
);


/* =========================================================
   FIREBASE CONFIGURATION
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

const messaging =
    firebase.messaging();


/* =========================================================
   BACKGROUND MESSAGE HANDLER
   ========================================================= */

messaging.onBackgroundMessage(
    (payload) => {

        console.log(
            "NovaPay background notification received:",
            payload
        );


        const notification =
            payload?.notification || {};


        const data =
            payload?.data || {};


        const title =
            notification.title ||
            "NovaPay";


        const body =
            notification.body ||
            "You have a new notification.";


        const notificationId =
            data.notificationId ||
            "";


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


        self.registration.showNotification(
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
    (event) => {

        event.notification.close();


        const notificationData =
            event.notification?.data ||
            {};


        const notificationId =
            notificationData.notificationId ||
            "";


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
                    (clientList) => {

                        for (
                            const client
                            of clientList
                        ) {

                            if (
                                "focus" in client
                            ) {

                                client.navigate(
                                    targetUrl
                                );

                                return client.focus();

                            }

                        }


                        if (
                            clients.openWindow
                        ) {

                            return clients.openWindow(
                                targetUrl
                            );

                        }

                    }
                )

        );

    }
);