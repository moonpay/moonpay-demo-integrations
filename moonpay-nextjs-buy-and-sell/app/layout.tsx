import type { Metadata } from "next";
import { Inter_Tight } from "next/font/google";
import "./globals.css";
import { MoonPayContextProvider } from "@/context/MoonPay";

const interTight = Inter_Tight({
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Moonpay Nextjs | Buy and sell",
  description: "This is a Moonpay integration demo for buying and selling",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${interTight.className} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <MoonPayContextProvider>{children}</MoonPayContextProvider>
      </body>
    </html>
  );
}
