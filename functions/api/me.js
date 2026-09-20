import { getCookie } from "../_shared/cookies.js";
import { sha256Base64Url } from "../_shared/crypto.js";

export async function onRequestGet(context) {
    try {
        const sessionCookie = getCookie(
            context.request,
            "__Host-session"
        );

        if (!sessionCookie) {
            return new Response("Unauthorized", {
                status: 401,
                headers: {
                    "Cache-Control": "no-store"
                }
            });
        }

        const sessionIdHash =
            await sha256Base64Url(sessionCookie);

        const session =
            await context.env.DB
                .prepare(`
                    SELECT
                        issuer,
                        subject,
                        email,
                        display_name,
                        expires_at
                    FROM sessions
                    WHERE id_hash = ?
                `)
                .bind(sessionIdHash)
                .first();

        if (!session) {
            return new Response("Unauthorized", {
                status: 401,
                headers: {
                    "Cache-Control": "no-store"
                }
            });
        }

        const now =
            Math.floor(Date.now() / 1000);

        if (session.expires_at <= now) {
            await context.env.DB
                .prepare(`
                    DELETE FROM sessions
                    WHERE id_hash = ?
                `)
                .bind(sessionIdHash)
                .run();

            return new Response("Unauthorized", {
                status: 401,
                headers: {
                    "Cache-Control": "no-store"
                }
            });
        }

        return Response.json(
            {
                issuer: session.issuer,
                subject: session.subject,
                email: session.email,
                displayName: session.display_name
            },
            {
                status: 200,
                headers: {
                    "Cache-Control": "no-store"
                }
            }
        );

    } catch (error) {
        console.error(
            "Session lookup error:",
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