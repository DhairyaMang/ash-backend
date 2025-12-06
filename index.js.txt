import express from "express";
import { connectDB } from "./db.js";

const app = express();
app.use(express.json());

connectDB();

app.get("/", (req, res) => {
  res.send("Backend running 🚀");
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log("Server started");
});
