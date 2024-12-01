function autoResize(textarea) {
    textarea.style.height = "auto";
    textarea.style.height = textarea.scrollHeight + "px";
}
document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("token");
    if (!token) window.location.href = "/login";

    const commentList = document.getElementById("commentList");
    const feedbackText = document.getElementById("feedbackText");

    const tweetInput = document.getElementById("commentInput");
    const postReplyButton = document.getElementById("postReplyButton");
    const originalPost = document.getElementById("originalPost");

    const likeButton = document.getElementById("likeButton");
    const likeText = document.getElementById("likeText");
    const dislikeButton = document.getElementById("dislikeButton");
    const dislikeText = document.getElementById("dislikeText");

    const getTweet = async () => {
        const id = window.location.pathname.split("/")[2];
        const response = await fetch(`/api/tweets?id=${id}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (response.status === 200) {
            const result = await response.json();
            originalPost.innerHTML += `<section class="flex justify-center">
                    <section
                        class="border-2 h-auto p-2 w-2/3 hover:cursor-pointer rounded-xl border-sky-500" onclick="window.location.href='/'"
                    >
                        <p class="font-bold">@${result.username}</p>
                        <p
                            class="bg-gray-950 resize-none overflow-hidden w-full h-auto border-none outline-none break-all"
                        >
                            ${result.content}
                        </p>
                    </section>
                </section>`;
        } else {
            const result = await response.text();
            feedbackText.innerText = result;
        }
    };

    const getComments = async () => {
        const postId = window.location.pathname.split("/")[2];
        const response = await fetch(`/api/comments?postId=${postId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });

        if (response.status === 200) {
            const result = await response.json();
            commentList.innerHTML = "";
            result.forEach((comment) => {
                commentList.innerHTML += `<section class="flex justify-center">
                    <section
                        class="border-2 h-auto p-2 w-2/3 rounded-xl border-sky-500""
                    >
                        <p class="font-bold">@${comment.username}</p>
                        <p
                            class="bg-gray-950 resize-none overflow-hidden w-full h-auto border-none outline-none break-all"
                        >
                            ${comment.content}
                        </p>
                    </section>
                </section>`;
            });
        } else {
            const result = await response.text();
            feedbackText.innerText = result;
        }
    };

    const createComment = async () => {
        const postId = window.location.pathname.split("/")[2];
        const content = tweetInput.value;
        const response = await fetch("/api/comments", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ content, postId }),
        });
        const result = await response.text();
        if (response.status === 200) {
            feedbackText.classList.remove("text-red-500");
            feedbackText.classList.add("text-green-500");
            tweetInput.value = "";
            feedbackText.innerText = "Reply was successfully posted";
            getComments();
        } else {
            feedbackText.classList.remove("text-green-500");
            feedbackText.classList.add("text-red-500");
            feedbackText.innerText = result;
        }
    };

    const getLikes = async () => {
        const postId = window.location.pathname.split("/")[2];
        const response = await fetch(`/api/likes?postId=${postId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });

        if (response.status === 200) {
            const result = await response.json();
            likeText.innerText = result.likeAmount;
            dislikeText.innerText = result.dislikeAmount;
            if (result.hasLikedWith === true) {
                likeButton.classList.add("text-sky-600");
                likeButton.classList.remove("text-white");
                dislikeButton.classList.remove("text-sky-600");
                dislikeButton.classList.add("text-white");
            } else if (result.hasLikedWith === false) {
                dislikeButton.classList.add("text-sky-600");
                dislikeButton.classList.remove("text-white");
                likeButton.classList.remove("text-sky-600");
                likeButton.classList.add("text-white");
            } else {
                likeButton.classList.remove("text-sky-600");
                likeButton.classList.add("text-white");
                dislikeButton.classList.remove("text-sky-600");
                dislikeButton.classList.add("text-white");
            }
        } else {
            const result = await response.text();
            feedbackText.innerText = result;
        }
    };

    const setLike = async (isPositive) => {
        const postId = window.location.pathname.split("/")[2];
        const response = await fetch("/api/likes", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ postId, isPositive }),
        });

        if (response.status === 200) getLikes();
        else {
            const result = await response.text();
            feedbackText.innerText = result;
        }
    };

    postReplyButton.addEventListener("click", async () => {
        createComment();
    });

    tweetInput.addEventListener("keydown", async (event) => {
        if (event.key === "Enter") {
            event.preventDefault();
            createComment();
        }
    });

    likeButton.addEventListener("click", async () => {
        setLike(true);
    });

    dislikeButton.addEventListener("click", async () => {
        setLike(false);
    });

    getTweet();
    getComments();
    getLikes();
});
