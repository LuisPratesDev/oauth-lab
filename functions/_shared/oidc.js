const GOOGLE_DISCOVERY_URL = "https://accounts.google.com/.well-known/openid-configuration";

function base64UrlToBytes(value) {
    const base64 = value
        .replace(/-/g, "+")
        .replace(/_/g, "/");

    const padding = "=".repeat((4 - (base64.length % 4)) % 4);
    const binary = atob(base64 + padding);

    const bytes = new Uint8Array(binary.length);

    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }

    return bytes;
}

function decodeBase64UrlJson(value) {
    const bytes = base64UrlToBytes(value);
    const text = new TextDecoder().decode(bytes);

    return JSON.parse(text);
}

export function decodeJwt(jwt) {
    const parts = jwt.split(".");

    if (parts.length !== 3) {
        throw new Error("Invalid JWT format");
    }

    return {
        header: decodeBase64UrlJson(parts[0]),
        payload: decodeBase64UrlJson(parts[1]),
        signature: base64UrlToBytes(parts[2]),
        signingInput: `${parts[0]}.${parts[1]}`
    };
}

export async function getOidcConfiguration() {
    const response = await fetch(GOOGLE_DISCOVERY_URL);

    if (!response.ok) {
        throw new Error("Failed to fetch OIDC configuration");
    }

    return await response.json();
}

export async function getJwks(jwksUri) {
    const response = await fetch(jwksUri);

    if (!response.ok) {
        throw new Error("Failed to fetch JWKS");
    }

    return await response.json();
}

export function findJwk(jwks, kid) {
    const key = jwks.keys?.find((item) => item.kid === kid);

    if (!key) {
        throw new Error("Signing key not found");
    }

    return key;
}

export async function verifyJwtSignature(jwt, jwk) {
    const key = await importSigningKey(jwk);

    const valid = await crypto.subtle.verify(
        {
            name: "RSASSA-PKCS1-v1_5"
        },
        key,
        jwt.signature,
        new TextEncoder().encode(jwt.signingInput)
    );

    if (!valid) {
        throw new Error("Invalid JWT signature");
    }

    return true;
}

export function validateOidcClaims(payload, {
    clientId,
    issuer,
    nonce,
    now = Math.floor(Date.now() / 1000)
}) {
    if (payload.iss !== issuer) {
        throw new Error("Invalid issuer");
    }

    if (payload.aud !== clientId) {
        throw new Error("Invalid audience");
    }

    if (!Number.isInteger(payload.exp) || payload.exp <= now) {
        throw new Error("Token expired");
    }

    if (!Number.isInteger(payload.iat) || payload.iat > now) {
        throw new Error("Invalid issued-at time");
    }

    if (payload.nonce !== nonce) {
        throw new Error("Invalid nonce");
    }

    if (typeof payload.sub !== "string" || payload.sub.length === 0) {
        throw new Error("Invalid subject");
    }

    return {
        subject: payload.sub,
        email: typeof payload.email === "string" ? payload.email : null,
        displayName: typeof payload.name === "string" ? payload.name : null
    };
}