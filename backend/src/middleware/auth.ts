import type { NextFunction, Request, Response } from "express";
import { verifyAccessToken, type TokenUser } from "../lib/tokens.js";

declare global {
  namespace Express {
    interface Request {
      user?: TokenUser;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
  if (!token) return res.status(401).json({ error: "Authentication required" });
  try {
    req.user = verifyAccessToken(token);
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: "Authentication required" });
    if (!roles.some((role) => req.user?.roles.includes(role))) return res.status(403).json({ error: "Insufficient role" });
    next();
  };
}

export function requirePermission(permission: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: "Authentication required" });
    if (!req.user.permissions.includes(permission)) return res.status(403).json({ error: "Missing permission" });
    next();
  };
}
