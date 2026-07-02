"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Send, CheckCircle2, LogIn } from "lucide-react";

const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:9000/api/v1";

export function SmartForm({ type, title }: { type: "contact" | "enrollment" | "event" | "support" | "auth"; title: string }) {
  const [sent, setSent] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    try {
      await fetch(`${apiBase}/forms/${type}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
    } catch {
      // Keep UX useful during offline frontend-only previews.
    }
    setSent(true);
    form.reset();
  }

  if (sent) {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-6 text-brand-green">
        <CheckCircle2 className="mb-3" />
        <h3 className="font-semibold">Request received</h3>
        <p className="mt-2 text-sm">Our team will review it and respond through the right AtechSkills flow.</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 rounded-lg border border-slate-200 bg-white p-6 shadow-card">
      <h2 className="text-xl font-bold text-slate-950">{title}</h2>
      <label className="grid gap-2 text-sm font-medium text-slate-700">
        Full name
        <input required name="name" className="rounded-md border border-slate-200 px-3 py-3 outline-none focus:border-brand-green" />
      </label>
      <label className="grid gap-2 text-sm font-medium text-slate-700">
        Email
        <input required type="email" name="email" className="rounded-md border border-slate-200 px-3 py-3 outline-none focus:border-brand-green" />
      </label>
      <label className="grid gap-2 text-sm font-medium text-slate-700">
        Phone
        <input name="phone" className="rounded-md border border-slate-200 px-3 py-3 outline-none focus:border-brand-green" />
      </label>
      <label className="grid gap-2 text-sm font-medium text-slate-700">
        Message
        <textarea required name="message" rows={4} className="rounded-md border border-slate-200 px-3 py-3 outline-none focus:border-brand-green" />
      </label>
      <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-brand-green px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-forest">
        <Send size={18} /> Submit
      </button>
    </form>
  );
}

export function AuthForm({ mode }: { mode: "login" | "register" | "forgot-password" | "reset-password" }) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const isLogin = mode === "login";
  const isRegister = mode === "register";
  const isRecovery = mode === "forgot-password" || mode === "reset-password";

  function dashboardForRoles(roles: string[] = []) {
    if (roles.some((role) => ["Super Admin", "Admin"].includes(role))) return "/admin-dashboard";
    if (roles.includes("Teacher")) return "/teacher-dashboard";
    if (roles.includes("Student Services")) return "/student-services-dashboard";
    return "/student-dashboard";
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form).entries());
    setStatus("loading");
    setMessage("");

    const endpoint = isLogin ? "/auth/login" : isRegister ? "/auth/register" : "/auth/forgot-password";
    const payload = isRecovery
      ? { email: values.email }
      : { name: values.name, email: values.email, password: values.password };

    try {
      const response = await fetch(`${apiBase}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Request failed");
      if (data.accessToken) localStorage.setItem("atechskills_access_token", data.accessToken);
      if (data.user) localStorage.setItem("atechskills_user", JSON.stringify(data.user));
      setStatus("success");
      setMessage(isRecovery ? "Password recovery instructions are queued." : "Access granted. Redirecting to your dashboard.");
      form.reset();
      if (!isRecovery) setTimeout(() => router.push(dashboardForRoles(data.user?.roles ?? [])), 700);
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Unable to complete request.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 rounded-lg border border-slate-200 bg-white p-6 shadow-card">
      <h2 className="text-xl font-bold text-slate-950">{isLogin ? "Welcome back" : isRegister ? "Start learning" : "Recover access"}</h2>
      {isRegister && (
        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Full name
          <input required name="name" className="rounded-md border border-slate-200 px-3 py-3 outline-none focus:border-brand-green" />
        </label>
      )}
      <label className="grid gap-2 text-sm font-medium text-slate-700">
        {isLogin ? "Username or email" : "Email"}
        <input required type={isLogin ? "text" : "email"} name="email" autoComplete={isLogin ? "username" : "email"} className="rounded-md border border-slate-200 px-3 py-3 outline-none focus:border-brand-green" />
      </label>
      {!isRecovery && (
        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Password
          <input required type="password" name="password" minLength={isRegister ? 8 : 1} className="rounded-md border border-slate-200 px-3 py-3 outline-none focus:border-brand-green" />
        </label>
      )}
      {status !== "idle" && (
        <div className={`rounded-md px-3 py-2 text-sm ${status === "error" ? "bg-red-50 text-red-700" : status === "success" ? "bg-emerald-50 text-brand-green" : "bg-slate-50 text-slate-600"}`}>
          {status === "loading" ? "Processing..." : message}
        </div>
      )}
      <button disabled={status === "loading"} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-brand-green px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-forest disabled:cursor-not-allowed disabled:opacity-60">
        <LogIn size={18} /> {isLogin ? "Login" : isRegister ? "Create Account" : "Send Recovery Email"}
      </button>
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
        {!isLogin && <Link className="font-semibold text-brand-green" href="/login">Already have an account?</Link>}
        {isLogin && <Link className="font-semibold text-brand-green" href="/forgot-password">Forgot password?</Link>}
        {isLogin && <Link className="font-semibold text-brand-red" href="/register">Create account</Link>}
      </div>
    </form>
  );
}

export function EventRegistrationForm({ slug }: { slug: string }) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form).entries());
    setStatus("loading");
    setMessage("");
    try {
      const response = await fetch(`${apiBase}/events/${slug}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Registration failed");
      setStatus("success");
      setMessage("Registration confirmed. Event reminders will be sent when email is configured.");
      form.reset();
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Unable to register.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 rounded-lg border border-slate-200 bg-white p-6 shadow-card">
      <h2 className="text-xl font-bold text-slate-950">Event Registration</h2>
      <label className="grid gap-2 text-sm font-medium text-slate-700">
        Full name
        <input required name="name" className="rounded-md border border-slate-200 px-3 py-3 outline-none focus:border-brand-green" />
      </label>
      <label className="grid gap-2 text-sm font-medium text-slate-700">
        Email
        <input required type="email" name="email" className="rounded-md border border-slate-200 px-3 py-3 outline-none focus:border-brand-green" />
      </label>
      <label className="grid gap-2 text-sm font-medium text-slate-700">
        Phone
        <input name="phone" className="rounded-md border border-slate-200 px-3 py-3 outline-none focus:border-brand-green" />
      </label>
      {status !== "idle" && <div className={`rounded-md px-3 py-2 text-sm ${status === "error" ? "bg-red-50 text-red-700" : "bg-emerald-50 text-brand-green"}`}>{status === "loading" ? "Registering..." : message}</div>}
      <button disabled={status === "loading"} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-brand-green px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-forest disabled:cursor-not-allowed disabled:opacity-60">
        <Send size={18} /> Register Seat
      </button>
    </form>
  );
}

export function EnrollmentRequestForm({ slug, courseTitle }: { slug: string; courseTitle: string }) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const token = localStorage.getItem("atechskills_access_token");
    if (!token) {
      setStatus("error");
      setMessage("Please login or create an account first. Enrollment will use the same email account.");
      return;
    }
    const values = new FormData(form);
    setStatus("loading");
    setMessage("");
    try {
      const response = await fetch(`${apiBase}/lms/enrollments/${slug}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: values
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Enrollment request failed");
      setStatus("success");
      setMessage("Enrollment request created. Admin will verify your payment proof and activate the course.");
      form.reset();
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Unable to submit enrollment request.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 rounded-lg border border-slate-200 bg-white p-6 shadow-card">
      <h2 className="text-xl font-bold text-slate-950">Enroll in {courseTitle}</h2>
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-brand-green">
        <p className="font-bold">Payment Instructions</p>
        <p className="mt-1">Bank Alfalah - ATechSkills</p>
        <p className="mt-1 text-lg font-black tracking-wide">55105002806178</p>
        <p className="mt-2 text-xs">Send the fee, then upload a screenshot/PDF proof below. Admin will verify and confirm your enrollment.</p>
      </div>
      <label className="grid gap-2 text-sm font-medium text-slate-700">
        Paid amount
        <input required name="paidAmount" type="number" min="0" className="rounded-md border border-slate-200 px-3 py-3 outline-none focus:border-brand-green" />
      </label>
      <label className="grid gap-2 text-sm font-medium text-slate-700">
        Payment proof screenshot or PDF
        <input required name="paymentProof" type="file" accept="image/png,image/jpeg,image/webp,application/pdf" className="rounded-md border border-slate-200 px-3 py-3 outline-none focus:border-brand-green" />
      </label>
      <div className="flex flex-wrap gap-3 text-sm">
        <Link href="/login" className="font-semibold text-brand-green">Login first</Link>
        <Link href="/register" className="font-semibold text-brand-red">Create account</Link>
      </div>
      <label className="grid gap-2 text-sm font-medium text-slate-700">
        Notes for admin
        <textarea name="message" rows={3} className="rounded-md border border-slate-200 px-3 py-3 outline-none focus:border-brand-green" placeholder="Transaction ID, sender account name, preferred batch, or question" />
      </label>
      {status !== "idle" && <div className={`rounded-md px-3 py-2 text-sm ${status === "error" ? "bg-red-50 text-red-700" : "bg-emerald-50 text-brand-green"}`}>{status === "loading" ? "Submitting..." : message}</div>}
      <button disabled={status === "loading"} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-brand-green px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-forest disabled:cursor-not-allowed disabled:opacity-60">
        <Send size={18} /> Start Enrollment
      </button>
    </form>
  );
}
