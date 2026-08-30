// Unit tests for the signing server's security-critical validation logic.
//
// Uses the Node.js built-in test runner (node:test) so the demo gains real
// regression coverage without adding a dependency:
//
//   npm test --workspace=server

import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import test from 'node:test';

import {
  DEFAULT_ALLOWED_HOSTS,
  MAX_URL_LENGTH,
  createRateLimiter,
  generateSignature,
  parseList,
  validateWidgetUrl,
} from './signing.mjs';

const PUBLIC_KEY = 'pk_test_demo_public_key';
const SECRET_KEY = 'sk_test_demo_secret_key';
const CONFIG = { allowedHosts: DEFAULT_ALLOWED_HOSTS, publicApiKey: PUBLIC_KEY };

const widgetUrl = (params = {}) => {
  const url = new URL('https://buy.moonpay.com');
  url.searchParams.set('apiKey', PUBLIC_KEY);
  url.searchParams.set('currencyCode', 'eth');
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  return url.toString();
};

test('accepts a well-formed MoonPay widget URL carrying the configured apiKey', () => {
  const result = validateWidgetUrl(widgetUrl(), CONFIG);
  assert.equal(result.ok, true);
  assert.equal(result.url.hostname, 'buy.moonpay.com');
});

test('rejects a non-MoonPay host — the core signing-oracle guard', () => {
  const result = validateWidgetUrl(`https://evil.example/?apiKey=${PUBLIC_KEY}`, CONFIG);
  assert.equal(result.ok, false);
  assert.match(result.reason, /allowed MoonPay widget host/);
});

test('rejects a lookalike host that merely ends with the allowed domain', () => {
  const result = validateWidgetUrl(`https://buy.moonpay.com.evil.example/?apiKey=${PUBLIC_KEY}`, CONFIG);
  assert.equal(result.ok, false);
  assert.match(result.reason, /allowed MoonPay widget host/);
});

test('rejects a URL whose apiKey belongs to a different integration', () => {
  const result = validateWidgetUrl(widgetUrl({ apiKey: 'pk_test_someone_else' }), CONFIG);
  assert.equal(result.ok, false);
  assert.match(result.reason, /apiKey does not match/);
});

test('rejects a URL with no apiKey at all', () => {
  const result = validateWidgetUrl('https://buy.moonpay.com/?currencyCode=eth', CONFIG);
  assert.equal(result.ok, false);
  assert.match(result.reason, /missing the apiKey/);
});

test('rejects non-https schemes, including javascript: and data:', () => {
  for (const raw of ['http://buy.moonpay.com/?apiKey=x', 'javascript:alert(1)', 'data:text/html,x']) {
    const result = validateWidgetUrl(raw, CONFIG);
    assert.equal(result.ok, false, `expected rejection for ${raw}`);
  }
});

test('rejects a repeated url parameter, which Express parses as an array', () => {
  const result = validateWidgetUrl([widgetUrl(), 'https://evil.example'], CONFIG);
  assert.equal(result.ok, false);
  assert.match(result.reason, /single string value/);
});

test('rejects missing, empty, and non-string url values', () => {
  for (const raw of [undefined, null, '', 42, {}]) {
    assert.equal(validateWidgetUrl(raw, CONFIG).ok, false);
  }
});

test('rejects a relative URL', () => {
  const result = validateWidgetUrl('/sign-url?apiKey=x', CONFIG);
  assert.equal(result.ok, false);
  assert.match(result.reason, /valid absolute URL/);
});

test('rejects a URL longer than the configured maximum', () => {
  const result = validateWidgetUrl(widgetUrl({ pad: 'a'.repeat(MAX_URL_LENGTH) }), CONFIG);
  assert.equal(result.ok, false);
  assert.match(result.reason, /maximum length/);
});

test('signature is HMAC-SHA256 over the search component only', () => {
  const url = new URL(widgetUrl());
  const expected = crypto.createHmac('sha256', SECRET_KEY).update(url.search).digest('base64');
  assert.equal(generateSignature(url, SECRET_KEY), expected);
});

test('signature changes when a signed parameter changes', () => {
  const a = generateSignature(new URL(widgetUrl({ walletAddress: '0xaaa' })), SECRET_KEY);
  const b = generateSignature(new URL(widgetUrl({ walletAddress: '0xbbb' })), SECRET_KEY);
  assert.notEqual(a, b);
});

test('parseList trims entries and falls back when the value is blank', () => {
  assert.deepEqual(parseList('a , b ,,c', ['fallback']), ['a', 'b', 'c']);
  assert.deepEqual(parseList('  , ', ['fallback']), ['fallback']);
  assert.deepEqual(parseList(undefined, ['fallback']), ['fallback']);
});

test('rate limiter allows up to max requests then blocks within the window', () => {
  const limiter = createRateLimiter({ windowMs: 1_000, max: 3 });
  const now = 1_000_000;
  assert.equal(limiter.isLimited('1.2.3.4', now), false);
  assert.equal(limiter.isLimited('1.2.3.4', now), false);
  assert.equal(limiter.isLimited('1.2.3.4', now), false);
  assert.equal(limiter.isLimited('1.2.3.4', now), true);
});

test('rate limiter tracks callers independently and resets after the window', () => {
  const limiter = createRateLimiter({ windowMs: 1_000, max: 1 });
  const now = 1_000_000;
  assert.equal(limiter.isLimited('a', now), false);
  assert.equal(limiter.isLimited('b', now), false, 'a separate caller has its own bucket');
  assert.equal(limiter.isLimited('a', now), true);
  assert.equal(limiter.isLimited('a', now + 1_001), false, 'window elapsed');
});

test('rate limiter sweep drops expired buckets', () => {
  const limiter = createRateLimiter({ windowMs: 1_000, max: 5 });
  const now = 1_000_000;
  limiter.isLimited('a', now);
  limiter.isLimited('b', now);
  assert.equal(limiter.size, 2);
  limiter.sweep(now + 1_001);
  assert.equal(limiter.size, 0);
});
