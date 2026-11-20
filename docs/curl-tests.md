# Accounting & fee curl tests (features 7 + 8)

Acceptance examples. Base URL comes from the server (e.g.
`http://localhost:3000`), and `$TOKEN` is an ADMIN/ACCOUNTANT JWT.

```bash
BASE=http://localhost:3000
AUTH="-H 'Content-Type: application/json' -H 'Authorization: Bearer $TOKEN'"
```

## Setup: default chart + fiscal year + payment method accounts

```bash
# 1) seed the default chart of accounts (idempotent, isSystem = true)
curl -s $BASE/account/seed-default -X POST $AUTH

# 2) create the current fiscal year
curl -s $BASE/fiscal-year -X POST $AUTH -d '{
  "name": "2081/82", "startDateBs": "2081-04-01", "endDateBs": "2082-03-31",
  "isCurrent": true
}'
# => 201 { data: { ..., "isCurrent": true } }
# creating a second isCurrent year atomically clears this one.

# 3) map payment methods to ledger accounts (required for fee journals)
curl -s $BASE/payment-method -X POST $AUTH -d '{
  "name": "Cash", "code": "CASH", "accountId": "<cash-account-id>"
}'
```

## Accounting

```bash
# journal entry: >= 2 lines, debit == credit
ASTID=$(curl -s $BASE/account -H 'Authorization: Bearer $TOKEN' | ...) # ids omitted for brevity
curl -s $BASE/journal-entry -X POST $AUTH -d '{
  "fiscalYearId": "<fy-id>", "dateBs": "2081-04-05",
  "description": "Opened bank account",
  "lines": [
    { "accountId": "<cash-id>",  "debit": "500000" },
    { "accountId": "<equity-id>","credit": "500000" }
  ]
}'
# => 201, entryNo "JV-2081/82-000001", isBackdated true

# unbalanced / single-line / group-account attempts => 400
curl -s $BASE/journal-entry -X POST $AUTH -d '{...one line only...}'

# reversal (only supported correction)
curl -s $BASE/journal-entry/<entry-id>/reverse -X POST $AUTH -d '{}'
# => 201 mirror entry with reversalOfId; original isReversed = true
# reversing again => 400 "already reversed"; reversing a reversal => 400

# delete is blocked => 409 "append-only"
curl -s -X DELETE $BASE/journal-entry/<entry-id> -H 'Authorization: Bearer $TOKEN'

# closed-year rejects postings
curl -s $BASE/fiscal-year/<fy-id> -X PATCH $AUTH -d '{ "isClosed": true }'
curl -s $BASE/journal-entry -X POST $AUTH -d '{...entry in closed fy...}' # => 400 closed
```

## Fee flow

```bash
# fee structure (course default) with nested items
curl -s $BASE/fee-structure -X POST $AUTH -d '{
  "courseId": "<course-id>", "name": "FY 2081 default",
  "items": [
    { "feeHeadId": "<tuition>", "termNumber": 1, "amount": "25000" },
    { "feeHeadId": "<admission>", "termNumber": null, "amount": "5000" }
  ]
}'

# batch override structure for one batch
curl -s $BASE/fee-structure -X POST $AUTH -d '{
  "courseId": "<course-id>", "batchId": "<batch-id>", "name": "2080 override", "items": []
}'

# assign to a student (auto-resolves batch override -> course default;
# netAmount = amount - discount, discount starts at 0)
curl -s $BASE/student-fee -X POST $AUTH -d '{
  "studentId": "<student-id>"
}'
# => StudentFee with copied items; repeating => 409

# discount requires a reason; skip requires a reason; net recomputed
curl -s $BASE/student-fee-item/<item-id> -X PATCH $AUTH -d '{
  "discountAmount": "2000"
}'  # => 400 discount requires a reason
curl -s $BASE/student-fee-item/<item-id> -X PATCH $AUTH -d '{
  "discountAmount": "2000", "discountReason": "Sibling discount"
}'  # => 200, netAmount = amount - 2000

# installments: bulk set must sum to netAmount
curl -s $BASE/fee-installment/bulk -X POST $AUTH -d '{
  "studentFeeItemId": "<item-id>",
  "installments": [
    { "installmentNo": 1, "dueDateBs": "2081-05-01", "amount": "10000" },
    { "installmentNo": 2, "dueDateBs": "2081-06-01", "amount": "13000" }
  ]
}'  # => 201 (23_000 = netAmount) ; mismatch => 400

# record a payment: methodLines == total == allocations; auto-posts the
# FEE_PAYMENT journal entry (Dr payment-method account / Cr FEE-INCOME)
curl -s $BASE/fee-payment -X POST $AUTH -d '{
  "studentId": "<student-id>", "fiscalYearId": "<fy-id>",
  "paymentDateBs": "2081-04-05", "totalAmount": "10000",
  "methodLines": [{ "paymentMethodId": "<cash-method-id>", "amount": "10000" }],
  "allocations": [{ "studentFeeItemId": "<item-id>", "amount": "10000" }]
}'
# => 201, receiptNo "RC-2081/82-000001", journalEntryId set
# over-allocation => 400 "exceeds remaining due"; sums mismatch => 400

# cancel = reversal only, never delete
curl -s $BASE/fee-payment/<payment-id>/cancel -X POST $AUTH -d '{ "reason": "Wrong receipt" }'
# => 200 isCancelled = true + FEE_PAYMENT_CANCEL reversal entry
curl -s -X DELETE $BASE/fee-payment/<payment-id> -H 'Authorization: Bearer $TOKEN'
# => 409 "append-only"

# dues + defaulter flag
curl -s $BASE/student/<student-id>/dues -H 'Authorization: Bearer $TOKEN'
# => { totalNet, totalPaid, totalDue, isDefaulter, items[], installments[] }
```

## Negative cases verified by construction

- `entryNo`/`receiptNo` collisions (P2002) retry the transaction once, then 409.
- Closed fiscal years reject manual postings, fee payments, and reversals.
- Posting to group/inactive/missing accounts → 400/404.
- System accounts (`isSystem`) refuse deletion; accounts with postings refuse deletion.
- `isCurrent` uniqueness is transactional (single current year).
- Direct POST/DELETE on `/fee-payment-method-line` and `/fee-payment-allocation` → 409.
