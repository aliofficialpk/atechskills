import compression from "compression";
import cookieParser from "cookie-parser";
import cors, { type CorsOptions } from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import type { Express, RequestHandler } from "express";
import { env } from "../config.js";

const applyHelmet = helmet as unknown as () => RequestHandler;
const normalizeOrigin = (origin: string) => origin.replace(/\/$/, "");
const allowedOrigins = new Set([
  normalizeOrigin(env.FRONTEND_URL),
  "https://atechskills.vercel.app",
  "https://atechskills.com",
  "https://www.atechskills.com",
  "http://localhost:8000"
]);

const corsOptions: CorsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(normalizeOrigin(origin))) {
      callback(null, true);
      return;
    }

    callback(null, false);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
};

export function applySecurity(app: Express) {
  app.set("trust proxy", 1);
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin && allowedOrigins.has(normalizeOrigin(origin))) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Vary", "Origin");
      res.setHeader("Access-Control-Allow-Credentials", "true");
      res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    }
    if (req.method === "OPTIONS") {
      res.status(204).end();
      return;
    }
    next();
  });
  app.use(applyHelmet());
  app.use(compression());
  app.use(cookieParser());
  app.use(cors(corsOptions));
  app.options("*", cors(corsOptions));
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 250,
      standardHeaders: "draft-7",
      legacyHeaders: false
    })
  );
}
