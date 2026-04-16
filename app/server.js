const express = require("express");
const os = require("os");
const path = require("path");

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Serve static files from public/
app.use(express.static(path.join(__dirname, "public")));

// Health probe for Kubernetes
app.get("/health", (_req, res) => {
  res.status(200).type("text/plain").send("ok");
});

// Pod info for the frontend
app.get("/api/info", (_req, res) => {
  res.json({ host: os.hostname(), port: PORT });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`listening on 0.0.0.0:${PORT}`);
});
