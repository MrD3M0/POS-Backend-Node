export const openApiSpec = {
  openapi: "3.0.0",
  info: { title: "COLLIFY API - With Request & Response Examples", version: "1.0.0", description: "All 273 endpoints with real example request & response - Base: http://localhost:8000" },
  servers: [{ url: "http://localhost:8000" }],
  components: { securitySchemes: { bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" } } },
  paths: {
    "/api/account": {
      get: {
        tags: ["account"],
        summary: "List account",
        responses: { "200": { description: "List response", content: { "application/json": { example: { success: true, code: 200, data: { data: [{ id: "acc_123", code: "1001", name: "Cash in Hand", accountTypeId: "at_123", isGroup: false, isActive: true }], pagination: { page: 1, limit: 10, total: 2 } }, message: "Fetched successfully" } } } } }
      },
      post: {
        tags: ["account"],
        summary: "Create account",
        requestBody: { required: true, content: { "application/json": { example: { code: "1001", name: "Cash in Hand", accountTypeId: "at_123", isGroup: false }, schema: { type: "object" } } } },
        responses: { "201": { description: "Created", content: { "application/json": { example: { success: true, code: 201, data: { id: "acc_123", code: "1001", name: "Cash in Hand", accountTypeId: "at_123", isGroup: false, isActive: true }, message: "account created successfully" } } } } }
      },
    },
    "/api/account/{id}": {
      get: {
        tags: ["account"],
        summary: "Get account by ID",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "uuid-123" } }],
        responses: { "200": { description: "Single item", content: { "application/json": { example: { success: true, code: 200, data: { id: "acc_123", code: "1001", name: "Cash in Hand", accountTypeId: "at_123", isGroup: false, isActive: true }, message: "Retrieved" } } } } }
      },
      delete: {
        tags: ["account"],
        summary: "Delete account",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "uuid-123" } }],
        responses: { "200": { description: "Deleted", content: { "application/json": { example: { success: true, code: 200, data: null, message: "Deleted successfully" } } } } }
      },
    },
    "/api/accountant": {
      get: {
        tags: ["accountant"],
        summary: "List accountant",
        responses: { "200": { description: "List response", content: { "application/json": { example: { success: true, code: 200, data: { data: [{ id: "accountant_123", code: "ACCOUNTANT", name: "Sample Accountant", isActive: true, createdAt: "2024-01-15T00:00:00Z" }], pagination: { page: 1, limit: 10, total: 2 } }, message: "Fetched successfully" } } } } }
      },
      post: {
        tags: ["accountant"],
        summary: "Create accountant",
        requestBody: { required: true, content: { "application/json": { example: { code: "ACCOUNTANT", name: "Sample Accountant" }, schema: { type: "object" } } } },
        responses: { "201": { description: "Created", content: { "application/json": { example: { success: true, code: 201, data: { id: "accountant_123", code: "ACCOUNTANT", name: "Sample Accountant", isActive: true, createdAt: "2024-01-15T00:00:00Z" }, message: "accountant created successfully" } } } } }
      },
    },
    "/api/accountant/{id}": {
      get: {
        tags: ["accountant"],
        summary: "Get accountant by ID",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "uuid-123" } }],
        responses: { "200": { description: "Single item", content: { "application/json": { example: { success: true, code: 200, data: { id: "accountant_123", code: "ACCOUNTANT", name: "Sample Accountant", isActive: true, createdAt: "2024-01-15T00:00:00Z" }, message: "Retrieved" } } } } }
      },
      delete: {
        tags: ["accountant"],
        summary: "Delete accountant",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "uuid-123" } }],
        responses: { "200": { description: "Deleted", content: { "application/json": { example: { success: true, code: 200, data: null, message: "Deleted successfully" } } } } }
      },
    },
    "/api/attendance-session": {
      get: {
        tags: ["attendance-session"],
        summary: "List attendance-session",
        responses: { "200": { description: "List response", content: { "application/json": { example: { success: true, code: 200, data: { data: [{ id: "attendance-session_123", code: "ATTENDANCE_SESSION", name: "Sample Attendance-Session", isActive: true, createdAt: "2024-01-15T00:00:00Z" }], pagination: { page: 1, limit: 10, total: 2 } }, message: "Fetched successfully" } } } } }
      },
      post: {
        tags: ["attendance-session"],
        summary: "Create attendance-session",
        requestBody: { required: true, content: { "application/json": { example: { code: "ATTENDANCE_SESSION", name: "Sample Attendance-Session" }, schema: { type: "object" } } } },
        responses: { "201": { description: "Created", content: { "application/json": { example: { success: true, code: 201, data: { id: "attendance-session_123", code: "ATTENDANCE_SESSION", name: "Sample Attendance-Session", isActive: true, createdAt: "2024-01-15T00:00:00Z" }, message: "attendance-session created successfully" } } } } }
      },
    },
    "/api/attendance-session/{id}": {
      get: {
        tags: ["attendance-session"],
        summary: "Get attendance-session by ID",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "uuid-123" } }],
        responses: { "200": { description: "Single item", content: { "application/json": { example: { success: true, code: 200, data: { id: "attendance-session_123", code: "ATTENDANCE_SESSION", name: "Sample Attendance-Session", isActive: true, createdAt: "2024-01-15T00:00:00Z" }, message: "Retrieved" } } } } }
      },
      delete: {
        tags: ["attendance-session"],
        summary: "Delete attendance-session",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "uuid-123" } }],
        responses: { "200": { description: "Deleted", content: { "application/json": { example: { success: true, code: 200, data: null, message: "Deleted successfully" } } } } }
      },
    },
    "/api/auth/login": {
      post: {
        tags: ["auth"],
        summary: "Create auth",
        requestBody: { required: true, content: { "application/json": { example: { email: "admin@gmail.com", password: "admin123" }, schema: { type: "object" } } } },
        responses: { "201": { description: "Created", content: { "application/json": { example: { success: true, code: 201, data: { success: true, data: { token: "eyJhbGciOiJIUzI1NiJ9...", refreshToken: "refresh_xyz", user: { id: "user_123", email: "admin@gmail.com", role: "ADMIN" } }, message: "Login successful" }, message: "auth created successfully" } } } } }
      },
    },
    "/api/auth/me": {
      get: {
        tags: ["auth"],
        summary: "List auth",
        responses: { "200": { description: "List response", content: { "application/json": { example: { success: true, code: 200, data: { data: [{ success: true, data: { id: "user_123", email: "admin@gmail.com", role: "ADMIN", username: "admin" } }], pagination: { page: 1, limit: 10, total: 2 } }, message: "Fetched successfully" } } } } }
      },
    },
    "/api/auth/refresh": {
      post: {
        tags: ["auth"],
        summary: "Create auth",
        requestBody: { required: true, content: { "application/json": { example: { refreshToken: "refresh_token_here" }, schema: { type: "object" } } } },
        responses: { "201": { description: "Created", content: { "application/json": { example: { success: true, code: 201, data: { success: true, data: { token: "new_jwt_token", refreshToken: "new_refresh" } }, message: "auth created successfully" } } } } }
      },
    },
    "/api/auth/register": {
      post: {
        tags: ["auth"],
        summary: "Create auth",
        requestBody: { required: true, content: { "application/json": { example: { email: "teacher@college.edu.np", password: "Teacher@123", username: "teacher1", role: "TEACHER" }, schema: { type: "object" } } } },
        responses: { "201": { description: "Created", content: { "application/json": { example: { success: true, code: 201, data: { success: true, data: { id: "user_124", email: "teacher@college.edu.np", role: "TEACHER" }, message: "User created" }, message: "auth created successfully" } } } } }
      },
    },
    "/api/batch": {
      get: {
        tags: ["batch"],
        summary: "List batch",
        responses: { "200": { description: "List response", content: { "application/json": { example: { success: true, code: 200, data: { data: [{ id: "batch_123", name: "BCA 2024 Batch", courseId: "course_123", currentTermNumber: 1, isActive: true }], pagination: { page: 1, limit: 10, total: 2 } }, message: "Fetched successfully" } } } } }
      },
      post: {
        tags: ["batch"],
        summary: "Create batch",
        requestBody: { required: true, content: { "application/json": { example: { name: "BCA 2024 Batch", courseId: "course_123", startDateBs: "2081-05-01" }, schema: { type: "object" } } } },
        responses: { "201": { description: "Created", content: { "application/json": { example: { success: true, code: 201, data: { id: "batch_123", name: "BCA 2024 Batch", courseId: "course_123", currentTermNumber: 1, isActive: true }, message: "batch created successfully" } } } } }
      },
    },
    "/api/batch-term": {
      get: {
        tags: ["batch-term"],
        summary: "List batch-term",
        responses: { "200": { description: "List response", content: { "application/json": { example: { success: true, code: 200, data: { data: [{ id: "batch-term_123", code: "BATCH_TERM", name: "Sample Batch-Term", isActive: true, createdAt: "2024-01-15T00:00:00Z" }], pagination: { page: 1, limit: 10, total: 2 } }, message: "Fetched successfully" } } } } }
      },
      post: {
        tags: ["batch-term"],
        summary: "Create batch-term",
        requestBody: { required: true, content: { "application/json": { example: { code: "BATCH_TERM", name: "Sample Batch-Term" }, schema: { type: "object" } } } },
        responses: { "201": { description: "Created", content: { "application/json": { example: { success: true, code: 201, data: { id: "batch-term_123", code: "BATCH_TERM", name: "Sample Batch-Term", isActive: true, createdAt: "2024-01-15T00:00:00Z" }, message: "batch-term created successfully" } } } } }
      },
    },
    "/api/batch-term-subject": {
      get: {
        tags: ["batch-term-subject"],
        summary: "List batch-term-subject",
        responses: { "200": { description: "List response", content: { "application/json": { example: { success: true, code: 200, data: { data: [{ id: "batch-term-subject_123", code: "BATCH_TERM_SUBJECT", name: "Sample Batch-Term-Subject", isActive: true, createdAt: "2024-01-15T00:00:00Z" }], pagination: { page: 1, limit: 10, total: 2 } }, message: "Fetched successfully" } } } } }
      },
      post: {
        tags: ["batch-term-subject"],
        summary: "Create batch-term-subject",
        requestBody: { required: true, content: { "application/json": { example: { code: "BATCH_TERM_SUBJECT", name: "Sample Batch-Term-Subject" }, schema: { type: "object" } } } },
        responses: { "201": { description: "Created", content: { "application/json": { example: { success: true, code: 201, data: { id: "batch-term-subject_123", code: "BATCH_TERM_SUBJECT", name: "Sample Batch-Term-Subject", isActive: true, createdAt: "2024-01-15T00:00:00Z" }, message: "batch-term-subject created successfully" } } } } }
      },
    },
    "/api/batch-term-subject/{id}": {
      get: {
        tags: ["batch-term-subject"],
        summary: "Get batch-term-subject by ID",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "uuid-123" } }],
        responses: { "200": { description: "Single item", content: { "application/json": { example: { success: true, code: 200, data: { id: "batch-term-subject_123", code: "BATCH_TERM_SUBJECT", name: "Sample Batch-Term-Subject", isActive: true, createdAt: "2024-01-15T00:00:00Z" }, message: "Retrieved" } } } } }
      },
      patch: {
        tags: ["batch-term-subject"],
        summary: "Update batch-term-subject",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "uuid-123" } }],
        requestBody: { required: true, content: { "application/json": { example: { code: "BATCH_TERM_SUBJECT", name: "Sample Batch-Term-Subject" }, schema: { type: "object" } } } },
        responses: { "200": { description: "Updated", content: { "application/json": { example: { success: true, code: 200, data: { id: "batch-term-subject_123", code: "BATCH_TERM_SUBJECT", name: "Sample Batch-Term-Subject", isActive: true, createdAt: "2024-01-15T00:00:00Z" }, message: "batch-term-subject updated" } } } } }
      },
      delete: {
        tags: ["batch-term-subject"],
        summary: "Delete batch-term-subject",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "uuid-123" } }],
        responses: { "200": { description: "Deleted", content: { "application/json": { example: { success: true, code: 200, data: null, message: "Deleted successfully" } } } } }
      },
    },
    "/api/batch-term/{id}": {
      get: {
        tags: ["batch-term"],
        summary: "Get batch-term by ID",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "uuid-123" } }],
        responses: { "200": { description: "Single item", content: { "application/json": { example: { success: true, code: 200, data: { id: "batch-term_123", code: "BATCH_TERM", name: "Sample Batch-Term", isActive: true, createdAt: "2024-01-15T00:00:00Z" }, message: "Retrieved" } } } } }
      },
      patch: {
        tags: ["batch-term"],
        summary: "Update batch-term",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "uuid-123" } }],
        requestBody: { required: true, content: { "application/json": { example: { code: "BATCH_TERM", name: "Sample Batch-Term" }, schema: { type: "object" } } } },
        responses: { "200": { description: "Updated", content: { "application/json": { example: { success: true, code: 200, data: { id: "batch-term_123", code: "BATCH_TERM", name: "Sample Batch-Term", isActive: true, createdAt: "2024-01-15T00:00:00Z" }, message: "batch-term updated" } } } } }
      },
      delete: {
        tags: ["batch-term"],
        summary: "Delete batch-term",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "uuid-123" } }],
        responses: { "200": { description: "Deleted", content: { "application/json": { example: { success: true, code: 200, data: null, message: "Deleted successfully" } } } } }
      },
    },
    "/api/batch/{id}": {
      get: {
        tags: ["batch"],
        summary: "Get batch by ID",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "uuid-123" } }],
        responses: { "200": { description: "Single item", content: { "application/json": { example: { success: true, code: 200, data: { id: "batch_123", name: "BCA 2024 Batch", courseId: "course_123", currentTermNumber: 1, isActive: true }, message: "Retrieved" } } } } }
      },
      patch: {
        tags: ["batch"],
        summary: "Update batch",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "uuid-123" } }],
        requestBody: { required: true, content: { "application/json": { example: { name: "BCA 2024 Batch", courseId: "course_123", startDateBs: "2081-05-01" }, schema: { type: "object" } } } },
        responses: { "200": { description: "Updated", content: { "application/json": { example: { success: true, code: 200, data: { id: "batch_123", name: "BCA 2024 Batch", courseId: "course_123", currentTermNumber: 1, isActive: true }, message: "batch updated" } } } } }
      },
      delete: {
        tags: ["batch"],
        summary: "Delete batch",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "uuid-123" } }],
        responses: { "200": { description: "Deleted", content: { "application/json": { example: { success: true, code: 200, data: null, message: "Deleted successfully" } } } } }
      },
    },
    "/api/course": {
      get: {
        tags: ["course"],
        summary: "List course",
        responses: { "200": { description: "List response", content: { "application/json": { example: { success: true, code: 200, data: { data: [{ id: "course_123", code: "COURSE", name: "Sample Course", isActive: true, createdAt: "2024-01-15T00:00:00Z" }], pagination: { page: 1, limit: 10, total: 2 } }, message: "Fetched successfully" } } } } }
      },
      post: {
        tags: ["course"],
        summary: "Create course",
        requestBody: { required: true, content: { "application/json": { example: { code: "COURSE", name: "Sample Course" }, schema: { type: "object" } } } },
        responses: { "201": { description: "Created", content: { "application/json": { example: { success: true, code: 201, data: { id: "course_123", code: "COURSE", name: "Sample Course", isActive: true, createdAt: "2024-01-15T00:00:00Z" }, message: "course created successfully" } } } } }
      },
    },
    "/api/course/{id}": {
      get: {
        tags: ["course"],
        summary: "Get course by ID",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "uuid-123" } }],
        responses: { "200": { description: "Single item", content: { "application/json": { example: { success: true, code: 200, data: { id: "course_123", code: "COURSE", name: "Sample Course", isActive: true, createdAt: "2024-01-15T00:00:00Z" }, message: "Retrieved" } } } } }
      },
      patch: {
        tags: ["course"],
        summary: "Update course",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "uuid-123" } }],
        requestBody: { required: true, content: { "application/json": { example: { code: "COURSE", name: "Sample Course" }, schema: { type: "object" } } } },
        responses: { "200": { description: "Updated", content: { "application/json": { example: { success: true, code: 200, data: { id: "course_123", code: "COURSE", name: "Sample Course", isActive: true, createdAt: "2024-01-15T00:00:00Z" }, message: "course updated" } } } } }
      },
      delete: {
        tags: ["course"],
        summary: "Delete course",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "uuid-123" } }],
        responses: { "200": { description: "Deleted", content: { "application/json": { example: { success: true, code: 200, data: null, message: "Deleted successfully" } } } } }
      },
    },
    "/api/employee": {
      get: {
        tags: ["employee"],
        summary: "List employee",
        responses: { "200": { description: "List response", content: { "application/json": { example: { success: true, code: 200, data: { data: [{ id: "emp_123", employeeCode: "EMP-001", firstName: "Hari", lastName: "Bhattarai", email: "hari@college.edu.np", role: "TEACHER" }], pagination: { page: 1, limit: 10, total: 2 } }, message: "Fetched successfully" } } } } }
      },
      post: {
        tags: ["employee"],
        summary: "Create employee",
        requestBody: { required: true, content: { "application/json": { example: { firstName: "Hari", lastName: "Bhattarai", email: "hari@college.edu.np", role: "TEACHER", designation: "Lecturer" }, schema: { type: "object" } } } },
        responses: { "201": { description: "Created", content: { "application/json": { example: { success: true, code: 201, data: { id: "emp_123", employeeCode: "EMP-001", firstName: "Hari", lastName: "Bhattarai", email: "hari@college.edu.np", role: "TEACHER" }, message: "employee created successfully" } } } } }
      },
    },
    "/api/employee-attendance": {
      get: {
        tags: ["employee-attendance"],
        summary: "List employee-attendance",
        responses: { "200": { description: "List response", content: { "application/json": { example: { success: true, code: 200, data: { data: [{ id: "employee-attendance_123", code: "EMPLOYEE_ATTENDANCE", name: "Sample Employee-Attendance", isActive: true, createdAt: "2024-01-15T00:00:00Z" }], pagination: { page: 1, limit: 10, total: 2 } }, message: "Fetched successfully" } } } } }
      },
      post: {
        tags: ["employee-attendance"],
        summary: "Create employee-attendance",
        requestBody: { required: true, content: { "application/json": { example: { code: "EMPLOYEE_ATTENDANCE", name: "Sample Employee-Attendance" }, schema: { type: "object" } } } },
        responses: { "201": { description: "Created", content: { "application/json": { example: { success: true, code: 201, data: { id: "employee-attendance_123", code: "EMPLOYEE_ATTENDANCE", name: "Sample Employee-Attendance", isActive: true, createdAt: "2024-01-15T00:00:00Z" }, message: "employee-attendance created successfully" } } } } }
      },
    },
    "/api/employee-attendance/{id}": {
      get: {
        tags: ["employee-attendance"],
        summary: "Get employee-attendance by ID",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "uuid-123" } }],
        responses: { "200": { description: "Single item", content: { "application/json": { example: { success: true, code: 200, data: { id: "employee-attendance_123", code: "EMPLOYEE_ATTENDANCE", name: "Sample Employee-Attendance", isActive: true, createdAt: "2024-01-15T00:00:00Z" }, message: "Retrieved" } } } } }
      },
      delete: {
        tags: ["employee-attendance"],
        summary: "Delete employee-attendance",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "uuid-123" } }],
        responses: { "200": { description: "Deleted", content: { "application/json": { example: { success: true, code: 200, data: null, message: "Deleted successfully" } } } } }
      },
    },
    "/api/employee/{id}": {
      get: {
        tags: ["employee"],
        summary: "Get employee by ID",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "uuid-123" } }],
        responses: { "200": { description: "Single item", content: { "application/json": { example: { success: true, code: 200, data: { id: "emp_123", employeeCode: "EMP-001", firstName: "Hari", lastName: "Bhattarai", email: "hari@college.edu.np", role: "TEACHER" }, message: "Retrieved" } } } } }
      },
      patch: {
        tags: ["employee"],
        summary: "Update employee",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "uuid-123" } }],
        requestBody: { required: true, content: { "application/json": { example: { firstName: "Hari", lastName: "Bhattarai", email: "hari@college.edu.np", role: "TEACHER", designation: "Lecturer" }, schema: { type: "object" } } } },
        responses: { "200": { description: "Updated", content: { "application/json": { example: { success: true, code: 200, data: { id: "emp_123", employeeCode: "EMP-001", firstName: "Hari", lastName: "Bhattarai", email: "hari@college.edu.np", role: "TEACHER" }, message: "employee updated" } } } } }
      },
      delete: {
        tags: ["employee"],
        summary: "Delete employee",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "uuid-123" } }],
        responses: { "200": { description: "Deleted", content: { "application/json": { example: { success: true, code: 200, data: null, message: "Deleted successfully" } } } } }
      },
    },
    "/api/exam": {
      get: {
        tags: ["exam"],
        summary: "List exam",
        responses: { "200": { description: "List response", content: { "application/json": { example: { success: true, code: 200, data: { data: [{ id: "exam_123", code: "EXAM", name: "Sample Exam", isActive: true, createdAt: "2024-01-15T00:00:00Z" }], pagination: { page: 1, limit: 10, total: 2 } }, message: "Fetched successfully" } } } } }
      },
      post: {
        tags: ["exam"],
        summary: "Create exam",
        requestBody: { required: true, content: { "application/json": { example: { code: "EXAM", name: "Sample Exam" }, schema: { type: "object" } } } },
        responses: { "201": { description: "Created", content: { "application/json": { example: { success: true, code: 201, data: { id: "exam_123", code: "EXAM", name: "Sample Exam", isActive: true, createdAt: "2024-01-15T00:00:00Z" }, message: "exam created successfully" } } } } }
      },
    },
    "/api/exam-mark": {
      get: {
        tags: ["exam-mark"],
        summary: "List exam-mark",
        responses: { "200": { description: "List response", content: { "application/json": { example: { success: true, code: 200, data: { data: [{ id: "exam-mark_123", code: "EXAM_MARK", name: "Sample Exam-Mark", isActive: true, createdAt: "2024-01-15T00:00:00Z" }], pagination: { page: 1, limit: 10, total: 2 } }, message: "Fetched successfully" } } } } }
      },
      post: {
        tags: ["exam-mark"],
        summary: "Create exam-mark",
        requestBody: { required: true, content: { "application/json": { example: { code: "EXAM_MARK", name: "Sample Exam-Mark" }, schema: { type: "object" } } } },
        responses: { "201": { description: "Created", content: { "application/json": { example: { success: true, code: 201, data: { id: "exam-mark_123", code: "EXAM_MARK", name: "Sample Exam-Mark", isActive: true, createdAt: "2024-01-15T00:00:00Z" }, message: "exam-mark created successfully" } } } } }
      },
    },
    "/api/exam-mark/{id}": {
      get: {
        tags: ["exam-mark"],
        summary: "Get exam-mark by ID",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "uuid-123" } }],
        responses: { "200": { description: "Single item", content: { "application/json": { example: { success: true, code: 200, data: { id: "exam-mark_123", code: "EXAM_MARK", name: "Sample Exam-Mark", isActive: true, createdAt: "2024-01-15T00:00:00Z" }, message: "Retrieved" } } } } }
      },
      delete: {
        tags: ["exam-mark"],
        summary: "Delete exam-mark",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "uuid-123" } }],
        responses: { "200": { description: "Deleted", content: { "application/json": { example: { success: true, code: 200, data: null, message: "Deleted successfully" } } } } }
      },
    },
    "/api/exam-subject": {
      get: {
        tags: ["exam-subject"],
        summary: "List exam-subject",
        responses: { "200": { description: "List response", content: { "application/json": { example: { success: true, code: 200, data: { data: [{ id: "exam-subject_123", code: "EXAM_SUBJECT", name: "Sample Exam-Subject", isActive: true, createdAt: "2024-01-15T00:00:00Z" }], pagination: { page: 1, limit: 10, total: 2 } }, message: "Fetched successfully" } } } } }
      },
      post: {
        tags: ["exam-subject"],
        summary: "Create exam-subject",
        requestBody: { required: true, content: { "application/json": { example: { code: "EXAM_SUBJECT", name: "Sample Exam-Subject" }, schema: { type: "object" } } } },
        responses: { "201": { description: "Created", content: { "application/json": { example: { success: true, code: 201, data: { id: "exam-subject_123", code: "EXAM_SUBJECT", name: "Sample Exam-Subject", isActive: true, createdAt: "2024-01-15T00:00:00Z" }, message: "exam-subject created successfully" } } } } }
      },
    },
    "/api/exam-subject/{id}": {
      get: {
        tags: ["exam-subject"],
        summary: "Get exam-subject by ID",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "uuid-123" } }],
        responses: { "200": { description: "Single item", content: { "application/json": { example: { success: true, code: 200, data: { id: "exam-subject_123", code: "EXAM_SUBJECT", name: "Sample Exam-Subject", isActive: true, createdAt: "2024-01-15T00:00:00Z" }, message: "Retrieved" } } } } }
      },
      delete: {
        tags: ["exam-subject"],
        summary: "Delete exam-subject",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "uuid-123" } }],
        responses: { "200": { description: "Deleted", content: { "application/json": { example: { success: true, code: 200, data: null, message: "Deleted successfully" } } } } }
      },
    },
    "/api/exam-type": {
      get: {
        tags: ["exam-type"],
        summary: "List exam-type",
        responses: { "200": { description: "List response", content: { "application/json": { example: { success: true, code: 200, data: { data: [{ id: "exam-type_123", code: "EXAM_TYPE", name: "Sample Exam-Type", isActive: true, createdAt: "2024-01-15T00:00:00Z" }], pagination: { page: 1, limit: 10, total: 2 } }, message: "Fetched successfully" } } } } }
      },
      post: {
        tags: ["exam-type"],
        summary: "Create exam-type",
        requestBody: { required: true, content: { "application/json": { example: { code: "EXAM_TYPE", name: "Sample Exam-Type" }, schema: { type: "object" } } } },
        responses: { "201": { description: "Created", content: { "application/json": { example: { success: true, code: 201, data: { id: "exam-type_123", code: "EXAM_TYPE", name: "Sample Exam-Type", isActive: true, createdAt: "2024-01-15T00:00:00Z" }, message: "exam-type created successfully" } } } } }
      },
    },
    "/api/exam-type/{id}": {
      get: {
        tags: ["exam-type"],
        summary: "Get exam-type by ID",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "uuid-123" } }],
        responses: { "200": { description: "Single item", content: { "application/json": { example: { success: true, code: 200, data: { id: "exam-type_123", code: "EXAM_TYPE", name: "Sample Exam-Type", isActive: true, createdAt: "2024-01-15T00:00:00Z" }, message: "Retrieved" } } } } }
      },
      delete: {
        tags: ["exam-type"],
        summary: "Delete exam-type",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "uuid-123" } }],
        responses: { "200": { description: "Deleted", content: { "application/json": { example: { success: true, code: 200, data: null, message: "Deleted successfully" } } } } }
      },
    },
    "/api/exam/{id}": {
      get: {
        tags: ["exam"],
        summary: "Get exam by ID",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "uuid-123" } }],
        responses: { "200": { description: "Single item", content: { "application/json": { example: { success: true, code: 200, data: { id: "exam_123", code: "EXAM", name: "Sample Exam", isActive: true, createdAt: "2024-01-15T00:00:00Z" }, message: "Retrieved" } } } } }
      },
      delete: {
        tags: ["exam"],
        summary: "Delete exam",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "uuid-123" } }],
        responses: { "200": { description: "Deleted", content: { "application/json": { example: { success: true, code: 200, data: null, message: "Deleted successfully" } } } } }
      },
    },
    "/api/fee-head": {
      get: {
        tags: ["fee-head"],
        summary: "List fee-head",
        responses: { "200": { description: "List response", content: { "application/json": { example: { success: true, code: 200, data: { data: [{ id: "fh_123", code: "TUITION", name: "Tuition Fee", isActive: true }], pagination: { page: 1, limit: 10, total: 2 } }, message: "Fetched successfully" } } } } }
      },
      post: {
        tags: ["fee-head"],
        summary: "Create fee-head",
        requestBody: { required: true, content: { "application/json": { example: { code: "TUITION", name: "Tuition Fee", isActive: true }, schema: { type: "object" } } } },
        responses: { "201": { description: "Created", content: { "application/json": { example: { success: true, code: 201, data: { id: "fh_123", code: "TUITION", name: "Tuition Fee", isActive: true }, message: "fee-head created successfully" } } } } }
      },
    },
    "/api/fee-head/{id}": {
      get: {
        tags: ["fee-head"],
        summary: "Get fee-head by ID",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "uuid-123" } }],
        responses: { "200": { description: "Single item", content: { "application/json": { example: { success: true, code: 200, data: { id: "fh_123", code: "TUITION", name: "Tuition Fee", isActive: true }, message: "Retrieved" } } } } }
      },
      delete: {
        tags: ["fee-head"],
        summary: "Delete fee-head",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "uuid-123" } }],
        responses: { "200": { description: "Deleted", content: { "application/json": { example: { success: true, code: 200, data: null, message: "Deleted successfully" } } } } }
      },
    },
    "/api/fee-installment": {
      get: {
        tags: ["fee-installment"],
        summary: "List fee-installment",
        responses: { "200": { description: "List response", content: { "application/json": { example: { success: true, code: 200, data: { data: [{ id: "fee-installment_123", code: "FEE_INSTALLMENT", name: "Sample Fee-Installment", isActive: true, createdAt: "2024-01-15T00:00:00Z" }], pagination: { page: 1, limit: 10, total: 2 } }, message: "Fetched successfully" } } } } }
      },
      post: {
        tags: ["fee-installment"],
        summary: "Create fee-installment",
        requestBody: { required: true, content: { "application/json": { example: { code: "FEE_INSTALLMENT", name: "Sample Fee-Installment" }, schema: { type: "object" } } } },
        responses: { "201": { description: "Created", content: { "application/json": { example: { success: true, code: 201, data: { id: "fee-installment_123", code: "FEE_INSTALLMENT", name: "Sample Fee-Installment", isActive: true, createdAt: "2024-01-15T00:00:00Z" }, message: "fee-installment created successfully" } } } } }
      },
    },
    "/api/fee-installment/{id}": {
      get: {
        tags: ["fee-installment"],
        summary: "Get fee-installment by ID",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "uuid-123" } }],
        responses: { "200": { description: "Single item", content: { "application/json": { example: { success: true, code: 200, data: { id: "fee-installment_123", code: "FEE_INSTALLMENT", name: "Sample Fee-Installment", isActive: true, createdAt: "2024-01-15T00:00:00Z" }, message: "Retrieved" } } } } }
      },
      delete: {
        tags: ["fee-installment"],
        summary: "Delete fee-installment",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "uuid-123" } }],
        responses: { "200": { description: "Deleted", content: { "application/json": { example: { success: true, code: 200, data: null, message: "Deleted successfully" } } } } }
      },
    },
    "/api/fee-payment": {
      get: {
        tags: ["fee-payment"],
        summary: "List fee-payment",
        responses: { "200": { description: "List response", content: { "application/json": { example: { success: true, code: 200, data: { data: [{ id: "fee-payment_123", code: "FEE_PAYMENT", name: "Sample Fee-Payment", isActive: true, createdAt: "2024-01-15T00:00:00Z" }], pagination: { page: 1, limit: 10, total: 2 } }, message: "Fetched successfully" } } } } }
      },
      post: {
        tags: ["fee-payment"],
        summary: "Create fee-payment",
        requestBody: { required: true, content: { "application/json": { example: { code: "FEE_PAYMENT", name: "Sample Fee-Payment" }, schema: { type: "object" } } } },
        responses: { "201": { description: "Created", content: { "application/json": { example: { success: true, code: 201, data: { id: "fee-payment_123", code: "FEE_PAYMENT", name: "Sample Fee-Payment", isActive: true, createdAt: "2024-01-15T00:00:00Z" }, message: "fee-payment created successfully" } } } } }
      },
    },
    "/api/fee-payment-allocation": {
      get: {
        tags: ["fee-payment-allocation"],
        summary: "List fee-payment-allocation",
        responses: { "200": { description: "List response", content: { "application/json": { example: { success: true, code: 200, data: { data: [{ id: "fee-payment-allocation_123", code: "FEE_PAYMENT_ALLOCATION", name: "Sample Fee-Payment-Allocation", isActive: true, createdAt: "2024-01-15T00:00:00Z" }], pagination: { page: 1, limit: 10, total: 2 } }, message: "Fetched successfully" } } } } }
      },
      post: {
        tags: ["fee-payment-allocation"],
        summary: "Create fee-payment-allocation",
        requestBody: { required: true, content: { "application/json": { example: { code: "FEE_PAYMENT_ALLOCATION", name: "Sample Fee-Payment-Allocation" }, schema: { type: "object" } } } },
        responses: { "201": { description: "Created", content: { "application/json": { example: { success: true, code: 201, data: { id: "fee-payment-allocation_123", code: "FEE_PAYMENT_ALLOCATION", name: "Sample Fee-Payment-Allocation", isActive: true, createdAt: "2024-01-15T00:00:00Z" }, message: "fee-payment-allocation created successfully" } } } } }
      },
    },
    "/api/fee-payment-allocation/{id}": {
      get: {
        tags: ["fee-payment-allocation"],
        summary: "Get fee-payment-allocation by ID",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "uuid-123" } }],
        responses: { "200": { description: "Single item", content: { "application/json": { example: { success: true, code: 200, data: { id: "fee-payment-allocation_123", code: "FEE_PAYMENT_ALLOCATION", name: "Sample Fee-Payment-Allocation", isActive: true, createdAt: "2024-01-15T00:00:00Z" }, message: "Retrieved" } } } } }
      },
      delete: {
        tags: ["fee-payment-allocation"],
        summary: "Delete fee-payment-allocation",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "uuid-123" } }],
        responses: { "200": { description: "Deleted", content: { "application/json": { example: { success: true, code: 200, data: null, message: "Deleted successfully" } } } } }
      },
    },
    "/api/fee-payment-method-line": {
      get: {
        tags: ["fee-payment-method-line"],
        summary: "List fee-payment-method-line",
        responses: { "200": { description: "List response", content: { "application/json": { example: { success: true, code: 200, data: { data: [{ id: "fee-payment-method-line_123", code: "FEE_PAYMENT_METHOD_LINE", name: "Sample Fee-Payment-Method-Line", isActive: true, createdAt: "2024-01-15T00:00:00Z" }], pagination: { page: 1, limit: 10, total: 2 } }, message: "Fetched successfully" } } } } }
      },
      post: {
        tags: ["fee-payment-method-line"],
        summary: "Create fee-payment-method-line",
        requestBody: { required: true, content: { "application/json": { example: { code: "FEE_PAYMENT_METHOD_LINE", name: "Sample Fee-Payment-Method-Line" }, schema: { type: "object" } } } },
        responses: { "201": { description: "Created", content: { "application/json": { example: { success: true, code: 201, data: { id: "fee-payment-method-line_123", code: "FEE_PAYMENT_METHOD_LINE", name: "Sample Fee-Payment-Method-Line", isActive: true, createdAt: "2024-01-15T00:00:00Z" }, message: "fee-payment-method-line created successfully" } } } } }
      },
    },
    "/api/fee-payment-method-line/{id}": {
      get: {
        tags: ["fee-payment-method-line"],
        summary: "Get fee-payment-method-line by ID",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "uuid-123" } }],
        responses: { "200": { description: "Single item", content: { "application/json": { example: { success: true, code: 200, data: { id: "fee-payment-method-line_123", code: "FEE_PAYMENT_METHOD_LINE", name: "Sample Fee-Payment-Method-Line", isActive: true, createdAt: "2024-01-15T00:00:00Z" }, message: "Retrieved" } } } } }
      },
      delete: {
        tags: ["fee-payment-method-line"],
        summary: "Delete fee-payment-method-line",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "uuid-123" } }],
        responses: { "200": { description: "Deleted", content: { "application/json": { example: { success: true, code: 200, data: null, message: "Deleted successfully" } } } } }
      },
    },
    "/api/fee-payment/{id}": {
      get: {
        tags: ["fee-payment"],
        summary: "Get fee-payment by ID",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "uuid-123" } }],
        responses: { "200": { description: "Single item", content: { "application/json": { example: { success: true, code: 200, data: { id: "fee-payment_123", code: "FEE_PAYMENT", name: "Sample Fee-Payment", isActive: true, createdAt: "2024-01-15T00:00:00Z" }, message: "Retrieved" } } } } }
      },
      delete: {
        tags: ["fee-payment"],
        summary: "Delete fee-payment",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "uuid-123" } }],
        responses: { "200": { description: "Deleted", content: { "application/json": { example: { success: true, code: 200, data: null, message: "Deleted successfully" } } } } }
      },
    },
    "/api/fee-structure": {
      get: {
        tags: ["fee-structure"],
        summary: "List fee-structure",
        responses: { "200": { description: "List response", content: { "application/json": { example: { success: true, code: 200, data: { data: [{ id: "fs_123", batchId: "batch_123", feeHeadId: "fh_123", amount: 50000, termNumber: 1 }], pagination: { page: 1, limit: 10, total: 2 } }, message: "Fetched successfully" } } } } }
      },
      post: {
        tags: ["fee-structure"],
        summary: "Create fee-structure",
        requestBody: { required: true, content: { "application/json": { example: { batchId: "batch_123", feeHeadId: "fh_123", amount: 50000, termNumber: 1 }, schema: { type: "object" } } } },
        responses: { "201": { description: "Created", content: { "application/json": { example: { success: true, code: 201, data: { id: "fs_123", batchId: "batch_123", feeHeadId: "fh_123", amount: 50000, termNumber: 1 }, message: "fee-structure created successfully" } } } } }
      },
    },
    "/api/fee-structure-item": {
      get: {
        tags: ["fee-structure-item"],
        summary: "List fee-structure-item",
        responses: { "200": { description: "List response", content: { "application/json": { example: { success: true, code: 200, data: { data: [{ id: "fee-structure-item_123", code: "FEE_STRUCTURE_ITEM", name: "Sample Fee-Structure-Item", isActive: true, createdAt: "2024-01-15T00:00:00Z" }], pagination: { page: 1, limit: 10, total: 2 } }, message: "Fetched successfully" } } } } }
      },
      post: {
        tags: ["fee-structure-item"],
        summary: "Create fee-structure-item",
        requestBody: { required: true, content: { "application/json": { example: { code: "FEE_STRUCTURE_ITEM", name: "Sample Fee-Structure-Item" }, schema: { type: "object" } } } },
        responses: { "201": { description: "Created", content: { "application/json": { example: { success: true, code: 201, data: { id: "fee-structure-item_123", code: "FEE_STRUCTURE_ITEM", name: "Sample Fee-Structure-Item", isActive: true, createdAt: "2024-01-15T00:00:00Z" }, message: "fee-structure-item created successfully" } } } } }
      },
    },
    "/api/fee-structure-item/{id}": {
      get: {
        tags: ["fee-structure-item"],
        summary: "Get fee-structure-item by ID",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "uuid-123" } }],
        responses: { "200": { description: "Single item", content: { "application/json": { example: { success: true, code: 200, data: { id: "fee-structure-item_123", code: "FEE_STRUCTURE_ITEM", name: "Sample Fee-Structure-Item", isActive: true, createdAt: "2024-01-15T00:00:00Z" }, message: "Retrieved" } } } } }
      },
      delete: {
        tags: ["fee-structure-item"],
        summary: "Delete fee-structure-item",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "uuid-123" } }],
        responses: { "200": { description: "Deleted", content: { "application/json": { example: { success: true, code: 200, data: null, message: "Deleted successfully" } } } } }
      },
    },
    "/api/fee-structure/{id}": {
      get: {
        tags: ["fee-structure"],
        summary: "Get fee-structure by ID",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "uuid-123" } }],
        responses: { "200": { description: "Single item", content: { "application/json": { example: { success: true, code: 200, data: { id: "fs_123", batchId: "batch_123", feeHeadId: "fh_123", amount: 50000, termNumber: 1 }, message: "Retrieved" } } } } }
      },
      delete: {
        tags: ["fee-structure"],
        summary: "Delete fee-structure",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "uuid-123" } }],
        responses: { "200": { description: "Deleted", content: { "application/json": { example: { success: true, code: 200, data: null, message: "Deleted successfully" } } } } }
      },
    },
    "/api/fiscal-year": {
      get: {
        tags: ["fiscal-year"],
        summary: "List fiscal-year",
        responses: { "200": { description: "List response", content: { "application/json": { example: { success: true, code: 200, data: { data: [{ id: "fy_123", name: "2081/82", startDateBs: "2081-04-01", endDateBs: "2082-03-31", isCurrent: true }], pagination: { page: 1, limit: 10, total: 2 } }, message: "Fetched successfully" } } } } }
      },
      post: {
        tags: ["fiscal-year"],
        summary: "Create fiscal-year",
        requestBody: { required: true, content: { "application/json": { example: { name: "2081/82", startDateBs: "2081-04-01", endDateBs: "2082-03-31", isCurrent: true }, schema: { type: "object" } } } },
        responses: { "201": { description: "Created", content: { "application/json": { example: { success: true, code: 201, data: { id: "fy_123", name: "2081/82", startDateBs: "2081-04-01", endDateBs: "2082-03-31", isCurrent: true }, message: "fiscal-year created successfully" } } } } }
      },
    },
    "/api/fiscal-year/{id}": {
      get: {
        tags: ["fiscal-year"],
        summary: "Get fiscal-year by ID",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "uuid-123" } }],
        responses: { "200": { description: "Single item", content: { "application/json": { example: { success: true, code: 200, data: { id: "fy_123", name: "2081/82", startDateBs: "2081-04-01", endDateBs: "2082-03-31", isCurrent: true }, message: "Retrieved" } } } } }
      },
      delete: {
        tags: ["fiscal-year"],
        summary: "Delete fiscal-year",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "uuid-123" } }],
        responses: { "200": { description: "Deleted", content: { "application/json": { example: { success: true, code: 200, data: null, message: "Deleted successfully" } } } } }
      },
    },
    "/api/grade-scale": {
      get: {
        tags: ["grade-scale"],
        summary: "List grade-scale",
        responses: { "200": { description: "List response", content: { "application/json": { example: { success: true, code: 200, data: { data: [{ id: "grade-scale_123", code: "GRADE_SCALE", name: "Sample Grade-Scale", isActive: true, createdAt: "2024-01-15T00:00:00Z" }], pagination: { page: 1, limit: 10, total: 2 } }, message: "Fetched successfully" } } } } }
      },
      post: {
        tags: ["grade-scale"],
        summary: "Create grade-scale",
        requestBody: { required: true, content: { "application/json": { example: { code: "GRADE_SCALE", name: "Sample Grade-Scale" }, schema: { type: "object" } } } },
        responses: { "201": { description: "Created", content: { "application/json": { example: { success: true, code: 201, data: { id: "grade-scale_123", code: "GRADE_SCALE", name: "Sample Grade-Scale", isActive: true, createdAt: "2024-01-15T00:00:00Z" }, message: "grade-scale created successfully" } } } } }
      },
    },
    "/api/grade-scale/{id}": {
      get: {
        tags: ["grade-scale"],
        summary: "Get grade-scale by ID",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "uuid-123" } }],
        responses: { "200": { description: "Single item", content: { "application/json": { example: { success: true, code: 200, data: { id: "grade-scale_123", code: "GRADE_SCALE", name: "Sample Grade-Scale", isActive: true, createdAt: "2024-01-15T00:00:00Z" }, message: "Retrieved" } } } } }
      },
      delete: {
        tags: ["grade-scale"],
        summary: "Delete grade-scale",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "uuid-123" } }],
        responses: { "200": { description: "Deleted", content: { "application/json": { example: { success: true, code: 200, data: null, message: "Deleted successfully" } } } } }
      },
    },
    "/api/guardian": {
      get: {
        tags: ["guardian"],
        summary: "List guardian",
        responses: { "200": { description: "List response", content: { "application/json": { example: { success: true, code: 200, data: { data: [{ id: "guardian_123", code: "GUARDIAN", name: "Sample Guardian", isActive: true, createdAt: "2024-01-15T00:00:00Z" }], pagination: { page: 1, limit: 10, total: 2 } }, message: "Fetched successfully" } } } } }
      },
      post: {
        tags: ["guardian"],
        summary: "Create guardian",
        requestBody: { required: true, content: { "application/json": { example: { code: "GUARDIAN", name: "Sample Guardian" }, schema: { type: "object" } } } },
        responses: { "201": { description: "Created", content: { "application/json": { example: { success: true, code: 201, data: { id: "guardian_123", code: "GUARDIAN", name: "Sample Guardian", isActive: true, createdAt: "2024-01-15T00:00:00Z" }, message: "guardian created successfully" } } } } }
      },
    },
    "/api/guardian/{id}": {
      get: {
        tags: ["guardian"],
        summary: "Get guardian by ID",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "uuid-123" } }],
        responses: { "200": { description: "Single item", content: { "application/json": { example: { success: true, code: 200, data: { id: "guardian_123", code: "GUARDIAN", name: "Sample Guardian", isActive: true, createdAt: "2024-01-15T00:00:00Z" }, message: "Retrieved" } } } } }
      },
      delete: {
        tags: ["guardian"],
        summary: "Delete guardian",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "uuid-123" } }],
        responses: { "200": { description: "Deleted", content: { "application/json": { example: { success: true, code: 200, data: null, message: "Deleted successfully" } } } } }
      },
    },
    "/api/journal-entry": {
      get: {
        tags: ["journal-entry"],
        summary: "List journal-entry",
        responses: { "200": { description: "List response", content: { "application/json": { example: { success: true, code: 200, data: { data: [{ id: "journal-entry_123", code: "JOURNAL_ENTRY", name: "Sample Journal-Entry", isActive: true, createdAt: "2024-01-15T00:00:00Z" }], pagination: { page: 1, limit: 10, total: 2 } }, message: "Fetched successfully" } } } } }
      },
      post: {
        tags: ["journal-entry"],
        summary: "Create journal-entry",
        requestBody: { required: true, content: { "application/json": { example: { code: "JOURNAL_ENTRY", name: "Sample Journal-Entry" }, schema: { type: "object" } } } },
        responses: { "201": { description: "Created", content: { "application/json": { example: { success: true, code: 201, data: { id: "journal-entry_123", code: "JOURNAL_ENTRY", name: "Sample Journal-Entry", isActive: true, createdAt: "2024-01-15T00:00:00Z" }, message: "journal-entry created successfully" } } } } }
      },
    },
    "/api/journal-entry/{id}": {
      get: {
        tags: ["journal-entry"],
        summary: "Get journal-entry by ID",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "uuid-123" } }],
        responses: { "200": { description: "Single item", content: { "application/json": { example: { success: true, code: 200, data: { id: "journal-entry_123", code: "JOURNAL_ENTRY", name: "Sample Journal-Entry", isActive: true, createdAt: "2024-01-15T00:00:00Z" }, message: "Retrieved" } } } } }
      },
      delete: {
        tags: ["journal-entry"],
        summary: "Delete journal-entry",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "uuid-123" } }],
        responses: { "200": { description: "Deleted", content: { "application/json": { example: { success: true, code: 200, data: null, message: "Deleted successfully" } } } } }
      },
    },
    "/api/journal-line": {
      get: {
        tags: ["journal-line"],
        summary: "List journal-line",
        responses: { "200": { description: "List response", content: { "application/json": { example: { success: true, code: 200, data: { data: [{ id: "journal-line_123", code: "JOURNAL_LINE", name: "Sample Journal-Line", isActive: true, createdAt: "2024-01-15T00:00:00Z" }], pagination: { page: 1, limit: 10, total: 2 } }, message: "Fetched successfully" } } } } }
      },
      post: {
        tags: ["journal-line"],
        summary: "Create journal-line",
        requestBody: { required: true, content: { "application/json": { example: { code: "JOURNAL_LINE", name: "Sample Journal-Line" }, schema: { type: "object" } } } },
        responses: { "201": { description: "Created", content: { "application/json": { example: { success: true, code: 201, data: { id: "journal-line_123", code: "JOURNAL_LINE", name: "Sample Journal-Line", isActive: true, createdAt: "2024-01-15T00:00:00Z" }, message: "journal-line created successfully" } } } } }
      },
    },
    "/api/journal-line/{id}": {
      get: {
        tags: ["journal-line"],
        summary: "Get journal-line by ID",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "uuid-123" } }],
        responses: { "200": { description: "Single item", content: { "application/json": { example: { success: true, code: 200, data: { id: "journal-line_123", code: "JOURNAL_LINE", name: "Sample Journal-Line", isActive: true, createdAt: "2024-01-15T00:00:00Z" }, message: "Retrieved" } } } } }
      },
      delete: {
        tags: ["journal-line"],
        summary: "Delete journal-line",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "uuid-123" } }],
        responses: { "200": { description: "Deleted", content: { "application/json": { example: { success: true, code: 200, data: null, message: "Deleted successfully" } } } } }
      },
    },
    "/api/leave-type": {
      get: {
        tags: ["leave-type"],
        summary: "List leave-type",
        responses: { "200": { description: "List response", content: { "application/json": { example: { success: true, code: 200, data: { data: [{ id: "lt_123", code: "SICK_LEAVE", name: "Sick Leave", isPaid: true, yearlyAllowed: 12, isActive: true, createdAt: "2024-01-15T00:00:00Z" }], pagination: { page: 1, limit: 10, total: 2 } }, message: "Fetched successfully" } } } } }
      },
      post: {
        tags: ["leave-type"],
        summary: "Create leave-type",
        requestBody: { required: true, content: { "application/json": { example: { code: "SICK_LEAVE", name: "Sick Leave", isPaid: true, yearlyAllowed: 12 }, schema: { type: "object" } } } },
        responses: { "201": { description: "Created", content: { "application/json": { example: { success: true, code: 201, data: { id: "lt_123", code: "SICK_LEAVE", name: "Sick Leave", isPaid: true, yearlyAllowed: 12, isActive: true, createdAt: "2024-01-15T00:00:00Z" }, message: "leave-type created successfully" } } } } }
      },
    },
    "/api/leave-type/{id}": {
      get: {
        tags: ["leave-type"],
        summary: "Get leave-type by ID",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "uuid-123" } }],
        responses: { "200": { description: "Single item", content: { "application/json": { example: { success: true, code: 200, data: { id: "lt_123", code: "SICK_LEAVE", name: "Sick Leave", isPaid: true, yearlyAllowed: 12, isActive: true, createdAt: "2024-01-15T00:00:00Z" }, message: "Retrieved" } } } } }
      },
      delete: {
        tags: ["leave-type"],
        summary: "Delete leave-type",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "uuid-123" } }],
        responses: { "200": { description: "Deleted", content: { "application/json": { example: { success: true, code: 200, data: null, message: "Deleted successfully" } } } } }
      },
    },
    "/api/notice": {
      get: {
        tags: ["notice"],
        summary: "List notice",
        responses: { "200": { description: "List response", content: { "application/json": { example: { success: true, code: 200, data: { data: [{ id: "notice_123", code: "NOTICE", name: "Sample Notice", isActive: true, createdAt: "2024-01-15T00:00:00Z" }], pagination: { page: 1, limit: 10, total: 2 } }, message: "Fetched successfully" } } } } }
      },
      post: {
        tags: ["notice"],
        summary: "Create notice",
        requestBody: { required: true, content: { "application/json": { example: { code: "NOTICE", name: "Sample Notice" }, schema: { type: "object" } } } },
        responses: { "201": { description: "Created", content: { "application/json": { example: { success: true, code: 201, data: { id: "notice_123", code: "NOTICE", name: "Sample Notice", isActive: true, createdAt: "2024-01-15T00:00:00Z" }, message: "notice created successfully" } } } } }
      },
    },
    "/api/notice-target": {
      get: {
        tags: ["notice-target"],
        summary: "List notice-target",
        responses: { "200": { description: "List response", content: { "application/json": { example: { success: true, code: 200, data: { data: [{ id: "notice-target_123", code: "NOTICE_TARGET", name: "Sample Notice-Target", isActive: true, createdAt: "2024-01-15T00:00:00Z" }], pagination: { page: 1, limit: 10, total: 2 } }, message: "Fetched successfully" } } } } }
      },
      post: {
        tags: ["notice-target"],
        summary: "Create notice-target",
        requestBody: { required: true, content: { "application/json": { example: { code: "NOTICE_TARGET", name: "Sample Notice-Target" }, schema: { type: "object" } } } },
        responses: { "201": { description: "Created", content: { "application/json": { example: { success: true, code: 201, data: { id: "notice-target_123", code: "NOTICE_TARGET", name: "Sample Notice-Target", isActive: true, createdAt: "2024-01-15T00:00:00Z" }, message: "notice-target created successfully" } } } } }
      },
    },
    "/api/notice-target/{id}": {
      get: {
        tags: ["notice-target"],
        summary: "Get notice-target by ID",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "uuid-123" } }],
        responses: { "200": { description: "Single item", content: { "application/json": { example: { success: true, code: 200, data: { id: "notice-target_123", code: "NOTICE_TARGET", name: "Sample Notice-Target", isActive: true, createdAt: "2024-01-15T00:00:00Z" }, message: "Retrieved" } } } } }
      },
      delete: {
        tags: ["notice-target"],
        summary: "Delete notice-target",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "uuid-123" } }],
        responses: { "200": { description: "Deleted", content: { "application/json": { example: { success: true, code: 200, data: null, message: "Deleted successfully" } } } } }
      },
    },
    "/api/notice/{id}": {
      get: {
        tags: ["notice"],
        summary: "Get notice by ID",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "uuid-123" } }],
        responses: { "200": { description: "Single item", content: { "application/json": { example: { success: true, code: 200, data: { id: "notice_123", code: "NOTICE", name: "Sample Notice", isActive: true, createdAt: "2024-01-15T00:00:00Z" }, message: "Retrieved" } } } } }
      },
      delete: {
        tags: ["notice"],
        summary: "Delete notice",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "uuid-123" } }],
        responses: { "200": { description: "Deleted", content: { "application/json": { example: { success: true, code: 200, data: null, message: "Deleted successfully" } } } } }
      },
    },
    "/api/otp": {
      get: {
        tags: ["otp"],
        summary: "List otp",
        responses: { "200": { description: "List response", content: { "application/json": { example: { success: true, code: 200, data: { data: [{ id: "otp_123", code: "OTP", name: "Sample Otp", isActive: true, createdAt: "2024-01-15T00:00:00Z" }], pagination: { page: 1, limit: 10, total: 2 } }, message: "Fetched successfully" } } } } }
      },
      post: {
        tags: ["otp"],
        summary: "Create otp",
        requestBody: { required: true, content: { "application/json": { example: { code: "OTP", name: "Sample Otp" }, schema: { type: "object" } } } },
        responses: { "201": { description: "Created", content: { "application/json": { example: { success: true, code: 201, data: { id: "otp_123", code: "OTP", name: "Sample Otp", isActive: true, createdAt: "2024-01-15T00:00:00Z" }, message: "otp created successfully" } } } } }
      },
    },
    "/api/otp/{id}": {
      get: {
        tags: ["otp"],
        summary: "Get otp by ID",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "uuid-123" } }],
        responses: { "200": { description: "Single item", content: { "application/json": { example: { success: true, code: 200, data: { id: "otp_123", code: "OTP", name: "Sample Otp", isActive: true, createdAt: "2024-01-15T00:00:00Z" }, message: "Retrieved" } } } } }
      },
      delete: {
        tags: ["otp"],
        summary: "Delete otp",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "uuid-123" } }],
        responses: { "200": { description: "Deleted", content: { "application/json": { example: { success: true, code: 200, data: null, message: "Deleted successfully" } } } } }
      },
    },
    "/api/payment-method": {
      get: {
        tags: ["payment-method"],
        summary: "List payment-method",
        responses: { "200": { description: "List response", content: { "application/json": { example: { success: true, code: 200, data: { data: [{ id: "pm_123", code: "CASH", name: "Cash" }], pagination: { page: 1, limit: 10, total: 2 } }, message: "Fetched successfully" } } } } }
      },
      post: {
        tags: ["payment-method"],
        summary: "Create payment-method",
        requestBody: { required: true, content: { "application/json": { example: { code: "CASH", name: "Cash" }, schema: { type: "object" } } } },
        responses: { "201": { description: "Created", content: { "application/json": { example: { success: true, code: 201, data: { id: "pm_123", code: "CASH", name: "Cash" }, message: "payment-method created successfully" } } } } }
      },
    },
    "/api/payment-method/{id}": {
      get: {
        tags: ["payment-method"],
        summary: "Get payment-method by ID",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "uuid-123" } }],
        responses: { "200": { description: "Single item", content: { "application/json": { example: { success: true, code: 200, data: { id: "pm_123", code: "CASH", name: "Cash" }, message: "Retrieved" } } } } }
      },
      delete: {
        tags: ["payment-method"],
        summary: "Delete payment-method",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "uuid-123" } }],
        responses: { "200": { description: "Deleted", content: { "application/json": { example: { success: true, code: 200, data: null, message: "Deleted successfully" } } } } }
      },
    },
    "/api/payroll": {
      get: {
        tags: ["payroll"],
        summary: "List payroll",
        responses: { "200": { description: "List response", content: { "application/json": { example: { success: true, code: 200, data: { data: [{ id: "payroll_123", code: "PAYROLL", name: "Sample Payroll", isActive: true, createdAt: "2024-01-15T00:00:00Z" }], pagination: { page: 1, limit: 10, total: 2 } }, message: "Fetched successfully" } } } } }
      },
      post: {
        tags: ["payroll"],
        summary: "Create payroll",
        requestBody: { required: true, content: { "application/json": { example: { code: "PAYROLL", name: "Sample Payroll" }, schema: { type: "object" } } } },
        responses: { "201": { description: "Created", content: { "application/json": { example: { success: true, code: 201, data: { id: "payroll_123", code: "PAYROLL", name: "Sample Payroll", isActive: true, createdAt: "2024-01-15T00:00:00Z" }, message: "payroll created successfully" } } } } }
      },
    },
    "/api/payroll/{id}": {
      get: {
        tags: ["payroll"],
        summary: "Get payroll by ID",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "uuid-123" } }],
        responses: { "200": { description: "Single item", content: { "application/json": { example: { success: true, code: 200, data: { id: "payroll_123", code: "PAYROLL", name: "Sample Payroll", isActive: true, createdAt: "2024-01-15T00:00:00Z" }, message: "Retrieved" } } } } }
      },
      delete: {
        tags: ["payroll"],
        summary: "Delete payroll",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "uuid-123" } }],
        responses: { "200": { description: "Deleted", content: { "application/json": { example: { success: true, code: 200, data: null, message: "Deleted successfully" } } } } }
      },
    },
    "/api/payslip": {
      get: {
        tags: ["payslip"],
        summary: "List payslip",
        responses: { "200": { description: "List response", content: { "application/json": { example: { success: true, code: 200, data: { data: [{ id: "payslip_123", code: "PAYSLIP", name: "Sample Payslip", isActive: true, createdAt: "2024-01-15T00:00:00Z" }], pagination: { page: 1, limit: 10, total: 2 } }, message: "Fetched successfully" } } } } }
      },
      post: {
        tags: ["payslip"],
        summary: "Create payslip",
        requestBody: { required: true, content: { "application/json": { example: { code: "PAYSLIP", name: "Sample Payslip" }, schema: { type: "object" } } } },
        responses: { "201": { description: "Created", content: { "application/json": { example: { success: true, code: 201, data: { id: "payslip_123", code: "PAYSLIP", name: "Sample Payslip", isActive: true, createdAt: "2024-01-15T00:00:00Z" }, message: "payslip created successfully" } } } } }
      },
    },
    "/api/payslip-item": {
      get: {
        tags: ["payslip-item"],
        summary: "List payslip-item",
        responses: { "200": { description: "List response", content: { "application/json": { example: { success: true, code: 200, data: { data: [{ id: "payslip-item_123", code: "PAYSLIP_ITEM", name: "Sample Payslip-Item", isActive: true, createdAt: "2024-01-15T00:00:00Z" }], pagination: { page: 1, limit: 10, total: 2 } }, message: "Fetched successfully" } } } } }
      },
      post: {
        tags: ["payslip-item"],
        summary: "Create payslip-item",
        requestBody: { required: true, content: { "application/json": { example: { code: "PAYSLIP_ITEM", name: "Sample Payslip-Item" }, schema: { type: "object" } } } },
        responses: { "201": { description: "Created", content: { "application/json": { example: { success: true, code: 201, data: { id: "payslip-item_123", code: "PAYSLIP_ITEM", name: "Sample Payslip-Item", isActive: true, createdAt: "2024-01-15T00:00:00Z" }, message: "payslip-item created successfully" } } } } }
      },
    },
    "/api/payslip-item/{id}": {
      get: {
        tags: ["payslip-item"],
        summary: "Get payslip-item by ID",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "uuid-123" } }],
        responses: { "200": { description: "Single item", content: { "application/json": { example: { success: true, code: 200, data: { id: "payslip-item_123", code: "PAYSLIP_ITEM", name: "Sample Payslip-Item", isActive: true, createdAt: "2024-01-15T00:00:00Z" }, message: "Retrieved" } } } } }
      },
      delete: {
        tags: ["payslip-item"],
        summary: "Delete payslip-item",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "uuid-123" } }],
        responses: { "200": { description: "Deleted", content: { "application/json": { example: { success: true, code: 200, data: null, message: "Deleted successfully" } } } } }
      },
    },
    "/api/payslip/{id}": {
      get: {
        tags: ["payslip"],
        summary: "Get payslip by ID",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "uuid-123" } }],
        responses: { "200": { description: "Single item", content: { "application/json": { example: { success: true, code: 200, data: { id: "payslip_123", code: "PAYSLIP", name: "Sample Payslip", isActive: true, createdAt: "2024-01-15T00:00:00Z" }, message: "Retrieved" } } } } }
      },
      delete: {
        tags: ["payslip"],
        summary: "Delete payslip",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "uuid-123" } }],
        responses: { "200": { description: "Deleted", content: { "application/json": { example: { success: true, code: 200, data: null, message: "Deleted successfully" } } } } }
      },
    },
    "/api/period": {
      get: {
        tags: ["period"],
        summary: "List period",
        responses: { "200": { description: "List response", content: { "application/json": { example: { success: true, code: 200, data: { data: [{ id: "period_123", code: "PERIOD", name: "Sample Period", isActive: true, createdAt: "2024-01-15T00:00:00Z" }], pagination: { page: 1, limit: 10, total: 2 } }, message: "Fetched successfully" } } } } }
      },
      post: {
        tags: ["period"],
        summary: "Create period",
        requestBody: { required: true, content: { "application/json": { example: { code: "PERIOD", name: "Sample Period" }, schema: { type: "object" } } } },
        responses: { "201": { description: "Created", content: { "application/json": { example: { success: true, code: 201, data: { id: "period_123", code: "PERIOD", name: "Sample Period", isActive: true, createdAt: "2024-01-15T00:00:00Z" }, message: "period created successfully" } } } } }
      },
    },
    "/api/period/{id}": {
      get: {
        tags: ["period"],
        summary: "Get period by ID",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "uuid-123" } }],
        responses: { "200": { description: "Single item", content: { "application/json": { example: { success: true, code: 200, data: { id: "period_123", code: "PERIOD", name: "Sample Period", isActive: true, createdAt: "2024-01-15T00:00:00Z" }, message: "Retrieved" } } } } }
      },
      patch: {
        tags: ["period"],
        summary: "Update period",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "uuid-123" } }],
        requestBody: { required: true, content: { "application/json": { example: { code: "PERIOD", name: "Sample Period" }, schema: { type: "object" } } } },
        responses: { "200": { description: "Updated", content: { "application/json": { example: { success: true, code: 200, data: { id: "period_123", code: "PERIOD", name: "Sample Period", isActive: true, createdAt: "2024-01-15T00:00:00Z" }, message: "period updated" } } } } }
      },
      delete: {
        tags: ["period"],
        summary: "Delete period",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "uuid-123" } }],
        responses: { "200": { description: "Deleted", content: { "application/json": { example: { success: true, code: 200, data: null, message: "Deleted successfully" } } } } }
      },
    },
    "/api/principal": {
      get: {
        tags: ["principal"],
        summary: "List principal",
        responses: { "200": { description: "List response", content: { "application/json": { example: { success: true, code: 200, data: { data: [{ id: "principal_123", code: "PRINCIPAL", name: "Sample Principal", isActive: true, createdAt: "2024-01-15T00:00:00Z" }], pagination: { page: 1, limit: 10, total: 2 } }, message: "Fetched successfully" } } } } }
      },
      post: {
        tags: ["principal"],
        summary: "Create principal",
        requestBody: { required: true, content: { "application/json": { example: { code: "PRINCIPAL", name: "Sample Principal" }, schema: { type: "object" } } } },
        responses: { "201": { description: "Created", content: { "application/json": { example: { success: true, code: 201, data: { id: "principal_123", code: "PRINCIPAL", name: "Sample Principal", isActive: true, createdAt: "2024-01-15T00:00:00Z" }, message: "principal created successfully" } } } } }
      },
    },
    "/api/principal/{id}": {
      get: {
        tags: ["principal"],
        summary: "Get principal by ID",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "uuid-123" } }],
        responses: { "200": { description: "Single item", content: { "application/json": { example: { success: true, code: 200, data: { id: "principal_123", code: "PRINCIPAL", name: "Sample Principal", isActive: true, createdAt: "2024-01-15T00:00:00Z" }, message: "Retrieved" } } } } }
      },
      delete: {
        tags: ["principal"],
        summary: "Delete principal",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "uuid-123" } }],
        responses: { "200": { description: "Deleted", content: { "application/json": { example: { success: true, code: 200, data: null, message: "Deleted successfully" } } } } }
      },
    },
    "/api/result": {
      get: {
        tags: ["result"],
        summary: "List result",
        responses: { "200": { description: "List response", content: { "application/json": { example: { success: true, code: 200, data: { data: [{ id: "result_123", code: "RESULT", name: "Sample Result", isActive: true, createdAt: "2024-01-15T00:00:00Z" }], pagination: { page: 1, limit: 10, total: 2 } }, message: "Fetched successfully" } } } } }
      },
      post: {
        tags: ["result"],
        summary: "Create result",
        requestBody: { required: true, content: { "application/json": { example: { code: "RESULT", name: "Sample Result" }, schema: { type: "object" } } } },
        responses: { "201": { description: "Created", content: { "application/json": { example: { success: true, code: 201, data: { id: "result_123", code: "RESULT", name: "Sample Result", isActive: true, createdAt: "2024-01-15T00:00:00Z" }, message: "result created successfully" } } } } }
      },
    },
    "/api/result-subject": {
      get: {
        tags: ["result-subject"],
        summary: "List result-subject",
        responses: { "200": { description: "List response", content: { "application/json": { example: { success: true, code: 200, data: { data: [{ id: "result-subject_123", code: "RESULT_SUBJECT", name: "Sample Result-Subject", isActive: true, createdAt: "2024-01-15T00:00:00Z" }], pagination: { page: 1, limit: 10, total: 2 } }, message: "Fetched successfully" } } } } }
      },
      post: {
        tags: ["result-subject"],
        summary: "Create result-subject",
        requestBody: { required: true, content: { "application/json": { example: { code: "RESULT_SUBJECT", name: "Sample Result-Subject" }, schema: { type: "object" } } } },
        responses: { "201": { description: "Created", content: { "application/json": { example: { success: true, code: 201, data: { id: "result-subject_123", code: "RESULT_SUBJECT", name: "Sample Result-Subject", isActive: true, createdAt: "2024-01-15T00:00:00Z" }, message: "result-subject created successfully" } } } } }
      },
    },
    "/api/result-subject/{id}": {
      get: {
        tags: ["result-subject"],
        summary: "Get result-subject by ID",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "uuid-123" } }],
        responses: { "200": { description: "Single item", content: { "application/json": { example: { success: true, code: 200, data: { id: "result-subject_123", code: "RESULT_SUBJECT", name: "Sample Result-Subject", isActive: true, createdAt: "2024-01-15T00:00:00Z" }, message: "Retrieved" } } } } }
      },
      patch: {
        tags: ["result-subject"],
        summary: "Update result-subject",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "uuid-123" } }],
        requestBody: { required: true, content: { "application/json": { example: { code: "RESULT_SUBJECT", name: "Sample Result-Subject" }, schema: { type: "object" } } } },
        responses: { "200": { description: "Updated", content: { "application/json": { example: { success: true, code: 200, data: { id: "result-subject_123", code: "RESULT_SUBJECT", name: "Sample Result-Subject", isActive: true, createdAt: "2024-01-15T00:00:00Z" }, message: "result-subject updated" } } } } }
      },
      delete: {
        tags: ["result-subject"],
        summary: "Delete result-subject",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "uuid-123" } }],
        responses: { "200": { description: "Deleted", content: { "application/json": { example: { success: true, code: 200, data: null, message: "Deleted successfully" } } } } }
      },
    },
    "/api/result/{id}": {
      get: {
        tags: ["result"],
        summary: "Get result by ID",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "uuid-123" } }],
        responses: { "200": { description: "Single item", content: { "application/json": { example: { success: true, code: 200, data: { id: "result_123", code: "RESULT", name: "Sample Result", isActive: true, createdAt: "2024-01-15T00:00:00Z" }, message: "Retrieved" } } } } }
      },
      patch: {
        tags: ["result"],
        summary: "Update result",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "uuid-123" } }],
        requestBody: { required: true, content: { "application/json": { example: { code: "RESULT", name: "Sample Result" }, schema: { type: "object" } } } },
        responses: { "200": { description: "Updated", content: { "application/json": { example: { success: true, code: 200, data: { id: "result_123", code: "RESULT", name: "Sample Result", isActive: true, createdAt: "2024-01-15T00:00:00Z" }, message: "result updated" } } } } }
      },
      delete: {
        tags: ["result"],
        summary: "Delete result",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "uuid-123" } }],
        responses: { "200": { description: "Deleted", content: { "application/json": { example: { success: true, code: 200, data: null, message: "Deleted successfully" } } } } }
      },
    },
    "/api/salary-component": {
      get: {
        tags: ["salary-component"],
        summary: "List salary-component",
        responses: { "200": { description: "List response", content: { "application/json": { example: { success: true, code: 200, data: { data: [{ id: "salary-component_123", code: "SALARY_COMPONENT", name: "Sample Salary-Component", isActive: true, createdAt: "2024-01-15T00:00:00Z" }], pagination: { page: 1, limit: 10, total: 2 } }, message: "Fetched successfully" } } } } }
      },
      post: {
        tags: ["salary-component"],
        summary: "Create salary-component",
        requestBody: { required: true, content: { "application/json": { example: { code: "SALARY_COMPONENT", name: "Sample Salary-Component" }, schema: { type: "object" } } } },
        responses: { "201": { description: "Created", content: { "application/json": { example: { success: true, code: 201, data: { id: "salary-component_123", code: "SALARY_COMPONENT", name: "Sample Salary-Component", isActive: true, createdAt: "2024-01-15T00:00:00Z" }, message: "salary-component created successfully" } } } } }
      },
    },
    "/api/salary-component/{id}": {
      get: {
        tags: ["salary-component"],
        summary: "Get salary-component by ID",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "uuid-123" } }],
        responses: { "200": { description: "Single item", content: { "application/json": { example: { success: true, code: 200, data: { id: "salary-component_123", code: "SALARY_COMPONENT", name: "Sample Salary-Component", isActive: true, createdAt: "2024-01-15T00:00:00Z" }, message: "Retrieved" } } } } }
      },
      patch: {
        tags: ["salary-component"],
        summary: "Update salary-component",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "uuid-123" } }],
        requestBody: { required: true, content: { "application/json": { example: { code: "SALARY_COMPONENT", name: "Sample Salary-Component" }, schema: { type: "object" } } } },
        responses: { "200": { description: "Updated", content: { "application/json": { example: { success: true, code: 200, data: { id: "salary-component_123", code: "SALARY_COMPONENT", name: "Sample Salary-Component", isActive: true, createdAt: "2024-01-15T00:00:00Z" }, message: "salary-component updated" } } } } }
      },
      delete: {
        tags: ["salary-component"],
        summary: "Delete salary-component",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "uuid-123" } }],
        responses: { "200": { description: "Deleted", content: { "application/json": { example: { success: true, code: 200, data: null, message: "Deleted successfully" } } } } }
      },
    },
    "/api/salary-structure": {
      get: {
        tags: ["salary-structure"],
        summary: "List salary-structure",
        responses: { "200": { description: "List response", content: { "application/json": { example: { success: true, code: 200, data: { data: [{ id: "salary-structure_123", code: "SALARY_STRUCTURE", name: "Sample Salary-Structure", isActive: true, createdAt: "2024-01-15T00:00:00Z" }], pagination: { page: 1, limit: 10, total: 2 } }, message: "Fetched successfully" } } } } }
      },
      post: {
        tags: ["salary-structure"],
        summary: "Create salary-structure",
        requestBody: { required: true, content: { "application/json": { example: { code: "SALARY_STRUCTURE", name: "Sample Salary-Structure" }, schema: { type: "object" } } } },
        responses: { "201": { description: "Created", content: { "application/json": { example: { success: true, code: 201, data: { id: "salary-structure_123", code: "SALARY_STRUCTURE", name: "Sample Salary-Structure", isActive: true, createdAt: "2024-01-15T00:00:00Z" }, message: "salary-structure created successfully" } } } } }
      },
    },
    "/api/salary-structure-item": {
      get: {
        tags: ["salary-structure-item"],
        summary: "List salary-structure-item",
        responses: { "200": { description: "List response", content: { "application/json": { example: { success: true, code: 200, data: { data: [{ id: "salary-structure-item_123", code: "SALARY_STRUCTURE_ITEM", name: "Sample Salary-Structure-Item", isActive: true, createdAt: "2024-01-15T00:00:00Z" }], pagination: { page: 1, limit: 10, total: 2 } }, message: "Fetched successfully" } } } } }
      },
      post: {
        tags: ["salary-structure-item"],
        summary: "Create salary-structure-item",
        requestBody: { required: true, content: { "application/json": { example: { code: "SALARY_STRUCTURE_ITEM", name: "Sample Salary-Structure-Item" }, schema: { type: "object" } } } },
        responses: { "201": { description: "Created", content: { "application/json": { example: { success: true, code: 201, data: { id: "salary-structure-item_123", code: "SALARY_STRUCTURE_ITEM", name: "Sample Salary-Structure-Item", isActive: true, createdAt: "2024-01-15T00:00:00Z" }, message: "salary-structure-item created successfully" } } } } }
      },
    },
    "/api/salary-structure-item/{id}": {
      get: {
        tags: ["salary-structure-item"],
        summary: "Get salary-structure-item by ID",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "uuid-123" } }],
        responses: { "200": { description: "Single item", content: { "application/json": { example: { success: true, code: 200, data: { id: "salary-structure-item_123", code: "SALARY_STRUCTURE_ITEM", name: "Sample Salary-Structure-Item", isActive: true, createdAt: "2024-01-15T00:00:00Z" }, message: "Retrieved" } } } } }
      },
      patch: {
        tags: ["salary-structure-item"],
        summary: "Update salary-structure-item",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "uuid-123" } }],
        requestBody: { required: true, content: { "application/json": { example: { code: "SALARY_STRUCTURE_ITEM", name: "Sample Salary-Structure-Item" }, schema: { type: "object" } } } },
        responses: { "200": { description: "Updated", content: { "application/json": { example: { success: true, code: 200, data: { id: "salary-structure-item_123", code: "SALARY_STRUCTURE_ITEM", name: "Sample Salary-Structure-Item", isActive: true, createdAt: "2024-01-15T00:00:00Z" }, message: "salary-structure-item updated" } } } } }
      },
      delete: {
        tags: ["salary-structure-item"],
        summary: "Delete salary-structure-item",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "uuid-123" } }],
        responses: { "200": { description: "Deleted", content: { "application/json": { example: { success: true, code: 200, data: null, message: "Deleted successfully" } } } } }
      },
    },
    "/api/salary-structure/{id}": {
      get: {
        tags: ["salary-structure"],
        summary: "Get salary-structure by ID",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "uuid-123" } }],
        responses: { "200": { description: "Single item", content: { "application/json": { example: { success: true, code: 200, data: { id: "salary-structure_123", code: "SALARY_STRUCTURE", name: "Sample Salary-Structure", isActive: true, createdAt: "2024-01-15T00:00:00Z" }, message: "Retrieved" } } } } }
      },
      patch: {
        tags: ["salary-structure"],
        summary: "Update salary-structure",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "uuid-123" } }],
        requestBody: { required: true, content: { "application/json": { example: { code: "SALARY_STRUCTURE", name: "Sample Salary-Structure" }, schema: { type: "object" } } } },
        responses: { "200": { description: "Updated", content: { "application/json": { example: { success: true, code: 200, data: { id: "salary-structure_123", code: "SALARY_STRUCTURE", name: "Sample Salary-Structure", isActive: true, createdAt: "2024-01-15T00:00:00Z" }, message: "salary-structure updated" } } } } }
      },
      delete: {
        tags: ["salary-structure"],
        summary: "Delete salary-structure",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "uuid-123" } }],
        responses: { "200": { description: "Deleted", content: { "application/json": { example: { success: true, code: 200, data: null, message: "Deleted successfully" } } } } }
      },
    },
    "/api/setting": {
      get: {
        tags: ["setting"],
        summary: "List setting",
        responses: { "200": { description: "List response", content: { "application/json": { example: { success: true, code: 200, data: { data: [{ id: "setting_123", code: "SETTING", name: "Sample Setting", isActive: true, createdAt: "2024-01-15T00:00:00Z" }], pagination: { page: 1, limit: 10, total: 2 } }, message: "Fetched successfully" } } } } }
      },
      post: {
        tags: ["setting"],
        summary: "Create setting",
        requestBody: { required: true, content: { "application/json": { example: { code: "SETTING", name: "Sample Setting" }, schema: { type: "object" } } } },
        responses: { "201": { description: "Created", content: { "application/json": { example: { success: true, code: 201, data: { id: "setting_123", code: "SETTING", name: "Sample Setting", isActive: true, createdAt: "2024-01-15T00:00:00Z" }, message: "setting created successfully" } } } } }
      },
    },
    "/api/setting/key/:key": {
      get: {
        tags: ["setting"],
        summary: "List setting",
        responses: { "200": { description: "List response", content: { "application/json": { example: { success: true, code: 200, data: { data: [{ id: "setting_123", code: "SETTING", name: "Sample Setting", isActive: true, createdAt: "2024-01-15T00:00:00Z" }], pagination: { page: 1, limit: 10, total: 2 } }, message: "Fetched successfully" } } } } }
      },
    },
    "/api/setting/{id}": {
      get: {
        tags: ["setting"],
        summary: "Get setting by ID",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "uuid-123" } }],
        responses: { "200": { description: "Single item", content: { "application/json": { example: { success: true, code: 200, data: { id: "setting_123", code: "SETTING", name: "Sample Setting", isActive: true, createdAt: "2024-01-15T00:00:00Z" }, message: "Retrieved" } } } } }
      },
      patch: {
        tags: ["setting"],
        summary: "Update setting",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "uuid-123" } }],
        requestBody: { required: true, content: { "application/json": { example: { code: "SETTING", name: "Sample Setting" }, schema: { type: "object" } } } },
        responses: { "200": { description: "Updated", content: { "application/json": { example: { success: true, code: 200, data: { id: "setting_123", code: "SETTING", name: "Sample Setting", isActive: true, createdAt: "2024-01-15T00:00:00Z" }, message: "setting updated" } } } } }
      },
      delete: {
        tags: ["setting"],
        summary: "Delete setting",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "uuid-123" } }],
        responses: { "200": { description: "Deleted", content: { "application/json": { example: { success: true, code: 200, data: null, message: "Deleted successfully" } } } } }
      },
    },
    "/api/staff": {
      get: {
        tags: ["staff"],
        summary: "List staff",
        responses: { "200": { description: "List response", content: { "application/json": { example: { success: true, code: 200, data: { data: [{ id: "staff_123", code: "STAFF", name: "Sample Staff", isActive: true, createdAt: "2024-01-15T00:00:00Z" }], pagination: { page: 1, limit: 10, total: 2 } }, message: "Fetched successfully" } } } } }
      },
      post: {
        tags: ["staff"],
        summary: "Create staff",
        requestBody: { required: true, content: { "application/json": { example: { code: "STAFF", name: "Sample Staff" }, schema: { type: "object" } } } },
        responses: { "201": { description: "Created", content: { "application/json": { example: { success: true, code: 201, data: { id: "staff_123", code: "STAFF", name: "Sample Staff", isActive: true, createdAt: "2024-01-15T00:00:00Z" }, message: "staff created successfully" } } } } }
      },
    },
    "/api/staff/{id}": {
      get: {
        tags: ["staff"],
        summary: "Get staff by ID",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "uuid-123" } }],
        responses: { "200": { description: "Single item", content: { "application/json": { example: { success: true, code: 200, data: { id: "staff_123", code: "STAFF", name: "Sample Staff", isActive: true, createdAt: "2024-01-15T00:00:00Z" }, message: "Retrieved" } } } } }
      },
      delete: {
        tags: ["staff"],
        summary: "Delete staff",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "uuid-123" } }],
        responses: { "200": { description: "Deleted", content: { "application/json": { example: { success: true, code: 200, data: null, message: "Deleted successfully" } } } } }
      },
    },
    "/api/student": {
      get: {
        tags: ["student"],
        summary: "List student",
        responses: { "200": { description: "List response", content: { "application/json": { example: { success: true, code: 200, data: { data: [{ id: "stu_123", firstName: "Ram", lastName: "Thapa", email: "ram.thapa@example.com", studentCode: "STU-2024-001", batchId: "batch_123" }], pagination: { page: 1, limit: 10, total: 2 } }, message: "Fetched successfully" } } } } }
      },
      post: {
        tags: ["student"],
        summary: "Create student",
        requestBody: { required: true, content: { "application/json": { example: { firstName: "Ram", lastName: "Thapa", email: "ram.thapa@example.com", batchId: "batch_123", gender: "MALE" }, schema: { type: "object" } } } },
        responses: { "201": { description: "Created", content: { "application/json": { example: { success: true, code: 201, data: { id: "stu_123", firstName: "Ram", lastName: "Thapa", email: "ram.thapa@example.com", studentCode: "STU-2024-001", batchId: "batch_123" }, message: "student created successfully" } } } } }
      },
    },
    "/api/student-attendance": {
      get: {
        tags: ["student-attendance"],
        summary: "List student-attendance",
        responses: { "200": { description: "List response", content: { "application/json": { example: { success: true, code: 200, data: { data: [{ id: "student-attendance_123", code: "STUDENT_ATTENDANCE", name: "Sample Student-Attendance", isActive: true, createdAt: "2024-01-15T00:00:00Z" }], pagination: { page: 1, limit: 10, total: 2 } }, message: "Fetched successfully" } } } } }
      },
      post: {
        tags: ["student-attendance"],
        summary: "Create student-attendance",
        requestBody: { required: true, content: { "application/json": { example: { code: "STUDENT_ATTENDANCE", name: "Sample Student-Attendance" }, schema: { type: "object" } } } },
        responses: { "201": { description: "Created", content: { "application/json": { example: { success: true, code: 201, data: { id: "student-attendance_123", code: "STUDENT_ATTENDANCE", name: "Sample Student-Attendance", isActive: true, createdAt: "2024-01-15T00:00:00Z" }, message: "student-attendance created successfully" } } } } }
      },
    },
    "/api/student-attendance/bulk": {
      post: {
        tags: ["student-attendance"],
        summary: "Create student-attendance",
        requestBody: { required: true, content: { "application/json": { example: { code: "STUDENT_ATTENDANCE", name: "Sample Student-Attendance" }, schema: { type: "object" } } } },
        responses: { "201": { description: "Created", content: { "application/json": { example: { success: true, code: 201, data: { id: "student-attendance_123", code: "STUDENT_ATTENDANCE", name: "Sample Student-Attendance", isActive: true, createdAt: "2024-01-15T00:00:00Z" }, message: "student-attendance created successfully" } } } } }
      },
    },
    "/api/student-attendance/student/:studentId/summary": {
      get: {
        tags: ["student-attendance"],
        summary: "List student-attendance",
        responses: { "200": { description: "List response", content: { "application/json": { example: { success: true, code: 200, data: { data: [{ id: "student-attendance_123", code: "STUDENT_ATTENDANCE", name: "Sample Student-Attendance", isActive: true, createdAt: "2024-01-15T00:00:00Z" }], pagination: { page: 1, limit: 10, total: 2 } }, message: "Fetched successfully" } } } } }
      },
    },
    "/api/student-attendance/{id}": {
      get: {
        tags: ["student-attendance"],
        summary: "Get student-attendance by ID",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "uuid-123" } }],
        responses: { "200": { description: "Single item", content: { "application/json": { example: { success: true, code: 200, data: { id: "student-attendance_123", code: "STUDENT_ATTENDANCE", name: "Sample Student-Attendance", isActive: true, createdAt: "2024-01-15T00:00:00Z" }, message: "Retrieved" } } } } }
      },
      patch: {
        tags: ["student-attendance"],
        summary: "Update student-attendance",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "uuid-123" } }],
        requestBody: { required: true, content: { "application/json": { example: { code: "STUDENT_ATTENDANCE", name: "Sample Student-Attendance" }, schema: { type: "object" } } } },
        responses: { "200": { description: "Updated", content: { "application/json": { example: { success: true, code: 200, data: { id: "student-attendance_123", code: "STUDENT_ATTENDANCE", name: "Sample Student-Attendance", isActive: true, createdAt: "2024-01-15T00:00:00Z" }, message: "student-attendance updated" } } } } }
      },
      delete: {
        tags: ["student-attendance"],
        summary: "Delete student-attendance",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "uuid-123" } }],
        responses: { "200": { description: "Deleted", content: { "application/json": { example: { success: true, code: 200, data: null, message: "Deleted successfully" } } } } }
      },
    },
    "/api/student-fee": {
      get: {
        tags: ["student-fee"],
        summary: "List student-fee",
        responses: { "200": { description: "List response", content: { "application/json": { example: { success: true, code: 200, data: { data: [{ id: "student-fee_123", code: "STUDENT_FEE", name: "Sample Student-Fee", isActive: true, createdAt: "2024-01-15T00:00:00Z" }], pagination: { page: 1, limit: 10, total: 2 } }, message: "Fetched successfully" } } } } }
      },
      post: {
        tags: ["student-fee"],
        summary: "Create student-fee",
        requestBody: { required: true, content: { "application/json": { example: { code: "STUDENT_FEE", name: "Sample Student-Fee" }, schema: { type: "object" } } } },
        responses: { "201": { description: "Created", content: { "application/json": { example: { success: true, code: 201, data: { id: "student-fee_123", code: "STUDENT_FEE", name: "Sample Student-Fee", isActive: true, createdAt: "2024-01-15T00:00:00Z" }, message: "student-fee created successfully" } } } } }
      },
    },
    "/api/student-fee-item": {
      get: {
        tags: ["student-fee-item"],
        summary: "List student-fee-item",
        responses: { "200": { description: "List response", content: { "application/json": { example: { success: true, code: 200, data: { data: [{ id: "student-fee-item_123", code: "STUDENT_FEE_ITEM", name: "Sample Student-Fee-Item", isActive: true, createdAt: "2024-01-15T00:00:00Z" }], pagination: { page: 1, limit: 10, total: 2 } }, message: "Fetched successfully" } } } } }
      },
      post: {
        tags: ["student-fee-item"],
        summary: "Create student-fee-item",
        requestBody: { required: true, content: { "application/json": { example: { code: "STUDENT_FEE_ITEM", name: "Sample Student-Fee-Item" }, schema: { type: "object" } } } },
        responses: { "201": { description: "Created", content: { "application/json": { example: { success: true, code: 201, data: { id: "student-fee-item_123", code: "STUDENT_FEE_ITEM", name: "Sample Student-Fee-Item", isActive: true, createdAt: "2024-01-15T00:00:00Z" }, message: "student-fee-item created successfully" } } } } }
      },
    },
    "/api/student-fee-item/{id}": {
      get: {
        tags: ["student-fee-item"],
        summary: "Get student-fee-item by ID",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "uuid-123" } }],
        responses: { "200": { description: "Single item", content: { "application/json": { example: { success: true, code: 200, data: { id: "student-fee-item_123", code: "STUDENT_FEE_ITEM", name: "Sample Student-Fee-Item", isActive: true, createdAt: "2024-01-15T00:00:00Z" }, message: "Retrieved" } } } } }
      },
      delete: {
        tags: ["student-fee-item"],
        summary: "Delete student-fee-item",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "uuid-123" } }],
        responses: { "200": { description: "Deleted", content: { "application/json": { example: { success: true, code: 200, data: null, message: "Deleted successfully" } } } } }
      },
    },
    "/api/student-fee/{id}": {
      get: {
        tags: ["student-fee"],
        summary: "Get student-fee by ID",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "uuid-123" } }],
        responses: { "200": { description: "Single item", content: { "application/json": { example: { success: true, code: 200, data: { id: "student-fee_123", code: "STUDENT_FEE", name: "Sample Student-Fee", isActive: true, createdAt: "2024-01-15T00:00:00Z" }, message: "Retrieved" } } } } }
      },
      delete: {
        tags: ["student-fee"],
        summary: "Delete student-fee",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "uuid-123" } }],
        responses: { "200": { description: "Deleted", content: { "application/json": { example: { success: true, code: 200, data: null, message: "Deleted successfully" } } } } }
      },
    },
    "/api/student/{id}": {
      get: {
        tags: ["student"],
        summary: "Get student by ID",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "uuid-123" } }],
        responses: { "200": { description: "Single item", content: { "application/json": { example: { success: true, code: 200, data: { id: "stu_123", firstName: "Ram", lastName: "Thapa", email: "ram.thapa@example.com", studentCode: "STU-2024-001", batchId: "batch_123" }, message: "Retrieved" } } } } }
      },
      patch: {
        tags: ["student"],
        summary: "Update student",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "uuid-123" } }],
        requestBody: { required: true, content: { "application/json": { example: { firstName: "Ram", lastName: "Thapa", email: "ram.thapa@example.com", batchId: "batch_123", gender: "MALE" }, schema: { type: "object" } } } },
        responses: { "200": { description: "Updated", content: { "application/json": { example: { success: true, code: 200, data: { id: "stu_123", firstName: "Ram", lastName: "Thapa", email: "ram.thapa@example.com", studentCode: "STU-2024-001", batchId: "batch_123" }, message: "student updated" } } } } }
      },
      delete: {
        tags: ["student"],
        summary: "Delete student",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "uuid-123" } }],
        responses: { "200": { description: "Deleted", content: { "application/json": { example: { success: true, code: 200, data: null, message: "Deleted successfully" } } } } }
      },
    },
    "/api/subject": {
      get: {
        tags: ["subject"],
        summary: "List subject",
        responses: { "200": { description: "List response", content: { "application/json": { example: { success: true, code: 200, data: { data: [{ id: "subject_123", code: "SUBJECT", name: "Sample Subject", isActive: true, createdAt: "2024-01-15T00:00:00Z" }], pagination: { page: 1, limit: 10, total: 2 } }, message: "Fetched successfully" } } } } }
      },
      post: {
        tags: ["subject"],
        summary: "Create subject",
        requestBody: { required: true, content: { "application/json": { example: { code: "SUBJECT", name: "Sample Subject" }, schema: { type: "object" } } } },
        responses: { "201": { description: "Created", content: { "application/json": { example: { success: true, code: 201, data: { id: "subject_123", code: "SUBJECT", name: "Sample Subject", isActive: true, createdAt: "2024-01-15T00:00:00Z" }, message: "subject created successfully" } } } } }
      },
    },
    "/api/subject/{id}": {
      get: {
        tags: ["subject"],
        summary: "Get subject by ID",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "uuid-123" } }],
        responses: { "200": { description: "Single item", content: { "application/json": { example: { success: true, code: 200, data: { id: "subject_123", code: "SUBJECT", name: "Sample Subject", isActive: true, createdAt: "2024-01-15T00:00:00Z" }, message: "Retrieved" } } } } }
      },
      patch: {
        tags: ["subject"],
        summary: "Update subject",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "uuid-123" } }],
        requestBody: { required: true, content: { "application/json": { example: { code: "SUBJECT", name: "Sample Subject" }, schema: { type: "object" } } } },
        responses: { "200": { description: "Updated", content: { "application/json": { example: { success: true, code: 200, data: { id: "subject_123", code: "SUBJECT", name: "Sample Subject", isActive: true, createdAt: "2024-01-15T00:00:00Z" }, message: "subject updated" } } } } }
      },
      delete: {
        tags: ["subject"],
        summary: "Delete subject",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "uuid-123" } }],
        responses: { "200": { description: "Deleted", content: { "application/json": { example: { success: true, code: 200, data: null, message: "Deleted successfully" } } } } }
      },
    },
    "/api/tax-slab": {
      get: {
        tags: ["tax-slab"],
        summary: "List tax-slab",
        responses: { "200": { description: "List response", content: { "application/json": { example: { success: true, code: 200, data: { data: [{ id: "tax-slab_123", code: "TAX_SLAB", name: "Sample Tax-Slab", isActive: true, createdAt: "2024-01-15T00:00:00Z" }], pagination: { page: 1, limit: 10, total: 2 } }, message: "Fetched successfully" } } } } }
      },
      post: {
        tags: ["tax-slab"],
        summary: "Create tax-slab",
        requestBody: { required: true, content: { "application/json": { example: { code: "TAX_SLAB", name: "Sample Tax-Slab" }, schema: { type: "object" } } } },
        responses: { "201": { description: "Created", content: { "application/json": { example: { success: true, code: 201, data: { id: "tax-slab_123", code: "TAX_SLAB", name: "Sample Tax-Slab", isActive: true, createdAt: "2024-01-15T00:00:00Z" }, message: "tax-slab created successfully" } } } } }
      },
    },
    "/api/tax-slab/{id}": {
      get: {
        tags: ["tax-slab"],
        summary: "Get tax-slab by ID",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "uuid-123" } }],
        responses: { "200": { description: "Single item", content: { "application/json": { example: { success: true, code: 200, data: { id: "tax-slab_123", code: "TAX_SLAB", name: "Sample Tax-Slab", isActive: true, createdAt: "2024-01-15T00:00:00Z" }, message: "Retrieved" } } } } }
      },
      patch: {
        tags: ["tax-slab"],
        summary: "Update tax-slab",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "uuid-123" } }],
        requestBody: { required: true, content: { "application/json": { example: { code: "TAX_SLAB", name: "Sample Tax-Slab" }, schema: { type: "object" } } } },
        responses: { "200": { description: "Updated", content: { "application/json": { example: { success: true, code: 200, data: { id: "tax-slab_123", code: "TAX_SLAB", name: "Sample Tax-Slab", isActive: true, createdAt: "2024-01-15T00:00:00Z" }, message: "tax-slab updated" } } } } }
      },
      delete: {
        tags: ["tax-slab"],
        summary: "Delete tax-slab",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "uuid-123" } }],
        responses: { "200": { description: "Deleted", content: { "application/json": { example: { success: true, code: 200, data: null, message: "Deleted successfully" } } } } }
      },
    },
    "/api/teacher": {
      get: {
        tags: ["teacher"],
        summary: "List teacher",
        responses: { "200": { description: "List response", content: { "application/json": { example: { success: true, code: 200, data: { data: [{ id: "teacher_123", code: "TEACHER", name: "Sample Teacher", isActive: true, createdAt: "2024-01-15T00:00:00Z" }], pagination: { page: 1, limit: 10, total: 2 } }, message: "Fetched successfully" } } } } }
      },
      post: {
        tags: ["teacher"],
        summary: "Create teacher",
        requestBody: { required: true, content: { "application/json": { example: { code: "TEACHER", name: "Sample Teacher" }, schema: { type: "object" } } } },
        responses: { "201": { description: "Created", content: { "application/json": { example: { success: true, code: 201, data: { id: "teacher_123", code: "TEACHER", name: "Sample Teacher", isActive: true, createdAt: "2024-01-15T00:00:00Z" }, message: "teacher created successfully" } } } } }
      },
    },
    "/api/teacher-batch-pay": {
      get: {
        tags: ["teacher-batch-pay"],
        summary: "List teacher-batch-pay",
        responses: { "200": { description: "List response", content: { "application/json": { example: { success: true, code: 200, data: { data: [{ id: "teacher-batch-pay_123", code: "TEACHER_BATCH_PAY", name: "Sample Teacher-Batch-Pay", isActive: true, createdAt: "2024-01-15T00:00:00Z" }], pagination: { page: 1, limit: 10, total: 2 } }, message: "Fetched successfully" } } } } }
      },
      post: {
        tags: ["teacher-batch-pay"],
        summary: "Create teacher-batch-pay",
        requestBody: { required: true, content: { "application/json": { example: { code: "TEACHER_BATCH_PAY", name: "Sample Teacher-Batch-Pay" }, schema: { type: "object" } } } },
        responses: { "201": { description: "Created", content: { "application/json": { example: { success: true, code: 201, data: { id: "teacher-batch-pay_123", code: "TEACHER_BATCH_PAY", name: "Sample Teacher-Batch-Pay", isActive: true, createdAt: "2024-01-15T00:00:00Z" }, message: "teacher-batch-pay created successfully" } } } } }
      },
    },
    "/api/teacher-batch-pay/{id}": {
      get: {
        tags: ["teacher-batch-pay"],
        summary: "Get teacher-batch-pay by ID",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "uuid-123" } }],
        responses: { "200": { description: "Single item", content: { "application/json": { example: { success: true, code: 200, data: { id: "teacher-batch-pay_123", code: "TEACHER_BATCH_PAY", name: "Sample Teacher-Batch-Pay", isActive: true, createdAt: "2024-01-15T00:00:00Z" }, message: "Retrieved" } } } } }
      },
      patch: {
        tags: ["teacher-batch-pay"],
        summary: "Update teacher-batch-pay",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "uuid-123" } }],
        requestBody: { required: true, content: { "application/json": { example: { code: "TEACHER_BATCH_PAY", name: "Sample Teacher-Batch-Pay" }, schema: { type: "object" } } } },
        responses: { "200": { description: "Updated", content: { "application/json": { example: { success: true, code: 200, data: { id: "teacher-batch-pay_123", code: "TEACHER_BATCH_PAY", name: "Sample Teacher-Batch-Pay", isActive: true, createdAt: "2024-01-15T00:00:00Z" }, message: "teacher-batch-pay updated" } } } } }
      },
      delete: {
        tags: ["teacher-batch-pay"],
        summary: "Delete teacher-batch-pay",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "uuid-123" } }],
        responses: { "200": { description: "Deleted", content: { "application/json": { example: { success: true, code: 200, data: null, message: "Deleted successfully" } } } } }
      },
    },
    "/api/teacher/{id}": {
      get: {
        tags: ["teacher"],
        summary: "Get teacher by ID",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "uuid-123" } }],
        responses: { "200": { description: "Single item", content: { "application/json": { example: { success: true, code: 200, data: { id: "teacher_123", code: "TEACHER", name: "Sample Teacher", isActive: true, createdAt: "2024-01-15T00:00:00Z" }, message: "Retrieved" } } } } }
      },
      delete: {
        tags: ["teacher"],
        summary: "Delete teacher",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "uuid-123" } }],
        responses: { "200": { description: "Deleted", content: { "application/json": { example: { success: true, code: 200, data: null, message: "Deleted successfully" } } } } }
      },
    },
    "/api/teaching-assignment": {
      get: {
        tags: ["teaching-assignment"],
        summary: "List teaching-assignment",
        responses: { "200": { description: "List response", content: { "application/json": { example: { success: true, code: 200, data: { data: [{ id: "teaching-assignment_123", code: "TEACHING_ASSIGNMENT", name: "Sample Teaching-Assignment", isActive: true, createdAt: "2024-01-15T00:00:00Z" }], pagination: { page: 1, limit: 10, total: 2 } }, message: "Fetched successfully" } } } } }
      },
      post: {
        tags: ["teaching-assignment"],
        summary: "Create teaching-assignment",
        requestBody: { required: true, content: { "application/json": { example: { code: "TEACHING_ASSIGNMENT", name: "Sample Teaching-Assignment" }, schema: { type: "object" } } } },
        responses: { "201": { description: "Created", content: { "application/json": { example: { success: true, code: 201, data: { id: "teaching-assignment_123", code: "TEACHING_ASSIGNMENT", name: "Sample Teaching-Assignment", isActive: true, createdAt: "2024-01-15T00:00:00Z" }, message: "teaching-assignment created successfully" } } } } }
      },
    },
    "/api/teaching-assignment/{id}": {
      get: {
        tags: ["teaching-assignment"],
        summary: "Get teaching-assignment by ID",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "uuid-123" } }],
        responses: { "200": { description: "Single item", content: { "application/json": { example: { success: true, code: 200, data: { id: "teaching-assignment_123", code: "TEACHING_ASSIGNMENT", name: "Sample Teaching-Assignment", isActive: true, createdAt: "2024-01-15T00:00:00Z" }, message: "Retrieved" } } } } }
      },
      delete: {
        tags: ["teaching-assignment"],
        summary: "Delete teaching-assignment",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "uuid-123" } }],
        responses: { "200": { description: "Deleted", content: { "application/json": { example: { success: true, code: 200, data: null, message: "Deleted successfully" } } } } }
      },
    },
    "/api/user": {
      get: {
        tags: ["user"],
        summary: "List user",
        responses: { "200": { description: "List response", content: { "application/json": { example: { success: true, code: 200, data: { data: [{ id: "user_123", code: "USER", name: "Sample User", isActive: true, createdAt: "2024-01-15T00:00:00Z" }], pagination: { page: 1, limit: 10, total: 2 } }, message: "Fetched successfully" } } } } }
      },
      post: {
        tags: ["user"],
        summary: "Create user",
        requestBody: { required: true, content: { "application/json": { example: { code: "USER", name: "Sample User" }, schema: { type: "object" } } } },
        responses: { "201": { description: "Created", content: { "application/json": { example: { success: true, code: 201, data: { id: "user_123", code: "USER", name: "Sample User", isActive: true, createdAt: "2024-01-15T00:00:00Z" }, message: "user created successfully" } } } } }
      },
    },
    "/api/user/{id}": {
      get: {
        tags: ["user"],
        summary: "Get user by ID",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "uuid-123" } }],
        responses: { "200": { description: "Single item", content: { "application/json": { example: { success: true, code: 200, data: { id: "user_123", code: "USER", name: "Sample User", isActive: true, createdAt: "2024-01-15T00:00:00Z" }, message: "Retrieved" } } } } }
      },
      patch: {
        tags: ["user"],
        summary: "Update user",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "uuid-123" } }],
        requestBody: { required: true, content: { "application/json": { example: { code: "USER", name: "Sample User" }, schema: { type: "object" } } } },
        responses: { "200": { description: "Updated", content: { "application/json": { example: { success: true, code: 200, data: { id: "user_123", code: "USER", name: "Sample User", isActive: true, createdAt: "2024-01-15T00:00:00Z" }, message: "user updated" } } } } }
      },
      delete: {
        tags: ["user"],
        summary: "Delete user",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "uuid-123" } }],
        responses: { "200": { description: "Deleted", content: { "application/json": { example: { success: true, code: 200, data: null, message: "Deleted successfully" } } } } }
      },
    },
    "/api/user/{id}/password": {
      patch: {
        tags: ["user"],
        summary: "Update user",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "uuid-123" } }],
        requestBody: { required: true, content: { "application/json": { example: { code: "USER", name: "Sample User" }, schema: { type: "object" } } } },
        responses: { "200": { description: "Updated", content: { "application/json": { example: { success: true, code: 200, data: { id: "user_123", code: "USER", name: "Sample User", isActive: true, createdAt: "2024-01-15T00:00:00Z" }, message: "user updated" } } } } }
      },
    },
    "/api/user/{id}/unlock": {
      patch: {
        tags: ["user"],
        summary: "Update user",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "uuid-123" } }],
        requestBody: { required: true, content: { "application/json": { example: { code: "USER", name: "Sample User" }, schema: { type: "object" } } } },
        responses: { "200": { description: "Updated", content: { "application/json": { example: { success: true, code: 200, data: { id: "user_123", code: "USER", name: "Sample User", isActive: true, createdAt: "2024-01-15T00:00:00Z" }, message: "user updated" } } } } }
      },
    },
  }
};