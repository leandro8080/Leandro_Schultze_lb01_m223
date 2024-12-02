document.addEventListener("DOMContentLoaded", () => {
    const logoutButton = document.getElementById("logoutButton");
    const feedbackText = document.getElementById("feedbackText");
    const newUsernameInput = document.getElementById("newUsernameInput");
    const newPasswordInput = document.getElementById("newPasswordInput");
    const confirmNewPasswordInput = document.getElementById(
        "confirmNewPasswordInput"
    );
    const changeUsernameButton = document.getElementById(
        "changeUsernameButton"
    );
    const changePasswordButton = document.getElementById(
        "changePasswordButton"
    );

    const token = localStorage.getItem("token");
    if (!token) window.location.href = "/login";

    const logout = async () => {
        const response = await fetch("/api/logout", {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (response.status === 200) {
            localStorage.removeItem("token");
            window.location.href = "/login";
        } else {
            feedbackText.innerText = await response.text();
        }
    };

    const changeUsername = async () => {
        const newUsername = newUsernameInput.value;
        const response = await fetch("/api/username", {
            method: "PUT",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ newUsername }),
        });

        if ((response.status = 200)) {
            feedbackText.classList.remove("text-red-500");
            feedbackText.classList.add("text-green-500");
            feedbackText.innerText = "Username got changed";
            newUsernameInput.value = "";
        } else {
            feedbackText.classList.add("text-red-500");
            feedbackText.classList.remove("text-green-500");
            feedbackText.innerText = await response.text();
        }
    };

    const changePassword = async () => {
        const newPassword = newPasswordInput.value;
        const confirmPassword = confirmNewPasswordInput.value;

        if (newPassword !== confirmPassword) {
            feedbackText.classList.add("text-red-500");
            feedbackText.classList.remove("text-green-500");
            feedbackText.innerText = "Passwords doesn't match";
        } else {
            const response = await fetch("/api/password", {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ newPassword }),
            });

            if (response.status === 200) {
                feedbackText.classList.remove("text-red-500");
                feedbackText.classList.add("text-green-500");
                feedbackText.innerText = "Password got changed";
                newPasswordInput.value = "";
                confirmNewPasswordInput.value = "";
            } else {
                feedbackText.classList.add("text-red-500");
                feedbackText.classList.remove("text-green-500");
                feedbackText.innerText = await response.text();
            }
        }
    };

    logoutButton.addEventListener("click", async () => {
        logout();
    });

    changeUsernameButton.addEventListener("click", async () => {
        changeUsername();
    });

    changePasswordButton.addEventListener("click", async () => {
        changePassword();
    });

    newUsernameInput.addEventListener("keydown", async (event) => {
        if (event.key === "Enter") changeUsername();
    });

    newPasswordInput.addEventListener("keydown", async (event) => {
        if (event.key === "Enter") changePassword();
    });

    confirmNewPasswordInput.addEventListener("keydown", async (event) => {
        if (event.key === "Enter") changePassword();
    });
});
