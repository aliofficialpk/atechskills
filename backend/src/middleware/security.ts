import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import type { Express, RequestHandler } from "express";
import { env } from "../config.js";

const applyHelmet = helmet as unknown as () => RequestHandler;

export function applySecurity(app: Express) {
  app.set("trust proxy", 1);
  app.use(applyHelmet());
  app.use(compression());
  app.use(cookieParser());
  app.use(cors({ origin: env.FRONTEND_URL, credentials: true }));
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 250,
      standardHeaders: "draft-7",
      legacyHeaders: false
    })
  );
}
