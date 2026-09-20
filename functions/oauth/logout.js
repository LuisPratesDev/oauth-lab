import {
    getCookie,
    clearSessionCookie
} from "../_shared/cookies.js";

import {
    sha256Base64Url
} from "../_shared/crypto.js";

export async function onRequestPost(context) {
    try {
        const baseUrl =
            context.env.PUBLIC_BASE_URL;

        const origin =
            context.request.headers.get("Origin");

        if (
            !origin ||
            origin !== baseUrl
        ) {
            return new Response(
                "Invalid Origin",
                {
                    status: 403,
                    headers: {
                        "Cache-Control": "no-store"
                    }
                }
            );
        }

        const sessionCookie =
            getCookie(
                context.request,
                "__Host-session"
            );

        if (sessionCookie) {
            const sessionIdHash =
                await sha256Base64Url(
                    sessionCookie
                );

            await context.env.DB
                .prepare(`
                    DELETE FROM sessions
                    WHERE id_hash = ?
                `)
                .bind(sessionIdHash)
                .run();
        }

        return new Response(null, {
            status: 204,
            headers: [
                [
                    "Set-Cookie",
                    clearSessionCookie()
                ],
                [
                    "Cache-Control",
                    "no-store"
                ]
            ]
        });

    } catch (error) {
        console.error(
            "Logout error:",
            error
        );

        return new Response(
            "Internal Server Error",
            {
                status: 500,
                headers: {
                    "Cache-Control": "no-store"
                }
            }
        );
    }
}