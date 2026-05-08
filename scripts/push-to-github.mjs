/**
 * Push the current repo to GitHub via the Git Data API.
 * Uses @replit/connectors-sdk to proxy all GitHub API calls.
 *
 * Usage:  node scripts/push-to-github.mjs
 */

import { ReplitConnectors } from "@replit/connectors-sdk";
import { execSync } from "child_process";
import { readFileSync } from "fs";

const OWNER = "draxzi";
const REPO  = "solace";
const BRANCH = "main";

const connectors = new ReplitConnectors();

async function gh(path, opts = {}) {
  const res = await connectors.proxy("github", path, {
    method: opts.method || "GET",
    ...(opts.body ? { body: JSON.stringify(opts.body), headers: { "Content-Type": "application/json" } } : {}),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`GitHub ${opts.method || "GET"} ${path} → ${res.status}: ${txt.slice(0, 300)}`);
  }
  return res.json();
}

// Get all git-tracked files
const files = execSync("git ls-files", { encoding: "utf8" })
  .split("\n")
  .map(f => f.trim())
  .filter(Boolean);

console.log(`Pushing ${files.length} tracked files to github.com/${OWNER}/${REPO}…\n`);

// ── Step 0: bootstrap an empty repo with a seed commit via Contents API ────
// (The Git Data API needs at least one existing commit to operate on)
console.log("  Bootstrapping empty repo…");
try {
  await gh(`/repos/${OWNER}/${REPO}/contents/.gitkeep`, {
    method: "PUT",
    body: {
      message: "chore: init repo",
      content: Buffer.from("").toString("base64"),
    },
  });
} catch (e) {
  // If it already has commits, ignore
  if (!e.message.includes("422")) throw e;
}
await new Promise(r => setTimeout(r, 800));

// Get the seed commit SHA to use as parent
const refInfo = await gh(`/repos/${OWNER}/${REPO}/git/ref/heads/${BRANCH}`);
const parentSha = refInfo.object.sha;
console.log(`  Seed commit: ${parentSha.slice(0, 8)}`);

// Create blobs sequentially with a small delay to stay under 10 RPS
const treeEntries = [];
let done = 0;

for (const filePath of files) {
  const content = readFileSync(filePath);
  const isText = isTextFile(filePath, content);
  const body = isText
    ? { content: content.toString("utf8"), encoding: "utf-8" }
    : { content: content.toString("base64"), encoding: "base64" };
  const blob = await gh(`/repos/${OWNER}/${REPO}/git/blobs`, { method: "POST", body });
  treeEntries.push({ path: filePath, mode: "100644", type: "blob", sha: blob.sha });
  done++;
  process.stdout.write(`  blobs: ${done}/${files.length}\r`);
  // ~8 RPS — stay comfortably under the 10 RPS limit
  await new Promise(r => setTimeout(r, 125));
}

console.log(`\n  All blobs created.`);

// Create tree
const tree = await gh(`/repos/${OWNER}/${REPO}/git/trees`, {
  method: "POST",
  body: { tree: treeEntries },
});
console.log(`  Tree created: ${tree.sha.slice(0, 8)}`);

// Create commit (child of the seed commit)
const commit = await gh(`/repos/${OWNER}/${REPO}/git/commits`, {
  method: "POST",
  body: {
    message: "Initial commit — Solace mental health companion app",
    tree: tree.sha,
    parents: [parentSha],
  },
});
console.log(`  Commit created: ${commit.sha.slice(0, 8)}`);

// Create or update the branch ref
try {
  await gh(`/repos/${OWNER}/${REPO}/git/refs`, {
    method: "POST",
    body: { ref: `refs/heads/${BRANCH}`, sha: commit.sha },
  });
  console.log(`  Branch '${BRANCH}' created.`);
} catch {
  // Ref already exists — force-update it
  await gh(`/repos/${OWNER}/${REPO}/git/refs/heads/${BRANCH}`, {
    method: "PATCH",
    body: { sha: commit.sha, force: true },
  });
  console.log(`  Branch '${BRANCH}' updated.`);
}

// Set default branch to main
await gh(`/repos/${OWNER}/${REPO}`, {
  method: "PATCH",
  body: { default_branch: BRANCH },
});

console.log(`\nDone! https://github.com/${OWNER}/${REPO}\n`);

// ── helpers ────────────────────────────────────────────────────────────────────

function isTextFile(filePath, buf) {
  const textExts = new Set([
    ".ts",".tsx",".js",".jsx",".mjs",".cjs",".json",".yaml",".yml",
    ".toml",".md",".txt",".html",".css",".scss",".svg",".env",
    ".gitignore",".npmrc",".prettierrc",".eslintrc",".editorconfig",
    ".sh",".bash",".lock",".log",".map",
  ]);
  const ext = filePath.slice(filePath.lastIndexOf(".")).toLowerCase();
  if (textExts.has(ext)) return true;
  // Detect binary by checking for null bytes in first 8KB
  const sample = buf.slice(0, 8192);
  return !sample.includes(0);
}
