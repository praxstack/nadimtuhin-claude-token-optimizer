import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { buildWatchDisplay } from '../src/commands/watch.js';

let tmpDir;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cto-watch-'));
  fs.mkdirSync(path.join(tmpDir, '.claude', 'sessions'), { recursive: true });
  fs.mkdirSync(path.join(tmpDir, 'docs'), { recursive: true });
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true });
});

describe('buildWatchDisplay', () => {
  it('includes timestamp in output', () => {
    const now = new Date('2026-05-20T12:34:56Z');
    const out = buildWatchDisplay(tmpDir, now);
    assert.ok(out.includes('2026-05-20 12:34:56'), `expected timestamp, got: ${out.slice(0, 60)}`);
  });

  it('shows zero tokens when no files exist', () => {
    const out = buildWatchDisplay(tmpDir);
    assert.ok(out.includes('CLAUDE.md'));
    assert.ok(out.includes('0 tokens') || out.match(/\s+0\s+tokens/), `expected 0 tokens: ${out.slice(0, 200)}`);
  });

  it('shows token count when CLAUDE.md exists', () => {
    fs.writeFileSync(path.join(tmpDir, 'CLAUDE.md'), 'Hello world this is a test. '.repeat(20));
    const out = buildWatchDisplay(tmpDir);
    // Token count should be > 0
    const match = out.match(/CLAUDE\.md\s+(\d+)\s+tokens/);
    assert.ok(match, `expected token count in output: ${out.slice(0, 300)}`);
    assert.ok(parseInt(match[1]) > 0, `expected > 0 tokens, got ${match[1]}`);
  });

  it('includes total line', () => {
    const out = buildWatchDisplay(tmpDir);
    assert.ok(out.includes('Total:'), `expected Total line: ${out}`);
  });

  it('shows target in bar chart row', () => {
    const out = buildWatchDisplay(tmpDir);
    assert.ok(out.includes('target: 450'), `expected target in CLAUDE.md row: ${out}`);
  });

  it('no session writes section when write-log absent', () => {
    const out = buildWatchDisplay(tmpDir);
    assert.ok(!out.includes('Session writes'), `expected no session writes section: ${out}`);
  });

  it('shows session writes section when write-log exists', () => {
    const logContent = `| writes | count | time |\n|--------|-------|------|\n| src/commands/init.js | 847 | 2 min ago |\n| tests/init.test.js | 312 | 3 min ago |\n`;
    fs.writeFileSync(path.join(tmpDir, '.claude', 'sessions', 'write-log.md'), logContent);
    const out = buildWatchDisplay(tmpDir);
    assert.ok(out.includes('Session writes'), `expected session writes section: ${out}`);
  });

  it('shows bar chart characters', () => {
    fs.writeFileSync(path.join(tmpDir, 'CLAUDE.md'), 'x '.repeat(200));
    const out = buildWatchDisplay(tmpDir);
    assert.ok(out.includes('█') || out.includes('░'), `expected bar chart chars: ${out.slice(0, 300)}`);
  });

  it('includes Ctrl+C prompt', () => {
    const out = buildWatchDisplay(tmpDir);
    assert.ok(out.includes('Ctrl+C'), `expected Ctrl+C prompt: ${out.slice(-100)}`);
  });

  it('token count updates when file changes', () => {
    fs.writeFileSync(path.join(tmpDir, 'CLAUDE.md'), 'short');
    const out1 = buildWatchDisplay(tmpDir);
    fs.writeFileSync(path.join(tmpDir, 'CLAUDE.md'), 'much longer content here '.repeat(50));
    const out2 = buildWatchDisplay(tmpDir);
    const m1 = out1.match(/CLAUDE\.md\s+(\d+)\s+tokens/);
    const m2 = out2.match(/CLAUDE\.md\s+(\d+)\s+tokens/);
    assert.ok(m1 && m2, 'expected token counts in both outputs');
    assert.ok(parseInt(m2[1]) > parseInt(m1[1]), `expected more tokens after bigger file: ${m1[1]} vs ${m2[1]}`);
  });

  it('docs/INDEX.md row has no target', () => {
    const out = buildWatchDisplay(tmpDir);
    const lines = out.split('\n');
    const indexLine = lines.find(l => l.includes('docs/INDEX.md'));
    assert.ok(indexLine, 'expected docs/INDEX.md row');
    assert.ok(!indexLine.includes('target:'), `expected no target for INDEX.md: ${indexLine}`);
  });
});
