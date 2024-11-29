document.addEventListener("DOMContentLoaded", () => {
    const usernameInput = document.getElementById("usernameInput");
    const passwordInput = document.getElementById("passwordInput");
    const loginInput = document.getElementById("loginButton");
    const feedbackText = document.getElementById("feedbackText");

    const login = async () => {
        const username = usernameInput.value;
        const password = passwordInput.value;
        const response = await fetch("/api/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ username, password }),
        });

        const result = await response.text();
        if (response.status === 200) {
            localStorage.setItem("token", result);
            window.location.href = "/";
        } else {
            feedbackText.innerText = result;
        }
    };

    loginButton.addEventListener("click", async () => {
        login();
    });

    usernameInput.addEventListener("keydown", async (event) => {
        if (event.key === "Enter") login();
    });

    passwordInput.addEventListener("keydown", async (event) => {
        if (event.key === "Enter") login();
    });
});
