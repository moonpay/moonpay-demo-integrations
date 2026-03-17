# MoonPay React SDK Demo - Sell

Demonstrates a **sell crypto** widget using [`@moonpay/moonpay-react`](https://www.npmjs.com/package/@moonpay/moonpay-react).

> **Disclaimer:** This is sample code for demo/testing purposes only. Never expose API keys in client-side code in production. See the security note in the [root README](../README.md).

## Quick Start

All commands are run from the **monorepo root** (not this directory).

```bash
# 1. Install all dependencies (from repo root)
npm install

# 2. Configure environment variables
cp server/.env.example server/.env   # add your MOONPAY_SECRET_KEY
cp moonpay-react-sell/.env.example moonpay-react-sell/.env  # optional

# 3. Start the shared signing server (port 5000)
npm run start:server

# 4. Start this demo (port 3000)
npm run start:react-sell
```

## What This Demo Does

- Renders the MoonPay sell widget inside a React app (Vite)
- Sends widget URLs to the shared `server/` signing server for HMAC-SHA256 signing
- Runs on **port 3000** (Vite dev server); signing server on **port 5000**

For full setup details, environment variables, and architecture, see the [root README](../README.md).
