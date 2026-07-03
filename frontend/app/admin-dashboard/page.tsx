import { DashboardPage } from "@/components/page-sections";
import { createMetadata } from "@/lib/seo";
export const metadata = createMetadata({ title: "Admin Dashboard", description: "AtechSkills admin dashboard.", path: "/admin-dashboard", noIndex: true });
export default function Page() { return <DashboardPage role="admin" />; }
