import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarDays, CheckCircle2, Clock, FileText, Filter, PlayCircle, Search, ShieldCheck, Ticket, UsersRound } from "lucide-react";
import { Badge, ButtonLink, Card, SectionHeading } from "@/components/ui";
import { CeoMessageSection } from "@/components/ceo-message";
import { AuthForm, EnrollmentRequestForm, SmartForm } from "@/components/forms";
import { AdminControlCenter, StudentLearningCenter } from "@/components/lms-widgets";
import { OpportunityBoard } from "@/components/opportunity-board";
import { categories, courses, dashboardModules, events, faqs, insights, jobs, portalCards, roleDashboards, supportTypes, teamMembers, testimonials } from "@/lib/data";
import { formatCurrency } from "@/lib/utils";

export function PageHero({ eyebrow, title, text, ctaHref = "/register", cta = "Get Started" }: { eyebrow: string; title: string; text: string; ctaHref?: string; cta?: string }) {
  return (
    <section className="bg-slate-50 py-14">
      <div className="container-page">
        <Badge>{eyebrow}</Badge>
        <h1 className="mt-4 max-w-4xl text-4xl font-black leading-tight text-slate-950 md:text-6xl">{title}</h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600">{text}</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <ButtonLink href={ctaHref}>{cta}</ButtonLink>
          <ButtonLink href="/contact" variant="secondary">Talk to Admissions</ButtonLink>
        </div>
      </div>
    </section>
  );
}

export function CoursesIndex() {
  return (
    <>
      <PageHero eyebrow="Courses" title="Career-ready learning paths for modern technology teams" text="Browse live cohorts, bootcamps, and self-paced LMS programs with assignments, attendance, recordings, certificates, and progress tracking." ctaHref="/courses/devsecai-bootcamp-2025/enroll" cta="Enroll in DevSecAI" />
      <section className="container-page py-12">
        <div className="mb-6 grid gap-3 rounded-lg border border-slate-200 bg-white p-4 md:grid-cols-[1fr_auto_auto]">
          <div className="flex items-center gap-3 rounded-md bg-slate-50 px-3 py-3"><Search size={18} /><input className="w-full bg-transparent outline-none" placeholder="Search courses" /></div>
          <ButtonLink href="/courses?level=beginner" variant="secondary"><Filter size={16} /> Beginner</ButtonLink>
          <ButtonLink href="/courses?category=devsecops" variant="secondary">DevSecOps</ButtonLink>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {courses.map((course) => <CourseCard key={course.slug} course={course} />)}
        </div>
      </section>
    </>
  );
}

export function CourseCard({ course }: { course: (typeof courses)[number] }) {
  return (
    <Card className="overflow-hidden">
      <Image src={course.image} alt={course.title} width={640} height={360} className="h-48 w-full object-cover" />
      <div className="p-5">
        <div className="flex items-center justify-between gap-3"><Badge>{course.category}</Badge><span className="text-xs font-semibold text-brand-green">{course.status}</span></div>
        <h2 className="mt-3 text-xl font-bold">{course.title}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">{course.summary}</p>
        <div className="mt-4 flex items-center justify-between"><span className="font-black text-brand-green">{formatCurrency(course.discountPrice)}</span><ButtonLink href={`/courses/${course.slug}`} variant="secondary" className="min-h-9 px-3 py-2">View Course</ButtonLink></div>
      </div>
    </Card>
  );
}

export function CourseDetails({ slug }: { slug: string }) {
  const course = courses.find((item) => item.slug === slug) ?? courses[0];
  return (
    <>
      <section className="bg-slate-50 py-12">
        <div className="container-page grid gap-8 lg:grid-cols-[1fr_380px]">
          <div>
            <Badge>{course.category}</Badge>
            <h1 className="mt-4 text-4xl font-black leading-tight md:text-6xl">{course.title}</h1>
            <p className="mt-5 text-lg leading-8 text-slate-600">{course.summary}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href={`/courses/${course.slug}/enroll`}>Enroll Now</ButtonLink>
              <ButtonLink href="/student-dashboard" variant="secondary">Preview LMS</ButtonLink>
            </div>
          </div>
          <Card className="overflow-hidden">
            <Image src={course.image} alt={course.title} width={640} height={420} className="h-56 w-full object-cover" />
            <div className="p-5">
              <div className="flex items-end gap-2"><span className="text-3xl font-black text-brand-green">{formatCurrency(course.discountPrice)}</span><span className="pb-1 text-sm text-slate-400 line-through">{formatCurrency(course.price)}</span></div>
              <div className="mt-5 grid gap-3 text-sm text-slate-700">
                <span className="flex items-center gap-2"><Clock size={17} /> {course.duration}</span>
                <span className="flex items-center gap-2"><CheckCircle2 size={17} /> {course.level}</span>
                <span className="flex items-center gap-2"><ShieldCheck size={17} /> Certificate included</span>
              </div>
            </div>
          </Card>
        </div>
      </section>
      <section className="container-page grid gap-8 py-12 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <h2 className="text-2xl font-bold">Curriculum</h2>
          <div className="mt-5 grid gap-3">
            {course.modules.map((module, index) => (
              <div key={module} className="rounded-md border border-slate-200 p-4"><span className="text-sm font-semibold text-brand-red">Module {index + 1}</span><h3 className="font-bold">{module}</h3><p className="mt-1 text-sm text-slate-600">Lessons, resources, recordings, quizzes, assignments, and attendance tracking.</p></div>
            ))}
          </div>
        </Card>
        <Card className="p-6">
          <h2 className="text-2xl font-bold">Outcomes</h2>
          <div className="mt-5 grid gap-3">
            {course.outcomes.map((outcome) => <p key={outcome} className="flex gap-2 text-sm text-slate-700"><CheckCircle2 className="mt-0.5 shrink-0 text-brand-green" size={17} /> {outcome}</p>)}
          </div>
        </Card>
      </section>
    </>
  );
}

export function EnrollmentPage({ slug }: { slug: string }) {
  const course = courses.find((item) => item.slug === slug) ?? courses[0];
  return (
    <section className="container-page grid gap-8 py-12 lg:grid-cols-[1fr_420px]">
      <div>
        <Badge>Enrollment</Badge>
        <h1 className="mt-4 text-4xl font-black">Enroll in {course.title}</h1>
        <p className="mt-4 text-slate-600">Login or create an account first. Enrollment is attached to that same email. Send the course fee to the AtechSkills Meezan Bank account, upload payment proof, and admin will verify it before activating your course dashboard.</p>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {["Same-account enrollment", "Meezan Bank proof upload", "Admin payment verification", "Dashboard course activation"].map((item) => <Card key={item} className="p-5"><CheckCircle2 className="text-brand-green" /><h3 className="mt-3 font-bold">{item}</h3></Card>)}
        </div>
      </div>
      <EnrollmentRequestForm slug={course.slug} courseTitle={course.title} />
    </section>
  );
}

export function EventsIndex() {
  return (
    <>
      <PageHero eyebrow="Events" title="Summits, workshops, seminars, meetups, and bootcamps" text="Manageable event pages with speakers, registration, reminders, capacity, online links, and galleries." ctaHref="/events/devsecai-summit-2025/register" cta="Register for Summit" />
      <section className="container-page grid gap-6 py-12 md:grid-cols-3">
        {events.map((event) => <EventCard key={event.slug} event={event} />)}
      </section>
    </>
  );
}

export function EventCard({ event }: { event: (typeof events)[number] }) {
  return (
    <Card className="p-6">
      <Badge>{event.type}</Badge>
      <h2 className="mt-4 text-2xl font-bold">{event.title}</h2>
      <p className="mt-3 text-sm leading-6 text-slate-600">{event.summary}</p>
      <div className="mt-5 grid gap-2 text-sm text-slate-700"><span className="flex items-center gap-2"><CalendarDays size={17} /> {event.date} at {event.time}</span><span>{event.location}</span><span>{event.capacity} seats</span></div>
      <div className="mt-6 flex gap-3"><ButtonLink href={`/events/${event.slug}`} variant="secondary">Details</ButtonLink><ButtonLink href={`/events/${event.slug}/register`}>Register</ButtonLink></div>
    </Card>
  );
}

export function EventDetails({ slug }: { slug: string }) {
  const event = events.find((item) => item.slug === slug) ?? events[0];
  return (
    <>
      <PageHero eyebrow={event.type} title={event.title} text={event.summary} ctaHref={`/events/${event.slug}/register`} cta="Register Now" />
      <section className="container-page grid gap-6 py-12 md:grid-cols-3">
        {["Speaker details", "Venue or online link", "Capacity and reminders"].map((item) => <Card key={item} className="p-6"><h2 className="font-bold">{item}</h2><p className="mt-2 text-sm text-slate-600">{item === "Speaker details" ? event.speaker : `${event.date} - ${event.time} - ${event.location}`}</p></Card>)}
      </section>
    </>
  );
}

export function InsightsIndex() {
  return (
    <>
      <PageHero eyebrow="Daily Insights" title="News, updates, jobs, internships, and course announcements" text="A searchable publishing section for content managers and admins to keep learners connected to opportunities." ctaHref="/careers" cta="Browse Jobs" />
      <section className="container-page py-12">
        <div className="mb-6 grid gap-3 rounded-lg border border-slate-200 bg-white p-4 md:grid-cols-[1fr_auto_auto]">
          <div className="flex items-center gap-3 rounded-md bg-slate-50 px-3 py-3"><Search size={18} /><input className="w-full bg-transparent outline-none" placeholder="Search insights, jobs, internships" /></div>
          <ButtonLink href="/daily-insights?category=jobs" variant="secondary">Jobs</ButtonLink>
          <ButtonLink href="/daily-insights?category=internships" variant="secondary">Internships</ButtonLink>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {insights.map((item) => <InsightCard key={item.slug} item={item} />)}
        </div>
      </section>
    </>
  );
}

export function InsightCard({ item }: { item: (typeof insights)[number] }) {
  return (
    <Link href={`/daily-insights/${item.slug}`} className="rounded-lg border border-slate-200 bg-white p-6 shadow-card transition hover:-translate-y-1 hover:border-brand-green">
      <Badge>{item.category}</Badge>
      <h2 className="mt-4 text-xl font-bold">{item.title}</h2>
      <p className="mt-3 text-sm leading-6 text-slate-600">{item.summary}</p>
      <p className="mt-5 text-xs text-slate-500">{item.author} - {item.date}</p>
    </Link>
  );
}

export function InsightDetails({ slug }: { slug: string }) {
  const item = insights.find((post) => post.slug === slug) ?? insights[0];
  return (
    <article className="container-page max-w-4xl py-12">
      <Badge>{item.category}</Badge>
      <h1 className="mt-4 text-4xl font-black leading-tight md:text-6xl">{item.title}</h1>
      <p className="mt-4 text-sm text-slate-500">{item.author} - {item.date}</p>
      <p className="mt-8 text-xl leading-9 text-slate-700">{item.summary}</p>
      <div className="mt-8 grid gap-4 rounded-lg bg-slate-50 p-6 text-slate-700">
        <p>This publishing flow supports featured images, categories, tags, slugs, visibility status, author attribution, and admin approval.</p>
        <p>In production, the content body comes from the backend CMS API and can be extended for rich text, embeds, SEO metadata, and scheduled publishing.</p>
      </div>
    </article>
  );
}

export function StaticInfoPage({ kind }: { kind: string }) {
  const titles: Record<string, string> = {
    about: "About AtechSkills",
    "devsecai-bootcamp": "DevSecAI Bootcamp",
    "devsecai-summit": "DevSecAI Summit",
    blog: "Blog and Articles",
    gallery: "Gallery",
    careers: "Careers and Job Board",
    opportunities: "Jobs and Internship Opportunities",
    "internship-board": "Internship Board",
    faq: "Frequently Asked Questions",
    "privacy-policy": "Privacy Policy",
    "terms-and-conditions": "Terms & Conditions",
    "watch-intro": "AtechSkills Intro",
    "student-services": "Student Services"
  };
  const descriptions: Record<string, string> = {
    about: "AtechSkills is a practical technology training company focused on secure software, DevSecOps, AI, cloud, data, and career-ready learning paths.",
    "devsecai-bootcamp": "An intensive live bootcamp for secure AI systems, DevSecOps pipelines, cloud security, governance, and capstone-ready portfolio work.",
    "devsecai-summit": "A premium summit experience for secure AI, software security, DevSecOps leadership, student opportunities, and industry networking.",
    blog: "Long-form articles, tutorials, career guidance, case studies, and technical explainers from the AtechSkills team.",
    gallery: "A visual archive for bootcamps, summits, workshops, seminars, project demos, certificates, and learner achievements.",
    careers: "A curated board for jobs, hiring partner opportunities, career tracks, and placement support for AtechSkills learners.",
    opportunities: "A live board for jobs, internships, apprenticeships, application links, deadlines, and featured opportunities published by AtechSkills admins.",
    "internship-board": "Internships and early-career opportunities for students building practical cybersecurity, cloud, AI, and programming skills.",
    faq: "Answers to common questions about courses, live classes, recordings, certificates, payments, support, and the LMS.",
    "privacy-policy": "How AtechSkills handles learner data, support records, enrollment information, media, communications, and platform analytics.",
    "terms-and-conditions": "The platform rules for enrollment, course access, payments, acceptable use, certificates, events, and content.",
    "watch-intro": "A short guided introduction to the AtechSkills learning experience, LMS portals, live classes, and DevSecAI programs.",
    "student-services": "Student Services supports academic, technical, payment, and enrollment requests through an accountable ticket workflow."
  };
  const ctaHref = kind === "careers" ? "/opportunities" : kind === "internship-board" ? "/opportunities" : kind === "opportunities" ? "/contact" : kind.includes("devsecai") ? "/register" : "/courses";
  return (
    <>
      <PageHero eyebrow="AtechSkills" title={titles[kind] ?? "AtechSkills"} text={descriptions[kind] ?? descriptions.about} ctaHref={ctaHref} cta={kind.includes("devsecai") ? "Register Now" : kind === "watch-intro" ? "Explore Courses" : "Continue"} />
      <section className="container-page py-12">
        {kind === "about" && <AboutContent />}
        {kind === "devsecai-bootcamp" && <ProgramContent type="bootcamp" />}
        {kind === "devsecai-summit" && <ProgramContent type="summit" />}
        {kind === "gallery" && <GalleryContent />}
        {kind === "opportunities" && <OpportunityBoard />}
        {kind === "careers" && <OpportunityBoard initialType="JOB" />}
        {kind === "internship-board" && <OpportunityBoard initialType="INTERNSHIP" />}
        {kind === "faq" && <FaqContent />}
        {kind === "watch-intro" && <IntroContent />}
        {kind === "student-services" && <StudentServicesContent />}
        {["blog", "privacy-policy", "terms-and-conditions"].includes(kind) && <PolicyContent kind={kind} />}
      </section>
    </>
  );
}

function AboutContent() {
  return (
    <div className="grid gap-8">
      <CeoMessageSection compact contained={false} />
      <div className="grid gap-5 md:grid-cols-4">
        {["Industry-recognized certificates", "Hands-on live projects", "Expert instructors", "Placement support"].map((item) => <Card key={item} className="p-6"><ShieldCheck className="text-brand-green" /><h2 className="mt-4 font-bold">{item}</h2></Card>)}
      </div>
      <SectionHeading eyebrow="Team" title="Built by a practical training team" text="AtechSkills is organized around learner support, instructor quality, and programs that can scale into enterprise-grade LMS operations." />
      <div className="grid gap-5 md:grid-cols-3">
        {teamMembers.map((member) => <Card key={member.name} className="p-6"><UsersRound className="text-brand-green" /><h3 className="mt-4 text-xl font-bold">{member.name}</h3><p className="mt-1 text-sm font-semibold text-brand-red">{member.role}</p><p className="mt-3 text-sm leading-6 text-slate-600">{member.bio}</p></Card>)}
      </div>
      <Card className="p-7"><p className="text-4xl font-black leading-none text-brand-green">"</p><p className="mt-2 text-lg leading-8 text-slate-700">{testimonials[1].quote}</p><p className="mt-4 text-sm font-bold">{testimonials[1].name} - {testimonials[1].role}</p></Card>
    </div>
  );
}

function ProgramContent({ type }: { type: "bootcamp" | "summit" }) {
  const isBootcamp = type === "bootcamp";
  const items = isBootcamp ? ["Secure AI foundations", "DevSecOps pipeline labs", "Cloud risk reviews", "Capstone presentation"] : ["Keynotes and panels", "Secure AI workshops", "Hiring and internship desk", "Event gallery and certificates"];
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <div className="grid gap-5 md:grid-cols-2">
        {items.map((item, index) => <Card key={item} className="p-6"><span className="text-sm font-bold text-brand-red">0{index + 1}</span><h2 className="mt-3 text-xl font-bold">{item}</h2><p className="mt-2 text-sm leading-6 text-slate-600">Designed for serious learners and professionals who need portfolio-ready evidence, not passive content.</p></Card>)}
      </div>
      <Card className="p-6">
        <h2 className="text-2xl font-bold">{isBootcamp ? "Bootcamp Flow" : "Summit Flow"}</h2>
        <div className="mt-5 grid gap-4 text-sm text-slate-700">
          {(isBootcamp ? ["Application", "Enrollment", "Live training", "Attendance", "Assignments", "Certificate"] : ["Registration", "Speaker schedule", "Check-in", "Sessions", "Gallery", "Follow-up"]).map((step) => <p key={step} className="flex gap-2"><CheckCircle2 className="text-brand-green" size={17} /> {step}</p>)}
        </div>
        <ButtonLink href={isBootcamp ? "/courses/devsecai-bootcamp-2025/enroll" : "/events/devsecai-summit-2025/register"} className="mt-6 w-full">{isBootcamp ? "Enroll in Bootcamp" : "Register for Summit"}</ButtonLink>
      </Card>
    </div>
  );
}

function GalleryContent() {
  const gallery = ["Live bootcamp labs", "Summit sessions", "Certificate ceremony", "Project presentations", "Instructor workshops", "Learner community"];
  return (
    <div className="grid gap-5 md:grid-cols-3">
      {gallery.map((item, index) => <Card key={item} className="overflow-hidden"><div className={`h-40 ${index % 2 === 0 ? "bg-brand-green" : "bg-brand-red"}`} /><div className="p-5"><h2 className="font-bold">{item}</h2><p className="mt-2 text-sm text-slate-600">Managed by the admin CMS with alt text, visibility, event linking, and image upload support.</p></div></Card>)}
    </div>
  );
}

function OpportunityContent({ title, items }: { title: string; items: typeof jobs }) {
  return (
    <div>
      <SectionHeading eyebrow="Opportunities" title={title} text="AtechSkills can publish jobs and internships through Daily Insights, categories, tags, featured posts, and admin workflows." />
      <div className="grid gap-4">
        {items.map((job) => <Card key={job.title} className="grid gap-3 p-5 md:grid-cols-[1fr_auto] md:items-center"><div><Badge>{job.tag}</Badge><h2 className="mt-3 text-xl font-bold">{job.title}</h2><p className="mt-1 text-sm text-slate-600">{job.company} - {job.location} - {job.type}</p></div><ButtonLink href="/contact" variant="secondary">Apply Interest</ButtonLink></Card>)}
      </div>
    </div>
  );
}

function FaqContent() {
  return <div className="grid gap-4">{faqs.map((item) => <Card key={item.question} className="p-6"><h2 className="text-lg font-bold">{item.question}</h2><p className="mt-2 leading-7 text-slate-600">{item.answer}</p></Card>)}</div>;
}

function IntroContent() {
  return (
    <Card className="grid gap-6 p-8 md:grid-cols-[180px_1fr] md:items-center">
      <div className="grid h-40 place-items-center rounded-lg bg-brand-green text-white"><PlayCircle size={64} /></div>
      <div><h2 className="text-2xl font-bold">Watch the AtechSkills learning flow</h2><p className="mt-3 leading-7 text-slate-600">This intro page is ready for a video embed. It already routes from the homepage CTA and can later load a Cloudinary, YouTube, Vimeo, or self-hosted video.</p><div className="mt-5 flex flex-wrap gap-3"><ButtonLink href="/courses">Explore Courses</ButtonLink><ButtonLink href="/student-dashboard" variant="secondary">Preview LMS</ButtonLink></div></div>
    </Card>
  );
}

function StudentServicesContent() {
  return <div className="grid gap-5 md:grid-cols-4">{supportTypes.map((item) => { const Icon = item.icon; return <Card key={item.label} className="p-6"><Icon className="text-brand-green" /><h2 className="mt-4 font-bold">{item.label}</h2><p className="mt-2 text-sm text-slate-600">Ticket assignment, replies, status tracking, and conversation history.</p></Card>; })}</div>;
}

function PolicyContent({ kind }: { kind: string }) {
  const copy = kind === "blog"
    ? ["Technical articles", "Course announcements", "Career guidance", "Event recaps"]
    : kind === "privacy-policy"
      ? ["Learner account data", "Enrollment and payment context", "Support ticket history", "Analytics and communication preferences"]
      : ["Enrollment rules", "Course access", "Certificate requirements", "Acceptable platform use"];
  return <div className="grid gap-5 md:grid-cols-2">{copy.map((item) => <Card key={item} className="p-6"><h2 className="text-xl font-bold">{item}</h2><p className="mt-2 text-sm leading-6 text-slate-600">This page is structured for CMS-managed legal and editorial content with clear routing, SEO metadata, and admin ownership.</p></Card>)}</div>;
}

export function ContactPage() {
  return (
    <section className="container-page grid gap-8 py-12 lg:grid-cols-[1fr_430px]">
      <div><Badge>Contact</Badge><h1 className="mt-4 text-5xl font-black">Speak with AtechSkills</h1><p className="mt-5 text-lg leading-8 text-slate-600">Admissions, enterprise training, student support, events, and partnerships all begin here.</p><div className="mt-8 grid gap-4 md:grid-cols-2">{supportTypes.map((item) => { const Icon = item.icon; return <Card key={item.label} className="p-5"><Icon className="text-brand-green" /><h2 className="mt-3 font-bold">{item.label}</h2></Card>; })}</div></div>
      <SmartForm type="contact" title="Send a Message" />
    </section>
  );
}

export function AuthPage({ mode }: { mode: "login" | "register" | "forgot-password" | "reset-password" }) {
  const title = { login: "Login", register: "Create your account", "forgot-password": "Recover password", "reset-password": "Reset password" }[mode];
  return (
    <section className="min-h-screen bg-slate-50 py-12">
      <div className="container-page grid min-h-[calc(100vh-96px)] items-center gap-8 lg:grid-cols-[1fr_430px]">
        <div><Badge>AtechSkills LMS</Badge><h1 className="mt-4 text-5xl font-black">{title}</h1><p className="mt-5 text-lg leading-8 text-slate-600">Access dashboards, enrolled content, live lectures, recordings, support, certificates, and admin tools based on your role.</p><div className="mt-8 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-brand-green"><p className="font-bold">Admin access for setup</p><p>Username: admin</p><p>Password: admin234</p></div></div>
        <AuthForm mode={mode} />
      </div>
    </section>
  );
}

export function DashboardPage({ role }: { role: keyof typeof portalCards }) {
  const labels = { student: "Student Dashboard", teacher: "Teacher Dashboard", admin: "Admin Dashboard", services: "Student Services Dashboard" };
  const dashboard = roleDashboards[role];
  return (
    <section className="min-h-screen bg-slate-50">
      <div className="border-b border-slate-200 bg-white">
        <div className="container-page flex min-h-20 flex-col gap-4 py-4 md:flex-row md:items-center md:justify-between">
          <div><Badge>Portal</Badge><h1 className="mt-2 text-3xl font-black">{labels[role]}</h1></div>
          <div className="flex flex-wrap gap-3"><ButtonLink href="/" variant="secondary">Website</ButtonLink><ButtonLink href="/notifications" variant="secondary">Notifications</ButtonLink><ButtonLink href="/login">Switch Role</ButtonLink></div>
        </div>
      </div>
      <div className="container-page grid gap-6 py-8 lg:grid-cols-[260px_1fr]">
        <aside className="rounded-lg border border-slate-200 bg-white p-4 shadow-card">
          {portalCards[role].slice(0, 8).map((item) => <Link href={`#${item.toLowerCase().replaceAll(" ", "-").replaceAll("&", "and")}`} key={item} className="block rounded-md px-3 py-3 text-sm font-semibold hover:bg-brand-mint">{item}</Link>)}
        </aside>
        <div>
          <div className="grid gap-4 md:grid-cols-4">
            {dashboard.kpis.map((item) => <Card key={item.label} className="p-5"><p className="text-sm text-slate-500">{item.label}</p><p className="mt-2 text-3xl font-black text-brand-green">{item.value}</p><p className="mt-1 text-xs text-slate-500">{item.caption}</p></Card>)}
          </div>
          <div className="mt-6 grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
            <Card className="overflow-hidden">
              <div className="border-b border-slate-200 p-5"><h2 className="text-xl font-bold">{dashboard.primaryTitle}</h2><p className="mt-1 text-sm text-slate-500">{dashboard.primaryText}</p></div>
              <div className="divide-y divide-slate-100">
                {dashboard.rows.map((row) => (
                  <div key={row.title} className="grid gap-3 p-5 md:grid-cols-[1fr_auto] md:items-center">
                    <div><h3 className="font-bold">{row.title}</h3><p className="mt-1 text-sm text-slate-600">{row.detail}</p></div>
                    <span className="rounded-full bg-brand-mint px-3 py-1 text-xs font-bold text-brand-green">{row.status}</span>
                  </div>
                ))}
              </div>
            </Card>
            <Card className="p-5">
              <h2 className="text-xl font-bold">{dashboard.secondaryTitle}</h2>
              <div className="mt-4 grid gap-3">
                {dashboard.actions.map((action) => <ButtonLink key={action.label} href={action.href} variant={action.primary ? "primary" : "secondary"} className="justify-between">{action.label}<ArrowRight size={16} /></ButtonLink>)}
              </div>
            </Card>
          </div>
          {role === "student" && <StudentLearningCenter />}
          {role === "admin" && <AdminControlCenter />}
          <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {dashboardModules[role].map((item) => <Card key={item.title} className="p-6" ><div className="flex items-start justify-between gap-3"><div><FileText className="text-brand-green" /><h2 className="mt-4 text-xl font-bold">{item.title}</h2><p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p></div><ArrowRight className="text-slate-400" /></div></Card>)}
          </div>
        </div>
      </div>
    </section>
  );
}

export function SupportTicketPage() {
  return (
    <section className="container-page grid gap-8 py-12 lg:grid-cols-[1fr_430px]">
      <div><Badge>Support</Badge><h1 className="mt-4 text-5xl font-black">Create a student support ticket</h1><p className="mt-5 text-lg leading-8 text-slate-600">Academic, technical, payment, and enrollment requests are routed to Student Services with conversation history and resolution status.</p><Card className="mt-8 p-6"><Ticket className="text-brand-green" /><h2 className="mt-3 font-bold">Ticket workflow</h2><p className="mt-2 text-sm text-slate-600">Open, assign, reply, mark resolved, and audit each support query.</p></Card></div>
      <SmartForm type="support" title="Open Ticket" />
    </section>
  );
}
