
import React from 'react';

/**
 * This component embeds the previous HTML/JS website as an isolated page.
 * It uses an iframe to preserve the original styles and scripts exactly as they were.
 */
export default function LegacyPage() {
  const legacyHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Tezos Archive :: Legacy Documentation</title>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet"/>
<style>
:root {
  --bg: #fdfdfb;
  --text: #1a1a1a;
  --accent: #e8573c;
  --font-serif: 'Cormorant Garamond', serif;
  --font-sans: 'Inter', sans-serif;
}
body {
  background: var(--bg);
  color: var(--text);
  font-family: var(--font-sans);
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  -webkit-font-smoothing: antialiased;
}
.archive-box {
  max-width: 500px;
  padding: 80px 60px;
  background: white;
  border: 1px solid rgba(26,26,26,0.05);
  border-radius: 40px;
  text-align: center;
  box-shadow: 0 40px 100px rgba(0,0,0,0.03);
}
.index-num {
  font-family: var(--font-serif);
  font-size: 14px;
  font-style: italic;
  opacity: 0.3;
  margin-bottom: 20px;
  display: block;
}
h1 {
  font-family: var(--font-serif);
  font-size: 42px;
  font-weight: 400;
  margin: 0 0 24px 0;
  letter-spacing: -0.02em;
}
p {
  font-size: 13px;
  line-height: 1.8;
  color: rgba(26,26,26,0.6);
  margin-bottom: 32px;
}
.btn {
  display: inline-block;
  padding: 18px 40px;
  background: var(--text);
  color: white;
  text-decoration: none;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  border-radius: 12px;
  transition: all 0.3s ease;
}
.btn:hover {
  background: var(--accent);
  transform: translateY(-2px);
}
</style>
</head>
<body>
    <div class="archive-box">
        <span class="index-num">Ref. #000-ALPHA</span>
        <h1>Project Archive</h1>
        <p>The original experimental interface has been archived to preserve the evolutionary history of the exchange. You are currently viewing the modern implementation designed for maximum artifact safety.</p>
        <a href="/" target="_parent" class="btn">Return to Exchange</a>
    </div>
</body>
</html>
    `;

  return (
    <div className="w-full h-full min-h-[800px] border-none">
      <iframe
        srcDoc={legacyHtml}
        className="w-full h-full min-h-[90vh] border-none rounded-lg"
        title="Legacy Version"
      />
    </div>
  );
}
