const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = process.cwd();
const templatePath = path.join(root, "case-studies", "index.html");
const casesPath = path.join(root, "case-studies", "cases.js");
const template = fs.readFileSync(templatePath, "utf8");
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(casesPath, "utf8"), sandbox);
const cases = sandbox.window.CASE_STUDIES;
if (!Array.isArray(cases) || !cases.length) throw new Error("No CASE_STUDIES loaded");

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[ch]));
}
function attr(s) { return esc(s); }
function abs(url) { return url.startsWith("http") ? url : `https://quanbuilds.netlify.app${url.startsWith("/") ? "" : "/"}${url}`; }
function headFor(item) {
  const url = `https://quanbuilds.netlify.app/case-studies/${item.slug}/`;
  const title = `${item.title} Case Study | QuanBuilds`;
  const image = item.images && item.images[0] ? abs(item.images[0]) : "";
  const imageTags = image ? `
    <meta property="og:image" content="${image}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:image" content="${image}" />` : `
    <meta name="twitter:card" content="summary" />`;
  return `    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${esc(title)}</title>
    <meta name="description" content="${attr(item.deck)}" />
    <link rel="canonical" href="${url}" />
    <meta name="robots" content="index,follow" />
    <meta property="og:type" content="article" />
    <meta property="og:url" content="${url}" />
    <meta property="og:title" content="${attr(title)}" />
    <meta property="og:description" content="${attr(item.deck)}" />
    ${imageTags}
    <meta name="twitter:title" content="${attr(title)}" />
    <meta name="twitter:description" content="${attr(item.deck)}" />
    <link rel="icon" href="/favicon.ico" sizes="any" />
    <link rel="icon" href="/icon.svg" type="image/svg+xml" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    <link rel="manifest" href="/site.webmanifest" />`;
}
function liList(values) { return (values || []).map(v => `<li>${esc(v)}</li>`).join("\n"); }
function externalLinksFor(item) {
  const links = item.externalLinks || [];
  if (!links.length) return `<div class="meta-row" id="externalRow" hidden><span class="meta-label">External Links</span><div class="external-links" id="caseExternalLinks"></div></div>`;
  return `<div class="meta-row" id="externalRow"><span class="meta-label">External Links</span><div class="external-links" id="caseExternalLinks">${links.map(link => `<a href="${attr(link.url)}" rel="noopener">${esc(link.label)}</a>`).join("")}</div></div>`;
}
function sectionTitle(section) { return Array.isArray(section) ? section[0] : section.title; }
function sectionBody(section) { return Array.isArray(section) ? section[1] : section.body; }
function sectionImage(item, section, index) {
  const hasImages = item.images && item.images.length;
  return Array.isArray(section) ? (hasImages ? item.images[index % item.images.length] : "") : (section.image || (hasImages ? item.images[index % item.images.length] : ""));
}
function sectionMeta(item, section) { return Array.isArray(section) ? item.label : (section.meta || item.label); }
function slidesFor(item) {
  return (item.sections || []).map((section, i) => {
    const title = sectionTitle(section);
    const body = sectionBody(section);
    const img = sectionImage(item, section, i);
    const meta = sectionMeta(item, section);
    const id = `section-${i+1}`;
    return `<article class="${img ? "slide" : "slide has-no-media"}" id="${id}" data-section="${attr(title)}">
          ${img ? `<div class="slide-visual">
            <figure>
              <div class="image-frame" tabindex="0" role="button" aria-label="Animate ${attr(title)} visual">
                <img src="${attr(img)}" alt="${attr(item.title)} visual ${i+1}" loading="${i === 0 ? "eager" : "lazy"}" />
              </div>
              <figcaption class="image-caption">${esc(meta)} / ${esc(title)}</figcaption>
            </figure>
          </div>` : ""}
          <div class="slide-copy">
            <p class="eyebrow">${String(i+1).padStart(2, "0")} / ${esc(item.category)}</p>
            <h2>${esc(title)}</h2>
            <p>${esc(body)}</p>
          </div>
        </article>`;
  }).join("\n");
}
function linksFor(item) { return (item.sections || []).map((section,i)=>`<a href="#section-${i+1}">${esc(sectionTitle(section))}</a>`).join("\n"); }
function agenticosTower() {
  return `<svg class="tower-lines" viewBox="0 0 240 980" aria-hidden="true">
      <path d="M120 18L178 138V940H62V138L120 18Z" />
      <path d="M120 18V940" />
      <path d="M92 138h56M78 232h84M78 326h84M78 420h84M78 514h84M78 608h84M78 702h84M78 796h84" />
      <path d="M62 940h116M44 940h152M88 138L62 232M152 138l26 94M62 326l116 94M178 326L62 420M62 514l116 94M178 514L62 608M62 702l116 94M178 702L62 796" />
      <path d="M96 78h48M84 102h72M72 126h96" />
    </svg>`;
}
function agenticosVisuals(item) {
  return (item.images || []).map((image, index) => {
    const section = item.sections[index] || item.sections[0] || ["Evidence", ""];
    const title = sectionTitle(section);
    return `<figure class="artifact" data-tilt>
          <img src="${attr(image)}" alt="${attr(item.title)} ${attr(title)} artifact" loading="${index === 0 ? "eager" : "lazy"}" />
          <figcaption>${esc(title)}</figcaption>
        </figure>`;
  }).join("\n");
}
function agenticosSections(item) {
  return (item.sections || []).slice(1).map((section, index) => {
    const sectionIndex = index + 2;
    const title = sectionTitle(section);
    const body = sectionBody(section);
    const visual = sectionImage(item, section, sectionIndex - 1) || item.images?.[0] || "";
    return `<article class="story-panel" id="section-${sectionIndex}" data-section="${attr(title)}">
          <div class="story-copy">
            <p class="eyebrow">${String(sectionIndex).padStart(2, "0")} / ${esc(item.category)}</p>
            <h2>${esc(title)}</h2>
            <p>${esc(body)}</p>
          </div>
          ${visual ? `<figure class="story-visual" data-tilt>
            <img src="${attr(visual)}" alt="${attr(item.title)} ${attr(title)} source artifact" loading="lazy" />
          </figure>` : ""}
        </article>`;
  }).join("\n");
}
function agenticosPageFor(item) {
  const data = JSON.stringify({ slug: item.slug, title: item.title });
  return `<!doctype html>
<html lang="en">
  <head>
${headFor(item)}
    <style>
      :root {
        color-scheme: dark;
        --bg: #070707;
        --fg: #f7f1df;
        --muted: rgba(247, 241, 223, 0.68);
        --line: rgba(247, 241, 223, 0.18);
        --glass: rgba(247, 241, 223, 0.07);
        --glass-strong: rgba(247, 241, 223, 0.11);
        --gold: #c89a3a;
        --gold-soft: rgba(200, 154, 58, 0.18);
        --pad: clamp(18px, 4vw, 56px);
        --max: 1480px;
        --bg-art-opacity: 0.74;
        --bg-art-filter: none;
      }
      [data-theme="light"] {
        color-scheme: light;
        --bg: #f7f5ef;
        --fg: #090907;
        --muted: rgba(9, 9, 7, 0.68);
        --line: rgba(113, 78, 23, 0.28);
        --glass: rgba(255, 252, 242, 0.68);
        --glass-strong: rgba(255, 252, 242, 0.82);
        --gold: #986815;
        --gold-soft: rgba(152, 104, 21, 0.14);
        --bg-art-opacity: 0.22;
        --bg-art-filter: invert(1) hue-rotate(180deg) saturate(0.72) contrast(1.05);
      }
      * { box-sizing: border-box; }
      html { background: var(--bg); scroll-behavior: smooth; }
      body {
        margin: 0;
        overflow-x: hidden;
        background: var(--bg);
        color: var(--fg);
        font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        line-height: 1.45;
      }
      body::before {
        content: "";
        position: fixed;
        inset: 0 auto 0 0;
        width: min(31vw, 360px);
        z-index: 0;
        pointer-events: none;
        background-image: url("/assets/case-studies/agenticos/control-tower-bg.png");
        background-size: auto 100svh;
        background-position: left -48px;
        background-repeat: no-repeat;
        opacity: var(--bg-art-opacity);
        filter: var(--bg-art-filter);
      }
      body::after {
        content: "";
        position: fixed;
        inset: 0;
        z-index: 0;
        pointer-events: none;
        background: var(--bg);
        opacity: 0.08;
      }
      body::-webkit-scrollbar { width: 0; height: 0; }
      a { color: inherit; text-decoration: none; }
      button, input, textarea { font: inherit; color: inherit; }
      button:focus-visible, a:focus-visible, input:focus-visible, textarea:focus-visible { outline: 1px solid var(--gold); outline-offset: 5px; }
      .topbar {
        position: fixed;
        z-index: 30;
        inset: 0 0 auto;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 20px;
        padding: 24px var(--pad);
        pointer-events: none;
      }
      .topbar a, .theme-toggle {
        pointer-events: auto;
        color: var(--muted);
        font-size: 11px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.14em;
      }
      .brand {
        color: var(--gold) !important;
        font-family: "Bodoni 72", "Didot", "Baskerville", Georgia, serif;
        font-size: 31px !important;
        font-weight: 500 !important;
        letter-spacing: -0.03em !important;
        text-transform: uppercase;
      }
      .nav-links {
        display: flex;
        align-items: center;
        gap: clamp(24px, 5vw, 64px);
      }
      .topbar a:hover { color: var(--gold); }
      .theme-toggle {
        width: 32px;
        height: 32px;
        display: grid;
        place-items: center;
        border: 0;
        background: transparent;
        cursor: pointer;
      }
      .theme-toggle::before, .theme-toggle::after {
        content: "";
        grid-area: 1 / 1;
        width: 19px;
        height: 19px;
        border: 1px solid var(--gold);
        transform: rotate(45deg);
      }
      .theme-toggle::after {
        width: 9px;
        height: 9px;
      }
      .case-shell {
        position: relative;
        z-index: 1;
        min-height: 100svh;
      }
      .tower-wrap {
        display: none;
      }
      .tower-sticky {
        height: 100svh;
        display: grid;
        place-items: end center;
        padding: 7svh 0 8svh;
        transform: translateY(var(--tower-shift, 0px));
        will-change: transform;
      }
      .tower-lines {
        width: min(76%, 245px);
        height: 100%;
        fill: none;
        stroke: var(--gold);
        stroke-width: 1.45;
        stroke-linecap: square;
        stroke-linejoin: miter;
        opacity: 0.72;
      }
      .content {
        position: relative;
        z-index: 2;
        width: min(var(--max), 100%);
        margin: 0 auto;
        padding: 92px clamp(28px, 4vw, 60px) 0 clamp(320px, 25vw, 390px);
      }
      .eyebrow, .meta-label, .artifact figcaption, .feedback-status {
        color: var(--muted);
        font-size: 11px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.16em;
      }
      h1, h2, h3 {
        margin: 0;
        font-family: "Bodoni 72", "Didot", "Baskerville", Georgia, serif;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }
      .hero {
        min-height: 58svh;
        display: grid;
        grid-template-columns: minmax(0, 0.78fr) minmax(420px, 1.08fr);
        align-items: center;
        gap: clamp(34px, 5vw, 86px);
        padding: 34px 0 clamp(28px, 5vw, 58px);
      }
      h1 {
        margin-top: 12px;
        font-size: clamp(66px, 8.6vw, 112px);
        line-height: 0.86;
        text-transform: none;
        letter-spacing: -0.025em;
      }
      .title-rule {
        display: grid;
        grid-template-columns: 1fr 36px 1fr;
        align-items: center;
        gap: 16px;
        margin: 22px 0;
        color: var(--gold);
      }
      .title-rule::before, .title-rule::after {
        content: "";
        height: 1px;
        background: var(--gold);
        opacity: 0.55;
      }
      .title-rule span {
        display: grid;
        place-items: center;
        font-size: 26px;
        line-height: 1;
      }
      .deck {
        max-width: 43ch;
        margin: 34px 0 0;
        color: var(--muted);
        font-size: clamp(16px, 1.45vw, 20px);
        line-height: 1.55;
      }
      .case-meta {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 18px;
        margin-top: 22px;
      }
      .case-meta .meta-row {
        min-height: auto;
        padding: 0;
        border: 0;
        background: transparent;
      }
      .meta-glass, .story-panel, .fact-card, .comment-card, .comment-form input, .comment-form textarea {
        border: 1px solid var(--line);
        background: var(--glass);
        box-shadow: inset 0 1px 0 rgba(255,255,255,0.05);
        backdrop-filter: blur(22px) saturate(1.2);
        -webkit-backdrop-filter: blur(22px) saturate(1.2);
      }
      .meta-glass {
        display: none;
      }
      .meta-row {
        min-height: 118px;
        display: grid;
        align-content: start;
        gap: 8px;
        padding: 18px;
        border-right: 1px solid var(--line);
      }
      .meta-row:last-child { border-right: 0; }
      .meta-row strong { font-weight: 600; }
      .jumpbar {
        position: sticky;
        z-index: 12;
        top: 78px;
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        padding: 8px;
        margin: 22px 0;
        border: 1px solid var(--line);
        background: color-mix(in srgb, var(--bg) 78%, transparent);
        backdrop-filter: blur(18px);
        -webkit-backdrop-filter: blur(18px);
      }
      .jumpbar a {
        min-height: 34px;
        display: inline-flex;
        align-items: center;
        padding: 9px 12px;
        border: 1px solid transparent;
        color: var(--muted);
        font-size: 10px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.12em;
      }
      .jumpbar a:hover, .jumpbar a.is-active {
        color: var(--gold);
        border-color: var(--gold);
        background: var(--gold-soft);
      }
      .artifact-grid {
        display: grid;
        grid-template-columns: 1.15fr 1fr 0.86fr;
        gap: 22px;
        align-items: end;
        padding: clamp(22px, 4vw, 46px);
        border: 1px solid var(--line);
        border-radius: 12px;
        background: var(--glass);
        backdrop-filter: blur(22px) saturate(1.2);
        -webkit-backdrop-filter: blur(22px) saturate(1.2);
      }
      .artifact-grid::before {
        content: "Proof Trail";
        grid-column: 1 / -1;
        color: var(--fg);
        font-family: "Bodoni 72", "Didot", "Baskerville", Georgia, serif;
        font-size: clamp(28px, 3vw, 40px);
      }
      .artifact {
        margin: 0;
        overflow: hidden;
        border: 1px solid var(--line);
        border-radius: 8px;
        background: rgba(10, 10, 10, 0.56);
        transform: translateY(var(--lift, 0px));
        transition: transform 200ms ease, border-color 200ms ease;
      }
      .artifact:nth-child(2) { grid-column: 1; }
      .artifact:nth-child(3) { grid-column: 2; }
      .artifact:nth-child(4) { grid-column: 3; }
      .artifact:nth-child(5) { display: none; }
      .artifact:hover, .story-visual:hover {
        --lift: -4px;
        border-color: var(--gold);
      }
      .artifact img, .story-visual img {
        display: block;
        width: 100%;
        height: auto;
      }
      .artifact figcaption {
        padding: 11px 12px;
        border-top: 1px solid var(--line);
      }
      .story {
        display: grid;
        gap: 22px;
        padding: 22px 0 clamp(44px, 8vw, 92px);
      }
      .story-panel {
        min-height: 0;
        display: grid;
        grid-template-columns: minmax(0, 0.92fr) minmax(280px, 0.78fr);
        gap: clamp(24px, 5vw, 66px);
        align-items: center;
        border-radius: 12px;
        padding: clamp(22px, 4vw, 46px);
      }
      .story-panel:first-child {
        min-height: 310px;
      }
      .control-card {
        min-height: 310px;
        border-radius: 12px;
      }
      .story-copy {
        display: grid;
        gap: 18px;
      }
      .story-copy h2 {
        font-size: clamp(31px, 3.8vw, 45px);
        line-height: 1;
        text-transform: none;
        letter-spacing: -0.01em;
      }
      .story-copy p {
        margin: 0;
        color: var(--muted);
        font-size: clamp(18px, 2.1vw, 25px);
        line-height: 1.5;
      }
      .story-visual {
        width: 100%;
        margin: 0;
        overflow: hidden;
        border: 1px solid var(--line);
        background: #0b0b0b;
        transform: translateY(var(--lift, 0px));
        transition: transform 200ms ease, border-color 200ms ease;
      }
      .control-list {
        display: grid;
        gap: 12px;
        margin: 0;
        padding: 0;
        list-style: none;
        color: var(--muted);
      }
      .control-list li {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .control-list li::before {
        content: "◇";
        color: var(--gold);
        font-size: 15px;
      }
      .terminal-panel {
        padding: 0;
      }
      .terminal-panel pre {
        margin: 0;
        min-height: 190px;
        padding: 16px 18px;
        overflow: auto;
        color: #d8d0be;
        background: rgba(7, 7, 7, 0.62);
        font-family: Menlo, Consolas, monospace;
        font-size: clamp(10px, 1vw, 12px);
        line-height: 1.75;
        white-space: pre-wrap;
      }
      .terminal-panel span {
        color: var(--fg);
      }
      .roster-strip {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: clamp(12px, 2.3vw, 28px);
        padding: clamp(20px, 3vw, 34px);
        border: 1px solid var(--line);
        border-radius: 12px;
        background: var(--glass);
        backdrop-filter: blur(22px) saturate(1.2);
        -webkit-backdrop-filter: blur(22px) saturate(1.2);
      }
      .roster-strip::before {
        content: "Agent Roster";
        flex-basis: 100%;
        color: var(--fg);
        font-family: "Bodoni 72", "Didot", "Baskerville", Georgia, serif;
        font-size: clamp(28px, 3vw, 40px);
        text-transform: none;
      }
      .roster-strip span {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        border: 1px solid var(--line);
        border-radius: 999px;
        padding: 10px 13px;
        color: var(--muted);
        font-size: 10px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.12em;
      }
      .roster-strip span::before {
        content: "◇";
        display: inline-grid;
        place-items: center;
        width: 30px;
        height: 30px;
        border: 1px solid var(--gold);
        border-radius: 999px;
        color: var(--gold);
        font-size: 13px;
      }
      .facts, .feedback {
        padding: clamp(56px, 9vw, 120px) 0;
        border-top: 1px solid var(--line);
      }
      .fact-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
      }
      .fact-card, .comment-card {
        display: grid;
        gap: 12px;
        padding: clamp(18px, 3vw, 28px);
      }
      .fact-card h3, .feedback h2 {
        font-size: clamp(32px, 5vw, 70px);
        line-height: 0.92;
      }
      .fact-card p, .source-list, .comment-card p {
        margin: 0;
        color: var(--muted);
      }
      .source-list {
        display: grid;
        gap: 8px;
        padding-left: 0;
        list-style: none;
        overflow-wrap: anywhere;
      }
      .feedback-head {
        display: flex;
        justify-content: space-between;
        gap: 18px;
        align-items: end;
        margin-bottom: 20px;
      }
      .feedback-actions, .comment-form {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
      }
      .like-button, .submit-button {
        min-height: 42px;
        border: 1px solid var(--line);
        background: var(--glass);
        cursor: pointer;
        padding: 11px 14px;
        font-size: 11px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.14em;
      }
      .like-button:hover, .submit-button:hover {
        color: var(--gold);
        border-color: var(--gold);
      }
      .comment-form {
        display: grid;
        grid-template-columns: 0.35fr 1fr auto;
        margin: 18px 0;
      }
      .comment-form input, .comment-form textarea {
        width: 100%;
        min-height: 42px;
        padding: 11px 12px;
      }
      .comment-form textarea { resize: vertical; }
      .comments { display: grid; gap: 10px; }
      .footer {
        position: relative;
        z-index: 1;
        min-height: 36svh;
        display: grid;
        place-items: center;
        padding: var(--pad);
        border-top: 1px solid var(--gold);
        color: var(--bg);
        background: var(--fg);
        text-align: center;
      }
      .footer a {
        color: var(--bg);
        font-family: "Bodoni 72", "Didot", "Baskerville", Georgia, serif;
        font-size: clamp(38px, 8vw, 112px);
        line-height: 0.88;
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }
      @media (prefers-reduced-motion: reduce) {
        *, *::before, *::after { animation-duration: 0.001ms !important; transition-duration: 0.001ms !important; scroll-behavior: auto !important; }
        .tower-sticky { transform: none !important; }
      }
      @media (max-width: 900px) {
        body::before {
          background-size: auto 100svh;
          background-position: 42% -34px;
          width: 100%;
          opacity: calc(var(--bg-art-opacity) * 0.6);
        }
        .content {
          padding-left: var(--pad);
        }
        .hero, .case-meta, .story-panel, .fact-grid, .comment-form, .artifact-grid {
          grid-template-columns: 1fr;
        }
        .meta-row {
          min-height: auto;
          border-right: 0;
          border-bottom: 1px solid var(--line);
        }
        .meta-row:last-child { border-bottom: 0; }
        .artifact-grid {
          grid-template-columns: 1fr;
        }
        .story-panel {
          min-height: auto;
        }
        .feedback-head {
          display: grid;
        }
      }
      @media (max-width: 620px) {
        .topbar {
          gap: 14px;
          padding-inline: 18px;
        }
        .brand {
          font-size: 28px !important;
        }
        .nav-links {
          gap: 22px;
        }
        .nav-links a:nth-child(n+4), .theme-toggle {
          display: none;
        }
      }
    </style>
  </head>
  <body>
    <header class="topbar" aria-label="Site header">
      <a class="brand" href="/" aria-label="QuanBuilds home">AO</a>
      <nav class="nav-links" aria-label="Case study navigation">
        <a href="/#work">Work</a>
        <a href="/#story">About</a>
        <a href="#proof">Notes</a>
        <a href="/#contact">Contact</a>
      </nav>
      <button class="theme-toggle" type="button" aria-label="Toggle theme"></button>
    </header>
    <div class="case-shell">
      <aside class="tower-wrap" aria-hidden="true">
        <div class="tower-sticky">${agenticosTower()}</div>
      </aside>
      <main class="content">
        <section class="hero" id="top">
          <div class="case-intro">
            <p class="eyebrow">Case Study</p>
            <h1>${esc(item.title)}</h1>
            <div class="title-rule"><span>⌄</span></div>
            <div class="case-meta" aria-label="Project metadata">
              <div class="meta-row"><span class="meta-label">Role</span><strong>System Design</strong></div>
              <div class="meta-row"><span class="meta-label">Type</span><strong>Multi-Agent Operating System</strong></div>
              <div class="meta-row"><span class="meta-label">Team</span><strong>Botler + Agents</strong></div>
              <div class="meta-row"><span class="meta-label">Status</span><strong>Live</strong></div>
            </div>
            <p class="deck">${esc(item.deck)}</p>
          </div>
          <div class="story-panel control-card" id="section-1" data-section="${esc(sectionTitle(item.sections[0]))}">
            <div class="story-copy">
              <h2>${esc(sectionTitle(item.sections[0]))}</h2>
              <p class="eyebrow">Botler</p>
              <ul class="control-list">
                <li>Plan</li>
                <li>Execute</li>
                <li>Verify</li>
                <li>Memory</li>
                <li>Approval</li>
              </ul>
            </div>
            <figure class="story-visual terminal-panel" data-tilt>
              <pre><span>● botler@control-plane</span>
10:14:01  ▸ Plan created: Analyze inbound request
10:14:03  ▸ Routed to: Dev, Hermes
10:14:03  ▸ Dev: Code changes generated
10:14:05  ▸ Hermes: Contract check passed
10:14:06  ▸ Verification complete
10:14:07  ▸ Awaiting human approval

› _</pre>
            </figure>
          </div>
        </section>
        <nav class="jumpbar" aria-label="Case study sections">
          <a href="#section-1">Control Plane</a>
          <a href="#section-2">Agent Roster</a>
          <a href="#section-3">Proof Trail</a>
          <a href="#section-4">Notes</a>
        </nav>
        <section class="story" aria-label="AgenticOS roster">
          <aside class="roster-strip" id="section-2" data-section="Agent Roster" aria-label="Agent roster">
            ${["Botler","Cash","Dev","Jim","Hermes","Loki","Impulse","Red","Doc","Atlas","Scout"].map(name => `<span>${name}</span>`).join("")}
          </aside>
        </section>
        <section class="artifact-grid" id="section-3" data-section="Proof Trail" aria-label="AgenticOS source artifacts">
          ${agenticosVisuals(item)}
        </section>
        <section class="facts" id="section-4" data-section="Notes" aria-label="Evidence and unknowns">
          <div class="fact-grid">
            <article class="fact-card"><p class="meta-label">Goal</p><h3>What we aimed for</h3><p>${esc(item.goal)}</p></article>
            <article class="fact-card"><p class="meta-label">Approach</p><h3>How we tried</h3><p>${esc(item.approach)}</p></article>
            <article class="fact-card"><p class="meta-label">Outcome</p><h3>Did it work?</h3><p>${esc(item.outcome)}</p></article>
            <article class="fact-card"><p class="meta-label">Still Unknown</p><h3>Needs owner truth</h3><ul class="source-list">${liList(item.unknowns)}</ul></article>
            <article class="fact-card"><p class="meta-label">Sources</p><h3>What this page used</h3><ul class="source-list">${liList(item.sources)}</ul></article>
            <article class="fact-card"><p class="meta-label">Next</p><h3>Reusable pattern</h3><p>This case study is about the operating pattern: scoped agents, durable memory, approval gates, and evidence trails that other teams can adapt.</p></article>
          </div>
        </section>
        <section class="feedback" aria-label="Project feedback">
          <div class="feedback-head">
            <div><p class="eyebrow">Feedback</p><h2>Leave a signal.</h2></div>
            <div class="feedback-actions">
              <button class="like-button" id="likeButton" type="button">Like <span id="likeCount">0</span></button>
              <span class="feedback-status" id="feedbackStatus">Loading feedback</span>
            </div>
          </div>
          <form class="comment-form" id="commentForm">
            <input id="commentName" name="name" autocomplete="name" maxlength="80" placeholder="Name" />
            <textarea id="commentText" name="comment" maxlength="700" required placeholder="What did this make you want to know, build, test, or challenge?"></textarea>
            <button class="submit-button" type="submit">Send</button>
          </form>
          <div class="comments" id="comments"></div>
        </section>
      </main>
    </div>
    <footer class="footer">
      <a href="/#work">Back to the work</a>
    </footer>
    <script>
      const caseData = ${data};
      const formatter = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" });
      const root = document.documentElement;
      const savedTheme = localStorage.getItem("portfolio-theme");
      root.dataset.theme = savedTheme || "dark";
      document.querySelector(".theme-toggle").addEventListener("click", () => {
        const next = root.dataset.theme === "dark" ? "light" : "dark";
        root.dataset.theme = next;
        localStorage.setItem("portfolio-theme", next);
      });

      function payload(extra = {}) {
        return {
          project: caseData.slug,
          path: location.pathname + location.search + location.hash,
          title: document.title,
          referrer: document.referrer,
          viewport: { width: window.innerWidth, height: window.innerHeight },
          connection: navigator.connection?.effectiveType || "",
          ...extra,
        };
      }
      function track(type, data = {}) {
        const body = JSON.stringify({ type, data: payload(data) });
        if (navigator.sendBeacon) {
          navigator.sendBeacon("/.netlify/functions/analytics", new Blob([body], { type: "application/json" }));
          return;
        }
        fetch("/.netlify/functions/analytics", { method: "POST", headers: { "content-type": "application/json" }, body, keepalive: true }).catch(() => {});
      }
      function postFeedback(data) {
        return fetch("/.netlify/functions/analytics", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ type: "feedback", data: payload(data) }),
        }).then((res) => res.json());
      }
      function cleanText(value, fallback = "") {
        return String(value || fallback).replace(/[<>]/g, "").slice(0, 700);
      }
      async function loadFeedback() {
        const status = document.getElementById("feedbackStatus");
        try {
          const res = await fetch("/.netlify/functions/analytics?feedback=" + encodeURIComponent(caseData.slug));
          const data = await res.json();
          const summary = data.summary || { likes: 0, comments: [] };
          document.getElementById("likeCount").textContent = summary.likes || 0;
          status.textContent = (summary.commentCount || 0) + " comments";
          const nodes = (summary.comments || []).map((comment) => {
            const card = document.createElement("article");
            card.className = "comment-card";
            const date = comment.ts ? formatter.format(new Date(comment.ts)) : "";
            card.innerHTML = '<p class="meta-label">' + cleanText(comment.name, "Anonymous") + (date ? " / " + date : "") + '</p><p>' + cleanText(comment.comment) + '</p>';
            return card;
          });
          document.getElementById("comments").replaceChildren(...nodes);
        } catch {
          status.textContent = "Feedback unavailable";
        }
      }
      document.getElementById("likeButton").addEventListener("click", async () => {
        document.getElementById("feedbackStatus").textContent = "Saving like";
        try {
          await postFeedback({ action: "like" });
          track("click", { label: "case_like" });
          await loadFeedback();
        } catch {
          document.getElementById("feedbackStatus").textContent = "Like did not save";
        }
      });
      document.getElementById("commentForm").addEventListener("submit", async (event) => {
        event.preventDefault();
        const comment = document.getElementById("commentText").value;
        if (!comment.trim()) return;
        document.getElementById("feedbackStatus").textContent = "Saving comment";
        try {
          await postFeedback({ action: "comment", name: document.getElementById("commentName").value, comment });
          track("click", { label: "case_comment" });
          document.getElementById("commentText").value = "";
          await loadFeedback();
        } catch {
          document.getElementById("feedbackStatus").textContent = "Comment did not save";
        }
      });
      document.querySelectorAll("[data-tilt]").forEach((node) => {
        node.addEventListener("click", () => {
          node.animate([{ transform: "translateY(0)" }, { transform: "translateY(-6px)" }, { transform: "translateY(0)" }], { duration: 520, easing: "cubic-bezier(.16,1,.3,1)" });
          track("click", { label: "agenticos_artifact", target: node.querySelector("figcaption")?.textContent || "" });
        });
      });
      const links = Array.from(document.querySelectorAll(".jumpbar a"));
      const seenSections = new Set();
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          links.forEach((link) => link.classList.toggle("is-active", link.getAttribute("href") === "#" + entry.target.id));
          if (!seenSections.has(entry.target.id)) {
            seenSections.add(entry.target.id);
            track("vital", { label: "case_section_view", target: entry.target.dataset.section });
          }
        });
      }, { rootMargin: "-35% 0px -45% 0px", threshold: 0.01 });
      document.querySelectorAll(".story-panel, .roster-strip, .artifact-grid, .facts").forEach((panel) => observer.observe(panel));
      const depthMarks = [25, 50, 75, 95];
      const sentDepth = new Set();
      function onScroll() {
        const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
        const ratio = window.scrollY / max;
        root.style.setProperty("--tower-shift", (ratio * 52).toFixed(2) + "px");
        const depth = Math.round(ratio * 100);
        depthMarks.forEach((mark) => {
          if (depth >= mark && !sentDepth.has(mark)) {
            sentDepth.add(mark);
            track("vital", { label: "case_scroll_depth", target: mark + "%" });
          }
        });
      }
      window.addEventListener("scroll", onScroll, { passive: true });
      [15, 45, 90].forEach((seconds) => window.setTimeout(() => track("vital", { label: "case_time", target: seconds + "s" }), seconds * 1000));
      track("pageview", { label: "case_study" });
      loadFeedback();
      onScroll();
    </script>
  </body>
</html>`;
}
function pageFor(item) {
  if (item.slug === "stewartos") return agenticosPageFor(item);
  let html = template;
  html = html.replace(/    <meta charset="utf-8" \/>[\s\S]*?    <link rel="canonical" href="https:\/\/quanbuilds\.netlify\.app\/case-studies\/" \/>/, headFor(item));
  html = html.replace(/<p class="eyebrow" id="caseKicker">[\s\S]*?<\/p>/, `<p class="eyebrow" id="caseKicker">${esc(item.kicker)}</p>`);
  html = html.replace(/<h1 id="caseTitle">[\s\S]*?<\/h1>/, `<h1 id="caseTitle">${esc(item.title)}</h1>`);
  html = html.replace(/<p class="deck" id="caseDeck">[\s\S]*?<\/p>/, `<p class="deck" id="caseDeck">${esc(item.deck)}</p>`);
  html = html.replace(/<strong id="caseCategory">[\s\S]*?<\/strong>/, `<strong id="caseCategory">${esc(item.category)}</strong>`);
  html = html.replace(/<strong id="caseStatus">[\s\S]*?<\/strong>/, `<strong id="caseStatus">${esc(item.status)}</strong>`);
  html = html.replace(/<strong id="caseEdited">[\s\S]*?<\/strong>/, `<strong id="caseEdited">${esc(item.lastEdited)}</strong>`);
  html = html.replace(/<strong id="caseBusiness">[\s\S]*?<\/strong>/, `<strong id="caseBusiness">${esc(item.businessModel)}</strong>`);
  html = html.replace(/<div class="meta-row" id="externalRow">[\s\S]*?<\/div><\/div>/, externalLinksFor(item));
  html = html.replace(/<div class="jumptrack" id="jumptrack"><\/div>/, `<div class="jumptrack" id="jumptrack">${linksFor(item)}</div>`);
  html = html.replace(/<section class="slides" id="slides" aria-label="Scrollytelling case study"><\/section>/, `<section class="slides" id="slides" aria-label="Scrollytelling case study">
        ${slidesFor(item)}
      </section>`);
  html = html.replace(/<p id="caseGoal">[\s\S]*?<\/p>/, `<p id="caseGoal">${esc(item.goal)}</p>`);
  html = html.replace(/<p id="caseApproach">[\s\S]*?<\/p>/, `<p id="caseApproach">${esc(item.approach)}</p>`);
  html = html.replace(/<p id="caseOutcome">[\s\S]*?<\/p>/, `<p id="caseOutcome">${esc(item.outcome)}</p>`);
  html = html.replace(/<ul class="source-list" id="caseUnknowns">[\s\S]*?<\/ul>/, `<ul class="source-list" id="caseUnknowns">${liList(item.unknowns)}</ul>`);
  html = html.replace(/<ul class="source-list" id="caseSources">[\s\S]*?<\/ul>/, `<ul class="source-list" id="caseSources">${liList(item.sources)}</ul>`);
  return html;
}

for (const item of cases) {
  const dir = path.join(root, "case-studies", item.slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), pageFor(item));
}

// sitemap
const today = new Date().toISOString().slice(0,10);
const urls = [
  ["https://quanbuilds.netlify.app/", "1.0"],
  ["https://quanbuilds.netlify.app/signallabs/", "0.7"],
  ...cases.map(item => [`https://quanbuilds.netlify.app/case-studies/${item.slug}/`, "0.8"]),
];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(([loc,priority]) => `  <url>
    <loc>${loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${priority}</priority>
  </url>`).join("\n")}
</urlset>
`;
fs.writeFileSync(path.join(root, "sitemap.xml"), sitemap);

// branded 404
fs.writeFileSync(path.join(root, "404.html"), `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Page Not Found | QuanBuilds</title>
    <meta name="robots" content="noindex,follow" />
    <link rel="canonical" href="https://quanbuilds.netlify.app/404.html" />
    <link rel="icon" href="/favicon.ico" sizes="any" />
    <style>
      :root { color-scheme: light; --bg:#f7f5ef; --fg:#080808; --muted:rgba(8,8,8,.62); --line:rgba(8,8,8,.24); --gold:#a77a24; }
      * { box-sizing: border-box; }
      body { margin:0; min-height:100svh; display:grid; place-items:center; padding:32px; background:var(--bg); color:var(--fg); font-family:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; }
      main { max-width:820px; display:grid; gap:24px; text-align:center; }
      h1 { margin:0; font-family:"Bodoni 72","Didot","Baskerville",Georgia,serif; font-size:clamp(56px,13vw,150px); line-height:.86; letter-spacing:.04em; text-transform:uppercase; font-weight:500; }
      p { margin:0 auto; max-width:54ch; color:var(--muted); font-size:clamp(17px,2vw,23px); }
      nav { display:flex; flex-wrap:wrap; justify-content:center; gap:12px; }
      a { color:inherit; text-decoration:none; border:1px solid var(--line); border-radius:999px; padding:11px 15px; font-size:12px; font-weight:800; letter-spacing:.12em; text-transform:uppercase; }
      a:hover { color:var(--gold); border-color:var(--gold); }
    </style>
  </head>
  <body>
    <main>
      <p>404 / Nothing useful lives at this URL.</p>
      <h1>Lost Signal.</h1>
      <p>Head back to the work, jump to contact, or open the SignalLabs page.</p>
      <nav aria-label="Recovery links">
        <a href="/#work">Work</a>
        <a href="/#contact">Contact</a>
        <a href="/signallabs/">SignalLabs</a>
      </nav>
    </main>
  </body>
</html>
`);

console.log(`generated ${cases.length} case-study pages + sitemap + 404`);
