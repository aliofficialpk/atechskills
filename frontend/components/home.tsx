import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Calendar, CirclePlay, Clock, MapPin, ShieldCheck } from "lucide-react";
import { Badge, ButtonLink, Card, SectionHeading } from "@/components/ui";
import { CeoMessageSection } from "@/components/ceo-message";
import { categories, courses, dashboardStats, events, insights, testimonials } from "@/lib/data";
import { formatCurrency } from "@/lib/utils";

export function HomePage() {
  return (
    <>
      <section className="overflow-hidden bg-white py-12 md:py-16">
        <div className="container-page grid items-center gap-12 lg:grid-cols-[1fr_1.05fr]">
          <div>
            <Badge className="gap-2"><span className="h-2 w-2 rounded-full bg-brand-green" /> Empowering Future-Ready Professionals</Badge>
            <h1 className="mt-5 text-5xl font-black leading-tight text-slate-950 md:text-6xl">
              Upskill. Secure. <br />Innovate with <span className="text-brand-red">AtechSkills</span>
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">Join industry-focused courses, live training, and hands-on bootcamps in DevSecOps, AI, Cybersecurity, Cloud, and more.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/courses">Explore Courses <ArrowRight size={18} /></ButtonLink>
              <ButtonLink href="/watch-intro" variant="secondary">Watch Intro <CirclePlay size={18} /></ButtonLink>
              <ButtonLink href="/register" variant="danger">Register Now</ButtonLink>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {dashboardStats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label} className="flex items-center gap-3">
                    <span className="grid h-11 w-11 place-items-center rounded-full bg-brand-mint text-brand-green"><Icon size={20} /></span>
                    <div><div className="font-bold">{stat.value}</div><div className="text-xs text-slate-500">{stat.label}</div></div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="relative min-h-[360px]">
            <div className="absolute inset-0 rounded-lg bg-brand-green" />
            <div className="absolute right-0 top-0 h-40 w-40 rounded-bl-[80px] bg-brand-red" />
            <Image
              src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80"
              alt="AtechSkills learner attending a secure technology bootcamp"
              fill
              className="rounded-lg object-cover mix-blend-screen"
              priority
            />
            <div className="absolute left-8 top-8 rounded-lg bg-white/95 px-5 py-4 shadow-card">
              <div className="text-2xl font-black text-brand-green">DevSec<span className="text-brand-red">AI</span></div>
              <p className="mt-1 text-sm font-semibold text-slate-700">Building secure and intelligent digital futures</p>
            </div>
            <Card className="absolute bottom-6 left-4 max-w-[235px] p-5 sm:-left-5 sm:bottom-12 sm:max-w-[250px]">
              <p className="text-xs text-slate-500">Upcoming Bootcamp</p>
              <h3 className="mt-1 font-bold">DevSecAI Bootcamp 2025</h3>
              <div className="mt-3 flex gap-3 text-xs text-slate-600"><span className="flex items-center gap-1"><Clock size={14} /> 8 Weeks</span><span>Live + Hands-on</span></div>
              <ButtonLink href="/courses/devsecai-bootcamp-2025/enroll" variant="secondary" className="mt-4 min-h-9 px-3 py-2">Enroll Now</ButtonLink>
            </Card>
            <Card className="absolute right-4 top-24 max-w-[220px] p-5 sm:-right-5 sm:max-w-[235px]">
              <p className="flex items-center gap-2 text-xs font-semibold text-brand-red"><Calendar size={15} /> Next Event</p>
              <h3 className="mt-2 font-bold">DevSecAI Summit 2025</h3>
              <p className="mt-1 text-xs text-slate-500">24 July, 2026</p>
              <ButtonLink href="/events/devsecai-summit-2025/register" className="mt-4 min-h-9 px-3 py-2">Register Now</ButtonLink>
            </Card>
          </div>
        </div>
      </section>

      <section className="container-page grid gap-5 pb-12 md:grid-cols-3 lg:grid-cols-6">
        {categories.map((category) => {
          const Icon = category.icon;
          return (
            <Link key={category.slug} href={`/courses?category=${category.slug}`} className="rounded-lg border border-slate-200 bg-white p-5 shadow-card transition hover:-translate-y-1 hover:border-brand-green">
              <span className="grid h-12 w-12 place-items-center rounded-full bg-brand-mint text-brand-green"><Icon /></span>
              <h3 className="mt-5 font-bold">{category.name}</h3>
              <p className="mt-2 min-h-12 text-sm leading-6 text-slate-600">{category.summary}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-slate-950">Explore <ArrowRight size={15} /></span>
            </Link>
          );
        })}
      </section>

      <CeoMessageSection />

      <section className="bg-slate-50 py-14">
        <div className="container-page grid gap-8 lg:grid-cols-3">
          <div>
            <SectionHeading title="Upcoming Events" action={<ButtonLink href="/events" variant="ghost">View All</ButtonLink>} />
            <div className="grid gap-3">
              {events.map((event) => (
                <Card key={event.slug} className="flex items-center justify-between gap-3 p-4">
                  <div className="grid h-16 w-16 place-items-center rounded-md bg-white text-center shadow-sm"><span className="text-xs font-bold text-brand-red">{new Date(event.date).toLocaleString("en", { month: "short" }).toUpperCase()}</span><span className="text-2xl font-black">{new Date(event.date).getDate()}</span></div>
                  <div className="min-w-0 flex-1"><h3 className="font-bold">{event.title}</h3><p className="mt-1 flex items-center gap-1 text-xs text-slate-500"><MapPin size={13} /> {event.location}</p></div>
                  <ButtonLink href={`/events/${event.slug}/register`} variant="secondary" className="min-h-9 px-3 py-2">Register</ButtonLink>
                </Card>
              ))}
            </div>
          </div>
          <div>
            <SectionHeading title="Daily Insights" action={<ButtonLink href="/daily-insights" variant="ghost">View All</ButtonLink>} />
            <div className="grid gap-3">
              {insights.map((item) => (
                <Link key={item.slug} href={`/daily-insights/${item.slug}`} className="grid grid-cols-[86px_1fr] gap-4 rounded-lg p-2 transition hover:bg-white">
                  <div className="rounded-md bg-brand-forest p-4 text-white"><ShieldCheck /></div>
                  <div><Badge className="px-2 py-0.5">{item.category}</Badge><h3 className="mt-1 font-bold leading-tight">{item.title}</h3><p className="mt-1 text-xs text-slate-500">{item.date}</p></div>
                </Link>
              ))}
            </div>
          </div>
          <div>
            <SectionHeading title="What Our Learners Say" />
            <Card className="p-7">
              <p className="text-5xl font-black leading-none text-brand-green">"</p>
              <p className="mt-2 leading-7 text-slate-700">{testimonials[0].quote}</p>
              <div className="mt-6 flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-full bg-brand-mint font-bold text-brand-green">AR</div>
                <div><h3 className="font-bold">{testimonials[0].name}</h3><p className="text-xs text-slate-500">{testimonials[0].role}</p></div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      <section className="container-page py-16">
        <SectionHeading eyebrow="LMS Foundation" title="Courses built for completion, proof, and career outcomes" text="Live sessions, attendance, recordings, assignments, quizzes, certificates, and performance tracking are organized around each learner." />
        <div className="grid gap-5 md:grid-cols-3">
          {courses.map((course) => (
            <Card key={course.slug} className="overflow-hidden">
              <Image src={course.image} alt={course.title} width={640} height={360} className="h-48 w-full object-cover" />
              <div className="p-5">
                <Badge>{course.category}</Badge>
                <h3 className="mt-3 text-xl font-bold">{course.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{course.summary}</p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="font-black text-brand-green">{formatCurrency(course.discountPrice)}</span>
                  <ButtonLink href={`/courses/${course.slug}`} variant="secondary" className="min-h-9 px-3 py-2">Details</ButtonLink>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </>
  );
}
