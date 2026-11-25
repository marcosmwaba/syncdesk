import type { Context } from 'hono';
import { z } from 'zod';

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public fields?: Record<string, string>,
  ) {
    super(message);
  }
}

export const ok = (c: Context, data: unknown, meta?: unknown, status = 200) =>
  c.json(meta === undefined ? { data } : { data, meta }, status as 200);

export const body = (c: Context): Promise<unknown> => c.req.json().catch(() => ({}));

export function parse<S extends z.ZodTypeAny>(schema: S, data: unknown): z.infer<S> {
  const r = schema.safeParse(data);
  if (!r.success) {
    const fields: Record<string, string> = {};
    for (const i of r.error.issues) fields[i.path.join('.') || '_'] = i.message;
    throw new ApiError(400, 'VALIDATION', 'Check the highlighted fields.', fields);
  }
  return r.data;
}
