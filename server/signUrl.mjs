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
// 3. This server signs the URL's query string with HMAC-SHA256 using the secret key
// 4. The signature is returned to the frontend, which passes it to the MoonPay SDK
//
// USAGE:
// All demo projects in this repo point to http://localhost:5000/sign-url by default.
// Run this single server instead of running a separate signUrl.mjs per project.
//
//   cd server
//   cp .env.example .env   # Fill in your MOONPAY_SECRET_KEY
//   npm install
//   npm start

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import crypto from 'crypto';

const app = express();
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',')
  : ['http://localhost:3000', 'http://localhost:3001'];
app.use(cors({ origin: allowedOrigins }));

const secretKey = process.env.MOONPAY_SECRET_KEY;
if (!secretKey) {
  console.error('MOONPAY_SECRET_KEY is not set. Copy .env.example to .env and fill in your key.');
  process.exit(1);
}

const generateSignature = (url) => {
  return crypto
    .createHmac('sha256', secretKey)
    .update(new URL(url).search)
    .digest('base64');
};

app.get('/sign-url', (req, res) => {
  const { url } = req.query;
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    const signature = generateSignature(url);
    res.json({ signature });
  } catch (error) {
    console.error('Error generating signature:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Signing server running on http://localhost:${PORT}`);
});
