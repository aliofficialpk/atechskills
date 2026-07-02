import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

export const adminCoursesAliasRouter = Router();
export const adminTeachersAliasRouter = Router();

const courseSchema = z.object({
  title: z.string().min(3),
  slug: z.string().min(3),
  summary: z.string().min(10),
  description: z.string().optional(),
  thumbnailUrl: z.string().url().optional().or(z.literal("")),
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

adminCoursesAliasRouter.post("/", async (req, res, next) => {
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

    const body = courseSchema.parse(req.body);
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
