import React, { useState } from "react";
import { MoonPayBuyWidget, MoonPayProvider } from "@moonpay/moonpay-react";

const MoonPayWidget = () => {
  const [showWidget, setShowWidget] = useState(false);

  const apiKey = import.meta.env.VITE_MOONPAY_API_KEY || "your_api_key";

  // Called by the MoonPay SDK when it needs the widget URL signed.
  // The SDK passes the full widget URL — we forward it to our backend
  // which signs it with the secret key and returns the HMAC signature.
  const handleGetSignature = async (url) => {
    try {
      const signingServerUrl = import.meta.env.VITE_SIGNING_SERVER_URL || 'http://localhost:5000';
      const response = await fetch(`${signingServerUrl}/sign-url?url=${encodeURIComponent(url)}`);
      if (!response.ok) {
        throw new Error(`Signing server returned ${response.status}`);
      }
      const { signature } = await response.json();
      return signature;
    } catch (error) {
      console.error('Error fetching the signature:', error);
      return '';
    }
  };

  // --- Theme Customization ---
  // Uncomment and modify to customize the widget appearance.
  // See: https://docs.moonpay.com/docs/widget-customization
  //
  // const theme = {
  //   colorPrimary: "#7B61FF",           // Primary accent color (buttons, links)
  //   colorBackground: "#1A1A2E",        // Widget background color
  //   colorText: "#FFFFFF",              // Primary text color
  //   colorTextSecondary: "#A0A0B0",     // Secondary text color
  //   borderRadius: 16,                  // Border radius in pixels
  //   isDark: true,                      // Enable dark mode
  // };

  const configuration = {
    apiKey,
    defaultCurrencyCode: "eth",
    baseCurrencyAmount: "50", // NOTE: Minimum for most currencies is ~$30 USD
    walletAddress: "wallet_address", // To successfully prefill, address and defaultCurrencyCode must be from same chain.
    redirectURL: "https://moonpay.com",
    variant: "overlay",
    lockAmount: true,
    baseCurrencyCode: "usd",
    //paymentMethod: "", // Refer to documentation for various payment methods
    // theme,  // Uncomment to apply the theme object above
    onUrlSignatureRequested: handleGetSignature,

    // --- Event Handlers ---
    // Uncomment any of these to listen to widget lifecycle events.
    // See: https://docs.moonpay.com/docs/sdk-events

    // onTransactionCreated: (transaction) => {
    //   console.log("Transaction created:", transaction);
    // },
    // onTransactionCompleted: (transaction) => {
    //   console.log("Transaction completed:", transaction);
    //   // e.g. update your UI, redirect the user, etc.
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
        <button onClick={handleButtonClick}>Show MoonPay Widget</button>
        {showWidget && (
          <div>
            <MoonPayBuyWidget {...configuration} />
          </div>
        )}
      </div>
    </MoonPayProvider>
  );
};

export default MoonPayWidget;