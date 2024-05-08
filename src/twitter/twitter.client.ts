// Using this class to manage all the oauth and REST API requests to Twitter
export class twitterClient {
  private readonly clientId: string;
  private readonly clientSecret: string;
  constructor(clientId: string, clientSecret: string) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
  }

  /**
   * Generates an OAuth2 authorization link for Twitter.
   * @param callbackUrl The callback URL to redirect to after authorization.
   * @param state The state parameter for CSRF protection.
   * @param codeChallenge The code challenge for PKCE (Proof Key for Code Exchange).
   * @param code_challenge_method The method used to generate the codeChallenge.
   * @param scope The scope of the authorization.
   */
  async generateOAuth2AuthLink({
    callbackUrl,
    state,
    codeChallenge,
    code_challenge_method,
    scope,
  }: {
    callbackUrl: string;
    state: string;
    codeChallenge: string;
    code_challenge_method: string;
    scope: string[] | string;
  }) {
    const finalScope = Array.isArray(scope) ? scope.join('%20') : scope;
    const response = await fetch(
      `https://twitter.com/i/oauth2/authorize?response_type=${'code'}&client_id=${
        this.clientId
      }&redirect_uri=${callbackUrl}&scope=${finalScope}&state=${state}&code_challenge=${codeChallenge}&code_challenge_method=${code_challenge_method}`
    );
    // For Debugging
    // console.log('------generateOAuth2AuthLink------');
    // console.log(response);
    // console.log('----------------------------------');

    const result = {
      url: response.url,
      codeVerifier: codeChallenge,
      state: state,
    };
    return result;
  }

  /**
   * Logs in the user with OAuth2 for Twitter and gives a access token.
   * @param code The code returned from the OAuth2 authorization.
   * @param codeVerifier The code verifier for PKCE.
   * @param redirectUri The redirect URI used in the OAuth2 authorization.
   * @returns The access token and refresh token for the user.
   *
   * Official Doc : https://developer.twitter.com/en/docs/authentication/oauth-2-0/user-access-token
   */
  async loginWithOauth2({
    code,
    codeVerifier,
    redirectUri,
  }: {
    code: string;
    codeVerifier: string;
    redirectUri: string;
  }) {
    const grantType = 'authorization_code';
    const url = new URL('https://api.twitter.com/2/oauth2/token');
    const params = {
      code,
      grant_type: grantType,
      client_id: this.clientId,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
      client_secret: this.clientSecret,
    };

    const body = new URLSearchParams(params);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });
    const responseDate = (await response.json()) as any;
    // For Debugging
    // console.log('------loginWithOauth2------');
    // console.log(responseDate);
    // console.log('---------------------------');
    const result = {
      accessToken: responseDate.access_token,
      refreshToken: responseDate.refresh_token,
    };
    return result;
  }

  /**
   * Refreshes the OAuth2 token for Twitter.
   * @param refreshToken The refresh token for the user.
   * @returns The new access token and refresh token.
   *
   * Official Doc : https://developer.twitter.com/en/docs/authentication/oauth-2-0/user-access-token
   */
  async refreshOAuth2Token(refreshToken: string) {
    const grantType = 'refresh_token';
    const url = new URL('https://api.twitter.com/2/oauth2/token');
    const params = {
      refresh_token: refreshToken,
      grant_type: grantType,
      client_id: this.clientId,
    };
    const body = new URLSearchParams(params);
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });
    const responseData = (await response.json()) as any;
    // For Debugging
    // console.log('------refreshOAuth2Token------');
    // console.log(responseData);
    // console.log('-----------------------------');
    const result = {
      accessToken: responseData.access_token,
      refreshToken: responseData.refresh_token,
    };
    return result;
  }

  /**
   * Tweets a message to Twitter.
   * @param tweet The tweet message.
   * @param accessToken The access token for the user.
   * @returns The response from the Twitter API.
   *
   * Official Doc : https://developer.twitter.com/en/docs/twitter-api/tweets/manage-tweets/api-reference/post-tweets
   */
  async tweet(tweet: string, accessToken: string) {
    const url = new URL('https://api.twitter.com/2/tweets');
    const params = {
      text: tweet,
    };
    const body = JSON.stringify(params);
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-type': 'application/json',
        Authorization: 'Bearer ' + accessToken,
      },
      body,
    });
    const responseData = (await response.json()) as any;
    // For Debugging
    // console.log('------tweet------');
    // console.log(responseData);
    // console.log('----------------');
    return responseData;
  }
}
