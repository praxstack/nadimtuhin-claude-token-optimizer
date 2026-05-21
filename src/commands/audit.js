import chalk from 'chalk';
import fs from 'node:fs';
import path from 'node:path';
import { countTokens } from '../lib/tokenizer.js';
import { getClaudeIgnore } from '../lib/frameworks.js';
import {
  buildClaudeMd, buildCommonMistakesMd, buildQuickStartMd,
  buildArchitectureMapMd, buildDocsIndexMd,
} from './init.js';

const ESSENTIAL_FILES = [
  '.claude/COMMON_MISTAKES.md',
  '.claude/QUICK_START.md',
  '.claude/ARCHITECTURE_MAP.md',
];

function check(label, pass, severity, detail, fixKey = null) {
  return { label, pass, severity, detail, fixKey };
}

const FILE_EXCLUSIONS = [
  { filename: 'README.md',       fixKey: 'readme-exclude',       hint: 'typical README = 1,000–10,000 tokens' },
  { filename: 'CHANGELOG.md',    fixKey: 'changelog-exclude',    hint: 'typical CHANGELOG = 2,000–8,000 tokens' },
  { filename: 'CONTRIBUTING.md', fixKey: 'contributing-exclude', hint: 'typically 1,000–3,000 tokens' },
  { filename: 'GEMINI.md',       fixKey: 'gemini-exclude',       hint: 'Gemini Code instructions file' },
  { filename: 'AGENTS.md',       fixKey: 'agents-exclude',       hint: 'AI agent instructions file' },
  { filename: '.cursorrules',    fixKey: 'cursorrules-exclude',  hint: 'Cursor IDE rules file' },
  { filename: '.windsurfrules',  fixKey: 'windsurfrules-exclude', hint: 'Windsurf IDE rules file' },
  { filename: '.clinerules',     fixKey: 'clinerules-exclude',   hint: 'Cline AI rules file' },
  { filename: '.roomodes',       fixKey: 'roomodes-exclude',     hint: 'Roo Code modes file' },
];

function makeDirectoryFixable(pattern) {
  return (dir) => {
    const dest = path.join(dir, '.claudeignore');
    if (!fs.existsSync(dest)) return null;
    const content = fs.readFileSync(dest, 'utf8');
    const base = pattern.replace('/**', '/');
    if (content.includes(base)) return null;
    const suffix = content.endsWith('\n') ? '' : '\n';
    fs.appendFileSync(dest, `${suffix}${pattern}\n`);
    return `.claudeignore (added ${pattern})`;
  };
}

function makeExcludeFixable(filename) {
  return (dir) => {
    const dest = path.join(dir, '.claudeignore');
    if (!fs.existsSync(dest)) return null;
    const content = fs.readFileSync(dest, 'utf8');
    if (content.split('\n').some(line => line.trim() === filename || line.trim() === `/${filename}`)) return null;
    const suffix = content.endsWith('\n') ? '' : '\n';
    fs.appendFileSync(dest, `${suffix}${filename}\n`);
    return `.claudeignore (added ${filename})`;
  };
}

const FIXABLE = {
  'claude-md': (dir) => {
    const date = new Date().toISOString().split('T')[0];
    const dest = path.join(dir, 'CLAUDE.md');
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.writeFileSync(dest, buildClaudeMd('Application', 'Your stack', 'See README', date), 'utf8');
      return 'CLAUDE.md';
    }
  },
  'claudeignore': (dir) => {
    const dest = path.join(dir, '.claudeignore');
    if (!fs.existsSync(dest)) {
      fs.writeFileSync(dest, getClaudeIgnore(null), 'utf8');
      return '.claudeignore';
    }
  },
  'essential-files': (dir) => {
    const date = new Date().toISOString().split('T')[0];
    const created = [];
    const files = [
      ['.claude/COMMON_MISTAKES.md', buildCommonMistakesMd(date)],
      ['.claude/QUICK_START.md', buildQuickStartMd(date)],
      ['.claude/ARCHITECTURE_MAP.md', buildArchitectureMapMd(date)],
    ];
    for (const [rel, content] of files) {
      const dest = path.join(dir, rel);
      if (!fs.existsSync(dest)) {
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        fs.writeFileSync(dest, content, 'utf8');
        created.push(rel);
      }
    }
    return created.length ? created.join(', ') : null;
  },
  'docs-index': (dir) => {
    const date = new Date().toISOString().split('T')[0];
    const dest = path.join(dir, 'docs', 'INDEX.md');
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.writeFileSync(dest, buildDocsIndexMd(date), 'utf8');
      return 'docs/INDEX.md';
    }
  },
};

for (const { filename, fixKey } of FILE_EXCLUSIONS) {
  FIXABLE[fixKey] = makeExcludeFixable(filename);
}

FIXABLE['sessions-cover']    = makeDirectoryFixable('.claude/sessions/**');
FIXABLE['completions-cover'] = makeDirectoryFixable('.claude/completions/**');
FIXABLE['archive-cover']     = makeDirectoryFixable('docs/archive/**');

export function applyFixes(dir, results) {
  const created = [];
  for (const r of results) {
    if (!r.pass && r.fixKey && FIXABLE[r.fixKey]) {
      const result = FIXABLE[r.fixKey](dir);
      if (result) created.push(result);
    }
  }
  return created;
}

export function runAudit(dir) {
  const results = [];

  // 1. CLAUDE.md exists
  const claudeMdPath = path.join(dir, 'CLAUDE.md');
  const claudeMdExists = fs.existsSync(claudeMdPath);
  results.push(check('CLAUDE.md present', claudeMdExists, 'error',
    claudeMdExists ? null : 'Run: cto init  (or: cto audit --fix)', 'claude-md'));

  if (claudeMdExists) {
    const content = fs.readFileSync(claudeMdPath, 'utf8');
    const tokens = countTokens(content);

    // 2. Token count
    results.push(check(
      `CLAUDE.md token count (${tokens})`,
      tokens < 600,
      'warning',
      tokens >= 600 ? `${tokens} tokens — aim for < 600` : null,
    ));

    // 3. No completed-tasks section
    const hasCompleted = /^##\s+(completed|done)\b/im.test(content);
    results.push(check(
      'No completed tasks in CLAUDE.md',
      !hasCompleted,
      'warning',
      hasCompleted ? 'Move completed items to .claude/completions/' : null,
    ));

    // 4. No session date headers
    const hasDateHeaders = /^##\s+\d{4}-\d{2}-\d{2}/m.test(content);
    results.push(check(
      'No session notes in CLAUDE.md',
      !hasDateHeaders,
      'warning',
      hasDateHeaders ? 'Move session notes to .claude/sessions/' : null,
    ));
  }

  // 5. .claudeignore present
  const ignoreExists = fs.existsSync(path.join(dir, '.claudeignore'));
  results.push(check('.claudeignore present', ignoreExists, 'info',
    ignoreExists ? null : 'Run: cto init  (or: cto audit --fix)', 'claudeignore'));

  // 6. .claudeignore covers sessions + completions
  if (ignoreExists) {
    const ignoreContent = fs.readFileSync(path.join(dir, '.claudeignore'), 'utf8');
    const coversSessions = ignoreContent.includes('.claude/sessions/') ||
      ignoreContent.includes('.claude/sessions/**');
    results.push(check('.claudeignore covers .claude/sessions/', coversSessions, 'warning',
      coversSessions ? null : 'Add: .claude/sessions/** to .claudeignore', 'sessions-cover'));
    const coversCompletions = ignoreContent.includes('.claude/completions/') ||
      ignoreContent.includes('.claude/completions/**');
    results.push(check('.claudeignore covers .claude/completions/', coversCompletions, 'warning',
      coversCompletions ? null : 'Add: .claude/completions/** to .claudeignore', 'completions-cover'));
    const coversArchive = ignoreContent.includes('docs/archive/') ||
      ignoreContent.includes('docs/archive/**');
    results.push(check('claudeignore covers docs/archive/', coversArchive, 'warning',
      coversArchive ? null : 'Add: docs/archive/** to .claudeignore', 'archive-cover'));

    for (const { filename, fixKey, hint } of FILE_EXCLUSIONS) {
      const covered = ignoreContent.split('\n').some(
        line => line.trim() === filename || line.trim() === `/${filename}`
      );
      results.push(check(`claudeignore covers ${filename}`, covered, 'info',
        covered ? null : `Add ${filename} to .claudeignore — ${hint}`,
        fixKey));
    }
  }

  // 7. Essential files present
  const presentCount = ESSENTIAL_FILES.filter(f => fs.existsSync(path.join(dir, f))).length;
  results.push(check(
    `Essential files present (${presentCount}/${ESSENTIAL_FILES.length})`,
    presentCount === ESSENTIAL_FILES.length,
    'info',
    presentCount < ESSENTIAL_FILES.length ? 'Run: cto init  (or: cto audit --fix)' : null,
    'essential-files',
  ));

  // 8. docs/INDEX.md present
  const docsIndexExists = fs.existsSync(path.join(dir, 'docs', 'INDEX.md'));
  results.push(check('docs/INDEX.md present', docsIndexExists, 'info',
    docsIndexExists ? null : 'Run: cto init  (or: cto audit --fix)', 'docs-index'));

  return results;
}

export async function auditCommand(options) {
  const dir = process.cwd();
  const useColor = process.stdout.isTTY;

  const results = runAudit(dir);

  if (options?.fix) {
    const created = applyFixes(dir, results);
    if (created.length) {
      for (const f of created) {
        console.log(`🔧 Auto-fix: ${f}`);
      }
      console.log('');
    } else {
      console.log('✓ Nothing to fix.');
      return;
    }
    // Re-audit after fixes
    const fixed = runAudit(dir);
    const remaining = fixed.filter(r => !r.pass && r.severity === 'error');
    const remainingWarnings = fixed.filter(r => !r.pass && r.severity === 'warning');
    const remainingInfos = fixed.filter(r => !r.pass && r.severity === 'info');
    if (!remaining.length) {
      console.log('✓ No more errors.');
    } else {
      for (const r of remaining) {
        const msg = r.detail ? `${r.label} — ${r.detail}` : r.label;
        console.log(`  ✗ ${msg}`);
      }
    }
    if (remainingWarnings.length || remainingInfos.length) {
      const parts = [];
      if (remainingWarnings.length) parts.push(`${remainingWarnings.length} warning${remainingWarnings.length > 1 ? 's' : ''}`);
      if (remainingInfos.length) parts.push(`${remainingInfos.length} info item${remainingInfos.length > 1 ? 's' : ''}`);
      const total = remainingWarnings.length + remainingInfos.length;
      console.log(`  ${parts.join(', ')} ${total === 1 ? 'remains' : 'remain'} — run cto audit for details`);
    }
    console.log('');
    return;
  }

  const errors = results.filter(r => !r.pass && r.severity === 'error');
  const warnings = results.filter(r => !r.pass && r.severity === 'warning');
  const infos = results.filter(r => !r.pass && r.severity === 'info');

  if (options?.json) {
    process.stdout.write(JSON.stringify({ results, errors: errors.length, warnings: warnings.length, infos: infos.length }, null, 2) + '\n');
    process.exit(errors.length > 0 ? 1 : 0);
  }

  const green = s => useColor ? chalk.green(s) : s;
  const red = s => useColor ? chalk.red(s) : s;
  const yellow = s => useColor ? chalk.yellow(s) : s;
  const dim = s => useColor ? chalk.dim(s) : s;
  const bold = s => useColor ? chalk.bold(s) : s;

  console.log('');
  console.log(bold('cto audit — CLAUDE.md health report'));
  console.log('');

  for (const r of results) {
    const icon = r.pass ? green('✓') : r.severity === 'error' ? red('✗') : yellow('⚠');
    const label = r.pass ? r.label : r.detail ? `${r.label} — ${r.detail}` : r.label;
    console.log(`  ${icon} ${label}`);
  }

  console.log('');
  const summary = [];
  if (errors.length) summary.push(red(`${errors.length} error${errors.length > 1 ? 's' : ''}`));
  if (warnings.length) summary.push(yellow(`${warnings.length} warning${warnings.length > 1 ? 's' : ''}`));
  if (infos.length) summary.push(dim(`${infos.length} info item${infos.length > 1 ? 's' : ''}`));
  if (!summary.length) summary.push(green('all checks passed'));
  console.log(summary.join(', '));
  const fixable = results.filter(r => !r.pass && r.fixKey);
  if (fixable.length) {
    console.log(dim(`  → Run cto audit --fix to resolve ${fixable.length} fixable issue${fixable.length > 1 ? 's' : ''}`));
  }
  console.log('');

  if (errors.length > 0) process.exit(1);
}
