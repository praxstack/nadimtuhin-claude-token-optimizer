import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const CTO = path.join(ROOT, 'bin', 'cto.js');
const INSTALL_DIR = path.join(ROOT, '.claude', 'hooks');

function cto(args) {
  return execSync(`node "${CTO}" ${args}`, { cwd: ROOT, encoding: 'utf8' });
}

describe('cto hooks', () => {
  after(() => {
    // Clean up any hooks installed during tests
    if (fs.existsSync(INSTALL_DIR)) {
      fs.readdirSync(INSTALL_DIR).forEach(f => {
        if (f.endsWith('.sh')) fs.unlinkSync(path.join(INSTALL_DIR, f));
      });
    }
  });

  it('list shows all templates', () => {
    const out = cto('hooks list');
    assert.ok(out.includes('pre-tool-token-guard'), 'should list pre-tool-token-guard');
    assert.ok(out.includes('pre-tool-read-guard'), 'should list pre-tool-read-guard');
    assert.ok(out.includes('post-write-token-diff'), 'should list post-write-token-diff');
    assert.ok(out.includes('user-prompt-inject-context'), 'should list user-prompt-inject-context');
    assert.ok(out.includes('user-prompt-validate-claude-md'), 'should list user-prompt-validate-claude-md');
    assert.ok(out.includes('PreToolUse'), 'should show event types');
    assert.ok(out.includes('UserPromptSubmit'), 'should show event types');
  });

  it('install copies hook and makes it executable', () => {
    cto('hooks install pre-tool-token-guard');
    const installed = path.join(INSTALL_DIR, 'pre-tool-token-guard.sh');
    assert.ok(fs.existsSync(installed), 'hook file should exist after install');
    const mode = fs.statSync(installed).mode;
    assert.ok(mode & 0o111, 'hook should be executable');
  });

  it('install is idempotent', () => {
    cto('hooks install pre-tool-token-guard');
    cto('hooks install pre-tool-token-guard');
    const installed = path.join(INSTALL_DIR, 'pre-tool-token-guard.sh');
    assert.ok(fs.existsSync(installed), 'hook still exists after second install');
  });

  it('list shows [installed] after install', () => {
    const out = cto('hooks list');
    assert.ok(out.includes('[installed]'), 'should show installed status');
  });

  it('status shows installed hooks', () => {
    const out = cto('hooks status');
    assert.ok(out.includes('pre-tool-token-guard'), 'status should list installed hook');
    assert.ok(out.includes('PreToolUse'), 'status should show event type');
  });

  it('remove with --yes removes the hook', () => {
    const installed = path.join(INSTALL_DIR, 'pre-tool-token-guard.sh');
    assert.ok(fs.existsSync(installed), 'hook should exist before remove');
    cto('hooks remove pre-tool-token-guard --yes');
    assert.ok(!fs.existsSync(installed), 'hook should not exist after remove');
  });

  it('install unknown hook exits non-zero', () => {
    assert.throws(
      () => cto('hooks install nonexistent-hook'),
      /Command failed/,
      'should fail for unknown hook name'
    );
  });

  it('install --all installs every template', () => {
    cto('hooks install --all');
    const templates = fs.readdirSync(path.join(ROOT, 'templates', 'hooks'))
      .filter(f => f.endsWith('.sh'));
    for (const f of templates) {
      assert.ok(
        fs.existsSync(path.join(INSTALL_DIR, f)),
        `${f} should be installed after --all`
      );
    }
  });

  it('settings outputs valid JSON with hooks grouped by event', () => {
    cto('hooks install --all');
    const out = cto('hooks settings');
    let parsed;
    assert.doesNotThrow(() => { parsed = JSON.parse(out); }, 'settings output should be valid JSON');
    assert.ok(parsed.hooks, 'should have hooks key');
    const events = Object.keys(parsed.hooks);
    assert.ok(events.includes('PreToolUse'), 'should include PreToolUse');
    assert.ok(events.includes('PostToolUse'), 'should include PostToolUse');
    assert.ok(events.includes('Stop'), 'should include Stop');
    assert.ok(events.includes('UserPromptSubmit'), 'should include UserPromptSubmit');
  });

  it('settings outputs no extra text (pipe-safe)', () => {
    cto('hooks install --all');
    const out = cto('hooks settings');
    // Should parse as pure JSON with no trailing text
    assert.doesNotThrow(() => JSON.parse(out), 'output must be pure JSON when piped');
  });
});
