/**
 * Twilio Dialer Client (Browser-side)
 *
 * This file contains ALL Twilio Voice SDK code for the browser.
 * No other client-side file should import @twilio/voice-sdk directly.
 *
 * This adapter wraps the Twilio Device and translates between Twilio's
 * events and our normalized IDialerClient interface.
 */

import { Device, Call } from "@twilio/voice-sdk";
import type { IDialerClient, DialerEvent } from "../../client-types";

export class TwilioDialerClient implements IDialerClient {
  private device: Device | null = null;
  private activeCall: Call | null = null;
  private eventHandlers: Map<DialerEvent, Set<(payload?: unknown) => void>> = new Map();

  /**
   * Initializes the Twilio Device with an access token
   */
  async initialize(tokenEndpoint: string): Promise<void> {
    try {
      // Fetch access token from backend
      const response = await fetch(tokenEndpoint, {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch access token: ${response.statusText}`);
      }

      const data = await response.json();
      const token = data.token;

      if (!token) {
        throw new Error("No token received from backend");
      }

      // Create Twilio Device
      this.device = new Device(token, {
        logLevel: process.env.NODE_ENV === "development" ? 1 : 0,
        codecPreferences: [Call.Codec.Opus, Call.Codec.PCMU],
      });

      // Set up event listeners
      this.setupDeviceListeners();

      // Register the device
      await this.device.register();

      // Emit registered event
      this.emit("registered");
    } catch (error) {
      console.error("Failed to initialize dialer:", error);
      this.emit("error", {
        message: error instanceof Error ? error.message : "Failed to initialize dialer",
        originalError: error,
      });
      throw error;
    }
  }

  /**
   * Places an outbound call
   */
  async call(toNumber: string, params?: Record<string, string>): Promise<void> {
    if (!this.device) {
      throw new Error("Device not initialized. Call initialize() first.");
    }

    if (this.activeCall) {
      throw new Error("A call is already in progress");
    }

    try {
      // Merge params with toNumber
      const callParams = {
        To: toNumber,
        ...params,
      };

      // Initiate call
      const call = await this.device.connect({ params: callParams });
      this.activeCall = call;

      // Set up call event listeners
      this.setupCallListeners(call);
    } catch (error) {
      console.error("Failed to place call:", error);
      this.emit("error", {
        message: error instanceof Error ? error.message : "Failed to place call",
        originalError: error,
      });
      throw error;
    }
  }

  /**
   * Hangs up the active call
   */
  hangup(): void {
    if (this.activeCall) {
      this.activeCall.disconnect();
      this.activeCall = null;
    }
  }

  /**
   * Mutes or unmutes the microphone
   */
  setMute(muted: boolean): void {
    if (this.activeCall) {
      this.activeCall.mute(muted);
    }
  }

  /**
   * Sends DTMF digits
   */
  sendDigits(digits: string): void {
    if (this.activeCall) {
      this.activeCall.sendDigits(digits);
    }
  }

  /**
   * Returns whether a call is currently active
   */
  isConnected(): boolean {
    return this.activeCall !== null && this.activeCall.status() === Call.State.Open;
  }

  /**
   * Returns the current mute state
   */
  isMuted(): boolean {
    return this.activeCall?.isMuted() ?? false;
  }

  /**
   * Subscribe to dialer events
   */
  on(event: DialerEvent, handler: (payload?: unknown) => void): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);
  }

  /**
   * Unsubscribe from dialer events
   */
  off(event: DialerEvent, handler: (payload?: unknown) => void): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  /**
   * Cleanup and destroy the device
   */
  destroy(): void {
    if (this.activeCall) {
      this.activeCall.disconnect();
      this.activeCall = null;
    }

    if (this.device) {
      this.device.unregister();
      this.device.destroy();
      this.device = null;
    }

    this.eventHandlers.clear();
  }

  /**
   * Emit an event to all registered handlers
   */
  private emit(event: DialerEvent, payload?: unknown): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(payload);
        } catch (error) {
          console.error(`Error in ${event} handler:`, error);
        }
      });
    }
  }

  /**
   * Set up Device-level event listeners
   */
  private setupDeviceListeners(): void {
    if (!this.device) return;

    this.device.on("error", (error) => {
      console.error("Device error:", error);
      this.emit("error", {
        code: error.code,
        message: error.message,
        originalError: error,
      });
    });

    this.device.on("incoming", (call) => {
      // Incoming calls not supported in v1 (outbound only)
      // But we keep the event for future expansion
      this.emit("incoming", { callSid: call.parameters.CallSid });
      call.reject(); // Auto-reject for now
    });
  }

  /**
   * Set up Call-level event listeners
   */
  private setupCallListeners(call: Call): void {
    // Ringing event - when the call is ringing on the other end
    call.on("ringing", () => {
      this.emit("ringing", {
        callId: call.parameters.CallSid,
      });
    });

    // Accept event - when the other party picks up the call
    call.on("accept", () => {
      this.emit("connected", {
        callId: call.parameters.CallSid,
        toNumber: call.parameters.To,
        fromNumber: call.parameters.From,
      });
    });

    call.on("disconnect", () => {
      this.activeCall = null;
      this.emit("disconnected", {
        callId: call.parameters.CallSid,
      });
    });

    call.on("cancel", () => {
      this.activeCall = null;
      this.emit("disconnected", {
        callId: call.parameters.CallSid,
        reason: "canceled",
      });
    });

    call.on("reject", () => {
      this.activeCall = null;
      this.emit("disconnected", {
        callId: call.parameters.CallSid,
        reason: "rejected",
      });
    });

    call.on("error", (error) => {
      console.error("Call error:", error);
      this.emit("error", {
        code: error.code,
        message: error.message,
        originalError: error,
      });
    });
  }
}
