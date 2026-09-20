
import { getProvider } from "../../_shared/providers.js";
import {
    randomBase64Url,
    sha256Base64Url,
    createPkce
} from "../../_shared/crypto.js";
import { createTransactionCookie } from "../../_shared/cookies.js";

export async function onRequestGet(context) {
    const providerName = context.params.provider;
    const provider = getProvider(providerName);

    if (!provider) {
        return new Response("Not Found", {
            status: 404
        });
    }

    const clientId = context.env[provider.clientIdEnv];
    const baseUrl = context.env.PUBLIC_BASE_URL;

    if (!clientId || !baseUrl) {
        return new Response("Server configuration error", {
            status: 500
        });
    }

    const transactionCookie = randomBase64Url(32);
    const state = randomBase64Url(32);
    const nonce = providerName === "google"
        ? randomBase64Url(32)
        : null
    ;

    const {
        codeVerifier,
        codeChallenge
    } = await createPkce();

    const idHash = await sha256Base64Url(transactionCookie);
    const stateHash = await sha256Base64Url(state);

    const expiresAt =
        Math.floor(Date.now() / 1000) + 600;

    await context.env.DB
        .prepare(`
            INSERT INTO oauth_transactions (
                id_hash,
                provider,
                state_hash,
                nonce,
                code_verifier,
                expires_at
            )
            VALUES (?, ?, ?, ?, ?, ?)
        `)
        .bind(
            idHash,
            providerName,
            stateHash,
            nonce,
            codeVerifier,
            expiresAt
        )
        .run();

    const redirectUri =
        `${baseUrl}/oauth/callback/${providerName}`;

    const authorizationUrl =
        new URL(provider.authorizationEndpoint);

    authorizationUrl.searchParams.set(
        "client_id",
        clientId
    );

    authorizationUrl.searchParams.set(
        "redirect_uri",
        redirectUri
    );

    authorizationUrl.searchParams.set(
        "response_type",
        "code"
    );

    authorizationUrl.searchParams.set(
        "state",
        state
    );

    authorizationUrl.searchParams.set(
        "code_challenge",
        codeChallenge
    );

    authorizationUrl.searchParams.set(
        "code_challenge_method",
        "S256"
    );

    if (providerName === "google") {
        authorizationUrl.searchParams.set(
            "scope",
            "openid email profile"
        );

        authorizationUrl.searchParams.set(
            "nonce",
            nonce
        );
    }

    return new Response(
        null, 
        {
            status: 302,
            headers: {
                "Location": authorizationUrl.toString(),
                "Set-Cookie":
                    createTransactionCookie(transactionCookie),
                "Cache-Control": "no-store"
            }
        }
    );
}