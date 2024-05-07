import axios from "axios";
import { EmbedBuilder, WebhookClient } from 'discord.js'

type sendBountyTypes = {
    title: string;
    description: string;
    avatarUrl: string;
    prLink: string;
  };
const discordWebHookUrl =process.env.DISCORD_WEBHOOK_URL!
console.log(discordWebHookUrl)
export const webhookClient = new WebhookClient({
url: discordWebHookUrl,
});

export const extractAmount = (comment: string) => {
    const bountyExtractor = /\/bounty\s+(\$?\d+|\d+\$)/;
  
    const match = comment.match(bountyExtractor);
    return match ? match[1] : null;
  };


  export const isBountyComment = (comment:string) => {
   return comment.trim().toLowerCase().startsWith('/bounty')
  }
  

  export const getOwnerId = async ({ id }: { id: number }) => {
    try {
      const endpoint = process.env.ADMIN_SERVER_URL + '/api/installation/' + id;
      const response = await axios.get(endpoint, {
        headers: {
          'x-bot-token': process.env.BOT_SECRET!,
        },
      });

      return response.data.addedById;

    } catch (error: any) {
      console.error(error);
    }
  };

  export const sendBountyMessageToDiscord = async ({
    title,
    description,
    avatarUrl,
    prLink,
  }: sendBountyTypes) => {
    const embed = new EmbedBuilder()
      .setTitle(title)
      .setDescription(description)
      .setThumbnail(avatarUrl)
      .addFields({
        name: 'PR',
        value: prLink,
      });
  
    await webhookClient.send({
      username: 'Github',
      avatarURL:
        'https://github.githubassets.com/assets/GitHub-Mark-ea2971cee799.png',
      embeds: [embed],
    });
  };

//   export const LogInGoogleDoc = async()=>{
//     const CLIENT_ID = process.env.CLIENT_ID
//     const API_KEY = process.env.API_KEY

    
//   }