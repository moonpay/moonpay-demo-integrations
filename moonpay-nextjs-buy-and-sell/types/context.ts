export interface Config {
  price: number;
  currency: string;
  crypto: string;
}

export interface MoonPayContextProp {
  setShowBuyWidget: (showBuyWidget: boolean) => void;
  setShowSellWidget: (showSellWidget: boolean) => void;
  setConfig: (config: Config) => void;
}
