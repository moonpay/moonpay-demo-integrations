import { Footer, Header, MarketClient, Navigation } from "@/components";
import { DEFAULT_CURRENCY } from "@/config";

async function getMarkets(currency: string) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/crypto?currency=${currency}`,
    { cache: "no-store" }, // always fresh on SSR
  );
  return res.json();
}

export default async function Home() {
  const initialCoins = await getMarkets(DEFAULT_CURRENCY);

  return (
    <div className="w-full max-w-300 mx-auto px-6 h-full overflow-x-hidden">
      <Navigation />
      <Header />
      <MarketClient
        defaultCurrency={DEFAULT_CURRENCY}
        initialCoins={initialCoins}
      />
      <Footer />
    </div>
  );
}
