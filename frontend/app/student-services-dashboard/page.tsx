import { DashboardPage } from "@/components/page-sections";
import { createMetadata } from "@/lib/seo";
export const metadata = createMetadata({ title: "Student Services Dashboard", description: "AtechSkills student services dashboard.", path: "/student-services-dashboard", noIndex: true });
export default function Page() { return <DashboardPage role="services" />; }
