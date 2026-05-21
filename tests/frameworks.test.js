import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { detectFramework, getClaudeIgnore } from '../src/lib/frameworks.js';

let tmpDir;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cto-fw-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true });
});

function write(rel, content) {
  const full = path.join(tmpDir, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content, 'utf8');
}

describe('detectFramework', () => {
  it('returns null for empty directory', () => {
    assert.strictEqual(detectFramework(tmpDir), null);
  });

  it('detects nextjs from package.json dependencies', () => {
    write('package.json', JSON.stringify({ dependencies: { next: '14.0.0' } }));
    assert.strictEqual(detectFramework(tmpDir), 'nextjs');
  });

  it('detects nuxtjs from package.json', () => {
    write('package.json', JSON.stringify({ dependencies: { nuxt: '3.0.0' } }));
    assert.strictEqual(detectFramework(tmpDir), 'nuxtjs');
  });

  it('detects angular from package.json', () => {
    write('package.json', JSON.stringify({ dependencies: { '@angular/core': '17.0.0' } }));
    assert.strictEqual(detectFramework(tmpDir), 'angular');
  });

  it('detects nestjs from package.json', () => {
    write('package.json', JSON.stringify({ dependencies: { '@nestjs/core': '10.0.0' } }));
    assert.strictEqual(detectFramework(tmpDir), 'nestjs');
  });

  it('detects svelte from package.json', () => {
    write('package.json', JSON.stringify({ devDependencies: { svelte: '4.0.0' } }));
    assert.strictEqual(detectFramework(tmpDir), 'svelte');
  });

  it('detects vue from package.json', () => {
    write('package.json', JSON.stringify({ dependencies: { vue: '3.0.0' } }));
    assert.strictEqual(detectFramework(tmpDir), 'vue');
  });

  it('detects express from package.json', () => {
    write('package.json', JSON.stringify({ dependencies: { express: '4.18.0' } }));
    assert.strictEqual(detectFramework(tmpDir), 'express');
  });

  it('detects django from requirements.txt', () => {
    write('requirements.txt', 'Django==4.2\npsycopg2==2.9\n');
    assert.strictEqual(detectFramework(tmpDir), 'django');
  });

  it('detects fastapi from requirements.txt', () => {
    write('requirements.txt', 'fastapi==0.100.0\nuvicorn==0.22.0\n');
    assert.strictEqual(detectFramework(tmpDir), 'fastapi');
  });

  it('detects go from go.mod', () => {
    write('go.mod', 'module example.com/myapp\n\ngo 1.21\n');
    assert.strictEqual(detectFramework(tmpDir), 'go');
  });

  it('detects laravel from composer.json', () => {
    write('composer.json', JSON.stringify({ require: { 'laravel/framework': '^10.0' } }));
    assert.strictEqual(detectFramework(tmpDir), 'laravel');
  });

  it('detects rails from Gemfile', () => {
    write('Gemfile', "source 'https://rubygems.org'\ngem 'rails', '~> 7.1'\n");
    assert.strictEqual(detectFramework(tmpDir), 'rails');
  });

  it('next takes priority over other node deps', () => {
    write('package.json', JSON.stringify({ dependencies: { next: '14.0.0', vue: '3.0.0' } }));
    assert.strictEqual(detectFramework(tmpDir), 'nextjs');
  });

  it('falls back to null for unknown package.json', () => {
    write('package.json', JSON.stringify({ dependencies: { lodash: '4.0.0' } }));
    assert.strictEqual(detectFramework(tmpDir), null);
  });
});

describe('getClaudeIgnore — enriched patterns', () => {
  it('nextjs ignore contains snapshot patterns', () => {
    const content = getClaudeIgnore('nextjs');
    assert.ok(content.includes('*.snap'));
    assert.ok(content.includes('__snapshots__'));
  });

  it('express ignore contains *.min.js', () => {
    const content = getClaudeIgnore('express');
    assert.ok(content.includes('*.min.js'));
  });

  it('django ignore contains migrations pattern', () => {
    const content = getClaudeIgnore('django');
    assert.ok(content.includes('migrations'));
  });

  it('go ignore contains *.pb.go', () => {
    const content = getClaudeIgnore('go');
    assert.ok(content.includes('*.pb.go'));
  });

  it('laravel ignore contains *.lock', () => {
    const content = getClaudeIgnore('laravel');
    assert.ok(content.includes('*.lock'));
  });
});

describe('getClaudeIgnore — base patterns', () => {
  it('base ignore contains user-facing doc exclusions', () => {
    const content = getClaudeIgnore(null);
    assert.ok(content.includes('README.md'), 'should exclude README.md');
    assert.ok(content.includes('CHANGELOG.md'), 'should exclude CHANGELOG.md');
    assert.ok(content.includes('CONTRIBUTING.md'), 'should exclude CONTRIBUTING.md');
    assert.ok(content.includes('GEMINI.md'), 'should exclude GEMINI.md');
    assert.ok(content.includes('AGENTS.md'), 'should exclude AGENTS.md');
    assert.ok(content.includes('.cursorrules'), 'should exclude .cursorrules');
    assert.ok(content.includes('.windsurfrules'), 'should exclude .windsurfrules');
    assert.ok(content.includes('.clinerules'), 'should exclude .clinerules');
    assert.ok(content.includes('.roomodes'), 'should exclude .roomodes');
  });

  it('framework-specific ignore inherits base user-facing doc exclusions', () => {
    const content = getClaudeIgnore('express');
    assert.ok(content.includes('README.md'), 'express should inherit README.md exclusion');
    assert.ok(content.includes('CONTRIBUTING.md'), 'express should inherit CONTRIBUTING.md exclusion');
  });
});
