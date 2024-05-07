# Bounty Hook

## Steps to run locally

- git clone
- cp .examples.dev.vars .dev.vars

  populate the necessary environment variables

```
bun install
bun run dev
```

- Use a tool like [ngrok](https://ngrok.com/) to expose your local host to internet
- Add a webhook in your repo pointing to your ngrok_url/webhook

## Webhook configuration

![image](https://github.com/code100x/bounty-hook/assets/76874341/22cfc584-d832-4779-b98b-40a6f6239755)
![image](https://github.com/code100x/bounty-hook/assets/76874341/3cf824e5-61bd-459c-bdca-d95a69f767e2)

## Steps to deploy

```
bun run deploy
```
