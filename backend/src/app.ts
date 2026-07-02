import express from "express";
import morgan from "morgan";
import { env } from "./config.js";
import { applySecurity } from "./middleware/security.js";
import { adminRouter } from "./modules/admin.js";
import { adminCoursesAliasRouter, adminTeachersAliasRouter } from "./modules/admin-course-alias.js";
import { authRouter } from "./modules/auth.js";
import { lmsRouter } from "./modules/lms.js";
import { publicRouter } from "./modules/public.js";
import { uploadsRouter } from "./modules/uploads.js";

export function createApp() {
  const app = express();
  applySecurity(app);
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));

  app.get("/", (_req, res) => res.json({ status: "ok", service: "atechskills-api", health: "/api/v1/health" }));

  const prefixes = Array.from(new Set([env.API_PREFIX, "/api/v1", "/v1"]));
  for (const prefix of prefixes) {
    app.use(prefix, publicRouter);
    app.use(`${prefix}/auth`, authRouter);
    app.use(`${prefix}/lms`, lmsRouter);
    app.use(`${prefix}/admin`, adminRouter);
    app.use(`${prefix}/admin-courses`, adminCoursesAliasRouter);
    app.use(`${prefix}/admin-teachers`, adminTeachersAliasRouter);
    app.use(`${prefix}/uploads`, uploadsRouter);
  }

  app.use((_req, res) => res.status(404).json({ error: "Route not found" }));
  app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  });

  return app;
}
