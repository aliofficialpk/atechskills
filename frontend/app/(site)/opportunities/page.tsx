import { StaticInfoPage } from "@/components/page-sections";

export const metadata = {
  title: "Jobs and Internship Opportunities",
  description: "Explore jobs, internships, apprenticeships, deadlines, and application links published by AtechSkills."
};

export default function Page() {
  return <StaticInfoPage kind="opportunities" />;
}
