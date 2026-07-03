import { EventRegistrationForm } from "@/components/forms";
import { PageHero } from "@/components/page-sections";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({ title: "Event Registration", description: "Register for AtechSkills technology events, workshops, summits, seminars, and live learning sessions.", path: "/events" });

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  return (
    <>
      <PageHero eyebrow="Event Registration" title="Reserve your seat" text={`Register for ${slug.replaceAll("-", " ")} and receive event updates, reminders, and joining details.`} ctaHref="/events" cta="View Events" />
      <div className="container-page max-w-2xl py-12"><EventRegistrationForm slug={slug} /></div>
    </>
  );
}
