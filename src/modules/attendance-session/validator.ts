import { z } from "zod";
import { parseBsDate } from "@/utils/bs-date";

// Accept "dateBs" as BS date "YYYY-MM-DD" OR BS datetime "YYYY-MM-DD HH:mm" / "YYYY-MM-DDTHH:mm".
// Normalizes to the date part (schema stores date only; the period carries the start/end time).
const BS_DATETIME_RE = /^(\d{4}-\d{2}-\d{2})(?:[T ](\d{1,2}):(\d{2}))?$/;

const bsDateOrDateTime = (field: string) =>
  z
    .string()
    .transform((v, ctx) => {
      const m = BS_DATETIME_RE.exec(v.trim());
      if (!m) {
        ctx.addIssue(
          `${field} must be a BS date YYYY-MM-DD or datetime YYYY-MM-DD HH:mm`,
        );
        return z.NEVER;
      }
      const [, d, h, mi] = m;
      if (parseBsDate(d) === null) {
        ctx.addIssue(`${field} date part must be a valid BS date YYYY-MM-DD`);
        return z.NEVER;
      }
      if (h !== undefined) {
        const hh = Number(h);
        const mm = Number(mi);
        if (hh < 0 || hh > 23 || mm < 0 || mm > 59) {
          ctx.addIssue(`${field} time part must be HH:mm (00:00-23:59)`);
          return z.NEVER;
        }
      }
      return d; // store/normalize to date only
    })
    .pipe(z.string());

export const attendanceSessionCreateInputSchema = z.object({
  teachingAssignmentId: z
    .string()
    .uuid("Invalid Teaching Assignment ID format"),
  teacherId: z.string().uuid("Invalid Teacher ID format"),
  periodId: z.string().uuid("Invalid Period ID format"),
  dateBs: bsDateOrDateTime("dateBs"),
});

export const attendanceSessionUpdateInputSchema = z.object({
  teachingAssignmentId: z
    .string()
    .uuid("Invalid Teaching Assignment ID format")
    .optional(),
  teacherId: z.string().uuid("Invalid Teacher ID format").optional(),
  periodId: z.string().uuid("Invalid Period ID format").optional(),
  dateBs: bsDateOrDateTime("dateBs").optional(),
  isLocked: z.boolean().optional(), // honoured only via /unlock (PRINCIPAL/ADMIN); ignored here if false
  // Optional per-student statuses saved together with the session metadata.
  records: z
    .array(
      z.object({
        studentId: z.string().uuid("Invalid Student ID format"),
        status: z.enum(["PRESENT", "ABSENT", "LEAVE", "LATE"]),
        remarks: z
          .string()
          .trim()
          .max(500, "Remarks are too long")
          .optional()
          .nullable(),
      }),
    )
    .max(500, "Too many records in one request")
    .optional(),
});

export type AttendanceSessionCreateInput = z.infer<
  typeof attendanceSessionCreateInputSchema
>;
export type AttendanceSessionUpdateInput = z.infer<
  typeof attendanceSessionUpdateInputSchema
>;

export const validateAttendanceSessionCreate = (data: unknown) => {
  return attendanceSessionCreateInputSchema.parse(data);
};

export const validateAttendanceSessionUpdate = (data: unknown) => {
  const parsed = attendanceSessionUpdateInputSchema.parse(data);
  // Prevent locking/unlocking through generic PATCH — /unlock is the audited path
  const { isLocked: _ignored, ...rest } = parsed as Record<string, unknown>;
  void _ignored;
  return rest as AttendanceSessionUpdateInput;
};
