// Renders the CI outputs of wfc-summary.cjs for the static test report into an HTML page that
// mimics how GitHub shows them (job summary, sticky PR comment, annotations), used by "npm run debug-ci"
import {execFileSync} from "node:child_process";
import {mkdirSync, writeFileSync} from "node:fs";
import {dirname, resolve} from "node:path";
import {fileURLToPath} from "node:url";
import {marked} from "marked";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const cli = resolve(root, "../target/classes/webreport/wfc-summary.cjs");
const report = resolve(root, "src-e2e/static/report.json");
const outDir = resolve(root, "../target/debug-ci");

const links = ["--artifact-url", "https://example.org/artifact", "--run-url", "https://example.org/run"];

const run = (...args) => execFileSync(process.execPath, [cli, "--report", report, ...args], {encoding: "utf8"});

const outputs = {
    summary: run("--format", "summary", "--include-tests", ...links),
    pr: run("--format", "pr", ...links),
    annotations: JSON.parse(run("--format", "annotations")),
    stats: JSON.parse(run("--format", "stats")),
};

const escapeHtml = (text) =>
    text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const ALERTS = ["NOTE", "TIP", "IMPORTANT", "WARNING", "CAUTION"];

// marked does not know GitHub alerts ("> [!TIP]") nor mermaid blocks, so both are rewritten after rendering
const renderMarkdown = (md) => marked.parse(md, {gfm: true})
    .replace(new RegExp(`<blockquote>\\s*<p>\\[!(${ALERTS.join("|")})\\]\\s*`, "g"),
        (_, kind) => `<blockquote class="alert alert-${kind.toLowerCase()}"><p class="alert-title">${kind[0] + kind.slice(1).toLowerCase()}</p><p>`)
    .replace(/<pre><code class="language-mermaid">([\s\S]*?)<\/code><\/pre>/g, '<pre class="mermaid">$1</pre>');

const byteSize = (text) => `${(Buffer.byteLength(text, "utf8") / 1024).toFixed(1)} KiB`;

const renderAnnotations = (annotations) => annotations.map(a => `
    <div class="annotation annotation-${a.level}">
      <div class="annotation-title">${a.level === "warning" ? "&#x26A0;" : "&#x2139;"} ${escapeHtml(a.title)}</div>
      <div>${escapeHtml(a.message)}</div>
      ${a.faultId ? `<div class="annotation-id"><code>${escapeHtml(a.faultId)}</code></div>` : ""}
    </div>`).join("");

const tab = (id, title, body, checked = false) => `
  <input type="radio" name="tab" id="tab-${id}"${checked ? " checked" : ""}>
  <label for="tab-${id}">${title}</label>
  <section class="panel">${body}</section>`;

const page = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>WFC CI Summary Preview</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/github-markdown-css@5.8.1/github-markdown-light.css">
<style>
  body { margin: 0; background: #f6f8fa; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; }
  header { padding: 16px 24px; background: #24292f; color: #fff; }
  header small { color: #c9d1d9; }
  .tabs { max-width: 1012px; margin: 0 auto; padding: 16px; display: flex; flex-wrap: wrap; }
  .tabs > input { display: none; }
  .tabs > label { padding: 8px 16px; cursor: pointer; border-bottom: 2px solid transparent; }
  .tabs > input:checked + label { border-bottom-color: #fd8c73; font-weight: 600; }
  .panel { display: none; order: 1; width: 100%; margin-top: 8px; }
  .tabs > input:checked + label + .panel { display: block; }
  .card { background: #fff; border: 1px solid #d0d7de; border-radius: 6px; padding: 24px; }
  .meta { color: #57606a; font-size: 12px; margin: 0 0 8px; }
  .markdown-body pre.mermaid { background: #fff; }
  .alert { padding: 8px 16px; border-left: 0.25em solid; color: inherit; }
  .alert-title { font-weight: 600; margin-bottom: 4px !important; }
  .alert-note { border-color: #0969da; } .alert-note .alert-title { color: #0969da; }
  .alert-tip { border-color: #1a7f37; } .alert-tip .alert-title { color: #1a7f37; }
  .alert-important { border-color: #8250df; } .alert-important .alert-title { color: #8250df; }
  .alert-warning { border-color: #9a6700; } .alert-warning .alert-title { color: #9a6700; }
  .alert-caution { border-color: #d1242f; } .alert-caution .alert-title { color: #d1242f; }
  .annotation { background: #fff; border: 1px solid #d0d7de; border-left: 4px solid #9a6700; border-radius: 6px; padding: 12px 16px; margin-bottom: 8px; font-size: 14px; }
  .annotation-notice { border-left-color: #0969da; }
  .annotation-title { font-weight: 600; margin-bottom: 4px; }
  .annotation-id { margin-top: 4px; color: #57606a; }
  pre.raw { background: #fff; border: 1px solid #d0d7de; border-radius: 6px; padding: 16px; overflow: auto; white-space: pre-wrap; word-break: break-word; font-size: 12px; }
</style>
</head>
<body>
<header>
  <strong>WFC CI Summary Preview</strong><br>
  <small>${escapeHtml(report)}</small>
</header>
<div class="tabs">
  ${tab("summary", "Job summary", `<p class="meta">${byteSize(outputs.summary)} (GitHub limit: 1024 KiB)</p><div class="card markdown-body">${renderMarkdown(outputs.summary)}</div>`, true)}
  ${tab("pr", "PR comment", `<p class="meta">${byteSize(outputs.pr)}</p><div class="card markdown-body">${renderMarkdown(outputs.pr)}</div>`)}
  ${tab("annotations", `Annotations (${outputs.annotations.length})`, renderAnnotations(outputs.annotations))}
  ${tab("stats", "Stats", `<pre class="raw">${escapeHtml(JSON.stringify(outputs.stats, null, 2))}</pre>`)}
  ${tab("raw", "Raw markdown", `<pre class="raw">${escapeHtml(outputs.summary)}</pre>`)}
</div>
<script type="module">
  import mermaid from "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs";
  mermaid.initialize({startOnLoad: false});
  // Hidden tabs have no size, so each chart is drawn the first time its tab is shown
  const draw = () => mermaid.run({nodes: [...document.querySelectorAll(".tabs > input:checked + label + .panel pre.mermaid:not([data-processed])")]});
  document.querySelectorAll(".tabs > input").forEach(i => i.addEventListener("change", draw));
  draw();
</script>
</body>
</html>
`;

mkdirSync(outDir, {recursive: true});
writeFileSync(resolve(outDir, "index.html"), page);
writeFileSync(resolve(outDir, "summary.md"), outputs.summary);
writeFileSync(resolve(outDir, "pr.md"), outputs.pr);
console.log(`CI summary preview written to ${resolve(outDir, "index.html")}`);
