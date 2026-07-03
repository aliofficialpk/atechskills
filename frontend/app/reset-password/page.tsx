import { AuthPage } from "@/components/page-sections";
import { createMetadata } from "@/lib/seo";
export const metadata = createMetadata({ title: "Reset Password", description: "Reset your AtechSkills account password.", path: "/reset-password", noIndex: true });
export default function Page() { return <AuthPage mode="reset-password" />; }
