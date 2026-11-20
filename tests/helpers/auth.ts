import request from "supertest";
import bcrypt from "bcrypt";
import { app } from "../../src/app";
import { prismaMain } from "../../src/lib/prismaClient";

export type TestRole = "ADMIN" | "PRINCIPAL" | "ACCOUNTANT" | "TEACHER" | "STAFF" | "STUDENT";

export async function createUser(role: TestRole, overrides: Partial<{ email: string; username: string; isActive: boolean; isEmailVerified: boolean }> = {}) {
  const email = overrides.email ?? `${role.toLowerCase()}-${Date.now()}-${Math.random().toString(36).slice(2)}@test.local`;
  const password = "TestPass123!";
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prismaMain.user.create({
    data: {
      email,
      username: overrides.username ?? null,
      passwordHash,
      role,
      isActive: overrides.isActive ?? true,
      isEmailVerified: overrides.isEmailVerified ?? true,
    },
  });
  return { user, password };
}

export async function loginAs(role: TestRole) {
  const { user, password } = await createUser(role);
  const res = await request(app)
    .post("/api/auth/login")
    .send({ identifier: user.email, password });
  if (res.status !== 200) {
    throw new Error(`loginAs(${role}) failed: ${res.status} ${JSON.stringify(res.body)}`);
  }
  const token = res.body?.token;
  const cookies = res.headers["set-cookie"];
  return { user, token, cookies, password };
}

export function auth(token?: string) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}
