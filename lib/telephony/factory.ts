/**
 * Server-Side Telephony Provider Factory
 *
 * This file is for SERVER-SIDE ONLY usage (API routes, server components).
 * It imports Node.js dependencies and should NEVER be imported by client components.
 *
 * For client-side dialer, use: lib/telephony/client-factory.ts
 *
 * To add a new provider:
 * 1. Create lib/telephony/providers/<vendor>/<vendor>-provider.ts
 * 2. Implement ITelephonyProvider
 * 3. Add a case here
 * 4. Set TELEPHONY_PROVIDER=<vendor> in env vars
 */

import type { ITelephonyProvider } from "./types";
import { TwilioProvider } from "./providers/twilio/twilio-provider";

/**
 * Returns the configured telephony provider instance
 * Reads from TELEPHONY_PROVIDER environment variable
 *
 * SERVER-SIDE ONLY - uses Node.js dependencies
 *
 * @throws Error if provider is unknown
 */
export function getTelephonyProvider(): ITelephonyProvider {
  const providerName = process.env.TELEPHONY_PROVIDER ?? "twilio";

  switch (providerName.toLowerCase()) {
    case "twilio":
      return new TwilioProvider();

    // Future providers:
    // case "vonage":
    //   return new VonageProvider();
    // case "plivo":
    //   return new PlivoProvider();
    // case "signalwire":
    //   return new SignalWireProvider();

    default:
      throw new Error(
        `Unknown telephony provider: "${providerName}". ` +
        `Supported providers: twilio. ` +
        `Set TELEPHONY_PROVIDER environment variable to a supported provider.`
      );
  }
}

/**
 * @deprecated Use lib/telephony/client-factory.ts for client-side dialer
 *
 * Client-side factory for browser dialer instances
 * This runs in the browser, so it reads from NEXT_PUBLIC_TELEPHONY_PROVIDER
 *
 * @throws Error if provider is unknown
 */
export function getDialerClientClass() {
  const providerName = process.env.NEXT_PUBLIC_TELEPHONY_PROVIDER ?? "twilio";

  switch (providerName.toLowerCase()) {
    case "twilio":
      // Dynamic import to keep vendor SDK out of initial bundle
      return () => import("./providers/twilio/twilio-dialer-client").then(m => m.TwilioDialerClient);

    // Future providers:
    // case "vonage":
    //   return () => import("./providers/vonage/vonage-dialer-client").then(m => m.VonageDialerClient);

    default:
      throw new Error(
        `Unknown telephony provider: "${providerName}". ` +
        `Supported providers: twilio. ` +
        `Set NEXT_PUBLIC_TELEPHONY_PROVIDER environment variable.`
      );
  }
}
