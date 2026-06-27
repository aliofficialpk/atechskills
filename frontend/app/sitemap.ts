import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/utils";

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = ["/", "/about", "/courses", "/events", "/devsecai-bootcamp", "/devsecai-summit", "/daily-insights", "/blog", "/gallery", "/contact", "/careers", "/internship-board", "/faq", "/privacy-policy", "/terms-and-conditions"];
  return paths.map((path) => ({ url: absoluteUrl(path), lastModified: new Date(), changeFrequency: "weekly", priority: path === "/" ? 1 : 0.7 }));
}
