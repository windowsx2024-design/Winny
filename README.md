# Liftly (rebuild) - Winny repository

This repo is a rebuilt scaffold of the original Liftly app tailored for Netlify deployments.

What I added in this commit:
- Netlify Functions-based API under netlify/functions
- Local store.json backing store for development (keeps existing local store support)
- Auth endpoints: signup, login, logout, forgot-password (placeholder), admin users list
- Integration endpoints that return "Not configured" when credentials are missing
- netlify.toml and .env.example
- Minimal frontend shell (src/index.html)

Limitations in this environment
- I committed files directly to main as you requested.
- I could not run `npm install` or `netlify dev` from this environment. Please run them locally.

Next steps for you locally
1. Copy .env.example to .env and fill credentials.
2. npm install
3. netlify dev

