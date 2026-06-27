import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"]
});

export async function withDbRetry<T>(operation: () => Promise<T>, attempts = 2, timeoutMs = 12000): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await Promise.race([
        operation(),
        new Promise<never>((_resolve, reject) => setTimeout(() => reject(new Error("Database request timed out")), timeoutMs))
      ]);
    } catch (error) {
      lastError = error;
      if (attempt < attempts) await new Promise((resolve) => setTimeout(resolve, 1200 * attempt));
    }
  }
  throw lastError;
}
