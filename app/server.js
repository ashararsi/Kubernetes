const express = require("express");
const os = require("os");

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.get("/health", (_req, res) => {
  res.status(200).type("text/plain").send("ok");
});

app.get("/", (_req, res) => {
  const host = os.hostname();
  res.type("html").send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome — Construction App</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,600;0,9..40,700;1,9..40,400&display=swap" rel="stylesheet" />
  <style>
    :root {
      --bg: #0f1419;
      --card: #1a222c;
      --accent: #f5c400;
      --text: #e8ecf1;
      --muted: #8b95a5;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: "DM Sans", system-ui, sans-serif;
      background: var(--bg);
      color: var(--text);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
    }
    .card {
      background: var(--card);
      border: 1px solid #2a3441;
      border-radius: 12px;
      padding: 2.5rem;
      max-width: 520px;
      width: 100%;
      box-shadow: 0 24px 48px rgba(0,0,0,.35);
    }
    h1 {
      font-size: 1.75rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
      color: var(--accent);
    }
    p { color: var(--muted); line-height: 1.6; margin-bottom: 1.25rem; }
    .meta {
      font-size: 0.8rem;
      color: var(--muted);
      font-family: ui-monospace, monospace;
      padding-top: 1rem;
      border-top: 1px solid #2a3441;
    }
    .badge {
      display: inline-block;
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--bg);
      background: var(--accent);
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-weight: 600;
      margin-bottom: 1rem;
    }
  </style>
</head>
<body>
  <div class="card">
    <span class="badge">Kubernetes</span>
    <h1>Welcome</h1>
    <p>
      Ye Node.js app cluster mein chal rahi hai. Neeche pod ka hostname dikhega —
      har replica alag pod ho sakta hai.
    </p>
    <p class="meta">Pod hostname: ${escapeHtml(host)}<br />Port: ${PORT}</p>
  </div>
</body>
</html>`);
});

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`listening on 0.0.0.0:${PORT}`);
});
