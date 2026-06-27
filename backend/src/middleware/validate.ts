import type { NextFunction, Request, Response } from "express";
import type { z } from "zod";

export function validate(schema: z.ZodTypeAny) {
  return (req: Request, res: Response, next: NextFunction) => {
    const parsed = schema.safeParse({ body: req.body, params: req.params, query: req.query });
    if (!parsed.success) return res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
    next();
  };
}
