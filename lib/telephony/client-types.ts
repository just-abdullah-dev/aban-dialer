/**
 * Client-side (browser) dialer abstraction layer
 *
 * This file defines the contract for browser-based calling clients.
 * The UI components only ever interact with this interface, never directly
 * with vendor SDKs like @twilio/voice-sdk.
 *
 * CRITICAL: No React component or hook should import vendor SDKs directly.
 * Everything goes through this IDialerClient interface.
 */

/**
 * Dialer lifecycle events
 * Normalized across all providers
 */
export type DialerEvent =
  | "registered"    // Device successfully registered and ready to call
  | "incoming"      // Incoming call (unused in v1, outbound only)
  | "ringing"       // Call is ringing on the other end
  | "connected"     // Call successfully connected (other party answered)
  | "disconnected"  // Call ended or failed to connect
  | "error";        // Error occurred

/**
 * Event payload for error events
 */
export interface DialerErrorPayload {
  code?: string | number;
  message: string;
  originalError?: unknown;
}

/**
 * Event payload for connected events
 */
export interface DialerConnectedPayload {
  callId?: string;
  toNumber: string;
  fromNumber: string;
}

/**
 * Event payload for disconnected events
 */
export interface DialerDisconnectedPayload {
  callId?: string;
  reason?: string;
}

/**
 * Main client-side dialer interface
 * Every browser SDK (Twilio Voice SDK, Vonage Client SDK, etc.) gets wrapped to implement this
 */
export interface IDialerClient {
  /**
   * Initializes the dialer client
   * Fetches an access token from the backend and registers the device
   *
   * @param tokenEndpoint API endpoint that returns an access token
   */
  initialize(tokenEndpoint: string): Promise<void>;

  /**
   * Places an outbound call to a PSTN number
   *
   * @param toNumber Phone number in E.164 format
   * @param params Optional parameters (e.g., fromNumber, contactId, record)
   */
  call(toNumber: string, params?: Record<string, string>): Promise<void>;

  /**
   * Hangs up the active call
   * No-op if no active call
   */
  hangup(): void;

  /**
   * Mutes or unmutes the microphone on the active call
   *
   * @param muted true to mute, false to unmute
   */
  setMute(muted: boolean): void;

  /**
   * Sends DTMF digits during an active call
   * Used for IVR navigation
   *
   * @param digits String of digits to send (0-9, *, #)
   */
  sendDigits(digits: string): void;

  /**
   * Returns whether a call is currently active
   */
  isConnected(): boolean;

  /**
   * Returns the current mute state
   */
  isMuted(): boolean;

  /**
   * Subscribe to dialer events
   *
   * @param event Event name
   * @param handler Callback function
   */
  on(event: DialerEvent, handler: (payload?: unknown) => void): void;

  /**
   * Unsubscribe from dialer events
   *
   * @param event Event name
   * @param handler Callback function to remove
   */
  off(event: DialerEvent, handler: (payload?: unknown) => void): void;

  /**
   * Cleanup and disconnect
   * Called when component unmounts
   */
  destroy(): void;
}
