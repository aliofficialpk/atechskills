import express from "express";
import morgan from "morgan";
import { env } from "./config.js";
import { applySecurity } from "./middleware/security.js";
import { adminRouter } from "./modules/admin.js";
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

  app.use(env.API_PREFIX, publicRouter);
  app.use(`${env.API_PREFIX}/auth`, authRouter);
  app.use(`${env.API_PREFIX}/lms`, lmsRouter);
  app.use(`${env.API_PREFIX}/admin`, adminRouter);
  app.use(`${env.API_PREFIX}/uploads`, uploadsRouter);

  app.use((_req, res) => res.status(404).json({ error: "Route not found" }));
  app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  });

  return app;
}
