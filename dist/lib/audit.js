"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeAuditValue = sanitizeAuditValue;
exports.writeAudit = writeAudit;
exports.auditForActor = auditForActor;
const prismaClient_1 = require("@/lib/prismaClient");
const SECRET_KEYS = new Set([
    "passwordHash",
    "password",
    "codeHash",
    "bankAccountNo",
    "token",
    "refreshToken",
]);
/** Never persist secrets into the audit trail (bank number is stored masked). */
function sanitizeAuditValue(value, depth = 0) {
    if (depth > 4 || value === null || value === undefined)
        return value ?? null;
    if (Array.isArray(value))
        return value.map((item) => sanitizeAuditValue(item, depth + 1));
    if (value instanceof Date)
        return value.toISOString();
    if (typeof value === "object") {
        const out = {};
        for (const [key, entry] of Object.entries(value)) {
            if (SECRET_KEYS.has(key)) {
                out[key] = entry ? "***redacted***" : null;
            }
            else {
                out[key] = sanitizeAuditValue(entry, depth + 1);
            }
        }
        return out;
    }
    if (typeof value === "bigint")
        return value.toString();
    return value;
}
function jsonValue(value) {
    if (value === undefined)
        return undefined;
    const sanitized = sanitizeAuditValue(value);
    return JSON.parse(JSON.stringify(sanitized));
}
/** Writes exactly one audit row. Pass a transaction client when the change is transactional. */
async function writeAudit(client, input) {
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
async function auditForActor(actor, input) {
    await writeAudit(prismaClient_1.prismaMain, { ...input, userId: actor?.userId ?? null });
}
