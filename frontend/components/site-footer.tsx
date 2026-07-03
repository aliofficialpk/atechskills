import Link from "next/link";
import Image from "next/image";
import { navItems } from "@/lib/data";

const links = ["FAQ", "Privacy Policy", "Terms & Conditions", "Careers", "Internship Board", "Student Services"];

export function SiteFooter() {
  return (
    <footer className="bg-brand-forest text-white">
      <div className="container-page grid gap-10 py-12 md:grid-cols-[1.2fr_1fr_1fr_1fr]">
        <div>
          <Image src="/images/atechskills-logo.jpeg" alt="AtechSkills" width={150} height={72} className="mb-4 h-14 w-auto rounded bg-white object-contain p-1" />
          <p className="max-w-sm text-sm leading-6 text-emerald-50">AtechSkills builds secure, practical, career-ready technology education for professionals, teams, and future founders.</p>
        </div>
        <div>
          <h3 className="font-semibold">Explore</h3>
          <div className="mt-4 grid gap-3 text-sm text-emerald-50">
            {navItems.slice(1).map((item) => <Link key={item.href} href={item.href}>{item.label}</Link>)}
          </div>
        </div>
        <div>
          <h3 className="font-semibold">Platform</h3>
          <div className="mt-4 grid gap-3 text-sm text-emerald-50">
            {links.map((label) => <Link key={label} href={`/${label.toLowerCase().replaceAll(" ", "-").replace("&", "and")}`}>{label}</Link>)}
          </div>
        </div>
        <div>
          <h3 className="font-semibold">Contact</h3>
          <div className="mt-4 grid gap-3 text-sm text-emerald-50">
            <Link href="mailto:hello@atechskills.com">hello@atechskills.com</Link>
            <Link href="/contact">Admissions and enterprise training</Link>
            <Link href="/student-services">Student services portal</Link>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-sm text-emerald-50">&copy; 2026 AtechSkills. All rights reserved.</div>
    </footer>
  );
}
