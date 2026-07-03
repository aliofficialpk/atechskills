import { StaticInfoPage } from "@/components/page-sections";
import { createMetadata } from "@/lib/seo";
export const metadata = createMetadata({ title: "DevSecAI Summit", description: "Join AtechSkills DevSecAI Summit for secure AI, software security, DevSecOps leadership, workshops, speakers, and networking.", path: "/devsecai-summit", keywords: ["DevSecAI Summit", "secure AI", "technology summit"] });
export default function Page() { return <StaticInfoPage kind="devsecai-summit" />; }
