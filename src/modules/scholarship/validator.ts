import { z } from "zod";
import { positiveMoneySchema } from "@/lib/money";

const scholarshipTypeSchema = z.enum(["PERCENT", "FIXED"]);

const scholarshipShape = {
  name: z.string().trim().min(1, "Name is required").max(150),
  code: z.string().trim().max(50).optional().nullable(),
  type: scholarshipTypeSchema,
  value: positiveMoneySchema,
  description: z.string().trim().max(500).optional().nullable(),
  isActive: z.boolean().optional(),
};

export const scholarshipCreateInputSchema = z.object(scholarshipShape);

export const scholarshipUpdateInputSchema = z.object(scholarshipShape).partial();

export const scholarshipGrantInputSchema = z.object({
  scholarshipId: z.string().uuid("Invalid Scholarship ID format"),
  studentId: z.string().uuid("Invalid Student ID format"),
  /** Which student fee to discount (default: the student's active fee). */
  studentFeeId: z.string().uuid("Invalid Student Fee ID format").optional(),
  /** Which fee items to discount (default: every not-skipped item). */
  feeItemIds: z.array(z.string().uuid("Invalid Fee Item ID format")).optional(),
  note: z.string().trim().max(500).optional().nullable(),
});

export type ScholarshipCreateInput = z.infer<typeof scholarshipCreateInputSchema>;
export type ScholarshipUpdateInput = z.infer<typeof scholarshipUpdateInputSchema>;
export type ScholarshipGrantInput = z.infer<typeof scholarshipGrantInputSchema>;

export const validateScholarshipCreate = (data: unknown) =>
  scholarshipCreateInputSchema.parse(data);

export const validateScholarshipUpdate = (data: unknown) =>
  scholarshipUpdateInputSchema.parse(data);

export const validateScholarshipGrant = (data: unknown) =>
  scholarshipGrantInputSchema.parse(data);
