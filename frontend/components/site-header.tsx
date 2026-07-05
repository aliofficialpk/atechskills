"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Menu, Search, UserCircle, X } from "lucide-react";
import { useEffect, useState } from "react";
import { navItems } from "@/lib/data";
import { ButtonLink } from "@/components/ui";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<{ name?: string; email?: string; roles?: string[] } | null>(null);

  function readUser() {
    try {
      const raw = localStorage.getItem("atechskills_user");
      setUser(raw ? JSON.parse(raw) : null);
    } catch {
      setUser(null);
    }
  }

  function dashboardForRoles(roles: string[] = []) {
    if (roles.some((role) => ["Super Admin", "Admin"].includes(role))) return "/admin-dashboard";
    if (roles.includes("Teacher")) return "/teacher-dashboard";
    if (roles.includes("Student Services")) return "/student-services-dashboard";
    return "/student-dashboard";
  }

  function logout() {
    localStorage.removeItem("atechskills_access_token");
    localStorage.removeItem("atechskills_refresh_token");
    localStorage.removeItem("atechskills_user");
    setUser(null);
    setOpen(false);
    window.dispatchEvent(new Event("atechskills:auth-changed"));
  }

  useEffect(() => {
    readUser();
    window.addEventListener("storage", readUser);
    window.addEventListener("atechskills:auth-changed", readUser);
    return () => {
      window.removeEventListener("storage", readUser);
      window.removeEventListener("atechskills:auth-changed", readUser);
    };
  }, []);

  const dashboardHref = dashboardForRoles(user?.roles ?? []);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="container-page flex h-20 items-center justify-between gap-4">
        <Link href="/" className="focus-ring flex items-center gap-3 rounded-md">
          <Image src="/images/atechskills-logo.jpeg" alt="AtechSkills" width={150} height={72} className="h-14 w-auto object-contain" priority />
        </Link>
        <nav className="hidden items-center gap-7 text-sm font-medium text-slate-800 lg:flex">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className={cn("border-b-2 border-transparent py-7 transition hover:text-brand-red", pathname === item.href && "border-brand-red text-brand-green")}>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-3 lg:flex">
          <Link href="/daily-insights?search=open" aria-label="Search" className="focus-ring rounded-md p-2 text-slate-700 hover:bg-slate-100">
            <Search size={21} />
          </Link>
          {user ? (
            <>
              <ButtonLink href={dashboardHref} variant="secondary" className="min-h-10 px-4 py-2">
                <UserCircle size={17} /> {user.name ?? "Profile"}
              </ButtonLink>
              <button onClick={logout} className="focus-ring inline-flex min-h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50">
                <LogOut size={16} /> Logout
              </button>
            </>
          ) : (
            <>
              <ButtonLink href="/login" variant="secondary" className="min-h-10 px-4 py-2">Login</ButtonLink>
              <ButtonLink href="/register" className="min-h-10 px-4 py-2">Get Started</ButtonLink>
            </>
          )}
        </div>
        <button className="focus-ring rounded-md p-2 lg:hidden" onClick={() => setOpen((value) => !value)} aria-label="Toggle navigation">
          {open ? <X /> : <Menu />}
        </button>
      </div>
      {open && (
        <div className="border-t border-slate-200 bg-white lg:hidden">
          <div className="container-page grid gap-2 py-4">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className="rounded-md px-3 py-3 font-medium hover:bg-brand-mint">
                {item.label}
              </Link>
            ))}
            {user ? (
              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                <ButtonLink href={dashboardHref} variant="secondary">Open Dashboard</ButtonLink>
                <button onClick={logout} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-brand-green px-5 py-3 text-sm font-semibold text-white">
                  <LogOut size={16} /> Logout
                </button>
              </div>
            ) : (
              <div className="mt-2 grid grid-cols-2 gap-3">
                <ButtonLink href="/login" variant="secondary">Login</ButtonLink>
                <ButtonLink href="/register">Get Started</ButtonLink>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
