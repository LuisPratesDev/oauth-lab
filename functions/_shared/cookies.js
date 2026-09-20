export function getCookie(request, name) {
    const cookieHeader = request.headers.get("Cookie");

    if (!cookieHeader) {
        return null;
    }

    const cookies = cookieHeader.split(";");

    for (const cookie of cookies) {
        const [key, ...valueParts] = cookie.trim().split("=");

        if (key === name) {
            return valueParts.join("=");
        }
    }

    return null;
}

export function createTransactionCookie(value) {
    return [
        `__Host-oauth-tx=${value}`,
        "Path=/",
        "HttpOnly",
        "Secure",
        "SameSite=Lax",
        "Max-Age=600"
    ].join("; ");
}

export function createSessionCookie(value) {
    return [
        `__Host-session=${value}`,
        "Path=/",
        "HttpOnly",
        "Secure",
        "SameSite=Strict",
        "Max-Age=28800"
    ].join("; ");
}

export function clearTransactionCookie() {
    return [
        "__Host-oauth-tx=",
        "Path=/",
        "HttpOnly",
        "Secure",
        "SameSite=Lax",
        "Max-Age=0"
    ].join("; ");
}

export function clearSessionCookie() {
    return [
        "__Host-session=",
        "Path=/",
        "HttpOnly",
        "Secure",
        "SameSite=Strict",
        "Max-Age=0"
    ].join("; ");
}