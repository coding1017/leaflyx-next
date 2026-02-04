// lib/rateLimit.ts
type Entry = { count: number; resetAt: number };

const store = new Map<string, Entry>();

export function rateLimit(opts: {
  key: string;          // e.g. "signup:ip:1.2.3.4" or "signin:ip:email"
  limit: number;        // max requests per window
  windowMs: number;     // window size in ms
}) {
  const now = Date.now();
  const entry = store.get(opts.key);

  if (!entry || entry.resetAt <= now) {
    const next: Entry = { count: 1, resetAt: now + opts.windowMs };
    store.set(opts.key, next);
    return { ok: true, remaining: opts.limit - 1, resetAt: next.resetAt };
  }

  if (entry.count >= opts.limit) {
    return { ok: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count += 1;
  store.set(opts.key, entry);
  return { ok: true, remaining: opts.limit - entry.count, resetAt: entry.resetAt };
}

export function getIp(req: Request) {
  // Works locally + behind proxies (basic)
  const xf = req.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "local";
}
