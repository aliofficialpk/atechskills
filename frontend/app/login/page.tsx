import { AuthPage } from "@/components/page-sections";
import { createMetadata } from "@/lib/seo";
export const metadata = createMetadata({ title: "Login", description: "Login to the AtechSkills LMS portal.", path: "/login", noIndex: true });
export default function Page() { return <AuthPage mode="login" />; }
