import { CoursesIndex } from "@/components/page-sections";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({ title: "Technology Courses and Live Bootcamps", description: "Browse AtechSkills courses in cybersecurity, DevSecOps, AI, cloud computing, programming, and data science with live classes, recordings, assignments, and certificates.", path: "/courses", keywords: ["courses", "bootcamps", "certificates"] });

export default function Page() {
  return <CoursesIndex />;
}
