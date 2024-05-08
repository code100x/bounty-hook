// The main purpose of this file is to store the data that is fetched from the Twitter API.
// So that we do need to store the data in the database.
class twitterStore {
  private callbackUrl!: string;
  private codeVerifier!: string;
  private state!: string;
  private accessToken!: string;
  private refreshToken!: string;

  getcallbackUrl(): string {
    console.log('Getting callback url', this.callbackUrl);
    return this.callbackUrl;
  }
  setcallbackUrl(value: string) {
    console.log('Setting callback url', value);
    this.callbackUrl = value;
  }
  getcodeVerifier(): string {
    console.log('Getting code verifier', this.codeVerifier);
    return this.codeVerifier;
  }
  setcodeVerifier(codeVerifier: string) {
    console.log('Setting code verifier', codeVerifier);
    this.codeVerifier = codeVerifier;
  }
  getstate(): string {
    console.log('Getting state', this.state);
    return this.state;
  }
  setstate(state: string) {
    console.log('Setting state', state);
    this.state = state;
  }
  getaccessToken(): string {
    console.log('Getting access token', this.accessToken);
    return this.accessToken;
  }
  setaccessToken(accessToken: string) {
    console.log('Setting access token', accessToken);
    this.accessToken = accessToken;
  }
  getrefreshToken(): string {
    console.log('Getting refresh token', this.refreshToken);
    return this.refreshToken;
  }
  setrefreshToken(refreshToken: string) {
    console.log('Setting refresh token', refreshToken);
    this.refreshToken = refreshToken;
  }
}

const twitterStoreInstance = new twitterStore();
export { twitterStoreInstance as twitterStore };
