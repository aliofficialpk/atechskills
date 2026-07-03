import { DashboardPage } from "@/components/page-sections";
import { createMetadata } from "@/lib/seo";
export const metadata = createMetadata({ title: "Teacher Dashboard", description: "AtechSkills teacher dashboard.", path: "/teacher-dashboard", noIndex: true });
export default function Page() { return <DashboardPage role="teacher" />; }
