import { auth } from "./firebase.js";


// =====================================================
// NOVAPAY — NOTIFICATION SERVICE
// =====================================================
//
// Frontend notification requests go through the NovaPay
// backend.
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
// Web Push / legacy FCM
//
// IMPORTANT:
// The frontend does NOT write notification documents
// directly to Firestore.
//
// Push subscription management is handled separately
// by notifications.js.
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
} = {}) {

    const user =
        auth.currentUser;


    // -------------------------------------------------
    // Authentication check
    // -------------------------------------------------

    if (!user) {

        console.warn(
            "NovaPay notification: user is not authenticated."
        );

        return {
            success: false,
            error: "User is not authenticated."
        };
    }


    // -------------------------------------------------
    // Clean notification values
    // -------------------------------------------------

    const notificationType =
        String(
            type ?? "system"
        ).trim()
        .toLowerCase();


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


    // -------------------------------------------------
    // Validate title
    // -------------------------------------------------

    if (!notificationTitle) {

        console.warn(
            "NovaPay notification: title is required."
        );

        return {
            success: false,
            error: "Notification title is required."
        };
    }


    // -------------------------------------------------
    // Validate body
    // -------------------------------------------------

    if (!notificationBody) {

        console.warn(
            "NovaPay notification: message is required."
        );

        return {
            success: false,
            error: "Notification message is required."
        };
    }


    // -------------------------------------------------
    // Prepare notification data
    // -------------------------------------------------

    let notificationData = {};

    if (
        data &&
        typeof data === "object" &&
        !Array.isArray(data)
    ) {

        notificationData = {
            ...data
        };
    }


    // -------------------------------------------------
    // Get Firebase authentication token
    // -------------------------------------------------

    try {

        const idToken =
            await user.getIdToken();


        // -------------------------------------------------
        // Send notification request to backend
        // -------------------------------------------------

        const response =
            await fetch(
                NOTIFICATIONS_API,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        "Authorization":
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
                                notificationData,

                            sendPush:
                                sendPush === true
                        })
                }
            );


        // -------------------------------------------------
        // Read backend response
        // -------------------------------------------------

        let result = null;


        try {

            result =
                await response.json();

        } catch {

            result = null;
        }


        // -------------------------------------------------
        // HTTP error
        // -------------------------------------------------

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
                error: errorMessage,
                status: response.status
            };
        }


        // -------------------------------------------------
        // Backend reported failure
        // -------------------------------------------------

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
                error: errorMessage
            };
        }


        // -------------------------------------------------
        // Success
        // -------------------------------------------------

        console.log(
            "NovaPay notification created successfully."
        );


        return {
            success: true,

            ...(result &&
            typeof result === "object"
                ? result
                : {})
        };

    } catch (error) {

        // -------------------------------------------------
        // Network / unexpected error
        // -------------------------------------------------

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


// =====================================================
// EXPORT API URL
// -----------------------------------------------------
// Useful if another frontend module needs the same
// notification API endpoint.
// =====================================================

export {
    NOTIFICATIONS_API
};