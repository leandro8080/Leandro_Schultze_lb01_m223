document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("token");
    if (!token) window.location.href = "/login";

    const tweetList = document.getElementById("tweetList");
    const feedbackText = document.getElementById("feedbackText");

    const getTweets = async () => {
        const response = await fetch(`/api/my-tweets`, {
            headers: { Authorization: `Bearer ${token}` },
        });

        if (response.status === 200) {
            const result = await response.json();
            if (result.length > 0) {
                tweetList.innerHTML = "";
                result.forEach((tweet) => {
                    tweetList.innerHTML += `<section class="flex justify-center">
                    <section
                        class="border-2 h-auto p-2 w-2/3 hover:cursor-pointer rounded-xl border-sky-500" onclick="window.location.href='/tweets/${tweet.id}'"
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
            }
        } else {
            const result = await response.text();
            feedbackText.innerText = result;
        }
    };

    getTweets();
});
