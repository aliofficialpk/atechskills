import { Router } from "express";
import { z } from "zod";
import { asyncRoute } from "../lib/async-route.js";
import { prisma, withDbRetry } from "../lib/prisma.js";
import { validate } from "../middleware/validate.js";

export const publicRouter = Router();

const formSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    message: z.string().min(1).optional()
  })
});

const eventRegistrationSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    email: z.string().email(),
    phone: z.string().optional()
  })
});

const enrollmentRequestSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    email: z.string().email(),
    phone: z.string().optional(),
    message: z.string().optional()
  })
});

publicRouter.get("/health", (_req, res) => res.json({ status: "ok", service: "atechskills-api" }));
publicRouter.get("/courses", asyncRoute(async (_req, res) => res.json(await prisma.course.findMany({ include: { category: true, instructor: true }, orderBy: { createdAt: "desc" } }))));
publicRouter.get("/courses/:slug", asyncRoute(async (req, res) => res.json(await prisma.course.findUnique({ where: { slug: String(req.params.slug) }, include: { sections: { include: { lessons: true } }, category: true, instructor: true } }))));
publicRouter.post("/courses/:slug/enroll", validate(enrollmentRequestSchema), asyncRoute(async (req, res) => {
  const course = await withDbRetry(() => prisma.course.findUnique({ where: { slug: String(req.params.slug) } }), 3);
  if (!course) return res.status(404).json({ error: "Course not found" });
  const ticket = await withDbRetry(() => prisma.supportTicket.create({
    data: {
      subject: `Enrollment request for ${course.title}`,
      category: "enrollment",
      priority: "NORMAL",
      status: "OPEN",
      requesterEmail: req.body.email,
      requesterName: req.body.name,
      messages: { create: { authorName: req.body.name, body: req.body.message ?? `Student requested enrollment for ${course.title}. Phone: ${req.body.phone ?? "not provided"}` } }
    }
  }), 3);
  res.status(201).json({ message: "Enrollment request created", ticketId: ticket.id, courseId: course.id });
}));
publicRouter.get("/events", asyncRoute(async (_req, res) => res.json(await prisma.event.findMany({ where: { visibility: "PUBLISHED" }, orderBy: { startsAt: "asc" } }))));
publicRouter.get("/events/:slug", asyncRoute(async (req, res) => res.json(await prisma.event.findUnique({ where: { slug: String(req.params.slug) }, include: { registrations: true, gallery: true } }))));
publicRouter.post("/events/:slug/register", validate(eventRegistrationSchema), asyncRoute(async (req, res) => {
  const event = await withDbRetry(() => prisma.event.findUnique({ where: { slug: String(req.params.slug) } }), 3);
  if (!event) return res.status(404).json({ error: "Event not found" });
  const registration = await withDbRetry(() => prisma.eventRegistration.create({ data: { eventId: event.id, name: req.body.name, email: req.body.email, phone: req.body.phone } }), 3);
  res.status(201).json({ message: "Event registration confirmed", registrationId: registration.id });
}));
publicRouter.get("/insights", asyncRoute(async (_req, res) => res.json(await prisma.insightsPost.findMany({ where: { visibility: "PUBLISHED" }, orderBy: { publishedAt: "desc" } }))));
publicRouter.get("/insights/:slug", asyncRoute(async (req, res) => res.json(await prisma.insightsPost.findUnique({ where: { slug: String(req.params.slug) }, include: { category: true, tags: { include: { tag: true } } } }))));
publicRouter.post("/forms/:type", validate(formSchema), asyncRoute(async (req, res) => {
  const requestType = String(req.params.type);
  const ticket = await withDbRetry(() => prisma.supportTicket.create({
    data: {
      subject: `${requestType} request from ${req.body.name ?? "visitor"}`,
      category: requestType,
      priority: "NORMAL",
      status: "OPEN",
      requesterEmail: req.body.email ?? "unknown@example.com",
      requesterName: req.body.name ?? "Website visitor",
      messages: { create: { body: req.body.message ?? "No message provided", authorName: req.body.name ?? "Website visitor" } }
    }
  }), 3);
  res.status(201).json({ message: "Request captured", ticketId: ticket.id });
}));
