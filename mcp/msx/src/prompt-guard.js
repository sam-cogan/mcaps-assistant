// Prompt injection detection heuristics for external data.
// Scans CRM/M365 response data for patterns that may attempt to
// manipulate the LLM agent. Detections are logged to the audit trail
// and surfaced as warnings on write operations.

import { auditLog } from './audit.js';

// ── Detection patterns ────────────────────────────────────────
// Each entry: { id, pattern (RegExp), severity, description }
const INJECTION_PATTERNS = [
  { id: 'PI-01', pattern: /ignore\s+(all\s+)?previous\s+instructions/i, severity: 'high', description: 'Instruction override attempt' },
  { id: 'PI-02', pattern: /you\s+are\s+now\s+(a|an)\b/i, severity: 'high', description: 'Role reassignment attempt' },
  { id: 'PI-03', pattern: /system\s*:\s*you/i, severity: 'high', description: 'Fake system prompt injection' },
  { id: 'PI-04', pattern: /do\s+not\s+(follow|obey|listen)/i, severity: 'medium', description: 'Compliance override attempt' },
  { id: 'PI-05', pattern: /disregard\s+(the\s+)?(above|previous|prior)/i, severity: 'high', description: 'Context disregard attempt' },
  { id: 'PI-06', pattern: /execute\s+(the\s+following|this)\s+(command|code|script)/i, severity: 'high', description: 'Code execution injection' },
  { id: 'PI-07', pattern: /\bASSISTANT\s*:/i, severity: 'medium', description: 'Role boundary injection' },
  { id: 'PI-08', pattern: /\[INST\]|\[\/INST\]|<\|im_start\|>|<\|im_end\|>/i, severity: 'high', description: 'Chat template injection' },
  { id: 'PI-09', pattern: /forget\s+(everything|all|what)\b/i, severity: 'medium', description: 'Memory wipe attempt' },
  { id: 'PI-10', pattern: /pretend\s+(you('re| are)|to\s+be)/i, severity: 'medium', description: 'Identity manipulation attempt' },
];

/**
 * Scan a string value for prompt injection indicators.
 * @param {string} value - Text to scan
 * @returns {Array<{id: string, severity: string, description: string, match: string}>}
 */
function scanString(value) {
  if (!value || typeof value !== 'string') return [];
  const hits = [];
  for (const { id, pattern, severity, description } of INJECTION_PATTERNS) {
    const m = pattern.exec(value);
    if (m) {
      hits.push({ id, severity, description, match: m[0] });
    }
  }
  return hits;
}

/**
 * Recursively scan an object (CRM/M365 response payload) for prompt injection.
 * Returns an array of detections with field path context.
 * @param {any} data - Response object to scan
 * @param {string} [prefix] - Field path prefix for nested objects
 * @param {number} [depth] - Current recursion depth (capped at 5)
 * @returns {Array<{field: string, id: string, severity: string, description: string, match: string}>}
 */
export function scanPayload(data, prefix = '', depth = 0) {
  if (depth > 5 || data == null) return [];
  const results = [];

  if (typeof data === 'string') {
    for (const hit of scanString(data)) {
      results.push({ field: prefix || '(root)', ...hit });
    }
  } else if (Array.isArray(data)) {
    for (let i = 0; i < data.length && i < 100; i++) {
      results.push(...scanPayload(data[i], `${prefix}[${i}]`, depth + 1));
    }
  } else if (typeof data === 'object') {
    for (const [key, value] of Object.entries(data)) {
      // Skip OData annotation fields and IDs — not user-controlled content
      if (key.startsWith('@') || key.endsWith('id') || key === 'ts') continue;
      results.push(...scanPayload(value, prefix ? `${prefix}.${key}` : key, depth + 1));
    }
  }

  return results;
}

/**
 * Scan external data and log detections. Returns the detections array.
 * @param {any} data - Response data from external service
 * @param {string} source - Source identifier (e.g. "crm_query", "email")
 * @returns {Array} Detections (empty if clean)
 */
export function detectInjection(data, source) {
  const detections = scanPayload(data);
  if (detections.length > 0) {
    auditLog({
      tool: 'prompt_guard',
      source,
      blocked: false,
      reason: 'prompt_injection_detected',
      detections: detections.map(d => ({ id: d.id, field: d.field, severity: d.severity, description: d.description })),
    });
  }
  return detections;
}

/**
 * Format detections as a human-readable warning prefix for tool responses.
 * @param {Array} detections
 * @returns {string} Warning text (empty string if no detections)
 */
export function formatDetectionWarning(detections) {
  if (!detections || detections.length === 0) return '';
  const lines = detections.map(d =>
    `  - [${d.id}] ${d.description} in field "${d.field}" (severity: ${d.severity}, matched: "${d.match}")`
  );
  return `⚠️ PROMPT INJECTION INDICATORS DETECTED in external data:\n${lines.join('\n')}\n` +
    `Review the data below carefully before acting on it.\n\n`;
}

/**
 * Format a concise warning for write-operation staging.
 * Surfaced in the staged operation response so the user sees it before approval.
 * @param {Array} detections
 * @returns {string|null} Warning text or null if clean
 */
export function formatWriteWarning(detections) {
  if (!detections || detections.length === 0) return null;
  const high = detections.filter(d => d.severity === 'high');
  const summary = high.length > 0
    ? `${high.length} high-severity prompt injection indicator(s) detected in source data`
    : `${detections.length} prompt injection indicator(s) detected in source data`;
  return `⚠️ ${summary}. Review carefully before approving this write operation.`;
}
