import { z } from "zod";

export const employeeCreateInputSchema = z.object({
  userId: z.string().uuid("Invalid User ID format").optional().nullable(),
  employeeCode: z.string().min(1, "Employee code is required").max(50, "Employee code is too long"),
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
  designation: z.string().min(1, "Designation is required").max(100, "Designation is too long"),
  joinDateBs: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  leaveDateBs: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").optional().nullable(),
  panNo: z.string().max(20, "PAN number is too long").optional().nullable(),
  ssfNo: z.string().max(20, "SSF number is too long").optional().nullable(),
  bankName: z.string().max(100, "Bank name is too long").optional().nullable(),
  bankAccountNo: z.string().max(50, "Bank account number is too long").optional().nullable(),
  isActive: z.boolean().default(true),
});

export const employeeUpdateInputSchema = employeeCreateInputSchema.partial();

export type EmployeeCreateInput = z.infer<typeof employeeCreateInputSchema>;
export type EmployeeUpdateInput = z.infer<typeof employeeUpdateInputSchema>;

export const validateEmployeeCreate = (data: unknown) => {
  return employeeCreateInputSchema.parse(data);
};

export const validateEmployeeUpdate = (data: unknown) => {
  return employeeUpdateInputSchema.parse(data);
};