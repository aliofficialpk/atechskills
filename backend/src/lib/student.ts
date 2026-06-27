import { prisma } from "./prisma.js";

export async function ensureStudentForUser(userId: string) {
  const existing = await prisma.student.findUnique({ where: { userId } });
  if (existing) return existing;

  return prisma.student.create({
    data: {
      userId,
      studentCode: `ATS-${Date.now().toString(36).toUpperCase()}`
    }
  });
}
