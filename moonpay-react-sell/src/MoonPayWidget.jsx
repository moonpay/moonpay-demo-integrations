import React, { useState } from "react";
import { MoonPaySellWidget, MoonPayProvider } from "@moonpay/moonpay-react";

const MoonPayWidget = () => {
  const [showWidget, setShowWidget] = useState(false);

  const apiKey = "your_api_key";

  const handleGetSignature = async (url) => {
    try {
      console.log("url first: " + url)
      // Fetch the signature from the backend
      const signature = await fetch(`http://localhost:5000/sign-url?url=${encodeURIComponent(url)}`);
      const signatureText = await signature.text();
      console.log("this is the signature from the backend" + signatureText);
      return signatureText
    } catch (error) {
      console.error('Error fetching the signature:', error);
      return '';
    }
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
            <MoonPaySellWidget {...configuration} />
          </div>
        )}
      </div>
    </MoonPayProvider>
  );
};

export default MoonPayWidget;