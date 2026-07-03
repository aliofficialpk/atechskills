import { EventsIndex } from "@/components/page-sections";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({ title: "Technology Events, Workshops and Summits", description: "Register for AtechSkills events including DevSecAI Summit, workshops, webinars, bootcamp sessions, meetups, and student opportunities.", path: "/events" });

export default function Page() {
  return <EventsIndex />;
}
