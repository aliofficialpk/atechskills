"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Clock, PlayCircle, RefreshCcw, Send, ShieldCheck, UserPlus, XCircle } from "lucide-react";
import { Badge, ButtonLink, Card } from "@/components/ui";

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

  const enrollments = state.data?.student?.enrollments ?? [];
  const notifications = state.data?.notifications ?? [];

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

export function AdminControlCenter() {
  return (
    <div className="mt-6 grid gap-5 xl:grid-cols-2">
      <AdminStaffForm />
      <AdminScheduleForm />
      <AdminEnrollmentQueue />
      <AdminPerformancePanel />
    </div>
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
    fetch(`${apiBase}/courses`).then((response) => response.json()).then(setCourses).catch(() => setCourses([]));
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
          {courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}
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
      const response = await fetch(`${apiBase}/lms/admin/enrollment-requests`, { headers: authHeaders() });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to load requests");
      setState({ loading: false, data });
    } catch (error) {
      setState({ loading: false, error: error instanceof Error ? error.message : "Unable to load requests" });
    }
  }

  async function review(id: string, action: "verify" | "reject") {
    try {
      const endpoint = action === "verify" ? "approve-payment" : "reject";
      const response = await fetch(`${apiBase}/lms/admin/enrollments/${id}/${endpoint}`, { method: "PATCH", headers: { "Content-Type": "application/json", ...authHeaders() }, body: JSON.stringify({ adminNote: action === "verify" ? "Payment approved." : "Please upload a clearer proof." }) });
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
        {(state.data ?? []).map((item) => (
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
        {!state.loading && !state.error && (state.data ?? []).length === 0 && <p className="text-sm text-slate-500">No pending enrollment requests.</p>}
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
        {(state.data ?? []).slice(0, 6).map((student) => (
          <div key={student.id} className="grid gap-2 rounded-md border border-slate-200 p-4 md:grid-cols-[1fr_auto] md:items-center">
            <div><h3 className="font-bold">{student.name}</h3><p className="text-sm text-slate-600">{student.email}</p></div>
            <div className="text-sm text-slate-700">{student.attendancePercentage}% attendance - {student.averageQuizScore}% quiz - {student.liveMinutes} live min</div>
          </div>
        ))}
      </div>
    </Card>
  );
}
