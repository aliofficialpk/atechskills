import { InsightsIndex } from "@/components/page-sections";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({ title: "Daily Insights, Tech News, Jobs and Internships", description: "Read AtechSkills Daily Insights for technology news, course announcements, jobs, internships, bootcamps, and career guidance.", path: "/daily-insights" });

export default function Page() {
  return <InsightsIndex />;
}
