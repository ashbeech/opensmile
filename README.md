# OpenSmile - Patient Acquisition Platform

An open-source AI-ready dental practice sales funnel and analytics dashboard that transforms how dental practices convert leads into high-value patients.

## Features

- **Sales Dashboard** - Comprehensive tool for conversion teams to manage leads across multiple dental practices
- **Practice Portal** - Real-time analytics dashboard for practice owners to monitor patient acquisition performance
- **AI Context Engine** - Captures every interaction to enable AI-powered automation and optimization
- **Multi-Tenant Architecture** - Secure data isolation between practices
- **Lead Pipeline** - Full lifecycle tracking from enquiry to treatment
- **Analytics & Reporting** - Conversion funnel, ROI tracking, and performance metrics
- **Webhook Integrations** - Meta (Facebook/Instagram) lead ingestion with signature verification
- **GDPR Compliance** - Data retention policies, PII redaction, and right to erasure

## Tech Stack

- **Frontend:** Next.js 16, React 19, Tailwind CSS v4, Recharts
- **Backend:** tRPC, Prisma ORM, Supabase (PostgreSQL + Auth + Storage)
- **AI (Stubbed):** Grok API, OpenAI Whisper

## Quick Start

### Prerequisites

- Node.js 20+
- A Supabase project ([supabase.com](https://supabase.com))

### Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/opensmile.git
cd opensmile

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Push schema to database
npx prisma db push

# Seed demo data (requires Supabase credentials)
# First set SEED_ADMIN_PASSWORD and SEED_SALES_PASSWORD in .env.local
npx prisma db seed

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

### Environment Variables

See [.env.example](.env.example) for all required and optional environment variables.

**Required:**

- `DATABASE_URL` - PostgreSQL connection string
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` - Supabase publishable key (replaces legacy anon key)
- `SUPABASE_SECRET_KEY` - Supabase secret key, server-only (replaces legacy service_role key)
- `SUPABASE_URL` - Server-only Supabase URL alias

## Architecture

```
app/                    # Next.js pages (App Router)
  (dashboard)/          # Protected dashboard routes
  (portal)/             # Practice portal routes
  api/                  # API routes (tRPC + webhooks)
components/             # React components
lib/                    # Utilities, Supabase clients, AI stubs
  server/               # Server-only code (safeLog, rateLimit, tenantDb)
  supabase/             # Supabase client factories
  ai/                   # AI service stubs
server/                 # tRPC server code
  routers/              # tRPC route handlers
prisma/                 # Database schema and seed
```

## Security

OpenSmile follows strict security practices:

- **Multi-tenant isolation** via Prisma-enforced access control
- **Webhook signature verification** (HMAC-SHA256, timing-safe)
- **PII redaction** in all logging
- **Rate limiting** on all endpoints
- **CSRF protection** via SameSite cookies + origin validation
- **No client-side Realtime** on sensitive tables

Originally architected and developed by Ash Beech

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

MIT License - See [LICENSE](LICENSE) for details.

**Build Freely. Scale Confidently. Give Back Optionally.**
