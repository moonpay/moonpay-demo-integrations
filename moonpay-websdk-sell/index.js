// ─── Configuration ───────────────────────────────────────────
// Update these values for your environment.
// For local development, the defaults below should work out of the box.
const SIGNING_SERVER_URL = 'http://localhost:5000';
const MOONPAY_API_KEY = 'pk_test_your_api_key_here';
// ─────────────────────────────────────────────────────────────

// Import MoonPay SDK from CDN
import { loadMoonPay } from 'https://cdn.skypack.dev/@moonpay/moonpay-js';

document.getElementById('startTransaction').addEventListener('click', async () => {
    
    try {
        // Load the MoonPay SDK
        const moonPay = await loadMoonPay();

        if (!moonPay) {
            console.error('Failed to load MoonPay SDK');
            return;
        }

        // Initialize the MoonPay widget without signing the URL yet
        const widget = moonPay?.({
            flow: "sell",
            environment: "sandbox", // Use "production" for live environments
            variant: "overlay",
            params: {
                apiKey: MOONPAY_API_KEY,
                defaultBaseCurrencyCode: 'eth',
                refundWalletAddress: 'wallet_address', // Ensure this matches the currencyCode chain
                quoteCurrencyCode: 'usd',
                quoteCurrencyAmount: 35,
                lockAmount: false,
                redirectUrl: 'https://www.moonpay.com',
            },
        });

        // Generate the widget URL, then send it to our backend for signing.
        // MoonPay requires an HMAC-SHA256 signature to prevent client-side
        // tampering with parameters like wallet addresses and amounts.
        const urlForSignature = widget?.generateUrlForSigning();

        // Send the URL to your backend for signing and fetch the signature
        const signatureResponse = await fetch(`${SIGNING_SERVER_URL}/sign-url?url=${encodeURIComponent(urlForSignature)}`);

        if (!signatureResponse.ok) {
            throw new Error('Failed to fetch signature');
        }

        // Parse the response to get the signature
        const { signature } = await signatureResponse.json();

        // Update the widget with the signed URL
        widget.updateSignature(signature);

        // Show the MoonPay widget
        widget?.show();

        // --- Event Handlers ---
        // The Web SDK emits events you can listen to for transaction lifecycle updates.
        // Uncomment any of these to handle widget events:
        //
        // widget?.addEventListener('transactionCreated', (transaction) => {
        //     console.log('Transaction created:', transaction);
        // });
        //
        // widget?.addEventListener('transactionCompleted', (transaction) => {
        //     console.log('Transaction completed:', transaction);
        // });
        //
        // widget?.addEventListener('transactionFailed', (transaction) => {
        //     console.error('Transaction failed:', transaction);
        // });

    } catch (error) {
        console.error('Error initializing MoonPay widget:', error);
    }
});