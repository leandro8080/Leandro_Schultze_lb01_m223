document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("token");
    if (!token) window.location.href = "/login";

    const commentList = document.getElementById("commentList");
    const feedbackText = document.getElementById("feedbackText");

    const getComments = async () => {
        const response = await fetch(`/api/my-comments`, {
            headers: { Authorization: `Bearer ${token}` },
        });

        if (response.status === 200) {
            const result = await response.json();
            if (result.length > 0) {
                commentList.innerHTML = "";
                result.forEach((comment) => {
                    commentList.innerHTML += `<section class="flex justify-center">
                    <section
                        class="border-2 h-auto p-2 w-2/3 hover:cursor-pointer rounded-xl border-sky-500" onclick="window.location.href='/tweets/${comment.postId}'"
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
            }
        } else {
            const result = await response.text();
            feedbackText.innerText = result;
        }
    };

    getComments();
});
