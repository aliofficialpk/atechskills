import { StaticInfoPage } from "@/components/page-sections";
import { createMetadata } from "@/lib/seo";
export const metadata = createMetadata({ title: "Internship Board", description: "Find internships and early-career opportunities in cybersecurity, cloud, AI, programming, and DevSecOps through AtechSkills.", path: "/internship-board" });
export default function Page() { return <StaticInfoPage kind="internship-board" />; }
