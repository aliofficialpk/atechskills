import Link from "next/link";
import { cn } from "@/lib/utils";

export function ButtonLink({
  href,
  children,
  variant = "primary",
  className
}: {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-5 py-3 text-sm font-semibold transition",
        variant === "primary" && "bg-brand-green text-white shadow-soft hover:bg-brand-forest",
        variant === "secondary" && "border border-slate-200 bg-white text-slate-950 hover:border-brand-green hover:text-brand-green",
        variant === "ghost" && "text-brand-green hover:bg-brand-mint",
        variant === "danger" && "bg-brand-red text-white hover:bg-red-800",
        className
      )}
    >
      {children}
    </Link>
  );
}

export function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn("inline-flex items-center rounded-full bg-brand-mint px-3 py-1 text-xs font-semibold text-brand-green", className)}>{children}</span>;
}

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("rounded-lg border border-slate-200 bg-white shadow-card", className)}>{children}</div>;
}

export function SectionHeading({
  eyebrow,
  title,
  text,
  action
}: {
  eyebrow?: string;
  title: string;
  text?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="max-w-2xl">
        {eyebrow && <Badge>{eyebrow}</Badge>}
        <h2 className="mt-3 text-3xl font-bold tracking-normal text-slate-950 md:text-4xl">{title}</h2>
        {text && <p className="mt-3 text-base leading-7 text-slate-600">{text}</p>}
      </div>
      {action}
    </div>
  );
}
