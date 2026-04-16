const express = require("express");
const os = require("os");
const fs = require("fs");
const path = require("path");
const { marked } = require("marked");

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Configure marked for proper rendering
marked.setOptions({ gfm: true, breaks: true });

// Load and cache the markdown file
// In Docker: DEPLOYMENT-GUIDE.md is copied next to server.js (__dirname)
// Locally:   it lives one level up (project root)
const GUIDE_PATH = fs.existsSync(path.join(__dirname, "DEPLOYMENT-GUIDE.md"))
  ? path.join(__dirname, "DEPLOYMENT-GUIDE.md")
  : path.join(__dirname, "..", "DEPLOYMENT-GUIDE.md");

function loadGuide() {
  try {
    const md = fs.readFileSync(GUIDE_PATH, "utf8");
    return marked.parse(md);
  } catch {
    return "<p>Guide file not found.</p>";
  }
}

app.get("/health", (_req, res) => {
  res.status(200).type("text/plain").send("ok");
});

app.get("/", (_req, res) => {
  const host = os.hostname();
  const guideHtml = loadGuide();

  res.type("html").send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Deployment Guide — Construction App</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
  <style>
    :root {
      --bg:        #0d1117;
      --surface:   #161b22;
      --surface2:  #1c2128;
      --border:    #30363d;
      --accent:    #f5c400;
      --accent2:   #e8610a;
      --green:     #3fb950;
      --blue:      #58a6ff;
      --red:       #f85149;
      --text:      #e6edf3;
      --muted:     #8b949e;
      --code-bg:   #161b22;
      --sidebar-w: 280px;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    html { scroll-behavior: smooth; }

    body {
      font-family: "Inter", system-ui, sans-serif;
      background: var(--bg);
      color: var(--text);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }

    /* ── TOP NAV ── */
    .topnav {
      position: sticky;
      top: 0;
      z-index: 100;
      background: rgba(13,17,23,.92);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--border);
      padding: 0 2rem;
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
    }

    .nav-brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      text-decoration: none;
    }

    .nav-logo {
      width: 32px; height: 32px;
      background: var(--accent);
      clip-path: polygon(0 25%, 50% 0%, 100% 25%, 100% 75%, 50% 100%, 0 75%);
      display: grid;
      place-items: center;
      flex-shrink: 0;
    }

    .nav-logo span {
      font-family: "JetBrains Mono";
      font-size: 0.75rem;
      font-weight: 700;
      color: #000;
    }

    .nav-title {
      font-size: 1rem;
      font-weight: 600;
      color: var(--text);
    }

    .nav-title small {
      font-size: 0.72rem;
      font-weight: 400;
      color: var(--muted);
      margin-left: 0.4rem;
    }

    .pod-chip {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      font-family: "JetBrains Mono";
      font-size: 0.72rem;
      color: var(--muted);
      background: var(--surface2);
      border: 1px solid var(--border);
      padding: 0.3rem 0.75rem;
      border-radius: 20px;
    }

    .pod-dot {
      width: 6px; height: 6px;
      border-radius: 50%;
      background: var(--green);
      box-shadow: 0 0 6px var(--green);
      animation: pulse 2s infinite;
    }

    /* ── LAYOUT ── */
    .layout {
      display: flex;
      flex: 1;
      max-width: 1400px;
      margin: 0 auto;
      width: 100%;
      padding: 0 1rem;
    }

    /* ── SIDEBAR ── */
    .sidebar {
      width: var(--sidebar-w);
      flex-shrink: 0;
      padding: 2rem 1rem 2rem 0;
      position: sticky;
      top: 60px;
      height: calc(100vh - 60px);
      overflow-y: auto;
    }

    .sidebar::-webkit-scrollbar { width: 4px; }
    .sidebar::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }

    .sidebar-label {
      font-size: 0.65rem;
      font-weight: 600;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      color: var(--muted);
      margin-bottom: 0.75rem;
      padding-left: 0.75rem;
    }

    .toc-list {
      list-style: none;
    }

    .toc-list li a {
      display: block;
      padding: 0.35rem 0.75rem;
      font-size: 0.82rem;
      color: var(--muted);
      text-decoration: none;
      border-radius: 6px;
      border-left: 2px solid transparent;
      transition: all 0.15s;
      line-height: 1.4;
    }

    .toc-list li a:hover {
      color: var(--text);
      background: var(--surface);
      border-left-color: var(--accent);
    }

    /* ── MAIN CONTENT ── */
    .main {
      flex: 1;
      min-width: 0;
      padding: 2rem 0 4rem 2rem;
      border-left: 1px solid var(--border);
    }

    /* Hero banner */
    .hero {
      background: linear-gradient(135deg, var(--surface) 0%, var(--surface2) 100%);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 2rem 2.5rem;
      margin-bottom: 2.5rem;
      display: flex;
      align-items: center;
      gap: 2rem;
    }

    .hero-icon {
      width: 64px; height: 64px;
      background: linear-gradient(135deg, var(--accent), var(--accent2));
      border-radius: 12px;
      display: grid;
      place-items: center;
      flex-shrink: 0;
      font-size: 1.8rem;
    }

    .hero-title {
      font-size: 1.6rem;
      font-weight: 700;
      color: var(--text);
      margin-bottom: 0.4rem;
    }

    .hero-sub {
      font-size: 0.9rem;
      color: var(--muted);
      line-height: 1.5;
    }

    .hero-badges {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
      margin-top: 0.75rem;
    }

    .hbadge {
      font-size: 0.68rem;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      padding: 0.2rem 0.6rem;
      border-radius: 4px;
    }

    .hbadge.yellow { background: rgba(245,196,0,.15); color: var(--accent); border: 1px solid rgba(245,196,0,.3); }
    .hbadge.blue   { background: rgba(88,166,255,.15); color: var(--blue);   border: 1px solid rgba(88,166,255,.3); }
    .hbadge.green  { background: rgba(63,185,80,.15);  color: var(--green);  border: 1px solid rgba(63,185,80,.3); }
    .hbadge.orange { background: rgba(232,97,10,.15);  color: var(--accent2);border: 1px solid rgba(232,97,10,.3); }

    /* ── MARKDOWN CONTENT ── */
    .guide-content h1 { display: none; } /* hidden — shown in hero */

    .guide-content h2 {
      font-size: 1.3rem;
      font-weight: 700;
      color: var(--text);
      margin: 2.5rem 0 1rem;
      padding-bottom: 0.6rem;
      border-bottom: 2px solid var(--border);
      display: flex;
      align-items: center;
      gap: 0.6rem;
    }

    .guide-content h2::before {
      content: '';
      display: inline-block;
      width: 4px;
      height: 1.2rem;
      background: var(--accent);
      border-radius: 2px;
      flex-shrink: 0;
    }

    .guide-content h3 {
      font-size: 1.05rem;
      font-weight: 600;
      color: var(--text);
      margin: 1.75rem 0 0.75rem;
    }

    .guide-content h4 {
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin: 1.25rem 0 0.5rem;
    }

    .guide-content p {
      font-size: 0.9rem;
      line-height: 1.75;
      color: #c9d1d9;
      margin-bottom: 1rem;
    }

    .guide-content a {
      color: var(--blue);
      text-decoration: none;
    }

    .guide-content a:hover { text-decoration: underline; }

    .guide-content ul,
    .guide-content ol {
      padding-left: 1.5rem;
      margin-bottom: 1rem;
    }

    .guide-content li {
      font-size: 0.9rem;
      line-height: 1.75;
      color: #c9d1d9;
      margin-bottom: 0.25rem;
    }

    .guide-content strong { color: var(--text); }

    /* Code blocks */
    .guide-content pre {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 1.25rem 1.5rem;
      margin: 1rem 0 1.5rem;
      overflow-x: auto;
      position: relative;
    }

    .guide-content pre::before {
      content: 'bash';
      position: absolute;
      top: 0.5rem;
      right: 0.75rem;
      font-family: "JetBrains Mono";
      font-size: 0.62rem;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }

    .guide-content pre code {
      font-family: "JetBrains Mono", monospace;
      font-size: 0.82rem;
      color: #e6edf3;
      background: none;
      border: none;
      padding: 0;
    }

    .guide-content code {
      font-family: "JetBrains Mono", monospace;
      font-size: 0.82rem;
      background: var(--surface2);
      border: 1px solid var(--border);
      color: var(--accent);
      padding: 0.15rem 0.45rem;
      border-radius: 4px;
    }

    /* Tables */
    .guide-content table {
      width: 100%;
      border-collapse: collapse;
      margin: 1rem 0 1.5rem;
      font-size: 0.85rem;
      border: 1px solid var(--border);
      border-radius: 8px;
      overflow: hidden;
    }

    .guide-content th {
      background: var(--surface2);
      padding: 0.7rem 1rem;
      text-align: left;
      font-size: 0.72rem;
      font-weight: 600;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--muted);
      border-bottom: 1px solid var(--border);
    }

    .guide-content td {
      padding: 0.7rem 1rem;
      border-bottom: 1px solid rgba(48,54,61,.5);
      color: #c9d1d9;
      vertical-align: top;
    }

    .guide-content tr:last-child td { border-bottom: none; }
    .guide-content tr:hover td { background: rgba(245,196,0,.03); }

    /* Horizontal rule */
    .guide-content hr {
      border: none;
      border-top: 1px solid var(--border);
      margin: 2rem 0;
    }

    /* Blockquote */
    .guide-content blockquote {
      border-left: 3px solid var(--accent);
      background: var(--surface);
      padding: 0.75rem 1.25rem;
      margin: 1rem 0;
      border-radius: 0 6px 6px 0;
    }

    .guide-content blockquote p {
      margin: 0;
      color: var(--muted);
    }

    /* ── FOOTER ── */
    .footer {
      border-top: 1px solid var(--border);
      background: var(--surface);
      padding: 1rem 2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-family: "JetBrains Mono";
      font-size: 0.7rem;
      color: var(--muted);
    }

    /* Animations */
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.35} }
    @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }

    .hero { animation: fadeIn 0.4s ease both; }
    .guide-content { animation: fadeIn 0.4s 0.1s ease both; }

    /* ── RESPONSIVE ── */
    @media (max-width: 768px) {
      .sidebar { display: none; }
      .main { padding: 1.5rem 0 3rem; border-left: none; }
      .layout { padding: 0 1rem; }
      .hero { flex-direction: column; gap: 1rem; padding: 1.5rem; }
      .hero-icon { width: 48px; height: 48px; font-size: 1.4rem; }
      .topnav { padding: 0 1rem; }
      .pod-chip { display: none; }
    }

    @media (max-width: 480px) {
      .guide-content pre { padding: 1rem; font-size: 0.75rem; }
      .guide-content table { font-size: 0.78rem; }
    }
  </style>
</head>
<body>

  <!-- TOP NAV -->
  <nav class="topnav">
    <a class="nav-brand" href="#">
      <div class="nav-logo"><span>IF</span></div>
      <span class="nav-title">IronFrame <small>Construction App</small></span>
    </a>
    <div class="pod-chip">
      <div class="pod-dot"></div>
      <span>pod: ${escapeHtml(host)} &nbsp;|&nbsp; port: ${PORT}</span>
    </div>
  </nav>

  <div class="layout">

    <!-- SIDEBAR TOC -->
    <aside class="sidebar">
      <div class="sidebar-label">Contents</div>
      <ul class="toc-list">
        <li><a href="#overview">1. Overview</a></li>
        <li><a href="#folder-structure">2. Folder Structure</a></li>
        <li><a href="#prerequisites">3. Prerequisites</a></li>
        <li><a href="#docker-only">4. Docker Only</a></li>
        <li><a href="#kubernetes-setup">5. Kubernetes Setup</a></li>
        <li><a href="#build-and-deploy">6. Build &amp; Deploy</a></li>
        <li><a href="#open-the-app">7. Open the App</a></li>
        <li><a href="#day-to-day-commands">8. Day-to-Day Commands</a></li>
        <li><a href="#scale-replicas">9. Scale Replicas</a></li>
        <li><a href="#update-image">10. Update Image</a></li>
        <li><a href="#cleanup">11. Cleanup</a></li>
        <li><a href="#whats-next">12. What&apos;s Next</a></li>
        <li><a href="#troubleshooting">13. Troubleshooting</a></li>
        <li><a href="#linux-server">15. Linux Server</a></li>
        <li><a href="#rocky-linux">16. Rocky Linux</a></li>
      </ul>
    </aside>

    <!-- MAIN -->
    <main class="main">

      <!-- Hero -->
      <div class="hero">
        <div class="hero-icon">🏗️</div>
        <div>
          <div class="hero-title">Deployment Guide</div>
          <div class="hero-sub">
            Step-by-step reference for deploying the Node.js construction app<br/>
            with <strong>Docker</strong> and <strong>Kubernetes</strong>.
          </div>
          <div class="hero-badges">
            <span class="hbadge yellow">Node.js 20</span>
            <span class="hbadge blue">Docker</span>
            <span class="hbadge green">Kubernetes</span>
            <span class="hbadge orange">K3s / MicroK8s</span>
          </div>
        </div>
      </div>

      <!-- Rendered Markdown Guide -->
      <div class="guide-content">
        ${guideHtml}
      </div>

    </main>
  </div>

  <!-- FOOTER -->
  <footer class="footer">
    <span>IronFrame v1.0 &nbsp;·&nbsp; Kubernetes Demo</span>
    <span>Pod: ${escapeHtml(host)} &nbsp;·&nbsp; Namespace: default</span>
  </footer>

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
