import { auth } from "./firebase.js";


// =====================================================
// NOVAPAY NOTIFICATION SERVICE
// =====================================================
//
// Frontend notification requests go through the backend.
//
// Frontend
//    ↓
// POST /api/notifications
//    ↓
// Backend authentication
//    ↓
// createNotification()
//    ↓
// Firestore
//    ↓
// FCM push notification
//
// The frontend NEVER writes notification documents
// directly to Firestore.
// =====================================================


const API_BASE_URL =
    "https://novapay-server.onrender.com";


const NOTIFICATIONS_API =
    `${API_BASE_URL}/api/notifications`;


// =====================================================
// CREATE NOTIFICATION
// =====================================================

export async function createNotification({

    type,

    title,

    message,

    body,

    data = {},

    sendPush = true

}) {

    const user =
        auth.currentUser;


    if (!user) {

        console.warn(
            "NovaPay notification: user is not authenticated."
        );

        return {

            success: false,

            error:
                "User is not authenticated."

        };

    }


    const notificationTitle =
        String(
            title ?? ""
        ).trim();


    const notificationBody =
        String(
            body ??
            message ??
            ""
        ).trim();


    const notificationType =
        String(
            type ??
            "system"
        ).trim();


    if (!notificationTitle) {

        console.warn(
            "NovaPay notification: title is required."
        );

        return {

            success: false,

            error:
                "Notification title is required."

        };

    }


    if (!notificationBody) {

        console.warn(
            "NovaPay notification: message is required."
        );

        return {

            success: false,

            error:
                "Notification message is required."

        };

    }


    try {

        const idToken =
            await user.getIdToken();


        const response =
            await fetch(
                NOTIFICATIONS_API,
                {

                    method:
                        "POST",

                    headers: {

                        "Content-Type":
                            "application/json",

                        Authorization:
                            `Bearer ${idToken}`

                    },

                    body:
                        JSON.stringify({

                            type:
                                notificationType,

                            title:
                                notificationTitle,

                            body:
                                notificationBody,

                            data:
                                data &&
                                typeof data ===
                                "object"
                                    ? data
                                    : {},

                            sendPush:
                                sendPush === true

                        })

                }
            );


        let result = null;


        try {

            result =
                await response.json();

        }

        catch {

            result = null;

        }


        if (!response.ok) {

            const errorMessage =
                result?.error ||
                result?.message ||
                `Notification request failed with status ${response.status}.`;


            console.error(
                "NovaPay notification error:",
                errorMessage
            );


            return {

                success: false,

                error:
                    errorMessage

            };

        }


        if (
            result &&
            result.success === false
        ) {

            const errorMessage =
                result.error ||
                result.message ||
                "Notification creation failed.";


            console.error(
                "NovaPay notification error:",
                errorMessage
            );


            return {

                success: false,

                error:
                    errorMessage

            };

        }


        console.log(
            "✅ NovaPay notification created."
        );


        return {

            success: true,

            ...(result &&
            typeof result ===
            "object"
                ? result
                : {})

        };

    }

    catch (error) {

        console.error(
            "NovaPay notification request error:",
            error
        );


        return {

            success: false,

            error:
                error?.message ||
                "Unable to create notification."

        };

    }

}