import { Router } from "express";
import { z } from "zod";
import { asyncRoute } from "../lib/async-route.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { env } from "../config.js";

export const whatsappRouter = Router();

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
