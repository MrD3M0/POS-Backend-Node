/**
 * Shared response types for the teacher dashboard endpoint
 * (GET /api/teacher/dashboard).
 *
 * The frontend mirrors this file at
 * CollegeMS-React-App/src/types/teacher-dashboard.ts — keep both in sync.
 */

export type T_DashboardRange = 7 | 30 | 90;

export interface T_DashboardStat {
  /** Number shown in the big figure of the stat card. */
  value: number;
  /** Short helper text under the number (e.g. "3 need marks entry"). */
  helper: string;
}

export interface T_DashboardStats {
  totalClasses: T_DashboardStat;
  totalStudents: T_DashboardStat;
  pendingAttendance: T_DashboardStat;
  pendingMarksEntry: T_DashboardStat;
  /** Overall attendance % of the selected range (PRESENT + LATE). */
  attendanceRate: number;
  /** Attendance % of the range right before the selected one (for the trend). */
  previousAttendanceRate: number;
}

export interface T_DashboardAttendancePoint {
  /** BS date (YYYY-MM-DD). */
  date: string;
  present: number;
  absent: number;
  late: number;
  leave: number;
}

export interface T_DashboardClassAttendance {
  assignmentId: string;
  /** "Subject - Class/Section" */
  label: string;
  subjectName: string;
  classLabel: string;
  presentPercent: number;
  presentCount: number;
  totalRecords: number;
}

export interface T_DashboardResultBucket {
  label: string;
  count: number;
}

export interface T_DashboardResultDistribution {
  /** ExamSubject id (the "exam batch" of one subject inside an exam). */
  examBatchId: string | null;
  /** "Exam - Subject" */
  label: string;
  buckets: T_DashboardResultBucket[];
  passed: number;
  failed: number;
  total: number;
}

export interface T_DashboardSubjectPassRate {
  subjectName: string;
  passPercent: number;
  passed: number;
  total: number;
}

export interface T_DashboardPassRate {
  examBatchId: string | null;
  /** Exam name the subject pass rates belong to. */
  label: string;
  subjects: T_DashboardSubjectPassRate[];
  overallPassPercent: number;
}

export type T_DashboardScheduleStatus = "COMPLETED" | "ONGOING" | "UPCOMING";

export interface T_DashboardScheduleItem {
  scheduleId: string | null;
  sessionId: string | null;
  assignmentId: string;
  periodId: string | null;
  /** "Subject - Class/Section" */
  label: string;
  subjectName: string;
  subjectCode: string | null;
  classLabel: string;
  periodName: string;
  startTime: string | null;
  endTime: string | null;
  /** Room from the weekly ClassSchedule row, null when unscheduled. */
  room: string | null;
  attendanceTaken: boolean;
  status: T_DashboardScheduleStatus;
  /** The first UPCOMING period of the day. */
  isNext: boolean;
}

/** One day of the teacher's week (getWeekSchedule). */
export interface T_DashboardWeekDay {
  date: string;
  dayOfWeek: string;
  /** Employee-applicable holiday, null on a working day. */
  holidayName: string | null;
  items: T_DashboardScheduleItem[];
}

export interface T_DashboardLowAttendanceStudent {
  studentId: string;
  name: string;
  universityRegNo: string;
  classLabel: string;
  subjectName: string;
  attendancePercent: number;
  presentCount: number;
  totalRecords: number;
}

export type T_DashboardMarksStatus = "PENDING" | "PARTIAL" | "COMPLETE";

export interface T_DashboardExamBatch {
  /** ExamSubject id. */
  id: string;
  examId: string;
  examName: string;
  subjectName: string;
  classLabel: string;
  /** "Exam - Subject" */
  label: string;
  examDateBs: string | null;
  fullMarks: number;
  passMarks: number;
  marksStatus: T_DashboardMarksStatus;
  marksEntered: number;
  totalStudents: number;
}

export interface T_DashboardRecentResult {
  resultId: string | null;
  examName: string;
  subjectName: string;
  classLabel: string;
  average: number;
  highest: number;
  lowest: number;
  passPercent: number;
  status: string;
  published: boolean;
}

export interface T_DashboardFilterOption {
  id: string;
  label: string;
}

export interface T_TeacherDashboardResponse {
  stats: T_DashboardStats;
  attendanceTrend: T_DashboardAttendancePoint[];
  classAttendance: T_DashboardClassAttendance[];
  resultDistribution: T_DashboardResultDistribution;
  passRateBySubject: T_DashboardPassRate;
  todaySchedule: T_DashboardScheduleItem[];
  lowAttendanceStudents: T_DashboardLowAttendanceStudent[];
  upcomingExamBatches: T_DashboardExamBatch[];
  recentResults: T_DashboardRecentResult[];
  /** Options for the class / exam-batch selectors. */
  filters: {
    assignments: T_DashboardFilterOption[];
    examBatches: T_DashboardFilterOption[];
  };
  /** Echo of the applied filters, so the UI can stay in sync. */
  applied: {
    assignmentId: string | null;
    examBatchId: string | null;
    range: T_DashboardRange;
    todayBs: string | null;
  };
}
