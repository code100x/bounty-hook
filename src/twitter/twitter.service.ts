import { twitterClient } from './twitter.client';
import { twitterStore } from './twitter.store';

type TweetBountyArgs = {
  clientId: string;
  clientSecret: string;
  tweetPayload: string;
};

export async function tweetBounty({
  clientId,
  clientSecret,
  tweetPayload,
}: TweetBountyArgs) {
  const twitterClientInstance = new twitterClient(clientId, clientSecret);
  // Refreshing the access token
  const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
    await twitterClientInstance.refreshOAuth2Token(
      twitterStore.getrefreshToken()
    );

  // Storting the new Tokens
  twitterStore.setrefreshToken(newRefreshToken);
  twitterStore.setaccessToken(newAccessToken);

  // Tweeting the bounty
  const response = await twitterClientInstance.tweet(
    tweetPayload,
    newAccessToken
  );

  return response;
}
