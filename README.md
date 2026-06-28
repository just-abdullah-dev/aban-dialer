# Aban Dialer

A custom-built, browser-based outbound calling tool for B2B cold calling campaigns. Built with **provider abstraction** at its core — swap telephony vendors (Twilio, Vonage, Plivo) or storage backends (local, S3, GCS) via environment variables, no code changes required.

## 🎯 Purpose

Replace expensive SaaS dialer subscriptions ($15-40/month per seat) with a self-hosted solution using pay-as-you-go telephony APIs. Perfect for solo operators or small teams doing B2B outbound calling.

**Key Features:**
- Click-to-call from lead list or dial pad
- Call logging, disposition tagging, notes
- Call recording (optional, with pluggable storage)
- Real-time call status updates
- CSV contact import
- Call history & analytics
- **Zero vendor lock-in** — switch providers anytime

## 🏗️ Architecture Highlights

### Provider Abstraction Layer
**Telephony:** Twilio today, Vonage/Plivo/SignalWire tomorrow — just add an adapter.  
**Storage:** Local disk → Supabase Storage → AWS S3 → GCP Cloud Storage — just change env var.

All vendor-specific code lives in isolated provider directories. Application code only talks to interfaces, never to vendor SDKs directly.

See [`SRS.md`](./SRS.md) for complete technical specification.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ (for Next.js 15)
- PostgreSQL database (free tier: Neon, Supabase, Railway)
- Twilio account (for calling) — optional initially
- ngrok or cloudflared (for local webhook testing)

### Setup

1. **Clone and install:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your credentials
   ```

3. **Set up database:**
   ```bash
   npx prisma generate
   npx prisma migrate dev
   ```

4. **Run development server:**
   ```bash
   npm run dev
   ```

5. **Expose webhooks (for Twilio callbacks):**
   ```bash
   ngrok http 3000
   # Copy the HTTPS URL to NEXT_PUBLIC_APP_URL in .env.local
   ```

📖 **Detailed setup guide:** [`GETTING_STARTED.md`](./GETTING_STARTED.md)

## 📁 Project Structure

```
aban-dialer/
├── app/                          # Next.js 15 App Router
│   ├── api/                      # API routes
│   │   ├── voice/                # Telephony endpoints (provider-agnostic)
│   │   ├── contacts/             # Contact CRUD
│   │   └── calls/                # Call history
│   ├── dialer/                   # Main dialer UI
│   ├── contacts/                 # Contact management
│   └── history/                  # Call history & analytics
├── lib/
│   ├── telephony/                # 🔌 Telephony abstraction
│   │   ├── types.ts              # ITelephonyProvider interface
│   │   ├── factory.ts            # Provider selection logic
│   │   └── providers/
│   │       └── twilio/           # ⚠️ ONLY place with Twilio code
│   └── storage/                  # 💾 Storage abstraction
│       ├── types.ts              # IStorageProvider interface
│       ├── factory.ts            # Storage backend selection
│       └── providers/
│           ├── local/            # Local disk
│           ├── supabase/         # Supabase Storage
│           ├── s3/               # AWS S3 (placeholder)
│           └── gcs/              # GCP Cloud Storage (placeholder)
├── hooks/                        # React hooks (useDialer, etc.)
├── components/                   # Reusable UI components
└── prisma/                       # Database schema & migrations
```

## 🔌 Switching Providers

### Telephony (Twilio → Vonage example)
1. Create `lib/telephony/providers/vonage/vonage-provider.ts`
2. Implement `ITelephonyProvider` interface
3. Add case to `lib/telephony/factory.ts`
4. Change env var: `TELEPHONY_PROVIDER=vonage`
5. ✅ Done — zero changes to app code

### Storage (Local → S3 example)
1. Implement `lib/storage/providers/s3/s3-storage-provider.ts` (placeholder exists)
2. Change env var: `STORAGE_PROVIDER=s3`
3. Add AWS credentials to `.env.local`
4. ✅ Done — zero changes to app code

## 📊 Current Progress

**Status:** Foundation Complete (Module 1/13) — 15%

✅ Provider abstraction layer  
✅ Twilio adapter (full implementation)  
✅ Storage adapters (local + Supabase)  
✅ TypeScript interfaces  
⚪ Database schema (next)  
⚪ API routes  
⚪ Dialer UI  
⚪ Contact management  

See [`IMPLEMENTATION_PROGRESS.md`](./IMPLEMENTATION_PROGRESS.md) for detailed task breakdown.

## 🧪 Architecture Validation

Run this to verify vendor isolation:
```bash
bash scripts/validate-architecture.sh
```

Should show:
- ✅ No Twilio imports outside `lib/telephony/providers/twilio/`
- ✅ No storage SDK imports outside respective providers
- ✅ All interface files exist
- ✅ Factory pattern correctly implemented

## 📖 Documentation

- [`SRS.md`](./SRS.md) — Complete software requirements specification
- [`GETTING_STARTED.md`](./GETTING_STARTED.md) — Step-by-step setup guide
- [`IMPLEMENTATION_PROGRESS.md`](./IMPLEMENTATION_PROGRESS.md) — Module-by-module progress tracker
- [`SUMMARY.md`](./SUMMARY.md) — High-level summary of what's built

## 🛠️ Tech Stack

- **Framework:** Next.js 15 (App Router), TypeScript
- **Database:** PostgreSQL (via Prisma ORM)
- **Telephony:** Twilio Programmable Voice (swappable)
- **Storage:** Local/Supabase/S3/GCS (swappable)
- **Auth:** Session-based (bcrypt)
- **Styling:** Tailwind CSS

## 📋 Environment Variables

Required:
```env
DATABASE_URL=postgresql://...
TELEPHONY_PROVIDER=twilio
STORAGE_PROVIDER=local
```

Provider-specific (only when that provider is active):
```env
# Twilio (if TELEPHONY_PROVIDER=twilio)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_API_KEY_SID=
TWILIO_API_KEY_SECRET=
TWILIO_TWIML_APP_SID=

# Supabase Storage (if STORAGE_PROVIDER=supabase)
SUPABASE_STORAGE_URL=
SUPABASE_STORAGE_SERVICE_ROLE_KEY=
SUPABASE_STORAGE_BUCKET=
```

See [`.env.example`](./.env.example) for complete list.

## 🚀 Deployment

**Recommended:** Vercel (native Next.js support, serverless functions for API routes)

1. Push to GitHub
2. Import to Vercel
3. Add environment variables
4. Deploy
5. Update Twilio webhook URLs to production domain

**Note:** If using `STORAGE_PROVIDER=local`, switch to `supabase` or `s3` for production (Vercel has ephemeral filesystem).

## 🤝 Contributing

This is a private project built for Aban Software Solutions. Not open for external contributions.

## 📄 License

Proprietary — All rights reserved by Abdullah (Aban Software Solutions)

## 📞 Contact

Built by Claude Code for Abdullah  
Aban Software Solutions  
Pakistan

---

**Next Steps:** Database setup → See [`GETTING_STARTED.md`](./GETTING_STARTED.md)
