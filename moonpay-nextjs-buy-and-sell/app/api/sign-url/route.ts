import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

const secretKey = process.env.MOONPAY_SECRET_KEY;
const apiKey = process.env.MOONPAY_API_KEY; // server-side only, no NEXT_PUBLIC_

function generateSignature(url: string): string {
  return crypto
    .createHmac("sha256", secretKey!)
    .update(new URL(url).search)
    .digest("base64");
}

export async function GET(req: NextRequest) {
  if (!secretKey || !apiKey) {
    return NextResponse.json(
      { error: "Server misconfigured" },
      { status: 500 },
    );
  }

  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  try {
    // Re-inject the apiKey server-side before signing
    const fullUrl = new URL(url);
    fullUrl.searchParams.set("apiKey", apiKey);

    const signature = generateSignature(fullUrl.toString());
    return NextResponse.json({ signature });
  } catch (error) {
    console.error("Error generating signature:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
