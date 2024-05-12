# Bounty Hook
A simple webhook handler from github. Whenever the admins in the env file wite `/bounty $xx` in any PR comment then this accepts the webhook from the github and add bounty amount, user who created PR and more details in a notion database and makes a tweet from the authorized twitter account about which user has won the bounty.  
## Steps to run locally

- git clone
- cp .examples.dev.vars .dev.vars
  populate the necessary environment variables
- Uncomment the KV Namespace for the twitter part

```
bun install
bun run dev
```

- Use a tool like [ngrok](https://ngrok.com/) to expose your local host to internet
- Add a webhook in your repo pointing to your ngrok_url/webhook
- Add the ngrok_url/twitter-callback to the enviroment variable and the in the twitter developer app settings as the callback url for using twitter part

## Webhook configuration

![image](https://github.com/code100x/bounty-hook/assets/76874341/22cfc584-d832-4779-b98b-40a6f6239755)
![image](https://github.com/code100x/bounty-hook/assets/76874341/3cf824e5-61bd-459c-bdca-d95a69f767e2)

## Twitter configuration

![image](https://github.com/shrutsureja/bounty-hook/assets/92169549/e13e8665-907e-47f4-afa3-0ee98c75bbad)
![image](https://github.com/shrutsureja/bounty-hook/assets/92169549/7d420bcb-a040-4d6f-808a-a266fc017961)


## Steps to deploy

1. Generate the clientId and clientSecret in the twitter developer app with this settings 
- App Permissions as Read and Write
- Type of app as Native App (public client)
- Call backurl `cloudflare_url/twitter-callback`
2. Also have the notion API keys.
3. add the necessary enviroment variables in the `wrangler.toml` file and uncomment them
4. run `bun run deploy` to deploy
5. Create any 4 kv_namespace in the cloudflare account 
![image](https://github.com/code100x/bounty-hook/assets/92169549/056b32e8-966d-4424-9068-57488e7546a0)
6. Go to the `cloudflare worker project > settings > variables > kv namespace bindings` now make sure to add this 4 variable to different namespaces (KEEP THE SAME VARIABLE NAME) once done it will look like this and then hit deploy
```
access_token
refresh_token
codeVerifier
state
```
![image](https://github.com/code100x/bounty-hook/assets/92169549/0c28b719-6288-4d1d-a023-4b7a15bc49c9)
7. Now to setup twitter hit the URL `cloudflare_url/twitter-setup` and then authorise the twitter.
8. Make sure you have added the `cloudflare_url/webhook` in the github webhooks and then you are good to go.
