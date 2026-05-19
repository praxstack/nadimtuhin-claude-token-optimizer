import chalk from 'chalk';
import path from 'node:path';
import { scanAutoLoadFiles } from '../lib/scanner.js';
import { countTokens } from '../lib/tokenizer.js';

const OPTIMIZED_BASELINE = 1050;

export async function buildReport(dir) {
  const files = await scanAutoLoadFiles(dir);

  const fileBreakdown = files.map(f => ({
    label: path.relative(dir, f.path),
    tokens: countTokens(f.content),
  }));

  const before = fileBreakdown.reduce((sum, f) => sum + f.tokens, 0);
  const after = OPTIMIZED_BASELINE;
  const savings = before - after;

  return { before, after, savings, files: fileBreakdown };
}

export async function measureCommand() {
  const dir = process.cwd();

  console.log('');
  console.log(chalk.bold('📊 Token Audit — ' + path.basename(dir) + '/'));
  console.log('');

  const report = await buildReport(dir);

  console.log(chalk.dim('  BEFORE (current state)'));
  console.log(chalk.dim('  ' + '─'.repeat(45)));
  for (const f of report.files) {
    const label = f.label.padEnd(35);
    const tokens = f.tokens.toLocaleString().padStart(8);
    console.log(`  ${label} ${tokens} tokens`);
  }
  if (report.files.length === 0) {
    console.log(chalk.dim('  (no auto-loadable files found)'));
  }
  console.log(chalk.dim('  ' + '─'.repeat(45)));
  console.log(`  ${'Total auto-loaded:'.padEnd(35)} ${chalk.yellow(report.before.toLocaleString().padStart(8))} tokens`);

  console.log('');
  console.log(chalk.dim('  AFTER (post-init estimate)'));
  console.log(chalk.dim('  ' + '─'.repeat(45)));
  const essentials = [
    ['CLAUDE.md', 450],
    ['.claude/COMMON_MISTAKES.md', 350],
    ['.claude/QUICK_START.md', 100],
    ['.claude/ARCHITECTURE_MAP.md', 150],
  ];
  for (const [label, tokens] of essentials) {
    console.log(`  ${label.padEnd(35)} ${tokens.toLocaleString().padStart(8)} tokens`);
  }
  console.log(chalk.dim('  ' + '─'.repeat(45)));
  console.log(`  ${'Total auto-loaded:'.padEnd(35)} ${chalk.green(report.after.toLocaleString().padStart(8))} tokens`);

  console.log('');

  if (report.savings > 0) {
    const pct = Math.round((report.savings / report.before) * 100);
    console.log(chalk.green(`  💡 Savings: ${report.savings.toLocaleString()} tokens (${pct}%)`));
    console.log('');
    console.log(`  Run ${chalk.cyan('npx claude-token-optimizer init')} to apply`);
  } else if (report.before === 0) {
    console.log(chalk.dim('  Nothing to measure — directory may already be optimized or is empty.'));
  } else {
    console.log(chalk.green('  ✓ Already optimized! Token usage is within baseline.'));
  }

  console.log('');
}
