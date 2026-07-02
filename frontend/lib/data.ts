import {
  BarChart3,
  BookOpenCheck,
  BrainCircuit,
  BriefcaseBusiness,
  CalendarDays,
  Cloud,
  Code2,
  GraduationCap,
  Handshake,
  Headphones,
  ShieldCheck,
  UsersRound
} from "lucide-react";

export const navItems = [
  { label: "Home", href: "/" },
  { label: "Courses", href: "/courses" },
  { label: "DevSecAI", href: "/devsecai-bootcamp" },
  { label: "Events", href: "/events" },
  { label: "Daily Insights", href: "/daily-insights" },
  { label: "Opportunities", href: "/opportunities" },
  { label: "About Us", href: "/about" },
  { label: "Contact", href: "/contact" }
];

export const categories = [
  { name: "Cybersecurity", slug: "cybersecurity", icon: ShieldCheck, summary: "Learn offensive and defensive security skills." },
  { name: "DevSecOps", slug: "devsecops", icon: BookOpenCheck, summary: "Integrate security across modern delivery pipelines." },
  { name: "AI & Machine Learning", slug: "ai-machine-learning", icon: BrainCircuit, summary: "Build intelligent systems with practical AI labs." },
  { name: "Cloud Computing", slug: "cloud-computing", icon: Cloud, summary: "Master AWS, Azure, cloud security, and architecture." },
  { name: "Programming", slug: "programming", icon: Code2, summary: "Build production-ready software foundations." },
  { name: "Data Science", slug: "data-science", icon: BarChart3, summary: "Analyze data and build data-driven solutions." }
];

type StaticCourse = {
  slug: string;
  title: string;
  category: string;
  level: string;
  price: number;
  discountPrice: number;
  duration: string;
  seats: number;
  status: string;
  instructor: string;
  summary: string;
  outcomes: string[];
  prerequisites: string[];
  modules: string[];
  image: string;
};

export const courses: StaticCourse[] = [];

export const events = [
  {
    slug: "devsecai-summit-2025",
    title: "DevSecAI Summit 2025",
    type: "Summit",
    date: "2026-07-24",
    time: "10:00 AM",
    location: "Lahore, Pakistan",
    capacity: 250,
    status: "Upcoming",
    summary: "A focused summit for secure AI, software security, DevSecOps, cloud risk, and career pathways.",
    speaker: "Industry Leaders and AtechSkills Faculty"
  },
  {
    slug: "cloud-security-workshop",
    title: "Cloud Security Workshop",
    type: "Workshop",
    date: "2026-07-10",
    time: "07:00 PM",
    location: "Online Live",
    capacity: 120,
    status: "Upcoming",
    summary: "Practical controls, IAM guardrails, and real cloud security review exercises.",
    speaker: "Cloud Security Team"
  },
  {
    slug: "ai-career-bootcamp-info-session",
    title: "AI Career Bootcamp Info Session",
    type: "Seminar",
    date: "2026-07-18",
    time: "08:00 PM",
    location: "Online Live",
    capacity: 180,
    status: "Upcoming",
    summary: "How to plan an AI, automation, or security career with practical projects.",
    speaker: "Career Advisory Team"
  }
];

export const insights = [
  {
    slug: "gpt-4o-reasoning-capabilities",
    title: "OpenAI launches GPT-4o with advanced reasoning capabilities",
    category: "News",
    date: "2026-06-10",
    author: "Content Team",
    summary: "What advanced reasoning capabilities mean for learners, builders, and security teams.",
    tags: ["AI", "News", "Skills"],
    featured: true
  },
  {
    slug: "devsecai-bootcamp-batch-12-open",
    title: "DevSecAI Bootcamp Batch 12 Registrations Open",
    category: "Update",
    date: "2026-06-07",
    author: "Admissions",
    summary: "New cohort seats are open with live labs, mentor reviews, and capstone presentations.",
    tags: ["Bootcamp", "DevSecAI"],
    featured: true
  },
  {
    slug: "top-cybersecurity-jobs-2026",
    title: "Top 10 Cybersecurity Jobs in Demand in 2026",
    category: "Career",
    date: "2026-06-04",
    author: "Career Desk",
    summary: "A practical breakdown of SOC, cloud security, GRC, appsec, and AI security roles.",
    tags: ["Jobs", "Cybersecurity"],
    featured: false
  }
];

export const testimonials = [
  {
    name: "Ahmed Raza",
    role: "Security Engineer",
    quote: "AtechSkills changed my career path. The hands-on labs and real-world projects gave me the confidence to land my dream job."
  },
  {
    name: "Sana Malik",
    role: "Cloud Security Analyst",
    quote: "The instructors were practical, clear, and serious about outcomes. I still use the project playbooks at work."
  }
];

export const dashboardStats = [
  { label: "Learners", value: "50K+", icon: UsersRound },
  { label: "Courses", value: "100+", icon: BookOpenCheck },
  { label: "Expert Trainers", value: "200+", icon: GraduationCap },
  { label: "Success Rate", value: "98%", icon: Handshake }
];

export const portalCards = {
  student: [
    "Enrolled Courses",
    "Attendance",
    "Progress",
    "Assignments",
    "Live Schedule",
    "Certificates",
    "Recordings",
    "Notifications"
  ],
  teacher: ["Assigned Courses", "Live Classes", "Mark Attendance", "Grade Assignments", "Student Performance", "Teacher Notes"],
  admin: [
    "Courses",
    "Students",
    "Teachers",
    "Roles & Permissions",
    "Events",
    "Daily Insights",
    "Support Tickets",
    "Recordings",
    "Certificates",
    "Website CMS",
    "Audit Logs",
    "Settings"
  ],
  services: ["Open Tickets", "Assigned Tickets", "Student Lookup", "Academic Support", "Technical Support", "Payment Support", "Conversation History"]
};

export const supportTypes = [
  { label: "Academic support", icon: GraduationCap },
  { label: "Technical support", icon: Headphones },
  { label: "Payment support", icon: BriefcaseBusiness },
  { label: "Enrollment support", icon: CalendarDays }
];

export const roleDashboards = {
  student: {
    kpis: [
      { label: "Course Progress", value: "68%", caption: "DevSecAI Bootcamp" },
      { label: "Attendance", value: "91%", caption: "Above certificate rule" },
      { label: "Assignments", value: "4/6", caption: "2 pending submissions" },
      { label: "Certificates", value: "2", caption: "1 verification ready" }
    ],
    primaryTitle: "Learning Plan",
    primaryText: "Your enrollments, payment status, live classes, attendance tracking, assignments, recordings, and certificate milestones.",
    secondaryTitle: "Quick Actions",
    rows: [
      { title: "Secure SDLC live lecture", detail: "Today, 8:00 PM - attendance auto-marks after half the scheduled class time.", status: "Scheduled" },
      { title: "Threat modeling assignment", detail: "Submit PDF and project notes before Friday.", status: "Due Soon" },
      { title: "Cloud security recording", detail: "Recording attached to Module 2 with downloadable resources.", status: "Available" }
    ],
    actions: [
      { label: "Join Live Class", href: "/student-dashboard#live-schedule", primary: true },
      { label: "Open Recordings", href: "/student-dashboard#recordings" },
      { label: "Create Support Ticket", href: "/student-services" }
    ]
  },
  teacher: {
    kpis: [
      { label: "Assigned Courses", value: "6", caption: "3 live cohorts" },
      { label: "Students", value: "184", caption: "Across active batches" },
      { label: "Pending Grades", value: "27", caption: "Assignments and quizzes" },
      { label: "Live Sessions", value: "9", caption: "This week" }
    ],
    primaryTitle: "Teaching Queue",
    primaryText: "Classes, grading, attendance, notes, and learner risk signals.",
    secondaryTitle: "Teaching Actions",
    rows: [
      { title: "DevSecAI Batch 12 attendance", detail: "Mark manual attendance after tonight's session.", status: "Action" },
      { title: "Cloud Security project reviews", detail: "12 submissions need feedback and scores.", status: "Grading" },
      { title: "Student performance notes", detail: "3 learners are below attendance threshold.", status: "Review" }
    ],
    actions: [
      { label: "Create Live Session", href: "/teacher-dashboard#live-classes", primary: true },
      { label: "Grade Assignments", href: "/teacher-dashboard#grade-assignments" },
      { label: "View Performance", href: "/teacher-dashboard#student-performance" }
    ]
  },
  admin: {
    kpis: [
      { label: "Total Students", value: "50K+", caption: "All-time platform learners" },
      { label: "Active Courses", value: "100+", caption: "Published and cohort-based" },
      { label: "Open Tickets", value: "18", caption: "Student services queue" },
      { label: "Revenue", value: "$42K", caption: "Current month overview" }
    ],
    primaryTitle: "Platform Operations",
    primaryText: "Manage courses, paid enrollment verification, staff credentials, scheduled live classes, attendance, content, roles, events, tickets, certificates, and audit-ready activity.",
    secondaryTitle: "Admin Actions",
    rows: [
      { title: "Publish DevSecAI Summit page", detail: "Speaker details and event gallery are ready for final review.", status: "Review" },
      { title: "Verify paid enrollments", detail: "Students upload Meezan Bank payment proof; admin reviews and activates access.", status: "Pending" },
      { title: "Issue certificates", detail: "Batch 11 completion rules have been met by 22 learners.", status: "Ready" }
    ],
    actions: [
      { label: "Manage Enrollment Requests", href: "/admin-dashboard#enrollment-requests", primary: true },
      { label: "Manage Roles", href: "/admin-dashboard#roles-and-permissions" },
      { label: "Schedule Live Classes", href: "/admin-dashboard#live-classes" }
    ]
  },
  services: {
    kpis: [
      { label: "Open Tickets", value: "18", caption: "Across all categories" },
      { label: "Assigned", value: "7", caption: "Your active queue" },
      { label: "Resolved Today", value: "14", caption: "Support performance" },
      { label: "Avg Response", value: "22m", caption: "Current SLA" }
    ],
    primaryTitle: "Support Queue",
    primaryText: "Track academic, technical, enrollment, and payment issues with conversation history.",
    secondaryTitle: "Support Actions",
    rows: [
      { title: "Payment confirmation needed", detail: "Student attached receipt and awaits enrollment activation.", status: "Payment" },
      { title: "Recording access issue", detail: "Learner cannot access Module 3 recording link.", status: "Technical" },
      { title: "Assignment extension request", detail: "Teacher approval required before deadline change.", status: "Academic" }
    ],
    actions: [
      { label: "Open Ticket Form", href: "/student-services", primary: true },
      { label: "Student Lookup", href: "/student-services-dashboard#student-lookup" },
      { label: "Conversation History", href: "/student-services-dashboard#conversation-history" }
    ]
  }
};

export const dashboardModules = {
  student: [
    { title: "Enrolled Courses", description: "Continue active cohorts, see unlocked lessons, and resume saved progress." },
    { title: "Attendance", description: "View session history, percentage, absences, and certificate eligibility." },
    { title: "Assignments", description: "Submit files, see deadlines, scores, feedback, and resubmission status." },
    { title: "Recordings", description: "Access lecture recordings linked to lessons and live sessions." },
    { title: "Certificates", description: "Download certificates and share verification IDs." },
    { title: "Notifications", description: "Class reminders, assignment alerts, announcements, and event updates." }
  ],
  teacher: [
    { title: "Assigned Courses", description: "Manage only courses assigned to this teacher with cohort-level controls." },
    { title: "Attendance Marking", description: "Mark manual attendance by class session, date, and student list." },
    { title: "Assignment Grading", description: "Review submissions, add scores, feedback, and teacher notes." },
    { title: "Quiz Results", description: "Track attempts, question performance, and remediation needs." },
    { title: "Live Schedule", description: "Create sessions, attach join links, and publish recordings after class." },
    { title: "Performance Notes", description: "Maintain private learner notes and progress summaries." }
  ],
  admin: [
    { title: "Course Management", description: "Create, edit, price, publish, assign teachers, and structure lessons." },
    { title: "Users and Roles", description: "Create staff credentials, assign roles, and manage permissions." },
    { title: "Events", description: "Publish summits, workshops, registrations, speakers, galleries, and reminders." },
    { title: "Daily Insights", description: "Manage news, updates, jobs, internships, announcements, and featured content." },
    { title: "Website CMS", description: "Edit homepage banners, stats, testimonials, team, FAQ, gallery, and footer." },
    { title: "Audit and Settings", description: "Review admin actions, integrations, notifications, storage, and platform rules." }
  ],
  services: [
    { title: "Ticket Inbox", description: "View, assign, reply, prioritize, and resolve student service tickets." },
    { title: "Student Lookup", description: "Inspect enrollment, payment, attendance, and course access context." },
    { title: "Payment Support", description: "Track payment proof, manual approvals, and enrollment handoff." },
    { title: "Academic Support", description: "Coordinate deadline, course access, certificate, and instructor requests." },
    { title: "Technical Support", description: "Handle login, recordings, live class, upload, and dashboard issues." },
    { title: "Conversation History", description: "Preserve full ticket messages for accountability and continuity." }
  ]
};

export const teamMembers = [
  { name: "AtechSkills Faculty", role: "Secure Technology Training Team", bio: "Instructors focused on practical labs, career projects, and measurable learner outcomes." },
  { name: "Admissions Desk", role: "Learner Success", bio: "Guides students through course selection, enrollment, payment, onboarding, and support." },
  { name: "DevSecAI Council", role: "Bootcamp and Summit Advisory", bio: "Shapes DevSecAI curriculum, event themes, and industry collaboration." }
];

export const jobs = [
  {
    slug: "junior-soc-analyst-remote-pakistan",
    title: "Junior SOC Analyst",
    company: "AtechSkills Hiring Partner",
    location: "Remote / Pakistan",
    workMode: "Remote",
    type: "Full-time",
    opportunityType: "JOB",
    tag: "Cybersecurity",
    summary: "Entry-level SOC monitoring role for learners with networking, Linux, alert triage, and reporting foundations.",
    applyUrl: "/contact"
  },
  {
    slug: "cloud-security-internship-atechskills-network",
    title: "Cloud Security Intern",
    company: "AtechSkills Talent Network",
    location: "Lahore / Hybrid",
    workMode: "Hybrid",
    type: "Internship",
    opportunityType: "INTERNSHIP",
    tag: "Cloud",
    summary: "Practical internship track for students learning cloud security, IAM checks, documentation, and lab-based reviews.",
    applyUrl: "/contact"
  },
  {
    slug: "devsecops-associate-lahore",
    title: "DevSecOps Associate",
    company: "Hiring Partner",
    location: "Lahore",
    workMode: "On-site",
    type: "Full-time",
    opportunityType: "JOB",
    tag: "DevSecOps",
    summary: "Associate role for candidates who can support CI/CD security checks, documentation, and cloud deployment workflows.",
    applyUrl: "/contact"
  }
];

export const faqs = [
  { question: "Do live classes include recordings?", answer: "Yes. Recordings can be attached to courses, lessons, and live sessions when storage is configured." },
  { question: "Can admin enroll students manually?", answer: "Yes. The backend schema and admin dashboard support manual enrollment and paid-course handoff." },
  { question: "Does the LMS support roles beyond students and teachers?", answer: "Yes. Super Admin, Admin, Teacher, Student Services, Content Manager, Event Manager, and Student roles are included." },
  { question: "Can Daily Insights publish jobs and internships?", answer: "Yes. Insights supports news, jobs, internships, announcements, tags, categories, featured posts, and publishing status." }
];
