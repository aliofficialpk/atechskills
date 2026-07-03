import { AuthPage } from "@/components/page-sections";
import { createMetadata } from "@/lib/seo";
export const metadata = createMetadata({ title: "Forgot Password", description: "Recover your AtechSkills account access.", path: "/forgot-password", noIndex: true });
export default function Page() { return <AuthPage mode="forgot-password" />; }
