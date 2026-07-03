import type { Metadata } from "next";

export const siteConfig = {
  name: "AtechSkills",
  domain: "atechskills.com",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "https://atechskills.com",
  description:
    "AtechSkills delivers practical technology courses, cybersecurity training, DevSecOps, AI, cloud computing, live bootcamps, internships, events, and LMS-based career development.",
  logo: "/images/atechskills-logo.jpeg",
  keywords: [
    "AtechSkills",
    "technology training",
    "cybersecurity courses",
    "DevSecOps bootcamp",
    "AI training",
    "cloud computing courses",
    "online LMS Pakistan",
    "IT internships",
    "secure software training"
  ]
};

export function absoluteSiteUrl(path = "") {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${siteConfig.url}${cleanPath === "/" ? "" : cleanPath}`;
}

export function createMetadata({
  title,
  description,
  path = "/",
  image = siteConfig.logo,
  noIndex = false,
  keywords = []
}: {
  title: string;
  description: string;
  path?: string;
  image?: string;
  noIndex?: boolean;
  keywords?: string[];
}): Metadata {
  const url = absoluteSiteUrl(path);
  return {
    title,
    description,
    keywords: [...siteConfig.keywords, ...keywords],
    alternates: { canonical: url },
    robots: noIndex ? { index: false, follow: false } : { index: true, follow: true },
    openGraph: {
      title,
      description,
      url,
      siteName: siteConfig.name,
      images: [{ url: image, width: 1200, height: 630, alt: `${siteConfig.name} preview` }],
      type: "website",
      locale: "en_US"
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image]
    }
  };
}

export const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",
  name: siteConfig.name,
  url: siteConfig.url,
  logo: absoluteSiteUrl(siteConfig.logo),
  description: siteConfig.description,
  sameAs: ["https://www.atechsole.com/"],
  areaServed: ["Pakistan", "United States", "Worldwide"],
  offers: {
    "@type": "OfferCatalog",
    name: "Technology training programs",
    itemListElement: [
      { "@type": "Offer", itemOffered: { "@type": "Course", name: "Cybersecurity Training" } },
      { "@type": "Offer", itemOffered: { "@type": "Course", name: "DevSecOps Training" } },
      { "@type": "Offer", itemOffered: { "@type": "Course", name: "AI and Cloud Computing Training" } }
    ]
  }
};

export const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: siteConfig.name,
  url: siteConfig.url,
  potentialAction: {
    "@type": "SearchAction",
    target: `${siteConfig.url}/daily-insights?search={search_term_string}`,
    "query-input": "required name=search_term_string"
  }
};
