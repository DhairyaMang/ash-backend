// User.js  (ES module version)
import mongoose from "mongoose";

const ConnectedAccountSchema = new mongoose.Schema(
  {
    accountId: String,
    username: String,
    accessToken: String,
    refreshToken: String,
  },
  { _id: false }
);

const CryptoSchema = new mongoose.Schema(
  {
    network: String,
    address: String,
  },
  { _id: false }
);

const UserSchema = new mongoose.Schema(
  {
    discordId: { type: String, required: true, index: true, unique: true },
    connectedAccounts: {
      instagram: { type: ConnectedAccountSchema, default: null },
      tiktok: { type: ConnectedAccountSchema, default: null },
    },
    paymentMethods: {
      gpay: { type: String, default: null },
      paypal: { type: String, default: null },
      crypto: { type: CryptoSchema, default: null },
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", UserSchema);

export default User;
