// Structured audit logger for MCP tool invocations.
// Writes NDJSON (newline-delimited JSON) to:
//   1. stderr  — real-time (visible in VS Code MCP output)
//   2. durable file — append-only NDJSON for forensic/compliance retention
//
// File path is configurable via MCAPS_AUDIT_LOG env var.
// Default: .copilot/logs/audit.ndjson (workspace-relative).

import { appendFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';

const LOG_TARGET = process.stderr;

// ── Durable file sink setup ───────────────────────────────────
const DEFAULT_AUDIT_PATH = resolve(process.cwd(), '.copilot', 'logs', 'audit.ndjson');
const AUDIT_FILE = process.env.MCAPS_AUDIT_LOG || DEFAULT_AUDIT_PATH;

let _fileReady = false;
function ensureAuditDir() {
  if (_fileReady) return;
  try {
    const dir = dirname(AUDIT_FILE);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    _fileReady = true;
  } catch {
    // Fail silently — stderr logging still works
  }
}

/**
 * Emit a structured audit record for a tool invocation.
 * @param {object} entry
 * @param {string} entry.tool       - Tool name (e.g. "crm_query")
 * @param {string} [entry.entitySet]- CRM entity set queried
 * @param {string} [entry.method]   - HTTP method (GET, PATCH, …)
 * @param {number} [entry.recordCount] - Number of records returned
 * @param {boolean} [entry.blocked] - Whether the request was blocked by a guardrail
 * @param {string} [entry.reason]   - Why it was blocked
 * @param {object} [entry.params]   - Sanitized input params (no tokens/secrets)
 * @param {string} [entry.operationId] - Staged operation ID (for write ops)
 * @param {string} [entry.upn]      - User principal name
 * @param {string} [entry.status]   - Result status ("ok", "error", "blocked")
 */
export function auditLog(entry) {
  const record = {
    ts: new Date().toISOString(),
    ...entry,
  };
  const line = JSON.stringify(record) + '\n';
  try {
    LOG_TARGET.write(line);
  } catch {
    // Never crash the server for a logging failure
  }
  // Append to durable file
  try {
    ensureAuditDir();
    appendFileSync(AUDIT_FILE, line, 'utf-8');
  } catch {
    // Best-effort — never crash
  }
}

/** Returns the resolved path of the audit log file. */
export function getAuditLogPath() {
  return AUDIT_FILE;
}
