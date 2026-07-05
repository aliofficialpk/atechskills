import jwt from "jsonwebtoken";
import type { SignOptions } from "jsonwebtoken";
import { env } from "../config.js";

export type TokenUser = {
  id: string;
  email: string;
  roles: string[];
  permissions: string[];
};

export function signAccessToken(user: TokenUser) {
  const options: SignOptions = { expiresIn: env.ACCESS_TOKEN_TTL as SignOptions["expiresIn"] };
  return jwt.sign(user, env.JWT_ACCESS_SECRET, options);
}

export function signRefreshToken(user: Pick<TokenUser, "id" | "email">) {
  const options: SignOptions = { expiresIn: env.REFRESH_TOKEN_TTL as SignOptions["expiresIn"] };
  return jwt.sign(user, env.JWT_REFRESH_SECRET, options);
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenUser;
}

export function verifyRefreshToken(token: string) {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as Pick<TokenUser, "id" | "email">;
}
