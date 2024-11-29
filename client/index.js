function autoResize(textarea) {
    textarea.style.height = "auto";
    textarea.style.height = textarea.scrollHeight + "px";
}
document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("token");
    if (!token) window.location.href = "/login";

    const tweetList = document.getElementById("tweetList");
    const feedbackText = document.getElementById("feedbackText");

    const getTweets = async () => {
        const response = await fetch(`/api/tweets`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        const result = await response.json();
        if (response.status === 200) {
            tweetList.innerHTML = "";
            result.forEach((tweet) => {
                tweetList.innerHTML += `<section class="flex justify-center">
                    <section
                        class="border-2 h-auto p-2 w-2/3 hover:cursor-pointer rounded-xl border-sky-500" onclick="window.location.href='/'"
                    >
                        <p class="font-bold">@${tweet.username}</p>
                        <p
                            class="bg-gray-950 resize-none overflow-hidden w-full h-auto border-none outline-none break-all"
                        >
                            ${tweet.content}
                        </p>
                    </section>
                </section>`;
            });
        } else {
            feedbackText.innerText = result;
        }
    };
    getTweets();
});
