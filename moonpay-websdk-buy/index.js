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

        // --- Theme Customization ---
        // Uncomment and modify to customize the widget appearance.
        // See: https://docs.moonpay.com/docs/widget-customization
        //
        // const theme = {
        //     colorPrimary: "#7B61FF",
        //     colorBackground: "#1A1A2E",
        //     colorText: "#FFFFFF",
        //     colorTextSecondary: "#A0A0B0",
        //     borderRadius: 16,
        //     isDark: true,
        // };

        // Initialize the MoonPay widget without signing the URL yet
        const widget = moonPay?.({
            flow: "buy",
            environment: "sandbox", // Use "production" for live environments
            variant: "overlay",
            params: {
                apiKey: 'your_api_key', // Replace with your actual API key
                currencyCode: 'eth',
                walletAddress: 'wallet_address', // Ensure this matches the currencyCode chain
                baseCurrencyCode: 'usd',
                baseCurrencyAmount: 35,
                redirectUrl: 'https://www.moonpay.com',
                // theme: JSON.stringify(theme), // Uncomment to apply theme
            },
        });

        // Generate the URL that needs to be signed
        const urlForSignature = widget?.generateUrlForSigning();

        console.log("This is the URL for signature: " + urlForSignature)

        // Send the URL to your backend for signing and fetch the signature
        // Append the URL for signing as a query parameter
        const signatureResponse = await fetch(`http://localhost:5000/sign-url?url=${encodeURIComponent(urlForSignature)}`, {
            method: 'GET',  // Now using GET and passing the URL in query string
        });

        if (!signatureResponse.ok) {
            throw new Error('Failed to fetch signature');
        }

        // Parse the response to get the signature
        const { signature } = await signatureResponse.json();

        // Update the widget with the signed URL
        console.log("This is the signature: " + signature)
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