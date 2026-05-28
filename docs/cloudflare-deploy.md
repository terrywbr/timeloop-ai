# Cloudflare 部署指南 — timeloopai.net

本專案使用 **OpenNext + Cloudflare Workers** 部署整個 Next.js 應用（含 `/api/*`）。

## 前置條件

1. 網域 **timeloopai.net** 已在 Cloudflare（你已完成）
2. 升級 **Workers Paid**（至少 $5/月）— Free 方案 CPU 僅 10ms，無法跑 AI 生成
3. 程式碼已推到 **GitHub**（若要用 Cloudflare 自動部署）

---

## 一、本機安裝依賴

```powershell
cd d:\Workspace\AI\timeloop-ai
npm install @opennextjs/cloudflare@latest
npm install --save-dev wrangler@latest
```

## 二、登入 Cloudflare CLI

```powershell
npx wrangler login
```

瀏覽器授權後即可部署到你帳號下的 `timeloopai.net`。

## 三、設定環境變數

### A. 建置時需要（NEXT_PUBLIC_*，會打包進前端）

在專案根目錄建立 **`.env.production.local`**（或部署前在 PowerShell 設定）：

```env
NEXT_PUBLIC_SUPABASE_URL=https://你的專案.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的_anon_key
NEXT_PUBLIC_SITE_URL=https://app.timeloopai.net
NEXT_PUBLIC_APP_SITE_URL=https://app.timeloopai.net
NEXT_PUBLIC_CN_SITE_URL=https://cn.timeloopai.net
```

### B. 執行時機密（用 wrangler secret，不要寫進 git）

在 PowerShell 逐一執行（每次貼上值後 Enter）：

```powershell
npx wrangler secret put TOGETHER_API_KEY
npx wrangler secret put REPLICATE_API_TOKEN
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
npx wrangler secret put LEMON_SQUEEZY_API_KEY
npx wrangler secret put LEMON_SQUEEZY_STORE_ID
npx wrangler secret put LEMON_SQUEEZY_VIP_VARIANT_ID
npx wrangler secret put LEMON_SQUEEZY_CREDIT_PACK_VARIANT_ID
npx wrangler secret put LEMON_SQUEEZY_WEBHOOK_SECRET
```

可選：

```powershell
npx wrangler secret put LEMON_SQUEEZY_CREDIT_PACK_CREDITS
```

## 四、DNS 子網域（Cloudflare Dashboard）

到 **timeloopai.net → DNS → Records**，新增（Proxied 橘雲）：

| 類型 | 名稱 | 內容 | 說明 |
|------|------|------|------|
| 部署後自動 | `app` | （Workers 自訂網域會建立） | 國際站 |
| 部署後自動 | `cn` | 同上 | 中國入口 |
| CNAME | `www` | `timeloopai.net` | 可選 |

首次 `npm run deploy:cf` 後，到 **Workers & Pages → timeloop-ai → Settings → Domains & Routes** 確認四個網域已綁定。

## 五、部署指令

```powershell
cd d:\Workspace\AI\timeloop-ai
npm run deploy:cf
```

成功後會得到 `timeloop-ai.<你的帳號>.workers.dev`，以及自訂網域：

- https://app.timeloopai.net
- https://cn.timeloopai.net
- https://timeloopai.net

## 六、部署後必改設定

### Supabase

**Authentication → URL Configuration**

- Site URL: `https://app.timeloopai.net`
- Redirect URLs 加上：
  - `https://app.timeloopai.net/**`
  - `https://cn.timeloopai.net/**`
  - `https://timeloopai.net/**`

### Lemon Squeezy Webhook

```
https://app.timeloopai.net/api/webhooks/lemonsqueezy
```

## 七、Cloudflare 快取規則（橘雲 CDN）

**Rules → Cache Rules**

**快取：**

- `/_next/static/*`
- `/gallery/*`、`/assets/*`、`/textures/*`、`/images/*`

**略過快取：**

- `/api/*`
- `/auth/*`

## 八、用 GitHub 自動部署（推薦）

完整步驟見 **[github-deploy.md](./github-deploy.md)**。

1. 推送程式碼到 GitHub `main` 分支
2. GitHub **Settings → Secrets** 設定 `CLOUDFLARE_API_TOKEN`、`CLOUDFLARE_ACCOUNT_ID`、`NEXT_PUBLIC_*`
3. Cloudflare Worker **Variables and Secrets** 設定 API 金鑰（只需一次）
4. 每次 `git push origin main` 自動部署

Workflow：`.github/workflows/deploy-cloudflare.yml`

## 九、常見問題

| 問題 | 處理 |
|------|------|
| AI 生成超時 | 確認 Workers Paid + `wrangler.jsonc` 中 `cpu_ms: 300000` |
| 登入後跳轉失敗 | 檢查 Supabase Redirect URLs |
| 生圖藍屏 | 確認 Supabase Storage 與 signed URL（已修復 proxy 問題） |
| 本機 build 很慢 | 4GB RAM 筆電建議在 Cloudflare CI 建置，本機只跑 `npm run dev` |

## 十、本機預覽 Workers 環境（可選）

```powershell
npm run preview:cf
```

需先設定 `.dev.vars`（可複製 `.dev.vars.example`）並用 `wrangler secret` 同步機密。
