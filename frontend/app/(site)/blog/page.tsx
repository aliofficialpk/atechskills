import { StaticInfoPage } from "@/components/page-sections";
import { createMetadata } from "@/lib/seo";
export const metadata = createMetadata({ title: "Blog and Technology Articles", description: "Read AtechSkills articles, tutorials, career guidance, course announcements, and technology explainers.", path: "/blog" });
export default function Page() { return <StaticInfoPage kind="blog" />; }
