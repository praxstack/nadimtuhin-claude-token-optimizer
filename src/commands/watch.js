import chalk from 'chalk';
import fs from 'node:fs';
import path from 'node:path';
import { countTokens } from '../lib/tokenizer.js';

const WATCHED = [
  { rel: 'CLAUDE.md', target: 450 },
  { rel: '.claude/COMMON_MISTAKES.md', target: 350 },
  { rel: '.claude/QUICK_START.md', target: 100 },
  { rel: '.claude/ARCHITECTURE_MAP.md', target: 150 },
  { rel: 'docs/INDEX.md', target: null },
];

const WRITE_LOG = '.claude/sessions/write-log.md';
const BAR_WIDTH = 10;

function bar(tokens, target) {
  if (!target || target <= 0) return '          ';
  const pct = Math.min(tokens / target, 1);
  const filled = Math.round(pct * BAR_WIDTH);
  return '█'.repeat(filled) + '░'.repeat(BAR_WIDTH - filled);
}

export function buildWatchDisplay(dir, now = new Date()) {
  const ts = now.toISOString().replace('T', ' ').slice(0, 19);
  const lines = [];

  lines.push(`cto watch — token monitor  [${ts}]`);
  lines.push('');
  lines.push('Auto-loaded files:');

  let total = 0;
  let totalTarget = 0;
  for (const { rel, target } of WATCHED) {
    const abs = path.join(dir, rel);
    let tokens = 0;
    if (fs.existsSync(abs)) {
      tokens = countTokens(fs.readFileSync(abs, 'utf8'));
    }
    total += tokens;
    if (target) totalTarget += target;

    const label = rel.padEnd(34);
    const tok = String(tokens).padStart(5);
    const b = bar(tokens, target);
    const tgt = target ? `  target: ${target}` : '';
    lines.push(`  ${label} ${tok} tokens  ${b}${tgt}`);
  }

  const totalBar = bar(total, totalTarget || 1050);
  const pct = totalTarget ? Math.round((total / totalTarget) * 100) : 0;
  lines.push('');
  lines.push(`  ${'Total:'.padEnd(34)} ${String(total).padStart(5)} / ${totalTarget} tokens  ${totalBar}  ${pct}% of target`);

  const writeLog = path.join(dir, WRITE_LOG);
  if (fs.existsSync(writeLog)) {
    lines.push('');
    lines.push('Session writes (from hook log):');
    const logContent = fs.readFileSync(writeLog, 'utf8');
    const entries = [...logContent.matchAll(/^\|\s+([^|]+?)\s+\|\s+(\d+)\s+\|\s+([^|]+?)\s+\|/gm)];
    const recent = entries.slice(-5).reverse();
    for (const [, filePath, tokStr, time] of recent) {
      const label = filePath.trim().padEnd(34);
      const tok = String(tokStr).padStart(5);
      lines.push(`  ${label} ${tok} tokens  (${time.trim()})`);
    }
  }

  lines.push('');
  lines.push('Press Ctrl+C to stop');

  return lines.join('\n');
}

export async function watchCommand(options = {}) {
  const dir = process.cwd();
  const interval = options.interval ? parseInt(options.interval, 10) * 1000 : null;

  let debounce = null;

  function redraw() {
    process.stdout.write('\x1b[2J\x1b[H');
    process.stdout.write(buildWatchDisplay(dir) + '\n');
  }

  function scheduleRedraw() {
    if (debounce) clearTimeout(debounce);
    debounce = setTimeout(redraw, 200);
  }

  redraw();

  const watchers = [];

  if (interval) {
    const timer = setInterval(redraw, interval);
    watchers.push({ close: () => clearInterval(timer) });
  } else {
    for (const { rel } of [...WATCHED, { rel: WRITE_LOG }]) {
      const abs = path.join(dir, rel);
      try {
        const watcher = fs.watch(abs, scheduleRedraw);
        watchers.push(watcher);
      } catch {
        // file may not exist yet; that's fine
      }
    }
    // Also watch directories in case files are created
    for (const watchDir of [dir, path.join(dir, '.claude'), path.join(dir, '.claude', 'sessions'), path.join(dir, 'docs')]) {
      if (fs.existsSync(watchDir)) {
        try {
          const watcher = fs.watch(watchDir, scheduleRedraw);
          watchers.push(watcher);
        } catch {
          // ignore
        }
      }
    }
  }

  process.on('SIGINT', () => {
    if (debounce) clearTimeout(debounce);
    for (const w of watchers) w.close();
    process.stdout.write('\n');
    process.exit(0);
  });

  // Keep alive
  await new Promise(() => {});
}
