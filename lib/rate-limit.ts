type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 5;

type RateLimitStore = Map<string, RateLimitEntry>;

const globalForRateLimit = globalThis as typeof globalThis & {
  rateLimitStore?: RateLimitStore;
};

const store = globalForRateLimit.rateLimitStore ?? new Map<string, RateLimitEntry>();

if (!globalForRateLimit.rateLimitStore) {
  globalForRateLimit.rateLimitStore = store;
}

function getClientIdentifier(request: { ip?: string | null; headers: Headers }) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const fallback = request.ip ?? null;
  const rawIp = forwardedFor?.split(",")[0]?.trim() || realIp || fallback || "unknown";

  return rawIp;
}

export function rateLimitAuthRequest(request: { ip?: string | null; headers: Headers; nextUrl: { pathname: string } }) {
  const clientId = getClientIdentifier(request);
  const key = `${request.nextUrl.pathname}:${clientId}`;
  const now = Date.now();
  const currentEntry = store.get(key);

  if (!currentEntry || currentEntry.resetAt <= now) {
    store.set(key, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    });

    return {
      allowed: true,
      remaining: RATE_LIMIT_MAX_REQUESTS - 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    };
  }

  if (currentEntry.count >= RATE_LIMIT_MAX_REQUESTS) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: currentEntry.resetAt,
    };
  }

  currentEntry.count += 1;
  store.set(key, currentEntry);

  return {
    allowed: true,
    remaining: RATE_LIMIT_MAX_REQUESTS - currentEntry.count,
    resetAt: currentEntry.resetAt,
  };
}

/*
  Production note:
  Replace this in-memory map with Redis (for example, INCR + EXPIRE or a
  sliding-window sorted set) so rate limits are shared across all instances.
*/
