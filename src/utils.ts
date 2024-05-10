export const extractAmount = (comment: string) => {
  console.log(comment);
  const bountyExtractor = /\/bounty\s+(\$?\d+|\d+\$)/;

  const match = comment.match(bountyExtractor);
  return match ? match[1] : null;
};

export const isBountyComment = (comment: string) => {
  return comment.trim().toLocaleLowerCase().startsWith('/bounty');
};

export function hexToBytes(hex: string) {
  let len = hex.length / 2;
  let bytes = new Uint8Array(len);

  let index = 0;
  for (let i = 0; i < hex.length; i += 2) {
    let c = hex.slice(i, i + 2);
    let b = parseInt(c, 16);
    bytes[index] = b;
    index += 1;
  }

  return bytes;
}

export function generateRandomString(length: number) {
  let text = '';
  const possible =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  for (let i = 0; i < length; i++) {
    text += possible[Math.floor(Math.random() * possible.length)];
  }
  return text;
}

// TODO : Need to implement some hashing algorithm recomended in docs when in production probably SHA256
// Refrence : https://github.com/PLhery/node-twitter-api-v2/blob/10226719ea436fc233976ba83eb819117e4133d0/src/client-mixins/oauth2.helper.ts#L8
// export function getCodeVerifier() {
//   const codeVerifier = generateRandomString(128);
//   return codeVerifier;
// }
