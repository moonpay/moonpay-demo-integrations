"use client";

import {
  BaseURL,
  DEFAULT_CURRENCY,
  MoonPayAPIKey,
  signingServerURL,
} from "@/config";
import { Config, MoonPayContextProp } from "@/types";
import {
  MoonPayBuyWidget,
  MoonPayProvider,
  MoonPaySellWidget,
} from "@moonpay/moonpay-react";
import { createContext, useContext, useState } from "react";

export const MoonPayContext = createContext<MoonPayContextProp | null>(null);

export function MoonPayContextProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [showBuyWidget, setShowBuyWidget] = useState<boolean>(false);
  const [showSellWidget, setShowSellWidget] = useState<boolean>(false);
  const [config, setConfig] = useState<Config>({
    crypto: "eth",
    currency: DEFAULT_CURRENCY,
    price: 100,
  });

  const handleGetSignature = async (url: string) => {
    try {
      const sanitisedUrl = new URL(url);
      sanitisedUrl.searchParams.delete("apiKey");

      const response = await fetch(
        `${signingServerURL}/sign-url?url=${encodeURIComponent(sanitisedUrl.toString())}`,
      );
      if (!response.ok) {
        throw new Error(`Signing server returned ${response.status}`);
      }
      const { signature } = await response.json();
      return signature;
    } catch (error) {
      console.error("Error fetching the signature:", error);
      return "";
    }
  };

  return (
    <MoonPayContext.Provider
      value={{ setConfig, setShowBuyWidget, setShowSellWidget }}
    >
      <MoonPayProvider apiKey={MoonPayAPIKey}>
        {showBuyWidget && (
          <MoonPayBuyWidget
            theme="dark"
            variant="overlay"
            defaultCurrencyCode={config.crypto}
            baseCurrencyAmount={String(config.price)}
            lockAmount="true"
            baseCurrencyCode={config.currency}
            onUrlSignatureRequested={handleGetSignature}
            redirectURL={BaseURL}
            onClose={() =>
              new Promise((resolve) => resolve(setShowBuyWidget(false)))
            }
          />
        )}
        {showSellWidget && (
          <MoonPaySellWidget
            theme="dark"
            variant="overlay"
            defaultCurrencyCode={config.crypto}
            quoteCurrencyCode={config.currency}
            quoteCurrencyAmount={String(config.price)}
            lockAmount="true"
            onUrlSignatureRequested={handleGetSignature}
            onClose={() =>
              new Promise((resolve) => resolve(setShowSellWidget(false)))
            }
          />
        )}
        {children}
      </MoonPayProvider>
    </MoonPayContext.Provider>
  );
}

export function useMoonPayContext() {
  const moonPayContext = useContext(MoonPayContext);
  if (!moonPayContext) {
    throw new Error("Failed to get context");
  }
  return moonPayContext;
}
