// Student fields safe to return in nested includes.
// The dev DB stores the student status in `studentStatusId` /
// `approvalStatusId` lookup columns, so a plain `student: true` include
// breaks there. Selecting the columns explicitly keeps the nested include
// working on both shapes.
export const STUDENT_SAFE_SELECT = {
  id: true,
  userId: true,
  universityRegNo: true,
  firstName: true,
  middleName: true,
  lastName: true,
  gender: true,
  dobBs: true,
  phone: true,
  email: true,
  batchId: true,
  admissionDateBs: true,
  photoUrl: true,
  permanentAddress: true,
  temporaryAddress: true,
  approvedBy: true,
  approvedAt: true,
  rejectionReason: true,
  createdAt: true,
  updatedAt: true,
  createdBy: true,
  updatedBy: true,
  deletedAt: true,
} as const;

// Course fields safe to return in nested includes.
// `courses.system` only exists in the Prisma schema; the dev DB stores the
// course system in `courseSystemId` -> course_systems.code, so a plain
// `course: true` include breaks there.
export const COURSE_SAFE_SELECT = {
  id: true,
  code: true,
  name: true,
  totalTerms: true,
  description: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  createdBy: true,
  updatedBy: true,
  deletedAt: true,
} as const;

// Batch fields safe to return in nested includes (no enum columns, but kept
// next to the other safe selects so every nested include uses the same rule).
export const BATCH_SAFE_SELECT = {
  id: true,
  courseId: true,
  name: true,
  startDateBs: true,
  currentTermNumber: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  createdBy: true,
  updatedBy: true,
  deletedAt: true,
} as const;

// Account fields safe to return in nested includes.
// `accounts.type` only exists in the Prisma schema; the dev DB stores the
// type in `accountTypeId` -> account_types.code.
export const ACCOUNT_SAFE_SELECT = {
  id: true,
  code: true,
  name: true,
  parentId: true,
  isGroup: true,
  isSystem: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  createdBy: true,
  updatedBy: true,
  deletedAt: true,
} as const;
