import { EnrollmentPage } from "@/components/page-sections";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <EnrollmentPage slug={slug} />;
}
