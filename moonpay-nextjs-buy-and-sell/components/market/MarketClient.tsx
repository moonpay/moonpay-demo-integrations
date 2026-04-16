"use client";

import { CoinProp } from "@/types";
import { Loader } from "./Loader";
import { FiSearch } from "react-icons/fi";
import { IoIosArrowDown } from "react-icons/io";
import { useState, useTransition } from "react";
import { currencies } from "@/data";
import Image from "next/image";
import { formatDate } from "@/utils";
import { HiTrendingUp, HiTrendingDown } from "react-icons/hi";
import { useMoonPayContext } from "@/context";

interface Props {
  initialCoins: CoinProp[];
  defaultCurrency: string;
}

export function MarketClient({ initialCoins, defaultCurrency }: Props) {
  const [coins, setCoins] = useState<CoinProp[]>(initialCoins);
  const [currency, setCurrency] = useState<string>(defaultCurrency);
  const [showCurrencyOptions, setShowCurrencyOptions] =
    useState<boolean>(false);
  const [query, setQuery] = useState("");
  const [isPending, startTransition] = useTransition();
  const tableHeaders = ["#", "Assets", "Price", "Last updated", "Actions"];
  const { setConfig, setShowBuyWidget, setShowSellWidget } =
    useMoonPayContext();

  async function fetchCoins(newCurrency: string, newQuery: string) {
    const params = new URLSearchParams({ currency: newCurrency });
    if (newQuery) params.set("query", newQuery);

    const res = await fetch(`/api/crypto?${params.toString()}`);
    const data = await res.json();
    setCoins(data);
  }

  function handleCurrencyChange(newCurrency: string) {
    setCurrency(newCurrency);
    startTransition(() => fetchCoins(newCurrency, query));
    setShowCurrencyOptions(false);
  }

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    startTransition(() => fetchCoins(currency, query));
  }

  const buy = (coin: CoinProp) => {
    setConfig({
      crypto: coin.symbol,
      currency,
      price: coin.current_price,
    });
    setShowBuyWidget(true);
  };

  const sell = (coin: CoinProp) => {
    setConfig({
      crypto: coin.symbol,
      currency,
      price: coin.current_price,
    });
    setShowSellWidget(true);
  };

  return (
    <section className="w-full flex flex-col gap-6 sm:gap-4">
      <section className="w-full flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <form
          onSubmit={handleSearch}
          className="w-full sm:w-fit border border-border rounded-[10px] px-3 py-2 flex items-center gap-2"
        >
          <input
            type="search"
            placeholder={isPending ? "Searching..." : "Search for crypto..."}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="border-none outline-none flex-1 text-[0.85rem] sm:text-[0.95rem]"
            disabled={isPending}
          />
          <button className="cursor-pointer" disabled={isPending}>
            <FiSearch className="text-[0.9rem] sm:text-[1rem]" />
          </button>
        </form>
        <div className="relative flex items-center gap-2">
          <p className="bg-ascent border border-border px-3 py-2 text-[0.85rem] sm:text-[0.95rem] rounded-[10px] rounded-tr-none rounded-br-none">
            <span>Currency:</span> {currency.toUpperCase()}
          </p>
          <button
            onClick={() => setShowCurrencyOptions(!showCurrencyOptions)}
            className="bg-ascent border border-border px-3 py-3 cursor-pointer rounded-[10px] rounded-tl-none rounded-bl-none"
          >
            <IoIosArrowDown className="text-[0.95rem]" />
          </button>
          {showCurrencyOptions && (
            <div className="absolute inset-x-o top-[120%] bg-ascent border border-border rounded-[10px] w-full">
              <div className="w-full flex flex-col">
                {currencies.map((value) => {
                  if (value === currency) return null;
                  return (
                    <button
                      key={value}
                      className="w-full px-3 py-2 cursor-pointer flex justify-start"
                      onClick={() => handleCurrencyChange(value)}
                    >
                      <span className="text-[0.95rem]">
                        {value.toUpperCase()}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>
      {isPending ? (
        <Loader />
      ) : (
        <section className="w-full overflow-x-scroll">
          <table className="w-full mb-12 min-w-150">
            <thead className="w-full">
              <tr className="w-full bg-ascent rounded-[10px]">
                {tableHeaders.map((value) => {
                  return (
                    <th key={value} className="px-3 py-2 text-left">
                      <span className="text-[0.95rem]">{value}</span>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {coins.map((coin, index) => {
                return (
                  <tr key={coin.id} className="border-b-[0.5px] border-border">
                    <td className="px-3 py-2 text-left">
                      <span className="text-[0.95rem]">{index + 1}</span>
                    </td>
                    <td className="px-3 py-2 text-left">
                      <div className="flex items-center gap-3">
                        <Image
                          src={coin.image}
                          alt={`${coin.symbol}_image`}
                          width={15}
                          height={15}
                          loading="eager"
                        />
                        <p className="leading-none text-[0.95rem]">
                          {coin.name}
                        </p>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-left">
                      <div className="flex items-center gap-3">
                        <span className="text-[0.95rem] text-grey-text">
                          {currency.toUpperCase()}
                        </span>
                        <span className="text-[0.95rem]">
                          {coin.current_price.toLocaleString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-left">
                      <span className="text-[0.95rem]">
                        {formatDate(coin.last_updated)}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-left">
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => buy(coin)}
                          className="flex items-center gap-2 cursor-pointer text-green-600"
                        >
                          <HiTrendingUp className="text-[1.1rem]" />
                          <span className="text-[0.95rem]">Buy</span>
                        </button>
                        <button
                          onClick={() => sell(coin)}
                          className="flex items-center gap-2 cursor-pointer text-red-600"
                        >
                          <HiTrendingDown className="text-[1.1rem]" />
                          <span className="text-[0.95rem]">Sell</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      )}
    </section>
  );
}
