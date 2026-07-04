"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";

function safeReturnTo(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/student-dashboard";
  return value;
}

export default function GoogleAuthCallbackPage() {
  const router = useRouter();
  const [message, setMessage] = useState("Completing Google sign-in...");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const accessToken = params.get("accessToken");
    const refreshToken = params.get("refreshToken");
    const user = params.get("user");
    const returnTo = safeReturnTo(params.get("returnTo"));

    if (!accessToken || !user) {
      setFailed(true);
      setMessage("Google sign-in could not be completed. Please try again.");
      return;
    }

    localStorage.setItem("atechskills_access_token", accessToken);
    if (refreshToken) localStorage.setItem("atechskills_refresh_token", refreshToken);
    localStorage.setItem("atechskills_user", user);
    window.history.replaceState(null, "", "/auth/google/callback");
    setMessage("Google sign-in complete. Redirecting to your dashboard.");
    setTimeout(() => router.replace(returnTo), 500);
  }, [router]);

  return (
    <main className="grid min-h-[70vh] place-items-center bg-slate-50 px-4 py-16">
      <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-8 text-center shadow-card">
        {failed ? <CheckCircle2 className="mx-auto mb-4 text-brand-red" size={34} /> : <Loader2 className="mx-auto mb-4 animate-spin text-brand-green" size={34} />}
        <h1 className="text-2xl font-black text-slate-950">Google Login</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">{message}</p>
        {failed && <Link href="/login" className="mt-6 inline-flex min-h-11 items-center justify-center rounded-md bg-brand-green px-5 py-3 text-sm font-semibold text-white">Back to Login</Link>}
      </section>
    </main>
  );
}
