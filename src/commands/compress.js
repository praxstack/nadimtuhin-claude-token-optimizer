import chalk from 'chalk';
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { countTokens } from '../lib/tokenizer.js';

const LANG_SHORT = {
  javascript: 'js',
  typescript: 'ts',
  python: 'py',
  ruby: 'rb',
  golang: 'go',
  shell: 'sh',
  dockerfile: 'docker',
};

export function removeExtraBlankLines(content) {
  return content.replace(/\n{3,}/g, '\n\n');
}

export function shortenCodeFences(content) {
  return content.replace(/^(```)(javascript|typescript|python|ruby|golang|shell|dockerfile)$/gm,
    (_, fence, lang) => fence + (LANG_SHORT[lang] ?? lang));
}

export function truncateLongLists(content, maxItems = 3) {
  const changes = [];
  // Find bullet list blocks (consecutive lines starting with - or *)
  const result = content.replace(
    /((?:^[ \t]*[-*] .+\n){6,})/gm,
    (block) => {
      const lines = block.split('\n').filter(Boolean);
      if (lines.length <= maxItems) return block;
      const kept = lines.slice(0, maxItems);
      const dropped = lines.length - maxItems;
      changes.push(`Truncated list (kept ${maxItems} of ${lines.length} items)`);
      return kept.join('\n') + `\n- # ... ${dropped} more\n`;
    },
  );
  return { result, changes };
}

export function applyCompressionRules(content, aggressive = false) {
  const changes = [];
  let result = content;

  // Rule 1: duplicate blank lines
  const before1 = result;
  result = removeExtraBlankLines(result);
  const blanksRemoved = (before1.match(/\n{3,}/g) ?? []).length;
  if (blanksRemoved > 0) changes.push(`Removed ${blanksRemoved} extra blank line block${blanksRemoved > 1 ? 's' : ''}`);

  // Rule 2: verbose code fence labels
  const before2 = result;
  result = shortenCodeFences(result);
  const fencesShortened = (before2.match(/^```(javascript|typescript|python|ruby|golang|shell|dockerfile)$/gm) ?? []).length;
  if (fencesShortened > 0) changes.push(`Shortened ${fencesShortened} code fence label${fencesShortened > 1 ? 's' : ''}`);

  // Rule 3: truncate long bullet lists (aggressive: maxItems=3, normal: maxItems=5)
  const maxItems = aggressive ? 3 : 5;
  const listResult = truncateLongLists(result, maxItems);
  result = listResult.result;
  changes.push(...listResult.changes);

  return { result, changes };
}

export async function compressCommand(options) {
  const dir = process.cwd();
  const claudeMdPath = path.join(dir, 'CLAUDE.md');

  if (!fs.existsSync(claudeMdPath)) {
    console.error(chalk.red('✗ CLAUDE.md not found. Run: cto init'));
    process.exit(1);
  }

  const original = fs.readFileSync(claudeMdPath, 'utf8');
  const { result: compressed, changes } = applyCompressionRules(original, options?.aggressive);

  const beforeTokens = countTokens(original);
  const afterTokens = countTokens(compressed);
  const saved = beforeTokens - afterTokens;
  const pct = beforeTokens > 0 ? Math.round((saved / beforeTokens) * 100) : 0;

  console.log('');
  console.log(chalk.bold('cto compress — CLAUDE.md optimization'));
  console.log('');
  console.log(`  Before: ${chalk.yellow(beforeTokens)} tokens`);
  console.log(`  After:  ${chalk.green(afterTokens)} tokens (${pct}% reduction)`);
  console.log('');

  if (changes.length === 0) {
    console.log(chalk.dim('  No compression opportunities found.'));
    console.log('');
    return;
  }

  console.log('  Changes:');
  for (const c of changes) console.log(`  - ${c}`);
  console.log('');

  if (options?.dryRun) {
    console.log(chalk.dim('  --dry-run: no files written.'));
    console.log('');
    return;
  }

  if (original === compressed) {
    console.log(chalk.dim('  Content unchanged after compression.'));
    console.log('');
    return;
  }

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ans = await new Promise(resolve =>
    rl.question(chalk.blue('Apply changes? [y/N] '), resolve));
  rl.close();
  console.log('');

  if (ans.trim().toLowerCase() !== 'y') {
    console.log(chalk.dim('Skipped.'));
    console.log('');
    return;
  }

  if (options?.backup !== false) {
    fs.writeFileSync(claudeMdPath + '.bak', original, 'utf8');
    console.log(chalk.dim(`  Backup: CLAUDE.md.bak`));
  }

  fs.writeFileSync(claudeMdPath, compressed, 'utf8');
  console.log(chalk.green(`✓ Saved — ${saved} tokens freed (${pct}% reduction)`));
  console.log('');
}
