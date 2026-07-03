import type { MetadataRoute } from "next";
import { absoluteSiteUrl } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const entries: Array<{ path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }> = [
    { path: "/", priority: 1, changeFrequency: "weekly" },
    { path: "/courses", priority: 0.95, changeFrequency: "daily" },
    { path: "/events", priority: 0.9, changeFrequency: "daily" },
    { path: "/opportunities", priority: 0.9, changeFrequency: "daily" },
    { path: "/daily-insights", priority: 0.85, changeFrequency: "daily" },
    { path: "/about", priority: 0.8, changeFrequency: "monthly" },
    { path: "/devsecai-bootcamp", priority: 0.8, changeFrequency: "weekly" },
    { path: "/devsecai-summit", priority: 0.8, changeFrequency: "weekly" },
    { path: "/blog", priority: 0.75, changeFrequency: "weekly" },
    { path: "/careers", priority: 0.75, changeFrequency: "daily" },
    { path: "/internship-board", priority: 0.75, changeFrequency: "daily" },
    { path: "/gallery", priority: 0.65, changeFrequency: "monthly" },
    { path: "/contact", priority: 0.7, changeFrequency: "monthly" },
    { path: "/student-services", priority: 0.65, changeFrequency: "monthly" },
    { path: "/faq", priority: 0.65, changeFrequency: "monthly" },
    { path: "/privacy-policy", priority: 0.4, changeFrequency: "yearly" },
    { path: "/terms-and-conditions", priority: 0.4, changeFrequency: "yearly" }
  ];

  return entries.map((entry) => ({
    url: absoluteSiteUrl(entry.path),
    lastModified: now,
    changeFrequency: entry.changeFrequency,
    priority: entry.priority
  }));
}
