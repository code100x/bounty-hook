import { Probot } from "probot";
import { extractAmount, isBountyComment, sendBountyMessageToDiscord } from "./utils.js";
import dotenv from 'dotenv'

export default (app: Probot) => {

  // removed await because that was a typo

  dotenv.config()
  app.on("issues.opened", async (context) => {
    const issueComment = context.issue({
      body: "Thanks for opening this issue!",
    });
     context.octokit.issues.createComment(issueComment);
  });
 
    app.on("issue_comment",async(context)=>{
      //stops the handler from running if bot comments
      if (context.payload.comment.user.type === "Bot") {
        return;
      }
      console.log("point break 1")

      const commentBody = context.payload.comment.body
      app.log.debug(commentBody)        //

      const commenter = context.payload.comment.user.login
      const isRepoOwner = context.payload.repository.owner.login === commenter
      // verifies if the comment is created 
      // const id = await getOwnerId({ id: context.payload.repository.id });
      const admin = process.env.ADMIN_USERNAME
      if(admin !== commenter) return;
      if(
        !isRepoOwner &&
        !admin?.includes(commenter)
      ) return ;

      if (!isBountyComment(commentBody)) return;

        // checking if the body is appropiaate and extracting the bounty
        const amount = extractAmount(commentBody)?.replace("$","")
  
        // if comment body is unappropiate
         if (!amount) {
          const issueComment = context.issue({
          body: `Please send a valid bounty amount @${context.payload.sender.login}. Example command to send bounty: "/bounty $300", this will send $300 to contributor. `,
        });
         context.octokit.issues.createComment(issueComment);
        return;
      }
        
        const prComment = context.issue({
          body: `Congratulations!!! @${context.payload.issue.user.login} for winning $${amount}. Visit ${process.env.CONTRIBUTOR_SERVER_URL} to claim bounty.`
        })
         context.octokit.issues.createComment(prComment)
        await sendBountyMessageToDiscord({
          title: 'Bounty Dispatch',
          avatarUrl: context.payload.sender.avatar_url,
          description: `Congratulations!!! @${context.payload.issue.user.login} for winning ${amount}`,
          prLink: context.payload.issue.url,
        });
        return
    })



    app.on("pull_request.opened",async(context)=>{
      const prComment = context.issue({body:"thanks for reviewing this PR"})
      return   context.octokit.issues.createComment(prComment)
    })
   

};
