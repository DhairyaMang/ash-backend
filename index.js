import express from "express";
import axios from "axios";
import { connectDB } from "./db.js";
import User from "./User.js"; // kyunki User.js root mein hi hai

const app = express();
app.use(express.json());

// Mongo connect
connectDB();

const IG_AUTH_URL = "https://www.facebook.com/v20.0/dialog/oauth";
const IG_TOKEN_URL = "https://graph.facebook.com/v20.0/oauth/access_token";
const IG_GRAPH_URL = "https://graph.facebook.com/v20.0";

const { IG_APP_ID, IG_APP_SECRET, IG_REDIRECT_URI } = process.env;

// Health check
app.get("/", (req, res) => {
  res.send("Backend running 🚀");
});

// STEP 1: Discord user ko Meta login par bhejna
app.get("/connect/instagram", (req, res) => {
  const { discordId } = req.query;
  if (!discordId) return res.status(400).send("Missing discordId");

  const authUrl = new URL(IG_AUTH_URL);
  authUrl.searchParams.set("client_id", IG_APP_ID);
  authUrl.searchParams.set("redirect_uri", IG_REDIRECT_URI);
  authUrl.searchParams.set(
    "scope",
    "public_profile,email,instagram_basic,instagram_manage_insights,pages_show_list"
  );
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("state", discordId);

  return res.redirect(authUrl.toString());
});

// STEP 2: Meta yahan redirect karega ?code=&state= ke sath
app.get("/auth/instagram/callback", async (req, res) => {
  const { code, state } = req.query; // state = discordId

  if (!code || !state) {
    return res.status(400).send("Missing code or state");
  }

  try {
    // code ko access token mein convert karo
    const tokenResp = await axios.get(IG_TOKEN_URL, {
      params: {
        client_id: IG_APP_ID,
        client_secret: IG_APP_SECRET,
        redirect_uri: IG_REDIRECT_URI,
        code,
      },
    });

    const accessToken = tokenResp.data.access_token;

    // Facebook user id lao
    const meResp = await axios.get(`${IG_GRAPH_URL}/me`, {
      params: {
        access_token: accessToken,
        fields: "id,name",
      },
    });

    const fbUserId = meResp.data.id;

    // Us Facebook account se linked Instagram business account lao
    const igResp = await axios.get(`${IG_GRAPH_URL}/${fbUserId}/accounts`, {
      params: {
        access_token: accessToken,
        fields: "instagram_business_account{name,username,id}",
      },
    });

    const page = igResp.data.data?.find((p) => p.instagram_business_account);

    if (!page || !page.instagram_business_account) {
      return res
        .status(400)
        .send(
          "No Instagram business account connected to this Facebook account."
        );
    }

    const igAccount = page.instagram_business_account;
    const discordId = state.toString();

    // User document update / create in Mongo
    await User.findOneAndUpdate(
      { discordId },
      {
        $set: {
          "connectedAccounts.instagram": {
            accountId: igAccount.id,
            username: igAccount.username,
            accessToken,
          },
        },
      },
      { upsert: true, new: true }
    );

    return res.send(
      "✅ Instagram connected! You can close this tab and go back to Discord."
    );
  } catch (err) {
    console.error(
      "IG callback error:",
      err.response?.data || err.message || err
    );
    return res
      .status(500)
      .send("Error connecting Instagram. Please try again later.");
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log("Server started on port", port);
});
