"use client";

import { useEffect, useState } from "react";
import { MessageCircle, RefreshCcw, Send, ShieldCheck, Phone, CheckCircle2, XCircle, AlertCircle, FileText } from "lucide-react";
import { Badge, ButtonLink, Card } from "@/components/ui";
import { apiBase, authedFetch, refreshSession } from "@/lib/auth-client";

type ApiState<T> = { data?: T; error?: string; loading: boolean };

function StatusBadge({ value }: { value: string }) {
  const color =
    value === "CONNECTED" || value === "GREEN" || value === "APPROVED"
      ? "text-brand-green bg-emerald-50 border-emerald-200"
      : value === "PENDING"
        ? "text-amber-700 bg-amber-50 border-amber-200"
        : "text-red-700 bg-red-50 border-red-200";
  return (
    <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${color}`}>{value}</span>
  );
}

function getStoredUser() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("atechskills_user");
    return raw ? JSON.parse(raw) as { name?: string; roles?: string[] } : null;
  } catch { return null; }
}

export function WhatsAppAdminDashboard() {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<{ name?: string; roles?: string[] } | null>(null);
  const [activeTab, setActiveTab] = useState<"status" | "send" | "templates">("status");

  useEffect(() => {
    refreshSession().catch(() => {}).finally(() => {
      setUser(getStoredUser());
      setReady(true);
    });
  }, []);

  if (!ready) {
    return <section className="min-h-screen bg-slate-50 p-8"><Card className="container-page p-6 text-sm text-slate-500">Checking access...</Card></section>;
  }

  const token = typeof window !== "undefined" ? localStorage.getItem("atechskills_access_token") : null;
  if (!token) {
    return (
      <section className="min-h-screen bg-slate-50 p-8">
        <Card className="container-page p-6">
          <h1 className="text-2xl font-black">Login required</h1>
          <p className="mt-2 text-sm text-slate-600">Please login with an Admin account to access WhatsApp controls.</p>
          <ButtonLink href="/login" className="mt-5">Go to Login</ButtonLink>
        </Card>
      </section>
    );
  }

  const roles = user?.roles ?? [];
  const hasAccess = roles.includes("Admin") || roles.includes("Super Admin");
  if (!hasAccess) {
    return (
      <section className="min-h-screen bg-slate-50 p-8">
        <Card className="container-page p-6">
          <h1 className="text-2xl font-black">Access restricted</h1>
          <p className="mt-2 text-sm text-slate-600">This page is only available to Admin accounts.</p>
          <ButtonLink href="/" variant="secondary" className="mt-5">Back to Website</ButtonLink>
        </Card>
      </section>
    );
  }

  const tabs = [
    { id: "status" as const, label: "Status & Config", icon: ShieldCheck },
    { id: "send" as const, label: "Send Message", icon: Send },
    { id: "templates" as const, label: "Templates", icon: FileText }
  ];

  return (
    <section className="min-h-screen bg-slate-50">
      <div className="border-b border-slate-200 bg-white">
        <div className="container-page flex min-h-20 flex-col gap-4 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <Badge>WhatsApp Admin</Badge>
            <h1 className="mt-2 flex items-center gap-2 text-3xl font-black">
              <MessageCircle className="text-brand-green" size={28} /> WhatsApp Controls
            </h1>
            <p className="mt-1 text-sm text-slate-500">Manage WhatsApp messaging via Meta Cloud API</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/admin-dashboard" variant="secondary">Admin Dashboard</ButtonLink>
            <ButtonLink href="/" variant="secondary">Website</ButtonLink>
          </div>
        </div>
      </div>

      <div className="container-page grid gap-6 py-8 lg:grid-cols-[240px_1fr]">
        <aside className="h-fit rounded-lg border border-slate-200 bg-white p-3 shadow-card">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`mb-1 flex w-full items-center gap-3 rounded-md px-3 py-3 text-left text-sm font-semibold transition ${activeTab === tab.id ? "bg-brand-green text-white" : "text-slate-700 hover:bg-brand-mint hover:text-brand-green"}`}
              >
                <Icon size={16} /> {tab.label}
              </button>
            );
          })}
        </aside>

        <div>
          {activeTab === "status" && <WhatsAppStatusPanel />}
          {activeTab === "send" && <WhatsAppSendPanel />}
          {activeTab === "templates" && <WhatsAppTemplatesPanel />}
        </div>
      </div>
    </section>
  );
}

function WhatsAppStatusPanel() {
  const [state, setState] = useState<ApiState<any>>({ loading: true });

  async function load() {
    setState({ loading: true });
    try {
      const res = await authedFetch(`${apiBase}/whatsapp/status`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load status");
      setState({ loading: false, data });
    } catch (e) {
      setState({ loading: false, error: e instanceof Error ? e.message : "Failed to load status" });
    }
  }

  useEffect(() => { load(); }, []);

  const d = state.data;

  return (
    <div className="grid gap-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-bold">WhatsApp Connection Status</h2>
        <button onClick={load} className="rounded-md border border-slate-200 p-2 text-brand-green"><RefreshCcw size={18} /></button>
      </div>

      {state.loading && <Card className="p-6 text-sm text-slate-500">Loading status from Meta Graph API...</Card>}
      {state.error && <Card className="p-6 text-sm text-red-700">{state.error}</Card>}

      {!state.loading && !state.error && d && (
        <>
          {!d.configured ? (
            <Card className="p-6">
              <p className="font-bold text-amber-700">Not fully configured</p>
              <p className="mt-2 text-sm text-slate-600">{d.message}</p>
            </Card>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-3">
                <Card className="p-5">
                  <p className="text-xs font-bold uppercase text-slate-400">Phone Number</p>
                  <p className="mt-2 flex items-center gap-2 text-xl font-black"><Phone size={18} className="text-brand-green" />{d.phoneInfo?.display_phone_number ?? "—"}</p>
                  <div className="mt-2 flex gap-2">
                    {d.phoneInfo?.status && <StatusBadge value={d.phoneInfo.status} />}
                    {d.phoneInfo?.quality_rating && <StatusBadge value={d.phoneInfo.quality_rating} />}
                  </div>
                </Card>
                <Card className="p-5">
                  <p className="text-xs font-bold uppercase text-slate-400">Token Valid</p>
                  <p className="mt-2 flex items-center gap-2 text-xl font-black">
                    {d.tokenInfo?.is_valid ? <CheckCircle2 className="text-brand-green" size={20} /> : <XCircle className="text-red-500" size={20} />}
                    {d.tokenInfo?.is_valid ? "Valid" : "Expired"}
                  </p>
                  <p className="mt-2 text-xs text-slate-500">
                    Expires: {d.tokenInfo?.expires_at ? new Date(d.tokenInfo.expires_at * 1000).toLocaleDateString() : "—"}
                  </p>
                </Card>
                <Card className="p-5">
                  <p className="text-xs font-bold uppercase text-slate-400">Permissions</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {(d.tokenInfo?.scopes ?? []).map((s: string) => (
                      <span key={s} className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-brand-green">{s}</span>
                    ))}
                  </div>
                </Card>
              </div>

              <Card className="p-5">
                <h3 className="font-bold">Configuration</h3>
                <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
                  {[
                    ["App ID", d.appId],
                    ["Business ID", d.businessId],
                    ["Phone Number ID", d.phoneId],
                    ["Verified Name", d.phoneInfo?.verified_name ?? "—"]
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-md bg-slate-50 p-3">
                      <p className="text-xs font-bold uppercase text-slate-400">{label}</p>
                      <p className="mt-1 font-mono text-xs">{value}</p>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-5">
                <div className="flex items-start gap-3">
                  <AlertCircle size={18} className="mt-0.5 shrink-0 text-amber-600" />
                  <div>
                    <p className="font-bold">What to complete on Meta</p>
                    <ul className="mt-2 grid gap-2 text-sm text-slate-600">
                      <li>1. In <strong>App Review</strong> → make sure <code>whatsapp_business_messaging</code>, <code>whatsapp_business_management</code>, and <code>public_profile</code> all show green checkmarks (run the graph test script to trigger API calls).</li>
                      <li>2. In <strong>WhatsApp → Getting Started</strong> → add your real phone number and verify it via OTP to replace the test number.</li>
                      <li>3. In <strong>App Review → Permissions</strong> → submit for review if you need to message non-test users (production access).</li>
                      <li>4. Set up a <strong>Webhook</strong> in WhatsApp settings → point it to your backend <code>/api/v1/whatsapp/webhook</code> with your verify token.</li>
                    </ul>
                  </div>
                </div>
              </Card>
            </>
          )}
        </>
      )}
    </div>
  );
}

function WhatsAppSendPanel() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const values = Object.fromEntries(new FormData(form).entries()) as { to: string; message: string };
    setLoading(true);
    setResult(null);
    try {
      const res = await authedFetch(`${apiBase}/whatsapp/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to send message");
      setResult({ ok: true, text: `Message sent. Message ID: ${data.messages?.[0]?.id ?? "—"}` });
      form.reset();
    } catch (err) {
      setResult({ ok: false, text: err instanceof Error ? err.message : "Failed to send" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="p-6">
      <h2 className="text-xl font-bold">Send WhatsApp Message</h2>
      <p className="mt-2 text-sm text-slate-600">
        Send a text message to any WhatsApp number. During development, only numbers added as test recipients in Meta can receive messages.
      </p>
      <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
        <label className="grid gap-2 text-sm font-medium text-slate-700">
          To (phone number with country code, no +)
          <input
            required
            name="to"
            placeholder="e.g. 923001234567"
            className="rounded-md border border-slate-200 px-3 py-3 outline-none focus:border-brand-green"
          />
        </label>
        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Message
          <textarea
            required
            name="message"
            rows={5}
            maxLength={4096}
            placeholder="Type your message..."
            onChange={(e) => setMessage(e.target.value)}
            className="rounded-md border border-slate-200 px-3 py-3 outline-none focus:border-brand-green"
          />
          <span className="text-xs text-slate-400">{message.length}/4096</span>
        </label>
        <button
          disabled={loading}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-brand-green px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          <Send size={16} /> {loading ? "Sending..." : "Send Message"}
        </button>
      </form>
      {result && (
        <div className={`mt-4 rounded-md p-3 text-sm ${result.ok ? "bg-emerald-50 text-brand-green" : "bg-red-50 text-red-700"}`}>
          {result.text}
        </div>
      )}
    </Card>
  );
}

function WhatsAppTemplatesPanel() {
  const [state, setState] = useState<ApiState<any>>({ loading: true });
  const [sendState, setSendState] = useState<{ ok: boolean; text: string } | null>(null);
  const [sendingTemplate, setSendingTemplate] = useState("");

  async function load() {
    setState({ loading: true });
    try {
      const res = await authedFetch(`${apiBase}/whatsapp/templates`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load templates");
      setState({ loading: false, data });
    } catch (e) {
      setState({ loading: false, error: e instanceof Error ? e.message : "Failed to load templates" });
    }
  }

  useEffect(() => { load(); }, []);

  async function sendTemplate(e: React.FormEvent<HTMLFormElement>, templateName: string) {
    e.preventDefault();
    const values = Object.fromEntries(new FormData(e.currentTarget).entries()) as { to: string; language: string };
    setSendingTemplate(templateName);
    setSendState(null);
    try {
      const res = await authedFetch(`${apiBase}/whatsapp/send-template`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: values.to, templateName, language: values.language || "en_US" })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to send template");
      setSendState({ ok: true, text: `Template sent. ID: ${data.messages?.[0]?.id ?? "—"}` });
      (e.target as HTMLFormElement).reset();
    } catch (err) {
      setSendState({ ok: false, text: err instanceof Error ? err.message : "Failed to send template" });
    } finally {
      setSendingTemplate("");
    }
  }

  const templates = state.data?.data ?? [];

  return (
    <div className="grid gap-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-bold">Message Templates</h2>
        <button onClick={load} className="rounded-md border border-slate-200 p-2 text-brand-green"><RefreshCcw size={18} /></button>
      </div>

      {sendState && (
        <div className={`rounded-md p-3 text-sm ${sendState.ok ? "bg-emerald-50 text-brand-green" : "bg-red-50 text-red-700"}`}>
          {sendState.text}
        </div>
      )}

      {state.loading && <Card className="p-6 text-sm text-slate-500">Loading templates...</Card>}
      {state.error && <Card className="p-6 text-sm text-red-700">{state.error}</Card>}
      {!state.loading && !state.error && templates.length === 0 && (
        <Card className="p-6 text-sm text-slate-500">No templates found. Create them in Meta Business Suite → WhatsApp → Message Templates.</Card>
      )}

      {templates.map((t: any) => (
        <Card key={t.id ?? t.name} className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="font-bold">{t.name}</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                <StatusBadge value={t.status} />
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">{t.category}</span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">{t.language}</span>
              </div>
            </div>
          </div>
          {t.components?.filter((c: any) => c.type === "BODY").map((c: any, i: number) => (
            <p key={i} className="mt-3 rounded-md bg-slate-50 p-3 text-sm text-slate-700">{c.text}</p>
          ))}
          {t.status === "APPROVED" && (
            <form onSubmit={(e) => sendTemplate(e, t.name)} className="mt-4 flex flex-wrap items-end gap-3">
              <label className="grid gap-1.5 text-sm font-medium text-slate-700">
                To (number, no +)
                <input required name="to" placeholder="923001234567" className="rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-green" />
              </label>
              <label className="grid gap-1.5 text-sm font-medium text-slate-700">
                Language
                <input name="language" defaultValue={t.language ?? "en_US"} className="rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-green" />
              </label>
              <button
                disabled={sendingTemplate === t.name}
                className="inline-flex min-h-10 items-center gap-2 rounded-md bg-brand-green px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                <Send size={15} /> {sendingTemplate === t.name ? "Sending..." : "Send Template"}
              </button>
            </form>
          )}
        </Card>
      ))}
    </div>
  );
}
