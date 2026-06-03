import z from "zod";

const LoginSchema = z.object({
  email: z.email({ message: "Email is required" }),
  password: z
    .string({ message: "Password is required" })
    .min(6, "Password must be at least 6 characters long"),
});
export type T_LoginSchema = z.infer<typeof LoginSchema>;

export function ValidateLogin(data: unknown): T_LoginSchema {
  return LoginSchema.parse(data);
}

const RegisterSchema = z.object({
  username: z
    .string({ message: "Username is required" })
    .trim()
    .min(1, { message: "Username Cannot be empty" }),
  email: z
    .email({ message: "Email is required" })
    .trim()
    .min(1, { message: "Email Cannot be empty" }),
  password: z
    .string()
    .trim()
    .min(6, { message: "Password must be at least 14 characters" }),
});

export type T_RegisterSchema = z.infer<typeof RegisterSchema>;

export function ValidateRegister(data: unknown): T_RegisterSchema {
  return RegisterSchema.parse(data);
}
