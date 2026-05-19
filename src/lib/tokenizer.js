import { countTokens as _countTokens } from '@anthropic-ai/tokenizer';

export function countTokens(text) {
  if (!text) return 0;
  return _countTokens(text);
}
