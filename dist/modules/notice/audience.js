"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStudentBatchId = getStudentBatchId;
exports.buildAudienceClause = buildAudienceClause;
exports.getTeacherBatchIds = getTeacherBatchIds;
const prismaClient_1 = require("@/lib/prismaClient");
/** The batch of the signed-in student (students see notices aimed at their class). */
async function getStudentBatchId(userId) {
    if (!userId)
        return null;
    const student = await prismaClient_1.prismaMain.student.findFirst({
        where: { userId, deletedAt: null },
        select: { batchId: true },
    });
    return student?.batchId ?? null;
}
/**
 * Who may see a notice:
 * - no targets at all            → everyone
 * - a target for my role          → me
 * - a target for my batch          → me (students of that class)
 * - I created it                  → always me, so the author can follow it up
 */
async function buildAudienceClause(actor) {
    const batchId = await getStudentBatchId(actor.userId);
    const or = [{ targets: { none: {} } }];
    if (actor.role) {
        or.push({ targets: { some: { role: actor.role, deletedAt: null } } });
    }
    if (batchId) {
        or.push({ targets: { some: { batchId, deletedAt: null } } });
    }
    if (actor.userId) {
        or.push({ createdBy: actor.userId });
    }
    return { OR: or };
}
/** Batches (classes) the signed-in teacher teaches. */
async function getTeacherBatchIds(userId) {
    if (!userId)
        return [];
    const assignments = await prismaClient_1.prismaMain.teachingAssignment.findMany({
        where: {
            deletedAt: null,
            teacher: { employee: { userId, deletedAt: null } },
        },
        select: {
            batchTermSubject: { select: { batchTerm: { select: { batchId: true } } } },
        },
    });
    const ids = assignments
        .map((a) => a.batchTermSubject?.batchTerm?.batchId)
        .filter((id) => Boolean(id));
    return [...new Set(ids)];
}
