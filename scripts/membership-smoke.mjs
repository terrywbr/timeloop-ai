#!/usr/bin/env node

/**
 * Membership smoke checks for Free / VIP / Streamer accounts.
 *
 * Usage:
 *   SMOKE_BASE_URL=http://localhost:3000 \
 *   SMOKE_FREE_TOKEN=... \
 *   SMOKE_VIP_TOKEN=... \
 *   SMOKE_STREAMER_TOKEN=... \
 *   node scripts/membership-smoke.mjs
 */

const BASE_URL = (process.env.SMOKE_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const TOKENS = {
  free: process.env.SMOKE_FREE_TOKEN?.trim() ?? "",
  vip: process.env.SMOKE_VIP_TOKEN?.trim() ?? "",
  streamer: process.env.SMOKE_STREAMER_TOKEN?.trim() ?? "",
};

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

function hasApiProfileShape(profile) {
  return (
    profile &&
    typeof profile.isVip === "boolean" &&
    typeof profile.isStreamerPlan === "boolean" &&
    typeof profile.hasCreatorTools === "boolean" &&
    typeof profile.hasUnlimitedGeneration === "boolean" &&
    typeof profile.hasDownloadAccess === "boolean" &&
    typeof profile.remainingCredits === "number"
  );
}

async function checkMe(role, token) {
  const { res, payload } = await requestJson("/api/me", {
    method: "GET",
    headers: authHeaders(token),
  });

  record(res.ok && payload?.success, `${role} /api/me status`, `status=${res.status}`);
  if (!(res.ok && payload?.success)) return null;

  const profile = payload.profile;
  record(hasApiProfileShape(profile), `${role} /api/me profile fields`);
  if (!hasApiProfileShape(profile)) return null;

  if (role === "free") {
    record(profile.isVip === false, "free isVip=false");
    record(profile.isStreamerPlan === false, "free isStreamerPlan=false");
    record(profile.hasCreatorTools === false, "free hasCreatorTools=false");
    record(profile.hasDownloadAccess === false, "free hasDownloadAccess=false");
    record(profile.hasUnlimitedGeneration === false, "free hasUnlimitedGeneration=false");
  } else if (role === "vip") {
    record(profile.isVip === true, "vip isVip=true");
    record(profile.isStreamerPlan === false, "vip isStreamerPlan=false");
    record(profile.hasCreatorTools === false, "vip hasCreatorTools=false");
    record(profile.hasDownloadAccess === true, "vip hasDownloadAccess=true");
    record(profile.hasUnlimitedGeneration === true, "vip hasUnlimitedGeneration=true");
  } else if (role === "streamer") {
    record(profile.isStreamerPlan === true, "streamer isStreamerPlan=true");
    record(profile.hasCreatorTools === true, "streamer hasCreatorTools=true");
    record(profile.hasDownloadAccess === true, "streamer hasDownloadAccess=true");
    record(profile.hasUnlimitedGeneration === true, "streamer hasUnlimitedGeneration=true");
  }

  return profile;
}

async function checkGenerate(role, token, profile) {
  const { res, payload } = await requestJson("/api/generate", {
    method: "POST",
    headers: authHeaders(token),
    // Empty prompt avoids expensive generation while still traversing auth/entitlement/credit gates.
    body: JSON.stringify({ prompt: "" }),
  });

  if (!profile) {
    record(false, `${role} /api/generate skipped`, "missing /api/me profile");
    return;
  }

  if (profile.hasUnlimitedGeneration) {
    // Unlimited accounts should bypass credit gate and then fail on empty prompt (400).
    record(res.status === 400, `${role} /api/generate unlimited gate`, `status=${res.status}`);
    return;
  }

  const credits = profile.remainingCredits;
  const expected = credits < 10 ? 402 : 400;
  record(
    res.status === expected,
    `${role} /api/generate free gate`,
    `status=${res.status}, expected=${expected}, credits=${credits}, error=${payload?.error ?? "n/a"}`,
  );
}

async function checkStreamerApis(role, token, expectAllowed) {
  const settings = await requestJson("/api/streamer/settings", {
    method: "GET",
    headers: authHeaders(token),
  });
  record(
    settings.res.status === (expectAllowed ? 200 : 403),
    `${role} GET /api/streamer/settings`,
    `status=${settings.res.status}`,
  );

  const backgrounds = await requestJson("/api/streamer/backgrounds", {
    method: "GET",
    headers: authHeaders(token),
  });
  record(
    backgrounds.res.status === (expectAllowed ? 200 : 403),
    `${role} GET /api/streamer/backgrounds`,
    `status=${backgrounds.res.status}`,
  );
}

async function runRole(role, token) {
  if (!token) {
    record(false, `${role} token present`, `missing env token for ${role}`);
    return;
  }

  const profile = await checkMe(role, token);
  await checkGenerate(role, token, profile);
  await checkStreamerApis(role, token, role === "streamer");
}

async function main() {
  console.log(`Running membership smoke against ${BASE_URL}`);
  await runRole("free", TOKENS.free);
  await runRole("vip", TOKENS.vip);
  await runRole("streamer", TOKENS.streamer);

  console.log("\n---- Smoke Summary ----");
  const passed = CHECKS.filter((c) => c.ok).length;
  const failed = CHECKS.length - passed;
  console.log(`Total: ${CHECKS.length}, Passed: ${passed}, Failed: ${failed}`);

  if (FAILURES.length > 0) {
    process.exitCode = 1;
  }
}

await main();
