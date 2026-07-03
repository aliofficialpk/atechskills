import { StaticInfoPage } from "@/components/page-sections";
import { createMetadata } from "@/lib/seo";
export const metadata = createMetadata({ title: "About AtechSkills", description: "Learn about AtechSkills, Mustansar Riaz, Atechsole, our mission, mentors, practical LMS learning, and secure technology training programs.", path: "/about" });
export default function Page() { return <StaticInfoPage kind="about" />; }
