## Auth Client (Next.js + Tailwind + MUI + NextAuth + Axios)

### Providers
- Credentials
- Google

### API base URL
- `NEXT_PUBLIC_BASE_API=http://localhost:5001/api/v1`

### Setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Create env file:
   ```bash
   cp .env.local.example .env.local
   ```
3. Run dev server:
   ```bash
   npm run dev
   ```

### Notes
- Credentials provider posts to `/auth/login` on your configured base API.
- NextAuth endpoint is `/api/auth/[...nextauth]`.
- `GOOGLE_CLIENT_SECRET` must be the OAuth Client Secret from Google Cloud Console credentials, not an access token (tokens often start with `ya29.`).
- Social login flow (Google):
  - After OAuth callback, frontend exchanges Google tokens with backend via:
  - `AUTH_SOCIAL_GOOGLE_ENDPOINT` (default: `/auth/oauth/google`)
  - Backend should return app user + app access token in one of these shapes: `{ token, data }`, `{ accessToken, user }`, or equivalent.
