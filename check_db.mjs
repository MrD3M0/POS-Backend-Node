import pkg from '@prisma/client';
const { PrismaClient } = pkg;

const prisma = new PrismaClient();

const tables = [
  "user", "employee", "student", "teacher", "principal", "accountant", "staff",
  "course", "batch", "batchTerm", "subject", "batchTermSubject",
  "teachingAssignment", "attendanceSession", "studentAttendance",
  "employeeAttendance", "classSchedule",
  "feeHead", "feeStructure", "feeStructureItem", "studentFee",
  "studentFeeItem", "feePayment", "feePaymentMethodLine",
  "feePaymentAllocation", "paymentMethod", "fiscalYear", "account",
  "journalEntry", "journalLine",
  "payroll", "payslip", "payslipItem", "salaryStructure",
  "salaryStructureItem", "salaryComponent",
  "exam", "examType", "examSubject", "examMark", "result",
  "resultSubject", "gradeScale",
  "period", "leaveType", "holiday", "setting", "notice",
  "noticeTarget", "auditLog",
];

let total = 0;
for (const t of tables) {
  try {
    const c = await prisma[t].count();
    if (c > 0) { console.log(`${t}: ${c}`); total += c; }
  } catch (e) {
    console.log(`${t}: ERR ${e.message}`);
  }
}
console.log(`TOTAL ROWS: ${total}`);
await prisma.$disconnect();