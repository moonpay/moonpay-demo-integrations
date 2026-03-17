# MoonPay React SDK Demo - Sell with onInitiateDeposit

Demonstrates a **sell crypto** widget using [`@moonpay/moonpay-react`](https://www.npmjs.com/package/@moonpay/moonpay-react) with the `onInitiateDeposit` callback and a hosted wallet page for MetaMask transaction signing.

> **Disclaimer:** This is sample code for demo/testing purposes only. Never expose API keys in client-side code in production. See the security note in the [root README](../README.md).

## Quick Start

All commands are run from the **monorepo root** (not this directory).

```bash
# 1. Install all dependencies (from repo root)
npm install

# 2. Configure environment variables
cp server/.env.example server/.env   # add your MOONPAY_SECRET_KEY

# 3. Start the shared signing server (port 5000)
npm run start:server

# 4. Start the sell widget (port 3000)
npm run start:react-sell-deposit

# 5. Start the hosted wallet page (port 3001) — in another terminal
npm run start:wallet-page
```

## What This Demo Does

- **react-widget-integration/**: React app with the MoonPay sell widget that uses the `onInitiateDeposit` callback to hand off crypto deposit signing to a hosted wallet page
- **hosted-wallet-page/**: Standalone page that connects to MetaMask and signs the deposit transaction
- Widget runs on **port 3000**, wallet page on **port 3001**, signing server on **port 5000**

For full setup details, environment variables, and architecture, see the [root README](../README.md).
