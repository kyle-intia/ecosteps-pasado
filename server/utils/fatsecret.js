const OAuth = require("oauth-1.0a");
const crypto = require("crypto");

const CONSUMER_KEY = process.env.FATSECRET_KEY;
const CONSUMER_SECRET = process.env.FATSECRET_SECRET;

const oauth = OAuth({
  consumer: { key: CONSUMER_KEY, secret: CONSUMER_SECRET },
  signature_method: "HMAC-SHA1",
  hash_function(baseString, key) {
    return crypto.createHmac("sha1", key).update(baseString).digest("base64");
  },
});

function createSignedUrl(params) {
  const url = "https://platform.fatsecret.com/rest/foods/search/v1";

  const requestData = {
    url,
    method: "GET",
    data: params,
  };

  const authParams = oauth.authorize(requestData);

  const allParams = { ...params, ...authParams };
  const query = Object.keys(allParams)
    .map((k) => `${k}=${encodeURIComponent(allParams[k])}`)
    .join("&");

  return `${url}?${query}`;
}

module.exports = { createSignedUrl };
