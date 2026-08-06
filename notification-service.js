import { auth, db } from "./firebase.js";

import {
    collection,
    addDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

export async function createNotification({

    type,

    title,

    message

}) {

    const user = auth.currentUser;

    if (!user) return;

    try {

        await addDoc(

            collection(
                db,
                "users",
                user.uid,
                "notifications"
            ),

            {

                type,

                title,

                message,

                isRead: false,

                createdAt: serverTimestamp()

            }

        );

        console.log("✅ Notification Created");

    } catch (error) {

        console.error(

            "Notification Error:",

            error

        );

    }

}