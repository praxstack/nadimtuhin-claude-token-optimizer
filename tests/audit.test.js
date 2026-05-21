import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { runAudit, applyFixes } from '../src/commands/audit.js';

let tmpDir;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cto-audit-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true });
});

function writeFile(rel, content) {
  const full = path.join(tmpDir, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content, 'utf8');
}

function findCheck(results, labelFragment) {
  return results.find(r => r.label.includes(labelFragment));
}

describe('runAudit', () => {
  it('fails error when CLAUDE.md missing', () => {
    const results = runAudit(tmpDir);
    const r = findCheck(results, 'CLAUDE.md present');
    assert.strictEqual(r.pass, false);
    assert.strictEqual(r.severity, 'error');
  });

  it('passes when CLAUDE.md present', () => {
    writeFile('CLAUDE.md', 'Short content under 600 tokens.');
    const results = runAudit(tmpDir);
    const r = findCheck(results, 'CLAUDE.md present');
    assert.strictEqual(r.pass, true);
  });

  it('warns when CLAUDE.md token count >= 600', () => {
    writeFile('CLAUDE.md', 'word '.repeat(600));
    const results = runAudit(tmpDir);
    const r = findCheck(results, 'token count');
    assert.strictEqual(r.pass, false);
    assert.strictEqual(r.severity, 'warning');
  });

  it('passes token count when CLAUDE.md is short', () => {
    writeFile('CLAUDE.md', 'Short content.');
    const results = runAudit(tmpDir);
    const r = findCheck(results, 'token count');
    assert.strictEqual(r.pass, true);
  });

  it('warns when CLAUDE.md has ## Completed section', () => {
    writeFile('CLAUDE.md', '# Project\n\n## Completed\n\n- task 1\n');
    const results = runAudit(tmpDir);
    const r = findCheck(results, 'No completed tasks');
    assert.strictEqual(r.pass, false);
    assert.strictEqual(r.severity, 'warning');
  });

  it('warns when CLAUDE.md has ## Done section', () => {
    writeFile('CLAUDE.md', '# Project\n\n## Done\n\n- task 1\n');
    const results = runAudit(tmpDir);
    const r = findCheck(results, 'No completed tasks');
    assert.strictEqual(r.pass, false);
  });

  it('passes no-completed check when CLAUDE.md is clean', () => {
    writeFile('CLAUDE.md', '# Project\n\n## Overview\n\nLooks good.\n');
    const results = runAudit(tmpDir);
    const r = findCheck(results, 'No completed tasks');
    assert.strictEqual(r.pass, true);
  });

  it('warns when CLAUDE.md has date headers', () => {
    writeFile('CLAUDE.md', '# Project\n\n## 2026-05-20\n\nSession notes here.\n');
    const results = runAudit(tmpDir);
    const r = findCheck(results, 'No session notes');
    assert.strictEqual(r.pass, false);
    assert.strictEqual(r.severity, 'warning');
  });

  it('info fail when .claudeignore missing', () => {
    writeFile('CLAUDE.md', 'Short content.');
    const results = runAudit(tmpDir);
    const r = findCheck(results, '.claudeignore present');
    assert.strictEqual(r.pass, false);
    assert.strictEqual(r.severity, 'info');
  });

  it('passes .claudeignore check when file present', () => {
    writeFile('CLAUDE.md', 'Short.');
    writeFile('.claudeignore', '.claude/sessions/**\n');
    const results = runAudit(tmpDir);
    const r = findCheck(results, '.claudeignore present');
    assert.strictEqual(r.pass, true);
  });

  it('warns when .claudeignore does not cover sessions', () => {
    writeFile('CLAUDE.md', 'Short.');
    writeFile('.claudeignore', 'node_modules/**\n');
    const results = runAudit(tmpDir);
    const r = findCheck(results, '.claudeignore covers');
    assert.strictEqual(r.pass, false);
    assert.strictEqual(r.severity, 'warning');
  });

  it('passes sessions coverage when .claudeignore includes sessions path', () => {
    writeFile('CLAUDE.md', 'Short.');
    writeFile('.claudeignore', '.claude/sessions/**\n');
    const results = runAudit(tmpDir);
    const r = findCheck(results, '.claudeignore covers .claude/sessions/');
    assert.strictEqual(r.pass, true);
  });

  it('warns when .claudeignore does not cover completions', () => {
    writeFile('CLAUDE.md', 'Short.');
    writeFile('.claudeignore', '.claude/sessions/**\n');
    const results = runAudit(tmpDir);
    const r = findCheck(results, '.claudeignore covers .claude/completions/');
    assert.strictEqual(r.pass, false);
    assert.strictEqual(r.severity, 'warning');
  });

  it('passes completions coverage when .claudeignore includes completions path', () => {
    writeFile('CLAUDE.md', 'Short.');
    writeFile('.claudeignore', '.claude/sessions/**\n.claude/completions/**\ndocs/archive/**\n');
    const results = runAudit(tmpDir);
    const r = findCheck(results, '.claudeignore covers .claude/completions/');
    assert.strictEqual(r.pass, true);
  });

  it('warns when .claudeignore does not cover docs/archive', () => {
    writeFile('CLAUDE.md', 'Short.');
    writeFile('.claudeignore', '.claude/sessions/**\n.claude/completions/**\n');
    const results = runAudit(tmpDir);
    const r = findCheck(results, 'claudeignore covers docs/archive/');
    assert.strictEqual(r.pass, false);
    assert.strictEqual(r.severity, 'warning');
  });

  it('passes archive coverage when .claudeignore includes archive path', () => {
    writeFile('CLAUDE.md', 'Short.');
    writeFile('.claudeignore', '.claude/sessions/**\n.claude/completions/**\ndocs/archive/**\n');
    const results = runAudit(tmpDir);
    const r = findCheck(results, 'claudeignore covers docs/archive/');
    assert.strictEqual(r.pass, true);
  });

  it('info warn when README.md not in .claudeignore', () => {
    writeFile('CLAUDE.md', 'Short.');
    writeFile('.claudeignore', '.claude/sessions/**\n.claude/completions/**\ndocs/archive/**\n');
    const results = runAudit(tmpDir);
    const r = findCheck(results, 'claudeignore covers README.md');
    assert.strictEqual(r.pass, false);
    assert.strictEqual(r.severity, 'info');
  });

  it('passes README.md check when README.md in .claudeignore', () => {
    writeFile('CLAUDE.md', 'Short.');
    writeFile('.claudeignore', '.claude/sessions/**\n.claude/completions/**\ndocs/archive/**\nREADME.md\nCHANGELOG.md\nCONTRIBUTING.md\nGEMINI.md\nAGENTS.md\n.cursorrules\n.windsurfrules\n');
    const results = runAudit(tmpDir);
    const r = findCheck(results, 'claudeignore covers README.md');
    assert.strictEqual(r.pass, true);
  });

  it('info warn when CHANGELOG.md not in .claudeignore', () => {
    writeFile('CLAUDE.md', 'Short.');
    writeFile('.claudeignore', '.claude/sessions/**\n.claude/completions/**\ndocs/archive/**\nREADME.md\n');
    const results = runAudit(tmpDir);
    const r = findCheck(results, 'claudeignore covers CHANGELOG.md');
    assert.ok(r, 'should have CHANGELOG check');
    assert.strictEqual(r.pass, false);
    assert.strictEqual(r.severity, 'info');
  });

  it('passes CHANGELOG.md check when CHANGELOG.md in .claudeignore', () => {
    writeFile('CLAUDE.md', 'Short.');
    writeFile('.claudeignore', '.claude/sessions/**\n.claude/completions/**\ndocs/archive/**\nREADME.md\nCHANGELOG.md\nCONTRIBUTING.md\nGEMINI.md\nAGENTS.md\n.cursorrules\n.windsurfrules\n');
    const results = runAudit(tmpDir);
    const r = findCheck(results, 'claudeignore covers CHANGELOG.md');
    assert.strictEqual(r.pass, true);
  });

  it('info when CONTRIBUTING.md not in .claudeignore', () => {
    writeFile('CLAUDE.md', 'Short.');
    writeFile('.claudeignore', '.claude/sessions/**\n.claude/completions/**\ndocs/archive/**\nREADME.md\nCHANGELOG.md\n');
    const results = runAudit(tmpDir);
    const r = findCheck(results, 'claudeignore covers CONTRIBUTING.md');
    assert.ok(r, 'should have CONTRIBUTING.md check');
    assert.strictEqual(r.pass, false);
    assert.strictEqual(r.severity, 'info');
  });

  it('passes CONTRIBUTING.md check when in .claudeignore', () => {
    writeFile('CLAUDE.md', 'Short.');
    writeFile('.claudeignore', '.claude/sessions/**\n.claude/completions/**\ndocs/archive/**\nREADME.md\nCHANGELOG.md\nCONTRIBUTING.md\nGEMINI.md\nAGENTS.md\n.cursorrules\n.windsurfrules\n');
    const results = runAudit(tmpDir);
    const r = findCheck(results, 'claudeignore covers CONTRIBUTING.md');
    assert.strictEqual(r.pass, true);
  });

  it('info when GEMINI.md not in .claudeignore', () => {
    writeFile('CLAUDE.md', 'Short.');
    writeFile('.claudeignore', '.claude/sessions/**\n.claude/completions/**\ndocs/archive/**\nREADME.md\nCHANGELOG.md\nCONTRIBUTING.md\n');
    const results = runAudit(tmpDir);
    const r = findCheck(results, 'claudeignore covers GEMINI.md');
    assert.ok(r, 'should have GEMINI.md check');
    assert.strictEqual(r.pass, false);
    assert.strictEqual(r.severity, 'info');
  });

  it('passes GEMINI.md check when in .claudeignore', () => {
    writeFile('CLAUDE.md', 'Short.');
    writeFile('.claudeignore', '.claude/sessions/**\n.claude/completions/**\ndocs/archive/**\nREADME.md\nCHANGELOG.md\nCONTRIBUTING.md\nGEMINI.md\nAGENTS.md\n.cursorrules\n.windsurfrules\n');
    const results = runAudit(tmpDir);
    const r = findCheck(results, 'claudeignore covers GEMINI.md');
    assert.strictEqual(r.pass, true);
  });

  it('info when AGENTS.md not in .claudeignore', () => {
    writeFile('CLAUDE.md', 'Short.');
    writeFile('.claudeignore', '.claude/sessions/**\n.claude/completions/**\ndocs/archive/**\nREADME.md\nCHANGELOG.md\nCONTRIBUTING.md\n');
    const results = runAudit(tmpDir);
    const r = findCheck(results, 'claudeignore covers AGENTS.md');
    assert.ok(r, 'should have AGENTS.md check');
    assert.strictEqual(r.pass, false);
    assert.strictEqual(r.severity, 'info');
  });

  it('passes AGENTS.md check when in .claudeignore', () => {
    writeFile('CLAUDE.md', 'Short.');
    writeFile('.claudeignore', '.claude/sessions/**\n.claude/completions/**\ndocs/archive/**\nREADME.md\nCHANGELOG.md\nCONTRIBUTING.md\nGEMINI.md\nAGENTS.md\n.cursorrules\n.windsurfrules\n');
    const results = runAudit(tmpDir);
    const r = findCheck(results, 'claudeignore covers AGENTS.md');
    assert.strictEqual(r.pass, true);
  });

  it('info warn when .cursorrules not in .claudeignore', () => {
    writeFile('CLAUDE.md', 'Short.');
    writeFile('.claudeignore', '.claude/sessions/**\n.claude/completions/**\ndocs/archive/**\nREADME.md\nCHANGELOG.md\nCONTRIBUTING.md\nGEMINI.md\nAGENTS.md\n');
    const results = runAudit(tmpDir);
    const r = findCheck(results, 'claudeignore covers .cursorrules');
    assert.ok(r, 'should have .cursorrules check');
    assert.strictEqual(r.pass, false);
    assert.strictEqual(r.severity, 'info');
  });

  it('passes .cursorrules check when in .claudeignore', () => {
    writeFile('CLAUDE.md', 'Short.');
    writeFile('.claudeignore', '.claude/sessions/**\n.claude/completions/**\ndocs/archive/**\nREADME.md\nCHANGELOG.md\nCONTRIBUTING.md\nGEMINI.md\nAGENTS.md\n.cursorrules\n.windsurfrules\n');
    const results = runAudit(tmpDir);
    const r = findCheck(results, 'claudeignore covers .cursorrules');
    assert.strictEqual(r.pass, true);
  });

  it('info warn when .windsurfrules not in .claudeignore', () => {
    writeFile('CLAUDE.md', 'Short.');
    writeFile('.claudeignore', '.claude/sessions/**\n.claude/completions/**\ndocs/archive/**\nREADME.md\nCHANGELOG.md\nCONTRIBUTING.md\nGEMINI.md\nAGENTS.md\n.cursorrules\n');
    const results = runAudit(tmpDir);
    const r = findCheck(results, 'claudeignore covers .windsurfrules');
    assert.ok(r, 'should have .windsurfrules check');
    assert.strictEqual(r.pass, false);
    assert.strictEqual(r.severity, 'info');
  });

  it('passes .windsurfrules check when in .claudeignore', () => {
    writeFile('CLAUDE.md', 'Short.');
    writeFile('.claudeignore', '.claude/sessions/**\n.claude/completions/**\ndocs/archive/**\nREADME.md\nCHANGELOG.md\nCONTRIBUTING.md\nGEMINI.md\nAGENTS.md\n.cursorrules\n.windsurfrules\n');
    const results = runAudit(tmpDir);
    const r = findCheck(results, 'claudeignore covers .windsurfrules');
    assert.strictEqual(r.pass, true);
  });

  it('info warn when .clinerules not in .claudeignore', () => {
    writeFile('CLAUDE.md', 'Short.');
    writeFile('.claudeignore', '.claude/sessions/**\n.claude/completions/**\ndocs/archive/**\nREADME.md\nCHANGELOG.md\nCONTRIBUTING.md\nGEMINI.md\nAGENTS.md\n.cursorrules\n.windsurfrules\n');
    const results = runAudit(tmpDir);
    const r = findCheck(results, 'claudeignore covers .clinerules');
    assert.ok(r, 'should have .clinerules check');
    assert.strictEqual(r.pass, false);
    assert.strictEqual(r.severity, 'info');
  });

  it('passes .clinerules check when in .claudeignore', () => {
    writeFile('CLAUDE.md', 'Short.');
    writeFile('.claudeignore', '.claude/sessions/**\n.claude/completions/**\ndocs/archive/**\nREADME.md\nCHANGELOG.md\nCONTRIBUTING.md\nGEMINI.md\nAGENTS.md\n.cursorrules\n.windsurfrules\n.clinerules\n.roomodes\n');
    const results = runAudit(tmpDir);
    const r = findCheck(results, 'claudeignore covers .clinerules');
    assert.strictEqual(r.pass, true);
  });

  it('info warn when .roomodes not in .claudeignore', () => {
    writeFile('CLAUDE.md', 'Short.');
    writeFile('.claudeignore', '.claude/sessions/**\n.claude/completions/**\ndocs/archive/**\nREADME.md\nCHANGELOG.md\nCONTRIBUTING.md\nGEMINI.md\nAGENTS.md\n.cursorrules\n.windsurfrules\n.clinerules\n');
    const results = runAudit(tmpDir);
    const r = findCheck(results, 'claudeignore covers .roomodes');
    assert.ok(r, 'should have .roomodes check');
    assert.strictEqual(r.pass, false);
    assert.strictEqual(r.severity, 'info');
  });

  it('passes .roomodes check when in .claudeignore', () => {
    writeFile('CLAUDE.md', 'Short.');
    writeFile('.claudeignore', '.claude/sessions/**\n.claude/completions/**\ndocs/archive/**\nREADME.md\nCHANGELOG.md\nCONTRIBUTING.md\nGEMINI.md\nAGENTS.md\n.cursorrules\n.windsurfrules\n.clinerules\n.roomodes\n');
    const results = runAudit(tmpDir);
    const r = findCheck(results, 'claudeignore covers .roomodes');
    assert.strictEqual(r.pass, true);
  });

  it('info fail when essential files missing', () => {
    writeFile('CLAUDE.md', 'Short.');
    const results = runAudit(tmpDir);
    const r = findCheck(results, 'Essential files');
    assert.strictEqual(r.pass, false);
    assert.strictEqual(r.severity, 'info');
  });

  it('passes essential files when all 3 present', () => {
    writeFile('CLAUDE.md', 'Short.');
    writeFile('.claude/COMMON_MISTAKES.md', 'content');
    writeFile('.claude/QUICK_START.md', 'content');
    writeFile('.claude/ARCHITECTURE_MAP.md', 'content');
    const results = runAudit(tmpDir);
    const r = findCheck(results, 'Essential files present (3/3)');
    assert.strictEqual(r.pass, true);
  });

  it('info fail when docs/INDEX.md missing', () => {
    writeFile('CLAUDE.md', 'Short.');
    const results = runAudit(tmpDir);
    const r = findCheck(results, 'docs/INDEX.md');
    assert.strictEqual(r.pass, false);
    assert.strictEqual(r.severity, 'info');
  });

  it('passes docs/INDEX.md check when present', () => {
    writeFile('CLAUDE.md', 'Short.');
    writeFile('docs/INDEX.md', 'content');
    const results = runAudit(tmpDir);
    const r = findCheck(results, 'docs/INDEX.md');
    assert.strictEqual(r.pass, true);
  });
});

describe('summary filtering', () => {
  it('info-only failures: no errors, no warnings, but infos > 0', () => {
    // Only CLAUDE.md + .claudeignore with sessions+completions coverage — triggers info checks only
    writeFile('CLAUDE.md', 'Short content.');
    writeFile('.claudeignore', '.claude/sessions/**\n.claude/completions/**\ndocs/archive/**\n');
    const results = runAudit(tmpDir);
    const errors = results.filter(r => !r.pass && r.severity === 'error');
    const warnings = results.filter(r => !r.pass && r.severity === 'warning');
    const infos = results.filter(r => !r.pass && r.severity === 'info');
    assert.strictEqual(errors.length, 0, 'no errors expected');
    assert.strictEqual(warnings.length, 0, 'no warnings expected');
    assert.ok(infos.length > 0, 'should have info-level failures (missing essential files + docs/INDEX.md)');
  });

  it('all checks pass when all files present and clean', () => {
    writeFile('CLAUDE.md', 'Short content.');
    writeFile('.claudeignore', '.claude/sessions/**\n.claude/completions/**\ndocs/archive/**\nREADME.md\nCHANGELOG.md\nCONTRIBUTING.md\nGEMINI.md\nAGENTS.md\n.cursorrules\n.windsurfrules\n.clinerules\n.roomodes\n');
    writeFile('.claude/COMMON_MISTAKES.md', 'content');
    writeFile('.claude/QUICK_START.md', 'content');
    writeFile('.claude/ARCHITECTURE_MAP.md', 'content');
    writeFile('docs/INDEX.md', 'content');
    const results = runAudit(tmpDir);
    const failures = results.filter(r => !r.pass);
    assert.strictEqual(failures.length, 0, 'all checks should pass');
  });
});

describe('json output fields', () => {
  it('infos count matches info-level failures', () => {
    writeFile('CLAUDE.md', 'Short content.');
    writeFile('.claudeignore', '.claude/sessions/**\n');
    const results = runAudit(tmpDir);
    const infos = results.filter(r => !r.pass && r.severity === 'info');
    assert.ok(infos.length > 0, 'precondition: should have info failures');
    assert.strictEqual(infos.length, 11, 'expected 11 info failures: essential-files + docs/INDEX.md + README.md + CHANGELOG.md + CONTRIBUTING.md + GEMINI.md + AGENTS.md + .cursorrules + .windsurfrules + .clinerules + .roomodes not excluded');
  });

  it('infos count is 0 when all files present', () => {
    writeFile('CLAUDE.md', 'Short content.');
    writeFile('.claudeignore', '.claude/sessions/**\n.claude/completions/**\ndocs/archive/**\nREADME.md\nCHANGELOG.md\nCONTRIBUTING.md\nGEMINI.md\nAGENTS.md\n.cursorrules\n.windsurfrules\n.clinerules\n.roomodes\n');
    writeFile('.claude/COMMON_MISTAKES.md', 'content');
    writeFile('.claude/QUICK_START.md', 'content');
    writeFile('.claude/ARCHITECTURE_MAP.md', 'content');
    writeFile('docs/INDEX.md', 'content');
    const results = runAudit(tmpDir);
    const infos = results.filter(r => !r.pass && r.severity === 'info');
    assert.strictEqual(infos.length, 0, 'no info failures expected when all files present and README.md excluded');
  });

  it('errors, warnings, infos are mutually exclusive categories', () => {
    writeFile('CLAUDE.md', 'Short content.');
    writeFile('.claudeignore', '.claude/sessions/**\n');
    const results = runAudit(tmpDir);
    const errors = results.filter(r => !r.pass && r.severity === 'error');
    const warnings = results.filter(r => !r.pass && r.severity === 'warning');
    const infos = results.filter(r => !r.pass && r.severity === 'info');
    const total = errors.length + warnings.length + infos.length;
    const allFailing = results.filter(r => !r.pass);
    assert.strictEqual(total, allFailing.length, 'all failures should be categorized');
  });
});

describe('applyFixes', () => {
  it('creates CLAUDE.md when missing', () => {
    const results = runAudit(tmpDir);
    applyFixes(tmpDir, results);
    assert.ok(fs.existsSync(path.join(tmpDir, 'CLAUDE.md')), 'CLAUDE.md should be created');
  });

  it('creates .claudeignore when missing', () => {
    const results = runAudit(tmpDir);
    applyFixes(tmpDir, results);
    assert.ok(fs.existsSync(path.join(tmpDir, '.claudeignore')), '.claudeignore should be created');
  });

  it('creates all 3 essential files when missing', () => {
    const results = runAudit(tmpDir);
    applyFixes(tmpDir, results);
    for (const f of ['.claude/COMMON_MISTAKES.md', '.claude/QUICK_START.md', '.claude/ARCHITECTURE_MAP.md']) {
      assert.ok(fs.existsSync(path.join(tmpDir, f)), `${f} should be created`);
    }
  });

  it('creates docs/INDEX.md when missing', () => {
    const results = runAudit(tmpDir);
    applyFixes(tmpDir, results);
    assert.ok(fs.existsSync(path.join(tmpDir, 'docs', 'INDEX.md')), 'docs/INDEX.md should be created');
  });

  it('does not overwrite existing CLAUDE.md', () => {
    writeFile('CLAUDE.md', 'my existing content');
    const results = runAudit(tmpDir);
    applyFixes(tmpDir, results);
    const content = fs.readFileSync(path.join(tmpDir, 'CLAUDE.md'), 'utf8');
    assert.strictEqual(content, 'my existing content');
  });

  it('after applyFixes on empty dir, no error-level failures remain', () => {
    const before = runAudit(tmpDir);
    applyFixes(tmpDir, before);
    const after = runAudit(tmpDir);
    const errors = after.filter(r => !r.pass && r.severity === 'error');
    assert.strictEqual(errors.length, 0, `expected no errors, got: ${JSON.stringify(errors)}`);
  });

  it('returns list of created file names', () => {
    const results = runAudit(tmpDir);
    const created = applyFixes(tmpDir, results);
    assert.ok(Array.isArray(created));
    assert.ok(created.length > 0, 'expected at least one file created');
  });

  it('returns empty array when nothing to fix', () => {
    // All files already exist and .claudeignore covers all patterns
    writeFile('CLAUDE.md', 'content');
    writeFile('.claudeignore', '.claude/sessions/**\n.claude/completions/**\ndocs/archive/**\nREADME.md\nCHANGELOG.md\nCONTRIBUTING.md\nGEMINI.md\nAGENTS.md\n.cursorrules\n.windsurfrules\n.clinerules\n.roomodes\n');
    writeFile('.claude/COMMON_MISTAKES.md', 'content');
    writeFile('.claude/QUICK_START.md', 'content');
    writeFile('.claude/ARCHITECTURE_MAP.md', 'content');
    writeFile('docs/INDEX.md', 'content');
    const results = runAudit(tmpDir);
    const created = applyFixes(tmpDir, results);
    assert.strictEqual(created.length, 0);
  });

  it('--fix appends README.md to .claudeignore when missing', () => {
    writeFile('CLAUDE.md', 'content');
    writeFile('.claudeignore', '.claude/sessions/**\n.claude/completions/**\ndocs/archive/**\n');
    const created = applyFixes(tmpDir, runAudit(tmpDir));
    assert.ok(created.some(c => c.includes('.claudeignore')), 'should report .claudeignore modified');
    const content = fs.readFileSync(path.join(tmpDir, '.claudeignore'), 'utf8');
    assert.ok(content.includes('README.md'), 'README.md should be in .claudeignore');
  });

  it('--fix does not duplicate README.md if already in .claudeignore', () => {
    writeFile('CLAUDE.md', 'content');
    writeFile('.claudeignore', '.claude/sessions/**\n.claude/completions/**\ndocs/archive/**\nREADME.md\nCHANGELOG.md\nCONTRIBUTING.md\nGEMINI.md\nAGENTS.md\n.cursorrules\n.windsurfrules\n.clinerules\n.roomodes\n');
    writeFile('.claude/COMMON_MISTAKES.md', 'content');
    writeFile('.claude/QUICK_START.md', 'content');
    writeFile('.claude/ARCHITECTURE_MAP.md', 'content');
    writeFile('docs/INDEX.md', 'content');
    const created = applyFixes(tmpDir, runAudit(tmpDir));
    assert.ok(!created.some(c => c.includes('.claudeignore')), 'should not modify already-correct .claudeignore');
    const lines = fs.readFileSync(path.join(tmpDir, '.claudeignore'), 'utf8').split('\n').filter(l => l.trim() === 'README.md');
    assert.strictEqual(lines.length, 1, 'README.md should appear exactly once');
  });

  it('--fix appends .claude/sessions/** when missing', () => {
    writeFile('CLAUDE.md', 'content');
    writeFile('.claudeignore', '.claude/completions/**\ndocs/archive/**\nREADME.md\nCHANGELOG.md\nCONTRIBUTING.md\nGEMINI.md\nAGENTS.md\n');
    const created = applyFixes(tmpDir, runAudit(tmpDir));
    assert.ok(created.some(c => c.includes('sessions')), 'should report sessions added');
    const content = fs.readFileSync(path.join(tmpDir, '.claudeignore'), 'utf8');
    assert.ok(content.includes('.claude/sessions/**'));
  });

  it('--fix appends .claude/completions/** when missing', () => {
    writeFile('CLAUDE.md', 'content');
    writeFile('.claudeignore', '.claude/sessions/**\ndocs/archive/**\nREADME.md\nCHANGELOG.md\nCONTRIBUTING.md\nGEMINI.md\nAGENTS.md\n');
    const created = applyFixes(tmpDir, runAudit(tmpDir));
    assert.ok(created.some(c => c.includes('completions')), 'should report completions added');
    const content = fs.readFileSync(path.join(tmpDir, '.claudeignore'), 'utf8');
    assert.ok(content.includes('.claude/completions/**'));
  });

  it('--fix appends docs/archive/** when missing', () => {
    writeFile('CLAUDE.md', 'content');
    writeFile('.claudeignore', '.claude/sessions/**\n.claude/completions/**\nREADME.md\nCHANGELOG.md\nCONTRIBUTING.md\nGEMINI.md\nAGENTS.md\n');
    const created = applyFixes(tmpDir, runAudit(tmpDir));
    assert.ok(created.some(c => c.includes('archive')), 'should report archive added');
    const content = fs.readFileSync(path.join(tmpDir, '.claudeignore'), 'utf8');
    assert.ok(content.includes('docs/archive/**'));
  });
});
