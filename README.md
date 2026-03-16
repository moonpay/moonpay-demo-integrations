# MoonPay Demo Integrations

> ⚠️ **Disclaimer:** This repository contains example/sample code for demonstration and testing purposes only. It should **not** be considered production-ready. Use at your own risk and always perform a thorough security review before deploying any code to production.

A monorepo of demo projects showing how to integrate [MoonPay](https://www.moonpay.com/) widgets for buying and selling cryptocurrency. Each project demonstrates a different SDK or integration pattern.

## Projects

| Project | SDK | Description |
|---------|-----|-------------|
| `moonpay-react-buy` | React SDK | Buy crypto widget using `@moonpay/moonpay-react` |
| `moonpay-react-sell` | React SDK | Sell crypto widget using `@moonpay/moonpay-react` |
| `moonpay-websdk-buy` | Web SDK | Buy crypto widget using `@moonpay/moonpay-js` (vanilla JS) |
| `moonpay-websdk-sell` | Web SDK | Sell crypto widget using `@moonpay/moonpay-js` (vanilla JS) |
| `moonpay-react-sell-oninitiatedeposit` | React SDK | Sell widget with `onInitiateDeposit` callback + MetaMask wallet signing |
| `server` | Node.js | Shared HMAC-SHA256 URL signing server |

## Quick Start

### Prerequisites

- Node.js 18+
- npm 9+
- A MoonPay developer account ([dashboard.moonpay.com](https://dashboard.moonpay.com/developers))

### 1. Install dependencies

```bash
npm install
```

This installs dependencies for all workspaces in one command.

### 2. Configure environment variables

Copy the example `.env` files and fill in your keys:

```bash
# Signing server (required)
cp server/.env.example server/.env

# React projects (optional — defaults work for local dev)
cp moonpay-react-buy/.env.example moonpay-react-buy/.env
cp moonpay-react-sell/.env.example moonpay-react-sell/.env
```

At minimum, set your `MOONPAY_SECRET_KEY` in `server/.env`:

```
MOONPAY_SECRET_KEY=sk_test_your_secret_key_here
```

### 3. Start the signing server

```bash
npm run start:server
```

This runs on `http://localhost:5000` by default. All demo projects point here for URL signing.

### 4. Start a demo project

In a separate terminal, run any of:

```bash
npm run start:react-buy        # React buy widget (port 3000)
npm run start:react-sell        # React sell widget (port 3000)
npm run start:websdk-buy        # WebSDK buy widget (port 8080)
npm run start:websdk-sell       # WebSDK sell widget (port 8080)
npm run start:react-sell-deposit # React sell + onInitiateDeposit (port 3000)
npm run start:wallet-page       # MetaMask wallet signing page (port 3001)
```

## How URL Signing Works

MoonPay requires widget URLs to be signed with HMAC-SHA256 to prevent parameter tampering. The secret key must never be exposed in frontend code.

```
1. Frontend builds widget URL with parameters (apiKey, walletAddress, amount, etc.)
2. Frontend sends the URL to the signing server (GET /sign-url?url=...)
3. Server signs the URL's query string with HMAC-SHA256 using the secret key
4. Signature is returned to the frontend, which passes it to the MoonPay SDK
```

## Ports

| Service | Port | Notes |
|---------|------|-------|
| Signing server | 5000 | Configurable via `PORT` env var |
| React demos | 3000 | Vite dev server |
| Hosted wallet page | 3001 | For onInitiateDeposit flow |
| WebSDK demos | 8080 | live-server |

## Available Scripts

All scripts can be run from the repo root:

```bash
npm run setup              # Install all dependencies
npm run start:server       # Start the signing server
npm run start:react-buy    # Start React buy demo
npm run start:react-sell   # Start React sell demo
npm run start:websdk-buy   # Start WebSDK buy demo
npm run start:websdk-sell  # Start WebSDK sell demo
npm run start:react-sell-deposit  # Start React sell + deposit demo
npm run start:wallet-page  # Start wallet signing page
```

## Tech Stack

- **React SDK**: [Vite](https://vite.dev/) + React 18 + `@moonpay/moonpay-react`
- **Web SDK**: Vanilla JS + `@moonpay/moonpay-js` via CDN
- **Signing Server**: Express.js + `dotenv` + Node.js `crypto`
- **Monorepo**: npm workspaces

