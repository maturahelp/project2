import { providers } from "./providers";
import type { OutgoingMessage, SendResult } from "./types";

export type { OutgoingMessage, SendResult, Channel } from "./types";

/**
 * Send one message via the provider for its channel. Never throws: a missing
 * provider key is logged and reported as `skipped`, a failure as an error.
 */
export async function sendNotification(
  message: OutgoingMessage,
): Promise<SendResult> {
  const provider = providers[message.channel];
  if (!provider) {
    console.error(`[notify] no provider for channel "${message.channel}"`);
    return {
      channel: message.channel,
      provider: "none",
      ok: false,
      error: "no_provider",
    };
  }

  const result = await provider.send(message);

  if (result.skipped) {
    console.warn(
      `[notify] ${message.channel} skipped (${provider.name} not configured) → to=${message.to}`,
    );
  } else if (!result.ok) {
    console.error(
      `[notify] ${message.channel} failed via ${provider.name}: ${result.error}`,
    );
  } else {
    console.info(`[notify] ${message.channel} sent via ${provider.name} → ${message.to}`);
  }

  return result;
}

/** Send several messages, tolerating individual failures. */
export async function sendNotifications(
  messages: OutgoingMessage[],
): Promise<SendResult[]> {
  return Promise.all(messages.map((m) => sendNotification(m)));
}
