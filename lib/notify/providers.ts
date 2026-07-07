/**
 * Pluggable notification providers. Each reads its key from env and degrades
 * gracefully (skipped, logged — never throws) when unconfigured.
 */

import type { NotifyProvider, OutgoingMessage, SendResult } from "./types";

/** Email via Resend's REST API (no SDK). */
export const resendEmailProvider: NotifyProvider = {
  channel: "email",
  name: "resend",
  isConfigured() {
    return Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM);
  },
  async send(message: OutgoingMessage): Promise<SendResult> {
    if (!this.isConfigured()) {
      return { channel: "email", provider: this.name, ok: false, skipped: true };
    }
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM,
          to: message.to,
          subject: message.subject ?? "Майстор24",
          text: message.text,
        }),
      });
      if (!res.ok) {
        return {
          channel: "email",
          provider: this.name,
          ok: false,
          error: `HTTP ${res.status}: ${await res.text()}`,
        };
      }
      return { channel: "email", provider: this.name, ok: true };
    } catch (e) {
      return {
        channel: "email",
        provider: this.name,
        ok: false,
        error: e instanceof Error ? e.message : String(e),
      };
    }
  },
};

/**
 * Generic HTTP SMS/Viber provider. Points at any provider's send endpoint via
 * SMS_PROVIDER_URL + SMS_API_KEY (Bearer). Drop in a real SDK later behind this
 * same NotifyProvider interface without touching callers.
 */
export const httpSmsProvider: NotifyProvider = {
  channel: "sms",
  name: "http-sms",
  isConfigured() {
    return Boolean(process.env.SMS_PROVIDER_URL && process.env.SMS_API_KEY);
  },
  async send(message: OutgoingMessage): Promise<SendResult> {
    if (!this.isConfigured()) {
      return { channel: "sms", provider: this.name, ok: false, skipped: true };
    }
    try {
      const res = await fetch(process.env.SMS_PROVIDER_URL as string, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.SMS_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ to: message.to, text: message.text }),
      });
      if (!res.ok) {
        return {
          channel: "sms",
          provider: this.name,
          ok: false,
          error: `HTTP ${res.status}`,
        };
      }
      return { channel: "sms", provider: this.name, ok: true };
    } catch (e) {
      return {
        channel: "sms",
        provider: this.name,
        ok: false,
        error: e instanceof Error ? e.message : String(e),
      };
    }
  },
};

export const providers: Record<string, NotifyProvider> = {
  email: resendEmailProvider,
  sms: httpSmsProvider,
};
