import { HomePage } from "@/components/home";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "AtechSkills | Practical Cybersecurity, DevSecOps, AI and Cloud Training",
  description: "Join AtechSkills for career-ready technology training, live classes, LMS learning, cybersecurity, DevSecOps, AI, cloud computing, events, internships, and job opportunities.",
  path: "/"
});

export default function Page() {
  return <HomePage />;
}
