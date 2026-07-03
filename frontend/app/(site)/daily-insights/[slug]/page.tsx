import { InsightDetails } from "@/components/page-sections";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({ title: "Daily Insight", description: "Read AtechSkills technology insight, news, job, internship, course announcement, or event update.", path: "/daily-insights" });

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <InsightDetails slug={slug} />;
}
