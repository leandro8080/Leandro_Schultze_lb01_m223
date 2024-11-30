document.addEventListener("DOMContentLoaded", () => {
    const usernameInput = document.getElementById("usernameInput");
    const passwordInput = document.getElementById("passwordInput");
    const registerButton = document.getElementById("registerButton");
    const feedbackText = document.getElementById("feedbackText");
    const confirmPasswordInput = document.getElementById(
        "confirmPasswordInput"
    );

    const register = async () => {
        const username = usernameInput.value;
        const password = passwordInput.value;
        const passwordConfirm = confirmPasswordInput.value;
        if (password !== passwordConfirm) {
            feedbackText.innerText = "Passwords do not match";
            return;
        }
        const response = await fetch("/api/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ username, password }),
        });

        const result = await response.text();
        if (response.status === 200) {
            window.location.href = "/login";
        } else {
            feedbackText.innerText = result;
        }
    };

    registerButton.addEventListener("click", async () => {
        register();
    });

    usernameInput.addEventListener("keydown", async (event) => {
        if (event.key === "Enter") register();
    });

    passwordInput.addEventListener("keydown", async (event) => {
        if (event.key === "Enter") register();
    });

    confirmPasswordInput.addEventListener("keydown", async (event) => {
        if (event.key === "Enter") register();
    });
});
