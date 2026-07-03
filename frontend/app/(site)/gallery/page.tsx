import { StaticInfoPage } from "@/components/page-sections";
import { createMetadata } from "@/lib/seo";
export const metadata = createMetadata({ title: "Gallery", description: "View AtechSkills bootcamp, summit, workshop, certificate, project, and learner achievement highlights.", path: "/gallery" });
export default function Page() { return <StaticInfoPage kind="gallery" />; }
