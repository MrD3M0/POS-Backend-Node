const BASE = "http://localhost:8000/api";
async function login(identifier, password) {
  const res = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier, password }),
  });
  return res.json();
}
const admin = await login("admin@gmail.com", "Password@123");
const token = admin.token;
console.log("login:", admin.message, "token:", token ? "yes" : "NO");
if (!token) process.exit(1);

async function get(path) {
  const res = await fetch(BASE + path, { headers: { Authorization: `Bearer ${token}` } });
  const body = await res.json().catch(() => null);
  return { status: res.status, body };
}
const paths = [
  "/auth/me",
  "/student?page=1&limit=5",
  "/batch?page=1&limit=5",
  "/course?page=1&limit=5",
  "/teacher/dashboard/stats",
  "/teacher/dashboard",
  "/dashboard",
  "/accountant/dashboard",
  "/principal",
  "/principal/reports",
  "/fee-structure?page=1&limit=5",
  "/student-fee?page=1&limit=5",
  "/payroll?page=1&limit=5",
  "/payslip?page=1&limit=5",
  "/result?page=1&limit=5",
  "/exam?page=1&limit=5",
  "/exam-mark?page=1&limit=5",
  "/notice?page=1&limit=5",
  "/notification",
  "/employee-attendance?page=1&limit=5",
  "/student-attendance?page=1&limit=5",
  "/teacher-batch-pay?page=1&limit=5",
  "/teaching-assignment?page=1&limit=5",
  "/fee-payment?page=1&limit=5",
  "/account?page=1&limit=5",
  "/journal-entry?page=1&limit=5",
  "/scholarship?page=1&limit=5",
  "/audit-log?page=1&limit=5",
  "/setting",
  "/user?page=1&limit=5",
];
for (const p of paths) {
  try {
    const { status, body } = await get(p);
    const ok = status >= 200 && status < 300;
    const summary = body?.data === undefined ? "no data" : (Array.isArray(body.data) ? `arr[${body.data.length}]` : typeof body.data);
    console.log(`${ok ? "OK " : "ERR"} ${status} ${p}  -> ${summary} ${ok ? "" : (body?.message ?? JSON.stringify(body)?.slice(0,120))}`);
  } catch (e) {
    console.log(`FAIL ${p} -> ${e.message}`);
  }
}
