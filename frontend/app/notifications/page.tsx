import { DashboardPage } from "@/components/page-sections";
import { createMetadata } from "@/lib/seo";
export const metadata = createMetadata({ title: "Notifications", description: "AtechSkills LMS notifications.", path: "/notifications", noIndex: true });
export default function Page() { return <DashboardPage role="student" />; }
