/**
 * Server-side telephony provider abstraction layer
 *
 * This file defines the contract that ALL telephony providers must implement.
 * Twilio, Vonage, Plivo, SignalWire, etc. all hide behind this interface.
 *
 * CRITICAL: No code outside lib/telephony/providers/<vendor>/ should ever
 * import vendor-specific SDKs directly. Everything goes through these interfaces.
 */

export interface AccessTokenResult {
  token: string;
  identity: string;
  expiresAt: Date;
}

export interface PlaceCallParams {
  /** Phone number to call, E.164 format (e.g., +14155551234) */
  toNumber: string;
  /** One of our purchased numbers to use as caller ID, E.164 format */
  fromNumber: string;
  /** Optional internal contact ID for correlation */
  contactId?: string;
  /** Optional: enable call recording */
  record?: boolean;
}

export interface PlaceCallResult {
  /** Vendor's own call identifier (e.g., Twilio CallSid) */
  providerCallId: string;
  /** Initial call status */
  status: CallStatus;
}

/**
 * Normalized call status enum
 * Maps vendor-specific statuses to these canonical values
 */
export type CallStatus =
  | "queued"
  | "ringing"
  | "in-progress"
  | "completed"
  | "busy"
  | "failed"
  | "no-answer"
  | "canceled";

/**
 * Normalized call event from webhook
 * Vendor-specific payloads get transformed into this shape
 */
export interface NormalizedCallEvent {
  providerCallId: string;
  status: CallStatus;
  durationSeconds?: number;
  /** Vendor's temporary recording URL (will be re-uploaded to our storage) */
  recordingUrl?: string;
  timestamp: Date;
}

/**
 * Main telephony provider interface
 * Every provider (Twilio, Vonage, etc.) must implement this
 */
export interface ITelephonyProvider {
  /** Provider name used in DB records (e.g., "twilio", "vonage") */
  readonly name: string;

  /**
   * Issues a short-lived access token for browser-based calling
   * @param identity Unique identifier for this user/session
   */
  getAccessToken(identity: string): Promise<AccessTokenResult>;

  /**
   * Initiates an outbound call (REST API path, optional)
   * Used for server-initiated calls if needed
   */
  placeCall(params: PlaceCallParams): Promise<PlaceCallResult>;

  /**
   * Builds the call-control response markup
   * - Twilio: Returns TwiML XML
   * - Vonage: Returns NCCO JSON
   * - Plivo: Returns XML
   * etc.
   *
   * This tells the provider what to do when a call is initiated
   */
  buildVoiceResponse(params: {
    toNumber: string;
    fromNumber: string;
    record?: boolean;
  }): string;

  /**
   * Verifies webhook signature to prevent spoofing
   * Each provider has their own signature algorithm
   */
  verifyWebhookSignature(req: {
    headers: Record<string, string>;
    rawBody: string;
    url: string;
  }): boolean;

  /**
   * Parses a raw webhook payload into our normalized format
   * Handles vendor-specific field names and status codes
   */
  parseStatusWebhook(rawPayload: Record<string, unknown>): NormalizedCallEvent;

  /**
   * Downloads recording bytes from the vendor's temporary storage
   * We immediately re-upload to our own storage backend
   */
  fetchRecordingBytes(recordingUrl: string): Promise<Buffer>;

  /**
   * Lists available phone numbers for purchase
   * Used by admin scripts, not exposed to end users
   */
  listAvailableNumbers(country: "US" | "AU"): Promise<Array<{
    number: string;
    friendlyName: string;
    locality?: string;
    region?: string;
  }>>;
}
