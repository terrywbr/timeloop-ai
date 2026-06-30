# Membership Validation Checklist

Use this checklist before release whenever membership or entitlement logic changes.

## Test Accounts

- Free account (`plan=free`)
- VIP account (`plan=vip`, active)
- Streamer account (`plan=streamer`, active)

## API Entitlement Checks

- `GET /api/me`
  - Free: `isVip=false`, `isStreamerPlan=false`, `hasCreatorTools=false`, `hasDownloadAccess=false`, `hasUnlimitedGeneration=false`
  - VIP: `isVip=true`, `isStreamerPlan=false`, `hasCreatorTools=false`, `hasDownloadAccess=true`, `hasUnlimitedGeneration=true`
  - Streamer: `plan=streamer`, `isStreamerPlan=true`, `hasCreatorTools=true`, `hasDownloadAccess=true`, `hasUnlimitedGeneration=true`, `isVip=false` (unless also on VIP tier)

**Entitlement source of truth:** `users.plan` column (`free` | `vip` | `streamer`). Lemon `variant_id` is metadata only; it does **not** grant Streamer tools when `plan=vip`.

- `POST /api/generate`
  - Free: deducts 10 credits and rejects when remaining credits < 10
  - VIP/Streamer: no credit deduction

- `POST /api/download/background`
  - Free: 403
  - VIP/Streamer: 200 with downloadable file

- `GET/PUT /api/streamer/settings`
  - Free/VIP: 403
  - Streamer: 200

- `GET/POST/DELETE /api/streamer/backgrounds`
  - Free/VIP: 403
  - Streamer: 200

## UI Gate Checks

- Membership panel
  - Free shows credits and upgrade buttons
  - VIP shows VIP active and streamer upgrade button
  - Streamer shows Streamer active and no streamer upgrade button

- Control panel / mobile panel
  - Streamer-only background tools visible only for Streamer
  - Download tooltip and action enabled only for VIP/Streamer

## Credit Policy Checks

- New profile defaults:
  - `monthly_generation_limit=50`
  - `remaining_credits=50`
- Free label copy reflects "50 credits/month"
- Standard generation copy reflects "10 credits each"

## Stream Mode Safety Checks

- `?stream=1` view is available to all tiers
- Creator tools remain Streamer-only

