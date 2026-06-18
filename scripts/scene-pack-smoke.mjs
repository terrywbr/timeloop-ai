#!/usr/bin/env node

/**
 * Streamer scene-pack smoke checks.
 *
 * Usage:
 *   SMOKE_BASE_URL=http://localhost:3000 \
 *   SMOKE_FREE_TOKEN=... \
 *   SMOKE_VIP_TOKEN=... \
 *   SMOKE_STREAMER_TOKEN=... \
 *   node scripts/scene-pack-smoke.mjs
 *
 * Optional:
 *   SMOKE_SCENE_GENERATE=0        # skip real image generation step
 *   SMOKE_SCENE_GENERATE_COUNT=1  # default 1, max 3 in smoke
 */

const BASE_URL = (process.env.SMOKE_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const TOKENS = {
  free: process.env.SMOKE_FREE_TOKEN?.trim() ?? "",
  vip: process.env.SMOKE_VIP_TOKEN?.trim() ?? "",
  streamer: process.env.SMOKE_STREAMER_TOKEN?.trim() ?? "",
};

const SHOULD_GENERATE = process.env.SMOKE_SCENE_GENERATE !== "0";
const GENERATE_COUNT = Math.max(
  1,
  Math.min(3, Number.parseInt(process.env.SMOKE_SCENE_GENERATE_COUNT ?? "1", 10) || 1),
);

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

function asError(payload) {
  return typeof payload?.error === "string" ? payload.error : "n/a";
}

async function checkNonStreamerBlocked(role, token) {
  const listRes = await requestJson("/api/streamer/scene-packs", {
    method: "GET",
    headers: authHeaders(token),
  });
  record(
    listRes.res.status === 403,
    `${role} blocked: GET /api/streamer/scene-packs`,
    `status=${listRes.res.status}, error=${asError(listRes.payload)}`,
  );

  const createRes = await requestJson("/api/streamer/scene-packs", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ name: "smoke-pack", moodId: "deep-night" }),
  });
  record(
    createRes.res.status === 403,
    `${role} blocked: POST /api/streamer/scene-packs`,
    `status=${createRes.res.status}, error=${asError(createRes.payload)}`,
  );

  const playbackRes = await requestJson("/api/streamer/scene-playback", {
    method: "GET",
    headers: authHeaders(token),
  });
  record(
    playbackRes.res.status === 403,
    `${role} blocked: GET /api/streamer/scene-playback`,
    `status=${playbackRes.res.status}, error=${asError(playbackRes.payload)}`,
  );
}

async function runStreamerFlow(token) {
  let packId = null;
  let createdName = "";
  const suffix = Date.now().toString(36);

  try {
    const meRes = await requestJson("/api/me", {
      method: "GET",
      headers: authHeaders(token),
    });
    record(meRes.res.ok && meRes.payload?.success, "streamer /api/me reachable", `status=${meRes.res.status}`);
    const profile = meRes.payload?.profile;
    record(
      typeof profile?.streamerMonthlyQuotaImages === "number" &&
        typeof profile?.streamerUsedImages === "number" &&
        typeof profile?.streamerRemainingImages === "number",
      "streamer quota fields on /api/me",
    );

    const listBefore = await requestJson("/api/streamer/scene-packs", {
      method: "GET",
      headers: authHeaders(token),
    });
    record(listBefore.res.ok && listBefore.payload?.success, "streamer list scene packs", `status=${listBefore.res.status}`);

    createdName = `smoke-pack-${suffix}`;
    const createRes = await requestJson("/api/streamer/scene-packs", {
      method: "POST",
      headers: authHeaders(token),
      body: JSON.stringify({
        name: createdName,
        moodId: "deep-night",
        playOrder: "sequential",
        isLoop: true,
      }),
    });
    record(createRes.res.ok && createRes.payload?.success, "streamer create scene pack", `status=${createRes.res.status}`);
    packId = createRes.payload?.pack?.id ?? null;
    record(Boolean(packId), "scene pack id returned");
    if (!packId) return;

    const updateRes = await requestJson(`/api/streamer/scene-packs/${encodeURIComponent(packId)}`, {
      method: "PATCH",
      headers: authHeaders(token),
      body: JSON.stringify({
        playOrder: "random",
      }),
    });
    record(updateRes.res.ok && updateRes.payload?.success, "streamer patch scene pack", `status=${updateRes.res.status}`);

    if (SHOULD_GENERATE) {
      const generateRes = await requestJson(
        `/api/streamer/scene-packs/${encodeURIComponent(packId)}/generate`,
        {
          method: "POST",
          headers: authHeaders(token),
          body: JSON.stringify({
            prompt: "Cyberpunk twilight skyline, neon rain, relaxing ambience, cinematic wide shot.",
            count: GENERATE_COUNT,
            durationSec: 30,
          }),
        },
      );
      record(
        generateRes.res.ok && generateRes.payload?.success,
        "streamer generate scene pack items",
        `status=${generateRes.res.status}, error=${asError(generateRes.payload)}`,
      );

      const generatedItems = generateRes.payload?.generated;
      record(
        Array.isArray(generatedItems) && generatedItems.length >= 1,
        "scene pack generation returned items",
        `count=${Array.isArray(generatedItems) ? generatedItems.length : 0}`,
      );

      const usage = generateRes.payload?.usage;
      record(
        usage && typeof usage.remainingImages === "number",
        "scene pack generation returned usage",
      );

      if (Array.isArray(generatedItems) && generatedItems.length >= 1) {
        const first = generatedItems[0];
        const itemsRes = await requestJson(
          `/api/streamer/scene-packs/${encodeURIComponent(packId)}/items`,
          {
            method: "PATCH",
            headers: authHeaders(token),
            body: JSON.stringify({
              items: [{ id: first.id, durationSec: 45, sortOrder: 0 }],
            }),
          },
        );
        record(itemsRes.res.ok && itemsRes.payload?.success, "streamer patch scene pack items", `status=${itemsRes.res.status}`);
      } else {
        record(false, "streamer patch scene pack items skipped", "no generated items");
      }
    } else {
      console.log("[INFO] generation step skipped (SMOKE_SCENE_GENERATE=0)");
    }

    const activateRes = await requestJson(`/api/streamer/scene-packs/${encodeURIComponent(packId)}/activate`, {
      method: "POST",
      headers: authHeaders(token),
    });
    record(activateRes.res.ok && activateRes.payload?.success, "streamer activate scene pack", `status=${activateRes.res.status}`);

    const playbackRes = await requestJson("/api/streamer/scene-playback", {
      method: "GET",
      headers: authHeaders(token),
    });
    record(playbackRes.res.ok && playbackRes.payload?.success, "streamer get scene playback", `status=${playbackRes.res.status}`);
    const playbackPack = playbackRes.payload?.pack;
    record(
      playbackPack?.id === packId,
      "playback returns activated pack",
      `playbackPackId=${playbackPack?.id ?? "null"}, expected=${packId}`,
    );
  } finally {
    if (packId) {
      const deleteRes = await requestJson(`/api/streamer/scene-packs/${encodeURIComponent(packId)}`, {
        method: "DELETE",
        headers: authHeaders(token),
      });
      record(deleteRes.res.ok && deleteRes.payload?.success, "cleanup delete scene pack", `status=${deleteRes.res.status}`);
    } else if (createdName) {
      console.log(`[INFO] cleanup skipped: no pack id for ${createdName}`);
    }
  }
}

async function runRoleGuards() {
  for (const role of ["free", "vip"]) {
    const token = TOKENS[role];
    if (!token) {
      record(false, `${role} token present`, `missing env token for ${role}`);
      continue;
    }
    await checkNonStreamerBlocked(role, token);
  }
}

async function main() {
  console.log(`Running scene-pack smoke against ${BASE_URL}`);
  console.log(`Generation step: ${SHOULD_GENERATE ? `enabled (count=${GENERATE_COUNT})` : "disabled"}`);

  await runRoleGuards();

  if (!TOKENS.streamer) {
    record(false, "streamer token present", "missing env token for streamer");
  } else {
    await runStreamerFlow(TOKENS.streamer);
  }

  console.log("\n---- Scene Pack Smoke Summary ----");
  const passed = CHECKS.filter((c) => c.ok).length;
  const failed = CHECKS.length - passed;
  console.log(`Total: ${CHECKS.length}, Passed: ${passed}, Failed: ${failed}`);

  if (FAILURES.length > 0) {
    process.exitCode = 1;
  }
}

await main();
