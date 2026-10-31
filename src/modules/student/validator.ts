import { z } from "zod";

export const studentCreateInputSchema = z.object({
  userId: z.string().uuid("Invalid User ID format").optional().nullable(),
  universityRegNo: z.string().min(1, "University registration number is required").max(50, "University registration number is too long"),
  firstName: z.string().min(1, "First name is required").max(100, "First name is too long"),
  middleName: z.string().max(100, "Middle name is too long").optional().nullable(),
  lastName: z.string().min(1, "Last name is required").max(100, "Last name is too long"),
  gender: z.enum(["MALE", "FEMALE", "OTHERS"], {
    errorMap: () => ({ message: "Gender must be MALE, FEMALE, or OTHERS" }),
  }),
  dobBs: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").optional().nullable(),
  phone: z.string().max(20, "Phone number is too long").optional().nullable(),
  email: z.string().email("Invalid email format").max(255, "Email is too long").optional().nullable(),
  permanentAddress: z.string().optional().nullable(),
  temporaryAddress: z.string().optional().nullable(),
  photoUrl: z.string().url("Invalid URL format").optional().nullable(),
  batchId: z.string().uuid("Invalid Batch ID format"),
  admissionDateBs: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  status: z.enum(["ACTIVE", "GRADUATED", "DROPPED", "SUSPENDED"], {
    errorMap: () => ({ message: "Status must be ACTIVE, GRADUATED, DROPPED, or SUSPENDED" }),
  }).default("ACTIVE"),
  approvalStatus: z.enum(["PENDING", "APPROVED", "REJECTED"], {
    errorMap: () => ({ message: "Approval status must be PENDING, APPROVED, or REJECTED" }),
  }).default("PENDING"),
  rejectionReason: z.string().max(1000, "Rejection reason is too long").optional().nullable(),
  createdBy: z.string().uuid("Invalid Creator User ID format").optional().nullable(),
});

export const studentUpdateInputSchema = studentCreateInputSchema.partial();

export type StudentCreateInput = z.infer<typeof studentCreateInputSchema>;
export type StudentUpdateInput = z.infer<typeof studentUpdateInputSchema>;

export const validateStudentCreate = (data: unknown) => {
  return studentCreateInputSchema.parse(data);
};

export const validateStudentUpdate = (data: unknown) => {
  return studentUpdateInputSchema.parse(data);
};