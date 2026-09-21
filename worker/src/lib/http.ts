/**
 * Minimal zero-dependency HTTP helpers: JSON envelope, CORS, errors, request ids.
 * Success: { data: ... }   Failure: { error: { code, message, details? }, requestId }
 */

export class ApiError extends Error {
  status: number;
  code: string;
  details?: unknown;
  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const badRequest = (message: string, details?: unknown) =>
  new ApiError(400, 'bad_request', message, details);
export const unauthorized = (message = 'Authentication required') =>
  new ApiError(401, 'unauthorized', message);
export const forbidden = (message = 'You do not have access to this resource') =>
  new ApiError(403, 'forbidden', message);
export const notFound = (message = 'Resource not found') =>
  new ApiError(404, 'not_found', message);
export const conflict = (message: string, details?: unknown) =>
  new ApiError(409, 'conflict', message, details);
export const tooManyRequests = (message = 'Too many requests — please slow down') =>
  new ApiError(429, 'rate_limited', message);
export const unprocessable = (message: string, details?: unknown) =>
  new ApiError(422, 'validation_failed', message, details);
export const serverError = (message = 'Something went wrong on our side') =>
  new ApiError(500, 'server_error', message);
export const badGateway = (message: string, details?: unknown) =>
  new ApiError(502, 'upstream_error', message, details);

export function json(data: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers);
  headers.set('content-type', 'application/json; charset=utf-8');
  return new Response(JSON.stringify({ data }), { ...init, headers });
}

export function errorResponse(err: unknown, requestId: string): Response {
  const apiErr =
    err instanceof ApiError
      ? err
      : new ApiError(500, 'server_error', err instanceof Error ? err.message : 'Unexpected error');
  if (!(err instanceof ApiError)) {
    console.error(`[${requestId}] Unhandled error:`, err);
  }
  const body: Record<string, unknown> = {
    error: { code: apiErr.code, message: apiErr.message },
    requestId,
  };
  if (apiErr.details !== undefined) (body.error as Record<string, unknown>).details = apiErr.details;
  return new Response(JSON.stringify(body), {
    status: apiErr.status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

/** Resolve allowed CORS origin for a request. */
export function corsOrigin(request: Request, corsOrigins?: string): string | null {
  const origin = request.headers.get('origin');
  if (!origin) return null;
  const list = (corsOrigins || '*')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  if (list.includes('*')) return origin;
  return list.includes(origin) ? origin : null;
}

export function corsHeaders(request: Request, corsOrigins?: string): Record<string, string> {
  const allowed = corsOrigin(request, corsOrigins);
  return {
    'access-control-allow-origin': allowed ?? '',
    'access-control-allow-methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    'access-control-allow-headers': 'content-type,authorization,x-idempotency-key',
    'access-control-allow-credentials': 'true',
    'access-control-max-age': '86400',
    vary: 'origin',
  };
}

export function withCors(request: Request, response: Response, corsOrigins?: string): Response {
  const headers = new Headers(response.headers);
  for (const [k, v] of Object.entries(corsHeaders(request, corsOrigins))) {
    if (v) headers.set(k, v);
  }
  // Never leak internal error text through CORS-less reads; keep requestId visible for support.
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export async function readJson<T = Record<string, unknown>>(request: Request): Promise<T> {
  try {
    const text = await request.text();
    if (!text) return {} as T;
    return JSON.parse(text) as T;
  } catch {
    throw badRequest('Request body must be valid JSON');
  }
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function clientIp(request: Request): string {
  return (
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    'unknown'
  );
}
