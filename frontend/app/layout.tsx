import type { Metadata } from "next";
import "./globals.css";
import { createMetadata, organizationJsonLd, siteConfig, websiteJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  ...createMetadata({
    title: "AtechSkills | Cybersecurity, DevSecOps, AI and Cloud Training",
    description: siteConfig.description,
    path: "/"
  }),
  applicationName: siteConfig.name,
  appleWebApp: { capable: true, title: siteConfig.name },
  formatDetection: { telephone: false },
  icons: {
    icon: "/images/atechskills-logo.jpeg",
    apple: "/images/atechskills-logo.jpeg"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }} />
        {children}
      </body>
    </html>
  );
}
