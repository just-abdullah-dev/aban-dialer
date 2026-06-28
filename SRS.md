# Software Requirements Specification (SRS)
## Custom Web-Based Cold Calling Dialer — Provider-Agnostic Architecture

**Version:** 1.1
**Author:** Abdullah (Aban Software Solutions)
**Target builder:** AI coding agent (Claude Code) — this document is the single source of truth. No external context will be provided beyond this file.

---

## 1. Introduction

### 1.1 Purpose
This document specifies the requirements for a self-built, browser-based outbound calling tool ("the Dialer") to be used for B2B cold calling campaigns targeting local businesses in the US and Australia (and potentially other English-speaking markets later).

The Dialer replaces paid SaaS dialer subscriptions (JustCall, Aircall, OpenPhone, etc.) by using **Twilio Programmable Voice** directly, wrapped behind a **provider abstraction layer**, so the underlying telephony vendor (Twilio) can be swapped for another VoIP/CPaaS provider (Vonage, Plivo, SignalWire, Telnyx, etc.) in the future with minimal code changes — ideally just one new adapter file and an environment variable change, with zero changes to UI components, API routes, or database schema.

The same "swap via env var, not via rewrite" principle also applies to **file storage** (used for call recordings) — see Section 10.

### 1.2 Background / Business Scenario
The operator (Abdullah) runs a one-person outreach operation: cold-calling small businesses in the US and Australia that don't currently have a website, offering a free sample website as a trust-building mechanism, with the goal of converting them into paying web development clients. He has already built a Node.js bulk email outreach script for a parallel channel.

Cold calling is the next channel to add. Rather than pay $15–40/month per seat for a commercial dialer (which is overkill for a solo operator and locks him into one vendor), the goal is to build a minimal, purpose-fit dialer:
- One operator (single user for v1, but designed so more callers can be added later)
- Click-to-call from a lead list, or manual dial pad
- Call status, duration, and outcome logged automatically
- Notes/disposition per call (e.g., "interested", "no answer", "call back later", "not interested")
- No recurring SaaS fee — pay only Twilio's pay-as-you-go usage (number rental + per-minute rate)
- **Critical requirement #1:** the telephony vendor must be replaceable later without rewriting the application.
- **Critical requirement #2:** any file storage (call recordings) must also be replaceable/configurable (local disk, Supabase Storage, S3, or GCP Cloud Storage) without rewriting the application.

### 1.3 Scope
**In scope (v1):**
- Outbound calling only, browser-to-PSTN, via WebRTC (no physical phone, no SIP hardware)
- Single operator (no multi-agent routing in v1)
- Lead/contact list management (manual entry + CSV import)
- Call logging, status tracking, disposition tagging, notes
- Click-to-call and manual dial pad
- Call recording toggle (optional, off by default), saved through a pluggable storage layer
- A provider abstraction layer with Twilio as the first concrete telephony implementation
- A storage abstraction layer with four selectable backends: local disk, Supabase Storage, AWS S3, GCP Cloud Storage

**Out of scope (v1)** — see Section 15 for details:
- Inbound call handling
- Predictive/power dialing (auto-dialing through a list unattended)
- SMS / WhatsApp messaging
- Multi-agent call routing, queues, IVR
- CRM integrations (HubSpot, Salesforce, etc.)
- Multi-tenant support (other users besides the operator)

### 1.4 Definitions & Acronyms
| Term | Meaning |
|---|---|
| PSTN | Public Switched Telephone Network — the regular phone network |
| WebRTC | Web Real-Time Communication — browser tech used to make voice calls without plugins |
| TwiML | Twilio Markup Language — XML Twilio uses to control call flow |
| CPaaS | Communications Platform as a Service (Twilio, Vonage, Plivo, etc.) |
| Adapter / Provider | The code module that implements vendor-specific logic behind a common interface |
| Disposition | The outcome tag applied to a call after it ends (e.g., "interested", "voicemail") |
| Access Token | A short-lived JWT issued by the backend that authorizes the browser to register as a "device" with the telephony provider and place calls |
| Storage Backend | Where binary files (call recordings) physically live — local disk, Supabase Storage, S3, or GCS |

### 1.5 References
- Twilio Voice JS SDK documentation (`@twilio/voice-sdk`)
- Twilio Programmable Voice REST API
- Next.js App Router documentation
- Supabase Storage API docs (used only as one optional storage backend, not as the database or auth provider)

---

## 2. Overall Description

### 2.1 Product Perspective
This is a standalone full-stack web application, not a plugin or extension of an existing system. It is a greenfield build.

### 2.2 User Classes
| User class | Description |
|---|---|
| Operator (Admin) | The sole user in v1 — makes calls, manages leads, reviews call history. Full access to everything. |
| (Future) Caller | A teammate who can place calls and log dispositions but cannot manage system settings. Not built in v1, but the data model should not actively prevent adding this later. |

### 2.3 Operating Environment
- **Frontend:** Modern desktop browser (Chrome/Edge preferred — WebRTC/microphone support). Mobile browser support is a nice-to-have, not a requirement, in v1.
- **Backend:** Next.js (App Router) deployed on Vercel or similar Node.js hosting.
- **Database:** Plain **PostgreSQL** — any standard Postgres host (self-hosted, Neon, Railway, RDS, etc.). No Supabase-specific database client or RLS dependency. Accessed via a normal connection string and an ORM (Prisma or Drizzle).
- **File Storage:** Pluggable — local disk by default for development; swappable to Supabase Storage, AWS S3, or GCP Cloud Storage in production via a single environment variable. See Section 10.
- **Telephony:** Twilio account (Pakistan-originated, pay-as-you-go), at least one purchased US number and one purchased Australian number.

### 2.4 Assumptions and Dependencies
- The operator has an active Twilio account with billing configured (international card or PayPal) and has purchased at least one phone number.
- The deployed app has a **publicly reachable HTTPS URL** (required for Twilio webhooks — this can be `ngrok`/`cloudflared` in local dev, and the production Vercel URL in production).
- The operator understands this is a v1 MVP, not a hardened multi-tenant SaaS product.
- Outbound calling from Pakistan-based Twilio accounts to US/AU numbers works at the network/PSTN level (confirmed feasible — see cost appendix); no special carrier permissions are required beyond a funded Twilio account.
- If Supabase Storage is chosen as the storage backend, only its **Storage** product is used — no Supabase Auth, no Supabase-hosted Postgres, no Supabase Realtime. The app's own PostgreSQL database remains fully independent of Supabase.

### 2.5 Constraints
- **No vendor lock-in at the code level**, for either telephony or storage:
  - Every Twilio-specific call (REST API calls, Voice SDK usage, webhook payload shapes) must be isolated inside `lib/telephony/providers/twilio/`. Nothing outside that module may import the Twilio SDK directly.
  - Every storage-backend-specific call (Supabase Storage client, AWS SDK, GCS client, local `fs` calls) must be isolated inside its own folder under `lib/storage/providers/`. Nothing outside that module may import those SDKs directly.
- **No SIP hardware / desk phones.** Calling happens entirely in-browser via WebRTC.
- **Cost-consciousness.** No recurring per-seat SaaS fees for the dialer itself — only Twilio's own usage-based billing, and whichever storage backend's own (typically negligible) cost.

---

## 3. System Architecture (Telephony Provider Abstraction Layer)

This is the most important architectural decision in this SRS, alongside the storage abstraction in Section 10. Read both before writing any code.

### 3.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        BROWSER (Operator)                    │
│                                                                │
│   Dialer UI  ──uses──>  IDialerClient (client wrapper)        │
│                              │                                 │
│                    implemented by:                            │
│                  TwilioDialerClient                           │
│              (wraps @twilio/voice-sdk Device)                 │
│                              │                                 │
│                   WebRTC media goes DIRECTLY                  │
│                   to Twilio's edge — not through               │
│                   our backend.                                │
└───────────────────────────┬───────────────────────────────────┘
                             │ HTTPS (control plane only)
┌────────────────────────────▼───────────────────────────────────┐
│                     NEXT.JS BACKEND (App Router)                │
│                                                                  │
│  /api/voice/token        ──> ITelephonyProvider.getAccessToken()│
│  /api/voice/call         ──> ITelephonyProvider.placeCall()     │
│  /api/voice/twiml        ──> ITelephonyProvider.buildTwiml()    │
│  /api/voice/status-callback ──> ITelephonyProvider.parseStatus()│
│  /api/voice/recording-callback ──> downloads recording, then    │
│                                     hands it to IStorageProvider │
│  /api/contacts, /api/calls, /api/dispositions  (fully agnostic) │
│                                                                  │
│   ITelephonyProvider (interface) ──implemented by──> TwilioProvider│
│   IStorageProvider (interface)   ──implemented by──> Local/Supabase/S3/GCS│
│                                                                  │
│           Both selected at runtime via env vars:                 │
│           TELEPHONY_PROVIDER=twilio                              │
│           STORAGE_PROVIDER=local | supabase | s3 | gcs            │
└────────────────────────────┬─────────────────────────────────────┘
                             │
┌────────────────────────────▼─────────────────────────────────────┐
│                         PostgreSQL                                │
│   users · contacts · calls · call_events · dispositions · numbers │
│   (zero vendor-specific fields beyond generic                     │
│    `provider_call_id` / `provider_name` and                       │
│    `recording_storage_key` / `recording_storage_provider`)        │
└────────────────────────────────────────────────────────────────────┘
```

**Key principle:** the database, the API routes, and the UI components only ever talk to *interfaces* (`ITelephonyProvider`, `IDialerClient`, `IStorageProvider`), never to Twilio, Supabase Storage, S3, or GCS directly. These vendors are just today's plug-ins.

### 3.2 Server-Side Interface — `ITelephonyProvider`

Define this in `lib/telephony/types.ts`. Every server-side provider (Twilio today, Vonage/Plivo/SignalWire tomorrow) must implement it.

```typescript
// lib/telephony/types.ts

export interface AccessTokenResult {
  token: string;
  identity: string;
  expiresAt: Date;
}

export interface PlaceCallParams {
  toNumber: string;       // E.164 format, e.g. +14155551234
  fromNumber: string;     // one of our purchased numbers, E.164
  contactId?: string;     // our internal contact id, for correlation
}

export interface PlaceCallResult {
  providerCallId: string; // vendor's own call SID/ID
  status: CallStatus;
}

export type CallStatus =
  | "queued"
  | "ringing"
  | "in-progress"
  | "completed"
  | "busy"
  | "failed"
  | "no-answer"
  | "canceled";

export interface NormalizedCallEvent {
  providerCallId: string;
  status: CallStatus;
  durationSeconds?: number;
  recordingUrl?: string;     // raw vendor URL, only used transiently before re-upload (see Section 10.5)
  timestamp: Date;
}

export interface ITelephonyProvider {
  /** Name used in DB records and logs, e.g. "twilio" */
  readonly name: string;

  /** Issues a short-lived token so the browser can register as a calling device */
  getAccessToken(identity: string): Promise<AccessTokenResult>;

  /** Initiates an outbound call (used for the REST-driven flow, if/when needed) */
  placeCall(params: PlaceCallParams): Promise<PlaceCallResult>;

  /** Builds the call-control response (TwiML for Twilio, NCCO for Vonage, etc.)
   *  returned to the provider when it asks "what do I do with this call?" */
  buildVoiceResponse(params: { toNumber: string; fromNumber: string }): string;

  /** Verifies that an incoming webhook actually came from the provider
   *  (signature validation — prevents spoofed status updates) */
  verifyWebhookSignature(req: {
    headers: Record<string, string>;
    rawBody: string;
    url: string;
  }): boolean;

  /** Converts the provider's raw webhook payload into our normalized shape */
  parseStatusWebhook(rawPayload: Record<string, unknown>): NormalizedCallEvent;

  /** Downloads a completed recording's raw bytes from the vendor, given their
   *  transient recording URL, so we can re-upload it to our own storage backend */
  fetchRecordingBytes(recordingUrl: string): Promise<Buffer>;

  /** Buys/lists numbers — used by an internal admin script, not end users */
  listAvailableNumbers(country: "US" | "AU"): Promise<string[]>;
}
```

### 3.3 Client-Side Interface — `IDialerClient`

Define this in `lib/telephony/client-types.ts`. This wraps whatever browser SDK the provider ships (Twilio Voice JS SDK today). The UI components only ever call these five methods and listen to these events — they never import `@twilio/voice-sdk` directly.

```typescript
// lib/telephony/client-types.ts

export type DialerEvent =
  | "registered"
  | "incoming"        // unused in v1 (outbound only) but kept for future
  | "connected"
  | "disconnected"
  | "error";

export interface IDialerClient {
  /** Fetches a token from our backend and registers the device */
  initialize(tokenEndpoint: string): Promise<void>;

  /** Places an outbound call to a PSTN number */
  call(toNumber: string, params?: Record<string, string>): Promise<void>;

  /** Hangs up the active call */
  hangup(): void;

  /** Mutes/unmutes the mic on the active call */
  setMute(muted: boolean): void;

  /** Sends DTMF digits (for IVR navigation, if ever needed) */
  sendDigits(digits: string): void;

  /** Subscribe to lifecycle events */
  on(event: DialerEvent, handler: (payload?: unknown) => void): void;
  off(event: DialerEvent, handler: (payload?: unknown) => void): void;
}
```

### 3.4 Provider Factory

`lib/telephony/factory.ts` — the *only* place that decides which concrete telephony provider gets used, based on an environment variable. Nothing else in the codebase should contain an `if (provider === "twilio")` branch.

```typescript
// lib/telephony/factory.ts
import { TwilioProvider } from "./providers/twilio/twilio-provider";
import type { ITelephonyProvider } from "./types";

export function getTelephonyProvider(): ITelephonyProvider {
  const providerName = process.env.TELEPHONY_PROVIDER ?? "twilio";

  switch (providerName) {
    case "twilio":
      return new TwilioProvider();
    // case "vonage":
    //   return new VonageProvider();
    // case "plivo":
    //   return new PlivoProvider();
    default:
      throw new Error(`Unknown telephony provider: ${providerName}`);
  }
}
```

### 3.5 Directory Structure

```
/lib
  /telephony
    types.ts                  <- ITelephonyProvider, shared types
    client-types.ts            <- IDialerClient, shared types
    factory.ts                  <- ProviderFactory
    /providers
      /twilio
        twilio-provider.ts      <- implements ITelephonyProvider
        twilio-dialer-client.ts  <- implements IDialerClient (browser-side, wraps Voice SDK)
        twiml-builder.ts          <- pure TwiML-string helpers
      /vonage   (future, empty in v1)
      /plivo    (future, empty in v1)
  /storage
    types.ts                   <- IStorageProvider, shared types
    factory.ts                  <- StorageProviderFactory
    /providers
      /local
        local-storage-provider.ts
      /supabase
        supabase-storage-provider.ts
      /s3
        s3-storage-provider.ts
      /gcs
        gcs-storage-provider.ts
  /db
    client.ts                  <- Prisma/Drizzle client, plain PostgreSQL connection
/app
  /api
    /voice
      /token/route.ts                  <- calls provider.getAccessToken()
      /call/route.ts                     <- calls provider.placeCall()
      /twiml/route.ts                      <- calls provider.buildVoiceResponse()
      /status-callback/route.ts             <- calls provider.verifyWebhookSignature() + parseStatusWebhook()
      /recording-callback/route.ts           <- fetches bytes from provider, hands to IStorageProvider.upload()
    /contacts/route.ts
    /calls/route.ts
    /dispositions/route.ts
  /dialer
    page.tsx                       <- main dialer screen, uses IDialerClient via a hook
    /components
      DialPad.tsx
      ActiveCallBar.tsx
      ContactQueue.tsx
      DispositionModal.tsx
  /contacts
    page.tsx                       <- lead list, import, CRUD
  /history
    page.tsx                       <- call log / reporting, includes recording playback via signed/public URL from IStorageProvider.getUrl()
/hooks
  useDialer.ts                    <- thin React hook around IDialerClient, used by UI
```

### 3.6 Outbound Call Data Flow (Browser-Initiated, Recommended for v1)

1. Operator opens `/dialer`, selects a contact from the queue (or types a number on the dial pad).
2. On page load, `useDialer()` hook calls `IDialerClient.initialize()`, which hits `GET /api/voice/token`.
3. `/api/voice/token` calls `getTelephonyProvider().getAccessToken(identity)` → returns a JWT (Twilio Access Token under the hood).
4. Browser SDK registers as a "device" using that token. `registered` event fires.
5. Operator clicks "Call" → `IDialerClient.call(toNumber)` is invoked.
6. The Voice SDK opens a WebRTC connection to the provider's edge, passing along `toNumber` and `fromNumber` as custom parameters.
7. Twilio's edge receives the call request and makes an HTTP request to **our** `/api/voice/twiml` endpoint asking "what should this call do?"
8. `/api/voice/twiml` calls `provider.buildVoiceResponse({ toNumber, fromNumber })`, which returns a `<Dial>` instruction (TwiML) telling Twilio to bridge the WebRTC leg to the actual PSTN number.
9. Twilio dials the real PSTN number. Audio flows directly between the browser and Twilio's edge (not through our server).
10. As the call progresses (ringing → answered → completed), Twilio sends asynchronous **status callback webhooks** to `/api/voice/status-callback`.
11. That route verifies the webhook signature, normalizes the payload via `parseStatusWebhook()`, and writes a `call_events` row + updates the `calls` row status in Postgres.
12. If recording was enabled for this call, Twilio also fires a separate recording-completed webhook to `/api/voice/recording-callback` once the audio file is ready (see Section 10.5 for what happens next).
13. When the call ends, the UI shows the `DispositionModal` so the operator tags the outcome and adds notes. This is saved via `POST /api/dispositions`.

### 3.7 Inbound Webhook Flow (Status Callbacks)

```
Twilio ──POST──> /api/voice/status-callback
                      │
                      ├─ provider.verifyWebhookSignature(req)  -> reject if invalid (403)
                      ├─ provider.parseStatusWebhook(body)      -> NormalizedCallEvent
                      ├─ INSERT INTO call_events (...)
                      └─ UPDATE calls SET status = ... WHERE provider_call_id = ...
```

---

## 4. Functional Requirements

| ID | Requirement | Priority |
|---|---|---|
| FR-1 | Operator can log in (simple email/password session auth backed by the app's own PostgreSQL `users` table — see Section 11; single user, no roles needed yet). | Must |
| FR-2 | Operator can view configured outbound caller-ID numbers (e.g., the purchased US and AU numbers) and pick which one to call FROM, depending on which country the target contact is in. | Must |
| FR-3 | Operator can add contacts manually (name, phone number in E.164, country, business name, notes) and bulk-import via CSV. | Must |
| FR-4 | Operator can place an outbound call directly from a contact's row ("click-to-call") or via a manual dial pad screen for ad-hoc numbers. | Must |
| FR-5 | The dialer UI shows real-time call state: idle → ringing → connected → ended, with an in-call timer. | Must |
| FR-6 | Operator can mute/unmute and hang up an active call from the UI. | Must |
| FR-7 | Every call attempt is logged automatically with: contact (if matched), from-number, to-number, start time, end time, duration, final status (completed/no-answer/busy/failed/canceled), and the provider used. | Must |
| FR-8 | After a call ends, the operator is prompted to select a disposition (e.g., Interested / Call Back Later / Not Interested / Voicemail / Wrong Number / No Answer) and optionally add free-text notes. | Must |
| FR-9 | Operator can view a searchable/filterable call history (by date, disposition, contact, country). | Should |
| FR-10 | Operator can optionally enable call recording per call (off by default — see Section 14 on consent/legal considerations). When enabled, the finished recording is downloaded from the telephony provider and persisted through the configured `IStorageProvider`, not left sitting only on the vendor's servers. | Could |
| FR-11 | Operator can schedule a "call back on [date]" reminder tied to a contact, visible on a simple follow-up list. | Should |
| FR-12 | A basic dashboard shows daily/weekly stats: calls made, connect rate (answered ÷ attempted), average call duration, dispositions breakdown. | Should |
| FR-13 | Switching the telephony provider requires only: (a) writing a new adapter implementing `ITelephonyProvider` and `IDialerClient`, (b) changing the `TELEPHONY_PROVIDER` env var, (c) no changes to any file under `/app`, `/db`, or `/hooks` outside the `lib/telephony/providers/` directory. | Must (architectural acceptance test) |
| FR-14 | Switching the file storage backend requires only: (a) selecting one of `local` / `supabase` / `s3` / `gcs` via the `STORAGE_PROVIDER` env var, (b) supplying that backend's credentials, (c) no changes to any application code. | Must (architectural acceptance test) |

---

## 5. Non-Functional Requirements

### 5.1 Portability / Switchability (the core requirement)
- No file outside `lib/telephony/providers/twilio/` may import `twilio` or `@twilio/voice-sdk` packages directly.
- No file outside `lib/storage/providers/<backend>/` may import that backend's SDK (`@supabase/supabase-js`, `@aws-sdk/client-s3`, `@google-cloud/storage`, or Node's `fs`) directly.
- All provider-specific payload shapes (TwiML, webhook bodies, error codes, storage SDK responses) must be translated into the normalized types defined in Sections 3 and 10 before they touch any other part of the app.
- A new telephony or storage adapter should be addable in well under a day of work for someone following this SRS.

### 5.2 Security
- Twilio Auth Token / API keys and all storage-backend credentials live only in server-side environment variables, never exposed to the browser.
- Access Tokens issued to the browser are short-lived (≤1 hour) and scoped to a single identity.
- All webhook endpoints (`/api/voice/status-callback`, `/api/voice/recording-callback`, `/api/voice/twiml`) must validate the provider's signature header before trusting the payload.
- Recording files, wherever stored, should be served via signed/expiring URLs where the backend supports it (Supabase Storage, S3, GCS all support this), not permanently public links.
- Standard Next.js API route protections: validate input, rate-limit the token/call endpoints to prevent abuse if the app is ever exposed publicly.

### 5.3 Performance
- Token issuance and TwiML response endpoints must respond in under 500ms (these sit in the critical path of call setup and Twilio enforces timeouts on webhook responses).

### 5.4 Reliability
- If a webhook delivery is missed or arrives out of order, the system should still arrive at a correct final state — store every event in `call_events` (append-only) and derive the calls.status from the latest event, rather than relying on exactly-once delivery.

### 5.5 Usability
- Single-page dialer experience: dial pad, active-call controls, and disposition prompt should not require navigating away from `/dialer`.

### 5.6 Maintainability
- Use TypeScript throughout with strict mode on.
- Provider/storage adapters should have no business logic beyond translating between the vendor's API and the normalized interfaces — keep them "dumb."

---

## 6. Data Model

### 6.1 Entities

**users**
- id (uuid, pk)
- email
- password_hash (text) — for the simple credentials-based auth described in Section 11
- created_at

**numbers** — the phone numbers we've purchased, regardless of provider
- id (uuid, pk)
- e164_number (text) — e.g. +14155551234
- country (text) — "US" | "AU"
- provider_name (text) — "twilio"
- provider_number_sid (text) — Twilio's own SID for this number
- is_active (bool)

**contacts**
- id (uuid, pk)
- business_name
- contact_name (nullable)
- phone_e164
- country
- source (text, e.g. "manual" | "csv-import")
- next_callback_at (timestamptz, nullable) — used for FR-11
- created_at

**calls**
- id (uuid, pk)
- contact_id (fk → contacts, nullable — manual dial-pad calls may not match a contact)
- from_number_id (fk → numbers)
- to_number (text, E.164)
- provider_name (text) — "twilio"
- provider_call_id (text) — Twilio CallSid, indexed, unique
- status (text) — current derived status (see CallStatus type)
- started_at, answered_at, ended_at (timestamptz, nullable)
- duration_seconds (int, nullable)
- recording_storage_provider (text, nullable) — "local" | "supabase" | "s3" | "gcs"
- recording_storage_key (text, nullable) — the key/path used to fetch it back via `IStorageProvider.getUrl()`
- created_at

**call_events** — append-only raw event log (one row per webhook received)
- id (uuid, pk)
- call_id (fk → calls)
- provider_name
- status (text)
- raw_payload (jsonb) — store the original payload for debugging/audit
- received_at (timestamptz)

**dispositions**
- id (uuid, pk)
- call_id (fk → calls, unique — one disposition per call)
- outcome (text) — enum-like: "interested" | "call_back_later" | "not_interested" | "voicemail" | "wrong_number" | "no_answer" | "other"
- notes (text, nullable)
- created_at

### 6.2 Relationships
- One `contact` → many `calls` (a contact may be called multiple times across follow-ups)
- One `call` → many `call_events` (full status history)
- One `call` → zero or one `disposition`
- One `number` → many `calls` (as the from-number)
- One `call` → zero or one stored recording file (referenced by `recording_storage_provider` + `recording_storage_key`, the actual bytes living in whichever backend is active)

---

## 7. External Interface Requirements

### 7.1 API Routes (Next.js App Router — all under `/app/api`)

| Route | Method | Purpose | Agnostic? |
|---|---|---|---|
| `/api/voice/token` | GET | Issue browser access token | Delegates to `provider.getAccessToken()` |
| `/api/voice/call` | POST | (Optional, server-initiated call path) | Delegates to `provider.placeCall()` |
| `/api/voice/twiml` | POST | Provider asks "what to do with this call" | Delegates to `provider.buildVoiceResponse()` |
| `/api/voice/status-callback` | POST | Provider pushes call status updates | Delegates to `verifyWebhookSignature()` + `parseStatusWebhook()` |
| `/api/voice/recording-callback` | POST | Provider signals a recording is ready | Delegates to `provider.fetchRecordingBytes()` then `storageProvider.upload()` |
| `/api/contacts` | GET/POST | List/create contacts | Yes — pure DB |
| `/api/contacts/import` | POST | CSV bulk import | Yes — pure DB |
| `/api/contacts/[id]` | GET/PATCH/DELETE | Single contact CRUD | Yes — pure DB |
| `/api/calls` | GET | Call history with filters | Yes — pure DB |
| `/api/calls/[id]/recording-url` | GET | Resolve a playable URL for a stored recording | Delegates to `storageProvider.getUrl()` |
| `/api/dispositions` | POST | Save outcome/notes for a call | Yes — pure DB |
| `/api/numbers` | GET | List active outbound numbers | Yes — pure DB (synced from provider via an admin script, not live-fetched per request) |

### 7.2 Browser Client Wrapper
The `useDialer()` React hook is the only place UI components touch `IDialerClient`. Example shape (illustrative, not final code):

```typescript
// hooks/useDialer.ts (shape only)
function useDialer() {
  // internally instantiates the right IDialerClient based on
  // a value passed down from the server (NEXT_PUBLIC_TELEPHONY_PROVIDER)
  return {
    status: "idle" | "ringing" | "connected" | "ended",
    callDuration: number,
    call: (toNumber: string, contactId?: string) => void,
    hangup: () => void,
    toggleMute: () => void,
  };
}
```

---

## 8. Twilio-Specific Implementation Notes (v1 concrete telephony provider)

These live entirely inside `lib/telephony/providers/twilio/`.

- **Voice SDK:** `@twilio/voice-sdk` npm package, used client-side to create a `Device` and place calls.
- **Access Tokens:** generated server-side using the `twilio` npm package's `AccessToken` + `VoiceGrant` classes. Requires: Account SID, API Key SID, API Key Secret, and a TwiML App SID.
- **TwiML App:** one TwiML App must be created in the Twilio Console (or via API), with its Voice "Request URL" pointed at `/api/voice/twiml`.
- **Webhook signature verification:** use `twilio.validateRequest()` (from the `twilio` package) inside `verifyWebhookSignature()`, comparing the `X-Twilio-Signature` header against the computed signature using your Auth Token.
- **Status callbacks:** configure the call's `statusCallback` parameter (set inside `buildVoiceResponse`'s `<Dial>` verb) to point at `/api/voice/status-callback`, with `statusCallbackEvent=initiated,ringing,answered,completed`.
- **Recording callbacks:** if recording is enabled on the `<Dial>`/`<Record>` verb, set `recordingStatusCallback` to point at `/api/voice/recording-callback`. Twilio's payload includes a temporary `RecordingUrl` — `fetchRecordingBytes()` downloads it immediately, since Twilio-hosted URLs require auth and are not the system of record here.
- **Numbers needed:** one US local number, one Australian local number (see cost table below). Both are purchased via the Twilio Console or REST API and stored in the `numbers` table.

### 8.1 Cost Reference (Twilio, pay-as-you-go, approximate — verify live rates on Twilio's pricing pages before committing, as these change)

| Item | US | Australia |
|---|---|---|
| Local number rental | ~$1.00–1.15/month | ~$2.50–3.00/month (local); ~$6/month (mobile-type number) |
| Outbound call rate (to local landline/mobile) | ~$0.013–0.014/minute | ~$0.028/minute |
| Inbound rate (if ever needed) | ~$0.0085/minute | varies, generally a bit higher than US |
| Call recording | ~$0.0025/minute to record + small storage fee on Twilio's side (irrelevant once re-uploaded to our own storage backend) | same |
| New account trial credit | $15 free credit on signup | — |

**Rough monthly estimate at light volume** (e.g., 300 calls/month, ~2 min avg, split 60% US / 40% AU):
- Numbers: ~$1.15 (US) + ~$3.00 (AU) ≈ **$4.15/month** fixed
- US calling: 180 calls × 2 min × $0.014 ≈ **$5.04**
- AU calling: 120 calls × 2 min × $0.028 ≈ **$6.72**
- **Total: roughly $16/month** at that volume — well under any per-seat SaaS dialer price, and it scales down to near-zero if call volume is low.

---

## 9. Telephony Provider Migration Guide (How to Switch Off Twilio Later)

If a future need arises (e.g., better rates from Plivo, or Twilio account issues), follow this checklist:

1. Create `lib/telephony/providers/<new-provider>/`.
2. Implement `ITelephonyProvider` (server-side) — translate the new vendor's call-control format (NCCO for Vonage, XML for Plivo, etc.) and webhook payloads into the normalized types from Section 3.2.
3. Implement `IDialerClient` (browser-side) — wrap whatever WebRTC/JS SDK the new vendor provides, exposing the same five methods.
4. Add a `case` to `lib/telephony/factory.ts`.
5. Update `TELEPHONY_PROVIDER` (and `NEXT_PUBLIC_TELEPHONY_PROVIDER` for the client bundle) in environment variables.
6. Run the full call flow against the new provider in a staging environment. No other file in the codebase should need to change.
7. Backfill: existing `calls` rows keep their old `provider_name = "twilio"` value; new calls get the new provider's name. The `calls` table is provider-agnostic by design, so historical data remains intact.

> Note for the builder: SignalWire intentionally maintains near-total API compatibility with Twilio's REST API and even ships a Twilio-compatible SDK shim, which would make that particular migration close to a configuration change rather than a rewrite — but do not assume this for other vendors (Vonage and Plivo have materially different call-control models).

---

## 10. File Storage Abstraction Layer

This mirrors the telephony abstraction in Section 3, applied to wherever call recording files physically live. The database **never** stores raw audio bytes — only a `recording_storage_provider` + `recording_storage_key` pair (Section 6.1), which `IStorageProvider.getUrl()` resolves into something playable on demand.

### 10.1 Why This Exists
The operator wants the freedom to start with the simplest possible option (local disk, zero extra accounts) during development, move to **Supabase Storage** for a managed, low-effort production setup, and later switch to **AWS S3** or **GCP Cloud Storage** if cost, region, or scale considerations change — all without touching application code.

### 10.2 Server-Side Interface — `IStorageProvider`

Define this in `lib/storage/types.ts`.

```typescript
// lib/storage/types.ts

export interface UploadParams {
  key: string;            // e.g. "recordings/{callId}.mp3"
  buffer: Buffer;
  contentType: string;    // e.g. "audio/mpeg"
}

export interface UploadResult {
  storageProvider: string; // "local" | "supabase" | "s3" | "gcs"
  key: string;
}

export interface GetUrlOptions {
  expiresInSeconds?: number; // for backends that support signed URLs
}

export interface IStorageProvider {
  /** Name used in DB records and logs, e.g. "supabase" */
  readonly name: string;

  /** Stores the file, returns the key actually used (may differ slightly per backend) */
  upload(params: UploadParams): Promise<UploadResult>;

  /** Resolves a playable/downloadable URL for a previously-uploaded key.
   *  Should return a signed/expiring URL where the backend supports it. */
  getUrl(key: string, options?: GetUrlOptions): Promise<string>;

  /** Deletes a file (used for cleanup / retention policies, if ever needed) */
  delete(key: string): Promise<void>;
}
```

### 10.3 Storage Provider Factory

`lib/storage/factory.ts` — the *only* place that decides which concrete storage backend gets used.

```typescript
// lib/storage/factory.ts
import { LocalStorageProvider } from "./providers/local/local-storage-provider";
import { SupabaseStorageProvider } from "./providers/supabase/supabase-storage-provider";
import { S3StorageProvider } from "./providers/s3/s3-storage-provider";
import { GcsStorageProvider } from "./providers/gcs/gcs-storage-provider";
import type { IStorageProvider } from "./types";

export function getStorageProvider(): IStorageProvider {
  const backend = process.env.STORAGE_PROVIDER ?? "local";

  switch (backend) {
    case "local":
      return new LocalStorageProvider();
    case "supabase":
      return new SupabaseStorageProvider();
    case "s3":
      return new S3StorageProvider();
    case "gcs":
      return new GcsStorageProvider();
    default:
      throw new Error(`Unknown storage provider: ${backend}`);
  }
}
```

### 10.4 Backend-Specific Notes

| Backend | Package | Notes |
|---|---|---|
| `local` | Node's built-in `fs/promises` | Writes to a configurable directory (e.g. `./storage/recordings`). `getUrl()` returns a route under `/api/files/[key]` that streams the file from disk. Good for development only — not durable across redeploys on platforms like Vercel with ephemeral filesystems. |
| `supabase` | `@supabase/supabase-js` (Storage client only — **not** the Auth or Postgres client) | Uses a dedicated Storage bucket (e.g. `call-recordings`). `getUrl()` uses `createSignedUrl()` for time-limited access. |
| `s3` | `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner` | `getUrl()` uses `getSignedUrl()` for time-limited access. |
| `gcs` | `@google-cloud/storage` | `getUrl()` uses `getSignedUrl()` (V4 signing) for time-limited access. |

### 10.5 Recording Storage Flow

```
Twilio ──POST──> /api/voice/recording-callback
                      │
                      ├─ provider.verifyWebhookSignature(req)         -> reject if invalid
                      ├─ provider.fetchRecordingBytes(RecordingUrl)    -> Buffer
                      ├─ storageProvider.upload({ key, buffer, contentType })
                      └─ UPDATE calls
                           SET recording_storage_provider = storageProvider.name,
                               recording_storage_key = uploadResult.key
                           WHERE provider_call_id = ...
```

When the operator views call history and clicks "play recording," the UI calls `GET /api/calls/[id]/recording-url`, which reads the stored key and calls `storageProvider.getUrl()` to produce a fresh, time-limited link — never a permanently cached one.

### 10.6 Directory Structure (Storage Portion)
Already reflected in Section 3.5 — see `/lib/storage/`.

### 10.7 Switching Storage Backends Later
1. If the target backend already has an adapter (all four are built in v1), simply change `STORAGE_PROVIDER` and supply that backend's credentials. No code changes at all.
2. If adding a genuinely new backend (e.g., Cloudflare R2, Backblaze B2), create `lib/storage/providers/<new-backend>/`, implement `IStorageProvider`, add a `case` to the factory. No other file should need to change.
3. Existing `calls` rows keep whatever `recording_storage_provider` they were created under — old recordings remain retrievable through their original backend's adapter even after the *default* backend changes, since the factory can be extended to route `getUrl()` calls per-row to the adapter matching that row's stored provider name, rather than always using the current default.

---

## 11. Technology Stack

| Layer | Choice |
|---|---|
| Frontend framework | Next.js (App Router), TypeScript |
| Styling | Tailwind CSS |
| Database | Plain **PostgreSQL** (any host — self-hosted, Neon, Railway, RDS, etc.) |
| ORM | Prisma (or Drizzle — builder's choice, not prescribed) |
| Auth | Simple credentials-based session auth (e.g. Auth.js / NextAuth with a Credentials provider, or a hand-rolled session+bcrypt setup) backed by the app's own `users` table in PostgreSQL. No Supabase Auth dependency — single user in v1. |
| Telephony (v1 concrete provider) | Twilio Programmable Voice + `@twilio/voice-sdk` |
| File storage (v1 concrete options, pick one at a time via env var) | Local disk (dev) / Supabase Storage / AWS S3 / GCP Cloud Storage |
| CSV parsing (contact import) | `papaparse` or similar |

---

## 12. Environment Variables

```
# Telephony provider selection
TELEPHONY_PROVIDER=twilio
NEXT_PUBLIC_TELEPHONY_PROVIDER=twilio

# Twilio (only read inside lib/telephony/providers/twilio/)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_API_KEY_SID=
TWILIO_API_KEY_SECRET=
TWILIO_TWIML_APP_SID=

# Database (plain PostgreSQL — no Supabase-specific vars here)
DATABASE_URL=postgresql://user:password@host:5432/dbname

# Auth
AUTH_SECRET=                 # session/JWT signing secret

# Storage backend selection
STORAGE_PROVIDER=local        # local | supabase | s3 | gcs

# --- Only required if STORAGE_PROVIDER=local ---
LOCAL_STORAGE_PATH=./storage/recordings

# --- Only required if STORAGE_PROVIDER=supabase ---
# (Storage product only — this is NOT used for auth or the database)
SUPABASE_STORAGE_URL=
SUPABASE_STORAGE_SERVICE_ROLE_KEY=
SUPABASE_STORAGE_BUCKET=call-recordings

# --- Only required if STORAGE_PROVIDER=s3 ---
AWS_S3_BUCKET=
AWS_S3_REGION=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=

# --- Only required if STORAGE_PROVIDER=gcs ---
GCS_BUCKET=
GCS_PROJECT_ID=
GCS_CLIENT_EMAIL=
GCS_PRIVATE_KEY=

# App
NEXT_PUBLIC_APP_URL=   # used to build the absolute webhook URLs registered with Twilio
```

---

## 13. Deployment Considerations
- Twilio (and any CPaaS provider) needs a **publicly reachable HTTPS URL** to send webhooks to. In local development, use `ngrok` or `cloudflared tunnel` to expose `localhost:3000`.
- The actual call audio (WebRTC media) flows directly between the browser and the provider's edge servers — it does **not** route through the Next.js backend. This means the backend's only real-time responsibility is issuing tokens and answering the TwiML/webhook requests quickly; it does not need to be a persistent/always-on server, and works fine on serverless (Vercel functions).
- Keep webhook route handlers fast (<500ms) — Twilio has timeouts and will retry or fail the call setup if the TwiML endpoint is slow.
- **If deploying to a serverless/ephemeral filesystem host (e.g., Vercel) and recordings matter**, do not use `STORAGE_PROVIDER=local` in production — local disk is not durable across deploys/instances there. Use it only for local development; switch to `supabase`, `s3`, or `gcs` before going live if call recording is enabled.

---

## 14. Security & Compliance Considerations
- Validate every inbound webhook signature — never trust an unverified payload claiming to be a call status or recording update.
- Store Twilio credentials and storage backend credentials only in server environment variables (never `NEXT_PUBLIC_*`, except the provider/backend *name*, which is not a secret).
- Serve recordings via signed/expiring URLs, not permanently public links.
- **Regulatory note (not legal advice):** outbound cold calling is subject to telemarketing rules in the destination country — the US has the TCPA and state-level do-not-call lists, Australia has the Do Not Call Register and the Spam Act. Calling B2B/business lines for B2B offers is generally lower-risk than consumer cold-calling under most of these regimes, but the operator should independently verify compliance requirements for the specific lists being called, especially before enabling call recording (which often requires consent disclosure, and varies by state/territory for two-party consent).

---

## 15. Out of Scope (v1) — Explicitly Not Building Yet
- Predictive/auto-dialing through a list without a human clicking each call
- Inbound call handling / call queues / IVR
- SMS or WhatsApp messaging
- Multi-agent/team features, role-based permissions
- CRM integrations
- Multi-tenancy (supporting other businesses/users beyond the operator)
- Voicemail drop automation
- AI call transcription/analysis (could be a good v2 addition, not v1)
- Automatic recording-retention/deletion policies (manual deletion via `IStorageProvider.delete()` is supported, but no scheduled cleanup job in v1)

---

## 16. Future Enhancements (v2+ ideas, not required now)
- Power dialer mode (auto-advance to next contact after disposition)
- Voicemail drop (pre-recorded message left automatically on no-answer)
- AI-assisted call summaries/transcription (could itself live behind a similar `ITranscriptionProvider` abstraction)
- A second telephony adapter (e.g., SignalWire) actually implemented, to prove out the abstraction layer in practice
- A second storage adapter actually exercised in production (e.g., start on Supabase Storage, later prove the S3 path works) to validate the abstraction in practice, not just on paper
- Multi-country expansion beyond US/AU (UK, Canada, NZ) — purely a matter of buying more numbers and adding rows to the `numbers` table; no architecture change needed

---

## 17. Acceptance Criteria (Definition of Done for v1)
1. Operator can log in, see a contact list, and add/import contacts.
2. Operator can click "Call" on a contact and the call connects to a real PSTN number via the browser, using a purchased Twilio number as caller ID.
3. Call status updates in real time in the UI (ringing → connected → ended).
4. Every call is recorded in the `calls` table with correct duration and final status, regardless of outcome (answered, no-answer, busy, failed).
5. After hangup, the operator can tag a disposition and notes, saved against that call.
6. Call history page shows all past calls with filters.
7. With recording enabled, a completed call's audio is downloaded from Twilio and persisted through whichever `STORAGE_PROVIDER` is configured, playable from the call history page via a freshly resolved URL.
8. **Telephony architectural test:** a reviewer can read `lib/telephony/providers/twilio/` in isolation and understand it is the *only* place Twilio-specific code exists — confirmed by grepping the rest of the codebase for `twilio` and finding zero matches outside that directory and the relevant `package.json` entries.
9. **Storage architectural test:** switching `STORAGE_PROVIDER` from `local` to `supabase` (or `s3`/`gcs`), with correct credentials supplied, requires zero application code changes and recordings continue to upload and play back correctly.
10. The database runs on plain PostgreSQL with no Supabase-specific database or auth dependency — Supabase, if used at all, is scoped strictly to its Storage product.