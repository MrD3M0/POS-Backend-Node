-- Idempotent role-account seed for the ACTUAL dev DB schema (normalized/legacy).
-- Creates login accounts for all roles + linked employee profiles.
-- Safe to re-run (uses ON CONFLICT / existence checks).
-- Password for all demo accounts below: Password@123
-- bcrypt hash (cost 10) for Password@123: $2b$10$6PgYuTQXI09M/dL2WWevHuUNQAQIxqbHm7Bpvp.LQ1pXTCsHVEUlW

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  v_hash text := '$2b$10$6PgYuTQXI09M/dL2WWevHuUNQAQIxqbHm7Bpvp.LQ1pXTCsHVEUlW';
  v_admin_id uuid; v_principal_id uuid; v_accountant_id uuid; v_teacher_id uuid; v_staff_id uuid; v_student_user_id uuid;
  v_principal_emp uuid; v_accountant_emp uuid; v_teacher_emp uuid; v_staff_emp uuid;
BEGIN
  -- ADMIN (demo)
  INSERT INTO users (id, email, username, "passwordHash", role, "isAdmin", "isActive", "isEmailVerified", "failedLoginCount", "createdAt", "updatedAt")
  VALUES (gen_random_uuid(), 'admin@demo.edu', 'admin', v_hash, 'ADMIN', true, true, true, 0, now(), now())
  ON CONFLICT (email) DO UPDATE SET username=EXCLUDED.username, "passwordHash"=EXCLUDED."passwordHash", role='ADMIN', "isAdmin"=true, "isActive"=true, "isEmailVerified"=true, "failedLoginCount"=0, "lockedUntil"=null, "deletedAt"=null, "updatedAt"=now();
  SELECT id INTO v_admin_id FROM users WHERE email='admin@demo.edu';

  -- Keep legacy admin usable with known demo password
  UPDATE users SET "passwordHash"=v_hash, "isActive"=true, "isEmailVerified"=true, "failedLoginCount"=0, "lockedUntil"=null, "deletedAt"=null, "updatedAt"=now() WHERE email='admin@gmail.com';

  -- PRINCIPAL
  INSERT INTO users (id, email, username, "passwordHash", role, "isAdmin", "isActive", "isEmailVerified", "failedLoginCount", "createdAt", "updatedAt")
  VALUES (gen_random_uuid(), 'principal@demo.edu', 'principal', v_hash, 'PRINCIPAL', false, true, true, 0, now(), now())
  ON CONFLICT (email) DO UPDATE SET username=EXCLUDED.username, "passwordHash"=EXCLUDED."passwordHash", role='PRINCIPAL', "isActive"=true, "isEmailVerified"=true, "failedLoginCount"=0, "lockedUntil"=null, "deletedAt"=null, "updatedAt"=now();
  SELECT id INTO v_principal_id FROM users WHERE email='principal@demo.edu';

  INSERT INTO employees (id, "userId", "employeeCode", "firstName", "lastName", gender, designation, "joinDateBs", "isActive", "createdAt", "updatedAt")
  VALUES (gen_random_uuid(), v_principal_id, 'EMP-PRIN-001', 'Prakash', 'Principal', 'MALE', 'Principal', '2080-01-01', true, now(), now())
  ON CONFLICT ("employeeCode") DO UPDATE SET "userId"=EXCLUDED."userId", "isActive"=true, "deletedAt"=null, "updatedAt"=now();
  SELECT id INTO v_principal_emp FROM employees WHERE "employeeCode"='EMP-PRIN-001';
  INSERT INTO principals (id, "employeeId", "createdAt", "updatedAt") VALUES (gen_random_uuid(), v_principal_emp, now(), now())
  ON CONFLICT ("employeeId") DO NOTHING;

  -- ACCOUNTANT
  INSERT INTO users (id, email, username, "passwordHash", role, "isAdmin", "isActive", "isEmailVerified", "failedLoginCount", "createdAt", "updatedAt")
  VALUES (gen_random_uuid(), 'accountant@demo.edu', 'accountant', v_hash, 'ACCOUNTANT', false, true, true, 0, now(), now())
  ON CONFLICT (email) DO UPDATE SET username=EXCLUDED.username, "passwordHash"=EXCLUDED."passwordHash", role='ACCOUNTANT', "isActive"=true, "isEmailVerified"=true, "failedLoginCount"=0, "lockedUntil"=null, "deletedAt"=null, "updatedAt"=now();
  SELECT id INTO v_accountant_id FROM users WHERE email='accountant@demo.edu';

  INSERT INTO employees (id, "userId", "employeeCode", "firstName", "lastName", gender, designation, "joinDateBs", "isActive", "createdAt", "updatedAt")
  VALUES (gen_random_uuid(), v_accountant_id, 'EMP-ACCT-001', 'Anil', 'Accountant', 'MALE', 'Accountant', '2080-01-01', true, now(), now())
  ON CONFLICT ("employeeCode") DO UPDATE SET "userId"=EXCLUDED."userId", "isActive"=true, "deletedAt"=null, "updatedAt"=now();
  SELECT id INTO v_accountant_emp FROM employees WHERE "employeeCode"='EMP-ACCT-001';
  INSERT INTO accountants (id, "employeeId", "createdAt", "updatedAt") VALUES (gen_random_uuid(), v_accountant_emp, now(), now())
  ON CONFLICT ("employeeId") DO NOTHING;

  -- TEACHER
  INSERT INTO users (id, email, username, "passwordHash", role, "isAdmin", "isActive", "isEmailVerified", "failedLoginCount", "createdAt", "updatedAt")
  VALUES (gen_random_uuid(), 'teacher@demo.edu', 'teacher', v_hash, 'TEACHER', false, true, true, 0, now(), now())
  ON CONFLICT (email) DO UPDATE SET username=EXCLUDED.username, "passwordHash"=EXCLUDED."passwordHash", role='TEACHER', "isActive"=true, "isEmailVerified"=true, "failedLoginCount"=0, "lockedUntil"=null, "deletedAt"=null, "updatedAt"=now();
  SELECT id INTO v_teacher_id FROM users WHERE email='teacher@demo.edu';

  INSERT INTO employees (id, "userId", "employeeCode", "firstName", "lastName", gender, designation, "joinDateBs", "isActive", "createdAt", "updatedAt")
  VALUES (gen_random_uuid(), v_teacher_id, 'EMP-TEACH-001', 'Tara', 'Teacher', 'FEMALE', 'Lecturer', '2080-01-01', true, now(), now())
  ON CONFLICT ("employeeCode") DO UPDATE SET "userId"=EXCLUDED."userId", "isActive"=true, "deletedAt"=null, "updatedAt"=now();
  SELECT id INTO v_teacher_emp FROM employees WHERE "employeeCode"='EMP-TEACH-001';
  INSERT INTO teachers (id, "employeeId", qualification, specialization, "createdAt", "updatedAt")
  VALUES (gen_random_uuid(), v_teacher_emp, 'MSc Computer Science', 'Programming', now(), now())
  ON CONFLICT ("employeeId") DO UPDATE SET qualification=EXCLUDED.qualification, specialization=EXCLUDED.specialization, "deletedAt"=null, "updatedAt"=now();

  -- STAFF
  INSERT INTO users (id, email, username, "passwordHash", role, "isAdmin", "isActive", "isEmailVerified", "failedLoginCount", "createdAt", "updatedAt")
  VALUES (gen_random_uuid(), 'staff@demo.edu', 'staff', v_hash, 'STAFF', false, true, true, 0, now(), now())
  ON CONFLICT (email) DO UPDATE SET username=EXCLUDED.username, "passwordHash"=EXCLUDED."passwordHash", role='STAFF', "isActive"=true, "isEmailVerified"=true, "failedLoginCount"=0, "lockedUntil"=null, "deletedAt"=null, "updatedAt"=now();
  SELECT id INTO v_staff_id FROM users WHERE email='staff@demo.edu';

  INSERT INTO employees (id, "userId", "employeeCode", "firstName", "lastName", gender, designation, "joinDateBs", "isActive", "createdAt", "updatedAt")
  VALUES (gen_random_uuid(), v_staff_id, 'EMP-STAFF-001', 'Suman', 'Staff', 'MALE', 'Office Staff', '2080-01-01', true, now(), now())
  ON CONFLICT ("employeeCode") DO UPDATE SET "userId"=EXCLUDED."userId", "isActive"=true, "deletedAt"=null, "updatedAt"=now();
  SELECT id INTO v_staff_emp FROM employees WHERE "employeeCode"='EMP-STAFF-001';
  INSERT INTO staffs (id, "employeeId", department, "createdAt", "updatedAt")
  VALUES (gen_random_uuid(), v_staff_emp, 'Administration', now(), now())
  ON CONFLICT ("employeeId") DO UPDATE SET department=EXCLUDED.department, "deletedAt"=null, "updatedAt"=now();

  -- STUDENT (login user). Linked student record requires batch/status IDs in this normalized schema;
  -- the app/API can be used to create/approve a full student once academic setup exists.
  INSERT INTO users (id, email, username, "passwordHash", role, "isAdmin", "isActive", "isEmailVerified", "failedLoginCount", "createdAt", "updatedAt")
  VALUES (gen_random_uuid(), 'student@demo.edu', 'student', v_hash, 'STUDENT', false, true, true, 0, now(), now())
  ON CONFLICT (email) DO UPDATE SET username=EXCLUDED.username, "passwordHash"=EXCLUDED."passwordHash", role='STUDENT', "isActive"=true, "isEmailVerified"=true, "failedLoginCount"=0, "lockedUntil"=null, "deletedAt"=null, "updatedAt"=now();

  RAISE NOTICE 'Role accounts seeded/updated successfully.';
END $$;

-- Verification output
SELECT email, username, role, "isActive", "isEmailVerified"
FROM users
WHERE email IN ('admin@demo.edu','admin@gmail.com','principal@demo.edu','accountant@demo.edu','teacher@demo.edu','staff@demo.edu','student@demo.edu')
ORDER BY role, email;
