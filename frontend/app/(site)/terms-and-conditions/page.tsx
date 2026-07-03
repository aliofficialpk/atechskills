import { StaticInfoPage } from "@/components/page-sections";
import { createMetadata } from "@/lib/seo";
export const metadata = createMetadata({ title: "Terms and Conditions", description: "AtechSkills terms for enrollment, payments, course access, live classes, certificates, events, acceptable use, and LMS content.", path: "/terms-and-conditions" });
export default function Page() { return <StaticInfoPage kind="terms-and-conditions" />; }
