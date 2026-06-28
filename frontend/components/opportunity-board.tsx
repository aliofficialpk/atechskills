"use client";

import { useEffect, useMemo, useState } from "react";
import { BriefcaseBusiness, ExternalLink, GraduationCap, MapPin, Search } from "lucide-react";
import { Badge, ButtonLink, Card, SectionHeading } from "@/components/ui";
import { jobs } from "@/lib/data";

const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:9000/api/v1";

type Opportunity = {
  id?: string;
  slug: string;
  title: string;
  type?: string;
  opportunityType?: string;
  company: string;
  location: string;
  workMode?: string | null;
  employmentType?: string | null;
  summary: string;
  applyUrl: string;
  deadline?: string | null;
  isFeatured?: boolean;
  tag?: string;
};

const fallbackOpportunities: Opportunity[] = jobs.map((job) => ({
  slug: job.slug,
  title: job.title,
  type: job.opportunityType,
  company: job.company,
  location: job.location,
  workMode: job.workMode,
  employmentType: job.type,
  summary: job.summary,
  applyUrl: job.applyUrl,
  tag: job.tag,
  isFeatured: job.slug.includes("cloud") || job.slug.includes("soc")
}));

function labelForType(type?: string) {
  if (type === "JOB") return "Job";
  if (type === "INTERNSHIP") return "Internship";
  if (type === "APPRENTICESHIP") return "Apprenticeship";
  if (type === "FELLOWSHIP") return "Fellowship";
  return type ?? "Opportunity";
}

export function OpportunityBoard({ initialType = "ALL" }: { initialType?: "ALL" | "JOB" | "INTERNSHIP" }) {
  const [items, setItems] = useState<Opportunity[]>(fallbackOpportunities);
  const [activeType, setActiveType] = useState(initialType);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("Loading live opportunities...");

  useEffect(() => {
    const params = initialType === "ALL" ? "" : `?type=${initialType}`;
    fetch(`${apiBase}/opportunities${params}`)
      .then((response) => response.json().then((data) => ({ ok: response.ok, data })))
      .then(({ ok, data }) => {
        if (!ok || !Array.isArray(data)) throw new Error("Unable to load opportunities");
        setItems(data.length > 0 ? data : fallbackOpportunities);
        setStatus(data.length > 0 ? "Live opportunities loaded from AtechSkills." : "Showing starter opportunities.");
      })
      .catch(() => setStatus("Showing starter opportunities while live API data is unavailable."));
  }, [initialType]);

  const filtered = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    return items.filter((item) => {
      const itemType = item.type ?? item.opportunityType;
      const matchesType = activeType === "ALL" || itemType === activeType || (activeType === "INTERNSHIP" && item.employmentType === "Internship");
      const matchesSearch = !normalized || [item.title, item.company, item.location, item.summary].join(" ").toLowerCase().includes(normalized);
      return matchesType && matchesSearch;
    });
  }, [activeType, items, search]);

  return (
    <section className="container-page py-12">
      <SectionHeading
        eyebrow="Jobs and Internships"
        title="Opportunities for learners, graduates, and hiring partners"
        text="Admins can publish jobs, internships, apprenticeships, application links, deadlines, and featured opportunities from the dashboard."
      />

      <div className="mt-8 grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-card lg:grid-cols-[1fr_auto_auto_auto]">
        <label className="flex items-center gap-3 rounded-md bg-slate-50 px-3 py-3">
          <Search size={18} className="text-slate-500" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} className="w-full bg-transparent text-sm outline-none" placeholder="Search title, company, location" />
        </label>
        {(["ALL", "JOB", "INTERNSHIP"] as const).map((type) => (
          <button
            key={type}
            onClick={() => setActiveType(type)}
            className={`rounded-md px-4 py-3 text-sm font-black transition ${activeType === type ? "bg-brand-green text-white" : "border border-slate-200 bg-white text-slate-700 hover:border-brand-green"}`}
          >
            {type === "ALL" ? "All" : labelForType(type)}
          </button>
        ))}
      </div>

      <p className="mt-4 text-sm text-slate-500">{status}</p>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        {filtered.map((item) => {
          const itemType = item.type ?? item.opportunityType;
          const Icon = itemType === "INTERNSHIP" ? GraduationCap : BriefcaseBusiness;
          return (
            <Card key={item.id ?? item.slug} className="p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-brand-mint text-brand-green"><Icon size={22} /></span>
                  <div>
                    <Badge>{labelForType(itemType)}</Badge>
                    {item.isFeatured && <span className="ml-2 rounded-full bg-red-50 px-3 py-1 text-xs font-black text-brand-red">Featured</span>}
                  </div>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{item.employmentType ?? item.workMode ?? "Open"}</span>
              </div>
              <h2 className="mt-5 text-2xl font-black text-slate-950">{item.title}</h2>
              <p className="mt-2 text-sm font-semibold text-brand-green">{item.company}</p>
              <p className="mt-3 flex items-center gap-2 text-sm text-slate-600"><MapPin size={16} /> {item.location}{item.workMode ? ` - ${item.workMode}` : ""}</p>
              <p className="mt-4 text-sm leading-6 text-slate-600">{item.summary}</p>
              {item.deadline && <p className="mt-3 text-xs font-bold text-brand-red">Apply by {new Date(item.deadline).toLocaleDateString()}</p>}
              <ButtonLink href={item.applyUrl} className="mt-5" variant="secondary">
                Apply Now <ExternalLink size={16} />
              </ButtonLink>
            </Card>
          );
        })}
      </div>

      {filtered.length === 0 && <Card className="mt-6 p-8 text-center text-sm text-slate-600">No matching opportunities right now. Try another search or check again later.</Card>}
    </section>
  );
}
