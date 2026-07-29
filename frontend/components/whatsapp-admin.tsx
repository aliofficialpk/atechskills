"use client";

import { useEffect, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, FileText, MessageCircle, Phone, Plus, RefreshCcw, Send, ShieldCheck, Trash2, Upload, Users, XCircle, Zap } from "lucide-react";
import { Badge, ButtonLink, Card } from "@/components/ui";
import { apiBase, authedFetch, refreshSession } from "@/lib/auth-client";

type ApiState<T> = { data?: T; error?: string; loading: boolean };
type Tab = "status" | "contacts" | "broadcast" | "templates" | "auto";

function StatusBadge({ value }: { value: string }) {
  const color = value === "CONNECTED" || value === "GREEN" || value === "APPROVED" || value === "SENT"
    ? "text-brand-green bg-emerald-50 border-emerald-200"
    : value === "PENDING" || value === "SENDING" || value === "PARTIAL"
      ? "text-amber-700 bg-amber-50 border-amber-200"
      : "text-red-700 bg-red-50 border-red-200";
  return <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${color}`}>{value}</span>;
}

function getStoredUser() {
  if (typeof window === "undefined") return null;
  try { return JSON.parse(localStorage.getItem("atechskills_user") ?? "null") as { name?: string; roles?: string[] } | null; }
  catch { return null; }
}

export function WhatsAppAdminDashboard() {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<{ name?: string; roles?: string[] } | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("contacts");

  useEffect(() => {
    refreshSession().catch(() => {}).finally(() => { setUser(getStoredUser()); setReady(true); });
  }, []);

  if (!ready) return <section className="min-h-screen bg-slate-50 p-8"><Card className="container-page p-6 text-sm text-slate-500">Checking access...</Card></section>;

  const token = typeof window !== "undefined" ? localStorage.getItem("atechskills_access_token") : null;
  if (!token) return <section className="min-h-screen bg-slate-50 p-8"><Card className="container-page p-6"><h1 className="text-2xl font-black">Login required</h1><p className="mt-2 text-sm text-slate-600">Admin account required.</p><ButtonLink href="/login" className="mt-5">Go to Login</ButtonLink></Card></section>;

  const roles = user?.roles ?? [];
  if (!roles.includes("Admin") && !roles.includes("Super Admin")) {
    return <section className="min-h-screen bg-slate-50 p-8"><Card className="container-page p-6"><h1 className="text-2xl font-black">Access restricted</h1><ButtonLink href="/" variant="secondary" className="mt-5">Back</ButtonLink></Card></section>;
  }

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: "contacts", label: "Contacts", icon: Users },
    { id: "broadcast", label: "Broadcast", icon: Send },
    { id: "templates", label: "Templates", icon: FileText },
    { id: "auto", label: "Auto Messages", icon: Zap },
    { id: "status", label: "Status & Config", icon: ShieldCheck }
  ];

  return (
    <section className="min-h-screen bg-slate-50">
      <div className="border-b border-slate-200 bg-white">
        <div className="container-page flex min-h-20 flex-col gap-4 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <Badge>WhatsApp Admin</Badge>
            <h1 className="mt-2 flex items-center gap-2 text-3xl font-black"><MessageCircle className="text-brand-green" size={28} /> WhatsApp Controls</h1>
            <p className="mt-1 text-sm text-slate-500">Contacts, broadcasts, templates and auto-messages</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/admin-dashboard" variant="secondary">Admin Dashboard</ButtonLink>
          </div>
        </div>
      </div>
      <div className="container-page grid gap-6 py-8 lg:grid-cols-[220px_1fr]">
        <aside className="h-fit rounded-lg border border-slate-200 bg-white p-3 shadow-card">
          {tabs.map((tab) => { const Icon = tab.icon; return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`mb-1 flex w-full items-center gap-3 rounded-md px-3 py-3 text-left text-sm font-semibold transition ${activeTab === tab.id ? "bg-brand-green text-white" : "text-slate-700 hover:bg-brand-mint hover:text-brand-green"}`}>
              <Icon size={16} /> {tab.label}
            </button>
          ); })}
        </aside>
        <div>
          {activeTab === "contacts" && <ContactsPanel />}
          {activeTab === "broadcast" && <BroadcastPanel />}
          {activeTab === "templates" && <TemplatesPanel />}
          {activeTab === "auto" && <AutoMessagesPanel />}
          {activeTab === "status" && <StatusPanel />}
        </div>
      </div>
    </section>
  );
}

// ── Contacts Panel ────────────────────────────────────────────────────────────
function ContactsPanel() {
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [msg, setMsg] = useState("");
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    setLoading(true);
    const res = await authedFetch(`${apiBase}/whatsapp/contacts?search=${encodeURIComponent(search)}`);
    const data = await res.json();
    setContacts(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  async function addContact(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const vals = Object.fromEntries(new FormData(form).entries()) as any;
    vals.tags = vals.tags ? vals.tags.split(",").map((t: string) => t.trim()).filter(Boolean) : [];
    const res = await authedFetch(`${apiBase}/whatsapp/contacts`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(vals) });
    const data = await res.json();
    if (!res.ok) { setMsg(data.error ?? "Failed to add contact"); return; }
    setMsg("Contact saved.");
    form.reset();
    load();
  }

  async function deleteContact(id: string) {
    await authedFetch(`${apiBase}/whatsapp/contacts/${id}`, { method: "DELETE" });
    setContacts((prev) => prev.filter((c) => c.id !== id));
  }

  async function importCSV(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    const text = await file.text();
    const lines = text.split("\n").filter(Boolean);
    const rows = lines.slice(1).map((line) => {
      const [name, phone, tags, notes] = line.split(",").map((s) => s.trim().replace(/^"|"$/g, ""));
      return { name, phone, tags: tags ? tags.split(";").map((t) => t.trim()) : [], notes };
    }).filter((r) => r.name && r.phone);
    const res = await authedFetch(`${apiBase}/whatsapp/contacts/import`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(rows) });
    const data = await res.json();
    setMsg(`Imported: ${data.created} new, ${data.updated} updated.`);
    setImporting(false);
    load();
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold">Contacts ({contacts.length})</h2>
        <div className="flex gap-2">
          <button onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700">
            <Upload size={15} /> {importing ? "Importing..." : "Import CSV"}
          </button>
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={importCSV} />
          <button onClick={load} className="rounded-md border border-slate-200 p-2 text-brand-green"><RefreshCcw size={18} /></button>
        </div>
      </div>

      <Card className="p-4 text-xs text-slate-500">CSV format: <code>name,phone,tags,notes</code> — tags separated by semicolons. Phone with country code no +. Example: <code>Ali,923001234567,students;batch1,enrolled</code></Card>

      <Card className="p-5">
        <h3 className="font-bold">Add Contact</h3>
        <form onSubmit={addContact} className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]">
          <input required name="name" placeholder="Name" className="rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-green" />
          <input required name="phone" placeholder="Phone (e.g. 923001234567)" className="rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-green" />
          <input name="tags" placeholder="Tags (comma separated)" className="rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-green" />
          <button className="inline-flex items-center gap-2 rounded-md bg-brand-green px-4 py-2 text-sm font-semibold text-white"><Plus size={15} /> Add</button>
        </form>
        {msg && <p className="mt-3 text-sm text-brand-green">{msg}</p>}
      </Card>

      <Card className="overflow-hidden">
        <div className="border-b border-slate-200 p-4">
          <input value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && load()} placeholder="Search by name or phone..." className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-green" />
        </div>
        {loading && <p className="p-5 text-sm text-slate-500">Loading contacts...</p>}
        {!loading && contacts.length === 0 && <p className="p-5 text-sm text-slate-500">No contacts yet. Add one above or import a CSV.</p>}
        <div className="divide-y divide-slate-100">
          {contacts.map((c) => (
            <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <div>
                <p className="font-semibold">{c.name}</p>
                <p className="text-xs text-slate-500">{c.phone}</p>
                {c.tags?.length > 0 && <div className="mt-1 flex flex-wrap gap-1">{c.tags.map((t: string) => <span key={t} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{t}</span>)}</div>}
              </div>
              <button onClick={() => deleteContact(c.id)} className="rounded-md border border-red-200 p-1.5 text-red-500 hover:bg-red-50"><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ── Broadcast Panel ───────────────────────────────────────────────────────────
function BroadcastPanel() {
  const [contacts, setContacts] = useState<any[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [broadcasts, setBroadcasts] = useState<any[]>([]);
  const [msg, setMsg] = useState("");
  const [sending, setSending] = useState(false);
  const [filterTag, setFilterTag] = useState("");

  async function loadContacts() {
    const res = await authedFetch(`${apiBase}/whatsapp/contacts?tag=${encodeURIComponent(filterTag)}`);
    const data = await res.json();
    setContacts(Array.isArray(data) ? data : []);
  }

  async function loadBroadcasts() {
    const res = await authedFetch(`${apiBase}/whatsapp/broadcasts`);
    const data = await res.json();
    setBroadcasts(Array.isArray(data) ? data : []);
  }

  useEffect(() => { loadContacts(); loadBroadcasts(); }, []);
  useEffect(() => { loadContacts(); }, [filterTag]);

  function toggleAll() {
    if (selected.size === contacts.length) setSelected(new Set());
    else setSelected(new Set(contacts.map((c) => c.id)));
  }

  async function send(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const vals = Object.fromEntries(new FormData(e.currentTarget).entries()) as any;
    if (selected.size === 0) { setMsg("Select at least one contact."); return; }
    setSending(true); setMsg("");
    const res = await authedFetch(`${apiBase}/whatsapp/broadcasts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...vals, contactIds: Array.from(selected) })
    });
    const data = await res.json();
    setSending(false);
    if (!res.ok) { setMsg(data.error ?? "Failed to send"); return; }
    setMsg(`Broadcast started — sending to ${data.totalRecipients} contacts.`);
    setSelected(new Set());
    loadBroadcasts();
  }

  const allTags = Array.from(new Set(contacts.flatMap((c) => c.tags ?? [])));

  return (
    <div className="grid gap-5">
      <h2 className="text-xl font-bold">Broadcast Message</h2>

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <Card className="p-5">
          <h3 className="font-bold">Compose & Send</h3>
          <form onSubmit={send} className="mt-4 grid gap-3">
            <input required name="title" placeholder="Broadcast title (internal)" className="rounded-md border border-slate-200 px-3 py-3 outline-none focus:border-brand-green" />
            <textarea name="message" rows={4} placeholder="Message text (leave blank if using a template)" className="rounded-md border border-slate-200 px-3 py-3 outline-none focus:border-brand-green" />
            <div className="grid gap-3 sm:grid-cols-2">
              <input name="templateName" placeholder="Template name (optional)" className="rounded-md border border-slate-200 px-3 py-3 outline-none focus:border-brand-green" />
              <input name="language" defaultValue="en_US" placeholder="Language code" className="rounded-md border border-slate-200 px-3 py-3 outline-none focus:border-brand-green" />
            </div>
            <p className="text-xs text-slate-500">{selected.size} contact{selected.size !== 1 ? "s" : ""} selected</p>
            <button disabled={sending} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-brand-green px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">
              <Send size={16} /> {sending ? "Sending..." : "Send Broadcast"}
            </button>
          </form>
          {msg && <p className={`mt-3 rounded-md p-3 text-sm ${msg.includes("Failed") ? "bg-red-50 text-red-700" : "bg-emerald-50 text-brand-green"}`}>{msg}</p>}
        </Card>

        <Card className="overflow-hidden">
          <div className="border-b border-slate-200 p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-bold">Select Contacts</p>
              <button onClick={toggleAll} className="text-xs text-brand-green underline">{selected.size === contacts.length ? "Deselect all" : "Select all"}</button>
            </div>
            {allTags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                <button onClick={() => setFilterTag("")} className={`rounded-full px-2 py-0.5 text-xs font-semibold ${filterTag === "" ? "bg-brand-green text-white" : "bg-slate-100 text-slate-600"}`}>All</button>
                {allTags.map((t) => <button key={t} onClick={() => setFilterTag(t)} className={`rounded-full px-2 py-0.5 text-xs font-semibold ${filterTag === t ? "bg-brand-green text-white" : "bg-slate-100 text-slate-600"}`}>{t}</button>)}
              </div>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {contacts.length === 0 && <p className="p-4 text-xs text-slate-500">No contacts. Add them in the Contacts tab.</p>}
            {contacts.map((c) => (
              <label key={c.id} className="flex cursor-pointer items-center gap-3 px-3 py-2.5 hover:bg-slate-50">
                <input type="checkbox" checked={selected.has(c.id)} onChange={() => { const s = new Set(selected); s.has(c.id) ? s.delete(c.id) : s.add(c.id); setSelected(s); }} className="accent-brand-green" />
                <div><p className="text-sm font-semibold">{c.name}</p><p className="text-xs text-slate-500">{c.phone}</p></div>
              </label>
            ))}
          </div>
        </Card>
      </div>

      {broadcasts.length > 0 && (
        <Card className="overflow-hidden">
          <div className="border-b border-slate-200 p-4 font-bold">Broadcast History</div>
          <div className="divide-y divide-slate-100">
            {broadcasts.map((b: any) => (
              <div key={b.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <div><p className="font-semibold">{b.title}</p><p className="text-xs text-slate-500">{b.templateName ? `Template: ${b.templateName}` : b.message?.slice(0, 60)}</p></div>
                <div className="flex items-center gap-3"><span className="text-xs text-slate-500">{b._count?.recipients ?? 0} recipients</span><StatusBadge value={b.status} /></div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

// ── Templates Panel ───────────────────────────────────────────────────────────
function TemplatesPanel() {
  const [state, setState] = useState<ApiState<any>>({ loading: true });
  const [sendState, setSendState] = useState<{ ok: boolean; text: string } | null>(null);
  const [sendingTemplate, setSendingTemplate] = useState("");

  async function load() {
    setState({ loading: true });
    const res = await authedFetch(`${apiBase}/whatsapp/templates`);
    const data = await res.json();
    if (!res.ok) { setState({ loading: false, error: data.error ?? "Failed" }); return; }
    setState({ loading: false, data });
  }

  useEffect(() => { load(); }, []);

  async function sendTemplate(e: React.FormEvent<HTMLFormElement>, templateName: string, defaultLang: string) {
    e.preventDefault();
    const vals = Object.fromEntries(new FormData(e.currentTarget).entries()) as any;
    setSendingTemplate(templateName); setSendState(null);
    const res = await authedFetch(`${apiBase}/whatsapp/send-template`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to: vals.to, templateName, language: vals.language || defaultLang })
    });
    const data = await res.json();
    setSendingTemplate("");
    setSendState({ ok: res.ok, text: res.ok ? `Sent. ID: ${data.messages?.[0]?.id ?? "—"}` : (data.error ?? "Failed") });
    if (res.ok) (e.target as HTMLFormElement).reset();
  }

  const templates = state.data?.data ?? [];

  return (
    <div className="grid gap-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-bold">Message Templates</h2>
        <button onClick={load} className="rounded-md border border-slate-200 p-2 text-brand-green"><RefreshCcw size={18} /></button>
      </div>
      {sendState && <div className={`rounded-md p-3 text-sm ${sendState.ok ? "bg-emerald-50 text-brand-green" : "bg-red-50 text-red-700"}`}>{sendState.text}</div>}
      {state.loading && <Card className="p-6 text-sm text-slate-500">Loading templates...</Card>}
      {state.error && <Card className="p-6 text-sm text-red-700">{state.error}</Card>}
      {!state.loading && !state.error && templates.length === 0 && <Card className="p-6 text-sm text-slate-500">No templates yet. Create them in Meta Business Suite → WhatsApp → Message Templates.</Card>}
      {templates.map((t: any) => (
        <Card key={t.id ?? t.name} className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div><h3 className="font-bold">{t.name}</h3>
              <div className="mt-2 flex flex-wrap gap-2"><StatusBadge value={t.status} /><span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">{t.category}</span><span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">{t.language}</span></div>
            </div>
          </div>
          {t.components?.filter((c: any) => c.type === "BODY").map((c: any, i: number) => <p key={i} className="mt-3 rounded-md bg-slate-50 p-3 text-sm text-slate-700">{c.text}</p>)}
          {t.status === "APPROVED" && (
            <form onSubmit={(e) => sendTemplate(e, t.name, t.language ?? "en_US")} className="mt-4 flex flex-wrap items-end gap-3">
              <label className="grid gap-1.5 text-sm font-medium text-slate-700">To (no +)<input required name="to" placeholder="923001234567" className="mt-1 rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-green" /></label>
              <label className="grid gap-1.5 text-sm font-medium text-slate-700">Language<input name="language" defaultValue={t.language ?? "en_US"} className="mt-1 rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-green" /></label>
              <button disabled={sendingTemplate === t.name} className="inline-flex min-h-10 items-center gap-2 rounded-md bg-brand-green px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"><Send size={15} /> {sendingTemplate === t.name ? "Sending..." : "Send"}</button>
            </form>
          )}
        </Card>
      ))}
    </div>
  );
}

// ── Auto Messages Panel ───────────────────────────────────────────────────────
function AutoMessagesPanel() {
  const [items, setItems] = useState<any[]>([]);
  const [msg, setMsg] = useState("");

  async function load() {
    const res = await authedFetch(`${apiBase}/whatsapp/auto-messages`);
    const data = await res.json();
    setItems(Array.isArray(data) ? data : []);
  }

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const vals = Object.fromEntries(new FormData(e.currentTarget).entries()) as any;
    vals.isActive = true;
    const res = await authedFetch(`${apiBase}/whatsapp/auto-messages`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(vals) });
    const data = await res.json();
    if (!res.ok) { setMsg(data.error ?? "Failed"); return; }
    setMsg("Auto message saved.");
    (e.target as HTMLFormElement).reset();
    load();
  }

  async function toggle(id: string, isActive: boolean) {
    await authedFetch(`${apiBase}/whatsapp/auto-messages/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive }) });
    load();
  }

  async function del(id: string) {
    await authedFetch(`${apiBase}/whatsapp/auto-messages/${id}`, { method: "DELETE" });
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  useEffect(() => { load(); }, []);

  const triggerLabels: Record<string, string> = {
    fee_paid: "Fee Paid / Payment Verified",
    enrollment_approved: "Enrollment Approved",
    enrollment_rejected: "Enrollment Rejected",
    class_reminder: "Class Reminder",
    custom: "Custom"
  };

  return (
    <div className="grid gap-5">
      <h2 className="text-xl font-bold">Auto Messages</h2>
      <Card className="p-4 text-sm text-slate-600 flex items-start gap-3"><AlertCircle size={16} className="mt-0.5 shrink-0 text-amber-600" /><span>Auto messages send automatically when a trigger event happens (e.g. fee paid). Connect triggers to your enrollment flow in the backend to activate them.</span></Card>

      <Card className="p-5">
        <h3 className="font-bold">Add Auto Message</h3>
        <form onSubmit={save} className="mt-4 grid gap-3">
          <select required name="trigger" className="rounded-md border border-slate-200 px-3 py-3 outline-none focus:border-brand-green">
            <option value="">Select trigger...</option>
            {Object.entries(triggerLabels).map(([val, label]) => <option key={val} value={val}>{label}</option>)}
          </select>
          <textarea name="message" rows={3} placeholder="Message text (or use template below)" className="rounded-md border border-slate-200 px-3 py-3 outline-none focus:border-brand-green" />
          <div className="grid gap-3 sm:grid-cols-2">
            <input name="templateName" placeholder="Template name (optional)" className="rounded-md border border-slate-200 px-3 py-3 outline-none focus:border-brand-green" />
            <input name="language" defaultValue="en_US" className="rounded-md border border-slate-200 px-3 py-3 outline-none focus:border-brand-green" />
          </div>
          <button className="inline-flex min-h-10 items-center gap-2 rounded-md bg-brand-green px-4 py-2 text-sm font-semibold text-white"><Plus size={15} /> Save Auto Message</button>
        </form>
        {msg && <p className="mt-3 text-sm text-brand-green">{msg}</p>}
      </Card>

      {items.length === 0 && <Card className="p-5 text-sm text-slate-500">No auto messages configured yet.</Card>}
      {items.map((item) => (
        <Card key={item.id} className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-bold">{triggerLabels[item.trigger] ?? item.trigger}</p>
              {item.templateName && <p className="mt-1 text-sm text-slate-600">Template: <code>{item.templateName}</code></p>}
              {item.message && <p className="mt-1 text-sm text-slate-600">{item.message}</p>}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => toggle(item.id, !item.isActive)} className={`rounded-full px-3 py-1 text-xs font-semibold ${item.isActive ? "bg-emerald-50 text-brand-green" : "bg-slate-100 text-slate-500"}`}>{item.isActive ? "Active" : "Paused"}</button>
              <button onClick={() => del(item.id)} className="rounded-md border border-red-200 p-1.5 text-red-500 hover:bg-red-50"><Trash2 size={14} /></button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

// ── Status Panel ──────────────────────────────────────────────────────────────
function StatusPanel() {
  const [state, setState] = useState<ApiState<any>>({ loading: true });

  async function load() {
    setState({ loading: true });
    const res = await authedFetch(`${apiBase}/whatsapp/status`);
    const data = await res.json();
    if (!res.ok) { setState({ loading: false, error: data.error ?? "Failed" }); return; }
    setState({ loading: false, data });
  }

  useEffect(() => { load(); }, []);
  const d = state.data;

  return (
    <div className="grid gap-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-bold">Connection Status</h2>
        <button onClick={load} className="rounded-md border border-slate-200 p-2 text-brand-green"><RefreshCcw size={18} /></button>
      </div>
      {state.loading && <Card className="p-6 text-sm text-slate-500">Loading from Meta...</Card>}
      {state.error && <Card className="p-6 text-sm text-red-700">{state.error}</Card>}
      {!state.loading && !state.error && d && (
        <>
          {!d.configured ? <Card className="p-6"><p className="font-bold text-amber-700">Not configured</p><p className="mt-2 text-sm text-slate-600">{d.message}</p></Card> : (
            <>
              <div className="grid gap-4 md:grid-cols-3">
                <Card className="p-5"><p className="text-xs font-bold uppercase text-slate-400">Phone Number</p><p className="mt-2 flex items-center gap-2 text-xl font-black"><Phone size={18} className="text-brand-green" />{d.phoneInfo?.display_phone_number ?? "—"}</p><div className="mt-2 flex gap-2">{d.phoneInfo?.status && <StatusBadge value={d.phoneInfo.status} />}{d.phoneInfo?.quality_rating && <StatusBadge value={d.phoneInfo.quality_rating} />}</div></Card>
                <Card className="p-5"><p className="text-xs font-bold uppercase text-slate-400">Token</p><p className="mt-2 flex items-center gap-2 text-xl font-black">{d.tokenInfo?.is_valid ? <CheckCircle2 className="text-brand-green" size={20} /> : <XCircle className="text-red-500" size={20} />}{d.tokenInfo?.is_valid ? "Valid" : "Expired"}</p><p className="mt-2 text-xs text-slate-500">Expires: {d.tokenInfo?.expires_at ? new Date(d.tokenInfo.expires_at * 1000).toLocaleDateString() : "—"}</p></Card>
                <Card className="p-5"><p className="text-xs font-bold uppercase text-slate-400">Permissions</p><div className="mt-2 flex flex-wrap gap-1.5">{(d.tokenInfo?.scopes ?? []).map((s: string) => <span key={s} className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-brand-green">{s}</span>)}</div></Card>
              </div>
              <Card className="p-5">
                <h3 className="font-bold">Configuration</h3>
                <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
                  {[["App ID", d.appId], ["Business ID", d.businessId], ["Phone Number ID", d.phoneId], ["Verified Name", d.phoneInfo?.verified_name ?? "—"]].map(([label, value]) => (
                    <div key={label} className="rounded-md bg-slate-50 p-3"><p className="text-xs font-bold uppercase text-slate-400">{label}</p><p className="mt-1 font-mono text-xs">{value}</p></div>
                  ))}
                </div>
              </Card>
            </>
          )}
        </>
      )}
    </div>
  );
}
