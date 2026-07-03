import { StaticInfoPage } from "@/components/page-sections";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({ title: "Jobs and Internship Opportunities", description: "Explore jobs, internships, apprenticeships, deadlines, and application links published by AtechSkills for learners and graduates.", path: "/opportunities", keywords: ["jobs", "internships", "careers"] });

export default function Page() {
  return <StaticInfoPage kind="opportunities" />;
}
