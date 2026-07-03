import { ContactPage } from "@/components/page-sections";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({ title: "Contact AtechSkills", description: "Contact AtechSkills for admissions, enterprise training, student support, events, partnerships, and LMS course questions.", path: "/contact" });

export default function Page() {
  return <ContactPage />;
}
