## Kitchen‑X Shell

Kitchen‑X is a Next.js 14 App Router project that fuses deterministic kitchen layouts with AI-assisted variant generation, Konva-powered previews, Firebase persistence, and Stripe deposits.

### Requirements

- Node.js 18.x (LTS)
- npm 10.x (bundled with Node)
- `pre-commit` (optional, for local git hooks)

### Installation

```bash
cd apps/shell
npm install
```

### Environment variables

Copy `.env.example` to `.env.local` and populate all required secrets.

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_APP_URL` | Canonical origin for client routing & webhooks |
| `NEXT_PUBLIC_FIREBASE_*` | Firebase Web SDK configuration |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key for Checkout |
| `GEMINI_API_KEY` | Google Gemini key for layout fusion |
| `STRIPE_SECRET_KEY` | Stripe secret for Checkout sessions |
| `STRIPE_WEBHOOK_SECRET` | Signing secret for webhook verification |
| `FIREBASE_PROJECT_ID` `FIREBASE_CLIENT_EMAIL` `FIREBASE_PRIVATE_KEY` | Firebase Admin credentials (service account) |
| `FIREBASE_STORAGE_BUCKET` | Storage bucket used for preview exports |

Optional overrides: `GEMINI_FUSE_MODEL`, `GEMINI_MODEL`, `GEMINI_MAX_RETRIES`, `GEMINI_INITIAL_BACKOFF_MS`.

### Scripts

```bash
# Start Next dev server
npm run dev

# Type-aware lint (fails on warnings)
npm run lint -- --max-warnings=0

# Production build (also executed in CI)
npm run build

# Launch the production build locally
npm run start
```

### Tooling

- **CI**: `.github/workflows/ci.yml` runs `npm ci`, `npm run lint`, and `npm run build`.
- **pre-commit**: `pre-commit install` to enable hooks (runs ESLint + basic whitespace/yaml fixes).

### Deploying to Vercel

1. `cd apps/shell`
2. `vercel link` (select the correct scope / project)
3. `vercel env pull .env.local` to sync secrets locally (or push with `vercel env push`)
4. Deploy: `vercel` (preview) or `vercel --prod`

The app expects the default Next.js build. Additional serverless limits are defined in `vercel.json`.
