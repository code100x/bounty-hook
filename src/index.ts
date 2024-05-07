import { Hono } from 'hono';
import { webhookHandler } from './middleware';

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

export default app;
