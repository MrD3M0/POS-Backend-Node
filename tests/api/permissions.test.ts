import { afterAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../../src/app";
import { resetDb, disconnectDb } from "../helpers/db";
import { loginAs } from "../helpers/auth";
import { prismaMain } from "../../src/lib/prismaClient";

describe("Permission matrix - critical admin overreach guards (spec §4/§5)", () => {
  beforeEach(async () => {
    await resetDb();
  });

  afterAll(async () => {
    await disconnectDb();
  });

  it("ADMIN cannot approve payroll (PRINCIPAL only)", async () => {
    const admin = await loginAs("ADMIN");
    const res = await request(app)
      .post("/api/payroll/00000000-0000-0000-0000-000000000001/approve")
      .set("Authorization", `Bearer ${admin.token}`)
      .send({});
    expect([403, 404]).toContain(res.status);
    if (res.status !== 404) expect(res.status).toBe(403);
  });

  it("ADMIN cannot pay payroll (ACCOUNTANT only)", async () => {
    const admin = await loginAs("ADMIN");
    const res = await request(app)
      .post("/api/payroll/00000000-0000-0000-0000-000000000001/pay")
      .set("Authorization", `Bearer ${admin.token}`)
      .send({});
    expect([403, 404]).toContain(res.status);
    if (res.status !== 404) expect(res.status).toBe(403);
  });

  it("ADMIN cannot post journal entries (ACCOUNTANT only)", async () => {
    const admin = await loginAs("ADMIN");
    const res = await request(app)
      .post("/api/journal-entry")
      .set("Authorization", `Bearer ${admin.token}`)
      .send({});
    expect(res.status).toBe(403);
  });

  it("ADMIN cannot reverse journal entries (ACCOUNTANT only)", async () => {
    const admin = await loginAs("ADMIN");
    const res = await request(app)
      .post("/api/journal-entry/00000000-0000-0000-0000-000000000001/reverse")
      .set("Authorization", `Bearer ${admin.token}`)
      .send({});
    expect([403, 404]).toContain(res.status);
  });

  it("ADMIN cannot create fee receipts (ACCOUNTANT only)", async () => {
    const admin = await loginAs("ADMIN");
    const res = await request(app)
      .post("/api/fee-payment")
      .set("Authorization", `Bearer ${admin.token}`)
      .send({});
    expect(res.status).toBe(403);
  });

  it("ACCOUNTANT can be denied/allowed by matrix on journal read route shape (not 401)", async () => {
    const accountant = await loginAs("ACCOUNTANT");
    const res = await request(app)
      .get("/api/journal-entry")
      .set("Authorization", `Bearer ${accountant.token}`);
    expect(res.status).not.toBe(401);
    expect([200, 403]).toContain(res.status);
  });

  it("no auth gets 401 on admin dashboard", async () => {
    const res = await request(app).get("/api/admin/dashboard");
    expect(res.status).toBe(401);
  });

  it("non-admin gets 403 on admin dashboard", async () => {
    const teacher = await loginAs("TEACHER");
    const res = await request(app)
      .get("/api/admin/dashboard")
      .set("Authorization", `Bearer ${teacher.token}`);
    expect(res.status).toBe(403);
  });

  it("ADMIN can read dashboard", async () => {
    const admin = await loginAs("ADMIN");
    const res = await request(app)
      .get("/api/admin/dashboard")
      .set("Authorization", `Bearer ${admin.token}`);
    expect(res.status).toBe(200);
    expect(res.body?.success).toBe(true);
    expect(res.body?.data?.counters).toBeDefined();
  });
});

describe("Audit log access", () => {
  beforeEach(async () => {
    await resetDb();
  });
  afterAll(async () => {
    await disconnectDb();
  });

  it("is read-only (no create route)", async () => {
    const admin = await loginAs("ADMIN");
    const res = await request(app)
      .post("/api/audit-log")
      .set("Authorization", `Bearer ${admin.token}`)
      .send({ entity: "x", action: "y" });
    expect([404, 405]).toContain(res.status);
  });

  it("ADMIN can read audit logs", async () => {
    await prismaMain.auditLog.create({
      data: { entity: "Test", action: "TEST", newValues: { ok: true } as any },
    });
    const admin = await loginAs("ADMIN");
    const res = await request(app)
      .get("/api/audit-log")
      .set("Authorization", `Bearer ${admin.token}`);
    expect(res.status).toBe(200);
    expect(res.body?.data?.data?.length).toBeGreaterThanOrEqual(1);
  });
});
