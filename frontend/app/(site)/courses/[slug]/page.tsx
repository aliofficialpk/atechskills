import { CourseDetails } from "@/components/page-sections";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({ title: "Course Details", description: "View AtechSkills course details, curriculum, instructor, schedule, prerequisites, outcomes, enrollment flow, and certificate information.", path: "/courses" });

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <CourseDetails slug={slug} />;
}
