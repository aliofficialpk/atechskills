import { StaticInfoPage } from "@/components/page-sections";
import { createMetadata } from "@/lib/seo";
export const metadata = createMetadata({ title: "AtechSkills Intro", description: "Watch an introduction to the AtechSkills learning experience, LMS dashboards, live classes, course flow, and support portals.", path: "/watch-intro" });
export default function Page() { return <StaticInfoPage kind="watch-intro" />; }
