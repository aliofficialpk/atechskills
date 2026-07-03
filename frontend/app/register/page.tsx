import { AuthPage } from "@/components/page-sections";
import { createMetadata } from "@/lib/seo";
export const metadata = createMetadata({ title: "Create Account", description: "Create your AtechSkills LMS account.", path: "/register", noIndex: true });
export default function Page() { return <AuthPage mode="register" />; }
