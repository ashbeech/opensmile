// src/lib/server/safeLog.ts
// REQUIRED: PII redaction for all logging
import "server-only";

// Keys that MUST be redacted from any log output
const PII_KEYS = new Set([
  "email",
  "phone",
  "dateOfBirth",
  "dob",
  "callTranscript",
  "transcript",
  "callRecordingUrl",
  "recordingUrl",
  "emergencyContact",
  "password",
  "notes",
  "body",
  "message",
  "address",
  "postcode",
  "name",
  "fullName",
]);

// Keys that are SAFE to log
const SAFE_KEYS = new Set([
  "id",
  "status",
  "source",
  "practiceId",
  "userId",
  "role",
  "type",
  "createdAt",
  "updatedAt",
  "count",
  "action",
  "resource",
]);

/**
 * Recursively redact PII from any object before logging.
 * Only whitelisted keys pass through; everything else is stripped.
 */
function redactDeep(obj: unknown, depth = 0): unknown {
  if (depth > 5) return "[MAX_DEPTH]";
  if (obj === null || obj === undefined) return obj;
  if (
    typeof obj === "string" ||
    typeof obj === "number" ||
    typeof obj === "boolean"
  )
    return obj;

  if (Array.isArray(obj)) {
    return obj.map((item) => redactDeep(item, depth + 1));
  }

  if (typeof obj === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      if (PII_KEYS.has(key)) {
        result[key] = "[REDACTED]";
      } else if (SAFE_KEYS.has(key)) {
        result[key] = redactDeep(value, depth + 1);
      }
      // Keys not in either set are silently dropped (fail-safe)
    }
    return result;
  }

  return "[UNKNOWN_TYPE]";
}

/**
 * Safe logging function — ALWAYS use this instead of console.log for
 * any data that might contain user information.
 */
export function safeLog(event: string, data?: unknown) {
  const redacted = data ? redactDeep(data) : undefined;
  console.log(event, redacted ?? "");
}
