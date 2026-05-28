# Cloudflare + Vercel Rules

Use Cloudflare for DNS, WAF, and static asset caching only. Do not cache app APIs,
auth callbacks, checkout routes, or Lemon Squeezy webhooks.

## DNS

- `app.yourdomain.com` -> CNAME `cname.vercel-dns.com`
- `cn.yourdomain.com` -> CNAME `cname.vercel-dns.com`
- Proxy can be enabled, but avoid Cloudflare features that rewrite or cache API requests.

## Cache Rules

Cache these paths:

- `/_next/static/*`
- `/assets/*`
- `/gallery/*`
- `/textures/*`
- `/images/*`

Bypass cache for these paths:

- `/api/*`
- `/auth/*`
- `/login`
- `/checkout`
- `/api/webhooks/*`

## Region Prompt

The app does not force redirect based on language. It detects `zh-CN`, asks the user
whether to use the China entry, and stores the choice in `localStorage` under
`timeloop-region`.

Set `NEXT_PUBLIC_CN_SITE_URL=https://cn.yourdomain.com` in Vercel to enable the
redirect button.
