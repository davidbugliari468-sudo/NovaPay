/* =========================================================
   NOVAPAY — WEB PUSH SERVICE WORKER
   ========================================================= */

self.addEventListener("push", event => {

    if (!event.data) {
        return;
    }

    let payload = {};

    try {
        payload = event.data.json();
    } catch (error) {
        payload = {
            notification: {
                title: "NovaPay",
                body: event.data.text()
            }
        };
    }

    const notification = payload?.notification || {};
    const data = payload?.data || {};

    const title = String(
        notification.title ||
        data.title ||
        "NovaPay"
    ).trim();

    const body = String(
        notification.body ||
        data.body ||
        "You have a new notification."
    ).trim();

    const notificationId = String(
        data.notificationId ||
        notification?.data?.notificationId ||
        ""
    ).trim();

    const notificationType = String(
        data.type ||
        notification?.data?.type ||
        "system"
    ).trim();

    const targetUrl = notificationId
        ? `/notifications.html?notificationId=${encodeURIComponent(notificationId)}`
        : "/notifications.html";

    const notificationOptions = {
        body,

        icon: "/icon-192.png",

        badge: "/icon-192.png",

        tag:
            notificationId ||
            `novapay-${notificationType}`,

        renotify: true,

        data: {
            notificationId,
            type: notificationType,
            url: targetUrl,
            ...data
        }
    };

    event.waitUntil(

        Promise.all([

            self.registration.showNotification(
                title,
                notificationOptions
            ),

            self.clients
                .matchAll({
                    type: "window",
                    includeUncontrolled: true
                })
                .then(clientList => {

                    clientList.forEach(client => {

                        client.postMessage({
                            type: "NOVAPAY_PUSH",
                            notificationId,
                            notificationType
                        });

                    });

                })

        ])

    );
});


/* =========================================================
   NOTIFICATION CLICK
   ========================================================= */

self.addEventListener(
    "notificationclick",
    event => {

        event.notification.close();

        const data =
            event.notification?.data || {};

        const notificationId =
            String(
                data.notificationId || ""
            ).trim();

        const targetUrl =
            notificationId
                ? `/notifications.html?notificationId=${encodeURIComponent(notificationId)}`
                : "/notifications.html";

        event.waitUntil(

            clients.matchAll({
                type: "window",
                includeUncontrolled: true
            })

                .then(clientList => {

                    for (const client of clientList) {

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
                })

        );
    }
);


/* =========================================================
   SERVICE WORKER INSTALL
   ========================================================= */

self.addEventListener(
    "install",
    event => {

        event.waitUntil(
            self.skipWaiting()
        );

    }
);


/* =========================================================
   SERVICE WORKER ACTIVATE
   ========================================================= */

self.addEventListener(
    "activate",
    event => {

        event.waitUntil(
            self.clients.claim()
        );

    }
);