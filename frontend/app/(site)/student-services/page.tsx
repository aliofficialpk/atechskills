import { SupportTicketPage } from "@/components/page-sections";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({ title: "Student Services and Support", description: "Open AtechSkills student support tickets for academic, technical, payment, enrollment, and LMS help.", path: "/student-services" });

export default function Page() {
  return <SupportTicketPage />;
}
