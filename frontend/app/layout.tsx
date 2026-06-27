import type { Metadata } from "next";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:8000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "AtechSkills | Secure, Practical Technology Training",
    template: "%s | AtechSkills"
  },
  description:
    "AtechSkills delivers industry-focused courses, DevSecAI bootcamps, live classes, events, internships, and career-ready LMS training.",
  openGraph: {
    title: "AtechSkills",
    description: "Upskill. Secure. Innovate with AtechSkills.",
    url: siteUrl,
    siteName: "AtechSkills",
    images: [{ url: "/images/atechskills-logo.jpeg", width: 800, height: 600, alt: "AtechSkills logo" }],
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "AtechSkills",
    description: "Professional LMS and technology training ecosystem."
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
