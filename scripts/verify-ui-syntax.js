#!/usr/bin/env node
/**
 * verify-ui-syntax.js
 * Pre-flight validation script to ensure HTML, CSS, and JS syntax integrity in public/index.html.
 * Blocks CI/CD deployment if unclosed braces, syntax errors, or broken style blocks are detected.
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const htmlPath = path.resolve(process.cwd(), 'public', 'index.html');
if (!fs.existsSync(htmlPath)) {
  console.error(`[FAIL] public/index.html does not exist at ${htmlPath}`);
  process.exit(1);
}

const html = fs.readFileSync(htmlPath, 'utf8');
let errors = 0;

// 1. Verify CSS block brace balance
const styleMatches = [...html.matchAll(/<style(?:[^>]*)>([\s\S]*?)<\/style>/gi)];
console.log(`[+] Validating ${styleMatches.length} <style> blocks...`);

styleMatches.forEach((m, idx) => {
  const css = m[1];
  let depth = 0;
  const lines = css.split('\n');
  for (let l = 0; l < lines.length; l++) {
    const cur = lines[l];
    for (let c = 0; c < cur.length; c++) {
      if (cur[c] === '{') depth++;
      if (cur[c] === '}') depth--;
      if (depth < 0) {
        console.error(`[ERROR] Extra closing brace '}' at style block ${idx}, line ${l + 1}: "${cur.trim()}"`);
        errors++;
        depth = 0;
      }
    }
  }
  if (depth !== 0) {
    console.error(`[ERROR] Unclosed '{' in style block ${idx}: missing ${depth} closing brace(s) '}'!`);
    errors++;
  }
});

// 2. Verify JS script blocks syntax
const scriptMatches = [...html.matchAll(/<script(?:[^>]*)>([\s\S]*?)<\/script>/gi)];
console.log(`[+] Validating ${scriptMatches.length} <script> blocks...`);

scriptMatches.forEach((m, idx) => {
  const code = m[1].trim();
  if (!code) return;
  try {
    new vm.Script(code);
  } catch (err) {
    console.error(`[ERROR] JS syntax error in script block ${idx}: ${err.message}`);
    errors++;
  }
});

if (errors > 0) {
  console.error(`\n❌ [DEPLOY BLOCKED] Found ${errors} syntax error(s) in public/index.html! Fix before deploying.`);
  process.exit(1);
}

console.log('✅ [PASS] All CSS and JS blocks in public/index.html are syntactically valid and balanced.\n');
process.exit(0);
