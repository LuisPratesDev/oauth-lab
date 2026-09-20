import {
    getCookie,
    createSessionCookie,
    clearTransactionCookie
} from "../../_shared/cookies.js";

import {
    sha256Base64Url,
    randomBase64Url
} from "../../_shared/crypto.js";

import {
    getProvider
} from "../../_shared/providers.js";

import {
    getOidcConfiguration,
    getJwks,
    findJwk,
    decodeJwt,
    verifyJwtSignature,
    validateOidcClaims
} from "../../_shared/oidc.js";

export async function onRequestGet(context) {
    try {
        const providerName = context.params.provider;
        const provider = getProvider(providerName);

        if (!provider) {
            return new Response("Not Found", {
                status: 404,
                headers: {
                    "Cache-Control": "no-store"
                }
            });
        }

        const url = new URL(context.request.url);

        const code = url.searchParams.get("code");
        const state = url.searchParams.get("state");
        const error = url.searchParams.get("error");

        if (error || !code || !state) {
            return new Response("Invalid OAuth response", {
                status: 400,
                headers: {
                    "Cache-Control": "no-store"
                }
            });
        }

        const transactionCookie = getCookie(
            context.request,
            "__Host-oauth-tx"
        );

        if (!transactionCookie) {
            return new Response("Missing OAuth transaction", {
                status: 400,
                headers: {
                    "Cache-Control": "no-store"
                }
            });
        }

        const idHash = await sha256Base64Url(
            transactionCookie
        );

        const transaction = await context.env.DB
            .prepare(`
                SELECT
                    id_hash,
                    provider,
                    state_hash,
                    nonce,
                    code_verifier,
                    expires_at
                FROM oauth_transactions
                WHERE id_hash = ?
            `)
            .bind(idHash)
            .first();

        if (!transaction) {
            return new Response("Invalid OAuth transaction", {
                status: 400,
                headers: {
                    "Cache-Control": "no-store"
                }
            });
        }

        const now = Math.floor(
            Date.now() / 1000
        );

        if (transaction.expires_at <= now) {
            return new Response("Expired OAuth transaction", {
                status: 400,
                headers: {
                    "Cache-Control": "no-store"
                }
            });
        }

        if (transaction.provider !== providerName) {
            return new Response("Invalid OAuth transaction", {
                status: 400,
                headers: {
                    "Cache-Control": "no-store"
                }
            });
        }

        const stateHash = await sha256Base64Url(state);

        if (stateHash !== transaction.state_hash) {
            return new Response("Invalid OAuth state", {
                status: 400,
                headers: {
                    "Cache-Control": "no-store"
                }
            });
        }

        await context.env.DB
            .prepare(`
                DELETE FROM oauth_transactions
                WHERE id_hash = ?
            `)
            .bind(idHash)
            .run();

        const clientId =
            context.env[provider.clientIdEnv];

        const clientSecret =
            context.env[provider.clientSecretEnv];

        const baseUrl =
            context.env.PUBLIC_BASE_URL;

        if (!clientId || !clientSecret || !baseUrl) {
            return new Response(
                "Server configuration error",
                {
                    status: 500,
                    headers: {
                        "Cache-Control": "no-store"
                    }
                }
            );
        }

        const redirectUri =
            `${baseUrl}/oauth/callback/${providerName}`;

        const tokenResponse = await fetch(
            provider.tokenEndpoint,
            {
                method: "POST",
                headers: {
                    "Content-Type":
                        "application/x-www-form-urlencoded",
                    "Accept":
                        "application/json"
                },
                body: new URLSearchParams({
                    client_id: clientId,
                    client_secret: clientSecret,
                    code,
                    redirect_uri: redirectUri,
                    grant_type:
                        "authorization_code",
                    code_verifier:
                        transaction.code_verifier
                })
            }
        );

        if (!tokenResponse.ok) {
            return new Response(
                "Token exchange failed",
                {
                    status: 400,
                    headers: {
                        "Cache-Control": "no-store"
                    }
                }
            );
        }

        const tokenData =
            await tokenResponse.json();

        let identity;
        let accessToken;

        if (providerName === "google") {
            const oidcConfiguration =
                await getOidcConfiguration();

            if (
                oidcConfiguration.issuer !==
                "https://accounts.google.com"
            ) {
                return new Response(
                    "Invalid Google OIDC issuer",
                    {
                        status: 400,
                        headers: {
                            "Cache-Control": "no-store"
                        }
                    }
                );
            }

            const idToken =
                tokenData.id_token;

            if (
                typeof idToken !== "string" ||
                idToken.length === 0
            ) {
                return new Response(
                    "Missing Google ID token",
                    {
                        status: 400,
                        headers: {
                            "Cache-Control": "no-store"
                        }
                    }
                );
            }

            const jwt = decodeJwt(idToken);

            if (jwt.header.alg !== "RS256") {
                return new Response(
                    "Invalid Google ID token algorithm",
                    {
                        status: 400,
                        headers: {
                            "Cache-Control": "no-store"
                        }
                    }
                );
            }

            if (
                typeof jwt.header.kid !== "string" ||
                jwt.header.kid.length === 0
            ) {
                return new Response(
                    "Invalid Google ID token key",
                    {
                        status: 400,
                        headers: {
                            "Cache-Control": "no-store"
                        }
                    }
                );
            }

            const jwks =
                await getJwks(
                    oidcConfiguration.jwks_uri
                );

            const jwk =
                findJwk(
                    jwks,
                    jwt.header.kid
                );

            await verifyJwtSignature(
                jwt,
                jwk
            );

            identity =
                validateOidcClaims(
                    jwt.payload,
                    {
                        clientId,
                        issuer:
                            oidcConfiguration.issuer,
                        nonce:
                            transaction.nonce
                    }
                );
        }

        if (providerName === "github") {
            accessToken =
                tokenData.access_token;

            const tokenType =
                tokenData.token_type;

            if (
                typeof accessToken !== "string" ||
                accessToken.length === 0 ||
                typeof tokenType !== "string" ||
                tokenType.toLowerCase() !== "bearer"
            ) {
                return new Response(
                    "Invalid GitHub token response",
                    {
                        status: 400,
                        headers: {
                            "Cache-Control": "no-store"
                        }
                    }
                );
            }

            const userResponse =
                await fetch(
                    "https://api.github.com/user",
                    {
                        headers: {
                            Authorization:
                                `Bearer ${accessToken}`,
                            Accept:
                                "application/vnd.github+json",
                            "X-GitHub-Api-Version":
                                "2026-03-10",
                            "User-Agent":
                                "oauth-lab"
                        }
                    }
                );

            if (userResponse.status !== 200) {
                return new Response(
                    "GitHub user request failed",
                    {
                        status: 400,
                        headers: {
                            "Cache-Control": "no-store"
                        }
                    }
                );
            }

            const user =
                await userResponse.json();

            if (
                typeof user.id !== "number" ||
                !Number.isInteger(user.id)
            ) {
                return new Response(
                    "Invalid GitHub identity",
                    {
                        status: 400,
                        headers: {
                            "Cache-Control": "no-store"
                        }
                    }
                );
            }

            identity = {
                subject: String(user.id),

                email:
                    typeof user.email === "string"
                        ? user.email
                        : null,

                displayName:
                    typeof user.name === "string"
                        ? user.name
                        : (
                            typeof user.login === "string"
                                ? user.login
                                : null
                        )
            };
        }

        if (providerName === "github") {
            const revokeResponse =
                await fetch(
                    `https://api.github.com/applications/${clientId}/grant`,
                    {
                        method: "DELETE",
                        headers: {
                            Accept:
                                "application/vnd.github+json",
                            "Content-Type":
                                "application/json",
                            "User-Agent":
                                "oauth-lab",
                            Authorization:
                                `Basic ${btoa(
                                    `${clientId}:${clientSecret}`
                                )}`
                        },
                        body: JSON.stringify({
                            access_token:
                                accessToken
                        })
                    }
                );

            if (revokeResponse.status !== 204) {
                return new Response(
                    "GitHub token revocation failed",
                    {
                        status: 400,
                        headers: {
                            "Cache-Control": "no-store"
                        }
                    }
                );
            }
        }

        if (!identity) {
            return new Response(
                "Invalid provider identity",
                {
                    status: 400,
                    headers: {
                        "Cache-Control": "no-store"
                    }
                }
            );
        }

        const sessionToken =
            randomBase64Url(32);

        const sessionIdHash =
            await sha256Base64Url(
                sessionToken
            );

        const sessionCreatedAt =
            Math.floor(
                Date.now() / 1000
            );

        const sessionExpiresAt =
            sessionCreatedAt + 28800;

        await context.env.DB
            .prepare(`
                INSERT INTO sessions (
                    id_hash,
                    issuer,
                    subject,
                    email,
                    display_name,
                    expires_at,
                    created_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `)
            .bind(
                sessionIdHash,
                provider.issuer,
                identity.subject,
                identity.email,
                identity.displayName,
                sessionExpiresAt,
                sessionCreatedAt
            )
            .run();

        return new Response(null, {
            status: 302,
            headers: [
                [
                    "Location",
                    "/"
                ],
                [
                    "Set-Cookie",
                    createSessionCookie(
                        sessionToken
                    )
                ],
                [
                    "Set-Cookie",
                    clearTransactionCookie()
                ],
                [
                    "Cache-Control",
                    "no-store"
                ]
            ]
        });

    } catch (error) {
        console.error(
            "OAuth callback error:",
            error
        );

        return new Response(
            "OAuth callback failed",
            {
                status: 500,
                headers: {
                    "Cache-Control": "no-store"
                }
            }
        );
    }
}