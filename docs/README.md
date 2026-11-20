# Accounting & Fee module notes (features 7 + 8)

Hardening summary (see `src/lib/accounting.ts`, `src/lib/money.ts`,
`src/lib/dues.ts`).

## Double-entry rules (journal-entry / journal-line)

- A journal entry must have **≥ 2 lines**, each line sets **exactly one of
  debit or credit** (XOR), and **total debit == total credit** — all money
  math in `Prisma.Decimal`, never float.
- Lines only post to **active, non-group, non-deleted** accounts
  (`Account.isGroup` = heading only). DB backup:
  `docs/constraints.sql` (apply after migrate:
  `psql "$DATABASE_URL" -f docs/constraints.sql`).
- `entryNo = JV-<fiscalYear.name>-<6-digit seq>` generated server-side,
  transaction-scoped max+1 with a unique column; a P2002 collision retries
  the whole transaction once, then 409s.
- `dateBs` must fall inside the entry's fiscal year (`startDateBs..endDateBs`,
  zero-padded BS strings compare chronologically). Entries dated before
  today get `isBackdated = true` (today from the Nepali date converter).
- A **closed** fiscal year (`isClosed = true`) rejects all postings:
  manual entries, fee payments, and reversals.
- Corrections are **reversal-only**: `POST /journal-entry/:id/reverse`
  posts a mirror entry with debit/credit swapped, `reversalOfId` set, the
  original flagged `isReversed`. Reversing an already-reversed entry — or a
  reversal itself — is rejected. DELETE on journal entries/lines returns 409.
- **Exactly one current fiscal year** system-wide: creating or updating a
  year with `isCurrent: true` atomically clears the others. The current
  year cannot be deleted; years with postings cannot be deleted either
  (close them instead).
- **System accounts** (`isSystem = true`, created by `POST /api/account/seed-default`) cannot
  be deleted; accounts with postings, children, or payment-method mappings
  cannot be deleted either.

### Chart of accounts (minimal default chart)

`POST /api/account/seed-default` (ADMIN) upserts (idempotent by `code`):

| Code     | Name                 | Type     |
| -------- | -------------------- | -------- |
| `1000`   | Cash                 | ASSET    |
| `1100`   | Bank                 | ASSET    |
| `1200`   | Accounts Receivable  | ASSET    |
| `3000`   | Equity               | EQUITY   |
| `4000` / `FEE-INCOME` | Fee Income | INCOME |
| `5000`   | Salary Expense       | EXPENSE  |
| `2100`   | SSF Payable          | LIABILITY|
| `2110`   | PF Payable           | LIABILITY|
| `2120`   | TDS Payable          | LIABILITY|

Run with `POST /api/account/seed-default` (needs a logged-in ADMIN). Accounts
are created with `isSystem = true` so they are protected. Fee payments credit
the account with code `FEE-INCOME` — seed it before recording the first payment.

## Fee flow (feature 8)

- **Structure:** `batchId = null` → course default; set → batch override
  (batch must belong to the course). Assign resolves batch override first,
  then the course default. Nested `items` on create.
- **Assign:** `POST /student-fee` copies structure items with
  `netAmount = amount - discountAmount` (discount starts at 0). Reassigning
  the same structure to the same student → 409.
- **Per-student item rules:** `netAmount` is always computed server-side.
  A positive discount requires `discountReason`; `isSkipped` requires
  `skipReason`. Changing amount/discount after payments exist → 409.
- **Installments:** one-by-one adds must never exceed `netAmount`;
  `POST /fee-installment/bulk` schedules a full set whose amounts **sum
  exactly to `netAmount`** (atomic). Skipped fees take no installments.
- **Payment:** `POST /fee-payment` takes `{ totalAmount, methodLines[],
  allocations[] }` — `sum(methodLines) == total == sum(allocations)` is
  required, each allocation must fit the item's remaining due (and the
  installment's, when given), the fiscal year must be open and contain
  `paymentDateBs`. In the same transaction it issues
  `receiptNo = RC-<fiscalYear>-<6-digit seq>` and auto-posts a
  `FEE_PAYMENT` journal entry: Dr each payment-method's ledger account,
  Cr `FEE-INCOME` per allocation. Method lines/allocations are write-once —
  their direct POST/DELETE endpoints return 409.
- **Cancel:** `POST /fee-payment/:id/cancel` (reason required) posts a
  `FEE_PAYMENT_CANCEL` reversal in the same transaction and flags the
  payment `isCancelled`. Payments are never deleted (DELETE → 409).
- **Dues:** `GET /student/:id/dues` returns per-item net/paid/remaining,
  per-installment remaining, totals, and `isDefaulter` (owes money with a
  passed item/installment due date). Cancelled payments count as unpaid.

## Money & BS conventions

- All amounts are `Decimal(14,2)` handled via `Prisma.Decimal` helpers in
  `src/lib/money.ts` (no float anywhere in fee/accounting math).
- BS dates are `YYYY-MM-DD` strings from `src/utils/bs-date.ts`
  (converter-backed month lengths/weekdays; no 30-day assumption).
