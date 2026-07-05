import { Router } from "express";
import bcrypt from "bcryptjs";
import multer from "multer";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { uploadBufferToCloudinary } from "../lib/storage.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

export const adminCoursesAliasRouter = Router();
export const adminTeachersAliasRouter = Router();
export const adminCategoriesAliasRouter = Router();
export const adminEnrollmentsAliasRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    cb(null, ["image/jpeg", "image/png", "image/webp"].includes(file.mimetype));
  }
});

const courseSchema = z.object({
  title: z.string().min(3),
  slug: z.string().min(3),
  summary: z.string().min(10),
  description: z.string().optional(),
  thumbnailUrl: z.string().optional().or(z.literal("")),
  price: z.number().nonnegative().default(0),
  discountPrice: z.number().nonnegative().optional(),
  level: z.string().default("Beginner"),
  duration: z.string().default("8 weeks"),
  isFree: z.boolean().default(false),
  classStartAt: z.string().datetime().optional(),
  scheduleText: z.string().optional(),
  seatCapacity: z.number().int().positive().optional(),
  prerequisites: z.array(z.string()).default([]),
  outcomes: z.array(z.string()).default([]),
  status: z.enum(["DRAFT", "PUBLISHED", "UNPUBLISHED", "ARCHIVED"]).default("DRAFT"),
  categoryId: z.string().optional(),
  instructorId: z.string().optional(),
  sections: z.array(z.object({
    title: z.string().min(2),
    lessons: z.array(z.object({
      title: z.string().min(2),
      content: z.string().optional(),
      videoUrl: z.string().url().optional().or(z.literal("")),
      resourceUrl: z.string().url().optional().or(z.literal(""))
    })).default([])
  })).default([])
});

adminCoursesAliasRouter.use(requireAuth, requireRole("Super Admin", "Admin"));
adminTeachersAliasRouter.use(requireAuth, requireRole("Super Admin", "Admin"));
adminCategoriesAliasRouter.use(requireAuth, requireRole("Super Admin", "Admin"));
adminEnrollmentsAliasRouter.use(requireAuth, requireRole("Super Admin", "Admin"));

function optionalString(value: unknown) {
  const text = typeof value === "string" ? value.trim() : "";
  return text || undefined;
}

function parseNumber(value: unknown) {
  if (value === undefined || value === null || value === "") return undefined;
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}

function parseBool(value: unknown) {
  return value === true || value === "true" || value === "on" || value === "1";
}

function parseStringArray(value: unknown) {
  if (Array.isArray(value)) return value.map(String).map((item) => item.trim()).filter(Boolean);
  if (typeof value !== "string") return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.map(String).map((item) => item.trim()).filter(Boolean);
  } catch {
    // Fall through to newline parsing.
  }
  return value.split("\n").map((item) => item.trim()).filter(Boolean);
}

function parseSections(value: unknown) {
  if (Array.isArray(value)) return value;
  if (typeof value !== "string" || !value.trim()) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function normalizeIncomingCourseBody(body: Record<string, unknown>, thumbnailUrl?: string) {
  return {
    title: String(body.title ?? ""),
    slug: String(body.slug ?? ""),
    summary: String(body.summary ?? ""),
    description: optionalString(body.description),
    thumbnailUrl: thumbnailUrl ?? optionalString(body.thumbnailUrl) ?? "",
    price: parseNumber(body.price) ?? 0,
    discountPrice: parseNumber(body.discountPrice),
    level: optionalString(body.level) ?? "Beginner",
    duration: optionalString(body.duration) ?? "8 weeks",
    isFree: parseBool(body.isFree),
    classStartAt: optionalString(body.classStartAt),
    scheduleText: optionalString(body.scheduleText),
    seatCapacity: parseNumber(body.seatCapacity),
    prerequisites: parseStringArray(body.prerequisites),
    outcomes: parseStringArray(body.outcomes),
    status: body.status === "PUBLISHED" ? "PUBLISHED" : body.status === "UNPUBLISHED" ? "UNPUBLISHED" : body.status === "ARCHIVED" ? "ARCHIVED" : "DRAFT",
    categoryId: optionalString(body.categoryId),
    instructorId: optionalString(body.instructorId),
    sections: parseSections(body.sections)
  };
}

function normalizeCoursePayload(body: z.infer<typeof courseSchema>) {
  return {
    title: body.title,
    slug: body.slug,
    summary: body.summary,
    description: body.description,
    thumbnailUrl: body.thumbnailUrl || undefined,
    price: body.price,
    discountPrice: body.discountPrice,
    level: body.level,
    duration: body.duration,
    isFree: body.isFree,
    classStartAt: body.classStartAt ? new Date(body.classStartAt) : undefined,
    scheduleText: body.scheduleText,
    seatCapacity: body.seatCapacity,
    prerequisites: body.prerequisites,
    outcomes: body.outcomes,
    status: body.status,
    categoryId: body.categoryId || undefined,
    instructorId: body.instructorId || undefined
  };
}

async function listCourses() {
  return prisma.course.findMany({
    include: {
      category: true,
      instructor: { include: { user: true } },
      sections: { include: { lessons: { orderBy: { position: "asc" } } }, orderBy: { position: "asc" } },
      enrollments: true
    },
    orderBy: { createdAt: "desc" }
  });
}

adminCoursesAliasRouter.get("/", async (_req, res, next) => {
  try {
    res.json(await listCourses());
  } catch (error) {
    next(error);
  }
});

adminCoursesAliasRouter.post("/", upload.single("thumbnail"), async (req, res, next) => {
  try {
    if (req.body.action === "PUBLISH") {
      const course = await prisma.course.update({ where: { id: String(req.body.courseId) }, data: { status: "PUBLISHED" } });
      return res.json(course);
    }
    if (req.body.action === "ARCHIVE") {
      const course = await prisma.course.update({ where: { id: String(req.body.courseId) }, data: { status: "ARCHIVED" } });
      return res.json(course);
    }
    if (req.body.action === "ASSIGN_TEACHER") {
      const teacher = await prisma.teacher.findUnique({ where: { id: String(req.body.teacherId ?? "") } });
      if (!teacher) return res.status(404).json({ error: "Teacher not found" });
      const course = await prisma.course.update({ where: { id: String(req.body.courseId) }, data: { instructorId: teacher.id }, include: { instructor: { include: { user: true } } } });
      return res.json(course);
    }

    const uploadedThumbnail = req.file ? await uploadBufferToCloudinary(req.file, "atechskills/course-thumbnails") : undefined;
    const body = courseSchema.parse(normalizeIncomingCourseBody(req.body, uploadedThumbnail?.url));
    const course = await prisma.course.create({
      data: {
        ...normalizeCoursePayload(body),
        sections: {
          create: body.sections.map((section, sectionIndex) => ({
            title: section.title,
            position: sectionIndex + 1,
            lessons: {
              create: section.lessons.map((lesson, lessonIndex) => ({
                title: lesson.title,
                content: lesson.content,
                videoUrl: lesson.videoUrl || undefined,
                resourceUrl: lesson.resourceUrl || undefined,
                position: lessonIndex + 1
              }))
            }
          }))
        }
      }
    });
    res.status(201).json(course);
  } catch (error) {
    next(error);
  }
});

adminTeachersAliasRouter.get("/", async (_req, res, next) => {
  try {
    res.json(await prisma.teacher.findMany({
      include: { user: true, courses: { select: { id: true, title: true, slug: true } } },
      orderBy: { user: { name: "asc" } }
    }));
  } catch (error) {
    next(error);
  }
});

adminTeachersAliasRouter.post("/", async (req, res, next) => {
  try {
    const body = z.object({
      name: z.string().min(2),
      email: z.string().email(),
      password: z.string().min(8),
      title: z.string().optional(),
      bio: z.string().optional()
    }).parse(req.body);
    const passwordHash = await bcrypt.hash(body.password, 12);
    const role = await prisma.role.upsert({ where: { name: "Teacher" }, update: {}, create: { name: "Teacher" } });
    const user = await prisma.user.create({
      data: {
        email: body.email,
        name: body.name,
        passwordHash,
        roles: { create: { roleId: role.id } },
        teacher: { create: { title: body.title, bio: body.bio } }
      },
      include: { teacher: true, roles: { include: { role: true } } }
    });
    res.status(201).json(user);
  } catch (error) {
    next(error);
  }
});

adminTeachersAliasRouter.delete("/:id", async (req, res, next) => {
  try {
    const teacher = await prisma.teacher.findUnique({ where: { id: String(req.params.id) }, include: { user: true } });
    if (!teacher) return res.status(404).json({ error: "Teacher not found" });
    await prisma.course.updateMany({ where: { instructorId: teacher.id }, data: { instructorId: null } });
    const user = await prisma.user.update({ where: { id: teacher.userId }, data: { isActive: false } });
    res.json({ id: teacher.id, userId: user.id, email: user.email, isActive: user.isActive });
  } catch (error) {
    next(error);
  }
});

adminCategoriesAliasRouter.get("/", async (_req, res, next) => {
  try {
    res.json(await prisma.category.findMany({ where: { type: "course" }, orderBy: { name: "asc" } }));
  } catch (error) {
    next(error);
  }
});

adminCategoriesAliasRouter.post("/", async (req, res, next) => {
  try {
    const body = z.object({
      name: z.string().min(2),
      slug: z.string().min(2).optional()
    }).parse(req.body);
    const slug = body.slug ?? body.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const category = await prisma.category.upsert({
      where: { slug },
      update: { name: body.name, type: "course" },
      create: { name: body.name, slug, type: "course" }
    });
    res.status(201).json(category);
  } catch (error) {
    next(error);
  }
});

adminEnrollmentsAliasRouter.get("/", async (_req, res, next) => {
  try {
    res.json(await prisma.enrollment.findMany({
      where: { status: "PENDING" },
      include: { student: { include: { user: true } }, course: true, verifiedBy: true },
      orderBy: { requestedAt: "desc" }
    }));
  } catch (error) {
    next(error);
  }
});

adminEnrollmentsAliasRouter.post("/", async (req, res, next) => {
  try {
    const action = String(req.body.action ?? "");
    const enrollmentId = String(req.body.enrollmentId ?? "");
    if (!enrollmentId) return res.status(400).json({ error: "Enrollment ID is required" });
    if (action === "APPROVE") {
      const enrollment = await prisma.enrollment.update({
        where: { id: enrollmentId },
        data: {
          status: "ACTIVE",
          paymentStatus: "VERIFIED",
          verifiedAt: new Date(),
          verifiedById: req.user!.id,
          enrolledAt: new Date(),
          adminNote: req.body.adminNote ?? "Payment approved."
        }
      });
      if (enrollment.userId) {
        await prisma.notification.create({
          data: { userId: enrollment.userId, title: "Payment approved", body: "Admin approved your payment proof. Your course is active now.", type: "PAYMENT" }
        });
      }
      return res.json(enrollment);
    }
    if (action === "REJECT") {
      const enrollment = await prisma.enrollment.update({
        where: { id: enrollmentId },
        data: { status: "REJECTED", paymentStatus: "REJECTED", adminNote: req.body.adminNote ?? "Payment proof could not be verified." }
      });
      if (enrollment.userId) {
        await prisma.notification.create({
          data: { userId: enrollment.userId, title: "Enrollment needs attention", body: enrollment.adminNote ?? "Please upload a valid payment proof.", type: "ENROLLMENT" }
        });
      }
      return res.json(enrollment);
    }
    return res.status(400).json({ error: "Unsupported enrollment action" });
  } catch (error) {
    next(error);
  }
});
