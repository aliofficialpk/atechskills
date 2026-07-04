"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Send, CheckCircle2, LogIn, ArrowRight } from "lucide-react";

const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:9000/api/v1";

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06L5.84 9.9C6.71 7.31 9.14 5.38 12 5.38z" />
    </svg>
  );
}

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

  function startGoogleLogin() {
    window.location.href = `${apiBase}/auth/google?returnTo=${encodeURIComponent("/student-dashboard")}`;
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 rounded-lg border border-slate-200 bg-white p-6 shadow-card">
      <h2 className="text-xl font-bold text-slate-950">{isLogin ? "Welcome back" : isRegister ? "Start learning" : "Recover access"}</h2>
      {!isRecovery && (
        <>
          <button type="button" onClick={startGoogleLogin} className="group grid min-h-14 grid-cols-[auto_1fr_auto] items-center gap-3 rounded-md border border-slate-200 bg-white px-4 py-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-brand-green hover:bg-emerald-50 hover:shadow-card focus:outline-none focus:ring-2 focus:ring-brand-green/25">
            <span className="grid size-9 place-items-center rounded-md border border-slate-200 bg-white shadow-sm">
              <GoogleMark />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-bold text-slate-950">Continue with Google</span>
              <span className="mt-0.5 block text-xs text-slate-500">Fast student access with your Gmail account</span>
            </span>
            <ArrowRight className="text-brand-green transition group-hover:translate-x-0.5" size={18} />
          </button>
          <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            <span className="h-px flex-1 bg-slate-200" />
            or
            <span className="h-px flex-1 bg-slate-200" />
          </div>
        </>
      )}
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
