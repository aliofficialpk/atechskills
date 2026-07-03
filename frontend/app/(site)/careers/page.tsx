import { StaticInfoPage } from "@/components/page-sections";
import { createMetadata } from "@/lib/seo";
export const metadata = createMetadata({ title: "Careers and Job Board", description: "Browse technology jobs, hiring partner openings, learner career tracks, and placement support opportunities from AtechSkills.", path: "/careers" });
export default function Page() { return <StaticInfoPage kind="careers" />; }
