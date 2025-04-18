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

let xmtpClient: Client | null = null;

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
    if (!xmtpClient) {
      const signer = createSigner(WALLET_KEY);
      const dbEncryptionKey = getEncryptionKeyFromHex(ENCRYPTION_KEY);
      if (!signer) {
        throw new Error("Signer is not set");
      }
      console.log("Creating XMTP client...");
      console.log("signer", signer);
      console.log("dbEncryptionKey", dbEncryptionKey);
      console.log("XMTP_ENV", XMTP_ENV);
      console.log("signer.getIdentifier()", await signer.getIdentifier());
      console.log("WALLET_KEY", WALLET_KEY);
      console.log("ENCRYPTION_KEY", ENCRYPTION_KEY);
      xmtpClient = await Client.create(signer, {
        dbEncryptionKey,
        env: XMTP_ENV as XmtpEnv,
      });
      logAgentDetails(xmtpClient);

      console.log("✓ Syncing conversations...");
      await xmtpClient.conversations.sync();
    }

    if (!xmtpClient || !xmtpClient.signer) {
      throw new Error("XMTP client or signer is not initialized");
    }

    // Start streaming messages in parallel
    (async () => {
      console.log("Waiting for messages...");
      const stream = await xmtpClient!.conversations.streamAllMessages();

      for await (const message of stream) {
        if (
          message?.senderInboxId.toLowerCase() ===
            xmtpClient!.inboxId.toLowerCase() ||
          message?.contentType?.typeId !== "text"
        ) {
          continue;
        }

        const conversation =
          await xmtpClient!.conversations.getConversationById(
            message.conversationId
          );

        if (!conversation) {
          console.log("Unable to find conversation, skipping");
          continue;
        }

        const inboxState = await xmtpClient!.preferences.inboxStateFromInboxIds(
          [message.senderInboxId]
        );
        const addressFromInboxId = inboxState[0].identifiers[0].identifier;
        console.log(`Sending "gm" response to ${addressFromInboxId}...`);
        await conversation.send("gm");

        console.log("Waiting for messages...");
      }
    })();

    if (!xmtpClient) {
      throw new Error("XMTP client is not initialized");
    }

    const clientDetails = {
      address: (await xmtpClient.signer.getIdentifier()).identifier,
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
