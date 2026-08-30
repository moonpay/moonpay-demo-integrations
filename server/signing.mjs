// Validation and signing primitives for the MoonPay demo signing server.
//
// Kept separate from signUrl.mjs (the HTTP wiring) so the security-critical logic is
// pure, dependency-free, and unit-testable without binding a port. See signUrl.mjs
// for the threat model this module implements.

import crypto from 'crypto';

/** Longest `url` value accepted, checked before any parsing or hashing work. */
export const MAX_URL_LENGTH = 2048;

/** MoonPay widget hosts signed by default when MOONPAY_ALLOWED_HOSTS is unset. */
export const DEFAULT_ALLOWED_HOSTS = Object.freeze([
  'buy.moonpay.com',
  'sell.moonpay.com',
  'buy-sandbox.moonpay.com',
  'sell-sandbox.moonpay.com',
]);

/**
 * Parses a comma-separated environment variable into a trimmed, non-empty list.
 *
 * @param {string | undefined} value raw environment value
 * @param {readonly string[]} fallback used when the value is absent or all-empty
 * @returns {string[]}
 */
export const parseList = (value, fallback) => {
  if (!value) return [...fallback];
  const items = value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  return items.length > 0 ? items : [...fallback];
};

/**
 * Compares two strings in constant time, without leaking their lengths through an
 * early return on differing byte lengths.
 *
 * @param {string} a
 * @param {string} b
 * @returns {boolean}
 */
export const safeEqual = (a, b) => {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  // timingSafeEqual throws on length mismatch, so hash first to get fixed-width
  // inputs. The values compared here are public keys, not secrets, but a uniform
  // comparison keeps the code correct if it is ever reused for a secret.
  const digestA = crypto.createHash('sha256').update(bufA).digest();
  const digestB = crypto.createHash('sha256').update(bufB).digest();
  return crypto.timingSafeEqual(digestA, digestB);
};

/**
 * Decides whether a caller-supplied URL is a MoonPay widget URL this deployment is
 * allowed to sign.
 *
 * Rejecting here is the whole point of the module: an endpoint that HMACs arbitrary
 * input is a signing oracle, and the signature is exactly what proves to MoonPay
 * that widget parameters were not tampered with.
 *
 * @param {unknown} rawUrl value of the `url` query parameter as the router parsed it
 * @param {{ allowedHosts: readonly string[], publicApiKey: string }} config
 * @returns {{ ok: true, url: URL } | { ok: false, reason: string }}
 */
export const validateWidgetUrl = (rawUrl, { allowedHosts, publicApiKey }) => {
  // A repeated query parameter (?url=a&url=b) arrives as an array. Reject it rather
  // than silently signing whichever element wins string coercion.
  if (typeof rawUrl !== 'string' || rawUrl.length === 0) {
    return { ok: false, reason: 'URL is required and must be a single string value' };
  }

  if (rawUrl.length > MAX_URL_LENGTH) {
    return { ok: false, reason: `URL exceeds the maximum length of ${MAX_URL_LENGTH} characters` };
  }

  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return { ok: false, reason: 'URL is not a valid absolute URL' };
  }

  if (parsed.protocol !== 'https:') {
    return { ok: false, reason: 'URL must use https' };
  }

  // Exact hostname match only. A suffix check such as endsWith('.moonpay.com')
  // would also accept an attacker-controlled host like "moonpay.com.evil.example".
  if (!allowedHosts.includes(parsed.hostname)) {
    return { ok: false, reason: 'URL host is not an allowed MoonPay widget host' };
  }

  const apiKey = parsed.searchParams.get('apiKey');
  if (!apiKey) {
    return { ok: false, reason: 'URL is missing the apiKey parameter' };
  }

  if (!safeEqual(apiKey, publicApiKey)) {
    return { ok: false, reason: 'URL apiKey does not match this signing server' };
  }

  return { ok: true, url: parsed };
};

/**
 * Signs the query string of an already-validated widget URL.
 *
 * MoonPay's scheme signs the search component (including the leading '?') with
 * HMAC-SHA256 and expects standard base64.
 *
 * @param {URL} url a URL that has passed validateWidgetUrl
 * @param {string} secretKey MoonPay secret key; never leaves the server
 * @returns {string} base64 HMAC-SHA256 signature
 */
export const generateSignature = (url, secretKey) =>
  crypto.createHmac('sha256', secretKey).update(url.search).digest('base64');

/**
 * Creates a fixed-window, per-key rate limiter.
 *
 * Deliberately dependency-free and in-process: this is a demo. A real deployment
 * needs a shared store (Redis) so the limit survives restarts and holds across
 * multiple instances.
 *
 * @param {{ windowMs: number, max: number }} options
 */
export const createRateLimiter = ({ windowMs, max }) => {
  /** @type {Map<string, { count: number, resetAt: number }>} */
  const buckets = new Map();

  return {
    /**
     * @param {string} key caller identity (an IP address in this demo)
     * @param {number} now injectable clock, so tests do not have to sleep
     * @returns {boolean} true when the caller has exceeded its quota
     */
    isLimited(key, now = Date.now()) {
      const entry = buckets.get(key);

      if (!entry || now >= entry.resetAt) {
        buckets.set(key, { count: 1, resetAt: now + windowMs });
        return false;
      }

      entry.count += 1;
      return entry.count > max;
    },

    /**
     * Drops expired buckets so the Map cannot grow without bound under IP churn.
     *
     * @param {number} now
     */
    sweep(now = Date.now()) {
      for (const [key, entry] of buckets) {
        if (now >= entry.resetAt) buckets.delete(key);
      }
    },

    get size() {
      return buckets.size;
    },
  };
};
