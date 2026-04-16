import { BaseCoinGeckoURL, CoinGeckoAPIKey } from "@/config";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const currency = searchParams.get("currency") ?? "usd";
  const query = searchParams.get("query") ?? "";

  let url: string;

  if (query) {
    // First search for matching coin IDs, then fetch their market data
    const searchRes = await fetch(`${BaseCoinGeckoURL}/search?query=${query}`, {
      headers: {
        "x-cg-demo-api-key": CoinGeckoAPIKey,
      },
    });
    const searchData = await searchRes.json();
    const ids = searchData.coins
      .slice(0, 10)
      .map((c: { id: string }) => c.id)
      .join(",");

    url = `${BaseCoinGeckoURL}/coins/markets?vs_currency=${currency}&ids=${ids}&order=market_cap_desc&sparkline=false`;
  } else {
    url = `${BaseCoinGeckoURL}/coins/markets?vs_currency=${currency}&order=market_cap_desc&per_page=20&page=1&sparkline=false`;
  }

  const res = await fetch(url, {
    headers: {
      "x-cg-demo-api-key": CoinGeckoAPIKey,
    },
    next: { revalidate: 60 },
  });

  const data = await res.json();
  return NextResponse.json(data);
}
