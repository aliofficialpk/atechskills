"use client";

import { useEffect, useState } from "react";
import { Award, Bell, BookOpenCheck, BriefcaseBusiness, CalendarDays, CheckCircle2, Clock, ExternalLink, FileText, PlayCircle, RefreshCcw, Send, ShieldCheck, UserPlus, XCircle } from "lucide-react";
import { Badge, ButtonLink, Card } from "@/components/ui";
import { categories as fallbackCategories, dashboardModules, portalCards, roleDashboards } from "@/lib/data";

const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:9000/api/v1";

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem("atechskills_access_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

type ApiState<T> = {
  data?: T;
  error?: string;
  loading: boolean;
};

function asArray<T = any>(value: unknown): T[] {
  return Array.isArray(value) ? value : [];
}

const fallbackCourseCategories = fallbackCategories.map((category) => ({ id: "", name: category.name, slug: category.slug }));

type StudentTab = "overview" | "courses" | "attendance" | "assignments" | "live" | "recordings" | "certificates" | "notifications";

function uniqueById(items: any[] = []) {
  return Array.from(new Map(items.filter(Boolean).map((item) => [item.id, item])).values());
}

function percent(value: number, total: number) {
  return total > 0 ? Math.round((value / total) * 100) : 0;
}

function formatDateTime(value?: string) {
  if (!value) return "Not scheduled";
  return new Date(value).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function studentDashboardMetrics(data: any) {
  const student = data?.student;
  const enrollments = asArray(student?.enrollments);
  const activeEnrollments = enrollments.filter((item: any) => item.status === "ACTIVE");
  const pendingEnrollments = enrollments.filter((item: any) => item.status === "PENDING");
  const courses = enrollments.map((item: any) => item.course).filter(Boolean);
  const sessions = uniqueById(courses.flatMap((course: any) => asArray(course.sessions)));
  const attendance = asArray(student?.attendance);
  const present = attendance.filter((item: any) => item.status === "PRESENT").length;
  const assignments = uniqueById(courses.flatMap((course: any) => asArray(course.assignments)));
  const recordings = uniqueById(courses.flatMap((course: any) => asArray(course.recordings).concat(asArray(course.sessions).map((session: any) => session.recording).filter(Boolean))));
  const certificates = asArray(student?.certificates);
  const sections = courses.flatMap((course: any) => asArray(course.sections));
  const lessons = sections.flatMap((section: any) => asArray(section.lessons));
  return {
    enrollments,
    activeEnrollments,
    pendingEnrollments,
    courses,
    sessions,
    attendance,
    present,
    assignments,
    recordings,
    certificates,
    notifications: asArray(data?.notifications),
    progress: lessons.length ? percent(certificates.length + present + activeEnrollments.length, lessons.length + sessions.length + enrollments.length) : activeEnrollments.length ? 10 : 0,
    attendancePercent: percent(present, sessions.length),
    assignmentText: assignments.length ? `0/${assignments.length}` : "0",
    certificateCount: certificates.length
  };
}

export function StudentPortalDashboard() {
  const [state, setState] = useState<ApiState<any>>({ loading: true });
  const [activeTab, setActiveTab] = useState<StudentTab>("overview");
  const [sessionId, setSessionId] = useState("");
  const [liveMessage, setLiveMessage] = useState("");

  async function load() {
    setState({ loading: true });
    try {
      const response = await fetch(`${apiBase}/lms/me`, { headers: authHeaders() });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to load dashboard");
      setState({ data, loading: false });
    } catch (error) {
      setState({ loading: false, error: error instanceof Error ? error.message : "Unable to load dashboard" });
    }
  }

  async function liveAction(action: "join" | "heartbeat" | "leave") {
    if (!sessionId) {
      setLiveMessage("Select a live session from your schedule first.");
      return;
    }
    try {
      const response = await fetch(`${apiBase}/lms/live-sessions/${sessionId}/${action}`, { method: "POST", headers: authHeaders() });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Live class action failed");
      if (action === "join" && data.meetingUrl) window.open(data.meetingUrl, "_blank", "noopener,noreferrer");
      setLiveMessage(action === "join" ? "Class joined. Keep this page open and use Update while attending." : data?.eligible ? "Attendance marked automatically." : "Progress updated. Attendance marks after half the class time.");
      load();
    } catch (error) {
      setLiveMessage(error instanceof Error ? error.message : "Live class action failed");
    }
  }

  useEffect(() => {
    load();
  }, []);

  const metrics = studentDashboardMetrics(state.data);
  const tabs: { id: StudentTab; label: string; icon: any; count?: number }[] = [
    { id: "overview", label: "Overview", icon: BookOpenCheck },
    { id: "courses", label: "Enrolled Courses", icon: BookOpenCheck, count: metrics.enrollments.length },
    { id: "attendance", label: "Attendance", icon: CheckCircle2, count: metrics.attendance.length },
    { id: "assignments", label: "Assignments", icon: FileText, count: metrics.assignments.length },
    { id: "live", label: "Live Schedule", icon: CalendarDays, count: metrics.sessions.length },
    { id: "recordings", label: "Recordings", icon: PlayCircle, count: metrics.recordings.length },
    { id: "certificates", label: "Certificates", icon: Award, count: metrics.certificates.length },
    { id: "notifications", label: "Notifications", icon: Bell, count: metrics.notifications.length }
  ];

  return (
    <section className="min-h-screen bg-slate-50">
      <div className="border-b border-slate-200 bg-white">
        <div className="container-page flex min-h-20 flex-col gap-4 py-4 md:flex-row md:items-center md:justify-between">
          <div><Badge>Portal</Badge><h1 className="mt-2 text-3xl font-black">Student Dashboard</h1><p className="mt-1 text-sm text-slate-500">{state.data?.name ? `Signed in as ${state.data.name}` : "Your live AtechSkills learning workspace"}</p></div>
          <div className="flex flex-wrap gap-3"><ButtonLink href="/courses" variant="secondary">Browse Courses</ButtonLink><ButtonLink href="/student-services" variant="secondary">Support</ButtonLink><ButtonLink href="/login">Switch Account</ButtonLink></div>
        </div>
      </div>
      <div className="container-page grid gap-6 py-8 lg:grid-cols-[280px_1fr]">
        <aside className="h-fit rounded-lg border border-slate-200 bg-white p-3 shadow-card">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`mb-1 flex w-full items-center justify-between gap-3 rounded-md px-3 py-3 text-left text-sm font-semibold transition ${activeTab === tab.id ? "bg-brand-green text-white" : "text-slate-700 hover:bg-brand-mint hover:text-brand-green"}`}>
                <span className="flex items-center gap-2"><Icon size={17} /> {tab.label}</span>
                {typeof tab.count === "number" && <span className={`rounded-full px-2 py-0.5 text-xs ${activeTab === tab.id ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"}`}>{tab.count}</span>}
              </button>
            );
          })}
        </aside>
        <div>
          {state.loading && <Card className="p-6 text-sm text-slate-500">Loading your real LMS data...</Card>}
          {state.error && <Card className="p-6 text-sm text-red-700">{state.error}</Card>}
          {!state.loading && !state.error && (
            <>
              <div className="grid gap-4 md:grid-cols-4">
                <Card className="p-5"><p className="text-sm text-slate-500">Course Progress</p><p className="mt-2 text-3xl font-black text-brand-green">{metrics.progress}%</p><p className="mt-1 text-xs text-slate-500">{metrics.activeEnrollments.length} active / {metrics.pendingEnrollments.length} pending</p></Card>
                <Card className="p-5"><p className="text-sm text-slate-500">Attendance</p><p className="mt-2 text-3xl font-black text-brand-green">{metrics.attendancePercent}%</p><p className="mt-1 text-xs text-slate-500">{metrics.present}/{metrics.sessions.length} scheduled sessions present</p></Card>
                <Card className="p-5"><p className="text-sm text-slate-500">Assignments</p><p className="mt-2 text-3xl font-black text-brand-green">{metrics.assignmentText}</p><p className="mt-1 text-xs text-slate-500">{metrics.assignments.length ? "Submissions will update after grading is enabled" : "No assignments assigned yet"}</p></Card>
                <Card className="p-5"><p className="text-sm text-slate-500">Certificates</p><p className="mt-2 text-3xl font-black text-brand-green">{metrics.certificateCount}</p><p className="mt-1 text-xs text-slate-500">{metrics.certificateCount ? "Issued certificates available" : "No certificates issued yet"}</p></Card>
              </div>

              {activeTab === "overview" && (
                <div className="mt-6 grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
                  <Card className="overflow-hidden">
                    <div className="border-b border-slate-200 p-5"><h2 className="text-xl font-bold">Learning Plan</h2><p className="mt-1 text-sm text-slate-500">Built from your actual enrollments, payment approvals, classes, recordings, and certificates.</p></div>
                    <div className="divide-y divide-slate-100">
                      {metrics.enrollments.length === 0 && <div className="p-5 text-sm text-slate-500">No learning plan yet. Enroll in a course and upload payment proof to start.</div>}
                      {metrics.enrollments.slice(0, 5).map((item: any) => (
                        <div key={item.id} className="grid gap-3 p-5 md:grid-cols-[1fr_auto] md:items-center">
                          <div><h3 className="font-bold">{item.course?.title ?? "Course"}</h3><p className="mt-1 text-sm text-slate-600">{item.course?.scheduleText ?? item.adminNote ?? "Schedule appears after admin creates live classes."}</p></div>
                          <Badge>{item.status} / {item.paymentStatus}</Badge>
                        </div>
                      ))}
                    </div>
                  </Card>
                  <Card className="p-5">
                    <h2 className="text-xl font-bold">Quick Actions</h2>
                    <div className="mt-4 grid gap-3">
                      <button onClick={() => setActiveTab("live")} className="inline-flex min-h-11 items-center justify-between rounded-md bg-brand-green px-5 py-3 text-sm font-semibold text-white">Join Live Class <PlayCircle size={16} /></button>
                      <button onClick={() => setActiveTab("recordings")} className="inline-flex min-h-11 items-center justify-between rounded-md border border-slate-200 bg-white px-5 py-3 text-sm font-semibold">Open Recordings <PlayCircle size={16} /></button>
                      <ButtonLink href="/student-services" variant="secondary" className="justify-between">Create Support Ticket <ExternalLink size={16} /></ButtonLink>
                    </div>
                  </Card>
                </div>
              )}

              {activeTab === "courses" && <StudentCoursesPanel enrollments={metrics.enrollments} reload={load} />}
              {activeTab === "attendance" && <StudentAttendancePanel attendance={metrics.attendance} sessions={metrics.sessions} />}
              {activeTab === "assignments" && <StudentAssignmentsPanel assignments={metrics.assignments} />}
              {activeTab === "live" && <StudentLivePanel sessions={metrics.sessions} sessionId={sessionId} setSessionId={setSessionId} liveAction={liveAction} message={liveMessage} />}
              {activeTab === "recordings" && <StudentRecordingsPanel recordings={metrics.recordings} />}
              {activeTab === "certificates" && <StudentCertificatesPanel certificates={metrics.certificates} />}
              {activeTab === "notifications" && <StudentNotificationsPanel notifications={metrics.notifications} />}
            </>
          )}
        </div>
      </div>
    </section>
  );
}

function StudentCoursesPanel({ enrollments, reload }: { enrollments: any[]; reload: () => void }) {
  return (
    <Card className="mt-6 p-6">
      <div className="flex items-center justify-between gap-3">
        <div><h2 className="text-xl font-bold">My Enrolled Courses</h2><p className="mt-1 text-sm text-slate-500">Only courses connected to your logged-in account appear here.</p></div>
        <button onClick={reload} className="rounded-md border border-slate-200 p-2 text-brand-green"><RefreshCcw size={18} /></button>
      </div>
      <div className="mt-5 grid gap-3">
        {enrollments.length === 0 && <p className="text-sm text-slate-500">No enrollments yet. Pick a course and upload payment proof to request access.</p>}
        {enrollments.map((item) => (
          <div key={item.id} className="rounded-md border border-slate-200 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="font-bold">{item.course?.title ?? "Course"}</h3><Badge>{item.status} / {item.paymentStatus}</Badge></div>
            <p className="mt-2 text-sm text-slate-600">{item.course?.summary ?? item.course?.scheduleText ?? "Course access will update after admin approval."}</p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500"><span>Requested: {formatDateTime(item.requestedAt)}</span>{item.enrolledAt && <span>Active: {formatDateTime(item.enrolledAt)}</span>}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function StudentAttendancePanel({ attendance, sessions }: { attendance: any[]; sessions: any[] }) {
  return (
    <Card className="mt-6 p-6">
      <h2 className="text-xl font-bold">Attendance</h2>
      <p className="mt-2 text-sm text-slate-600">Auto-marked after you stay for at least half of the scheduled class duration.</p>
      <div className="mt-5 grid gap-3">
        {attendance.length === 0 && <p className="text-sm text-slate-500">{sessions.length ? "No attendance has been marked yet." : "No scheduled sessions yet."}</p>}
        {attendance.map((item) => <div key={item.id} className="rounded-md border border-slate-200 p-4"><div className="flex justify-between gap-3"><h3 className="font-bold">{item.liveSession?.title ?? "Session"}</h3><Badge>{item.status}</Badge></div><p className="mt-1 text-sm text-slate-600">{formatDateTime(item.markedAt)}</p></div>)}
      </div>
    </Card>
  );
}

function StudentAssignmentsPanel({ assignments }: { assignments: any[] }) {
  return <Card className="mt-6 p-6"><h2 className="text-xl font-bold">Assignments</h2><div className="mt-5 grid gap-3">{assignments.length === 0 && <p className="text-sm text-slate-500">No assignments have been added to your enrolled courses yet.</p>}{assignments.map((item) => <div key={item.id} className="rounded-md border border-slate-200 p-4"><h3 className="font-bold">{item.title}</h3><p className="mt-1 text-sm text-slate-600">{item.description ?? "Assignment details will appear here."}</p><p className="mt-2 text-xs text-slate-500">Due: {formatDateTime(item.dueAt)}</p></div>)}</div></Card>;
}

function StudentLivePanel({ sessions, sessionId, setSessionId, liveAction, message }: { sessions: any[]; sessionId: string; setSessionId: (id: string) => void; liveAction: (action: "join" | "heartbeat" | "leave") => void; message: string }) {
  return (
    <Card className="mt-6 p-6">
      <h2 className="text-xl font-bold">Live Class Attendance</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">Select a session, join the lecture, update while attending, and leave when done.</p>
      <div className="mt-5 grid gap-3">
        {sessions.length === 0 && <p className="text-sm text-slate-500">No live classes have been scheduled for your active courses yet.</p>}
        {sessions.map((session) => <button key={session.id} onClick={() => setSessionId(session.id)} className={`rounded-md border p-4 text-left transition ${sessionId === session.id ? "border-brand-green bg-emerald-50" : "border-slate-200 bg-white hover:border-brand-green"}`}><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-bold">{session.title}</h3><Badge>{session.status}</Badge></div><p className="mt-1 text-sm text-slate-600">{formatDateTime(session.startsAt)} - {session.expectedDurationMinutes} minutes</p></button>)}
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <button onClick={() => liveAction("join")} className="inline-flex items-center justify-center gap-2 rounded-md bg-brand-green px-3 py-3 text-sm font-semibold text-white"><PlayCircle size={16} /> Join</button>
        <button onClick={() => liveAction("heartbeat")} className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-3 text-sm font-semibold"><Clock size={16} /> Update</button>
        <button onClick={() => liveAction("leave")} className="inline-flex items-center justify-center gap-2 rounded-md bg-brand-red px-3 py-3 text-sm font-semibold text-white"><CheckCircle2 size={16} /> Leave</button>
      </div>
      {message && <p className="mt-4 rounded-md bg-slate-50 p-3 text-sm text-slate-700">{message}</p>}
    </Card>
  );
}

function StudentRecordingsPanel({ recordings }: { recordings: any[] }) {
  return <Card className="mt-6 p-6"><h2 className="text-xl font-bold">Recordings</h2><div className="mt-5 grid gap-3">{recordings.length === 0 && <p className="text-sm text-slate-500">No recordings are attached to your courses yet.</p>}{recordings.map((item) => <a key={item.id} href={item.url} target="_blank" className="rounded-md border border-slate-200 p-4 transition hover:border-brand-green"><h3 className="font-bold">{item.title}</h3><p className="mt-1 text-sm text-slate-600">{item.storage ?? "recording"}{item.duration ? ` - ${item.duration} min` : ""}</p></a>)}</div></Card>;
}

function StudentCertificatesPanel({ certificates }: { certificates: any[] }) {
  return <Card className="mt-6 p-6"><h2 className="text-xl font-bold">Certificates</h2><div className="mt-5 grid gap-3">{certificates.length === 0 && <p className="text-sm text-slate-500">No certificates have been issued yet.</p>}{certificates.map((item) => <div key={item.id} className="rounded-md border border-slate-200 p-4"><h3 className="font-bold">{item.course?.title ?? "Certificate"}</h3><p className="mt-1 text-sm text-slate-600">Certificate ID: {item.certificateCode}</p>{item.pdfUrl && <a href={item.pdfUrl} target="_blank" className="mt-3 inline-flex rounded-md bg-brand-green px-3 py-2 text-sm font-semibold text-white">Download PDF</a>}</div>)}</div></Card>;
}

function StudentNotificationsPanel({ notifications }: { notifications: any[] }) {
  return <Card className="mt-6 p-6"><h2 className="text-xl font-bold">Notifications</h2><div className="mt-5 grid gap-3">{notifications.length === 0 && <p className="text-sm text-slate-500">No notifications yet. Enrollment updates and class reminders will appear here.</p>}{notifications.map((item) => <div key={item.id} className="rounded-md border border-slate-200 p-4"><h3 className="font-bold">{item.title}</h3><p className="mt-1 text-sm text-slate-600">{item.body}</p><p className="mt-2 text-xs text-slate-500">{formatDateTime(item.createdAt)}</p></div>)}</div></Card>;
}

export function StudentLearningCenter() {
  const [state, setState] = useState<ApiState<any>>({ loading: true });
  const [sessionId, setSessionId] = useState("");
  const [liveMessage, setLiveMessage] = useState("");

  async function load() {
    setState({ loading: true });
    try {
      const response = await fetch(`${apiBase}/lms/me`, { headers: authHeaders() });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to load dashboard");
      setState({ data, loading: false });
    } catch (error) {
      setState({ loading: false, error: error instanceof Error ? error.message : "Unable to load dashboard" });
    }
  }

  async function liveAction(action: "join" | "heartbeat" | "leave") {
    if (!sessionId) {
      setLiveMessage("Enter a live session ID from your course schedule.");
      return;
    }
    try {
      const response = await fetch(`${apiBase}/lms/live-sessions/${sessionId}/${action}`, { method: "POST", headers: authHeaders() });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Live class action failed");
      setLiveMessage(action === "join" ? "Class joined. Keep the tab active so progress can be tracked." : data.eligible ? "Attendance marked automatically." : "Progress updated. Attendance marks after half the class time.");
    } catch (error) {
      setLiveMessage(error instanceof Error ? error.message : "Live class action failed");
    }
  }

  useEffect(() => {
    load();
  }, []);

  const enrollments = asArray(state.data?.student?.enrollments);
  const notifications = asArray(state.data?.notifications);

  return (
    <div className="mt-6 grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
      <Card className="p-6">
        <div className="flex items-center justify-between gap-3">
          <div><h2 className="text-xl font-bold">My Enrolled Courses</h2><p className="mt-1 text-sm text-slate-500">Active, pending, and verified enrollments tied to your login email.</p></div>
          <button onClick={load} className="rounded-md border border-slate-200 p-2 text-brand-green"><RefreshCcw size={18} /></button>
        </div>
        <div className="mt-5 grid gap-3">
          {state.loading && <p className="text-sm text-slate-500">Loading your LMS account...</p>}
          {state.error && <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{state.error}</p>}
          {!state.loading && !state.error && enrollments.length === 0 && <p className="text-sm text-slate-500">No enrollments yet. Pick a course and upload payment proof to request access.</p>}
          {enrollments.map((item: any) => (
            <div key={item.id} className="rounded-md border border-slate-200 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="font-bold">{item.course.title}</h3>
                <Badge>{item.status} / {item.paymentStatus}</Badge>
              </div>
              <p className="mt-2 text-sm text-slate-600">{item.course.scheduleText ?? "Class schedule will appear after admin scheduling."}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {(item.course.sessions ?? []).map((session: any) => (
                  <button
                    key={session.id}
                    onClick={() => setSessionId(session.id)}
                    className="rounded-full bg-slate-100 px-3 py-1 text-left text-xs font-semibold text-slate-700 transition hover:bg-brand-mint hover:text-brand-green"
                    title={`Use session ID ${session.id}`}
                  >
                    {session.title} - {new Date(session.startsAt).toLocaleString()}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-bold">Live Class Attendance</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">Attendance is auto-marked after you stay in class for at least half of the scheduled duration. Join starts tracking, heartbeat updates progress, and leave finalizes your time.</p>
        <label className="mt-4 grid gap-2 text-sm font-medium text-slate-700">
          Live session ID
          <input value={sessionId} onChange={(event) => setSessionId(event.target.value)} className="rounded-md border border-slate-200 px-3 py-3 outline-none focus:border-brand-green" placeholder="Paste session ID from schedule" />
        </label>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <button onClick={() => liveAction("join")} className="inline-flex items-center justify-center gap-2 rounded-md bg-brand-green px-3 py-3 text-sm font-semibold text-white"><PlayCircle size={16} /> Join</button>
          <button onClick={() => liveAction("heartbeat")} className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-3 text-sm font-semibold"><Clock size={16} /> Update</button>
          <button onClick={() => liveAction("leave")} className="inline-flex items-center justify-center gap-2 rounded-md bg-brand-red px-3 py-3 text-sm font-semibold text-white"><CheckCircle2 size={16} /> Leave</button>
        </div>
        {liveMessage && <p className="mt-4 rounded-md bg-slate-50 p-3 text-sm text-slate-700">{liveMessage}</p>}
        <div className="mt-6 border-t border-slate-200 pt-5">
          <h3 className="font-bold">Notifications</h3>
          <div className="mt-3 grid gap-2">
            {notifications.slice(0, 4).map((item: any) => <p key={item.id} className="text-sm text-slate-600">{item.title}: {item.body}</p>)}
            {notifications.length === 0 && <p className="text-sm text-slate-500">Course reminders and enrollment updates will appear here.</p>}
          </div>
        </div>
      </Card>
    </div>
  );
}

type PortalRole = "admin" | "teacher" | "services";

const roleAccess: Record<PortalRole, string[]> = {
  admin: ["Super Admin", "Admin"],
  teacher: ["Teacher"],
  services: ["Student Services"]
};

const dashboardLabels: Record<PortalRole, string> = {
  admin: "Admin Dashboard",
  teacher: "Teacher Dashboard",
  services: "Student Services Dashboard"
};

function getStoredUser() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("atechskills_user");
    return raw ? JSON.parse(raw) as { name?: string; email?: string; roles?: string[] } : null;
  } catch {
    return null;
  }
}

function hasPortalAccess(role: PortalRole, user: { roles?: string[] } | null) {
  const roles = user?.roles ?? [];
  return roleAccess[role].some((allowedRole) => roles.includes(allowedRole));
}

function tabId(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function SecureRoleDashboard({ role }: { role: PortalRole }) {
  const tabs = role === "admin"
    ? ["Overview", "Courses", "Instructors", "Payments", "Live Classes", "Jobs", "Staff", "Performance"]
    : portalCards[role].slice(0, 8);
  const [activeTab, setActiveTab] = useState(tabs[0]);
  const [user, setUser] = useState<{ name?: string; email?: string; roles?: string[] } | null>(null);
  const [ready, setReady] = useState(false);
  const dashboard = roleDashboards[role];

  useEffect(() => {
    setUser(getStoredUser());
    const hash = decodeURIComponent(window.location.hash.replace("#", ""));
    const matchedTab = tabs.find((tab) => tabId(tab) === hash);
    if (matchedTab) setActiveTab(matchedTab);
    setReady(true);
  }, []);

  function selectTab(tab: string) {
    setActiveTab(tab);
    window.history.replaceState(null, "", `#${tabId(tab)}`);
  }

  if (!ready) {
    return <section className="min-h-screen bg-slate-50 p-8"><Card className="container-page p-6 text-sm text-slate-600">Checking portal access...</Card></section>;
  }

  if (!localStorage.getItem("atechskills_access_token")) {
    return (
      <section className="min-h-screen bg-slate-50 p-8">
        <Card className="container-page p-6">
          <h1 className="text-2xl font-black">Login required</h1>
          <p className="mt-2 text-sm text-slate-600">Please login with an authorized AtechSkills account to access this dashboard.</p>
          <ButtonLink href="/login" className="mt-5">Go to Login</ButtonLink>
        </Card>
      </section>
    );
  }

  if (!hasPortalAccess(role, user)) {
    return (
      <section className="min-h-screen bg-slate-50 p-8">
        <Card className="container-page p-6">
          <h1 className="text-2xl font-black">Access restricted</h1>
          <p className="mt-2 text-sm text-slate-600">This dashboard is only available to {roleAccess[role].join(" or ")} accounts.</p>
          <div className="mt-5 flex flex-wrap gap-3"><ButtonLink href="/student-dashboard" variant="secondary">Student Dashboard</ButtonLink><ButtonLink href="/login">Switch Account</ButtonLink></div>
        </Card>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-slate-50">
      <div className="border-b border-slate-200 bg-white">
        <div className="container-page flex min-h-20 flex-col gap-4 py-4 md:flex-row md:items-center md:justify-between">
          <div><Badge>Secure Portal</Badge><h1 className="mt-2 text-3xl font-black">{dashboardLabels[role]}</h1><p className="mt-1 text-sm text-slate-500">{user?.name ?? user?.email} - {user?.roles?.join(", ")}</p></div>
          <div className="flex flex-wrap gap-3"><ButtonLink href="/" variant="secondary">Website</ButtonLink><ButtonLink href="/login">Switch Account</ButtonLink></div>
        </div>
      </div>
      <div className="container-page grid gap-6 py-8 lg:grid-cols-[280px_1fr]">
        <aside className="h-fit rounded-lg border border-slate-200 bg-white p-3 shadow-card">
          <select value={activeTab} onChange={(event) => selectTab(event.target.value)} className="mb-3 w-full rounded-md border border-slate-200 px-3 py-3 text-sm font-semibold outline-none lg:hidden">
            {tabs.map((tab) => <option key={tab}>{tab}</option>)}
          </select>
          <div className="hidden lg:block">
            {tabs.map((tab) => (
              <button key={tab} onClick={() => selectTab(tab)} className={`mb-1 flex w-full items-center justify-between rounded-md px-3 py-3 text-left text-sm font-semibold transition ${activeTab === tab ? "bg-brand-green text-white" : "text-slate-700 hover:bg-brand-mint hover:text-brand-green"}`}>
                {tab}
              </button>
            ))}
          </div>
        </aside>
        <div>
          {role === "admin" ? <AdminTabbedPanel activeTab={activeTab} /> : <RoleTabbedPanel role={role} activeTab={activeTab} dashboard={dashboard} />}
        </div>
      </div>
    </section>
  );
}

function RoleTabbedPanel({ role, activeTab, dashboard }: { role: "teacher" | "services"; activeTab: string; dashboard: any }) {
  return (
    <div className="grid gap-6">
      <div className="grid gap-4 md:grid-cols-4">
        {dashboard.kpis.map((item: any) => <Card key={item.label} className="p-5"><p className="text-sm text-slate-500">{item.label}</p><p className="mt-2 text-3xl font-black text-brand-green">{item.value}</p><p className="mt-1 text-xs text-slate-500">{item.caption}</p></Card>)}
      </div>
      {role === "teacher" && <TeacherWorkspace activeTab={activeTab} />}
      {role === "services" && <ServicesWorkspace activeTab={activeTab} />}
    </div>
  );
}

function AdminTabbedPanel({ activeTab }: { activeTab: string }) {
  if (activeTab === "Courses") return <AdminCourseManager />;
  if (activeTab === "Instructors") return <AdminMentorManager />;
  if (activeTab === "Payments") return <AdminEnrollmentQueue />;
  if (activeTab === "Live Classes") return <AdminScheduleForm />;
  if (activeTab === "Jobs") return <AdminOpportunityManager />;
  if (activeTab === "Staff") return <AdminStaffForm />;
  if (activeTab === "Performance") return <AdminPerformancePanel />;
  return (
    <div className="grid gap-5">
      <div className="grid gap-4 md:grid-cols-4">
        {roleDashboards.admin.kpis.map((item) => <Card key={item.label} className="p-5"><p className="text-sm text-slate-500">{item.label}</p><p className="mt-2 text-3xl font-black text-brand-green">{item.value}</p><p className="mt-1 text-xs text-slate-500">{item.caption}</p></Card>)}
      </div>
      <Card className="p-6"><h2 className="text-xl font-bold">Admin Navigation</h2><p className="mt-2 text-sm text-slate-600">Use the left tabs to manage courses, instructors, payments, staff, jobs, live classes, and student performance. Each tab is a focused workspace.</p></Card>
    </div>
  );
}

function TeacherWorkspace({ activeTab }: { activeTab: string }) {
  const [state, setState] = useState<ApiState<any[]>>({ loading: true });
  useEffect(() => {
    fetch(`${apiBase}/lms/teacher/courses`, { headers: authHeaders() })
      .then((response) => response.json().then((data) => ({ ok: response.ok, data })))
      .then(({ ok, data }) => {
        if (!ok) throw new Error(data.error ?? "Unable to load assigned courses");
        setState({ loading: false, data });
      })
      .catch((error) => setState({ loading: false, error: error instanceof Error ? error.message : "Unable to load assigned courses" }));
  }, []);
  const courses = asArray(state.data);
  return (
    <Card className="p-6">
      <h2 className="text-xl font-bold">{activeTab}</h2>
      {state.loading && <p className="mt-4 text-sm text-slate-500">Loading assigned teaching workspace...</p>}
      {state.error && <p className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{state.error}</p>}
      {!state.loading && !state.error && courses.length === 0 && <p className="mt-4 text-sm text-slate-500">No courses assigned yet. Admin can assign courses from the admin dashboard.</p>}
      <div className="mt-5 grid gap-3">
        {courses.map((course) => <div key={course.id} className="rounded-md border border-slate-200 p-4"><h3 className="font-bold">{course.title}</h3><p className="mt-1 text-sm text-slate-600">{course.enrollments?.length ?? 0} students - {course.sessions?.length ?? 0} live sessions - {course.assignments?.length ?? 0} assignments</p></div>)}
      </div>
    </Card>
  );
}

function ServicesWorkspace({ activeTab }: { activeTab: string }) {
  return <Card className="p-6"><h2 className="text-xl font-bold">{activeTab}</h2><p className="mt-2 text-sm text-slate-600">Student Services tools are restricted to support staff accounts. Ticket inbox, student lookup, payment support, and conversation history can be expanded here without exposing admin controls.</p><ButtonLink href="/student-services" className="mt-5">Open Support Form</ButtonLink></Card>;
}

export function AdminControlCenter() {
  return (
    <div className="mt-6 grid gap-5 xl:grid-cols-2">
      <AdminCourseManager />
      <AdminCategoryManager onSaved={() => window.dispatchEvent(new Event("atechskills:categories-updated"))} />
      <AdminMentorManager />
      <AdminStaffForm />
      <AdminOpportunityManager />
      <AdminScheduleForm />
      <AdminEnrollmentQueue />
      <AdminPerformancePanel />
    </div>
  );
}

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function lines(value: FormDataEntryValue | null) {
  return String(value ?? "").split("\n").map((item) => item.trim()).filter(Boolean);
}

function AdminCourseManager() {
  const [courses, setCourses] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const [courseResponse, teacherResponse, categoryResponse] = await Promise.all([
        fetch(`${apiBase}/admin-courses`, { headers: authHeaders() }),
        fetch(`${apiBase}/admin-teachers`, { headers: authHeaders() }),
        fetch(`${apiBase}/admin-categories`, { headers: authHeaders() })
      ]);
      const courseData = await courseResponse.json();
      const teacherData = await teacherResponse.json();
      const categoryData = await categoryResponse.json();
      if (!courseResponse.ok) throw new Error(courseData.error ?? "Unable to load courses");
      if (!teacherResponse.ok) throw new Error(teacherData.error ?? "Unable to load teachers");
      if (!categoryResponse.ok) throw new Error(categoryData.error ?? "Unable to load categories");
      setCourses(Array.isArray(courseData) ? courseData : []);
      setTeachers(Array.isArray(teacherData) ? teacherData : []);
      setCategories(Array.isArray(categoryData) && categoryData.length > 0 ? categoryData : fallbackCourseCategories);
    } catch (error) {
      setCategories(fallbackCourseCategories);
      setMessage(error instanceof Error ? error.message : "Unable to load course manager");
    } finally {
      setLoading(false);
    }
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const raw = new FormData(form);
    const title = String(raw.get("title") ?? "");
    const moduleTitles = lines(raw.get("sections"));
    const lessonTitles = lines(raw.get("lessons"));
    const sections = moduleTitles.length > 0
      ? moduleTitles.map((sectionTitle, index) => ({
          title: sectionTitle,
          lessons: (lessonTitles[index] ? [lessonTitles[index]] : lessonTitles.length === 0 ? [] : []).map((lessonTitle) => ({ title: lessonTitle }))
        }))
      : [];
    const payload = new FormData();
    payload.set("title", title);
    payload.set("slug", slugify(String(raw.get("slug") || title)));
    payload.set("summary", String(raw.get("summary") ?? ""));
    payload.set("description", String(raw.get("description") ?? ""));
    payload.set("price", String(raw.get("price") || 0));
    if (raw.get("discountPrice")) payload.set("discountPrice", String(raw.get("discountPrice")));
    payload.set("level", String(raw.get("level") || "Beginner"));
    payload.set("duration", String(raw.get("duration") || "8 weeks"));
    payload.set("isFree", raw.get("isFree") === "on" ? "true" : "false");
    if (raw.get("classStartAt")) payload.set("classStartAt", new Date(String(raw.get("classStartAt"))).toISOString());
    payload.set("scheduleText", String(raw.get("scheduleText") ?? ""));
    if (raw.get("seatCapacity")) payload.set("seatCapacity", String(raw.get("seatCapacity")));
    payload.set("prerequisites", JSON.stringify(lines(raw.get("prerequisites"))));
    payload.set("outcomes", JSON.stringify(lines(raw.get("outcomes"))));
    payload.set("status", raw.get("status") === "PUBLISHED" ? "PUBLISHED" : "DRAFT");
    payload.set("categoryId", String(raw.get("categoryId") ?? ""));
    payload.set("instructorId", String(raw.get("instructorId") ?? ""));
    payload.set("sections", JSON.stringify(sections));
    const thumbnail = raw.get("thumbnail");
    if (thumbnail instanceof File && thumbnail.size > 0) payload.set("thumbnail", thumbnail);
    try {
      const response = await fetch(`${apiBase}/admin-courses`, {
        method: "POST",
        headers: authHeaders(),
        body: payload
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to create course");
      setMessage(`Created course: ${data.title}`);
      form.reset();
      load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to create course");
    }
  }

  async function publish(id: string) {
    try {
      const response = await fetch(`${apiBase}/admin-courses`, { method: "POST", headers: { "Content-Type": "application/json", ...authHeaders() }, body: JSON.stringify({ action: "PUBLISH", courseId: id }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to publish course");
      setMessage(`Published: ${data.title}`);
      load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to publish course");
    }
  }

  async function archive(id: string) {
    try {
      const response = await fetch(`${apiBase}/admin-courses`, { method: "POST", headers: { "Content-Type": "application/json", ...authHeaders() }, body: JSON.stringify({ action: "ARCHIVE", courseId: id }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to archive course");
      setMessage(`Archived: ${data.title}`);
      load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to archive course");
    }
  }

  async function assignTeacher(courseId: string, teacherId: string) {
    if (!teacherId) return;
    try {
      const response = await fetch(`${apiBase}/admin-courses`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ action: "ASSIGN_TEACHER", courseId, teacherId })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to assign teacher");
      setMessage(`Assigned teacher to ${data.title}`);
      load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to assign teacher");
    }
  }

  useEffect(() => {
    load();
    const reload = () => load();
    window.addEventListener("atechskills:categories-updated", reload);
    return () => window.removeEventListener("atechskills:categories-updated", reload);
  }, []);

  return (
    <Card className="p-6 xl:col-span-2">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold"><BookOpenCheck className="text-brand-green" /> Course Management</h2>
          <p className="mt-1 text-sm text-slate-600">Create course details, publish courses, and assign teachers. Public course pages only show published database courses.</p>
        </div>
        <button onClick={load} className="rounded-md border border-slate-200 p-2 text-brand-green"><RefreshCcw size={18} /></button>
      </div>
      <form onSubmit={submit} className="mt-5 grid gap-3">
        <div className="grid gap-3 md:grid-cols-2">
          <input required name="title" placeholder="Course title" className="rounded-md border border-slate-200 px-3 py-3 outline-none focus:border-brand-green" />
          <input name="slug" placeholder="Optional URL slug" className="rounded-md border border-slate-200 px-3 py-3 outline-none focus:border-brand-green" />
        </div>
        <textarea required name="summary" rows={2} placeholder="Short course summary" className="rounded-md border border-slate-200 px-3 py-3 outline-none focus:border-brand-green" />
        <textarea name="description" rows={3} placeholder="Full course description" className="rounded-md border border-slate-200 px-3 py-3 outline-none focus:border-brand-green" />
        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Course thumbnail
          <input name="thumbnail" type="file" accept="image/png,image/jpeg,image/webp" className="rounded-md border border-slate-200 px-3 py-3 outline-none focus:border-brand-green" />
        </label>
        <div className="grid gap-3 md:grid-cols-4">
          <input required name="price" type="number" min="0" step="0.01" placeholder="Price" className="rounded-md border border-slate-200 px-3 py-3 outline-none focus:border-brand-green" />
          <input name="discountPrice" type="number" min="0" step="0.01" placeholder="Discount price" className="rounded-md border border-slate-200 px-3 py-3 outline-none focus:border-brand-green" />
          <input name="level" placeholder="Beginner / Advanced" defaultValue="Beginner" className="rounded-md border border-slate-200 px-3 py-3 outline-none focus:border-brand-green" />
          <input name="duration" placeholder="8 weeks" defaultValue="8 weeks" className="rounded-md border border-slate-200 px-3 py-3 outline-none focus:border-brand-green" />
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <input name="classStartAt" type="datetime-local" className="rounded-md border border-slate-200 px-3 py-3 outline-none focus:border-brand-green" />
          <input name="seatCapacity" type="number" min="1" placeholder="Seat capacity" className="rounded-md border border-slate-200 px-3 py-3 outline-none focus:border-brand-green" />
          <select name="instructorId" className="rounded-md border border-slate-200 px-3 py-3 outline-none focus:border-brand-green">
            <option value="">Assign teacher later</option>
            {asArray(teachers).map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.user?.name ?? "Teacher"} - {teacher.user?.email ?? "No email"}</option>)}
          </select>
        </div>
        <div className="grid gap-3 md:grid-cols-[1fr_auto]">
          <select name="categoryId" className="rounded-md border border-slate-200 px-3 py-3 outline-none focus:border-brand-green">
            <option value="">Select category</option>
            {asArray(categories).map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
          <ButtonLink href="#course-categories" variant="secondary">Manage Categories</ButtonLink>
        </div>
        <textarea name="scheduleText" rows={2} placeholder="Schedule text, e.g. Saturdays 8 PM PKT" className="rounded-md border border-slate-200 px-3 py-3 outline-none focus:border-brand-green" />
        <div className="grid gap-3 md:grid-cols-2">
          <textarea name="prerequisites" rows={4} placeholder="Prerequisites, one per line" className="rounded-md border border-slate-200 px-3 py-3 outline-none focus:border-brand-green" />
          <textarea name="outcomes" rows={4} placeholder="Learning outcomes, one per line" className="rounded-md border border-slate-200 px-3 py-3 outline-none focus:border-brand-green" />
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <textarea name="sections" rows={4} placeholder="Module/section titles, one per line" className="rounded-md border border-slate-200 px-3 py-3 outline-none focus:border-brand-green" />
          <textarea name="lessons" rows={4} placeholder="Optional lesson title for each module, one per line" className="rounded-md border border-slate-200 px-3 py-3 outline-none focus:border-brand-green" />
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-slate-700"><input name="isFree" type="checkbox" /> Free course/workshop</label>
          <select name="status" className="rounded-md border border-slate-200 px-3 py-3 outline-none focus:border-brand-green">
            <option value="DRAFT">Save as draft</option>
            <option value="PUBLISHED">Publish immediately</option>
          </select>
          <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-brand-green px-5 py-3 text-sm font-semibold text-white"><Send size={16} /> Save Course</button>
        </div>
      </form>
      {message && <p className="mt-4 rounded-md bg-slate-50 p-3 text-sm text-slate-700">{message}</p>}
      <div className="mt-6 grid gap-3">
        {loading && <p className="text-sm text-slate-500">Loading courses...</p>}
        {!loading && asArray(courses).length === 0 && <p className="text-sm text-slate-500">No courses created yet. Add the first course above.</p>}
        {asArray(courses).map((course) => (
          <div key={course.id} className="rounded-md border border-slate-200 p-4">
            <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <h3 className="font-bold">{course.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{course.status} - {course.level} - Teacher: {course.instructor?.user?.name ?? "Not assigned"}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <select onChange={(event) => assignTeacher(course.id, event.target.value)} defaultValue="" className="rounded-md border border-slate-200 px-3 py-2 text-sm">
                  <option value="">Assign teacher</option>
                  {asArray(teachers).map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.user?.name ?? "Teacher"}</option>)}
                </select>
                {course.status !== "PUBLISHED" && <button onClick={() => publish(course.id)} className="rounded-md bg-brand-green px-3 py-2 text-xs font-bold text-white">Publish</button>}
                <button onClick={() => archive(course.id)} className="rounded-md bg-brand-red px-3 py-2 text-xs font-bold text-white">Archive</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function AdminCategoryManager({ onSaved }: { onSaved: () => void }) {
  const [message, setMessage] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const raw = Object.fromEntries(new FormData(form).entries());
    try {
      const response = await fetch(`${apiBase}/admin-categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ name: raw.name, slug: raw.slug || undefined })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to save category");
      setMessage(`Saved category: ${data.name}`);
      form.reset();
      onSaved();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save category");
    }
  }

  return (
    <div id="course-categories">
      <Card className="p-6">
        <h2 className="text-xl font-bold">Course Categories</h2>
        <form onSubmit={submit} className="mt-5 grid gap-3">
          <input required name="name" placeholder="Category name, e.g. Cybersecurity" className="rounded-md border border-slate-200 px-3 py-3 outline-none focus:border-brand-green" />
          <input name="slug" placeholder="Optional slug" className="rounded-md border border-slate-200 px-3 py-3 outline-none focus:border-brand-green" />
          <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-brand-green px-5 py-3 text-sm font-semibold text-white"><Send size={16} /> Save Category</button>
        </form>
        {message && <p className="mt-3 rounded-md bg-slate-50 p-3 text-sm text-slate-700">{message}</p>}
      </Card>
    </div>
  );
}

function AdminMentorManager() {
  const [message, setMessage] = useState("");
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const response = await fetch(`${apiBase}/admin-teachers`, { headers: authHeaders() });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to load instructors");
      setTeachers(asArray(data).filter((teacher) => teacher.user?.isActive !== false));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to load instructors");
    } finally {
      setLoading(false);
    }
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const payload = Object.fromEntries(new FormData(form).entries());
    try {
      const response = await fetch(`${apiBase}/admin-teachers`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to create mentor");
      setMessage(`Created instructor profile for ${data.name ?? data.email}`);
      form.reset();
      load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to create mentor");
    }
  }

  async function deactivate(id: string) {
    if (!confirm("Deactivate this instructor account and unassign it from courses?")) return;
    try {
      const response = await fetch(`${apiBase}/admin-teachers/${id}`, { method: "DELETE", headers: authHeaders() });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to deactivate instructor");
      setMessage(`Deactivated instructor: ${data.email}`);
      load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to deactivate instructor");
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
      <Card className="p-6">
        <h2 className="flex items-center gap-2 text-xl font-bold"><UserPlus className="text-brand-green" /> Add Instructor</h2>
        <p className="mt-2 text-sm text-slate-600">Create instructor credentials, then assign the instructor from the course form.</p>
        <form onSubmit={submit} className="mt-5 grid gap-3">
          <input required name="name" placeholder="Instructor name" className="rounded-md border border-slate-200 px-3 py-3 outline-none focus:border-brand-green" />
          <input required name="email" type="email" placeholder="Instructor email" className="rounded-md border border-slate-200 px-3 py-3 outline-none focus:border-brand-green" />
          <input required name="password" type="password" minLength={8} placeholder="Temporary password" className="rounded-md border border-slate-200 px-3 py-3 outline-none focus:border-brand-green" />
          <input name="title" placeholder="Designation, e.g. Senior Security Mentor" className="rounded-md border border-slate-200 px-3 py-3 outline-none focus:border-brand-green" />
          <textarea name="bio" rows={3} placeholder="Instructor bio" className="rounded-md border border-slate-200 px-3 py-3 outline-none focus:border-brand-green" />
          <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-brand-green px-5 py-3 text-sm font-semibold text-white"><Send size={16} /> Save Instructor</button>
        </form>
        {message && <p className="mt-3 rounded-md bg-slate-50 p-3 text-sm text-slate-700">{message}</p>}
      </Card>
      <Card className="p-6">
        <div className="flex items-center justify-between gap-3"><h2 className="text-xl font-bold">Current Instructors</h2><button onClick={load} className="rounded-md border border-slate-200 p-2 text-brand-green"><RefreshCcw size={18} /></button></div>
        <div className="mt-5 grid gap-3">
          {loading && <p className="text-sm text-slate-500">Loading instructors...</p>}
          {!loading && teachers.length === 0 && <p className="text-sm text-slate-500">No instructors yet.</p>}
          {teachers.map((teacher) => (
            <div key={teacher.id} className="rounded-md border border-slate-200 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div><h3 className="font-bold">{teacher.user?.name ?? "Instructor"}</h3><p className="text-sm text-slate-600">{teacher.user?.email} - {teacher.title ?? "No title"}</p><p className="text-xs text-slate-500">{teacher.courses?.length ?? 0} assigned courses</p></div>
                <button onClick={() => deactivate(teacher.id)} className="rounded-md bg-brand-red px-3 py-2 text-xs font-bold text-white">Deactivate</button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function AdminOpportunityManager() {
  const [state, setState] = useState<ApiState<any[]>>({ loading: true });
  const [message, setMessage] = useState("");

  async function load() {
    setState({ loading: true });
    try {
      const response = await fetch(`${apiBase}/admin/opportunities`, { headers: authHeaders() });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to load opportunities");
      setState({ loading: false, data });
    } catch (error) {
      setState({ loading: false, error: error instanceof Error ? error.message : "Unable to load opportunities" });
    }
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const raw = Object.fromEntries(new FormData(form).entries());
    const payload = {
      title: String(raw.title),
      slug: String(raw.slug || raw.title).toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
      type: String(raw.type),
      company: String(raw.company),
      location: String(raw.location),
      workMode: raw.workMode ? String(raw.workMode) : undefined,
      employmentType: raw.employmentType ? String(raw.employmentType) : undefined,
      summary: String(raw.summary),
      description: String(raw.description),
      requirements: String(raw.requirements || "").split("\n").map((item) => item.trim()).filter(Boolean),
      benefits: String(raw.benefits || "").split("\n").map((item) => item.trim()).filter(Boolean),
      applyUrl: String(raw.applyUrl),
      applyEmail: raw.applyEmail ? String(raw.applyEmail) : undefined,
      deadline: raw.deadline ? new Date(String(raw.deadline)).toISOString() : undefined,
      visibility: raw.visibility === "PUBLISHED" ? "PUBLISHED" : "DRAFT",
      isFeatured: raw.isFeatured === "on"
    };
    try {
      const response = await fetch(`${apiBase}/admin/opportunities`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to publish opportunity");
      setMessage(`Saved opportunity: ${data.title}`);
      form.reset();
      load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to publish opportunity");
    }
  }

  async function publish(id: string) {
    try {
      const response = await fetch(`${apiBase}/admin/opportunities/${id}/publish`, { method: "PATCH", headers: authHeaders() });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to publish opportunity");
      setMessage(`Published: ${data.title}`);
      load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to publish opportunity");
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-xl font-bold"><BriefcaseBusiness className="text-brand-green" /> Jobs and Internships</h2>
        <button onClick={load} className="rounded-md border border-slate-200 p-2 text-brand-green"><RefreshCcw size={18} /></button>
      </div>
      <form onSubmit={submit} className="mt-5 grid gap-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <input required name="title" placeholder="Opportunity title" className="rounded-md border border-slate-200 px-3 py-3 outline-none focus:border-brand-green" />
          <select name="type" className="rounded-md border border-slate-200 px-3 py-3 outline-none focus:border-brand-green">
            <option value="JOB">Job</option>
            <option value="INTERNSHIP">Internship</option>
            <option value="APPRENTICESHIP">Apprenticeship</option>
            <option value="FELLOWSHIP">Fellowship</option>
          </select>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <input required name="company" placeholder="Company" className="rounded-md border border-slate-200 px-3 py-3 outline-none focus:border-brand-green" />
          <input required name="location" placeholder="Location" className="rounded-md border border-slate-200 px-3 py-3 outline-none focus:border-brand-green" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <input name="workMode" placeholder="Remote / Hybrid / On-site" className="rounded-md border border-slate-200 px-3 py-3 outline-none focus:border-brand-green" />
          <input name="employmentType" placeholder="Full-time / Internship" className="rounded-md border border-slate-200 px-3 py-3 outline-none focus:border-brand-green" />
        </div>
        <input name="slug" placeholder="Optional slug" className="rounded-md border border-slate-200 px-3 py-3 outline-none focus:border-brand-green" />
        <textarea required name="summary" placeholder="Short summary" rows={2} className="rounded-md border border-slate-200 px-3 py-3 outline-none focus:border-brand-green" />
        <textarea required name="description" placeholder="Full description" rows={3} className="rounded-md border border-slate-200 px-3 py-3 outline-none focus:border-brand-green" />
        <div className="grid gap-3 sm:grid-cols-2">
          <textarea name="requirements" placeholder="Requirements, one per line" rows={3} className="rounded-md border border-slate-200 px-3 py-3 outline-none focus:border-brand-green" />
          <textarea name="benefits" placeholder="Benefits, one per line" rows={3} className="rounded-md border border-slate-200 px-3 py-3 outline-none focus:border-brand-green" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <input required name="applyUrl" type="url" placeholder="Apply link" className="rounded-md border border-slate-200 px-3 py-3 outline-none focus:border-brand-green" />
          <input name="applyEmail" type="email" placeholder="Apply email optional" className="rounded-md border border-slate-200 px-3 py-3 outline-none focus:border-brand-green" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <input name="deadline" type="datetime-local" className="rounded-md border border-slate-200 px-3 py-3 outline-none focus:border-brand-green" />
          <select name="visibility" className="rounded-md border border-slate-200 px-3 py-3 outline-none focus:border-brand-green">
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-700"><input name="isFeatured" type="checkbox" /> Featured opportunity</label>
        <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-brand-green px-5 py-3 text-sm font-semibold text-white"><Send size={16} /> Save Opportunity</button>
      </form>
      {message && <p className="mt-3 rounded-md bg-slate-50 p-3 text-sm text-slate-700">{message}</p>}
      <div className="mt-5 grid gap-3">
        {state.loading && <p className="text-sm text-slate-500">Loading opportunities...</p>}
        {state.error && <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{state.error}</p>}
        {asArray(state.data).slice(0, 4).map((item) => (
          <div key={item.id} className="rounded-md border border-slate-200 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div><h3 className="font-bold">{item.title}</h3><p className="text-sm text-slate-600">{item.company} - {item.type} - {item.visibility}</p></div>
              <div className="flex gap-2">
                <a href={item.applyUrl} target="_blank" className="rounded-md border border-slate-200 p-2 text-brand-green" title="Open apply link"><ExternalLink size={16} /></a>
                {item.visibility !== "PUBLISHED" && <button onClick={() => publish(item.id)} className="rounded-md bg-brand-green px-3 py-2 text-xs font-bold text-white">Publish</button>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function AdminStaffForm() {
  const [message, setMessage] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const payload = Object.fromEntries(new FormData(form).entries());
    try {
      const response = await fetch(`${apiBase}/admin/staff`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to create staff");
      setMessage(`Created staff account for ${data.email}`);
      form.reset();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to create staff");
    }
  }

  return (
    <Card className="p-6">
      <h2 className="flex items-center gap-2 text-xl font-bold"><UserPlus className="text-brand-green" /> Register Staff</h2>
      <form onSubmit={submit} className="mt-5 grid gap-3">
        <input required name="name" placeholder="Full name" className="rounded-md border border-slate-200 px-3 py-3 outline-none focus:border-brand-green" />
        <input required name="email" type="email" placeholder="Email" className="rounded-md border border-slate-200 px-3 py-3 outline-none focus:border-brand-green" />
        <input required name="password" type="password" minLength={8} placeholder="Temporary password" className="rounded-md border border-slate-200 px-3 py-3 outline-none focus:border-brand-green" />
        <select name="role" className="rounded-md border border-slate-200 px-3 py-3 outline-none focus:border-brand-green">
          <option>Teacher</option>
          <option>Student Services</option>
          <option>Content Manager</option>
          <option>Event Manager</option>
          <option>Admin</option>
        </select>
        <input name="title" placeholder="Teacher title / designation" className="rounded-md border border-slate-200 px-3 py-3 outline-none focus:border-brand-green" />
        <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-brand-green px-5 py-3 text-sm font-semibold text-white"><Send size={16} /> Create Staff</button>
      </form>
      {message && <p className="mt-3 rounded-md bg-slate-50 p-3 text-sm text-slate-700">{message}</p>}
    </Card>
  );
}

function AdminScheduleForm() {
  const [courses, setCourses] = useState<any[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch(`${apiBase}/admin-courses`, { headers: authHeaders() }).then((response) => response.json()).then((data) => setCourses(asArray(data))).catch(() => setCourses([]));
  }, []);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const raw = Object.fromEntries(new FormData(form).entries());
    const payload = {
      courseId: String(raw.courseId),
      titlePrefix: String(raw.titlePrefix),
      firstStartsAt: new Date(String(raw.firstStartsAt)).toISOString(),
      totalSessions: Number(raw.totalSessions),
      repeatEveryDays: Number(raw.repeatEveryDays),
      expectedDurationMinutes: Number(raw.expectedDurationMinutes),
      attendanceThresholdPercent: Number(raw.attendanceThresholdPercent),
      meetingUrl: raw.meetingUrl ? String(raw.meetingUrl) : undefined,
      provider: String(raw.provider || "manual"),
      freeAccess: raw.freeAccess === "on"
    };
    try {
      const response = await fetch(`${apiBase}/lms/live-sessions/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to schedule class");
      setMessage(`Generated ${data.sessions.length} class${data.sessions.length === 1 ? "" : "es"}. First session ID: ${data.sessions[0]?.id ?? "created"}`);
      form.reset();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to schedule class");
    }
  }

  return (
    <Card className="p-6">
      <h2 className="flex items-center gap-2 text-xl font-bold"><Clock className="text-brand-green" /> Generate Live Classes</h2>
      <form onSubmit={submit} className="mt-5 grid gap-3">
        <select required name="courseId" className="rounded-md border border-slate-200 px-3 py-3 outline-none focus:border-brand-green">
          <option value="">Select course</option>
          {asArray(courses).map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}
        </select>
        <input required name="titlePrefix" placeholder="Title prefix, e.g. DevSecAI Live Class" className="rounded-md border border-slate-200 px-3 py-3 outline-none focus:border-brand-green" />
        <input required name="firstStartsAt" type="datetime-local" className="rounded-md border border-slate-200 px-3 py-3 outline-none focus:border-brand-green" />
        <input name="meetingUrl" type="url" placeholder="Google Meet / live link" className="rounded-md border border-slate-200 px-3 py-3 outline-none focus:border-brand-green" />
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1 text-xs font-semibold text-slate-600">Total classes<input required name="totalSessions" type="number" min="1" max="100" defaultValue={8} className="rounded-md border border-slate-200 px-3 py-3 text-sm outline-none focus:border-brand-green" /></label>
          <label className="grid gap-1 text-xs font-semibold text-slate-600">Repeat every days<input required name="repeatEveryDays" type="number" min="1" max="31" defaultValue={7} className="rounded-md border border-slate-200 px-3 py-3 text-sm outline-none focus:border-brand-green" /></label>
          <label className="grid gap-1 text-xs font-semibold text-slate-600">Duration minutes<input required name="expectedDurationMinutes" type="number" min="15" defaultValue={60} className="rounded-md border border-slate-200 px-3 py-3 text-sm outline-none focus:border-brand-green" /></label>
          <label className="grid gap-1 text-xs font-semibold text-slate-600">Attendance threshold %<input required name="attendanceThresholdPercent" type="number" min="1" max="100" defaultValue={50} className="rounded-md border border-slate-200 px-3 py-3 text-sm outline-none focus:border-brand-green" /></label>
        </div>
        <input name="provider" defaultValue="manual" placeholder="Provider: manual, google-meet, zoom, custom" className="rounded-md border border-slate-200 px-3 py-3 outline-none focus:border-brand-green" />
        <label className="flex items-center gap-2 text-sm text-slate-700"><input name="freeAccess" type="checkbox" /> Free lecture / workshop</label>
        <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-brand-green px-5 py-3 text-sm font-semibold text-white"><Send size={16} /> Generate Schedule</button>
      </form>
      {message && <p className="mt-3 rounded-md bg-slate-50 p-3 text-sm text-slate-700">{message}</p>}
    </Card>
  );
}

function AdminEnrollmentQueue() {
  const [state, setState] = useState<ApiState<any[]>>({ loading: true });

  async function load() {
    setState({ loading: true });
    try {
      const response = await fetch(`${apiBase}/admin-enrollments`, { headers: authHeaders() });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to load requests");
      setState({ loading: false, data });
    } catch (error) {
      setState({ loading: false, error: error instanceof Error ? error.message : "Unable to load requests" });
    }
  }

  async function review(id: string, action: "verify" | "reject") {
    try {
      const response = await fetch(`${apiBase}/admin-enrollments`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ enrollmentId: id, action: action === "verify" ? "APPROVE" : "REJECT", adminNote: action === "verify" ? "Payment approved." : "Please upload a clearer proof." })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to review enrollment");
      load();
    } catch (error) {
      setState((current) => ({ ...current, loading: false, error: error instanceof Error ? error.message : "Unable to review enrollment" }));
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-xl font-bold"><ShieldCheck className="text-brand-green" /> Enrollment Requests</h2>
        <button onClick={load} className="rounded-md border border-slate-200 p-2 text-brand-green"><RefreshCcw size={18} /></button>
      </div>
      <div className="mt-5 grid gap-3">
        {state.loading && <p className="text-sm text-slate-500">Loading requests...</p>}
        {state.error && <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{state.error}</p>}
        {asArray(state.data).map((item) => (
          <div key={item.id} className="rounded-md border border-slate-200 p-4">
            <h3 className="font-bold">{item.student.user.name}</h3>
            <p className="mt-1 text-sm text-slate-600">{item.student.user.email} - {item.course.title}</p>
            <p className="mt-1 text-sm text-slate-600">Payment: {item.paymentStatus} / Amount: {item.paidAmount ?? "not provided"}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {item.paymentProofUrl && <a className="rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-brand-green" href={item.paymentProofUrl} target="_blank">View Proof</a>}
              <button onClick={() => review(item.id, "verify")} className="inline-flex items-center gap-1 rounded-md bg-brand-green px-3 py-2 text-sm font-semibold text-white"><CheckCircle2 size={15} /> Approve Payment</button>
              <button onClick={() => review(item.id, "reject")} className="inline-flex items-center gap-1 rounded-md bg-brand-red px-3 py-2 text-sm font-semibold text-white"><XCircle size={15} /> Reject</button>
            </div>
          </div>
        ))}
        {!state.loading && !state.error && asArray(state.data).length === 0 && <p className="text-sm text-slate-500">No pending enrollment requests.</p>}
      </div>
    </Card>
  );
}

function AdminPerformancePanel() {
  const [state, setState] = useState<ApiState<any[]>>({ loading: true });

  useEffect(() => {
    fetch(`${apiBase}/lms/admin/student-performance`, { headers: authHeaders() })
      .then((response) => response.json().then((data) => ({ ok: response.ok, data })))
      .then(({ ok, data }) => {
        if (!ok) throw new Error(data.error ?? "Unable to load performance");
        setState({ loading: false, data });
      })
      .catch((error) => setState({ loading: false, error: error instanceof Error ? error.message : "Unable to load performance" }));
  }, []);

  return (
    <Card className="p-6">
      <h2 className="text-xl font-bold">Student Performance</h2>
      <p className="mt-2 text-sm text-slate-600">Admin visibility into each learner’s course access, attendance, quiz average, certificate count, and live minutes.</p>
      <div className="mt-5 grid gap-3">
        {state.loading && <p className="text-sm text-slate-500">Loading performance...</p>}
        {state.error && <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{state.error}</p>}
        {asArray(state.data).slice(0, 6).map((student) => (
          <div key={student.id} className="grid gap-2 rounded-md border border-slate-200 p-4 md:grid-cols-[1fr_auto] md:items-center">
            <div><h3 className="font-bold">{student.name}</h3><p className="text-sm text-slate-600">{student.email}</p></div>
            <div className="text-sm text-slate-700">{student.attendancePercentage}% attendance - {student.averageQuizScore}% quiz - {student.liveMinutes} live min</div>
          </div>
        ))}
      </div>
    </Card>
  );
}
