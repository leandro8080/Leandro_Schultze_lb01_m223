function autoResize(textarea) {
    textarea.style.height = "auto";
    textarea.style.height = textarea.scrollHeight + "px";
}
document.addEventListener("DOMContentLoaded", async () => {
    const token = localStorage.getItem("token");
    if (!token) window.location.href = "/login";

    const getUserRole = async () => {
        const response = await fetch("/api/role", {
            headers: { Authorization: `Bearer ${token}` },
        });

        const result = await response.text();
        if (response.status === 200) return result;
        return "user";
    };

    const getUserId = async () => {
        const response = await fetch("/api/userId", {
            headers: { Authorization: `Bearer ${token}` },
        });

        const result = await response.json();
        if (response.status === 200) return result.userId;
        window.location.href = "/login";
    };

    const userRole = await getUserRole();
    const userId = await getUserId();

    const commentList = document.getElementById("commentList");
    const feedbackText = document.getElementById("feedbackText");

    const tweetInput = document.getElementById("commentInput");
    const postReplyButton = document.getElementById("postReplyButton");
    const originalPost = document.getElementById("originalPost");

    const likeButton = document.getElementById("likeButton");
    const likeText = document.getElementById("likeText");
    const dislikeButton = document.getElementById("dislikeButton");
    const dislikeText = document.getElementById("dislikeText");

    const editTweet = async (newContent) => {
        const postId = window.location.pathname.split("/")[2];
        const response = await fetch("/api/tweets", {
            method: "PUT",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ postId, newContent }),
        });

        const result = await response.text();
        if (response.status == 200) {
            feedbackText.innerText = "Successfully edited tweet";
            feedbackText.classList.remove("text-red-500");
            feedbackText.classList.add("text-green-500");
        } else {
            feedbackText.classList.add("text-red-500");
            feedbackText.classList.remove("text-green-500");
            feedbackText.innerText = result;
        }
    };

    const editComment = async (commentId, newContent) => {
        const response = await fetch("/api/comments", {
            method: "PUT",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ commentId, newContent }),
        });

        const result = await response.text();
        if (response.status == 200) {
            feedbackText.innerText = "Successfully edited comment";
            feedbackText.classList.remove("text-red-500");
            feedbackText.classList.add("text-green-500");
        } else {
            feedbackText.classList.add("text-red-500");
            feedbackText.classList.remove("text-green-500");
            feedbackText.innerText = result;
        }
    };

    const deleteTweet = async () => {
        const postId = window.location.pathname.split("/")[2];
        const response = await fetch(`/api/tweets?postId=${postId}`, {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        const result = await response.text();
        if (response.status === 200) window.location.pathname = "/";
        else {
            feedbackText.innerText = result;
        }
    };

    const deleteComment = async (commentId) => {
        const response = await fetch(`/api/comments?commentId=${commentId}`, {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        const result = await response.text();
        if (response.status === 200) {
            feedbackText.innerText = "Successfully deleted comment";
            feedbackText.classList.remove("text-red-500");
            feedbackText.classList.add("text-green-500");
            await getComments();
        } else {
            feedbackText.classList.add("text-red-500");
            feedbackText.classList.remove("text-green-500");
            feedbackText.innerText = result;
        }
    };

    const getTweet = async () => {
        const id = window.location.pathname.split("/")[2];
        const response = await fetch(`/api/tweets?id=${id}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (response.status === 200) {
            const result = await response.json();
            if (result.userId === userId || userRole !== "user") {
                originalPost.innerHTML += `<section class="flex justify-center">
                <section
                    class="border-2 h-auto p-2 w-2/3 rounded-xl border-sky-500"
                >
                    <p class="font-bold">@${result.username}</p>
                    <section class="flex gap-3">
                        <textarea
                            id="editInput"
                            lang="en"
                            class="placeholder-gray-300 bg-gray-950 resize-none overflow-hidden w-full h-auto border-none outline-none"
                            placeholder="${result.content}"
                            maxlength="400"
                            rows="1"
                            oninput="autoResize(this)"
                        >${result.content}</textarea>
                        <section>
                            <section
                                class="h-full w-full flex justify-center flex-col gap-3"
                            >
                                <button
                                    id="deleteButton"
                                    class="bg-red-500 w-20 h-10 px-3 py-1 rounded-xl font-semibold text-lg hover:bg-red-600"
                                >
                                    Delete
                                </button>
                                <button
                                    id="editButton"
                                    class="bg-sky-500 w-20 h-10 px-3 py-1 rounded-xl font-semibold text-lg hover:bg-sky-600"
                                >
                                    Edit
                                </button>
                            </section>
                        </section>
                    </section>
                </section>
            </section>`;
                const editInput = document.getElementById("editInput");
                editInput.addEventListener("keydown", async (event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        const newContent = editInput.value;
                        await editTweet(newContent);
                    }
                });
                document
                    .getElementById("editButton")
                    .addEventListener("click", async () => {
                        const newContent = editInput.value;
                        await editTweet(newContent);
                    });

                document
                    .getElementById("deleteButton")
                    .addEventListener("click", async () => {
                        await deleteTweet();
                    });

                autoResize(editInput);
            } else {
                originalPost.innerHTML += `<section class="flex justify-center">
                    <section
                        class="border-2 h-auto p-2 w-2/3 rounded-xl border-sky-500"
                    >
                        <p class="font-bold">@${result.username}</p>
                        <p
                            class="bg-gray-950 resize-none overflow-hidden w-full h-auto border-none outline-none break-all"
                        >
                            ${result.content}
                        </p>
                    </section>
                </section>`;
            }
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
                if (comment.userId == userId || userRole !== "user") {
                    commentList.insertAdjacentHTML(
                        "beforeend",
                        `<section class="flex justify-center">
                    <section
                        class="border-2 h-auto p-2 w-2/3 rounded-xl border-sky-500""
                    >
                        <p class="font-bold">@${comment.username}</p>
                        <section class="flex gap-3">
                        <textarea
                            id="editCommentInput${comment.commentId}"
                            lang="en"
                            class="placeholder-gray-300 bg-gray-950 resize-none overflow-hidden w-full h-auto border-none outline-none"
                            placeholder="${comment.content}"
                            maxlength="400"
                            rows="1"
                            oninput="autoResize(this)"
                        >${comment.content}</textarea>
                        <section>
                            <section
                                class="h-full w-full flex justify-center flex-col gap-3"
                            >
                                <button
                                    id="deleteCommentButton${comment.commentId}"
                                    class="bg-red-500 w-20 h-10 px-3 py-1 rounded-xl font-semibold text-lg hover:bg-red-600"
                                >
                                    Delete
                                </button>
                                <button
                                    id="editCommentButton${comment.commentId}"
                                    class="bg-sky-500 w-20 h-10 px-3 py-1 rounded-xl font-semibold text-lg hover:bg-sky-600"
                                >
                                    Edit
                                </button>
                            </section>
                        </section>
                    </section>
                    </section>
                </section>`
                    );
                    document.getElementById(
                        `editCommentButton${comment.commentId}`
                    ).onclick = async function () {
                        const newContent = document.getElementById(
                            `editCommentInput${comment.commentId}`
                        ).value;
                        await editComment(comment.commentId, newContent);
                    };

                    document.getElementById(
                        `deleteCommentButton${comment.commentId}`
                    ).onclick = async function () {
                        await deleteComment(comment.commentId);
                    };

                    autoResize(
                        document.getElementById(
                            `editCommentInput${comment.commentId}`
                        )
                    );
                } else {
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
                }
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
        if (event.key === "Enter" && !event.shiftKey) {
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
