import { StaticInfoPage } from "@/components/page-sections";
import { createMetadata } from "@/lib/seo";
export const metadata = createMetadata({ title: "Frequently Asked Questions", description: "Answers about AtechSkills courses, live classes, recordings, certificates, payments, enrollment, events, and LMS access.", path: "/faq" });
export default function Page() { return <StaticInfoPage kind="faq" />; }
