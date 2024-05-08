import { Hono } from 'hono';
import {
  settingUpTwitter,
  twitterOauth2CallbackHandler,
  webhookHandler,
} from './middleware';

type Bindings = {
  GITHUB_WEBHOOK_SECRET: string;
  ADMIN_USERNAMES: string;
  Variables: {
    error: boolean;
  };
};

const app = new Hono<{ Bindings: Bindings }>();

app.get('/', (c) => {
  console.log(c.env.GITHUB_WEBHOOK_SECRET);
  return c.text('Hello Hono!');
});

app.post('/webhook', ...webhookHandler);
// Use the twitter-setup and twitter-callback routes to set up the Twitter OAuth2 flow
app.get('/twitter-setup', ...settingUpTwitter);
app.get('/twitter-callback', ...twitterOauth2CallbackHandler);

export default app;
