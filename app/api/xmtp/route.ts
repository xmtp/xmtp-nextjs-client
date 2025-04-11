import { Client } from "@xmtp/node-sdk";
import { NextResponse } from "next/server";
import { createSigner, getEncryptionKeyFromHex } from "../../../helpers/client";

export async function GET() {
  try {
    const signer = createSigner(process.env.WALLET_KEY as `0x${string}`);
    const encryptionKey = process.env.ENCRYPTION_KEY
      ? getEncryptionKeyFromHex(process.env.ENCRYPTION_KEY)
      : undefined;
    if (!encryptionKey) {
      throw new Error("Encryption key is not set");
    }
    if (!signer) {
      throw new Error("Signer is not set");
    }
    const client = await Client.create(signer, encryptionKey, {
      env: process.env.XMTP_ENV as "production" | "dev" | "local",
    });
    console.log("Client created successfully");
    console.log("Client details:", client.inboxId);
    const clientDetails = {
      address: (await signer.getIdentifier()).identifier,
      env: process.env.XMTP_ENV as "production" | "dev" | "local",
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
