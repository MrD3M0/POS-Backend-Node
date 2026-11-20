// Seed demo accounts for PRINCIPAL / TEACHER / STAFF (+ ACCOUNTANT).
// Run: npx tsx prisma/seed-users.ts
import { prismaMain } from "../src/lib/prismaClient";
import * as bcrypt from "bcrypt";

const PLAIN = "Password@123";

const DEMO = [
  { role: "PRINCIPAL", email: "principal@demo.edu", username: "principal", firstName: "Prasad", lastName: "Principal", designation: "Principal", profile: "principal" as const },
  { role: "TEACHER", email: "teacher@demo.edu", username: "teacher", firstName: "Tina", lastName: "Teacher", designation: "Lecturer", profile: "teacher" as const },
  { role: "STAFF", email: "staff@demo.edu", username: "staff", firstName: "Sita", lastName: "Staff", designation: "Staff", profile: "staff" as const },
  { role: "ACCOUNTANT", email: "accountant@demo.edu", username: "accountant", firstName: "Asha", lastName: "Accountant", designation: "Accountant", profile: "accountant" as const },
];

async function main() {
  for (const d of DEMO) {
    const existing = await prismaMain.user.findUnique({ where: { email: d.email } });
    if (existing) { console.log(`skip ${d.role}: ${d.email} already exists`); continue; }
    const hashed = await bcrypt.hash(PLAIN, 10);
    const result = await prismaMain.$transaction(async (tx) => {
      const user = await tx.user.create({ data: { email: d.email, username: d.username, passwordHash: hashed, role: d.role as any, isEmailVerified: true } });
      const emp = await tx.employee.create({
        data: { userId: user.id, employeeCode: `EMP-${d.role.slice(0, 3)}-${Date.now().toString().slice(-4)}`, firstName: d.firstName, lastName: d.lastName, gender: "FEMALE", designation: d.designation, joinDateBs: "2080-01-01", isActive: true },
      });
      if (d.profile === "principal") await tx.principal.create({ data: { employeeId: emp.id } });
      if (d.profile === "teacher") await tx.teacher.create({ data: { employeeId: emp.id, qualification: "MSc" } });
      if (d.profile === "staff") await tx.staff.create({ data: { employeeId: emp.id, department: "Administration" } });
      if (d.profile === "accountant") await tx.accountant.create({ data: { employeeId: emp.id } });
      return { user, emp };
    });
    console.log(`created ${d.role}: ${d.email} / ${PLAIN} (emp ${result.emp.employeeCode})`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prismaMain.$disconnect());
