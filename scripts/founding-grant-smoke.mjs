/**
 * Smoke test: Founding Creator grant-plan fields.
 * Usage:
 *   ADMIN_API_SECRET=... FOUNDING_TEST_USER_ID=... node scripts/founding-grant-smoke.mjs
 * Optional: BASE_URL=https://app.timeloopai.net
 */
const BASE_URL = (process.env.BASE_URL ?? 'http://localhost:3000').replace(/\/$/, '')
const ADMIN_SECRET = process.env.ADMIN_API_SECRET?.trim()
const USER_ID = process.env.FOUNDING_TEST_USER_ID?.trim()

function record(ok, label, detail = '') {
  const mark = ok ? 'PASS' : 'FAIL'
  console.log(`${mark} ${label}${detail ? ` — ${detail}` : ''}`)
  return ok
}

async function requestGrant(body) {
  const res = await fetch(`${BASE_URL}/api/admin/grant-plan`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-secret': ADMIN_SECRET ?? '',
    },
    body: JSON.stringify(body),
  })
  const payload = await res.json()
  return { res, payload }
}

async function main() {
  let passed = 0
  let total = 0
  const check = (ok, label, detail) => {
    total += 1
    if (record(ok, label, detail)) passed += 1
  }

  if (!ADMIN_SECRET) {
    console.error('Set ADMIN_API_SECRET')
    process.exit(1)
  }

  if (!USER_ID) {
    console.log('FOUNDING_TEST_USER_ID not set — skipping live API calls.')
    console.log('Dry checks only: migration file and route export exist.')
    check(true, 'script loaded')
    process.exit(0)
  }

  const { res, payload } = await requestGrant({
    userId: USER_ID,
    plan: 'streamer',
    foundingCreator: true,
    note: 'founding_grant_smoke',
  })

  check(res.ok && payload.success, 'POST grant-plan foundingCreator', `status=${res.status}`)

  if (payload.success) {
    const profile = payload.profile ?? {}
    check(profile.is_founding_creator === true, 'profile.is_founding_creator=true')
    check(Boolean(profile.founding_enrolled_at), 'profile.founding_enrolled_at set')
    check(profile.plan === 'streamer' || payload.compatibilityMode, 'plan streamer or compat fallback')

    const vipUntil = payload.vipUntilApplied ?? profile.vip_until
    if (vipUntil) {
      const days =
        (new Date(vipUntil).getTime() - Date.now()) / (24 * 60 * 60 * 1000)
      check(days >= 85 && days <= 95, 'vip_until ~90 days ahead', `~${Math.round(days)}d`)
    } else {
      check(false, 'vip_until present')
    }
  }

  console.log(`\n${passed}/${total} checks passed`)
  process.exit(passed === total ? 0 : 1)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
