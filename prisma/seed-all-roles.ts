/**
 * Account seed: creates/updates the demo LOGIN accounts only, together with
 * their linked Employee + role-profile records.
 *
 * Run (from CollegeMS-Backend-Node):
 *   npm run db:seed:all
 *   # or: npx tsx prisma/seed-all-roles.ts
 *
 * Targets DATABASE_URL from .env (dev DB). Idempotent/safe to re-run:
 * uses upsert/find-or-create patterns and avoids destructive changes.
 *
 * Creates/verifies:
 * - Role accounts: ADMIN, PRINCIPAL, ACCOUNTANT, TEACHER, STAFF, STUDENT
 * - Linked Employee/role-profile records (principal/teacher/accountant/staff)
 *
 * NOTE: no other seed data is created on purpose — courses, batches, subjects,
 * students, fees, results, payroll, notices etc. must be entered per module
 * (through the app) so each module can be tested in isolation.
 */
import "dotenv/config";
import bcrypt from "bcrypt";
import { prismaMain } from "../src/lib/prismaClient";

const DEMO_PASSWORD = "Password@123";
const SALT_ROUNDS = 10;

type Role = "ADMIN" | "PRINCIPAL" | "ACCOUNTANT" | "TEACHER" | "STAFF" | "STUDENT";

async function hashPassword() {
  return bcrypt.hash(DEMO_PASSWORD, SALT_ROUNDS);
}

async function upsertUser(params: {
  email: string;
  username: string;
  role: Role;
  isActive?: boolean;
  isEmailVerified?: boolean;
}) {
  const passwordHash = await hashPassword();
  const existing = await prismaMain.user.findFirst({ where: { email: params.email } });
  if (existing) {
    // Keep existing password if user already exists? Update to known demo password for convenience.
    const user = await prismaMain.user.update({
      where: { id: existing.id },
      data: {
        username: params.username,
        role: params.role as any,
        isActive: params.isActive ?? true,
        isEmailVerified: params.isEmailVerified ?? true,
        deletedAt: null,
        failedLoginCount: 0,
        lockedUntil: null,
        passwordHash, // ensure known demo credential
      },
    });
    return { user, created: false };
  }
  const user = await prismaMain.user.create({
    data: {
      email: params.email,
      username: params.username,
      passwordHash,
      role: params.role as any,
      isActive: params.isActive ?? true,
      isEmailVerified: params.isEmailVerified ?? true,
    },
  });
  return { user, created: true };
}

async function upsertEmployeeWithProfile(params: {
  userId: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  gender: "MALE" | "FEMALE" | "OTHERS";
  designation: string;
  joinDateBs: string;
  profile: "principal" | "teacher" | "accountant" | "staff";
  qualification?: string;
  specialization?: string;
  department?: string;
}) {
  const existing = await prismaMain.employee.findFirst({
    where: { OR: [{ userId: params.userId }, { employeeCode: params.employeeCode }] },
    include: { principal: true, teacher: true, accountant: true, staff: true },
  });

  const empData = {
    userId: params.userId,
    employeeCode: params.employeeCode,
    firstName: params.firstName,
    middleName: null,
    lastName: params.lastName,
    gender: params.gender as any,
    designation: params.designation,
    joinDateBs: params.joinDateBs,
    isActive: true,
    deletedAt: null,
  };

  const employee = existing
    ? await prismaMain.employee.update({ where: { id: existing.id }, data: empData })
    : await prismaMain.employee.create({ data: empData });

  if (params.profile === "principal" && !employee.principal && !existing?.principal) {
    await prismaMain.principal.create({ data: { employeeId: employee.id } }).catch(() => {});
  }
  if (params.profile === "teacher" && !employee.teacher && !existing?.teacher) {
    await prismaMain.teacher.create({
      data: { employeeId: employee.id, qualification: params.qualification ?? "MSc", specialization: params.specialization ?? "Computer Science" },
    }).catch(() => {});
  }
  if (params.profile === "accountant" && !employee.accountant && !existing?.accountant) {
    await prismaMain.accountant.create({ data: { employeeId: employee.id } }).catch(() => {});
  }
  if (params.profile === "staff" && !employee.staff && !existing?.staff) {
    await prismaMain.staff.create({ data: { employeeId: employee.id, department: params.department ?? "Administration" } }).catch(() => {});
  }

  return prismaMain.employee.findUnique({
    where: { id: employee.id },
    include: { principal: true, teacher: true, accountant: true, staff: true, user: true },
  });
}

async function main() {
  console.log("=== Seeding role accounts (accounts only — no demo data) ===");
  console.log(`Database: ${process.env.DATABASE_URL?.replace(/:[^:@/]+@/, ":***@")}`);
  console.log(`Demo password for all seeded accounts: ${DEMO_PASSWORD}\n`);

  const admin = await upsertUser({ email: "admin@demo.edu", username: "admin", role: "ADMIN" });
  const principal = await upsertUser({ email: "principal@demo.edu", username: "principal", role: "PRINCIPAL" });
  const accountant = await upsertUser({ email: "accountant@demo.edu", username: "accountant", role: "ACCOUNTANT" });
  const teacher = await upsertUser({ email: "teacher@demo.edu", username: "teacher", role: "TEACHER" });
  const staff = await upsertUser({ email: "staff@demo.edu", username: "staff", role: "STAFF" });
  const student = await upsertUser({ email: "student@demo.edu", username: "student", role: "STUDENT" });

  // Also ensure the legacy default admin keeps working
  const legacyAdmin = await upsertUser({ email: "admin@gmail.com", username: "legacyadmin", role: "ADMIN" }).catch(() => null);

  // Employee profiles
  await upsertEmployeeWithProfile({
    userId: principal.user.id, employeeCode: "EMP-PRIN-001", firstName: "Prakash", lastName: "Principal",
    gender: "MALE", designation: "Principal", joinDateBs: "2080-01-01", profile: "principal",
  });
  await upsertEmployeeWithProfile({
    userId: teacher.user.id, employeeCode: "EMP-TEACH-001", firstName: "Tara", lastName: "Teacher",
    gender: "FEMALE", designation: "Lecturer", joinDateBs: "2080-01-01", profile: "teacher",
    qualification: "MSc CS", specialization: "Programming",
  });
  await upsertEmployeeWithProfile({
    userId: accountant.user.id, employeeCode: "EMP-ACCT-001", firstName: "Anil", lastName: "Accountant",
    gender: "MALE", designation: "Accountant", joinDateBs: "2080-01-01", profile: "accountant",
  });
  await upsertEmployeeWithProfile({
    userId: staff.user.id, employeeCode: "EMP-STAFF-001", firstName: "Suman", lastName: "Staff",
    gender: "MALE", designation: "Office Staff", joinDateBs: "2080-01-01", profile: "staff",
    department: "Administration",
  });

  // Print credentials
  const rows = [
    ["ADMIN", "admin@demo.edu", "admin", DEMO_PASSWORD, "System owner/setup/oversight"],
    ["PRINCIPAL", "principal@demo.edu", "principal", DEMO_PASSWORD, "Approvals (payroll/results), notices, oversight"],
    ["ACCOUNTANT", "accountant@demo.edu", "accountant", DEMO_PASSWORD, "Fees, journals, payroll prep/pay"],
    ["TEACHER", "teacher@demo.edu", "teacher", DEMO_PASSWORD, "Teaching/attendance/marks"],
    ["STAFF", "staff@demo.edu", "staff", DEMO_PASSWORD, "Staff role access"],
    ["STUDENT", "student@demo.edu", "student", DEMO_PASSWORD, "Student login (no student record created)"],
    ["ADMIN (legacy)", "admin@gmail.com", legacyAdmin?.user.username ?? "—", DEMO_PASSWORD, "Legacy default admin (password reset to demo)"],
  ];

  console.log("\nDUMMY ACCOUNTS (login with identifier=email or username + password):");
  console.log("Role           | Email                    | Username    | Password      | Notes");
  console.log("---------------|--------------------------|-------------|---------------|-------------------------------");
  for (const r of rows) console.log(`${r[0].padEnd(14)} | ${r[1].padEnd(24)} | ${r[2].padEnd(11)} | ${r[3].padEnd(13)} | ${r[4]}`);

  console.log(`\nCreated/updated: ${[admin, principal, accountant, teacher, staff, student].filter((r) => r.created).length} account(s).`);
  console.log("No other seed data is created — enter each module's data through the app.");
  console.log("Re-run safely anytime: npm run db:seed:all");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prismaMain.$disconnect();
  });
