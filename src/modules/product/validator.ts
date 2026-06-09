import z from "zod";

export const productCreateInputSchema = z.object({
  name: z
    .string({ message: "Name is required" })
    .min(1, "Name is required")
    .max(100, "Name must be at most 100 characters"),
  shortName: z
    .string({ message: "Short name is required" })
    .min(1, "Short name is required")
    .max(50, "Short name must be at most 50 characters"),
  price: z
    .number({ message: "Price is required" })
    .positive("Price must be a positive number"),
  quantity: z
    .number({ message: "Quantity is required" })
    .int("Quantity must be an integer")
    .nonnegative("Quantity cannot be negative")
    .default(0),
  categoryId: z
    .string({ message: "Category ID is required" })
    .min(1, "Category ID is required"),
});

export type T_ProductCreateInput = z.infer<typeof productCreateInputSchema>;

export const validateProductCreate = (data: T_ProductCreateInput) => {
  return productCreateInputSchema.parse(data);
};
