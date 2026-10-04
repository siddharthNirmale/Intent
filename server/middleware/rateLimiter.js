/**
 * Rate Limiting & Abuse Prevention Middleware
 *
 * Provides in-memory sliding-window request throttling with sensible limits:
 * - authLimiter: Protects login & registration against brute-force attacks and credential stuffing
 * - compileLimiter: Prevents prompt compilation flooding and automated spam
 * - apiKeyLimiter: Throttles API key verification to prevent using backend as an open proxy
 *
 * Implements standard HTTP 429 response codes and Retry-After headers without external dependencies.
 */

// Memory stores for tracking client request timestamps
const stores = {
  auth: new Map(),
  compile: new Map(),
  apiKey: new Map(),
};

// Periodic garbage collection to prevent memory leaks from inactive IPs/users
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

setInterval(() => {
  const now = Date.now();
  for (const store of Object.values(stores)) {
    for (const [key, record] of store.entries()) {
      // Remove timestamps outside window
      record.timestamps = record.timestamps.filter((t) => now - t < record.windowMs);
      if (record.timestamps.length === 0) {
        store.delete(key);
      }
    }
  }
}, CLEANUP_INTERVAL_MS).unref(); // unref so timer doesn't prevent graceful server shutdown

/**
 * Extracts a safe client identifier (User ID if authenticated, else IP address)
 */
function getClientIdentifier(req) {
  if (req.user && req.user._id) {
    return `user:${req.user._id}`;
  }
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded && typeof forwarded === 'string') {
    return `ip:${forwarded.split(',')[0].trim()}`;
  }
  return `ip:${req.socket?.remoteAddress || req.ip || 'unknown'}`;
}

/**
 * Factory to create a sliding-window rate limit middleware
 *
 * @param {Object} options
 * @param {string} options.storeKey - Identifier for the store ('auth' | 'compile' | 'apiKey')
 * @param {number} options.windowMs - Time window in milliseconds
 * @param {number} options.max - Maximum allowed requests within window
 * @param {string} options.message - User-facing error message
 */
function createRateLimiter({ storeKey, windowMs, max, message }) {
  const store = stores[storeKey] || new Map();
  stores[storeKey] = store;

  return (req, res, next) => {
    const key = getClientIdentifier(req);
    const now = Date.now();

    if (!store.has(key)) {
      store.set(key, { timestamps: [now], windowMs });
      res.setHeader('RateLimit-Limit', max);
      res.setHeader('RateLimit-Remaining', max - 1);
      return next();
    }

    const record = store.get(key);
    // Filter timestamps within the current sliding window
    record.timestamps = record.timestamps.filter((t) => now - t < windowMs);

    if (record.timestamps.length >= max) {
      const oldestTimestamp = record.timestamps[0];
      const retryAfterSec = Math.max(1, Math.ceil((oldestTimestamp + windowMs - now) / 1000));

      res.setHeader('Retry-After', retryAfterSec);
      res.setHeader('RateLimit-Limit', max);
      res.setHeader('RateLimit-Remaining', 0);
      res.setHeader('RateLimit-Reset', Math.ceil((oldestTimestamp + windowMs) / 1000));

      return res.status(429).json({
        success: false,
        message: message || 'Too many requests. Please try again later.',
        retryAfter: retryAfterSec,
      });
    }

    record.timestamps.push(now);
    res.setHeader('RateLimit-Limit', max);
    res.setHeader('RateLimit-Remaining', max - record.timestamps.length);
    next();
  };
}

/**
 * Auth Rate Limiter
 * 10 attempts per 15 minutes per IP to block brute-force and credential stuffing
 */
export const authLimiter = createRateLimiter({
  storeKey: 'auth',
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: 'Too many authentication attempts. Please wait 15 minutes before trying again.',
});

/**
 * Compile Rate Limiter
 * 25 compilation requests per minute per user/IP to prevent flooding and abuse
 */
export const compileLimiter = createRateLimiter({
  storeKey: 'compile',
  windowMs: 60 * 1000, // 1 minute
  max: 25,
  message: 'Compilation request rate limit reached. Please wait a moment before sending more requests.',
});

/**
 * API Key Operations Rate Limiter
 * 15 validation/update operations per 15 minutes per user/IP
 */
export const apiKeyLimiter = createRateLimiter({
  storeKey: 'apiKey',
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15,
  message: 'Too many API key verification requests. Please wait a few minutes.',
});

export default {
  authLimiter,
  compileLimiter,
  apiKeyLimiter,
};
