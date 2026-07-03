import { DashboardPage } from "@/components/page-sections";
import { createMetadata } from "@/lib/seo";
export const metadata = createMetadata({ title: "Student Dashboard", description: "AtechSkills student dashboard.", path: "/student-dashboard", noIndex: true });
export default function Page() { return <DashboardPage role="student" />; }
