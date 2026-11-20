"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isNonWorkingDay = isNonWorkingDay;
exports.attendanceFactor = attendanceFactor;
exports.summarizeAttendance = summarizeAttendance;
exports.resolveItemAmount = resolveItemAmount;
exports.computeTeachingPay = computeTeachingPay;
exports.computeAnnualTaxProgressive = computeAnnualTaxProgressive;
exports.calculatePayslip = calculatePayslip;
// =====================================================================
// calc.ts — Pure payroll math (Decimal), no DB access.
// ---------------------------------------------------------------------
// Rules (Feature 9 / DECISIONS.md):
//  - Attendance factor: PRESENT=1, LATE=1, ABSENT=0,
//    LEAVE = 1 when LeaveType.isPaid else 0.
//  - Days with no record inside the BS month count as ABSENT (0),
//    except Saturdays under WORKING_DAYS_MODE=WORKING (non-working).
//  - attendanceDeduction = basic * (payableDays - paidEquivalentDays) / payableDays
//    where payableDays = BS month length (CALENDAR) or length minus
//    Saturdays (WORKING). UCRAINIAN: never hardcode 30.
//  - Allowances: SalaryStructureItem rows whose component is neither
//    deduction nor employer contribution (BASIC itself is skipped:
//    SalaryStructure.basicSalary is authoritative). isPercentOfBasic
//    means amount is a percent of basic (else lump-sum).
//  - teachingPay: TeacherBatchPay effective in the month —
//    fixedMonthlyAmount, else ratePerCreditHour * creditHour of the
//    assignment's BatchTermSubject.
//  - Deductions: SSF/PF/CIT etc. components with isDeduction=true
//    (same percent/lump-sum resolution). Employer contributions
//    (isEmployerContribution=true) are snapshotted on the payslip but
//    are NOT subtracted from net pay.
//  - TDS: progressive over annualized taxable income using TaxSlab
//    rows of the payroll's fiscal year (single slabs); monthly tax =
//    annual tax / 12. No hardcoded rates in calculation code.
//  - gross = (basic - attendanceDeduction) + allowances + teachingPay
//    totalDeduction = component deductions + tax
//    net = gross - totalDeduction (clamped >= 0)
// =====================================================================
const client_js_1 = require("../../generated/prisma/client.js");
const Decimal = client_js_1.Prisma.Decimal;
const bs_date_1 = require("@/utils/bs-date");
/**
 * Non-working day rules (WORKING_DAYS_MODE):
 *  - CALENDAR: every day payable
 *  - EXCLUDE_HOLIDAYS: holidays skipped
 *  - EXCLUDE_HOLIDAYS_AND_WEEKLY_OFF: holidays + Saturdays skipped
 *  - WORKING (legacy): Saturdays skipped, holidays not consulted
 */
function isNonWorkingDay(dateBs, mode, holidayDates = new Set()) {
    const saturday = (0, bs_date_1.isSaturdayBs)(dateBs);
    switch (mode) {
        case "EXCLUDE_HOLIDAYS":
            return holidayDates.has(dateBs);
        case "EXCLUDE_HOLIDAYS_AND_WEEKLY_OFF":
            return saturday || holidayDates.has(dateBs);
        case "WORKING":
            return saturday;
        default:
            return false;
    }
}
function attendanceFactor(status, isPaidLeave) {
    switch (status) {
        case "PRESENT":
            return 1;
        case "LATE":
            return 1;
        case "ABSENT":
            return 0;
        case "LEAVE":
            return isPaidLeave ? 1 : 0;
    }
}
function summarizeAttendance(records, yearBs, monthBs, workingDaysMode, holidayDates = new Set()) {
    const byDate = new Map(records.map((r) => [r.dateBs, r]));
    const skip = (dateBs) => isNonWorkingDay(dateBs, workingDaysMode, holidayDates);
    let present = 0;
    let half = 0;
    let late = 0;
    let paidLeave = 0;
    let unpaidLeave = 0;
    let absent = 0;
    let paidEquivalent = new Decimal(0);
    const allDates = (0, bs_date_1.listBsDatesInMonth)(yearBs, monthBs);
    for (const dateBs of allDates) {
        if (skip(dateBs))
            continue; // non-working day: not absent, not payable
        const rec = byDate.get(dateBs);
        if (!rec) {
            absent++; // unmarked working day = absent
            continue;
        }
        paidEquivalent = paidEquivalent.plus(attendanceFactor(rec.status, rec.isPaidLeave));
        if (rec.status === "PRESENT")
            present++;
        else if (rec.status === "LATE")
            late++;
        else if (rec.status === "LEAVE") {
            if (rec.isPaidLeave)
                paidLeave++;
            else
                unpaidLeave++;
        }
        else
            absent++;
    }
    const payableDays = allDates.filter((dateBs) => !skip(dateBs)).length;
    const unpaidDays = Decimal.max(0, new Decimal(payableDays).minus(paidEquivalent));
    return {
        payableDays,
        presentDays: new Decimal(present)
            .plus(new Decimal(late))
            .plus(new Decimal(half).times(0.5)),
        halfDays: half,
        lateDays: late,
        paidLeaveDays: paidLeave,
        unpaidLeaveDays: unpaidLeave,
        absentDays: absent + unpaidLeave * 0, // unpaid leave is its own bucket; deduction counts both
        paidEquivalentDays: paidEquivalent,
        unpaidDays,
    };
}
function resolveItemAmount(basic, amount, isPercentOfBasic) {
    return isPercentOfBasic ? basic.times(amount).div(100) : amount;
}
function computeTeachingPay(pays) {
    return pays.reduce((sum, p) => {
        if (p.fixedMonthlyAmount)
            return sum.plus(p.fixedMonthlyAmount);
        if (p.ratePerCreditHour)
            return sum.plus(p.ratePerCreditHour.times(p.creditHour));
        return sum;
    }, new Decimal(0));
}
/** Progressive tax on an annualized income. Monthly tax = result / 12. */
function computeAnnualTaxProgressive(annualIncome, slabs) {
    const ordered = [...slabs].sort((a, b) => a.fromAmount.comparedTo(b.fromAmount));
    let tax = new Decimal(0);
    for (const slab of ordered) {
        if (annualIncome.comparedTo(slab.fromAmount) <= 0)
            continue;
        const upper = slab.toAmount ?? annualIncome;
        const slice = Decimal.min(annualIncome, upper).minus(slab.fromAmount);
        if (slice.gt(0))
            tax = tax.plus(slice.times(slab.ratePercent).div(100));
    }
    return tax;
}
function calculatePayslip(input) {
    const { basicSalary, attendance, structureItems, teachingPay, taxSlabs } = input;
    // attendanceDeduction = basic / payableDays * unpaidDays
    const attendanceDeduction = attendance.payableDays > 0
        ? basicSalary.times(attendance.unpaidDays).div(attendance.payableDays)
        : new Decimal(0);
    const basicEarned = basicSalary.minus(attendanceDeduction);
    const allowanceItems = [];
    const deductionItems = [];
    const employerItems = [];
    for (const item of structureItems) {
        if (item.code === "BASIC")
            continue; // basicSalary is authoritative
        if (item.code === "TDS")
            continue; // income tax is computed from TaxSlabs, not structure items
        const amount = resolveItemAmount(basicSalary, item.amount, item.isPercentOfBasic);
        if (item.isEmployerContribution)
            employerItems.push({ code: item.code, name: item.name, amount });
        else if (item.isDeduction)
            deductionItems.push({ code: item.code, name: item.name, amount });
        else
            allowanceItems.push({ code: item.code, name: item.name, amount });
    }
    const totalAllowance = allowanceItems.reduce((s, i) => s.plus(i.amount), new Decimal(0));
    const deductionSum = deductionItems.reduce((s, i) => s.plus(i.amount), new Decimal(0));
    const grossPay = basicEarned.plus(totalAllowance).plus(teachingPay);
    // Taxable: basicEarned + taxable allowances + teachingPay (annualized).
    // NOTE: Nepal income tax is yearly; we annualize the month and return to monthly.
    const taxableAllowance = structureItems
        .filter((i) => i.code !== "BASIC" &&
        !i.isDeduction &&
        !i.isEmployerContribution &&
        i.isTaxable)
        .reduce((s, i) => s.plus(resolveItemAmount(basicSalary, i.amount, i.isPercentOfBasic)), new Decimal(0));
    const taxableMonthly = basicEarned.plus(taxableAllowance).plus(teachingPay);
    const annualTax = computeAnnualTaxProgressive(taxableMonthly.times(12), taxSlabs);
    const taxAmount = annualTax.div(12);
    const totalDeduction = deductionSum.plus(taxAmount);
    const netPay = Decimal.max(0, grossPay.minus(totalDeduction));
    return {
        attendance,
        attendanceDeduction,
        allowanceItems,
        deductionItems,
        employerItems,
        totalAllowance,
        totalDeduction,
        taxAmount,
        teachingPay,
        grossPay,
        netPay,
        basicEarned,
    };
}
