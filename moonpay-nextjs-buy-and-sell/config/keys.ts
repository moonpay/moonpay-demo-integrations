// Public - these are safe to expose in the browser
export const BaseURL = process.env.NEXT_PUBLIC_BASE_URL ?? "";
export const signingServerURL = `${process.env.NEXT_PUBLIC_BASE_URL}/api`;

// Server-only - no NEXT_PUBLIC_ prefix, never reaches the browser
export const MoonPayAPIKey = process.env.MOONPAY_API_KEY ?? "";
export const MoonPaySecretKey = process.env.MOONPAY_SECRET_KEY ?? "";
export const CoinGeckoAPIKey = process.env.COINGECKO_API_KEY ?? "";
export const BaseCoinGeckoURL = process.env.COINGECKO_BASE_URL ?? "";
