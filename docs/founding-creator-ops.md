# Founding Creator Program — 營運 SOP（P0）

面向首批國際創作者邀約的 **人工開通 + OBS 徽章 + 續約折扣** 流程。不含 Affiliate 分潤（P2 不執行）。

## 1. 資料庫

在 Supabase SQL Editor 執行：

[`supabase/migrations/20260622_founding_creator.sql`](../supabase/migrations/20260622_founding_creator.sql)

新增欄位：

| 欄位 | 說明 |
|------|------|
| `users.is_founding_creator` | boolean，預設 `false` |
| `users.founding_enrolled_at` | timestamptz，入選時間 |

## 2. 核准創始創作者（3 個月 Streamer Pass）

**方式一 — SQL Editor（手動）：** [`supabase/scripts/manual_upgrade_streamer.sql`](../supabase/scripts/manual_upgrade_streamer.sql)

先執行 migration [`20260624_sql_editor_admin_grant.sql`](../supabase/migrations/20260624_sql_editor_admin_grant.sql)，然後：

```sql
SELECT * FROM public.admin_grant_streamer_by_email('user@example.com', true, 90);
```

若 `UPDATE ... WHERE email = ...` 顯示 **0 row**，代表 `public.users` 沒有該 email（請用腳本「步驟 1」從 `auth.users` 查 UUID）。

**方式二 — API：** `POST https://app.timeloopai.net/api/admin/grant-plan`

**Headers：**

```
Content-Type: application/json
x-admin-secret: <ADMIN_API_SECRET>
```

**Body（Founding Creator 一鍵核准）：**

```json
{
  "userId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "plan": "streamer",
  "foundingCreator": true,
  "note": "founding_creator_program"
}
```

行為：

- `plan` → `streamer`（Streamer Pass 全功能）
- `vip_until` → **自動** 當前時間 + **90 天**（未傳 `vipUntil` 時）
- `is_founding_creator` → `true`
- `founding_enrolled_at` → 核准當下時間

若要自訂到期日，可同時傳 `vipUntil`（會覆寫自動 90 天）：

```json
{
  "userId": "...",
  "plan": "streamer",
  "foundingCreator": true,
  "vipUntil": "2026-12-31T00:00:00Z",
  "note": "founding_creator_extended"
}
```

## 3. OBS 畫面「Founding Creator」徽章

創始創作者登入後使用 `?stream=1` 或一鍵開播時，**右上角**會顯示金色「Founding Creator」角標（無需額外設定 Overlay 文字）。

驗證：核准後重新整理 → 開啟 `https://app.timeloopai.net/?stream=1` → 確認右上角徽章。

## 4. Lemon Squeezy — 終身 50% OFF（人工發碼，不改 Checkout 程式）

**不在 App 內自動套用折扣。** 續約時由營運在 Lemon 後台維護一組（或多組）**永久 50% OFF、不過期** 的 Discount Code，人工私訊發給創始創作者。

建議 Lemon 後台設定：

| 項目 | 建議值 |
|------|--------|
| 折扣 | 50% |
| 適用 | Streamer Pass variant（及可選 VIP variant） |
| 有效期 | 永不過期 |
| 使用次數 | 每碼可設「無限次」或「每用戶 1 次」依策略 |
| 命名 | `FOUNDING50-<handle>` 便於對帳 |

**環境變數（僅備忘，非程式讀取）：**

可在 `.env.local` 自行記錄營運用碼清單（勿 commit 真實碼到 git）：

```env
# Founding Creator manual renewal codes (ops reference only — not read by the app)
# LEMON_FOUNDING_DISCOUNT_CODE_EXAMPLE=FOUNDING50-demo
```

實際折扣碼請記在內部試算表或密碼管理器，並在創始人 3 個月將屆前主動聯繫發碼。

## 5. 本地驗證 grant-plan

```powershell
node scripts/founding-grant-smoke.mjs
```

需設定 `ADMIN_API_SECRET`、測試用 `FOUNDING_TEST_USER_ID`（可選 `BASE_URL`）。

## 權限矩陣（VIP ≠ Streamer）

| 權限 | Free | VIP (`plan=vip`) | Streamer (`plan=streamer`) |
|------|------|------------------|----------------------------|
| 每月 50 點 / 生圖扣點 | ✅ | ❌ 無限生圖 | ❌ 無限生圖 |
| 下載背景 JPG | ❌ | ✅ | ✅ |
| 創作者工具（Overlay、圖庫輪播、Scene Packs、一鍵直播） | ❌ | ❌ | ✅ |
| `?stream=1` 觀看 | ✅ | ✅ | ✅ |

**重要：** `hasCreatorTools` / `isStreamerPlan` 僅在 `users.plan = 'streamer'` 且訂閱/手動開通有效時為 true。  
`plan=vip` **不會**再因 `lemon_squeezy_variant_id` 誤判為 Streamer（修復前舊邏輯會如此）。

若 `plan` 仍顯示 vip 但應為 Streamer → 跑 §7 的 SQL repair，勿依賴 variant 繞過。

## 7. 疑難排解：`plan` 顯示 vip 而非 streamer

**原因：** 舊版資料庫 `users_plan_check` 只允許 `free|vip`。開通 Streamer 時 API 曾 **相容降級** 寫入 `plan=vip`。  
（舊版程式還會用 variant id 誤給 Streamer 權限；已改為 **僅 `plan=streamer` 才有創作者工具**。）

**修復（Supabase SQL Editor 一次執行）：**

[`supabase/migrations/20260623_repair_streamer_plan.sql`](../supabase/migrations/20260623_repair_streamer_plan.sql)

或執行 migration 後呼叫：

```bash
curl -X POST https://app.timeloopai.net/api/admin/repair-streamer-plans \
  -H "Content-Type: application/json" \
  -H "x-admin-secret: <ADMIN_API_SECRET>"
```

回傳 `repairedCount` > 0 表示已把應為 Streamer 的帳號改為 `plan=streamer`。

## 6. 與 DM 文案對齊（瘦身版福利）

| 文案承諾 | P0 狀態 |
|----------|---------|
| 3 個月 Premium / Streamer Pass | ✅ `grant-plan` + 90 天 |
| Founding Creator 身份徽章（OBS） | ✅ `StreamOverlay` |
| 終身 50% 續約 | ✅ 人工 Lemon 折扣碼（本文件 §4） |
| 官網 / Discord 曝光 | ⏳ P1 |
| 30% 分潤 | ❌ 不執行（P2） |
