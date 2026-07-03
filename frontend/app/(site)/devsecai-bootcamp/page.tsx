import { StaticInfoPage } from "@/components/page-sections";
import { createMetadata } from "@/lib/seo";
export const metadata = createMetadata({ title: "DevSecAI Bootcamp", description: "Explore AtechSkills DevSecAI Bootcamp for secure AI, DevSecOps pipelines, cloud security, governance, and capstone portfolio projects.", path: "/devsecai-bootcamp", keywords: ["DevSecAI", "DevSecOps", "AI security"] });
export default function Page() { return <StaticInfoPage kind="devsecai-bootcamp" />; }
