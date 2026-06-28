/**
 * Twilio Telephony Provider Implementation
 *
 * This file contains ALL Twilio-specific server-side code.
 * No other file in the codebase should import the 'twilio' package.
 *
 * This adapter translates between Twilio's API and our normalized ITelephonyProvider interface.
 */

import twilio from "twilio";
import type {
  ITelephonyProvider,
  AccessTokenResult,
  PlaceCallParams,
  PlaceCallResult,
  NormalizedCallEvent,
  CallStatus,
} from "../../types";

const AccessToken = twilio.jwt.AccessToken;
const VoiceGrant = AccessToken.VoiceGrant;

export class TwilioProvider implements ITelephonyProvider {
  readonly name = "twilio";

  private accountSid: string;
  private authToken: string;
  private apiKeySid: string;
  private apiKeySecret: string;
  private twimlAppSid: string;
  private client: twilio.Twilio;

  constructor() {
    // Load credentials from environment variables
    this.accountSid = process.env.TWILIO_ACCOUNT_SID || "";
    this.authToken = process.env.TWILIO_AUTH_TOKEN || "";
    this.apiKeySid = process.env.TWILIO_API_KEY_SID || "";
    this.apiKeySecret = process.env.TWILIO_API_KEY_SECRET || "";
    this.twimlAppSid = process.env.TWILIO_TWIML_APP_SID || "";

    if (!this.accountSid || !this.authToken) {
      throw new Error(
        "Twilio credentials missing. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN environment variables."
      );
    }

    // Initialize Twilio client
    this.client = twilio(this.accountSid, this.authToken);
  }

  /**
   * Generates a short-lived access token for browser-based calling
   */
  async getAccessToken(identity: string): Promise<AccessTokenResult> {
    if (!this.apiKeySid || !this.apiKeySecret || !this.twimlAppSid) {
      throw new Error(
        "Twilio token generation requires TWILIO_API_KEY_SID, TWILIO_API_KEY_SECRET, and TWILIO_TWIML_APP_SID"
      );
    }

    // Create an access token
    const token = new AccessToken(
      this.accountSid,
      this.apiKeySid,
      this.apiKeySecret,
      {
        identity,
        ttl: 3600, // 1 hour
      }
    );

    // Create a Voice grant for this token
    const voiceGrant = new VoiceGrant({
      outgoingApplicationSid: this.twimlAppSid,
      incomingAllow: false, // Outbound only for v1
    });

    token.addGrant(voiceGrant);

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    return {
      token: token.toJwt(),
      identity,
      expiresAt,
    };
  }

  /**
   * Initiates an outbound call via REST API (optional, for server-initiated calls)
   */
  async placeCall(params: PlaceCallParams): Promise<PlaceCallResult> {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const twimlUrl = `${appUrl}/api/voice/twiml?To=${encodeURIComponent(params.toNumber)}&From=${encodeURIComponent(params.fromNumber)}`;

    const call = await this.client.calls.create({
      to: params.toNumber,
      from: params.fromNumber,
      url: twimlUrl,
      statusCallback: `${appUrl}/api/voice/status-callback`,
      statusCallbackEvent: ["initiated", "ringing", "answered", "completed"],
      record: params.record,
    });

    return {
      providerCallId: call.sid,
      status: this.normalizeTwilioStatus(call.status),
    };
  }

  /**
   * Builds TwiML response for call control
   */
  buildVoiceResponse(params: {
    toNumber: string;
    fromNumber: string;
    record?: boolean;
  }): string {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const VoiceResponse = twilio.twiml.VoiceResponse;
    const response = new VoiceResponse();

    const dial = response.dial({
      callerId: params.fromNumber,
      record: params.record ? "record-from-answer" : undefined,
      recordingStatusCallback: params.record
        ? `${appUrl}/api/voice/recording-callback`
        : undefined,
      recordingStatusCallbackEvent: params.record ? ["completed"] : undefined,
    });

    dial.number(params.toNumber);

    return response.toString();
  }

  /**
   * Verifies webhook signature to prevent spoofing
   */
  verifyWebhookSignature(req: {
    headers: Record<string, string>;
    rawBody: string;
    url: string;
  }): boolean {
    const signature = req.headers["x-twilio-signature"];
    if (!signature) {
      return false;
    }

    return twilio.validateRequest(
      this.authToken,
      signature,
      req.url,
      this.parseFormBody(req.rawBody)
    );
  }

  /**
   * Parses Twilio webhook payload into normalized format
   */
  parseStatusWebhook(rawPayload: Record<string, unknown>): NormalizedCallEvent {
    const callSid = rawPayload.CallSid as string;
    const callStatus = rawPayload.CallStatus as string;
    const duration = rawPayload.CallDuration
      ? parseInt(rawPayload.CallDuration as string, 10)
      : undefined;

    return {
      providerCallId: callSid,
      status: this.normalizeTwilioStatus(callStatus),
      durationSeconds: duration,
      timestamp: new Date(),
    };
  }

  /**
   * Downloads recording bytes from Twilio
   */
  async fetchRecordingBytes(recordingUrl: string): Promise<Buffer> {
    // Twilio recording URLs require auth
    const url = new URL(recordingUrl);
    const authHeader = `Basic ${Buffer.from(`${this.accountSid}:${this.authToken}`).toString("base64")}`;

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: authHeader,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch recording: ${response.statusText}`);
    }

    return Buffer.from(await response.arrayBuffer());
  }

  /**
   * Lists available phone numbers for purchase
   */
  async listAvailableNumbers(country: "US" | "AU") {
    const countryCode = country === "US" ? "US" : "AU";
    const numbers = await this.client.availablePhoneNumbers(countryCode).local.list({
      limit: 20,
    });

    return numbers.map((num) => ({
      number: num.phoneNumber,
      friendlyName: num.friendlyName,
      locality: num.locality || undefined,
      region: num.region || undefined,
    }));
  }

  /**
   * Maps Twilio-specific status codes to our normalized CallStatus enum
   */
  private normalizeTwilioStatus(twilioStatus: string): CallStatus {
    switch (twilioStatus.toLowerCase()) {
      case "queued":
        return "queued";
      case "ringing":
        return "ringing";
      case "in-progress":
      case "answered":
        return "in-progress";
      case "completed":
        return "completed";
      case "busy":
        return "busy";
      case "failed":
        return "failed";
      case "no-answer":
        return "no-answer";
      case "canceled":
        return "canceled";
      default:
        console.warn(`Unknown Twilio status: ${twilioStatus}, defaulting to "failed"`);
        return "failed";
    }
  }

  /**
   * Parses x-www-form-urlencoded body (Twilio's webhook format)
   */
  private parseFormBody(body: string): Record<string, string> {
    const params = new URLSearchParams(body);
    const result: Record<string, string> = {};
    params.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }
}
