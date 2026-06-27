type JsonResponse = {
  status(code: number): { json(payload: unknown): void };
};

export default function handler(_req: unknown, res: JsonResponse) {
  res.status(200).json({ status: "ok", service: "atechskills-api", route: "/api/v1/health" });
}
