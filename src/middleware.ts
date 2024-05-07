import { createFactory } from 'hono/factory';
import { extractAmount, hexToBytes, isBountyComment } from './utils';

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

    if (!equal) return c.set('error', 'unauthorized');

    return await next();
  } catch (e) {
    console.log(e);
    c.set('error', 'unauthorized');
  }
});

export const webhookHandler = factory.createHandlers(
  checkGhSignature,
  async (c) => {
    const adminUsernames: string[] = c.env.ADMIN_USERNAMES.split(',');
    if (c.var.error) return c.status(401);

    const body = await c.req.json();
    const username = body.sender.login;
    const message = body.comment.body;
    const author = body.issue.user.login;

    if (
      !isBountyComment(message) ||
      adminUsernames.find((adminUsername) => adminUsername === username)
    ) {
      return c.status(200);
    }

    // TODO Add the bounty to google sheet
    const bountyAmount = extractAmount(message);
    console.log(username, bountyAmount, author);

    return c.json({ message: 'Webhook received' });
  }
);
