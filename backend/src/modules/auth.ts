import { Router } from "express";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { z } from "zod";
import { env } from "../config.js";
import { asyncRoute } from "../lib/async-route.js";
import { sendOtpEmail } from "../lib/email.js";
import { prisma, withDbRetry } from "../lib/prisma.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../lib/tokens.js";
import { validate } from "../middleware/validate.js";

export const authRouter = Router();

type RoleWithPermissions = {
  role: {
    name: string;
    permissions: { permission: { name: string } }[];
  };
};

function getAccessClaims(rolesWithPermissions: RoleWithPermissions[]) {
  return {
    roles: rolesWithPermissions.map((item) => item.role.name),
    permissions: rolesWithPermissions.flatMap((item) => item.role.permissions.map((permission) => permission.permission.name))
  };
}

function getGoogleClientConfig() {
  return {
    clientId: env.GOOGLE_OAUTH_CLIENT_ID ?? env.GOOGLE_DRIVE_CLIENT_ID,
    clientSecret: env.GOOGLE_OAUTH_CLIENT_SECRET ?? env.GOOGLE_DRIVE_CLIENT_SECRET,
    redirectUri: `${env.BACKEND_URL}${env.API_PREFIX}/auth/google/callback`
  };
}

function base64Url(input: string | Buffer) {
  return Buffer.from(input).toString("base64url");
}

function signState(payload: Record<string, unknown>) {
  const encodedPayload = base64Url(JSON.stringify(payload));
  const signature = crypto.createHmac("sha256", env.JWT_ACCESS_SECRET).update(encodedPayload).digest("base64url");
  return `${encodedPayload}.${signature}`;
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

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function otpSettingKey(email: string) {
  return `email-otp:${normalizeEmail(email)}`;
}

function hashOtp(email: string, code: string) {
  return crypto.createHmac("sha256", env.JWT_ACCESS_SECRET).update(`${normalizeEmail(email)}:${code}`).digest("hex");
}

function createOtpCode() {
  return String(crypto.randomInt(100000, 1000000));
}

async function verifyEmailOtp(email: string, code: string) {
  const setting = await withDbRetry(() => prisma.setting.findUnique({ where: { key: otpSettingKey(email) } }), 3);
  const value = setting?.value as { codeHash?: string; expiresAt?: string; attempts?: number } | undefined;
  if (!setting || !value?.codeHash || !value.expiresAt) return false;
  if (new Date(value.expiresAt).getTime() < Date.now()) {
    await prisma.setting.delete({ where: { key: setting.key } }).catch(() => undefined);
    return false;
  }
  if ((value.attempts ?? 0) >= 5) return false;

  const providedHash = hashOtp(email, code);
  const isValid = providedHash.length === value.codeHash.length && crypto.timingSafeEqual(Buffer.from(providedHash), Buffer.from(value.codeHash));
  if (!isValid) {
    await prisma.setting.update({
      where: { key: setting.key },
      data: { value: { ...value, attempts: (value.attempts ?? 0) + 1 } }
    }).catch(() => undefined);
    return false;
  }

  await prisma.setting.delete({ where: { key: setting.key } }).catch(() => undefined);
  return true;
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

const credentialsSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8),
    name: z.string().min(2).optional(),
    phone: z.string().min(7).optional(),
    otp: z.string().regex(/^\d{6}$/).optional()
  })
});

const sendOtpSchema = z.object({
  body: z.object({
    email: z.string().email()
  })
});

authRouter.post("/send-otp", validate(sendOtpSchema), asyncRoute(async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const existing = await withDbRetry(() => prisma.user.findUnique({ where: { email }, select: { id: true } }), 3);
  if (existing) return res.status(409).json({ error: "An account already exists for this email. Please login instead." });

  const code = createOtpCode();
  await withDbRetry(() => prisma.setting.upsert({
    where: { key: otpSettingKey(email) },
    update: {
      value: {
        codeHash: hashOtp(email, code),
        expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        attempts: 0,
        purpose: "register"
      }
    },
    create: {
      key: otpSettingKey(email),
      value: {
        codeHash: hashOtp(email, code),
        expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        attempts: 0,
        purpose: "register"
      }
    }
  }), 3);

  try {
    await sendOtpEmail(email, code);
  } catch (error) {
    await prisma.setting.delete({ where: { key: otpSettingKey(email) } }).catch(() => undefined);
    return res.status(503).json({ error: error instanceof Error ? error.message : "Unable to send OTP email right now." });
  }

  res.json({ message: "Verification code sent. Please check your inbox." });
}));

authRouter.post("/register", validate(credentialsSchema), asyncRoute(async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const { password, name, phone, otp } = req.body;
  if (!otp || !(await verifyEmailOtp(email, otp))) {
    return res.status(400).json({ error: "Enter the valid 6-digit verification code sent to your email." });
  }
  const existing = await withDbRetry(() => prisma.user.findUnique({ where: { email }, select: { id: true } }), 3);
  if (existing) return res.status(409).json({ error: "An account already exists for this email. Please login instead." });

  const passwordHash = await bcrypt.hash(password, 12);
  const role = await withDbRetry(() => prisma.role.upsert({ where: { name: "Student" }, update: {}, create: { name: "Student", description: "Learner role" } }), 3);
  const user = await withDbRetry(() => prisma.user.create({
    data: {
      email,
      passwordHash,
      name: name ?? email.split("@")[0],
      phone,
      roles: { create: { roleId: role.id } },
      student: { create: { studentCode: `ATS-${Date.now().toString(36).toUpperCase()}` } }
    },
    include: { roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } } }
  }), 3);
  const { roles, permissions } = getAccessClaims(user.roles);
  res.status(201).json({ user: { id: user.id, email: user.email, name: user.name, roles }, accessToken: signAccessToken({ id: user.id, email, roles, permissions }), refreshToken: signRefreshToken({ id: user.id, email }) });
}));

const loginSchema = z.object({
  body: z.object({
    email: z.string().min(1),
    password: z.string().min(1)
  })
});

authRouter.post("/login", validate(loginSchema), asyncRoute(async (req, res) => {
  const login = normalizeEmail(String(req.body.email));
  const email = login === "admin" ? "admin@atechskills.com" : login;
  const user = await withDbRetry(() => prisma.user.findUnique({
    where: { email },
    include: { roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } } }
  }), 3);
  if (!user || !user.isActive || !(await bcrypt.compare(req.body.password, user.passwordHash))) return res.status(401).json({ error: "Invalid credentials" });
  const { roles, permissions } = getAccessClaims(user.roles);
  res.json({ user: { id: user.id, email: user.email, name: user.name, roles }, accessToken: signAccessToken({ id: user.id, email: user.email, roles, permissions }), refreshToken: signRefreshToken({ id: user.id, email: user.email }) });
}));

authRouter.get("/google", asyncRoute(async (req, res) => {
  const { clientId, redirectUri } = getGoogleClientConfig();
  if (!clientId) return res.status(503).json({ error: "Google login is not configured yet." });

  const returnTo = safeFrontendPath(typeof req.query.returnTo === "string" ? req.query.returnTo : undefined);
  const state = signState({ exp: Date.now() + 10 * 60 * 1000, returnTo });
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    access_type: "online",
    prompt: "select_account",
    state
  });

  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
}));

authRouter.get("/google/callback", asyncRoute(async (req, res) => {
  const { clientId, clientSecret, redirectUri } = getGoogleClientConfig();
  if (!clientId || !clientSecret) return res.redirect(`${env.FRONTEND_URL}/login?google=not-configured`);

  const code = typeof req.query.code === "string" ? req.query.code : "";
  const state = typeof req.query.state === "string" ? verifyState(req.query.state) : null;
  if (!code || !state) return res.redirect(`${env.FRONTEND_URL}/login?google=invalid`);

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
  const tokenData = await tokenResponse.json() as { access_token?: string; error_description?: string };
  if (!tokenResponse.ok || !tokenData.access_token) {
    return res.redirect(`${env.FRONTEND_URL}/login?google=token-failed`);
  }

  const profileResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${tokenData.access_token}` }
  });
  const profile = await profileResponse.json() as { email?: string; email_verified?: boolean; name?: string; picture?: string };
  if (!profileResponse.ok || !profile.email || !profile.email_verified) {
    return res.redirect(`${env.FRONTEND_URL}/login?google=email-not-verified`);
  }

  const email = normalizeEmail(profile.email);
  const role = await withDbRetry(() => prisma.role.upsert({ where: { name: "Student" }, update: {}, create: { name: "Student", description: "Learner role" } }), 3);
  const existingUser = await withDbRetry(() => prisma.user.findUnique({ where: { email }, include: { student: true, roles: true } }), 3);
  if (existingUser && !existingUser.isActive) return res.redirect(`${env.FRONTEND_URL}/login?google=inactive`);
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
  res.redirect(`${env.FRONTEND_URL}/auth/google/callback?${fragment.toString()}`);
}));

authRouter.post("/forgot-password", (_req, res) => res.json({ message: "Password recovery email queued when SMTP is configured." }));
authRouter.post("/refresh", asyncRoute(async (req, res) => {
  const refreshToken = String(req.body?.refreshToken ?? "");
  if (!refreshToken) return res.status(400).json({ error: "Refresh token is required." });

  let claims: Pick<ReturnType<typeof verifyRefreshToken>, "id" | "email">;
  try {
    claims = verifyRefreshToken(refreshToken);
  } catch {
    return res.status(401).json({ error: "Session expired. Please login again." });
  }

  const user = await withDbRetry(() => prisma.user.findUnique({
    where: { id: claims.id },
    include: { roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } } }
  }), 3);
  if (!user || !user.isActive || user.email !== claims.email) return res.status(401).json({ error: "Session expired. Please login again." });

  const { roles, permissions } = getAccessClaims(user.roles);
  res.json({
    user: { id: user.id, email: user.email, name: user.name, roles },
    accessToken: signAccessToken({ id: user.id, email: user.email, roles, permissions }),
    refreshToken: signRefreshToken({ id: user.id, email: user.email })
  });
}));
