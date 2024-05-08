import { createFactory } from 'hono/factory';
import { extractAmount, hexToBytes, isBountyComment } from './utils';
import { addBountyToNotion } from './notion';
import { tweetBounty, twitterStore, twitterClient } from './twitter';

const encoder = new TextEncoder();

const factory = createFactory();

// Check if the request is coming from GitHub webhook
export const checkGhSignature = factory.createMiddleware(async (c, next) => {
  try {
    const ghWebhookSecret = c.env.GITHUB_WEBHOOK_SECRET;
    const sigHex = c.req.header()['x-hub-signature-256'].split('=')[1];
    const algorithm = { name: 'HMAC', hash: { name: 'SHA-256' } };
    const keyBytes = encoder.encode(ghWebhookSecret);
    const extractable = false;
    const key = await crypto.subtle.importKey(
      'raw',
      keyBytes,
      algorithm,
      extractable,
      ['sign', 'verify']
    );
    const sigBytes = hexToBytes(sigHex);
    const dataBytes = encoder.encode(JSON.stringify(await c.req.json()));
    const equal = await crypto.subtle.verify(
      algorithm.name,
      key,
      sigBytes,
      dataBytes
    );

    if (!equal) c.set('error', 'unauthorized');

    return await next();
  } catch (e) {
    console.log(e);
    c.set('error', 'unauthorized');
    return await next();
  }
});

export const webhookHandler = factory.createHandlers(
  checkGhSignature,
  async (c) => {
    try {
      const adminUsernames: string[] = c.env.ADMIN_USERNAMES.split(',');
      const notionDatabaseId = c.env.NOTION_DATABASE_ID;
      const notionApiKey = c.env.NOTION_API_KEY;
      if (c.var.error) return c.status(401);

      const body = await c.req.json();
      const username = body.sender.login;
      const message = body.comment.body;
      const author = body.issue.user.login;

      if (
        !isBountyComment(message) ||
        !adminUsernames.find((adminUsername) => adminUsername === username)
      ) {
        c.status(200);
        return c.json({ message: 'Not a bounty comment' });
      }

      const bountyAmount = extractAmount(message);
      if (!bountyAmount) return c.status(200);

      await addBountyToNotion({
        username: author,
        amount: bountyAmount,
        notion: {
          apiKey: notionApiKey,
          databaseId: notionDatabaseId,
        },
      });

      // Tweet Payload
      const tweetPayload = `Contrulations to the user ${author} for winning a bounty of ${bountyAmount}! 🎉🎉🎉 #bounty #winner`;
      // Making a tweet with the bounty amount
      const response = await tweetBounty({
        clientId: c.env.TWITTER_CLIENT_API_KEY,
        clientSecret: c.env.TWITTER_CLIENT_API_SECRET,
        tweetPayload,
      });
      if (!response.data) {
        return c.json({ message: 'Error in tweeting' });
      }

      return c.json({ message: 'Webhook received' });
    } catch (e) {
      console.log(e);
      c.status(200);
      return c.json({ message: 'Unauthorized' });
    }
  }
);

/**
 * This handler is used to set up the Twitter oauth2 flow and generate the oauth2 URL
 * @query callbackUrl The callback URL to redirect after the oauth2 flow
 */
export const settingUpTwitter = factory.createHandlers(async (c) => {
  // Generating oauth2 URL
  const { callbackUrl } = c.req.query();
  twitterStore.setcallbackUrl(callbackUrl); // storing this for later use

  const twitterClientInstance = new twitterClient(
    c.env.TWITTER_CLIENT_API_KEY,
    c.env.TWITTER_CLIENT_API_SECRET
  );

  // Generating the oauth2 URL
  const { url, codeVerifier, state } =
    await twitterClientInstance.generateOAuth2AuthLink({
      callbackUrl: callbackUrl,
      state: 'state',
      codeChallenge: 'challenge',
      code_challenge_method: 'plain',
      scope: ['tweet.read', 'tweet.write', 'users.read', 'offline.access'],
    });

  // storing this for later use
  twitterStore.setcodeVerifier(codeVerifier);
  twitterStore.setstate(state);

  return c.redirect(url);
});

/**
 * This handler is used to handle the callback from the Twitter oauth2 flow
 * and store the access token and refresh token
 * @query code The code returned from the oauth2 flow comes from the Twitter
 * @query state The state parameter for CSRF protection comes from the Twitter
 */
export const twitterOauth2CallbackHandler = factory.createHandlers(
  async (c) => {
    // Handling Twitter oauth2 callback
    const { code, state } = c.req.query();

    // Checking if the state is same as the one we stored earlier otherwise return 401
    if (state !== twitterStore.getstate()) {
      return c.status(401);
    }

    const twitterClientInstance = new twitterClient(
      c.env.TWITTER_CLIENT_API_KEY,
      c.env.TWITTER_CLIENT_API_SECRET
    );

    // Now passing the code,callbackUrl and codeVerifier to loginWithOauth2 method
    // to get the access token and refresh token
    const { accessToken, refreshToken } =
      await twitterClientInstance.loginWithOauth2({
        code: code,
        codeVerifier: twitterStore.getcodeVerifier(),
        redirectUri: twitterStore.getcallbackUrl(),
      });

    // If the access token or refresh token is not present return 401
    if (!accessToken || !refreshToken) return c.status(401);

    // Storing the access token and refresh token
    twitterStore.setaccessToken(accessToken);
    twitterStore.setrefreshToken(refreshToken);

    return c.json({ message: 'Twitter authenticated' });
  }
);
