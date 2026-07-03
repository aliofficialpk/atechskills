import { EnrollmentPage } from "@/components/page-sections";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({ title: "Course Enrollment", description: "Create an AtechSkills course enrollment request, upload payment proof, and wait for admin approval to activate LMS access.", path: "/courses" });

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <EnrollmentPage slug={slug} />;
}
