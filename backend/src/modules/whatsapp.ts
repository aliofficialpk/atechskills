import { Router } from "express";
import { z } from "zod";
import { asyncRoute } from "../lib/async-route.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { env } from "../config.js";

export const whatsappRouter = Router();

// ── Webhook (public, no auth) ────────────────────────────────────────────────

// GET — Meta verification handshake
whatsappRouter.get("/webhook", (req, res) => {
  const mode = String(req.query["hub.mode"] ?? "");
  const token = String(req.query["hub.verify_token"] ?? "");
  const challenge = String(req.query["hub.challenge"] ?? "");
  if (mode === "subscribe" && token === env.WHATSAPP_VERIFY_TOKEN) {
    console.log("WhatsApp webhook verified");
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

// POST — incoming messages / status updates
whatsappRouter.post("/webhook", (req, res) => {
  const body = req.body as any;
  if (body?.object === "whatsapp_business_account") {
    const entries = body?.entry ?? [];
    for (const entry of entries) {
      const changes = entry?.changes ?? [];
      for (const change of changes) {
        const value = change?.value;
        const messages = value?.messages ?? [];
        for (const msg of messages) {
          console.log("Incoming WhatsApp message:", JSON.stringify(msg));
          // TODO: persist to DB / trigger notifications
        }
      }
    }
    return res.sendStatus(200);
  }
  return res.sendStatus(404);
});

// ── Authenticated admin routes ───────────────────────────────────────────────
whatsappRouter.use(requireAuth, requireRole("Super Admin", "Admin"));

const GRAPH_BASE = `https://graph.facebook.com/${env.WHATSAPP_API_VERSION}`;

async function graphGet(path: string): Promise<any> {
  const token = env.WHATSAPP_TOKEN;
  if (!token) throw new Error("WHATSAPP_TOKEN not configured");
  const sep = path.includes("?") ? "&" : "?";
  const url = `${GRAPH_BASE}/${path}${sep}access_token=${encodeURIComponent(token)}`;
  const res = await fetch(url);
  const data = await res.json() as any;
  if (!res.ok) throw new Error(data?.error?.message ?? `Graph API error ${res.status}`);
  return data;
}

async function graphPost(path: string, body: unknown): Promise<any> {
  const token = env.WHATSAPP_TOKEN;
  if (!token) throw new Error("WHATSAPP_TOKEN not configured");
  const sep = path.includes("?") ? "&" : "?";
  const url = `${GRAPH_BASE}/${path}${sep}access_token=${encodeURIComponent(token)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const data = await res.json() as any;
  if (!res.ok) throw new Error(data?.error?.message ?? `Graph API error ${res.status}`);
  return data;
}

// GET /whatsapp/status — phone number status + token info
whatsappRouter.get("/status", asyncRoute(async (_req, res) => {
  const phoneId = env.WHATSAPP_PHONE_NUMBER_ID;
  if (!phoneId) {
    return res.json({ configured: false, message: "WHATSAPP_PHONE_NUMBER_ID not set" });
  }
  const [phoneInfo, tokenInfo] = await Promise.all([
    graphGet(`${phoneId}?fields=display_phone_number,status,quality_rating,verified_name`),
    graphGet(`debug_token?input_token=${encodeURIComponent(env.WHATSAPP_TOKEN ?? "")}`)
  ]);
  return res.json({
    configured: true,
    phoneId,
    businessId: env.WHATSAPP_BUSINESS_ID,
    appId: env.WHATSAPP_APP_ID,
    phoneInfo,
    tokenInfo: tokenInfo.data
  });
}));

// GET /whatsapp/templates — list message templates
whatsappRouter.get("/templates", asyncRoute(async (_req, res) => {
  const businessId = env.WHATSAPP_BUSINESS_ID;
  if (!businessId) return res.status(400).json({ error: "WHATSAPP_BUSINESS_ID not configured" });
  const data = await graphGet(`${businessId}/message_templates?limit=20&fields=name,status,language,category,components`);
  return res.json(data);
}));

// POST /whatsapp/send — send a text message
const sendSchema = z.object({
  body: z.object({
    to: z.string().min(7, "Phone number required (with country code, no +)"),
    message: z.string().min(1).max(4096)
  })
});

whatsappRouter.post("/send", validate(sendSchema), asyncRoute(async (req, res) => {
  const phoneId = env.WHATSAPP_PHONE_NUMBER_ID;
  if (!phoneId) return res.status(400).json({ error: "WHATSAPP_PHONE_NUMBER_ID not configured" });
  const { to, message } = req.body as { to: string; message: string };
  const result = await graphPost(`${phoneId}/messages`, {
    messaging_product: "whatsapp",
    to,
    type: "text",
    text: { body: message }
  });
  return res.json(result);
}));

// POST /whatsapp/send-template — send a template message
const templateSchema = z.object({
  body: z.object({
    to: z.string().min(7),
    templateName: z.string().min(1),
    language: z.string().default("en_US"),
    components: z.array(z.any()).optional()
  })
});

whatsappRouter.post("/send-template", validate(templateSchema), asyncRoute(async (req, res) => {
  const phoneId = env.WHATSAPP_PHONE_NUMBER_ID;
  if (!phoneId) return res.status(400).json({ error: "WHATSAPP_PHONE_NUMBER_ID not configured" });
  const { to, templateName, language, components } = req.body as any;
  const result = await graphPost(`${phoneId}/messages`, {
    messaging_product: "whatsapp",
    to,
    type: "template",
    template: {
      name: templateName,
      language: { code: language },
      ...(components ? { components } : {})
    }
  });
  return res.json(result);
}));

// ── Contacts ─────────────────────────────────────────────────────────────────

const contactSchema = z.object({
  body: z.object({
    name: z.string().min(1),
    phone: z.string().min(7),
    tags: z.array(z.string()).optional(),
    notes: z.string().optional()
  })
});

import { prisma } from "../lib/prisma.js";

// GET /whatsapp/contacts
whatsappRouter.get("/contacts", asyncRoute(async (req, res) => {
  const search = String(req.query.search ?? "");
  const tag = String(req.query.tag ?? "");
  const contacts = await prisma.whatsAppContact.findMany({
    where: {
      ...(search ? { OR: [{ name: { contains: search, mode: "insensitive" } }, { phone: { contains: search } }] } : {}),
      ...(tag ? { tags: { has: tag } } : {})
    },
    orderBy: { createdAt: "desc" }
  });
  return res.json(contacts);
}));

// POST /whatsapp/contacts
whatsappRouter.post("/contacts", validate(contactSchema), asyncRoute(async (req, res) => {
  const { name, phone, tags, notes } = req.body as any;
  const contact = await prisma.whatsAppContact.upsert({
    where: { phone },
    update: { name, tags: tags ?? [], notes },
    create: { name, phone, tags: tags ?? [], notes }
  });
  return res.json(contact);
}));

// POST /whatsapp/contacts/import — bulk import CSV rows
whatsappRouter.post("/contacts/import", asyncRoute(async (req, res) => {
  const rows = req.body as Array<{ name: string; phone: string; tags?: string[]; notes?: string }>;
  if (!Array.isArray(rows)) return res.status(400).json({ error: "Expected array of contacts" });
  let created = 0, updated = 0;
  for (const row of rows) {
    if (!row.phone || !row.name) continue;
    const existing = await prisma.whatsAppContact.findUnique({ where: { phone: row.phone } });
    await prisma.whatsAppContact.upsert({
      where: { phone: row.phone },
      update: { name: row.name, tags: row.tags ?? [], notes: row.notes ?? null },
      create: { name: row.name, phone: row.phone, tags: row.tags ?? [], notes: row.notes ?? null }
    });
    existing ? updated++ : created++;
  }
  return res.json({ created, updated, total: rows.length });
}));

// DELETE /whatsapp/contacts/:id
whatsappRouter.delete("/contacts/:id", asyncRoute(async (req, res) => {
  await prisma.whatsAppContact.delete({ where: { id: String(req.params.id) } });
  return res.json({ success: true });
}));

// ── Broadcasts ────────────────────────────────────────────────────────────────

const broadcastSchema = z.object({
  body: z.object({
    title: z.string().min(1),
    message: z.string().optional(),
    templateName: z.string().optional(),
    language: z.string().default("en_US"),
    contactIds: z.array(z.string()).min(1),
    tags: z.array(z.string()).optional()
  })
});

// GET /whatsapp/broadcasts
whatsappRouter.get("/broadcasts", asyncRoute(async (_req, res) => {
  const broadcasts = await prisma.whatsAppBroadcast.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { recipients: true } } }
  });
  return res.json(broadcasts);
}));

// POST /whatsapp/broadcasts — create and immediately send
whatsappRouter.post("/broadcasts", validate(broadcastSchema), asyncRoute(async (req, res) => {
  const { title, message, templateName, language, contactIds, tags } = req.body as any;
  const phoneId = env.WHATSAPP_PHONE_NUMBER_ID;
  if (!phoneId) return res.status(400).json({ error: "WHATSAPP_PHONE_NUMBER_ID not configured" });

  // Resolve contacts
  let contacts: any[] = [];
  if (tags && tags.length > 0) {
    contacts = await prisma.whatsAppContact.findMany({ where: { tags: { hasSome: tags } } });
  } else {
    contacts = await prisma.whatsAppContact.findMany({ where: { id: { in: contactIds } } });
  }
  if (!contacts.length) return res.status(400).json({ error: "No contacts found" });

  const broadcast = await prisma.whatsAppBroadcast.create({
    data: {
      title, message, templateName, language, status: "SENDING",
      recipients: { create: contacts.map((c: any) => ({ contactId: c.id, status: "PENDING" })) }
    }
  });

  // Send synchronously within the request — Vercel serverless needs this
  let successCount = 0;
  for (const contact of contacts) {
    try {
      let result: any;
      if (templateName) {
        result = await graphPost(`${phoneId}/messages`, {
          messaging_product: "whatsapp", to: contact.phone, type: "template",
          template: { name: templateName, language: { code: language ?? "en_US" } }
        });
      } else if (message) {
        result = await graphPost(`${phoneId}/messages`, {
          messaging_product: "whatsapp", to: contact.phone, type: "text",
          text: { body: message }
        });
      }
      await prisma.whatsAppBroadcastRecipient.update({
        where: { broadcastId_contactId: { broadcastId: broadcast.id, contactId: contact.id } },
        data: { status: "SENT", messageId: result?.messages?.[0]?.id ?? null, sentAt: new Date() }
      });
      successCount++;
    } catch (err: any) {
      await prisma.whatsAppBroadcastRecipient.update({
        where: { broadcastId_contactId: { broadcastId: broadcast.id, contactId: contact.id } },
        data: { status: "FAILED", error: String(err?.message ?? "Send failed") }
      });
    }
  }

  const finalStatus = successCount === contacts.length ? "SENT" : successCount > 0 ? "PARTIAL" : "FAILED";
  await prisma.whatsAppBroadcast.update({
    where: { id: broadcast.id },
    data: { status: finalStatus, sentAt: new Date() }
  });

  return res.json({ broadcastId: broadcast.id, totalRecipients: contacts.length, sent: successCount, status: finalStatus });
}));

// GET /whatsapp/broadcasts/:id — get broadcast with recipient details
whatsappRouter.get("/broadcasts/:id", asyncRoute(async (req, res) => {
  const broadcast = await prisma.whatsAppBroadcast.findUnique({
    where: { id: String(req.params.id) },
    include: { recipients: { include: { contact: true } } }
  });
  if (!broadcast) return res.status(404).json({ error: "Broadcast not found" });
  return res.json(broadcast);
}));

// ── Auto Messages ─────────────────────────────────────────────────────────────

whatsappRouter.get("/auto-messages", asyncRoute(async (_req, res) => {
  const items = await prisma.whatsAppAutoMessage.findMany({ orderBy: { createdAt: "desc" } });
  return res.json(items);
}));

const autoMsgSchema = z.object({
  body: z.object({
    trigger: z.enum(["fee_paid", "enrollment_approved", "enrollment_rejected", "class_reminder", "custom"]),
    templateName: z.string().optional(),
    message: z.string().optional(),
    language: z.string().default("en_US"),
    isActive: z.boolean().default(true)
  })
});

whatsappRouter.post("/auto-messages", validate(autoMsgSchema), asyncRoute(async (req, res) => {
  const { trigger, templateName, message, language, isActive } = req.body as any;
  const item = await prisma.whatsAppAutoMessage.create({
    data: {
      trigger: String(trigger),
      templateName: templateName ? String(templateName) : null,
      message: message ? String(message) : null,
      language: String(language ?? "en_US"),
      isActive: Boolean(isActive ?? true)
    }
  });
  return res.json(item);
}));

whatsappRouter.patch("/auto-messages/:id", asyncRoute(async (req, res) => {
  const { trigger, templateName, message, language, isActive } = req.body as any;
  const item = await prisma.whatsAppAutoMessage.update({
    where: { id: String(req.params.id) },
    data: {
      ...(trigger !== undefined && { trigger: String(trigger) }),
      ...(templateName !== undefined && { templateName: templateName ? String(templateName) : null }),
      ...(message !== undefined && { message: message ? String(message) : null }),
      ...(language !== undefined && { language: String(language) }),
      ...(isActive !== undefined && { isActive: Boolean(isActive) })
    }
  });
  return res.json(item);
}));

whatsappRouter.delete("/auto-messages/:id", asyncRoute(async (req, res) => {
  await prisma.whatsAppAutoMessage.delete({ where: { id: String(req.params.id) } });
  return res.json({ success: true });
}));
