import { InsightDetails } from "@/components/page-sections";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <InsightDetails slug={slug} />;
}
