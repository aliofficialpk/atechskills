import Image from "next/image";
import { Award, BookOpenCheck, Target, UsersRound } from "lucide-react";

const paragraphs = [
  "At AtechSkills, our mission is to empower individuals with industry-relevant skills through practical learning, real-world projects, and continuous innovation.",
  "We are committed to delivering quality education in DevSecOps, AI, Cybersecurity, and emerging technologies to help learners grow, succeed, and lead."
];

const stats = [
  {
    label: "Learners",
    value: "50K+",
    icon: UsersRound,
    color: "text-brand-green",
    circle: "bg-brand-green/10"
  },
  {
    label: "Courses",
    value: "100+",
    icon: BookOpenCheck,
    color: "text-brand-red",
    circle: "bg-brand-red/[0.12]"
  },
  {
    label: "Expert Trainers",
    value: "200+",
    icon: Award,
    color: "text-brand-green",
    circle: "bg-brand-green/10"
  },
  {
    label: "Success Rate",
    value: "98%",
    icon: Target,
    color: "text-brand-red",
    circle: "bg-brand-red/[0.12]"
  }
];

function AccentLine({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? "mt-3 flex items-center" : "mt-4 flex items-center"}>
      <span className={compact ? "h-0.5 w-8 bg-brand-red" : "h-1 w-11 bg-brand-red"} />
      <span className={compact ? "h-0.5 w-8 bg-brand-green" : "h-1 w-11 bg-brand-green"} />
      <span className={compact ? "h-0.5 w-8 bg-brand-red" : "h-1 w-11 bg-brand-red"} />
    </div>
  );
}

function Signature({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? "mt-5" : "mt-6"}>
      <p
        className={compact ? "text-3xl leading-none text-slate-950" : "text-3xl leading-none text-slate-950"}
        style={{ fontFamily: '"Segoe Script", "Brush Script MT", cursive' }}
      >
        Mustansar Riaz
      </p>
      <p className={compact ? "mt-3 text-xl font-black text-brand-green" : "mt-3 text-xl font-black text-brand-green"}>Mustansar Riaz</p>
      <p className={compact ? "mt-1 text-sm text-slate-500" : "mt-1 text-sm text-slate-500"}>Chief Executive Officer, AtechSkills</p>
    </div>
  );
}

function StatsPanel({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={
        compact
          ? "mt-5 grid grid-cols-4 gap-2 rounded-lg border border-slate-200 bg-white p-3 shadow-[0_12px_30px_rgba(15,23,42,0.06)]"
          : "mt-5 grid grid-cols-4 gap-3 rounded-lg border border-slate-200 bg-white px-5 py-3 shadow-[0_12px_34px_rgba(15,23,42,0.06)]"
      }
    >
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div key={stat.label} className="text-center">
            <span className={`mx-auto grid place-items-center rounded-full ${stat.circle} ${stat.color} ${compact ? "h-9 w-9" : "h-10 w-10"}`}>
              <Icon size={compact ? 19 : 22} strokeWidth={2.5} />
            </span>
            <div className={`${compact ? "mt-2 text-xl" : "mt-2 text-2xl"} font-black leading-none ${stat.color}`}>{stat.value}</div>
            <div className={`${compact ? "mt-1 text-[10px]" : "mt-1 text-xs"} leading-tight text-slate-700`}>{stat.label}</div>
          </div>
        );
      })}
    </div>
  );
}

export function CeoMessageSection({ compact = false, contained = true }: { compact?: boolean; contained?: boolean }) {
  const shellClass = contained
    ? "mx-auto w-[min(1240px,calc(100vw-32px))]"
    : "relative left-1/2 w-[min(1240px,calc(100vw-32px))] -translate-x-1/2";

  return (
    <section className={compact ? "bg-white py-8" : "bg-white py-10 md:py-12"}>
      <div className={shellClass}>
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-soft lg:hidden">
          <div className="p-4 sm:p-5">
            <div className="grid grid-cols-[112px_1fr] items-center gap-4 sm:grid-cols-[150px_1fr]">
              <div className="relative aspect-[4/5] overflow-hidden rounded-md bg-slate-100">
                <Image
                  src="/images/ceo-portrait-light.png"
                  alt="Mustansar Riaz, Chief Executive Officer of AtechSkills"
                  fill
                  sizes="150px"
                  className="object-cover object-center"
                  priority={!compact}
                />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-brand-green sm:text-xs">Message from our CEO</p>
                <AccentLine compact />
                <h2 className="mt-4 text-[25px] font-black leading-tight tracking-normal text-slate-900 sm:text-4xl">
                  Building Skills.
                  <span className="block text-brand-red">Creating Futures.</span>
                </h2>
              </div>
            </div>

            <div className="mt-5 space-y-3 text-[15px] leading-7 text-slate-700">
              {paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>

            <Signature compact />
            <StatsPanel compact />
          </div>
        </div>

        <div className="hidden overflow-hidden rounded-lg border border-slate-200 bg-white shadow-soft lg:grid lg:min-h-[580px] lg:grid-cols-[34%_66%]">
          <div className="relative min-h-[580px] bg-slate-100">
            <Image
              src="/images/ceo-portrait-light.png"
              alt="Mustansar Riaz, Chief Executive Officer of AtechSkills"
              fill
              sizes="(min-width: 1280px) 422px, 34vw"
              className="object-cover object-center"
              priority={!compact}
            />
          </div>

          <div className="flex items-center px-10 py-7 xl:px-14">
            <div className="w-full">
              <p className="text-base font-black uppercase tracking-[0.22em] text-brand-green">Message from our CEO</p>
              <AccentLine />

              <h2 className="mt-6 max-w-3xl text-4xl font-black leading-tight tracking-normal text-slate-900 xl:text-[44px]">
                Building Skills.
                <span className="block text-brand-red">Creating Futures.</span>
              </h2>

              <div className="mt-5 max-w-3xl space-y-3 text-[15px] leading-6 text-slate-700">
                {paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>

              <Signature />
              <StatsPanel />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
