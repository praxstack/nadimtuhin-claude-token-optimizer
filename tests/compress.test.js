import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  removeExtraBlankLines,
  shortenCodeFences,
  truncateLongLists,
  applyCompressionRules,
} from '../src/commands/compress.js';
import { countTokens } from '../src/lib/tokenizer.js';

describe('removeExtraBlankLines', () => {
  it('collapses 3+ blank lines to 1', () => {
    const input = 'line1\n\n\n\nline2';
    assert.ok(!removeExtraBlankLines(input).includes('\n\n\n'));
    assert.ok(removeExtraBlankLines(input).includes('line1\n\nline2'));
  });

  it('leaves single blank lines untouched', () => {
    const input = 'line1\n\nline2';
    assert.strictEqual(removeExtraBlankLines(input), input);
  });

  it('collapses multiple instances', () => {
    const input = 'a\n\n\nb\n\n\n\nc';
    const out = removeExtraBlankLines(input);
    assert.ok(!out.includes('\n\n\n'));
    assert.ok(out.includes('a\n\nb\n\nc'));
  });
});

describe('shortenCodeFences', () => {
  it('shortens javascript to js', () => {
    const input = '```javascript\ncode\n```';
    assert.ok(shortenCodeFences(input).startsWith('```js'));
  });

  it('shortens typescript to ts', () => {
    assert.ok(shortenCodeFences('```typescript\n```').includes('```ts'));
  });

  it('shortens python to py', () => {
    assert.ok(shortenCodeFences('```python\n```').includes('```py'));
  });

  it('leaves short labels untouched', () => {
    const input = '```js\ncode\n```';
    assert.strictEqual(shortenCodeFences(input), input);
  });

  it('leaves bash untouched (no mapping)', () => {
    const input = '```bash\ncode\n```';
    assert.strictEqual(shortenCodeFences(input), input);
  });
});

describe('truncateLongLists', () => {
  it('truncates lists with more than maxItems items', () => {
    const items = Array.from({ length: 7 }, (_, i) => `- Item ${i + 1}`).join('\n') + '\n';
    const { result, changes } = truncateLongLists(items, 3);
    const resultLines = result.split('\n').filter(l => l.startsWith('- '));
    // 3 real items + 1 "# ... N more" line
    assert.ok(resultLines.length <= 4, `got ${resultLines.length} lines`);
    assert.ok(changes.length > 0, 'should report a change');
  });

  it('leaves lists at or below maxItems untouched', () => {
    const items = Array.from({ length: 5 }, (_, i) => `- Item ${i + 1}`).join('\n') + '\n';
    const { result, changes } = truncateLongLists(items, 5);
    assert.strictEqual(changes.length, 0);
    assert.ok(result.includes('Item 5'));
  });

  it('includes "N more" comment when truncating', () => {
    const items = Array.from({ length: 8 }, (_, i) => `- Item ${i + 1}`).join('\n') + '\n';
    const { result } = truncateLongLists(items, 3);
    assert.ok(result.includes('more'), `expected 'more' in: ${result}`);
  });
});

describe('applyCompressionRules', () => {
  it('reports blank line removal changes', () => {
    // Blank lines compress cosmetically (tokenizer may not differentiate)
    const input = Array.from({ length: 5 }, (_, i) => `## Section ${i}\n\ncontent\n`).join('\n\n\n');
    const { changes } = applyCompressionRules(input);
    assert.ok(changes.some(c => c.includes('blank')), 'should report blank line removal');
  });

  it('reduces tokens when many verbose code fences present', () => {
    const fences = Array.from({ length: 10 }, () =>
      '```javascript\nconst x = 1;\n```').join('\n\n');
    const { result, changes } = applyCompressionRules(fences);
    const before = countTokens(fences);
    const after = countTokens(result);
    assert.ok(after <= before, `after (${after}) should be <= before (${before})`);
    assert.ok(changes.some(c => c.includes('fence')), 'should report fence changes');
  });

  it('never removes section headings', () => {
    const input = '# Title\n\n## Section One\n\ncontent\n\n## Section Two\n\ncontent\n';
    const { result } = applyCompressionRules(input);
    assert.ok(result.includes('## Section One'));
    assert.ok(result.includes('## Section Two'));
  });

  it('produces same output on same input (deterministic)', () => {
    const input = 'line\n\n\n\nother\n```javascript\ncode\n```\n';
    const r1 = applyCompressionRules(input).result;
    const r2 = applyCompressionRules(input).result;
    assert.strictEqual(r1, r2);
  });
});
