
interface DiscordData {
    username: string;
    amount: string;
    pr: string;
    date: string;
    discordWh: string;
    avatar: string
}

export default async function addBountyToDiscord({
    username,
    amount,
    pr,
    date,
    discordWh,
    avatar
}: DiscordData) {
    const body = {
        content: 'Hello @everyone',
        tts: false,
        color: 'white',
        avatar_url: "https://d2szwvl7yo497w.cloudfront.net/courseThumbnails/main.png",
        embeds: [
            {
                title: `Congratulations to ${username} 🎉🎉`,
                description: `**Username : ** ${username}\n**Amount : ** ${amount}\n**PR : ** ${pr}\n**Date:** ${date}`,
                image: {
                    url: avatar,
                },
            },
        ],
    };

    try {
        const res = await fetch(`${discordWh}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body)
        });

        // const respData = await res.json();
        console.log(res);
        // console.log(respData);
    } catch (error) {
        console.log(error);
    }
};