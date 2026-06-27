import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import { asyncRoute } from "../lib/async-route.js";
import { prisma, withDbRetry } from "../lib/prisma.js";
import { ensureStudentForUser } from "../lib/student.js";
import { uploadBufferToCloudinary } from "../lib/storage.js";
import { requireAuth, requirePermission, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

export const lmsRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    cb(null, ["image/jpeg", "image/png", "image/webp", "application/pdf"].includes(file.mimetype));
  }
});

const courseSchema = z.object({
  body: z.object({
    title: z.string().min(3),
    slug: z.string().min(3),
    summary: z.string().min(10),
    price: z.number().nonnegative().default(0),
    discountPrice: z.number().nonnegative().optional(),
    level: z.string().default("Beginner"),
    duration: z.string().default("8 weeks"),
    isFree: z.boolean().default(false),
    classStartAt: z.string().datetime().optional(),
    scheduleText: z.string().optional(),
    categoryId: z.string().optional(),
    instructorId: z.string().optional()
  })
});

const liveSessionSchema = z.object({
  body: z.object({
    courseId: z.string(),
    title: z.string().min(3),
    startsAt: z.string().datetime(),
    endsAt: z.string().datetime().optional(),
    expectedDurationMinutes: z.number().int().positive().default(60),
    attendanceThresholdPercent: z.number().int().min(1).max(100).default(50),
    meetingUrl: z.string().url().optional(),
    provider: z.string().default("manual"),
    freeAccess: z.boolean().default(false)
  })
});

const liveSessionGenerationSchema = z.object({
  body: z.object({
    courseId: z.string(),
    titlePrefix: z.string().min(3).default("Live Class"),
    firstStartsAt: z.string().datetime(),
    totalSessions: z.number().int().min(1).max(100).default(1),
    repeatEveryDays: z.number().int().min(1).max(31).default(7),
    expectedDurationMinutes: z.number().int().positive().default(60),
    attendanceThresholdPercent: z.number().int().min(1).max(100).default(50),
    meetingUrl: z.string().url().optional(),
    provider: z.string().default("manual"),
    freeAccess: z.boolean().default(false)
  })
});

function requiredSecondsForSession(session: { expectedDurationMinutes: number; attendanceThresholdPercent: number }) {
  return Math.ceil(session.expectedDurationMinutes * 60 * (session.attendanceThresholdPercent / 100));
}

function calculateEndsAt(startsAt: Date, expectedDurationMinutes: number) {
  return new Date(startsAt.getTime() + expectedDurationMinutes * 60 * 1000);
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

async function notifyActiveCourseStudents(courseId: string, title: string, body: string) {
  const enrollments = await prisma.enrollment.findMany({
    where: { courseId, status: "ACTIVE", userId: { not: null } },
    select: { userId: true }
  });

  if (enrollments.length === 0) return;

  await prisma.notification.createMany({
    data: enrollments
      .filter((item): item is { userId: string } => Boolean(item.userId))
      .map((item) => ({ userId: item.userId, title, body, type: "CLASS" }))
  });
}

async function markAttendanceIfEligible(studentId: string, liveSessionId: string) {
  const presence = await prisma.classPresence.findUnique({
    where: { studentId_liveSessionId: { studentId, liveSessionId } },
    include: { liveSession: true }
  });
  if (!presence) return null;

  const requiredSeconds = requiredSecondsForSession(presence.liveSession);
  const eligible = presence.totalSeconds >= requiredSeconds;

  const updatedPresence = await prisma.classPresence.update({
    where: { id: presence.id },
    data: { eligibleForAttendance: eligible, attendanceMarked: eligible || presence.attendanceMarked }
  });

  if (eligible) {
    await prisma.attendance.upsert({
      where: { studentId_liveSessionId: { studentId, liveSessionId } },
      update: { status: "PRESENT", markedAt: new Date(), notes: `Auto-marked after ${presence.totalSeconds}s in class.` },
      create: { studentId, liveSessionId, courseId: presence.liveSession.courseId, status: "PRESENT", notes: `Auto-marked after ${presence.totalSeconds}s in class.` }
    });
  }

  return { presence: updatedPresence, eligible, requiredSeconds };
}

async function updatePresenceTime(studentId: string, liveSessionId: string, closeSession = false) {
  const now = new Date();
  const presence = await prisma.classPresence.findUnique({ where: { studentId_liveSessionId: { studentId, liveSessionId } } });
  if (!presence) throw new Error("Class presence was not started");

  const lastSeenAt = presence.lastSeenAt ?? presence.joinedAt;
  const rawDeltaSeconds = Math.max(0, Math.floor((now.getTime() - lastSeenAt.getTime()) / 1000));
  const deltaSeconds = Math.min(rawDeltaSeconds, 90);
  await prisma.classPresence.update({
    where: { id: presence.id },
    data: {
      totalSeconds: { increment: deltaSeconds },
      lastSeenAt: now,
      leftAt: closeSession ? now : undefined
    }
  });

  return markAttendanceIfEligible(studentId, liveSessionId);
}

async function finalizeSessionAttendance(liveSessionId: string) {
  const session = await prisma.liveSession.findUnique({
    where: { id: liveSessionId },
    include: {
      presences: true,
      course: {
        include: {
          enrollments: {
            where: { status: "ACTIVE" },
            include: { student: true }
          }
        }
      }
    }
  });
  if (!session) return null;

  for (const presence of session.presences) {
    if (!presence.leftAt) {
      await updatePresenceTime(presence.studentId, session.id, true);
    } else {
      await markAttendanceIfEligible(presence.studentId, session.id);
    }
  }

  const attendance = await prisma.attendance.findMany({ where: { liveSessionId: session.id } });
  const presentStudentIds = new Set(attendance.filter((item) => item.status === "PRESENT").map((item) => item.studentId));
  const attendanceStudentIds = new Set(attendance.map((item) => item.studentId));
  let absentMarked = 0;

  for (const enrollment of session.course.enrollments) {
    if (attendanceStudentIds.has(enrollment.studentId)) continue;
    await prisma.attendance.create({
      data: {
        studentId: enrollment.studentId,
        liveSessionId: session.id,
        courseId: session.courseId,
        status: "ABSENT",
        notes: "Auto-marked absent when class attendance was finalized."
      }
    });
    absentMarked += 1;
  }

  const completed = await prisma.liveSession.update({ where: { id: session.id }, data: { status: "COMPLETED" } });
  return {
    session: completed,
    presentMarked: presentStudentIds.size,
    absentMarked
  };
}

lmsRouter.use(requireAuth);

lmsRouter.get("/me", asyncRoute(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    include: {
      student: {
        include: {
          enrollments: { include: { course: { include: { sessions: true } } }, orderBy: { requestedAt: "desc" } },
          attendance: { include: { liveSession: true }, orderBy: { markedAt: "desc" } },
          presences: { include: { liveSession: true }, orderBy: { joinedAt: "desc" } },
          certificates: { include: { course: true } }
        }
      },
      notifications: { orderBy: { createdAt: "desc" }, take: 20 }
    }
  });
  res.json(user);
}));

lmsRouter.post("/courses", requirePermission("courses.manage"), validate(courseSchema), asyncRoute(async (req, res) => {
  const course = await prisma.course.create({
    data: {
      ...req.body,
      classStartAt: req.body.classStartAt ? new Date(req.body.classStartAt) : undefined
    }
  });
  await prisma.auditLog.create({ data: { actorId: req.user!.id, action: "COURSE_CREATED", entity: "Course", entityId: course.id } });
  res.status(201).json(course);
}));

lmsRouter.patch("/courses/:id/publish", requirePermission("courses.manage"), asyncRoute(async (req, res) => {
  const course = await prisma.course.update({ where: { id: String(req.params.id) }, data: { status: "PUBLISHED" } });
  res.json(course);
}));

lmsRouter.post("/courses/:slug/enroll", upload.single("paymentProof"), asyncRoute(async (req, res) => {
  const course = await withDbRetry(() => prisma.course.findUnique({ where: { slug: String(req.params.slug) } }), 3);
  if (!course) return res.status(404).json({ error: "Course not found" });

  const student = await ensureStudentForUser(req.user!.id);
  const isFree = course.isFree || Number(course.price) === 0;
  if (!isFree && !req.file) return res.status(400).json({ error: "Payment proof screenshot or PDF is required for paid enrollment." });

  const proof = req.file ? await uploadBufferToCloudinary(req.file, "atechskills/payment-proofs") : undefined;
  const enrollment = await prisma.enrollment.upsert({
    where: { studentId_courseId: { studentId: student.id, courseId: course.id } },
    update: {
      status: isFree ? "ACTIVE" : "PENDING",
      paymentStatus: isFree ? "NOT_REQUIRED" : "UNDER_REVIEW",
      paidAmount: req.body.paidAmount ? Number(req.body.paidAmount) : undefined,
      paymentProofUrl: proof?.url,
      paymentProofPublicId: proof?.publicId,
      paymentSubmittedAt: proof ? new Date() : undefined,
      adminNote: null
    },
    create: {
      studentId: student.id,
      userId: req.user!.id,
      courseId: course.id,
      status: isFree ? "ACTIVE" : "PENDING",
      paymentStatus: isFree ? "NOT_REQUIRED" : "UNDER_REVIEW",
      paidAmount: req.body.paidAmount ? Number(req.body.paidAmount) : undefined,
      paymentProofUrl: proof?.url,
      paymentProofPublicId: proof?.publicId,
      paymentSubmittedAt: proof ? new Date() : undefined,
      enrolledAt: isFree ? new Date() : undefined
    }
  });

  await prisma.notification.create({
    data: {
      userId: req.user!.id,
      title: isFree ? "Enrollment active" : "Enrollment request submitted",
      body: isFree ? `You are enrolled in ${course.title}.` : `Your payment proof for ${course.title} is under admin review.`,
      type: "ENROLLMENT"
    }
  });

  res.status(201).json({
    message: isFree ? "Enrollment activated" : "Enrollment request submitted for admin verification",
    bank: { name: "Meezan Bank", accountTitle: "AtechSkills", accountNumber: "9235875734895" },
    enrollment
  });
}));

lmsRouter.get("/admin/enrollment-requests", requireRole("Super Admin", "Admin"), asyncRoute(async (_req, res) => {
  const enrollments = await prisma.enrollment.findMany({
    where: { status: "PENDING" },
    include: { student: { include: { user: true } }, course: true, verifiedBy: true },
    orderBy: { requestedAt: "desc" }
  });
  res.json(enrollments);
}));

lmsRouter.patch("/admin/enrollments/:id/verify", requireRole("Super Admin", "Admin"), asyncRoute(async (req, res) => {
  const enrollment = await prisma.enrollment.update({
    where: { id: String(req.params.id) },
    data: { status: "ACTIVE", paymentStatus: "VERIFIED", verifiedAt: new Date(), verifiedById: req.user!.id, enrolledAt: new Date(), adminNote: req.body.adminNote }
  });
  await prisma.notification.create({
    data: { userId: enrollment.userId, title: "Enrollment confirmed", body: "Admin verified your payment proof. Your course is active now.", type: "ENROLLMENT" }
  });
  res.json(enrollment);
}));

lmsRouter.patch("/admin/enrollments/:id/approve-payment", requireRole("Super Admin", "Admin"), asyncRoute(async (req, res) => {
  const enrollment = await prisma.enrollment.update({
    where: { id: String(req.params.id) },
    data: { status: "ACTIVE", paymentStatus: "VERIFIED", verifiedAt: new Date(), verifiedById: req.user!.id, enrolledAt: new Date(), adminNote: req.body.adminNote ?? "Payment approved." }
  });
  await prisma.notification.create({
    data: { userId: enrollment.userId, title: "Payment approved", body: "Admin approved your payment proof. Your course is active now.", type: "PAYMENT" }
  });
  await prisma.auditLog.create({ data: { actorId: req.user!.id, action: "PAYMENT_APPROVED", entity: "Enrollment", entityId: enrollment.id } });
  res.json(enrollment);
}));

lmsRouter.patch("/admin/enrollments/:id/reject", requireRole("Super Admin", "Admin"), asyncRoute(async (req, res) => {
  const enrollment = await prisma.enrollment.update({
    where: { id: String(req.params.id) },
    data: { status: "REJECTED", paymentStatus: "REJECTED", adminNote: req.body.adminNote ?? "Payment proof could not be verified." }
  });
  await prisma.notification.create({
    data: { userId: enrollment.userId, title: "Enrollment needs attention", body: enrollment.adminNote ?? "Please upload a valid payment proof.", type: "ENROLLMENT" }
  });
  res.json(enrollment);
}));

lmsRouter.get("/admin/student-performance", requireRole("Super Admin", "Admin", "Teacher"), asyncRoute(async (_req, res) => {
  const students = await prisma.student.findMany({
    include: {
      user: true,
      enrollments: { include: { course: { include: { sessions: true } } } },
      attendance: true,
      attempts: true,
      certificates: true,
      presences: true
    },
    orderBy: { user: { name: "asc" } }
  });

  res.json(students.map((student) => {
    const scheduledSessionIds = new Set(student.enrollments.flatMap((enrollment) => enrollment.course.sessions.map((session) => session.id)));
    const attendanceTotal = scheduledSessionIds.size;
    const present = student.attendance.filter((item) => item.status === "PRESENT" && item.liveSessionId && scheduledSessionIds.has(item.liveSessionId)).length;
    const quizScores = student.attempts.map((attempt) => attempt.score ?? 0);
    const averageQuizScore = quizScores.length ? Math.round(quizScores.reduce((sum, score) => sum + score, 0) / quizScores.length) : 0;
    return {
      id: student.id,
      name: student.user.name,
      email: student.user.email,
      enrollments: student.enrollments,
      attendancePercentage: attendanceTotal ? Math.round((present / attendanceTotal) * 100) : 0,
      attendancePresent: present,
      attendanceTotal,
      averageQuizScore,
      certificates: student.certificates.length,
      liveMinutes: Math.round(student.presences.reduce((sum, item) => sum + item.totalSeconds, 0) / 60)
    };
  }));
}));

lmsRouter.get("/live-sessions", requireRole("Teacher", "Admin", "Super Admin"), asyncRoute(async (_req, res) => {
  const sessions = await prisma.liveSession.findMany({
    include: { course: true, presences: true, attendance: true, recording: true },
    orderBy: { startsAt: "desc" }
  });
  res.json(sessions);
}));

lmsRouter.post("/live-sessions/generate", requireRole("Teacher", "Admin", "Super Admin"), validate(liveSessionGenerationSchema), asyncRoute(async (req, res) => {
  const course = await prisma.course.findUnique({ where: { id: req.body.courseId } });
  if (!course) return res.status(404).json({ error: "Course not found" });

  const firstStartsAt = new Date(req.body.firstStartsAt);
  const sessions = await prisma.$transaction(
    Array.from({ length: req.body.totalSessions }, (_, index) => {
      const startsAt = addDays(firstStartsAt, index * req.body.repeatEveryDays);
      return prisma.liveSession.create({
        data: {
          courseId: req.body.courseId,
          title: `${req.body.titlePrefix} ${index + 1}`,
          startsAt,
          endsAt: calculateEndsAt(startsAt, req.body.expectedDurationMinutes),
          expectedDurationMinutes: req.body.expectedDurationMinutes,
          attendanceThresholdPercent: req.body.attendanceThresholdPercent,
          meetingUrl: req.body.meetingUrl,
          provider: req.body.provider,
          freeAccess: req.body.freeAccess
        }
      });
    })
  );

  await notifyActiveCourseStudents(
    course.id,
    "Class schedule published",
    `${sessions.length} class${sessions.length === 1 ? "" : "es"} scheduled for ${course.title}. Check your dashboard for live session IDs and timings.`
  );
  await prisma.auditLog.create({ data: { actorId: req.user!.id, action: "LIVE_SESSIONS_GENERATED", entity: "Course", entityId: course.id, metadata: { count: sessions.length } } });
  res.status(201).json({ course, sessions });
}));

lmsRouter.post("/live-sessions", requireRole("Teacher", "Admin", "Super Admin"), validate(liveSessionSchema), asyncRoute(async (req, res) => {
  const startsAt = new Date(req.body.startsAt);
  const session = await prisma.liveSession.create({
    data: {
      ...req.body,
      startsAt,
      endsAt: req.body.endsAt ? new Date(req.body.endsAt) : calculateEndsAt(startsAt, req.body.expectedDurationMinutes)
    }
  });
  await notifyActiveCourseStudents(session.courseId, "New live class scheduled", `${session.title} has been scheduled. Check your dashboard for the live session ID and timing.`);
  await prisma.auditLog.create({ data: { actorId: req.user!.id, action: "LIVE_SESSION_CREATED", entity: "LiveSession", entityId: session.id } });
  res.status(201).json(session);
}));

lmsRouter.post("/live-sessions/:id/finalize-attendance", requireRole("Teacher", "Admin", "Super Admin"), asyncRoute(async (req, res) => {
  const result = await finalizeSessionAttendance(String(req.params.id));
  if (!result) return res.status(404).json({ error: "Live session not found" });
  await prisma.auditLog.create({ data: { actorId: req.user!.id, action: "ATTENDANCE_FINALIZED", entity: "LiveSession", entityId: result.session.id, metadata: { presentMarked: result.presentMarked, absentMarked: result.absentMarked } } });
  res.json(result);
}));

lmsRouter.post("/live-sessions/:id/join", asyncRoute(async (req, res) => {
  const session = await prisma.liveSession.findUnique({ where: { id: String(req.params.id) }, include: { course: true } });
  if (!session) return res.status(404).json({ error: "Live session not found" });

  const student = await ensureStudentForUser(req.user!.id);
  if (!session.freeAccess) {
    const enrollment = await prisma.enrollment.findUnique({ where: { studentId_courseId: { studentId: student.id, courseId: session.courseId } } });
    if (!enrollment || enrollment.status !== "ACTIVE") return res.status(403).json({ error: "Active enrollment is required to join this class." });
  }

  const presence = await prisma.classPresence.upsert({
    where: { studentId_liveSessionId: { studentId: student.id, liveSessionId: session.id } },
    update: { lastSeenAt: new Date(), leftAt: null },
    create: { studentId: student.id, liveSessionId: session.id }
  });

  await prisma.liveSession.update({ where: { id: session.id }, data: { status: "LIVE" } });
  res.json({ meetingUrl: session.meetingUrl, requiredSeconds: requiredSecondsForSession(session), presence });
}));

lmsRouter.post("/live-sessions/:id/heartbeat", asyncRoute(async (req, res) => {
  const student = await ensureStudentForUser(req.user!.id);
  const result = await updatePresenceTime(student.id, String(req.params.id));
  res.json(result);
}));

lmsRouter.post("/live-sessions/:id/leave", asyncRoute(async (req, res) => {
  const student = await ensureStudentForUser(req.user!.id);
  const result = await updatePresenceTime(student.id, String(req.params.id), true);
  res.json(result);
}));

lmsRouter.post("/attendance", requireRole("Teacher", "Admin", "Super Admin"), asyncRoute(async (req, res) => {
  const attendance = await prisma.attendance.upsert({
    where: { studentId_liveSessionId: { studentId: req.body.studentId, liveSessionId: req.body.liveSessionId } },
    update: { status: req.body.status, notes: req.body.notes },
    create: req.body
  });
  res.status(201).json(attendance);
}));

lmsRouter.post("/assignments", requireRole("Teacher", "Admin", "Super Admin"), asyncRoute(async (req, res) => res.status(201).json(await prisma.assignment.create({ data: req.body }))));
lmsRouter.post("/submissions", asyncRoute(async (req, res) => res.status(201).json(await prisma.submission.create({ data: { ...req.body, userId: req.user!.id } }))));
lmsRouter.post("/quizzes", requireRole("Teacher", "Admin", "Super Admin"), asyncRoute(async (req, res) => res.status(201).json(await prisma.quiz.create({ data: req.body }))));
lmsRouter.post("/certificates", requirePermission("certificates.issue"), asyncRoute(async (req, res) => res.status(201).json(await prisma.certificate.create({ data: req.body }))));
lmsRouter.get("/dashboard/:role", asyncRoute(async (req, res) => res.json({ role: req.params.role, modules: ["courses", "attendance", "recordings", "assignments", "quizzes", "certificates", "notifications"] })));
