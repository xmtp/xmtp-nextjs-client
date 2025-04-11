import { Client } from "@xmtp/node-sdk";
import { NextResponse } from "next/server";
import { createSigner, getEncryptionKeyFromHex } from "../../../src/helper";

export async function GET() {
  try {
    const signer = createSigner(process.env.WALLET_KEY as `0x${string}`);
    const encryptionKey = process.env.ENCRYPTION_KEY
      ? getEncryptionKeyFromHex(process.env.ENCRYPTION_KEY)
      : undefined;

    const client = await Client.create(signer, encryptionKey, {
      env: process.env.XMTP_ENV as "production" | "development" | "dev",
    });

    const clientDetails = {
      address: client.address,
      env: client.env,
    };

    return NextResponse.json(clientDetails);
  } catch (error) {
    console.error("Error creating XMTP client:", error);
    return NextResponse.json(
      { error: "Failed to create XMTP client" },
      { status: 500 }
    );
  }
}
