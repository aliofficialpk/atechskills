import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { asyncRoute } from "../lib/async-route.js";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

export const adminRouter = Router();

adminRouter.use(requireAuth, requireRole("Super Admin", "Admin"));

const eventSchema = z.object({
  body: z.object({
    title: z.string().min(3),
    slug: z.string().min(3),
    type: z.string().min(2),
    summary: z.string().min(10),
    content: z.string().optional(),
    speaker: z.string().optional(),
    venue: z.string().optional(),
    onlineUrl: z.string().url().optional(),
    startsAt: z.string().datetime(),
    endsAt: z.string().datetime().optional(),
    capacity: z.number().int().positive().optional(),
    visibility: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT")
  })
});

const insightSchema = z.object({
  body: z.object({
    title: z.string().min(3),
    slug: z.string().min(3),
    summary: z.string().min(10),
    content: z.string().min(10),
    authorName: z.string().min(2),
    visibility: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
    isFeatured: z.boolean().default(false)
  })
});

const opportunitySchema = z.object({
  body: z.object({
    title: z.string().min(3),
    slug: z.string().min(3),
    type: z.enum(["JOB", "INTERNSHIP", "APPRENTICESHIP", "FELLOWSHIP"]),
    company: z.string().min(2),
    location: z.string().min(2),
    workMode: z.string().optional(),
    employmentType: z.string().optional(),
    summary: z.string().min(10),
    description: z.string().min(10),
    requirements: z.array(z.string()).default([]),
    benefits: z.array(z.string()).default([]),
    applyUrl: z.string().url(),
    applyEmail: z.string().email().optional(),
    deadline: z.string().datetime().optional(),
    visibility: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
    isFeatured: z.boolean().default(false)
  })
});

const staffSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(8),
    role: z.enum(["Teacher", "Student Services", "Content Manager", "Event Manager", "Admin"]),
    title: z.string().optional(),
    bio: z.string().optional(),
    team: z.string().optional()
  })
});

async function audit(actorId: string | undefined, action: string, entity: string, entityId?: string) {
  await prisma.auditLog.create({ data: { actorId, action, entity, entityId } });
}

adminRouter.get("/overview", asyncRoute(async (_req, res) => {
  const [users, courses, events, tickets, insights, enrollments, certificates, pendingPayments, activeClasses, verifiedEnrollments] = await Promise.all([
    prisma.user.count(),
    prisma.course.count(),
    prisma.event.count(),
    prisma.supportTicket.count({ where: { status: "OPEN" } }),
    prisma.insightsPost.count(),
    prisma.enrollment.count(),
    prisma.certificate.count(),
    prisma.enrollment.count({ where: { status: "PENDING", paymentStatus: "UNDER_REVIEW" } }),
    prisma.liveSession.count({ where: { status: { in: ["SCHEDULED", "LIVE"] } } }),
    prisma.enrollment.findMany({
      where: { paymentStatus: "VERIFIED" },
      select: { paidAmount: true }
    })
  ]);
  const revenue = verifiedEnrollments.reduce((sum, item) => sum + Number(item.paidAmount ?? 0), 0);
  res.json({ users, courses, events, openTickets: tickets, insights, enrollments, certificates, pendingPayments, revenue, activeClasses });
}));

adminRouter.get("/users", asyncRoute(async (_req, res) => res.json(await prisma.user.findMany({ include: { roles: { include: { role: true } } } }))));
adminRouter.get("/roles", asyncRoute(async (_req, res) => res.json(await prisma.role.findMany({ include: { permissions: { include: { permission: true } } } }))));
adminRouter.get("/tickets", asyncRoute(async (_req, res) => res.json(await prisma.supportTicket.findMany({ include: { messages: true }, orderBy: { createdAt: "desc" } }))));
adminRouter.get("/opportunities", asyncRoute(async (_req, res) => {
  res.json(await prisma.opportunity.findMany({ orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }] }));
}));

adminRouter.post("/staff", validate(staffSchema), asyncRoute(async (req, res) => {
  const passwordHash = await bcrypt.hash(req.body.password, 12);
  const role = await prisma.role.upsert({ where: { name: req.body.role }, update: {}, create: { name: req.body.role } });
  const user = await prisma.user.create({
    data: {
      email: req.body.email,
      name: req.body.name,
      passwordHash,
      roles: { create: { roleId: role.id } },
      teacher: req.body.role === "Teacher" ? { create: { title: req.body.title, bio: req.body.bio } } : undefined,
      supportStaff: req.body.role === "Student Services" ? { create: { team: req.body.team ?? "Student Services" } } : undefined
    },
    include: { roles: { include: { role: true } }, teacher: true, supportStaff: true }
  });
  await audit(req.user?.id, "STAFF_CREATED", "User", user.id);
  res.status(201).json({ id: user.id, email: user.email, name: user.name, roles: user.roles.map((item) => item.role.name), teacher: user.teacher, supportStaff: user.supportStaff });
}));

adminRouter.patch("/tickets/:id/resolve", asyncRoute(async (req, res) => {
  const ticket = await prisma.supportTicket.update({ where: { id: String(req.params.id) }, data: { status: "RESOLVED" } });
  await audit(req.user?.id, "TICKET_RESOLVED", "SupportTicket", ticket.id);
  res.json(ticket);
}));

adminRouter.post("/notifications/broadcast", asyncRoute(async (req, res) => {
  const notification = await prisma.notification.create({ data: { title: req.body.title, body: req.body.body, type: "BROADCAST" } });
  await audit(req.user?.id, "NOTIFICATION_BROADCAST", "Notification", notification.id);
  res.status(201).json(notification);
}));

adminRouter.post("/events", validate(eventSchema), asyncRoute(async (req, res) => {
  const event = await prisma.event.create({ data: { ...req.body, startsAt: new Date(req.body.startsAt), endsAt: req.body.endsAt ? new Date(req.body.endsAt) : undefined } });
  await audit(req.user?.id, "EVENT_CREATED", "Event", event.id);
  res.status(201).json(event);
}));

adminRouter.patch("/events/:id/publish", asyncRoute(async (req, res) => {
  const event = await prisma.event.update({ where: { id: String(req.params.id) }, data: { visibility: "PUBLISHED" } });
  await audit(req.user?.id, "EVENT_PUBLISHED", "Event", event.id);
  res.json(event);
}));

adminRouter.post("/insights", validate(insightSchema), asyncRoute(async (req, res) => {
  const post = await prisma.insightsPost.create({ data: { ...req.body, publishedAt: req.body.visibility === "PUBLISHED" ? new Date() : undefined } });
  await audit(req.user?.id, "INSIGHT_CREATED", "InsightsPost", post.id);
  res.status(201).json(post);
}));

adminRouter.patch("/insights/:id/publish", asyncRoute(async (req, res) => {
  const post = await prisma.insightsPost.update({ where: { id: String(req.params.id) }, data: { visibility: "PUBLISHED", publishedAt: new Date() } });
  await audit(req.user?.id, "INSIGHT_PUBLISHED", "InsightsPost", post.id);
  res.json(post);
}));

adminRouter.post("/opportunities", validate(opportunitySchema), asyncRoute(async (req, res) => {
  const opportunity = await prisma.opportunity.create({
    data: {
      ...req.body,
      deadline: req.body.deadline ? new Date(req.body.deadline) : undefined,
      publishedAt: req.body.visibility === "PUBLISHED" ? new Date() : undefined
    }
  });
  await audit(req.user?.id, "OPPORTUNITY_CREATED", "Opportunity", opportunity.id);
  res.status(201).json(opportunity);
}));

adminRouter.put("/opportunities/:id", validate(opportunitySchema), asyncRoute(async (req, res) => {
  const opportunity = await prisma.opportunity.update({
    where: { id: String(req.params.id) },
    data: {
      ...req.body,
      deadline: req.body.deadline ? new Date(req.body.deadline) : null,
      publishedAt: req.body.visibility === "PUBLISHED" ? new Date() : null
    }
  });
  await audit(req.user?.id, "OPPORTUNITY_UPDATED", "Opportunity", opportunity.id);
  res.json(opportunity);
}));

adminRouter.patch("/opportunities/:id/publish", asyncRoute(async (req, res) => {
  const opportunity = await prisma.opportunity.update({ where: { id: String(req.params.id) }, data: { visibility: "PUBLISHED", publishedAt: new Date() } });
  await audit(req.user?.id, "OPPORTUNITY_PUBLISHED", "Opportunity", opportunity.id);
  res.json(opportunity);
}));

adminRouter.delete("/opportunities/:id", asyncRoute(async (req, res) => {
  const opportunity = await prisma.opportunity.update({ where: { id: String(req.params.id) }, data: { visibility: "ARCHIVED" } });
  await audit(req.user?.id, "OPPORTUNITY_ARCHIVED", "Opportunity", opportunity.id);
  res.json(opportunity);
}));

adminRouter.post("/team", asyncRoute(async (req, res) => {
  const member = await prisma.teamMember.create({ data: req.body });
  await audit(req.user?.id, "TEAM_MEMBER_CREATED", "TeamMember", member.id);
  res.status(201).json(member);
}));

adminRouter.post("/testimonials", asyncRoute(async (req, res) => {
  const testimonial = await prisma.testimonial.create({ data: req.body });
  await audit(req.user?.id, "TESTIMONIAL_CREATED", "Testimonial", testimonial.id);
  res.status(201).json(testimonial);
}));

adminRouter.post("/gallery", asyncRoute(async (req, res) => {
  const item = await prisma.galleryItem.create({ data: req.body });
  await audit(req.user?.id, "GALLERY_ITEM_CREATED", "GalleryItem", item.id);
  res.status(201).json(item);
}));

adminRouter.put("/settings/:key", asyncRoute(async (req, res) => {
  const setting = await prisma.setting.upsert({ where: { key: String(req.params.key) }, update: { value: req.body.value }, create: { key: String(req.params.key), value: req.body.value } });
  await audit(req.user?.id, "SETTING_UPDATED", "Setting", setting.id);
  res.json(setting);
}));
