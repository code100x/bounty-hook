import { createFactory } from 'hono/factory';
import { extractAmount, hexToBytes, isBountyComment } from './utils';
import { addBountyToNotion } from './notion';

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

      return c.json({ message: 'Webhook received' });
    } catch (e) {
      console.log(e);
      c.status(200);
      return c.json({ message: 'Unauthorized' });
    }
  }
);

