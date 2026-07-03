import { StaticInfoPage } from "@/components/page-sections";
import { createMetadata } from "@/lib/seo";
export const metadata = createMetadata({ title: "Privacy Policy", description: "AtechSkills privacy policy for learner accounts, enrollment records, payment proof, support tickets, analytics, and communications.", path: "/privacy-policy" });
export default function Page() { return <StaticInfoPage kind="privacy-policy" />; }
