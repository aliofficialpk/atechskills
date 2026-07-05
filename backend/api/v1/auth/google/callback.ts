import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { env } from "../../../../src/config.js";
import { prisma, withDbRetry } from "../../../../src/lib/prisma.js";
import { signAccessToken, signRefreshToken } from "../../../../src/lib/tokens.js";

type RoleWithPermissions = {
  role: {
    name: string;
    permissions: { permission: { name: string } }[];
  };
};

function cors(res: { setHeader: (key: string, value: string) => void }) {
  res.setHeader("Access-Control-Allow-Origin", "https://www.atechskills.com");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Vary", "Origin");
}

function verifyState(state: string) {
  const [encodedPayload, signature] = state.split(".");
  if (!encodedPayload || !signature) return null;
  const expected = crypto.createHmac("sha256", env.JWT_ACCESS_SECRET).update(encodedPayload).digest("base64url");
  if (signature.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as { exp?: number; returnTo?: string };
  if (!payload.exp || payload.exp < Date.now()) return null;
  return payload;
}

function safeFrontendPath(path?: string) {
  if (!path || !path.startsWith("/") || path.startsWith("//")) return "/student-dashboard";
  return path;
}

function getAccessClaims(rolesWithPermissions: RoleWithPermissions[]) {
  return {
    roles: rolesWithPermissions.map((item) => item.role.name),
    permissions: rolesWithPermissions.flatMap((item) => item.role.permissions.map((permission) => permission.permission.name))
  };
}

async function issueAuthResponseForUser(userId: string) {
  const user = await withDbRetry(() => prisma.user.findUniqueOrThrow({
    where: { id: userId },
    include: { roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } } }
  }), 3);
  const { roles, permissions } = getAccessClaims(user.roles);
  return {
    user: { id: user.id, email: user.email, name: user.name, roles },
    accessToken: signAccessToken({ id: user.id, email: user.email, roles, permissions }),
    refreshToken: signRefreshToken({ id: user.id, email: user.email })
  };
}

export default async function handler(req: { method?: string; query?: Record<string, string | string[]> }, res: { setHeader: (key: string, value: string) => void; status: (code: number) => { json: (body: unknown) => void; end: () => void }; redirect: (url: string) => void }) {
  cors(res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const clientId = env.GOOGLE_OAUTH_CLIENT_ID ?? env.GOOGLE_DRIVE_CLIENT_ID;
  const clientSecret = env.GOOGLE_OAUTH_CLIENT_SECRET ?? env.GOOGLE_DRIVE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return res.redirect(`${env.FRONTEND_URL}/login?google=not-configured`);

  const queryCode = req.query?.code;
  const queryState = req.query?.state;
  const code = Array.isArray(queryCode) ? queryCode[0] : queryCode;
  const stateInput = Array.isArray(queryState) ? queryState[0] : queryState;
  const state = stateInput ? verifyState(stateInput) : null;
  if (!code || !state) return res.redirect(`${env.FRONTEND_URL}/login?google=invalid`);

  const redirectUri = `${env.BACKEND_URL}${env.API_PREFIX}/auth/google/callback`;
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code"
    })
  });
  const tokenData = await tokenResponse.json() as { access_token?: string };
  if (!tokenResponse.ok || !tokenData.access_token) return res.redirect(`${env.FRONTEND_URL}/login?google=token-failed`);

  const profileResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${tokenData.access_token}` }
  });
  const profile = await profileResponse.json() as { email?: string; email_verified?: boolean; name?: string; picture?: string };
  if (!profileResponse.ok || !profile.email || !profile.email_verified) return res.redirect(`${env.FRONTEND_URL}/login?google=email-not-verified`);

  const email = profile.email.toLowerCase();
  const role = await withDbRetry(() => prisma.role.upsert({ where: { name: "Student" }, update: {}, create: { name: "Student", description: "Learner role" } }), 3);
  const existingUser = await withDbRetry(() => prisma.user.findUnique({ where: { email }, include: { student: true, roles: true } }), 3);
  const generatedPasswordHash = existingUser ? "" : await bcrypt.hash(crypto.randomBytes(32).toString("hex"), 12);
  const user = existingUser
    ? await withDbRetry(() => prisma.user.update({
      where: { id: existingUser.id },
      data: {
        name: existingUser.name || profile.name || email.split("@")[0],
        avatarUrl: existingUser.avatarUrl ?? profile.picture,
        student: existingUser.student ? undefined : { create: { studentCode: `ATS-${Date.now().toString(36).toUpperCase()}` } },
        roles: existingUser.roles.length ? undefined : { create: { roleId: role.id } }
      }
    }), 3)
    : await withDbRetry(() => prisma.user.create({
      data: {
        email,
        passwordHash: generatedPasswordHash,
        name: profile.name ?? email.split("@")[0],
        avatarUrl: profile.picture,
        roles: { create: { roleId: role.id } },
        student: { create: { studentCode: `ATS-${Date.now().toString(36).toUpperCase()}` } }
      }
    }), 3);

  const authPayload = await issueAuthResponseForUser(user.id);
  const fragment = new URLSearchParams({
    accessToken: authPayload.accessToken,
    refreshToken: authPayload.refreshToken,
    user: JSON.stringify(authPayload.user),
    returnTo: safeFrontendPath(state.returnTo)
  });

  return res.redirect(`${env.FRONTEND_URL}/auth/google/callback#${fragment.toString()}`);
}
