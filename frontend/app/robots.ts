import type { MetadataRoute } from "next";
import { absoluteSiteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin-dashboard",
          "/teacher-dashboard",
          "/student-dashboard",
          "/student-services-dashboard",
          "/notifications",
          "/login",
          "/register",
          "/forgot-password",
          "/reset-password"
        ]
      }
    ],
    sitemap: absoluteSiteUrl("/sitemap.xml")
  };
}
