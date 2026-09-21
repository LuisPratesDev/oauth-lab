const loadingState = document.getElementById("loading-state");
const loggedOutState = document.getElementById("logged-out-state");
const loggedInState = document.getElementById("logged-in-state");
const errorState = document.getElementById("error-state");

const errorMessage = document.getElementById("error-message");
const retryButton = document.getElementById("retry");
const logoutForm = document.getElementById("logout-form");

const userName = document.getElementById("user-name");
const userEmail = document.getElementById("user-email");
const userAvatar = document.getElementById("user-avatar");
const userProvider = document.getElementById("user-provider");

const loginButtons = document.querySelectorAll("[data-provider]");


function showState(state) {
    loadingState.hidden = state !== "loading";
    loggedOutState.hidden = state !== "logged-out";
    loggedInState.hidden = state !== "logged-in";
    errorState.hidden = state !== "error";
}


function getInitial(name) {
    if (!name) {
        return "?";
    }

    return name
        .trim()
        .charAt(0)
        .toUpperCase();
}


function getProviderName(issuer) {
    if (issuer === "https://accounts.google.com") {
        return "Google";
    }

    if (issuer === "https://github.com") {
        return "GitHub";
    }

    return "Desconhecido";
}


async function loadSession() {
    showState("loading");

    try {
        const response = await fetch("/api/me", {
            credentials: "same-origin",
            cache: "no-store"
        });

        if (response.status === 401) {
            showState("logged-out");
            return;
        }

        if (!response.ok) {
            throw new Error("Falha ao consultar a sessão.");
        }

        const user = await response.json();

        const name = user.displayName || user.email || "Usuário";

        userName.textContent = name;
        userEmail.textContent = user.email || "E-mail não informado";

        userAvatar.textContent = getInitial(name);

        userProvider.textContent =
            getProviderName(user.issuer);

        showState("logged-in");

    } catch (error) {
        console.error("Session error:", error);

        errorMessage.textContent =
            "Não foi possível consultar sua sessão.";

        showState("error");
    }
}


loginButtons.forEach((button) => {
    button.addEventListener("click", () => {

        const provider = button.dataset.provider;

        if (!provider) {
            return;
        }

        window.location.href =
            `/oauth/login/${provider}`;
    });
});


logoutForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    const logoutButton =
        document.getElementById("logout");

    logoutButton.disabled = true;
    logoutButton.textContent = "Encerrando sessão...";

    try {

        const response = await fetch("/oauth/logout", {
            method: "POST",
            credentials: "same-origin"
        });

        if (!response.ok) {
            throw new Error("Falha ao encerrar a sessão.");
        }

        await loadSession();

    } catch (error) {

        console.error("Logout error:", error);

        logoutButton.disabled = false;
        logoutButton.textContent = "Encerrar sessão";

        errorMessage.textContent =
            "Não foi possível encerrar a sessão.";

        showState("error");
    }
});


retryButton.addEventListener("click", () => {
    loadSession();
});


loadSession();