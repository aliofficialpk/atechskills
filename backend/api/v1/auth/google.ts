import crypto from "node:crypto";
import { env } from "../../../src/config.js";

function cors(res: { setHeader: (key: string, value: string) => void }) {
  res.setHeader("Access-Control-Allow-Origin", "https://www.atechskills.com");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Vary", "Origin");
}

function signState(payload: Record<string, unknown>) {
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto.createHmac("sha256", env.JWT_ACCESS_SECRET).update(encodedPayload).digest("base64url");
  return `${encodedPayload}.${signature}`;
}

function safeFrontendPath(path?: string) {
  if (!path || !path.startsWith("/") || path.startsWith("//")) return "/student-dashboard";
  return path;
}

export default async function handler(req: { method?: string; query?: Record<string, string | string[]> }, res: { setHeader: (key: string, value: string) => void; status: (code: number) => { json: (body: unknown) => void; end: () => void }; redirect: (url: string) => void }) {
  cors(res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const clientId = env.GOOGLE_OAUTH_CLIENT_ID ?? env.GOOGLE_DRIVE_CLIENT_ID;
  if (!clientId) return res.status(503).json({ error: "Google login is not configured yet." });

  const queryReturnTo = req.query?.returnTo;
  const returnTo = safeFrontendPath(Array.isArray(queryReturnTo) ? queryReturnTo[0] : queryReturnTo);
  const state = signState({ exp: Date.now() + 10 * 60 * 1000, returnTo });
  const redirectUri = `${env.BACKEND_URL}${env.API_PREFIX}/auth/google/callback`;
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    access_type: "online",
    prompt: "select_account",
    state
  });

  return res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
}
