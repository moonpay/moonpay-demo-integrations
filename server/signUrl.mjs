// Shared URL Signing Server for MoonPay Widget Demos
//
// WHY THIS EXISTS:
// MoonPay requires all widget URLs to be signed with your secret key (HMAC-SHA256)
// before the widget will load. This prevents tampering with parameters like wallet
// addresses and currency amounts on the client side. The secret key must NEVER be
// exposed in frontend code — it stays on this server.
//
// FLOW:
// 1. Frontend builds a widget URL with parameters (apiKey, walletAddress, etc.)
// 2. Frontend sends that URL to this server's /sign-url endpoint
// 3. This server validates the URL, then signs its query string with HMAC-SHA256
// 4. The signature is returned to the frontend, which passes it to the MoonPay SDK
//
// SECURITY MODEL — READ THIS BEFORE COPYING THIS FILE INTO A REAL PRODUCT:
// An endpoint that HMACs whatever string a caller supplies is a *signing oracle*.
// The signature is what proves to MoonPay that the parameters were not tampered
// with, so an unrestricted endpoint hands an attacker the exact capability the
// signature exists to prevent: minting valid signatures for arbitrary wallet
// addresses and amounts. CORS does not help — it is a browser-side control and does
// nothing against curl or a server-to-server request.
//
// This server therefore signs a URL only when ALL of the following hold:
//   1. `url` is a single, well-formed, length-bounded absolute URL
//   2. its scheme is https and its hostname is in the MoonPay host allowlist
//   3. its `apiKey` query parameter equals this deployment's own public API key
//   4. the caller is within the per-IP rate limit
//
// In a real product, go further: bind the signature to an authenticated session and
// derive walletAddress and amounts server-side from your own records instead of
// accepting them from the client at all.
//
// USAGE:
// All demo projects in this repo point to http://localhost:5000/sign-url by default.
// Run this single server instead of running a separate signUrl.mjs per project.
//
//   cd server
//   cp .env.example .env   # Fill in MOONPAY_SECRET_KEY and MOONPAY_API_KEY
//   npm install
//   npm start

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import {
  DEFAULT_ALLOWED_HOSTS,
  createRateLimiter,
  generateSignature,
  parseList,
  validateWidgetUrl,
} from './signing.mjs';

// --- Configuration -------------------------------------------------------------

const secretKey = process.env.MOONPAY_SECRET_KEY;
if (!secretKey) {
  console.error('MOONPAY_SECRET_KEY is not set. Copy .env.example to .env and fill in your key.');
  process.exit(1);
}

// The public (publishable) key this deployment signs for. Binding signatures to it
// stops the endpoint from being used to sign URLs for someone else's integration.
const publicApiKey = process.env.MOONPAY_API_KEY;
if (!publicApiKey) {
  console.error('MOONPAY_API_KEY is not set. Copy .env.example to .env and fill in your public key.');
  process.exit(1);
}

if (secretKey === publicApiKey) {
  console.error('MOONPAY_SECRET_KEY and MOONPAY_API_KEY must not be set to the same value.');
  process.exit(1);
}

const allowedOrigins = parseList(process.env.CORS_ORIGINS, [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:8080',
]);

const allowedHosts = parseList(process.env.MOONPAY_ALLOWED_HOSTS, DEFAULT_ALLOWED_HOSTS);

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 60;

// --- App -----------------------------------------------------------------------

const app = express();

// Do not advertise the framework, and do not trust proxy headers: with no proxy in
// front of this demo, req.ip is the direct socket address. Enabling 'trust proxy'
// here would let a client spoof X-Forwarded-For and bypass the rate limiter.
app.disable('x-powered-by');

app.use(cors({ origin: allowedOrigins, methods: ['GET'] }));

const rateLimiter = createRateLimiter({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX_REQUESTS,
});

// unref() keeps this timer from holding the event loop open during shutdown.
const sweepTimer = setInterval(() => rateLimiter.sweep(), RATE_LIMIT_WINDOW_MS);
sweepTimer.unref();

app.get('/sign-url', (req, res) => {
  // Signatures are per-URL and must never be cached by a browser or intermediary.
  res.set('Cache-Control', 'no-store');

  if (rateLimiter.isLimited(req.ip ?? 'unknown')) {
    return res.status(429).json({ error: 'Too many requests' });
  }

  const validation = validateWidgetUrl(req.query.url, { allowedHosts, publicApiKey });
  if (!validation.ok) {
    // Safe to return: the reason describes the caller's own input and reveals
    // nothing about the secret key or server internals.
    return res.status(400).json({ error: validation.reason });
  }

  try {
    return res.json({ signature: generateSignature(validation.url, secretKey) });
  } catch (error) {
    // Log the failure without echoing the URL, which carries wallet addresses.
    console.error('Error generating signature:', error instanceof Error ? error.message : error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Signing server running on http://localhost:${PORT}`);
  console.log(`Signing widget URLs for hosts: ${allowedHosts.join(', ')}`);
});

// Close listeners and drain in-flight connections on a termination signal so the
// process is not SIGKILLed mid-response by a container runtime.
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    console.log(`Received ${signal}, shutting down.`);
    server.close(() => process.exit(0));
  });
}
