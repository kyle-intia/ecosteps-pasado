const express = require("express");
const router = express.Router();

const STRAVA_CLIENT_ID = process.env.STRAVA_CLIENT_ID;
const STRAVA_CLIENT_SECRET = process.env.STRAVA_CLIENT_SECRET;
const STRAVA_REDIRECT_URI = process.env.STRAVA_REDIRECT_URI;

const userTokens = new Map();

router.get("/auth", (req, res) => {
  const url = new URL("https://www.strava.com/oauth/authorize");
  url.searchParams.set("client_id", STRAVA_CLIENT_ID);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", STRAVA_REDIRECT_URI);
  url.searchParams.set("scope", "activity:read_all");
  res.redirect(url.toString());
});

router.get("/callback", async (req, res) => {
  const { code } = req.query;
  if (!code) return res.status(400).send("Missing code");

  try {
    const tokenResponse = await fetch("https://www.strava.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: STRAVA_CLIENT_ID,
        client_secret: STRAVA_CLIENT_SECRET,
        code,
        grant_type: "authorization_code",
        redirect_uri: STRAVA_REDIRECT_URI,
      }),
    });

    const data = await tokenResponse.json();
    console.log(data);

    if (data.errors) return res.status(400).json(data);

    userTokens.set("user", {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: data.expires_at,
    });

    res.send(`<script>window.close();</script>`);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Token exchange failed" });
  }
});

router.get("/activities", async (req, res) => {
  try {
    const tokenData = userTokens.get("user");
    if (!tokenData)
      return res.status(401).json({ message: "User not connected to Strava" });

    let accessToken = tokenData.accessToken;

    if (Date.now() / 1000 > tokenData.expiresAt) {
      const refreshResponse = await fetch(
        "https://www.strava.com/oauth/token",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            client_id: STRAVA_CLIENT_ID,
            client_secret: STRAVA_CLIENT_SECRET,
            grant_type: "refresh_token",
            refresh_token: tokenData.refreshToken,
          }),
        },
      );

      const refreshed = await refreshResponse.json();
      accessToken = refreshed.access_token;

      userTokens.set("user", {
        accessToken,
        refreshToken: refreshed.refresh_token,
        expiresAt: refreshed.expires_at,
      });
    }

    const response = await fetch(
      "https://www.strava.com/api/v3/athlete/activities?per_page=20",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );

    const activities = await response.json();
    res.json({ success: true, activities });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch Strava activities" });
  }
});

router.get("/status", (req, res) => {
  const tokenData = userTokens.get("user");
  if (!tokenData) {
    return res.json({ connected: false });
  }

  const expired = Date.now() / 1000 > tokenData.expiresAt;
  if (expired) return res.json({ connected: false });

  res.json({ connected: true });
});

module.exports = router;
