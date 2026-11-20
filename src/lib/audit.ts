import { Prisma } from "@/generated/prisma/client.js";
import { prismaMain } from "@/lib/prismaClient";

export type AuditClient = Prisma.TransactionClient | typeof prismaMain;

export type AuditInput = {
  entity: string;
  entityId?: string | null;
  action: string;
  oldValues?: unknown;
  newValues?: unknown;
  userId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
};

const SECRET_KEYS = new Set([
  "passwordHash",
  "password",
  "codeHash",
  "bankAccountNo",
  "token",
  "refreshToken",
]);

/** Never persist secrets into the audit trail (bank number is stored masked). */
export function sanitizeAuditValue(value: unknown, depth = 0): unknown {
  if (depth > 4 || value === null || value === undefined) return value ?? null;
  if (Array.isArray(value)) return value.map((item) => sanitizeAuditValue(item, depth + 1));
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
      if (SECRET_KEYS.has(key)) {
        out[key] = entry ? "***redacted***" : null;
      } else {
        out[key] = sanitizeAuditValue(entry, depth + 1);
      }
    }
    return out;
  }
  if (typeof value === "bigint") return value.toString();
  return value;
}

function jsonValue(value: unknown): Prisma.InputJsonValue | undefined {
  if (value === undefined) return undefined;
  const sanitized = sanitizeAuditValue(value);
  return JSON.parse(JSON.stringify(sanitized)) as Prisma.InputJsonValue;
}

/** Writes exactly one audit row. Pass a transaction client when the change is transactional. */
export async function writeAudit(client: AuditClient, input: AuditInput): Promise<void> {
  await client.auditLog.create({
    data: {
      entity: input.entity,
      entityId: input.entityId ?? null,
      action: input.action,
      oldValues: jsonValue(input.oldValues),
      newValues: jsonValue(input.newValues),
      userId: input.userId ?? null,
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
    },
  });
}

/** Convenience wrapper for services that only know the acting user. */
export async function auditForActor(
  actor: { userId?: string | null } | undefined,
  input: AuditInput,
): Promise<void> {
  await writeAudit(prismaMain, { ...input, userId: actor?.userId ?? null });
}
