import React, { useState } from "react";
import { MoonPaySellWidget, MoonPayProvider } from "@moonpay/moonpay-react";

// Abort a hung signing request instead of leaving the widget waiting forever.
const SIGNING_REQUEST_TIMEOUT_MS = 10_000;

const MoonPayWidget = () => {
  const [showWidget, setShowWidget] = useState(false);

  const apiKey = import.meta.env.VITE_MOONPAY_API_KEY || "your_api_key";

  // Called by the MoonPay SDK when it needs the widget URL signed.
  // The SDK passes the full widget URL — we forward it to our backend
  // which signs it with the secret key and returns the HMAC signature.
  const handleGetSignature = async (url) => {
    const signingServerUrl = import.meta.env.VITE_SIGNING_SERVER_URL || 'http://localhost:5000';
    const response = await fetch(`${signingServerUrl}/sign-url?url=${encodeURIComponent(url)}`, {
      signal: AbortSignal.timeout(SIGNING_REQUEST_TIMEOUT_MS),
    });

    if (!response.ok) {
      throw new Error(`Signing server returned ${response.status}`);
    }

    const { signature } = await response.json();
    if (!signature) {
      throw new Error('Signing server returned an empty signature');
    }

    // Errors deliberately propagate to the SDK. Catching them and returning '' —
    // as this used to — hands MoonPay an empty signature, so the user sees an
    // opaque "invalid signature" rejection instead of the real cause, and the
    // widget URL (which carries the wallet address) was logged in the process.
    return signature;
  };

  const configuration = {
    apiKey,
    defaultBaseCurrencyCode: "eth",
    quoteCurrencyCode: "usd",
    refundWalletAddress: "wallet_address",
    quoteCurrencyAmount: "50", // NOTE: Minimum for most currencies is ~$30 USD
    //paymentMethod: "", // Refer to documentation for various payment methods
    variant: "overlay",
    lockAmount: false,
    onUrlSignatureRequested: handleGetSignature,

    // --- Event Handlers ---
    // Uncomment any of these to listen to widget lifecycle events.
    // See: https://docs.moonpay.com/docs/sdk-events

    // onTransactionCreated: (transaction) => {
    //   console.log("Transaction created:", transaction);
    // },
    // onTransactionCompleted: (transaction) => {
    //   console.log("Transaction completed:", transaction);
    // },
    // onTransactionFailed: (transaction) => {
    //   console.error("Transaction failed:", transaction);
    // },
    // onCloseOverlay: () => {
    //   console.log("Widget overlay closed");
    //   setShowWidget(false);
    // },
  };

  const handleButtonClick = () => {
    setShowWidget(true);
  };

  return (
    <MoonPayProvider apiKey={apiKey}>
      <div>
        <h2>React SDK</h2>
        <button type="button" onClick={handleButtonClick}>Show MoonPay Widget</button>
        {showWidget && (
          <div>
            <MoonPaySellWidget {...configuration} />
          </div>
        )}
      </div>
    </MoonPayProvider>
  );
};

export default MoonPayWidget;