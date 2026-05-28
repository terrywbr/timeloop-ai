# GitHub 自動部署到 Cloudflare — timeloopai.net

每次 push 到 `main` 分支，GitHub Actions 會自動建置並部署到 Cloudflare Workers。

## 第一步：建立 GitHub 倉庫並推送程式碼

專案目前尚未初始化 git。在本機 PowerShell 執行：

```powershell
cd d:\Workspace\AI\timeloop-ai
git init
git add .
git commit -m "Initial commit: Time Loop AI with Cloudflare deploy"
```

到 [GitHub New Repository](https://github.com/new) 建立倉庫（例如 `timeloop-ai`），然後：

```powershell
git branch -M main
git remote add origin https://github.com/你的帳號/timeloop-ai.git
git push -u origin main
```

## 第二步：建立 Cloudflare API Token

1. 打開 [Cloudflare API Tokens](https://dash.cloudflare.com/profile/api-tokens)
2. **Create Token** → 使用模板 **Edit Cloudflare Workers**
3. 權限需包含：
   - Account → Workers Scripts → Edit
   - Account → Workers Routes → Edit（綁定自訂網域）
   - Zone → Workers Routes → Edit（若提示）
4. 複製產生的 Token（只顯示一次）

## 第三步：取得 Cloudflare Account ID

1. 打開 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 右側欄或網址列可看到 **Account ID**（32 位字串）

## 第四步：在 GitHub 設定 Secrets

Repo → **Settings → Secrets and variables → Actions → New repository secret**

| Secret 名稱 | 值 |
|-------------|-----|
| `CLOUDFLARE_API_TOKEN` | 第二步的 Token |
| `CLOUDFLARE_ACCOUNT_ID` | 第三步的 Account ID |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://okgalhwwrcvhxvwedbac.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `NEXT_PUBLIC_SITE_URL` | `https://app.timeloopai.net` |
| `NEXT_PUBLIC_APP_SITE_URL` | `https://app.timeloopai.net` |
| `NEXT_PUBLIC_CN_SITE_URL` | `https://cn.timeloopai.net` |

## 第五步：在 Cloudflare 設定 Worker 執行時機密（只需一次）

GitHub Actions 只負責建置與部署；**API 金鑰**需在 Cloudflare Worker 上設定（不會從 GitHub 覆寫）。

**Workers & Pages → timeloop-ai → Settings → Variables and Secrets → Add**

類型選 **Secret**，逐一新增：

| 名稱 | 用途 |
|------|------|
| `TOGETHER_API_KEY` | AI 生圖 |
| `REPLICATE_API_TOKEN` | 深度圖 |
| `SUPABASE_SERVICE_ROLE_KEY` | 後端寫入 Supabase |
| `LEMON_SQUEEZY_API_KEY` | 結帳（可稍後加） |
| `LEMON_SQUEEZY_STORE_ID` | 結帳 |
| `LEMON_SQUEEZY_VIP_VARIANT_ID` | VIP 訂閱 |
| `LEMON_SQUEEZY_CREDIT_PACK_VARIANT_ID` | 點數包 |
| `LEMON_SQUEEZY_WEBHOOK_SECRET` | Webhook 驗簽 |

若 Worker 尚未存在，可先在本機執行一次 `npm run deploy:cf` 建立，或在第一次 GitHub Actions 成功後再來加 Secrets。

也可用 CLI（本機已 `wrangler login` 時）：

```powershell
npx wrangler secret put TOGETHER_API_KEY
# ... 其餘同上
```

## 第六步：確認 Workers Paid（AI 生成必備）

**Workers & Pages → Plans** → 升級 **Workers Paid**（約 $5/月）。

- **Free 方案**：可部署網站，但 **AI 生成幾乎無法運作**（CPU 僅 10ms），且 `wrangler.jsonc` 不能設定 `cpu_ms`
- **Paid 方案**：解鎖 AI 生成後，在 `wrangler.jsonc` 取消註解：
  ```jsonc
  "limits": { "cpu_ms": 300000 }
  ```
  再 push 一次部署

## 第七步：觸發部署

```powershell
git add .
git commit -m "你的更新說明"
git push origin main
```

到 GitHub **Actions** 分頁查看 `Deploy to Cloudflare Workers`  workflow。

成功後網站：

- https://app.timeloopai.net
- https://cn.timeloopai.net
- https://timeloopai.net

## 部署後設定

### Supabase Auth

**Authentication → URL Configuration**

- Site URL: `https://app.timeloopai.net`
- Redirect URLs: `https://app.timeloopai.net/**`、`https://cn.timeloopai.net/**`

### Lemon Squeezy Webhook

```
https://app.timeloopai.net/api/webhooks/lemonsqueezy
```

## 手動重新部署

GitHub → **Actions → Deploy to Cloudflare Workers → Run workflow**

## 常見錯誤

| 錯誤 | 解法 |
|------|------|
| `Authentication error` | 檢查 `CLOUDFLARE_API_TOKEN` 權限 |
| `Could not find account` | 檢查 `CLOUDFLARE_ACCOUNT_ID` |
| 建置成功但 API 401 | Worker Secrets 未設定 `SUPABASE_SERVICE_ROLE_KEY` |
| AI 生成失敗 | 確認 Workers Paid + `TOGETHER_API_KEY` / `REPLICATE_API_TOKEN` |
| 自訂網域未生效 | DNS 橘雲 + Workers Domains 確認四個網域 |

## Workflow 檔案位置

`.github/workflows/deploy-cloudflare.yml`
