import { z } from "zod";

export const guardianInputSchema = z.object({
  relation: z.enum(["FATHER", "MOTHER", "GUARDIAN", "OTHER"], {
    message: "Relation must be FATHER, MOTHER, GUARDIAN, or OTHER",
  }),
  fullName: z.string().min(1, "Full name is required"),
  phone: z.string().optional().nullable(),
  email: z.string().email("Invalid email format").optional().nullable(),
  occupation: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  isPrimary: z.boolean().optional(),
});

export const studentCreateInputSchema = z.object({
  userId: z.string().uuid("Invalid User ID format").optional().nullable(),
  universityRegNo: z.string().min(1, "University registration number is required").max(50, "University registration number is too long"),
  firstName: z.string().min(1, "First name is required").max(100, "First name is too long"),
  middleName: z.string().max(100, "Middle name is too long").optional().nullable(),
  lastName: z.string().min(1, "Last name is required").max(100, "Last name is too long"),
  gender: z.enum(["MALE", "FEMALE", "OTHERS"], {
    message: "Gender must be MALE, FEMALE, or OTHERS",
  }),
  dobBs: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").optional().nullable(),
  phone: z.string().max(20, "Phone number is too long").optional().nullable(),
  email: z.string().email("Invalid email format").max(255, "Email is too long").optional().nullable(),
  permanentAddress: z.string().optional().nullable(),
  temporaryAddress: z.string().optional().nullable(),
  photoUrl: z.string().url("Invalid URL format").optional().nullable(),
  batchId: z.string().uuid("Invalid Batch ID format"),
  admissionDateBs: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  // NOTE: approvalStatus/status are NOT client-settable on create. New
  // students are always PENDING + ACTIVE; transitions go through
  // POST /student/:id/approve|reject|resubmit|change-status (server-side).
  rejectionReason: z.string().max(1000, "Rejection reason is too long").optional().nullable(),
  createdBy: z.string().uuid("Invalid Creator User ID format").optional().nullable(),
  // Student + guardian(s) are created in one transaction. When supplied,
  // exactly one guardian must be primary (a single guardian defaults to
  // primary). Omitting `guardians` keeps legacy clients working.
  guardians: z.array(guardianInputSchema).min(1, "At least one guardian is required").max(10).optional(),
}).superRefine((data, ctx) => {
  if (!data.guardians) return;
  const primaries = data.guardians.filter((g) => g.isPrimary === true).length;
  if (data.guardians.length === 1 && primaries === 0) return; // defaults to primary in service
  if (primaries !== 1) {
    ctx.addIssue({
      code: "custom",
      path: ["guardians"],
      message: "Exactly one guardian must be marked isPrimary",
    });
  }
});

export const studentUpdateInputSchema = z.object({
  userId: z.string().uuid("Invalid User ID format").optional().nullable(),
  universityRegNo: z.string().min(1, "University registration number is required").max(50, "University registration number is too long").optional(),
  firstName: z.string().min(1, "First name is required").max(100, "First name is too long").optional(),
  middleName: z.string().max(100, "Middle name is too long").optional().nullable(),
  lastName: z.string().min(1, "Last name is required").max(100, "Last name is too long").optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHERS"], {
    message: "Gender must be MALE, FEMALE, or OTHERS",
  }).optional(),
  dobBs: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").optional().nullable(),
  phone: z.string().max(20, "Phone number is too long").optional().nullable(),
  email: z.string().email("Invalid email format").max(255, "Email is too long").optional().nullable(),
  permanentAddress: z.string().optional().nullable(),
  temporaryAddress: z.string().optional().nullable(),
  photoUrl: z.string().url("Invalid URL format").optional().nullable(),
  batchId: z.string().uuid("Invalid Batch ID format").optional(),
  admissionDateBs: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").optional(),
  // approvalStatus / status intentionally absent: use the dedicated
  // transition endpoints so PENDING->APPROVED|REJECTED, REJECTED->PENDING
  // and ADMIN-only status changes are enforced server-side.
});

export type StudentCreateInput = z.infer<typeof studentCreateInputSchema>;
export type StudentUpdateInput = z.infer<typeof studentUpdateInputSchema> & {
  // Present only when a legacy client still sends them; service rejects.
  approvalStatus?: string;
  status?: string;
  rejectionReason?: string | null;
};

export const studentRejectInputSchema = z.object({
  rejectionReason: z.string().min(1, "Rejection reason is required").max(1000).optional(),
  reason: z.string().min(1, "Rejection reason is required").max(1000).optional(),
}).superRefine((data, ctx) => {
  if (!data.rejectionReason && !data.reason) {
    ctx.addIssue({ code: "custom", path: ["rejectionReason"], message: "Rejection reason is required" });
  }
});

export const studentStatusChangeInputSchema = z.object({
  status: z.enum(["ACTIVE", "GRADUATED", "DROPPED", "SUSPENDED"], {
    message: "Status must be ACTIVE, GRADUATED, DROPPED, or SUSPENDED",
  }),
  reason: z.string().min(1, "Reason is required for a status change").max(1000, "Reason is too long"),
});

export const studentBulkImportInputSchema = z.object({
  students: z.array(studentCreateInputSchema).min(1, "At least one student row is required").max(100, "At most 100 rows per import"),
});

export type StudentRejectInput = z.infer<typeof studentRejectInputSchema>;
export type StudentStatusChangeInput = z.infer<typeof studentStatusChangeInputSchema>;

export const validateStudentCreate = (data: unknown) => {
  return studentCreateInputSchema.parse(data);
};

export const validateStudentUpdate = (data: unknown) => {
  return studentUpdateInputSchema.parse(data);
};

export const validateStudentReject = (data: unknown) => {
  return studentRejectInputSchema.parse(data);
};

export const validateStudentStatusChange = (data: unknown) => {
  return studentStatusChangeInputSchema.parse(data);
};

export const validateStudentBulkImport = (data: unknown) => {
  return studentBulkImportInputSchema.parse(data);
};
