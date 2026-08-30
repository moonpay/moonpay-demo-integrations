import React, { useState } from "react";
import { MoonPaySellWidget, MoonPayProvider } from "@moonpay/moonpay-react";

// Origin of the hosted wallet page that signs the deposit transaction.
const WALLET_PAGE_URL = import.meta.env.VITE_WALLET_PAGE_URL || 'http://localhost:3001';

// Abort a hung signing request instead of leaving the widget waiting forever.
const SIGNING_REQUEST_TIMEOUT_MS = 10_000;

const MoonPayWidget = () => {
  const [showWidget, setShowWidget] = useState(false);
  const [walletAddress, setWalletAddress] = useState("wallet_address"); // Default wallet address
  const [quoteCurrencyAmount, setQuoteCurrencyAmount] = useState("50");  // Default amount
  const [depositId, setDepositId] = useState(null); // Store depositId
  const [errorMessage, setErrorMessage] = useState(null);

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

    // Errors deliberately propagate to the SDK. Returning '' on failure — as this
    // used to — hands MoonPay an empty signature, so the user sees an opaque
    // "invalid signature" rejection instead of the real cause.
    return signature;
  };

  /**
   * Records the deposit with your own backend.
   *
   * In this demo it only mints a placeholder id. A real implementation must
   * persist the deposit before the user is sent off to sign, and must be
   * idempotent — the widget can invoke onInitiateDeposit more than once for the
   * same quote if the user retries.
   */
  const deposit = async (cryptoCode, cryptoAmount, destinationAddress) => {
    // Amount and destination are intentionally not logged: they are the two values
    // an attacker would want, and browser consoles are readable by any extension.
    console.log(`Recording a ${cryptoCode} deposit request`);
    return "mocked_deposit_id";
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

      setErrorMessage(null);

      try {
        // `cryptoCurrency` is an object. Interpolating it straight into the URL —
        // as this used to — yields "cryptoCode=[object Object]", which the wallet
        // page then cannot map to a real currency. Use its `code` field, the same
        // field the deposit call below already used.
        const cryptoCode = cryptoCurrency?.code;
        if (!cryptoCode) {
          throw new Error('The widget did not supply a currency code for the deposit.');
        }

        // Record the deposit with your backend BEFORE sending the user away, so a
        // signed transaction always has a deposit record to reconcile against.
        const newDepositId = await deposit(cryptoCode, cryptoCurrencyAmount, depositWalletAddress);
        if (!newDepositId) {
          throw new Error('The deposit could not be recorded.');
        }

        // URLSearchParams escapes each value. Manual interpolation left any '&' or
        // '#' in a parameter able to inject or truncate later parameters.
        const redirectUrl = new URL(WALLET_PAGE_URL);
        redirectUrl.searchParams.set('cryptoCode', cryptoCode);
        redirectUrl.searchParams.set('amount', String(cryptoCurrencyAmount));
        redirectUrl.searchParams.set('walletAddress', depositWalletAddress);

        // 'noopener,noreferrer' denies the opened page access to window.opener,
        // which would otherwise let it navigate this page (reverse tabnabbing).
        const walletWindow = window.open(redirectUrl.toString(), '_blank', 'noopener,noreferrer');
        if (!walletWindow) {
          throw new Error('The wallet page was blocked by the popup blocker. Allow popups and retry.');
        }

        setDepositId(newDepositId);
        return { depositId: newDepositId };
      } catch (error) {
        console.error("Error during deposit initiation:", error?.message ?? error);
        setErrorMessage(error?.message ?? 'The deposit could not be started.');
        // Rethrow so the widget shows a failed state. Returning { depositId: null }
        // reported success with a null id and left the user with no feedback.
        throw error;
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
        <button type="button" onClick={handleButtonClick}>Show MoonPay Widget</button>
        {showWidget && (
          <div>
            <MoonPaySellWidget {...configuration} />
          </div>
        )}
        {/* Display the depositId if it's available */}
        {depositId && <p>Deposit ID: {depositId}</p>}
        {errorMessage && (
          <p role="alert" style={{ color: '#b00020' }}>
            {errorMessage}
          </p>
        )}
      </div>
    </MoonPayProvider>
  );
};

export default MoonPayWidget;
