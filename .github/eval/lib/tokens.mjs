/**
 * tokens.mjs — Lightweight token estimation for context budget analysis.
 *
 * Uses word-count heuristic (~1.3 tokens per word for English prose).
 * Good enough for relative comparisons across loading strategies.
 */

const TOKENS_PER_WORD = 1.3;

/** Estimate token count for a string. */
export function estimateTokens(text) {
  if (!text) return 0;
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.ceil(words * TOKENS_PER_WORD);
}

/**
 * Estimate the catalog cost of a skill or instruction:
 * the tokens consumed by its metadata being present in the system prompt.
 *
 * For skills, this includes: XML wrapper + name + description + argument-hint
 * For instructions, this includes: XML wrapper + description + file path + applyTo
 */
export function catalogTokens(item) {
  const parts = [
    // XML element overhead (~20 tokens per skill/instruction entry)
    '<skill><name></name><description></description><file></file></skill>',
    item.name || '',
    item.description || '',
    item.argumentHint || item.applyTo || '',
    item.file || '',
  ];
  return estimateTokens(parts.join(' '));
}

/** Estimate the body cost: tokens for the full file content when loaded. */
export function bodyTokens(item) {
  // lines * ~10 tokens/line is a reasonable approximation for markdown
  return Math.ceil((item.lines || 0) * 10);
}
