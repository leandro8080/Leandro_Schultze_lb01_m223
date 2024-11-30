function autoResize(textarea) {
    textarea.style.height = "auto";
    textarea.style.height = textarea.scrollHeight + "px";
}
document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("token");
    if (!token) window.location.href = "/login";

    const tweetList = document.getElementById("tweetList");
    const feedbackText = document.getElementById("feedbackText");

    const tweetInput = document.getElementById("tweetInput");
    const postTweetButton = document.getElementById("postTweetButton");

    const getTweets = async () => {
        const response = await fetch(`/api/tweets`, {
            headers: { Authorization: `Bearer ${token}` },
        });

        if (response.status === 200) {
            const result = await response.json();
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
            const result = await response.text();
            feedbackText.innerText = result;
        }
    };

    const createTweet = async () => {
        const content = tweetInput.value;
        console.log(content);
        const response = await fetch("/api/tweets", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ content }),
        });
        const result = await response.text();
        if (response.status === 200) {
            feedbackText.classList.remove("text-red-500");
            feedbackText.classList.add("text-green-500");
            tweetInput.value = "";
            feedbackText.innerText = result;
            getTweets();
        } else {
            feedbackText.classList.remove("text-green-500");
            feedbackText.classList.add("text-red-500");
            feedbackText.innerText = result;
        }
    };

    postTweetButton.addEventListener("click", async () => {
        createTweet();
    });

    getTweets();
});
