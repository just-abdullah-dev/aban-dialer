/**
 * Client-Side Telephony Factory (Browser Only)
 *
 * This file provides the dialer client for browser-based calling.
 * It should ONLY be imported by client components ("use client").
 */

import type { IDialerClient } from "./client-types";
import { TwilioDialerClient } from "./providers/twilio/twilio-dialer-client";

/**
 * Returns a singleton instance of the dialer client for the browser
 * Call this in React components to get a configured dialer
 *
 * CLIENT-SIDE ONLY - safe for browser
 */
let dialerClientInstance: IDialerClient | null = null;

export function getDialerClient(): IDialerClient {
  if (typeof window === "undefined") {
    throw new Error("getDialerClient() can only be called in the browser");
  }

  if (!dialerClientInstance) {
    const providerName = process.env.NEXT_PUBLIC_TELEPHONY_PROVIDER ?? "twilio";

    switch (providerName.toLowerCase()) {
      case "twilio":
        dialerClientInstance = new TwilioDialerClient();
        break;

      default:
        throw new Error(
          `Unknown telephony provider: "${providerName}". ` +
          `Supported providers: twilio.`
        );
    }
  }

  return dialerClientInstance;
}
