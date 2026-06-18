#!/usr/bin/env node

/**
 * Payment flow smoke checks (VIP / Streamer / Credits).
 *
 * This script verifies API-side checkout readiness and access gating without
 * requiring real Lemon Squeezy payment completion.
 *
 * Usage:
 *   SMOKE_BASE_URL=http://localhost:3000 \
 *   SMOKE_FREE_TOKEN=... \
 *   SMOKE_VIP_TOKEN=... \
 *   SMOKE_STREAMER_TOKEN=... \
 *   node scripts/payment-smoke.mjs
 *
 * Optional:
 *   SMOKE_SKIP_CHECKOUT=1    # skip checkout endpoint checks
 *   SMOKE_REQUIRE_TOKENS=1   # force token mode (fail when tokens missing)
 */

const BASE_URL = (process.env.SMOKE_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const TOKENS = {
  free: process.env.SMOKE_FREE_TOKEN?.trim() ?? "",
  vip: process.env.SMOKE_VIP_TOKEN?.trim() ?? "",
  streamer: process.env.SMOKE_STREAMER_TOKEN?.trim() ?? "",
};
const SKIP_CHECKOUT = process.env.SMOKE_SKIP_CHECKOUT === "1";
const REQUIRE_TOKENS = process.env.SMOKE_REQUIRE_TOKENS === "1";

const CHECKS = [];
const FAILURES = [];

function record(ok, label, detail = "") {
  CHECKS.push({ ok, label, detail });
  const prefix = ok ? "[PASS]" : "[FAIL]";
  console.log(`${prefix} ${label}${detail ? ` — ${detail}` : ""}`);
  if (!ok) FAILURES.push({ label, detail });
}

function authHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

async function requestJson(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, options);
  const payload = await res.json().catch(() => ({}));
  return { res, payload };
}

function errorMessage(payload) {
  return typeof payload?.error === "string" ? payload.error : "n/a";
}

async function checkHealth() {
  const { res, payload } = await requestJson("/api/health");
  record(res.ok, "GET /api/health", `status=${res.status}`);
  if (!res.ok) return;

  const env = payload?.env ?? {};
  record(typeof env.billing === "boolean", "health.billing exists");
  record(typeof env.vipCheckout === "boolean", "health.vipCheckout exists");
  record(typeof env.streamerCheckout === "boolean", "health.streamerCheckout exists");
  record(typeof env.creditsCheckout === "boolean", "health.creditsCheckout exists");
  record(Array.isArray(env.billingMissing), "health.billingMissing exists");
  record(Array.isArray(env.vipCheckoutMissing), "health.vipCheckoutMissing exists");
  record(Array.isArray(env.streamerCheckoutMissing), "health.streamerCheckoutMissing exists");
  record(Array.isArray(env.creditsCheckoutMissing), "health.creditsCheckoutMissing exists");
}

async function checkProfile(role, token) {
  const { res, payload } = await requestJson("/api/me", {
    method: "GET",
    headers: authHeaders(token),
  });
  record(res.ok && payload?.success, `${role} GET /api/me`, `status=${res.status}`);
  return payload?.profile ?? null;
}

async function checkCheckout(role, token, kind, expectedStatusSet) {
  const { res, payload } = await requestJson("/api/checkout/lemonsqueezy", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ kind }),
  });
  const ok = expectedStatusSet.includes(res.status);
  record(
    ok,
    `${role} POST /api/checkout/lemonsqueezy kind=${kind}`,
    `status=${res.status}, error=${errorMessage(payload)}`,
  );

  if (res.ok) {
    record(
      payload?.success === true && typeof payload?.checkoutUrl === "string" && payload.checkoutUrl.length > 0,
      `${role} checkout url returned (${kind})`,
    );
  }
}

async function checkNoTokenMode() {
  const meRes = await requestJson("/api/me", {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  record(
    meRes.res.status === 401,
    "no-token GET /api/me should be 401",
    `status=${meRes.res.status}`,
  );

  if (SKIP_CHECKOUT) {
    console.log("[INFO] Checkout checks skipped (SMOKE_SKIP_CHECKOUT=1)");
    return;
  }

  for (const kind of ["vip", "streamer", "credits"]) {
    const checkoutRes = await requestJson("/api/checkout/lemonsqueezy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind }),
    });
    record(
      checkoutRes.res.status === 401,
      `no-token checkout kind=${kind} should be 401`,
      `status=${checkoutRes.res.status}, error=${errorMessage(checkoutRes.payload)}`,
    );
  }
}

async function main() {
  console.log(`Running payment smoke against ${BASE_URL}`);
  const hasAllTokens = Boolean(TOKENS.free && TOKENS.vip && TOKENS.streamer);

  await checkHealth();

  if (!hasAllTokens) {
    if (REQUIRE_TOKENS) {
      for (const role of ["free", "vip", "streamer"]) {
        if (!TOKENS[role]) {
          record(false, `${role} token present`, `missing env token for ${role}`);
        }
      }
    } else {
      console.log("\n[INFO] Tokenless local mode enabled (set SMOKE_REQUIRE_TOKENS=1 to require tokens).");
      await checkNoTokenMode();
    }
  } else {
    const freeProfile = await checkProfile("free", TOKENS.free);
    const vipProfile = await checkProfile("vip", TOKENS.vip);
    const streamerProfile = await checkProfile("streamer", TOKENS.streamer);

    record(freeProfile?.isVip === false, "free profile isVip=false");
    record(vipProfile?.isVip === true, "vip profile isVip=true");
    record(streamerProfile?.isStreamerPlan === true, "streamer profile isStreamerPlan=true");

    if (!SKIP_CHECKOUT) {
      // 200: checkout URL created.
      // 503: environment missing for that checkout kind (acceptable in smoke).
      await checkCheckout("free", TOKENS.free, "vip", [200, 503]);
      await checkCheckout("free", TOKENS.free, "streamer", [200, 503]);
      await checkCheckout("free", TOKENS.free, "credits", [200, 503]);

      await checkCheckout("vip", TOKENS.vip, "streamer", [200, 503]);
      await checkCheckout("streamer", TOKENS.streamer, "vip", [200, 503]);
    } else {
      console.log("[INFO] Checkout checks skipped (SMOKE_SKIP_CHECKOUT=1)");
    }
  }

  console.log("\n---- Payment Smoke Summary ----");
  const passed = CHECKS.filter((item) => item.ok).length;
  const failed = CHECKS.length - passed;
  console.log(`Total: ${CHECKS.length}, Passed: ${passed}, Failed: ${failed}`);
  if (failed > 0) process.exitCode = 1;
}

await main();
