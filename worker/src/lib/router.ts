/**
 * Tiny path-pattern router with params (e.g. /contacts/:id).
 * Zero dependencies; deterministic matching (static > param segments).
 */

export type Handler<Ctx> = (ctx: Ctx, params: Record<string, string>) => Promise<Response> | Response;

interface Route<Ctx> {
  method: string;
  segments: string[];
  handler: Handler<Ctx>;
}

export class Router<Ctx> {
  private routes: Route<Ctx>[] = [];

  add(method: string, pattern: string, handler: Handler<Ctx>): this {
    this.routes.push({
      method: method.toUpperCase(),
      segments: pattern.split('/').filter(Boolean),
      handler,
    });
    return this;
  }

  get(p: string, h: Handler<Ctx>) { return this.add('GET', p, h); }
  post(p: string, h: Handler<Ctx>) { return this.add('POST', p, h); }
  put(p: string, h: Handler<Ctx>) { return this.add('PUT', p, h); }
  patch(p: string, h: Handler<Ctx>) { return this.add('PATCH', p, h); }
  delete(p: string, h: Handler<Ctx>) { return this.add('DELETE', p, h); }

  match(method: string, path: string): { handler: Handler<Ctx>; params: Record<string, string> } | null {
    const parts = path.split('/').filter(Boolean);
    const upper = method.toUpperCase();
    let methodMismatch = false;

    for (const route of this.routes) {
      if (route.segments.length !== parts.length) continue;
      const params: Record<string, string> = {};
      let ok = true;
      for (let i = 0; i < route.segments.length; i++) {
        const seg = route.segments[i];
        if (seg.startsWith(':')) {
          params[seg.slice(1)] = decodeURIComponent(parts[i]);
        } else if (seg !== parts[i]) {
          ok = false;
          break;
        }
      }
      if (!ok) continue;
      if (route.method !== upper && !(upper === 'HEAD' && route.method === 'GET')) {
        methodMismatch = true;
        continue;
      }
      return { handler: route.handler, params };
    }
    return methodMismatch ? { handler: (() => new Response(null, { status: 405 })) as Handler<Ctx>, params: {} } : null;
  }
}
