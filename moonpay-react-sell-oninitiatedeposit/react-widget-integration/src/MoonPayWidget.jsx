import React, { useState, useEffect } from "react";
import { MoonPaySellWidget, MoonPayProvider } from "@moonpay/moonpay-react";

const MoonPayWidget = () => {
  const [showWidget, setShowWidget] = useState(false);
  const [walletAddress, setWalletAddress] = useState("wallet_address"); // Default wallet address
  const [quoteCurrencyAmount, setQuoteCurrencyAmount] = useState("50");  // Default amount
  const [depositId, setDepositId] = useState(null); // Store depositId

  const apiKey = import.meta.env.VITE_MOONPAY_API_KEY || "your_api_key";

  // Called by the MoonPay SDK when it needs the widget URL signed.
  // The SDK passes the full widget URL — we forward it to our backend
  // which signs it with the secret key and returns the HMAC signature.
  const handleGetSignature = async (url) => {
    try {
      const signingServerUrl = import.meta.env.VITE_SIGNING_SERVER_URL || 'http://localhost:5000';
      const response = await fetch(`${signingServerUrl}/sign-url?url=${encodeURIComponent(url)}`);
      const { signature } = await response.json();
      return signature;
    } catch (error) {
      console.error('Error fetching the signature:', error);
      return '';
    }
  };

  // Function to handle the deposit (replace this with your own backend logic)
  const deposit = async (cryptoCode, cryptoAmount, walletAddress) => {
    try {
      console.log(`Depositing ${cryptoAmount} of ${cryptoCode} to ${walletAddress}`);
      // Simulate a successful deposit and return a depositId
      const depositId = "mocked_deposit_id";  
      return depositId;
    } catch (error) {
      console.error("Deposit failed:", error);
      return null;
    }
  };

  const configuration = {
    apiKey,
    defaultBaseCurrencyCode: "eth",
    quoteCurrencyCode: "usd",
    refundWalletAddress: walletAddress,  // Use dynamic wallet address
    quoteCurrencyAmount: quoteCurrencyAmount,  // Use dynamic amount
    variant: "overlay",
    lockAmount: false,
    onUrlSignatureRequested: handleGetSignature,
    // Updated onInitiateDeposit action to match the MoonPay documentation
    async onInitiateDeposit(properties) {
      const {
        cryptoCurrency,
        cryptoCurrencyAmount,
        depositWalletAddress,
      } = properties;

      try {
        // Prepare the redirect URL
        const redirectUrl = `http://localhost:3001/wallet-sign?cryptoCode=${cryptoCurrency}&amount=${cryptoCurrencyAmount}&walletAddress=${depositWalletAddress}`;

        // Handle the deposit with the extracted details
        const depositId = await deposit(
          cryptoCurrency.code,
          cryptoCurrencyAmount,
          depositWalletAddress
        );

        // Store depositId and return it to the widget
        setDepositId(depositId);

        // Redirect the user to the external site for transaction signing
        window.open(redirectUrl, "_blank");

        return { depositId };
      } catch (error) {
        console.error("Error during deposit initiation:", error);
        return { depositId: null };
      }
    }
  };

  const handleButtonClick = () => {
    setShowWidget(true);
  };

  return (
    <MoonPayProvider apiKey={apiKey}>
      <div>
        <h2>MoonPay Off-Ramp</h2>
        <button onClick={handleButtonClick}>Show MoonPay Widget</button>
        {showWidget && (
          <div>
            <MoonPaySellWidget {...configuration} />
          </div>
        )}
        {/* Display the depositId if it's available */}
        {depositId && <p>Deposit ID: {depositId}</p>}
      </div>
    </MoonPayProvider>
  );
};

export default MoonPayWidget;
