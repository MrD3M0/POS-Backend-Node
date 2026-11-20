import { afterAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { app } from "../../src/app";
import { resetDb, disconnectDb } from "../helpers/db";
import { loginAs, createUser } from "../helpers/auth";
import { prismaMain } from "../../src/lib/prismaClient";

async function seedCourseAndBatch() {
  const course = await prismaMain.course.create({
    data: { code: "BIT", name: "BIT", system: "SEMESTER", totalTerms: 8, isActive: true },
  });
  // Use the API/service path? Easier to create batch via API as admin to ensure terms are auto-created.
  return { course };
}

describe("Student approval queue (spec D)", () => {
  beforeEach(async () => {
    await resetDb();
  });
  afterAll(async () => {
    await disconnectDb();
  });

  it("creates batch with auto-created terms, creates PENDING student, admin approves", async () => {
    const admin = await loginAs("ADMIN");
    const { course } = await seedCourseAndBatch();

    const batchRes = await request(app)
      .post("/api/batch")
      .set("Authorization", `Bearer ${admin.token}`)
      .send({ courseId: course.id, name: "2081", startDateBs: "2081-04-01", currentTermNumber: 1, isActive: true });
    expect(batchRes.status).toBe(201);
    const batchId = batchRes.body?.data?.id;
    expect(batchId).toBeTruthy();

    const terms = await prismaMain.batchTerm.count({ where: { batchId } });
    expect(terms).toBe(8);

    const studentRes = await request(app)
      .post("/api/student")
      .set("Authorization", `Bearer ${admin.token}`)
      .send({
        universityRegNo: "REG-001",
        firstName: "Ram",
        lastName: "Sharma",
        gender: "MALE",
        batchId,
        admissionDateBs: "2081-04-15",
      });
    expect([200, 201]).toContain(studentRes.status);
    const studentId = studentRes.body?.data?.id;
    expect(studentId).toBeTruthy();

    const created = await prismaMain.student.findUnique({ where: { id: studentId } });
    expect(created?.approvalStatus).toBe("PENDING");

    // Creator cannot approve their own student; use a different admin.
    const approver = await loginAs("ADMIN");
    const approveRes = await request(app)
      .post(`/api/student/${studentId}/approve`)
      .set("Authorization", `Bearer ${approver.token}`)
      .send({});
    expect(approveRes.status).toBe(200);

    const approved = await prismaMain.student.findUnique({ where: { id: studentId } });
    expect(approved?.approvalStatus).toBe("APPROVED");
    expect(approved?.approvedBy).toBe(approver.user.id);
    expect(approved?.approvedAt).toBeTruthy();
  });

  it("reject requires a reason", async () => {
    const admin = await loginAs("ADMIN");
    const { course } = await seedCourseAndBatch();
    const batchRes = await request(app)
      .post("/api/batch")
      .set("Authorization", `Bearer ${admin.token}`)
      .send({ courseId: course.id, name: "2081", startDateBs: "2081-04-01", currentTermNumber: 1, isActive: true });
    const batchId = batchRes.body?.data?.id;

    const studentRes = await request(app)
      .post("/api/student")
      .set("Authorization", `Bearer ${admin.token}`)
      .send({ universityRegNo: "REG-002", firstName: "Sita", lastName: "K", gender: "FEMALE", batchId, admissionDateBs: "2081-04-15" });
    const studentId = studentRes.body?.data?.id;

    const bad = await request(app)
      .post(`/api/student/${studentId}/reject`)
      .set("Authorization", `Bearer ${admin.token}`)
      .send({});
    expect(bad.status).toBeGreaterThanOrEqual(400);
    expect(bad.status).toBeLessThan(500);
  });

  it("bulk approve reports per-row results", async () => {
    const admin = await loginAs("ADMIN");
    const res = await request(app)
      .post("/api/student/bulk-approve")
      .set("Authorization", `Bearer ${admin.token}`)
      .send({ ids: ["00000000-0000-0000-0000-000000000099"] });
    expect(res.status).toBe(200);
    expect(res.body?.data?.results?.[0]?.success).toBe(false);
  });
});
