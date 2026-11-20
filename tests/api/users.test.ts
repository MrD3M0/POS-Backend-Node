import { afterAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../../src/app";
import { resetDb, disconnectDb } from "../helpers/db";
import { createUser, loginAs } from "../helpers/auth";
import { prismaMain } from "../../src/lib/prismaClient";

describe("User and access management - protection rules (spec B)", () => {
  beforeEach(async () => {
    await resetDb();
  });
  afterAll(async () => {
    await disconnectDb();
  });

  it("cannot demote the last active admin", async () => {
    const admin = await loginAs("ADMIN");
    const res = await request(app)
      .patch(`/api/user/${admin.user.id}`)
      .set("Authorization", `Bearer ${admin.token}`)
      .send({ role: "STAFF", reason: "test" });
    expect(res.status).toBe(409);
  });

  it("cannot deactivate yourself", async () => {
    // Need another admin so "last admin" isn't the blocker; create a second admin.
    await createUser("ADMIN");
    const admin = await loginAs("ADMIN");
    const res = await request(app)
      .patch(`/api/user/${admin.user.id}`)
      .set("Authorization", `Bearer ${admin.token}`)
      .send({ isActive: false, reason: "test" });
    expect(res.status).toBe(409);
  });

  it("cannot delete yourself", async () => {
    await createUser("ADMIN");
    const admin = await loginAs("ADMIN");
    const res = await request(app)
      .delete(`/api/user/${admin.user.id}`)
      .set("Authorization", `Bearer ${admin.token}`);
    expect(res.status).toBe(409);
  });

  it("role change requires reason and writes audit", async () => {
    const admin = await loginAs("ADMIN");
    const target = await createUser("STAFF");

    const noReason = await request(app)
      .patch(`/api/user/${target.user.id}`)
      .set("Authorization", `Bearer ${admin.token}`)
      .send({ role: "TEACHER" });
    expect(noReason.status).toBe(400);

    const ok = await request(app)
      .patch(`/api/user/${target.user.id}`)
      .set("Authorization", `Bearer ${admin.token}`)
      .send({ role: "TEACHER", reason: "promotion" });
    expect(ok.status).toBe(200);

    const audit = await prismaMain.auditLog.findMany({
      where: { entity: "User", entityId: target.user.id, action: "ROLE_CHANGE" },
    });
    expect(audit.length).toBe(1);
  });

  it("reset password writes audit and clears lockout fields", async () => {
    const admin = await loginAs("ADMIN");
    const target = await createUser("STAFF");
    await prismaMain.user.update({
      where: { id: target.user.id },
      data: { failedLoginCount: 4, lockedUntil: new Date(Date.now() + 60_000) },
    });

    const res = await request(app)
      .patch(`/api/user/${target.user.id}/password`)
      .set("Authorization", `Bearer ${admin.token}`)
      .send({ password: "NewPass123!", reason: "forgot" });
    expect(res.status).toBe(200);

    const updated = await prismaMain.user.findUnique({ where: { id: target.user.id } });
    expect(updated?.failedLoginCount).toBe(0);
    expect(updated?.lockedUntil).toBeNull();

    const audit = await prismaMain.auditLog.findMany({
      where: { entity: "User", entityId: target.user.id, action: "PASSWORD_RESET" },
    });
    expect(audit.length).toBe(1);
  });
});
