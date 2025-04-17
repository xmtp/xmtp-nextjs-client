import { Client } from "@xmtp/node-sdk";
import { NextResponse } from "next/server";
import { createSigner, getEncryptionKeyFromHex } from "../../../helpers/client";
import { logAgentDetails, validateEnvironment } from "../../../helpers/utils";
import { type XmtpEnv } from "@xmtp/node-sdk";

// Validate environment variables
const { WALLET_KEY, ENCRYPTION_KEY, XMTP_ENV } = validateEnvironment([
  "WALLET_KEY",
  "ENCRYPTION_KEY",
  "XMTP_ENV",
]);

export async function GET(request: Request) {
  const url = new URL(request.url);
  const source = url.searchParams.get("source");

  if (source !== "page") {
    return NextResponse.json(
      { error: "Unauthorized request source" },
      { status: 403 }
    );
  }

  try {
    const signer = createSigner(WALLET_KEY);
    const dbEncryptionKey = getEncryptionKeyFromHex(ENCRYPTION_KEY);
    if (!signer) {
      throw new Error("Signer is not set");
    }
    const client = await Client.create(signer, {
      dbEncryptionKey,
      env: XMTP_ENV as XmtpEnv,
    });
    logAgentDetails(client);

    console.log("✓ Syncing conversations...");
    await client.conversations.sync();

    console.log("Waiting for messages...");
    const stream = await client.conversations.streamAllMessages();

    for await (const message of stream) {
      if (
        message?.senderInboxId.toLowerCase() === client.inboxId.toLowerCase() ||
        message?.contentType?.typeId !== "text"
      ) {
        continue;
      }

      const conversation = await client.conversations.getConversationById(
        message.conversationId
      );

      if (!conversation) {
        console.log("Unable to find conversation, skipping");
        continue;
      }

      const inboxState = await client.preferences.inboxStateFromInboxIds([
        message.senderInboxId,
      ]);
      const addressFromInboxId = inboxState[0].identifiers[0].identifier;
      console.log(`Sending "gm" response to ${addressFromInboxId}...`);
      await conversation.send("gm");

      console.log("Waiting for messages...");
    }

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
