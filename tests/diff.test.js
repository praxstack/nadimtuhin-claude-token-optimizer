import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { computeDiff } from '../src/commands/diff.js';

let tmpDir;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cto-diff-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true });
});

describe('computeDiff', () => {
  it('reports token reduction when current is smaller', () => {
    const large = 'word '.repeat(200);
    const small = 'word '.repeat(100);
    const d = computeDiff(small, large);
    assert.ok(d.tokenDelta < 0, `expected negative delta, got ${d.tokenDelta}`);
    assert.ok(d.tokenPct > 0, `expected positive pct, got ${d.tokenPct}`);
    assert.ok(d.backupTokens > d.currentTokens);
  });

  it('reports token increase when current is larger', () => {
    const small = 'word '.repeat(50);
    const large = 'word '.repeat(150);
    const d = computeDiff(large, small);
    assert.ok(d.tokenDelta > 0, `expected positive delta, got ${d.tokenDelta}`);
    assert.strictEqual(d.backupTokens, computeDiff(small, small).currentTokens === 0 ? 0 : d.backupTokens);
    assert.ok(d.currentTokens > d.backupTokens);
  });

  it('reports zero delta for identical content', () => {
    const content = 'identical content here';
    const d = computeDiff(content, content);
    assert.strictEqual(d.tokenDelta, 0);
  });

  it('line delta reflects line count difference', () => {
    const backup = 'line1\nline2\nline3\nline4\nline5\n';
    const current = 'line1\nline2\n';
    const d = computeDiff(current, backup);
    assert.ok(d.lineDelta < 0, `expected negative line delta, got ${d.lineDelta}`);
    assert.strictEqual(d.backupLines, 6);
    assert.strictEqual(d.currentLines, 3);
  });

  it('pct is zero when backup has zero tokens', () => {
    const d = computeDiff('some content', '');
    assert.strictEqual(d.tokenPct, 0);
  });

  it('returns all expected fields', () => {
    const d = computeDiff('hello world', 'hello world test');
    assert.ok('currentTokens' in d);
    assert.ok('backupTokens' in d);
    assert.ok('tokenDelta' in d);
    assert.ok('tokenPct' in d);
    assert.ok('currentLines' in d);
    assert.ok('backupLines' in d);
    assert.ok('lineDelta' in d);
  });
});

describe('diffCommand integration', () => {
  it('runs without error when no .bak exists', async () => {
    fs.writeFileSync(path.join(tmpDir, 'CLAUDE.md'), 'content');
    const { diffCommand } = await import('../src/commands/diff.js');
    // Should not throw
    const origCwd = process.cwd();
    process.chdir(tmpDir);
    try {
      await diffCommand({});
    } finally {
      process.chdir(origCwd);
    }
  });

  it('runs without error when .bak exists', async () => {
    fs.writeFileSync(path.join(tmpDir, 'CLAUDE.md'), 'shorter content');
    fs.writeFileSync(path.join(tmpDir, 'CLAUDE.md.bak'), 'much longer content here '.repeat(20));
    const { diffCommand } = await import('../src/commands/diff.js');
    const origCwd = process.cwd();
    process.chdir(tmpDir);
    try {
      await diffCommand({});
    } finally {
      process.chdir(origCwd);
    }
  });
});
