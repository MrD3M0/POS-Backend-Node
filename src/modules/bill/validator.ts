// bill/validator.ts
import z from "zod";

export const billCreateInputSchema = z.object({
  discountType: z.enum(["Exact", "Percentage"], {
    message: "Discount type must be Exact or Percentage",
  }),
  discount: z
    .number({ message: "Discount is required" })
    .nonnegative("Discount cannot be negative")
    .default(0),
  products: z
    .array(
      z.object({
        productId: z.string({ message: "Product ID is required" }),
        quantity: z
          .number({ message: "Quantity is required" })
          .int("Quantity must be an integer")
          .positive("Quantity must be greater than 0"),
      }),
    )
    .min(1, "At least one product is required"),
});

export type T_BillCreateInput = z.infer<typeof billCreateInputSchema>;

export const validateBillCreate = (data: T_BillCreateInput) => {
  return billCreateInputSchema.parse(data);
};
