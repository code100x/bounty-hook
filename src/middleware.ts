import { createFactory } from 'hono/factory';
import {
  extractAmount,
  generateRandomString,
  hexToBytes,
  isBountyComment,
} from './utils';
import { addBountyToNotion } from './notion';
import {
  generateOAuth2AuthLink,
  loginWithOauth2,
  refreshOAuth2Token,
  tweet,
} from './twitter';

const encoder = new TextEncoder();

const factory = createFactory();

export const healthCheckHandler = factory.createHandlers(async (c) => {
  console.log(c.env.GITHUB_WEBHOOK_SECRET);
  const accessToken = await c.env.access_token.get('access_token');
  const refreshToken = await c.env.refresh_token.get('refresh_token');
  const state = await c.env.state.get('state');
  const codeVerifier = await c.env.codeVerifier.get('codeVerifier');
  console.log({ accessToken, refreshToken, state, codeVerifier });
  return c.text('Hello Hono!');
});

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
      const pr_link = body.issue.html_url;
      const createdAt = body.comment.created_at.split('T')[0];
      const repo_owner: string = body.repository.owner.login;
      const PR_Title: string = body.issue.title;

      if (
        !isBountyComment(message) ||
        body.action !== 'created' ||
        !body.issue.pull_request ||
        !adminUsernames.find((adminUsername) => adminUsername === username)
      ) {
        c.status(200);
        return c.json({ message: 'Not a bounty comment' });
      }

      const bountyAmount = extractAmount(message);
      if (!bountyAmount) return c.status(200);

      const data = {
        bountyAmount,
        author,
        pr_link,
        repo_owner,
        username,
        PR_Title,
      };
      const res = await fetch('http://localhost:3000/api/github-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        return c.json({
          message: 'Error while sending data to 100xdevs.',
        });
      }

      await addBountyToNotion({
        username: author,
        amount: bountyAmount,
        pr: pr_link,
        date: createdAt,
        notion: {
          apiKey: notionApiKey,
          databaseId: notionDatabaseId,
        },
      });

      const refreshToken = await c.env.refresh_token.get('refresh_token');

      const tweetPayload = `Contrulations to the user ${author} for winning a bounty of ${bountyAmount}! 🎉🎉🎉 #bounty #winner`;

      const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
        await refreshOAuth2Token({
          refreshToken: refreshToken,
          clientId: c.env.TWITTER_CLIENT_API_KEY,
        });

      await c.env.access_token.put('access_token', newAccessToken);
      await c.env.refresh_token.put('refresh_token', newRefreshToken);

      // Tweeting
      const response = await tweet({
        tweet: tweetPayload,
        accessToken: newAccessToken,
      });

      if (!response.data) {
        return c.json({ message: 'Error in tweeting but saved in notion.' });
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
 * Creating a oauth2 url and redirecting the user to the Twitter for authentication
 */
export const settingUpTwitter = factory.createHandlers(async (c) => {
  const state = generateRandomString(32);
  const codeVerifier = 'codeVerifier';

  const { url } = await generateOAuth2AuthLink({
    callbackUrl: c.env.TWITTER_CALLBACK_URL,
    state: state,
    codeChallenge: codeVerifier,
    code_challenge_method: 'plain',
    scope: ['tweet.read', 'tweet.write', 'users.read', 'offline.access'],
    clientId: c.env.TWITTER_CLIENT_API_KEY,
  });

  await c.env.codeVerifier.put('codeVerifier', codeVerifier);
  await c.env.state.put('state', state);

  return c.redirect(url);
});

/**
 * Handling the callback from the Twitter after the user has authenticated
 * @param code The code returned from the OAuth2 authorization.
 * @param state The state returned from the OAuth2 authorization.
 */
export const twitterOauth2CallbackHandler = factory.createHandlers(
  async (c) => {
    const { code, state } = c.req.query();

    const storedState = await c.env.state.get('state');
    // if the state is not the same as the stored state then return unauthorized
    if (state !== storedState) {
      return c.status(401);
    }

    const storedCodeVerifier = await c.env.codeVerifier.get('codeVerifier');

    const { accessToken, refreshToken } = await loginWithOauth2({
      code: code,
      codeVerifier: storedCodeVerifier,
      redirectUri: c.env.TWITTER_CALLBACK_URL,
      clientId: c.env.TWITTER_CLIENT_API_KEY,
      clientSecret: c.env.TWITTER_CLIENT_SECRET,
    });

    if (!accessToken || !refreshToken) return c.status(401);

    await c.env.access_token.put('access_token', accessToken);
    await c.env.refresh_token.put('refresh_token', refreshToken);

    return c.json({ message: 'Twitter Setup is complete.' });
  }
);
