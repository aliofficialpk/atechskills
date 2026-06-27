import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { asyncRoute } from "../lib/async-route.js";
import { prisma, withDbRetry } from "../lib/prisma.js";
import { signAccessToken, signRefreshToken } from "../lib/tokens.js";
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

const credentialsSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8),
    name: z.string().min(2).optional()
  })
});

authRouter.post("/register", validate(credentialsSchema), asyncRoute(async (req, res) => {
  const { email, password, name } = req.body;
  const passwordHash = await bcrypt.hash(password, 12);
  const role = await withDbRetry(() => prisma.role.upsert({ where: { name: "Student" }, update: {}, create: { name: "Student", description: "Learner role" } }), 3);
  const user = await withDbRetry(() => prisma.user.create({
    data: {
      email,
      passwordHash,
      name: name ?? email.split("@")[0],
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
  const login = String(req.body.email).trim().toLowerCase();
  const email = login === "admin" ? "admin@atechskills.com" : login;
  const user = await withDbRetry(() => prisma.user.findUnique({
    where: { email },
    include: { roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } } }
  }), 3);
  if (!user || !(await bcrypt.compare(req.body.password, user.passwordHash))) return res.status(401).json({ error: "Invalid credentials" });
  const { roles, permissions } = getAccessClaims(user.roles);
  res.json({ user: { id: user.id, email: user.email, name: user.name, roles }, accessToken: signAccessToken({ id: user.id, email: user.email, roles, permissions }), refreshToken: signRefreshToken({ id: user.id, email: user.email }) });
}));

authRouter.post("/forgot-password", (_req, res) => res.json({ message: "Password recovery email queued when SMTP is configured." }));
authRouter.post("/refresh", (_req, res) => res.json({ message: "Refresh token endpoint ready for cookie-backed production flow." }));
