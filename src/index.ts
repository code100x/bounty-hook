import { Hono } from 'hono';
import {
  healthCheckHandler,
  settingUpTwitter,
  twitterOauth2CallbackHandler,
  webhookHandler,
} from './middleware';

type Bindings = {
  GITHUB_WEBHOOK_SECRET: string;
  ADMIN_USERNAMES: string;
  access_token: string;
  refresh_token: string;
  state: string;
  codeVerifier: string;
  Variables: {
    error: boolean;
  };
};

const app = new Hono<{ Bindings: Bindings }>();

app.get('/', ...healthCheckHandler);
app.post('/webhook', ...webhookHandler);
app.get('/twitter-setup', ...settingUpTwitter);
app.get('/twitter-callback', ...twitterOauth2CallbackHandler);

export default app;
