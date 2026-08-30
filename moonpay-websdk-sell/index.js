// Import the MoonPay Web SDK from the lockfile-pinned npm package.
//
// This used to be `import { loadMoonPay } from 'https://cdn.skypack.dev/@moonpay/moonpay-js'`.
// That fetched and executed payment-flow code from a third-party CDN at an unpinned,
// mutable URL with no integrity check: whatever the CDN served at page load ran with
// full access to this origin, and no lockfile or audit covered it. The npm package
// was already declared as a dependency here and simply went unused.
import { loadMoonPay } from '@moonpay/moonpay-js';

// ─── Configuration ───────────────────────────────────────────
// Set these in a .env file (see .env.example). Vite inlines any VITE_-prefixed
// variable at build time, so only publishable values belong here — the MoonPay
// secret key stays on the signing server and is never exposed to the browser.
const SIGNING_SERVER_URL = import.meta.env.VITE_SIGNING_SERVER_URL || 'http://localhost:5000';
const MOONPAY_API_KEY = import.meta.env.VITE_MOONPAY_API_KEY;
// ─────────────────────────────────────────────────────────────

// Abort a hung signing request instead of leaving the button permanently dead.
const SIGNING_REQUEST_TIMEOUT_MS = 10_000;

/**
 * Asks the signing server for the HMAC-SHA256 signature of a widget URL.
 *
 * @param {string} urlForSignature widget URL produced by the SDK
 * @returns {Promise<string>} base64 signature
 * @throws {Error} when the request fails, times out, or returns no signature
 */
const fetchSignature = async (urlForSignature) => {
  const endpoint = `${SIGNING_SERVER_URL}/sign-url?url=${encodeURIComponent(urlForSignature)}`;
  const response = await fetch(endpoint, {
    signal: AbortSignal.timeout(SIGNING_REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`Signing server returned ${response.status}`);
  }

  const { signature } = await response.json();
  if (!signature) {
    throw new Error('Signing server returned an empty signature');
  }

  return signature;
};

const statusElement = document.getElementById('status');

/**
 * Renders a user-visible message. Failures previously went to the console only,
 * which left the page looking unresponsive after a click.
 *
 * @param {string} message
 * @param {boolean} isError
 */
const setStatus = (message, isError = false) => {
  if (!statusElement) return;
  statusElement.textContent = message;
  statusElement.dataset.state = isError ? 'error' : 'info';
};

const startButton = document.getElementById('startTransaction');

startButton.addEventListener('click', async () => {
  // Fail loudly on a missing key rather than opening a widget that cannot load.
  if (!MOONPAY_API_KEY) {
    setStatus('VITE_MOONPAY_API_KEY is not set. Copy .env.example to .env and add your key.', true);
    return;
  }

  // Guard against double submission while the signing round-trip is in flight.
  startButton.disabled = true;
  setStatus('Preparing the MoonPay widget…');

  try {
    const moonPay = await loadMoonPay();

    if (!moonPay) {
      throw new Error('Failed to load the MoonPay SDK');
    }

    // Initialize the MoonPay widget without signing the URL yet
    const widget = moonPay({
      flow: 'sell',
      environment: 'sandbox', // Use "production" for live environments
      variant: 'overlay',
      params: {
        apiKey: MOONPAY_API_KEY,
        defaultBaseCurrencyCode: 'eth',
        refundWalletAddress: 'wallet_address', // Ensure this matches the currency chain
        quoteCurrencyCode: 'usd',
        quoteCurrencyAmount: 35,
        lockAmount: false,
        redirectUrl: 'https://www.moonpay.com',
      },
    });

    if (!widget) {
      throw new Error('The MoonPay SDK did not return a widget instance');
    }

    // Generate the widget URL, then send it to our backend for signing.
    // MoonPay requires an HMAC-SHA256 signature to prevent client-side tampering
    // with parameters like wallet addresses and amounts.
    const urlForSignature = widget.generateUrlForSigning();
    const signature = await fetchSignature(urlForSignature);

    // Apply the signature, then show the widget. Doing this in the other order
    // would briefly present an unsigned widget that MoonPay will reject.
    widget.updateSignature(signature);
    widget.show();
    setStatus('');

    // --- Event Handlers ---
    // The Web SDK emits events you can listen to for transaction lifecycle updates.
    // Uncomment any of these to handle widget events:
    //
    // widget.addEventListener('transactionCreated', (transaction) => {
    //     console.log('Transaction created:', transaction);
    // });
    //
    // widget.addEventListener('transactionCompleted', (transaction) => {
    //     console.log('Transaction completed:', transaction);
    // });
    //
    // widget.addEventListener('transactionFailed', (transaction) => {
    //     console.error('Transaction failed:', transaction);
    // });
  } catch (error) {
    // Surface the failure in the UI as well as the console. The message is a local
    // error string and carries no signature or key material.
    console.error('Error initializing MoonPay widget:', error);
    setStatus(`Could not open the MoonPay widget: ${error.message}`, true);
  } finally {
    startButton.disabled = false;
  }
});
