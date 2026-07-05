"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock, Filter, GraduationCap, Search, ShieldCheck } from "lucide-react";
import { Badge, ButtonLink, Card } from "@/components/ui";
import { EnrollmentRequestForm } from "@/components/forms";
import { formatCurrency } from "@/lib/utils";

const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:9000/api/v1";

type Lesson = {
  id: string;
  title: string;
  content?: string | null;
  videoUrl?: string | null;
  resourceUrl?: string | null;
};

type CourseSection = {
  id: string;
  title: string;
  lessons: Lesson[];
};

type Course = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  description?: string | null;
  thumbnailUrl?: string | null;
  price: number | string;
  discountPrice?: number | string | null;
  level: string;
  duration: string;
  isFree: boolean;
  classStartAt?: string | null;
  scheduleText?: string | null;
  prerequisites: string[];
  outcomes: string[];
  status: string;
  seatCapacity?: number | null;
  category?: { name: string; slug: string } | null;
  instructor?: { user?: { name: string; email: string } } | null;
  sections?: CourseSection[];
  sessions?: { id: string; title: string; startsAt: string; expectedDurationMinutes: number }[];
};

function priceFor(course: Course) {
  return Number(course.discountPrice ?? course.price ?? 0);
}

function courseImage(course: Course) {
  return course.thumbnailUrl || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80";
}

function publicCourses(value: unknown): Course[] {
  return asCourseArray(value).filter((course) => course.status === "PUBLISHED");
}

function asCourseArray(value: unknown): Course[] {
  return Array.isArray(value) ? value : [];
}

function CourseEmptyState() {
  return (
    <Card className="p-8 text-center">
      <GraduationCap className="mx-auto text-brand-green" size={42} />
      <h2 className="mt-4 text-2xl font-black">No published courses yet</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">
        Our next public cohorts are being prepared. Contact admissions for upcoming DevSecOps, cybersecurity, AI, cloud, programming, and data science training schedules.
      </p>
      <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
        <ButtonLink href="/contact">Talk to Admissions</ButtonLink>
        <ButtonLink href="/daily-insights" variant="secondary">View Updates</ButtonLink>
      </div>
    </Card>
  );
}

export function CourseCatalog() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${apiBase}/courses`)
      .then((response) => response.json().then((data) => ({ ok: response.ok, data })))
      .then(({ ok, data }) => {
        if (!ok || !Array.isArray(data)) throw new Error(data.error ?? "Unable to load courses");
        setCourses(publicCourses(data));
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load courses"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    return courses.filter((course) => {
      const matchesSearch = !normalized || [course.title, course.summary, course.category?.name, course.instructor?.user?.name].join(" ").toLowerCase().includes(normalized);
      const matchesLevel = level === "all" || course.level.toLowerCase() === level;
      return matchesSearch && matchesLevel;
    });
  }, [courses, level, search]);

  return (
    <section className="container-page py-12">
      <div className="mb-6 grid gap-3 rounded-lg border border-slate-200 bg-white p-4 md:grid-cols-[1fr_auto_auto]">
        <label className="flex items-center gap-3 rounded-md bg-slate-50 px-3 py-3">
          <Search size={18} />
          <input value={search} onChange={(event) => setSearch(event.target.value)} className="w-full bg-transparent outline-none" placeholder="Search courses, category, instructor" />
        </label>
        <button onClick={() => setLevel("beginner")} className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-200 px-4 py-3 text-sm font-semibold hover:border-brand-green"><Filter size={16} /> Beginner</button>
        <button onClick={() => setLevel("all")} className="rounded-md border border-slate-200 px-4 py-3 text-sm font-semibold hover:border-brand-green">All Levels</button>
      </div>
      {loading && <p className="rounded-lg bg-slate-50 p-5 text-sm text-slate-600">Loading published courses...</p>}
      {error && <p className="rounded-lg bg-red-50 p-5 text-sm text-red-700">{error}</p>}
      {!loading && !error && filtered.length === 0 && <CourseEmptyState />}
      <div className="grid gap-6 md:grid-cols-3">
        {filtered.map((course) => <ApiCourseCard key={course.id} course={course} />)}
      </div>
    </section>
  );
}

export function CourseHomePreview() {
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    fetch(`${apiBase}/courses`)
      .then((response) => response.json())
      .then((data) => setCourses(publicCourses(data).slice(0, 3)))
      .catch(() => setCourses([]));
  }, []);

  if (courses.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="text-xl font-black">Courses are being prepared</h3>
        <p className="mt-2 text-sm leading-6 text-slate-600">New public cohorts will appear here as soon as enrollment opens. You can still contact admissions for upcoming schedules and guidance.</p>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <ButtonLink href="/courses">Browse Courses</ButtonLink>
          <ButtonLink href="/contact" variant="secondary">Contact Admissions</ButtonLink>
        </div>
      </Card>
    );
  }

  return (
    <>
      {courses.map((course) => <ApiCourseCard key={course.id} course={course} />)}
    </>
  );
}

export function ApiCourseCard({ course }: { course: Course }) {
  return (
    <Card className="overflow-hidden">
      <Image src={courseImage(course)} alt={course.title} width={640} height={360} className="h-48 w-full object-cover" />
      <div className="p-5">
        <div className="flex items-center justify-between gap-3"><Badge>{course.category?.name ?? course.level}</Badge><span className="text-xs font-semibold text-brand-green">{course.status}</span></div>
        <h2 className="mt-3 text-xl font-bold">{course.title}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">{course.summary}</p>
        <p className="mt-3 text-xs font-semibold text-slate-500">{course.instructor?.user?.name ? `Teacher: ${course.instructor.user.name}` : "Teacher to be assigned"}</p>
        <div className="mt-4 flex items-center justify-between"><span className="font-black text-brand-green">{course.isFree ? "Free" : formatCurrency(priceFor(course))}</span><ButtonLink href={`/courses/${course.slug}`} variant="secondary" className="min-h-9 px-3 py-2">View Course</ButtonLink></div>
      </div>
    </Card>
  );
}

export function CourseDetailsView({ slug }: { slug: string }) {
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${apiBase}/courses/${slug}`)
      .then((response) => response.json().then((data) => ({ ok: response.ok, data })))
      .then(({ ok, data }) => {
        if (!ok) throw new Error(data.error ?? "Course not found");
        if (data.status !== "PUBLISHED") throw new Error("Course not found");
        setCourse(data);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load course"))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <section className="container-page py-12"><p className="rounded-lg bg-slate-50 p-5 text-sm text-slate-600">Loading course details...</p></section>;
  if (error || !course) return <section className="container-page py-12"><CourseEmptyState /></section>;

  return (
    <>
      <section className="bg-slate-50 py-12">
        <div className="container-page grid gap-8 lg:grid-cols-[1fr_380px]">
          <div>
            <Badge>{course.category?.name ?? course.level}</Badge>
            <h1 className="mt-4 text-4xl font-black leading-tight md:text-6xl">{course.title}</h1>
            <p className="mt-5 text-lg leading-8 text-slate-600">{course.description || course.summary}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href={`/courses/${course.slug}/enroll`}>Enroll Now</ButtonLink>
              <ButtonLink href="/student-dashboard" variant="secondary">Preview LMS</ButtonLink>
            </div>
          </div>
          <Card className="overflow-hidden">
            <Image src={courseImage(course)} alt={course.title} width={640} height={420} className="h-56 w-full object-cover" />
            <div className="p-5">
              <div className="flex items-end gap-2">
                <span className="text-3xl font-black text-brand-green">{course.isFree ? "Free" : formatCurrency(priceFor(course))}</span>
                {!course.isFree && course.discountPrice && <span className="pb-1 text-sm text-slate-400 line-through">{formatCurrency(Number(course.price))}</span>}
              </div>
              <div className="mt-5 grid gap-3 text-sm text-slate-700">
                <span className="flex items-center gap-2"><Clock size={17} /> {course.duration}</span>
                <span className="flex items-center gap-2"><CheckCircle2 size={17} /> {course.level}</span>
                <span className="flex items-center gap-2"><ShieldCheck size={17} /> Certificate included</span>
                {course.scheduleText && <span>{course.scheduleText}</span>}
                {course.instructor?.user?.name && <span>Teacher: {course.instructor.user.name}</span>}
              </div>
            </div>
          </Card>
        </div>
      </section>
      <section className="container-page grid gap-8 py-12 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <h2 className="text-2xl font-bold">Curriculum</h2>
          <div className="mt-5 grid gap-3">
            {(course.sections ?? []).length === 0 && <p className="text-sm text-slate-600">Curriculum modules will appear after admin adds sections and lessons.</p>}
            {(course.sections ?? []).map((section, index) => (
              <div key={section.id} className="rounded-md border border-slate-200 p-4">
                <span className="text-sm font-semibold text-brand-red">Module {index + 1}</span>
                <h3 className="font-bold">{section.title}</h3>
                <div className="mt-3 grid gap-2">
                  {section.lessons.map((lesson) => <p key={lesson.id} className="text-sm text-slate-600">{lesson.title}</p>)}
                </div>
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-6">
          <h2 className="text-2xl font-bold">Outcomes</h2>
          <div className="mt-5 grid gap-3">
            {course.outcomes.length === 0 && <p className="text-sm text-slate-600">Course outcomes will be added by admin.</p>}
            {course.outcomes.map((outcome) => <p key={outcome} className="flex gap-2 text-sm text-slate-700"><CheckCircle2 className="mt-0.5 shrink-0 text-brand-green" size={17} /> {outcome}</p>)}
          </div>
          {course.prerequisites.length > 0 && <h3 className="mt-6 font-bold">Prerequisites</h3>}
          <div className="mt-3 grid gap-2">{course.prerequisites.map((item) => <p key={item} className="text-sm text-slate-600">{item}</p>)}</div>
        </Card>
      </section>
    </>
  );
}

export function EnrollmentCourseGate({ slug }: { slug: string }) {
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${apiBase}/courses/${slug}`)
      .then((response) => response.json().then((data) => ({ ok: response.ok, data })))
      .then(({ ok, data }) => {
        if (!ok) throw new Error(data.error ?? "Course not found");
        if (data.status !== "PUBLISHED") throw new Error("Course not found");
        setCourse(data);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load course"))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <section className="container-page py-12"><p className="rounded-lg bg-slate-50 p-5 text-sm text-slate-600">Loading enrollment...</p></section>;
  if (error || !course) return <section className="container-page py-12"><CourseEmptyState /></section>;

  return (
    <section className="container-page grid gap-8 py-12 lg:grid-cols-[1fr_420px]">
      <div>
        <Badge>Enrollment</Badge>
        <h1 className="mt-4 text-4xl font-black">Enroll in {course.title}</h1>
        <p className="mt-4 text-slate-600">Login or create an account first. Enrollment is attached to that same email. Send the course fee to the ATechSkills Bank Alfalah account, upload payment proof, and admin will verify it before activating your course dashboard.</p>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {["Same-account enrollment", "Bank Alfalah proof upload", "Admin payment verification", "Dashboard course activation"].map((item) => <Card key={item} className="p-5"><CheckCircle2 className="text-brand-green" /><h3 className="mt-3 font-bold">{item}</h3></Card>)}
        </div>
        <div className="mt-6 rounded-lg border border-slate-200 bg-white p-5 text-sm text-slate-700">
          <p className="font-black text-brand-green">Course fee: {course.isFree ? "Free" : formatCurrency(priceFor(course))}</p>
          {course.classStartAt && <p className="mt-2">Class starts: {new Date(course.classStartAt).toLocaleString()}</p>}
          {course.scheduleText && <p className="mt-2">{course.scheduleText}</p>}
          <Link href="/courses" className="mt-4 inline-block font-bold text-brand-red">Back to courses</Link>
        </div>
      </div>
      <EnrollmentRequestForm slug={course.slug} courseTitle={course.title} />
    </section>
  );
}
