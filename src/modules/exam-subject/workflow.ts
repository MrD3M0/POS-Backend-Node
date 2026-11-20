import { prismaMain } from "@/lib/prismaClient";
import { resolvePageLimit, toPrismaTake } from "@/utils/queryFilters";
import { CustomError, ValidationError } from "@/errors/CustomError";
import { computeResult } from "@/modules/result/service";

/**
 * Group-level result workflow: Batch -> Term -> Subject.
 *
 * Approval state lives on ExamSubject (one row per exam + subject). Publishing
 * happens at exam level (a batch + term exam) once every subject of that exam
 * is APPROVED; it flips the per-student Result rows to PUBLISHED.
 *
 * The word "Term" is used everywhere in this API and UI. The term's own name
 * (e.g. "Semester 1" or "Year 1") is returned as data so a college can keep
 * its own naming, but labels/filters/columns call it "Term".
 */

type Actor = { userId?: string; role?: string };

export type T_ExamSubjectStatus =
  | "DRAFT"
  | "PENDING"
  | "APPROVED"
  | "REJECTED";

export type T_ExamSubjectGroup = {
  id: string;
  examId: string;
  examName: string;
  examTypeName: string | null;
  batchId: string;
  batchName: string;
  termId: string;
  termName: string;
  termNumber: number | null;
  subjectId: string;
  subjectName: string;
  subjectCode: string | null;
  status: T_ExamSubjectStatus;
  rejectionReason: string | null;
  submittedAt: string | null;
  approvedAt: string | null;
  teacherName: string | null;
  fullMarks: number;
  passMarks: number;
  studentsCount: number;
  marksEntered: number;
  absentCount: number;
  passCount: number;
  passPercent: number;
};

export type T_PublishInput = {
  batchId: string;
  termId: string;
  examId?: string;
};

const SUBMIT_FROM = new Set<T_ExamSubjectStatus>(["DRAFT", "REJECTED", "PENDING"]);

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function fullName(parts: {
  firstName?: string | null;
  middleName?: string | null;
  lastName?: string | null;
} | null): string | null {
  if (!parts) return null;
  const name = [parts.firstName, parts.middleName, parts.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();
  return name || null;
}

async function resolveTeacherId(userId?: string): Promise<string> {
  if (!userId) throw new CustomError("Unauthorized", 401);
  const teacher = await prismaMain.teacher.findFirst({
    where: { deletedAt: null, employee: { userId, deletedAt: null } },
    select: { id: true },
  });
  if (!teacher) {
    throw new CustomError("No teacher profile is linked to this account", 403);
  }
  return teacher.id;
}

const GROUP_INCLUDE = {
  exam: {
    select: {
      id: true,
      name: true,
      batchTermId: true,
      examType: { select: { id: true, name: true } },
    },
  },
  batchTermSubject: {
    select: {
      id: true,
      creditHour: true,
      subject: { select: { id: true, code: true, name: true } },
      batchTerm: {
        select: {
          id: true,
          name: true,
          termNumber: true,
          batch: {
            select: {
              id: true,
              name: true,
              course: { select: { id: true, name: true } },
            },
          },
        },
      },
      assignments: {
        where: { deletedAt: null },
        select: {
          id: true,
          teacherId: true,
          teacher: {
            select: {
              employee: {
                select: {
                  firstName: true,
                  middleName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      },
    },
  },
} as const;

export const ExamSubjectWorkflow = {
  /** Grouped approval list: one row per Batch + Term + Subject (ExamSubject). */
  async groups(
    query: {
      page?: number;
      limit?: number;
      batchId?: string;
      termId?: string;
      subjectId?: string;
      examId?: string;
      status?: string;
      search?: string;
    },
    actor: Actor,
  ): Promise<{ data: T_ExamSubjectGroup[]; pagination: { page: number; limit: number; total: number } }> {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = resolvePageLimit(query.limit, 20);
    const skip = limit === -1 ? 0 : (page - 1) * limit;

    const where: Record<string, unknown> = { deletedAt: null };
    const and: Record<string, unknown>[] = [];

    if (query.batchId) and.push({ batchTermSubject: { batchTerm: { batchId: query.batchId } } });
    if (query.termId) and.push({ batchTermSubject: { batchTermId: query.termId } });
    if (query.subjectId) and.push({ batchTermSubject: { subjectId: query.subjectId } });
    if (query.examId) and.push({ examId: query.examId });
    if (query.status) and.push({ status: query.status });
    if (query.search) {
      and.push({
        OR: [
          { exam: { name: { contains: query.search, mode: "insensitive" } } },
          {
            batchTermSubject: {
              subject: { name: { contains: query.search, mode: "insensitive" } },
            },
          },
        ],
      });
    }

    if (actor.role === "TEACHER") {
      const teacherId = await resolveTeacherId(actor.userId);
      and.push({
        batchTermSubject: {
          assignments: { some: { teacherId, deletedAt: null } },
        },
      });
    }

    if (and.length) where.AND = and;

    const [rows, total] = await Promise.all([
      prismaMain.examSubject.findMany({
        where,
        skip,
        take: toPrismaTake(limit),
        include: GROUP_INCLUDE,
        orderBy: { createdAt: "desc" },
      }),
      prismaMain.examSubject.count({ where }),
    ]);

    const studentCountByBatch = new Map<string, Promise<number>>();
    const studentsInBatch = (batchId: string) => {
      if (!studentCountByBatch.has(batchId)) {
        studentCountByBatch.set(
          batchId,
          prismaMain.student.count({ where: { batchId, deletedAt: null } }),
        );
      }
      return studentCountByBatch.get(batchId)!;
    };

    const data = await Promise.all(
      rows.map(async (row) => {
        const batch = row.batchTermSubject?.batchTerm?.batch;
        const term = row.batchTermSubject?.batchTerm;
        const subject = row.batchTermSubject?.subject;
        const fullMarks = Number(row.fullMarks);
        const passMarks = Number(row.passMarks);
        const [studentsCount, marksEntered, absentCount, passCount] =
          await Promise.all([
            batch?.id ? studentsInBatch(batch.id) : Promise.resolve(0),
            prismaMain.examMark.count({
              where: { examSubjectId: row.id, deletedAt: null },
            }),
            prismaMain.examMark.count({
              where: { examSubjectId: row.id, deletedAt: null, isAbsent: true },
            }),
            prismaMain.examMark.count({
              where: {
                examSubjectId: row.id,
                deletedAt: null,
                isAbsent: false,
                marksObtained: { gte: passMarks },
              },
            }),
          ]);

        const teacher = row.batchTermSubject?.assignments?.[0]?.teacher?.employee;
        return {
          id: row.id,
          examId: row.examId,
          examName: row.exam?.name ?? "—",
          examTypeName: row.exam?.examType?.name ?? null,
          batchId: batch?.id ?? "",
          batchName: batch?.name ?? "—",
          termId: term?.id ?? "",
          termName: term?.name ?? "—",
          termNumber: term?.termNumber ?? null,
          subjectId: subject?.id ?? "",
          subjectName: subject?.name ?? "—",
          subjectCode: subject?.code ?? null,
          status: (row.status as T_ExamSubjectStatus) ?? "DRAFT",
          rejectionReason: row.rejectionReason ?? null,
          submittedAt: row.submittedAt ? row.submittedAt.toISOString() : null,
          approvedAt: row.approvedAt ? row.approvedAt.toISOString() : null,
          teacherName: fullName(teacher),
          fullMarks,
          passMarks,
          studentsCount,
          marksEntered,
          absentCount,
          passCount,
          passPercent: marksEntered > 0 ? round1((passCount / marksEntered) * 100) : 0,
        };
      }),
    );

    return { data, pagination: { page, limit, total } };
  },

  /** Teacher submits the marks of one subject. All students must have a mark. */
  async submit(id: string, actor: Actor) {
    const item = await prismaMain.examSubject.findFirst({
      where: { id, deletedAt: null },
      include: {
        exam: {
          select: {
            id: true,
            name: true,
            batchTerm: { select: { id: true, batchId: true } },
          },
        },
        batchTermSubject: {
          select: {
            id: true,
            subject: { select: { name: true } },
            assignments: {
              where: { deletedAt: null },
              select: { teacherId: true },
            },
          },
        },
      },
    });
    if (!item) throw new CustomError("Exam subject not found", 404);

    const currentStatus = (item.status as T_ExamSubjectStatus) ?? "DRAFT";
    if (currentStatus === "APPROVED") {
      throw new CustomError(
        "This subject is already approved and cannot be changed",
        409,
      );
    }
    if (currentStatus === "PENDING") {
      // Re-submitting a pending subject is a no-op — the principal is reviewing it.
      return item;
    }
    if (!SUBMIT_FROM.has(currentStatus)) {
      throw new CustomError(`Cannot submit a subject in ${currentStatus} state`, 409);
    }

    if (actor.role === "TEACHER") {
      const teacherId = await resolveTeacherId(actor.userId);
      const owns = item.batchTermSubject?.assignments?.some(
        (assignment) => assignment.teacherId === teacherId,
      );
      if (!owns) {
        throw new CustomError(
          "You can only submit marks for the subjects you teach",
          403,
        );
      }
    }

    const batchId = item.exam?.batchTerm?.batchId;
    if (!batchId) throw new CustomError("Exam has no batch/term", 422);

    const [students, marks] = await Promise.all([
      prismaMain.student.findMany({
        where: { batchId, deletedAt: null },
        select: { id: true },
      }),
      prismaMain.examMark.findMany({
        where: { examSubjectId: id, deletedAt: null },
        select: { studentId: true },
      }),
    ]);
    if (students.length === 0) {
      throw new CustomError("This batch has no students", 422);
    }

    const marked = new Set(marks.map((mark) => mark.studentId));
    const missing = students.filter((student) => !marked.has(student.id));
    if (missing.length > 0) {
      throw new ValidationError(
        {
          missingMarks: [
            `${missing.length} of ${students.length} students have no mark (enter a mark or mark them Absent)`,
          ],
        },
        "Cannot submit marks: every student needs a mark",
      );
    }

    const updated = await prismaMain.examSubject.update({
      where: { id },
      data: {
        status: "PENDING",
        submittedAt: new Date(),
        submittedBy: actor.userId ?? null,
        approvedBy: null,
        approvedAt: null,
        rejectionReason: null,
        updatedBy: actor.userId ?? null,
      },
      include: GROUP_INCLUDE,
    });

    return updated;
  },

  /**
   * Approve or reject one or more subjects in ONE transaction.
   * Filters: batchId + termId (+ subjectId / examId). Rejection needs a reason.
   */
  async bulkReview(
    input: {
      action: "APPROVE" | "REJECT";
      batchId: string;
      termId: string;
      subjectId?: string;
      examId?: string;
      reason?: string;
    },
    actor: Actor,
  ) {
    if (actor.role !== "PRINCIPAL" && actor.role !== "ADMIN") {
      throw new CustomError("Only PRINCIPAL/ADMIN can review results", 403);
    }
    const reason = input.reason?.trim();
    if (input.action === "REJECT" && !reason) {
      throw new ValidationError(
        { reason: ["A rejection reason is required"] },
        "Rejection needs a reason",
      );
    }

    const where: Record<string, unknown> = {
      deletedAt: null,
      status: "PENDING",
      batchTermSubject: {
        batchTermId: input.termId,
        batchTerm: { batchId: input.batchId },
      },
    };
    if (input.subjectId) {
      (where.batchTermSubject as Record<string, unknown>).subjectId =
        input.subjectId;
    }
    if (input.examId) where.examId = input.examId;

    const pending = await prismaMain.examSubject.findMany({
      where,
      select: { id: true },
    });
    if (pending.length === 0) {
      throw new CustomError(
        "No pending subjects match this Batch + Term selection",
        404,
      );
    }
    const ids = pending.map((row) => row.id);

    const updated = await prismaMain.$transaction(async (tx) => {
      const patch =
        input.action === "APPROVE"
          ? {
              status: "APPROVED",
              approvedBy: actor.userId ?? null,
              approvedAt: new Date(),
              rejectionReason: null,
              updatedBy: actor.userId ?? null,
            }
          : {
              status: "REJECTED",
              approvedBy: actor.userId ?? null,
              approvedAt: new Date(),
              rejectionReason: reason ?? null,
              updatedBy: actor.userId ?? null,
            };
      await tx.examSubject.updateMany({
        where: { id: { in: ids } },
        data: patch,
      });
      return ids.length;
    });

    return { action: input.action, updated };
  },

  /**
   * Publish a Batch + Term (optionally one exam) in ONE transaction.
   * Every subject must be APPROVED. Results are (re)computed from the marks
   * and flipped to PUBLISHED with publishedAt set.
   */
  async publish(input: T_PublishInput, actor: Actor) {
    if (actor.role !== "PRINCIPAL" && actor.role !== "ADMIN") {
      throw new CustomError("Only PRINCIPAL/ADMIN can publish results", 403);
    }

    const term = await prismaMain.batchTerm.findFirst({
      where: { id: input.termId, batchId: input.batchId, deletedAt: null },
      select: { id: true, name: true, batchId: true },
    });
    if (!term) throw new CustomError("Term not found for this batch", 404);

    const exams = await prismaMain.exam.findMany({
      where: {
        batchTermId: input.termId,
        deletedAt: null,
        ...(input.examId ? { id: input.examId } : {}),
      },
      select: { id: true, name: true },
    });
    if (exams.length === 0) {
      throw new CustomError("This term has no exams yet", 422);
    }

    const examIds = exams.map((exam) => exam.id);
    const subjects = await prismaMain.examSubject.findMany({
      where: { examId: { in: examIds }, deletedAt: null },
      select: { id: true, examId: true, status: true },
    });
    if (subjects.length === 0) {
      throw new CustomError("This term has no exam subjects yet", 422);
    }

    const notApproved = subjects.filter(
      (subject) => subject.status !== "APPROVED",
    );
    if (notApproved.length > 0) {
      throw new CustomError(
        `Cannot publish: ${notApproved.length} of ${subjects.length} subject(s) are not approved`,
        409,
      );
    }

    const students = await prismaMain.student.findMany({
      where: { batchId: input.batchId, deletedAt: null },
      select: { id: true },
    });
    if (students.length === 0) {
      throw new CustomError("This batch has no students", 422);
    }

    const summary = await prismaMain.$transaction(async (tx) => {
      let created = 0;
      let updated = 0;
      const upsertedResultIds: string[] = [];
      const affectedStudents = new Set<string>();

      for (const exam of exams) {
        for (const student of students) {
          const computed = await computeResult(tx, student.id, exam.id);
          affectedStudents.add(student.id);

          const existing = await tx.result.findFirst({
            where: { studentId: student.id, examId: exam.id, deletedAt: null },
          });
          let resultId: string;
          if (existing) {
            resultId = existing.id;
            await tx.resultSubject.deleteMany({ where: { resultId } });
            if (computed.rows.length > 0) {
              await tx.resultSubject.createMany({
                data: computed.rows.map((row: any) => ({
                  resultId,
                  examSubjectId: row.examSubjectId,
                  marksObtained: row.marksObtained,
                  fullMarks: row.fullMarks,
                  creditHour: row.creditHour,
                  gradeScaleId: row.gradeScaleId,
                  gradePoint: row.gradePoint,
                })),
              });
            }
            await tx.result.update({
              where: { id: resultId },
              data: {
                totalMarks: computed.totalMarks,
                fullMarks: computed.fullMarks,
                percentage: computed.percentage,
                totalCreditHour: computed.totalCreditHour,
                gpa: computed.gpa,
                isPassed: computed.isPassed,
                status: "PUBLISHED",
                submittedAt: existing.submittedAt ?? new Date(),
                approvedBy: actor.userId ?? null,
                approvedAt: new Date(),
                publishedAt: new Date(),
                updatedBy: actor.userId ?? null,
              },
            });
            updated += 1;
          } else {
            const createdRow = await tx.result.create({
              data: {
                studentId: student.id,
                examId: exam.id,
                totalMarks: computed.totalMarks,
                fullMarks: computed.fullMarks,
                percentage: computed.percentage,
                totalCreditHour: computed.totalCreditHour,
                gpa: computed.gpa,
                cgpa: null,
                isPassed: computed.isPassed,
                status: "PUBLISHED",
                submittedAt: new Date(),
                approvedBy: actor.userId ?? null,
                approvedAt: new Date(),
                publishedAt: new Date(),
                createdBy: actor.userId ?? null,
              },
            });
            resultId = createdRow.id;
            if (computed.rows.length > 0) {
              await tx.resultSubject.createMany({
                data: computed.rows.map((row: any) => ({
                  resultId,
                  examSubjectId: row.examSubjectId,
                  marksObtained: row.marksObtained,
                  fullMarks: row.fullMarks,
                  creditHour: row.creditHour,
                  gradeScaleId: row.gradeScaleId,
                  gradePoint: row.gradePoint,
                })),
              });
            }
            created += 1;
          }
          upsertedResultIds.push(resultId);
        }
      }

      // Recompute CGPA once per student now that every result is published.
      for (const studentId of affectedStudents) {
        const rows = await tx.result.findMany({
          where: {
            studentId,
            status: { in: ["APPROVED", "PUBLISHED"] },
            deletedAt: null,
          },
          select: { gpa: true, totalCreditHour: true },
        });
        const weighted = rows.reduce(
          (sum, row) => sum + Number(row.gpa) * Number(row.totalCreditHour),
          0,
        );
        const credits = rows.reduce(
          (sum, row) => sum + Number(row.totalCreditHour),
          0,
        );
        const cgpa =
          credits > 0 ? Math.round((weighted / credits) * 100) / 100 : null;
        await tx.result.updateMany({
          where: { studentId, deletedAt: null },
          data: { cgpa },
        });
      }

      return {
        exams: exams.length,
        students: students.length,
        results: upsertedResultIds.length,
        created,
        updated,
      };
    });

    return { batchId: input.batchId, term, ...summary };
  },
};
