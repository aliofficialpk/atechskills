import { EventDetails } from "@/components/page-sections";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({ title: "Event Details", description: "View AtechSkills event details, speaker information, date, time, capacity, registration, and reminders.", path: "/events" });

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <EventDetails slug={slug} />;
}
