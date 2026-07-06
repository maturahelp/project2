/** Notification abstraction: one interface, pluggable providers per channel. */

export type Channel = "email" | "sms";

export type OutgoingMessage = {
  channel: Channel;
  /** Email address (email channel) or phone number (sms channel). */
  to: string;
  /** Email subject; ignored by SMS. */
  subject?: string;
  text: string;
};

export type SendResult = {
  channel: Channel;
  provider: string;
  /** true = accepted by the provider. */
  ok: boolean;
  /** true = intentionally not sent (e.g. provider key missing). Not an error. */
  skipped?: boolean;
  error?: string;
};

export interface NotifyProvider {
  readonly channel: Channel;
  readonly name: string;
  /** Whether the required env keys are present. */
  isConfigured(): boolean;
  send(message: OutgoingMessage): Promise<SendResult>;
}
