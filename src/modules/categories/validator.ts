import z from "zod";

export const categoryCreateInputSchema = z.object({
  name: z
    .string({ message: "Name is required" })
    .min(1, "Name is required")
    .max(100, "Name must be at most 100 characters"),
  shortName: z
    .string({ message: "Short name is required" })
    .min(1, "Short name is required")
    .max(3, "Short name must be at most 3 characters"),
});

export type T_CategoryCreateInput = z.infer<typeof categoryCreateInputSchema>;

export const validateCategoryCreate = (data: T_CategoryCreateInput) => {
  return categoryCreateInputSchema.parse(data);
};
