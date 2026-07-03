import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AtechSkills",
    short_name: "AtechSkills",
    description: "Practical technology training, bootcamps, internships, events, and LMS learning.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#064e3b",
    icons: [
      {
        src: "/images/atechskills-logo.jpeg",
        sizes: "512x512",
        type: "image/jpeg"
      }
    ]
  };
}
