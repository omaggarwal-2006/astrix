#!/usr/bin/env node
/**
 * Checks every relative Markdown link (file and #anchor) in README.md, CONTRACT.md and docs/.
 * Usage: npm run check:links
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rel = p => path.relative(ROOT, p).split(path.sep).join('/');
const files = ['README.md', 'CONTRACT.md', ...fs.readdirSync(path.join(ROOT, 'docs')).filter(f => f.endsWith('.md')).map(f => 'docs/' + f)]
  .map(f => path.join(ROOT, f)).filter(f => fs.existsSync(f));

// GitHub-style heading anchors
const slug = h => h.trim().toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, '').replace(/\s/g, '-');
const anchorCache = new Map();
const anchorsOf = file => {
  if (!anchorCache.has(file)) {
    const text = fs.readFileSync(file, 'utf8');
    anchorCache.set(file, new Set([...text.matchAll(/^#{1,6}\s+(.+)$/gm)].map(m => slug(m[1]))));
  }
  return anchorCache.get(file);
};

let problems = 0;
for (const file of files) {
  const text = fs.readFileSync(file, 'utf8').replace(/```[\s\S]*?```/g, '');
  for (const m of text.matchAll(/\]\(([^)\s]+)\)/g)) {
    const [target, anchor] = m[1].split('#');
    if (/^[a-z]+:/i.test(target)) continue;            // http:, https:, mailto:
    const resolved = target ? path.join(path.dirname(file), decodeURI(target)) : file;
    if (!fs.existsSync(resolved)) { console.log(`missing  ${rel(file)} -> ${m[1]}`); problems++; continue; }
    if (anchor && resolved.endsWith('.md') && !anchorsOf(resolved).has(anchor)) { console.log(`anchor   ${rel(file)} -> ${m[1]}`); problems++; }
  }
}
console.log(problems ? `${problems} broken link(s)` : `all links OK (${files.length} files)`);
process.exit(problems ? 1 : 0);
