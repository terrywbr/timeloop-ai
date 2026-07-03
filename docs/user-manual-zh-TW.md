# Time Loop AI 完整使用說明書（直播主向 · 繁體中文）

> **版本：** 2026-07-03 · Streamer Pass / Live Network / 一鍵開播  
> **簡易版：** [quickstart-streamer-zh-TW.md](quickstart-streamer-zh-TW.md)  
> **官方網址：** [https://app.timeloopai.net](https://app.timeloopai.net) · 中國入口：[https://cn.timeloopai.net](https://cn.timeloopai.net)

---

## 目錄

1. [產品概述](#第-1-章--產品概述)
2. [方案與權限](#第-2-章--方案與權限)
3. [登入與駕駛艙入門](#第-3-章--登入與駕駛艙入門)
4. [音樂與電台（直播主必知）](#第-4-章--音樂與電台直播主必知)
5. [輪播場景與生圖](#第-5-章--輪播場景與生圖)
6. [Stream 模式與 URL 參數](#第-6-章--stream-模式與-url-參數)
7. [一鍵開播](#第-7-章--一鍵開播)
8. [OBS 設定與驗收](#第-8-章--obs-設定與驗收)
9. [Live Network 聯播看板](#第-9-章--live-network-聯播看板)
10. [Overlay 與徽章](#第-10-章--overlay-與徽章)
11. [AI DJ（含直播窗）](#第-11-章--ai-dj含直播窗)
12. [音訊防斷流（24h 直播）](#第-12-章--音訊防斷流24h-直播)
13. [背景輪播與 Scene Pack](#第-13-章--背景輪播與-scene-pack)
14. [大陸站開通與金流](#第-14-章--大陸站開通與金流)
15. [管理員操作手冊](#第-15-章--管理員操作手冊)
16. [故障排除 FAQ](#第-16-章--故障排除-faq)
17. [附錄](#第-17-章--附錄)

---

## 第 1 章 — 產品概述

### Time Loop AI 是什麼？

Time Loop AI 是一款 **3D 沉浸式專注艙 Web App**，直播主核心價值：

- **OBS Browser Source 純淨投屏** — `?stream=1` 無控制面板，適合 24h 無人直播
- **24h 合法 BGM** — SomaFM 等全球電台 + 大陸串流代理
- **AI DJ** — 依 Mood 切換人設，直播窗同步字幕/語音
- **Live Network** — 左上角聯播看板，真實主播上線後依序替換虛擬房間
- **Streamer Pass 創作者工具** — 輪播場景、Overlay、Scene Pack API

### 適用場景

| 場景 | 說明 |
|------|------|
| 24h 無人直播 | OBS 貼 `?stream=1`，音訊 5 秒 stall 偵測 + 無限重連 |
| 公開觀看 / 分享 | 所有人（含未登入）**不限時** 觀看直播窗 |
| 引流 Overlay | 左下兩行 CTA + 右上徽章 |
| 大陸創作者 | cn 站 + 微信手動開通 Streamer Pass |

### 支援語言（10 種）

English · 简体中文 · **繁體中文** · 日本語 · 한국어 · Español · Français · Deutsch · ไทย · Tiếng Việt

---

## 第 2 章 — 方案與權限

### 方案對照

| 方案 | 主要權益 | 取得方式 |
|------|----------|----------|
| **Free** | 每月 **50 點**；標準 AI 生圖 **10 點/次** | 註冊預設 |
| **VIP** | 無限生圖、下載背景 JPG | Lemon Squeezy 月訂（全球站） |
| **Streamer Pass** | VIP 全部 + **創作者工具**（輪播、一鍵開播、Live Network 主播位、Overlay/Scene Pack API） | Lemon Streamer variant 或管理員開通 |
| **Founding Creator** | 管理員授予；直播窗 **金色 Founding Creator 徽章**（可與 Streamer 並存） | `grant-plan` + `foundingCreator: true` |

### 權限矩陣（直播相關）

| 功能 | Free | VIP | Streamer | Founding Creator |
|------|:----:|:---:|:--------:|:----------------:|
| 駕駛艙 + 電台 | ✓ | ✓ | ✓ | ✓ |
| `?stream=1` **觀看**（不限時） | ✓ | ✓ | ✓ | ✓ |
| 一鍵開播 / 輪播勾選 | ✗ | ✗ | ✓ | ✓ |
| Live Network **主播心跳** | ✗ | ✗ | ✓ | ✓ |
| Overlay / 背景 API | 預設範本 | 預設範本 | ✓ | ✓ |
| 直播窗徽章 | ✗ | ✗ | Streamer Pass | **金徽章** |

> **觀看不限時：** Streamer Pass 解鎖的是 **創作者工具**，不是「解除試看」。

---

## 第 3 章 — 登入與駕駛艙入門

### 3.1 Google 登入

1. 左側控制面板 → **Google Sign-In**
2. OAuth 完成 → 回到 `/auth/callback` → 自動進首頁
3. 底部 **Membership** 顯示方案與點數

### 3.2 首次音樂 Mood 引導

1. 全螢幕格線選 **≥1 種** Mood → **Next**
2. 進入專注艙；播放對應預設電台
3. 手機請 **橫向**；直向會顯示旋轉提示（**Stream 模式 `?stream=1` 跳過直向門控**）

### 3.3 介面區域

| 區域 | 桌面 | 手機橫向 |
|------|------|----------|
| 控制面板 | 左側 280px，滑鼠移入左 1/3 展開 | 左上 Menu → 左抽屜 |
| 社群畫廊 | 右側 50vw，滑鼠移入右 1/3 展開 | 右上 Gallery → 右抽屜 |
| 3D 背景 | 全螢幕 | 同左 |

> [截圖：桌面版 — 左控制面板 + 右畫廊 + 中央 3D 背景]

---

## 第 4 章 — 音樂與電台（直播主必知）

**UI 位置：** 控制面板 → **Ambient Music**

### 4.1 六種 Mood（簡表）

| Mood | 繁中概念 | 預設電台方向 |
|------|----------|--------------|
| neon-tokyo | 霓虹東京 | Synphaera Radio |
| deep-night | 深夜宇宙 | Groove Salad |
| deep-space | 深空低鳴 | Drone Zone |
| galactic-tavern | 銀河酒場 | Secret Agent |
| galactic-classical | 銀河古典 | Lush |
| retro-earth | 復古地球 | PopTron |

### 4.2 直播主必做：選定電台

| 操作 | 說明 |
|------|------|
| **◀ ▶ 換台** | 選定要播的 BGM；會寫入瀏覽器 localStorage |
| **一鍵開播前** | 系統會再保存一次；URL 帶 `&radio=<電台UUID>` |
| **直播窗** | 讀取 localStorage + URL，與駕駛艙同步 |

若直播窗電台不對：**先在駕駛艙換台 → 再開一鍵開播**，或手動在 OBS URL 加 `radio` 參數。

### 4.3 大陸串流

CN 區域或 `cn.timeloopai.net` 時，電台優先走 **串流代理**（`/api/stream`），降低斷流。

---

## 第 5 章 — 輪播場景與生圖

### 5.1 勾選輪播場景（Streamer 必做）

1. 右側畫廊 → **My**（我的場景）
2. 對已生成的世界 **勾選輪播**（最多 20 張）
3. 左側 **一鍵開播** 區顯示「輪播圖：N 張」

也可使用官方內建場景；需至少 **1 張** 才會顯示「就緒」。

### 5.2 AI 生圖（簡述）

- 提示詞 + Visual Effect → **Generate**（需登入）
- Free：**50 點/月**，標準 **10 點/次**；VIP/Streamer **無限**
- 生成後可 **發布** 至社群（公開後他人可進入）

> Overlay 視覺編輯器、背景批量上傳的 **專用 UI 為 Phase 2**；目前以畫廊輪播勾選 + API 為主。

---

## 第 6 章 — Stream 模式與 URL 參數

### 6.1 啟用方式

在網址加 **`?stream=1`** 即進入直播/OBS 模式。

**推薦正式推流 URL：**

```
https://app.timeloopai.net/?stream=1
https://cn.timeloopai.net/?stream=1
```

### 6.2 Query 參數表

| 參數 | 範例 | 效果 |
|------|------|------|
| `stream` | `?stream=1` | 啟用 Stream 布局（無控制面板） |
| `radio` | `&radio=<station-uuid>` | 鎖定指定電台 |
| `host` | `&host=<user-uuid>` | 觀眾進指定主播房（viewer 心跳） |
| `hidenetwork` | `&hidenetwork=1` | 隱藏 Live Network |
| `world` | `?world=<uuid>` | Deep link 載入公開世界（非 stream 時） |

### 6.3 Stream 布局內容

| 顯示 | 隱藏 |
|------|------|
| 3D 背景 + 輪播 cross-fade | 左/右控制面板 |
| 電台 + 環境音 | 音樂 Onboarding |
| Live Network、Overlay、徽章 | Now Playing |
| AI DJ 字幕（語音開啟時） | 區域提示 |
| 底部「輕觸進入全螢幕」提示（預覽用） | — |

---

## 第 7 章 — 一鍵開播

**UI 位置：** 左側控制面板 → **一鍵開播（One-click live）**

### 7.1 就緒條件

| 項目 | 要求 |
|------|------|
| 輪播場景 | ≥1 張（My 畫廊勾選） |
| 音樂 | 完成 Mood 引導 + 有有效電台 |
| 方案 | **Streamer Pass**（`hasCreatorTools`） |

### 7.2 操作

1. 確認狀態列皆為就緒
2. 點 **Launch OBS stream**
   - **桌面：** 彈出 1920×1080 預覽窗（仍有瀏覽器標題列）
   - **手機：** 同頁跳轉至 `?stream=1`
3. 或點 **複製直播連結** → 貼到 OBS Browser Source

複製的 URL 會含目前電台的 **`radio`** 參數。

### 7.3 OBS 正式推流 vs 預覽窗

| 方式 | 滿屏 | 建議 |
|------|------|------|
| OBS **Browser Source** 貼 URL | ✓ 無瀏覽器列 | **正式推流** |
| 一鍵開播彈窗 | ✗ 有 X 標題列 | 僅預覽；可點底部進全螢幕 |

---

## 第 8 章 — OBS 設定與驗收

### 8.1 Browser Source 建議值

| 項目 | 值 |
|------|-----|
| URL | `https://app.timeloopai.net/?stream=1&radio=...` |
| 寬 × 高 | **1920 × 1080** |
| FPS | 30（預設即可） |
| 硬體加速 | 建議開啟 |
| 自訂 CSS | 通常不需要 |

> [截圖：OBS Browser Source 設定 + 直播畫面預覽]

### 8.2 驗收清單

- [ ] 背景滿屏、無瀏覽器 UI
- [ ] BGM 與駕駛艗選定電台一致
- [ ] 左上 Live Network 顯示 6 格（或真實+虛擬混合）
- [ ] 右上 Streamer / Founding Creator 徽章
- [ ] 左下 Overlay 兩行文案
- [ ] 斷網 5–10 秒後音訊自動恢復（見第 12 章）

---

## 第 9 章 — Live Network 聯播看板

### 9.1 是什麼？

左上角 **🔥 LIVE NETWORK** 面板，固定 **6 個槽位**：

- **無真實主播上線：** 顯示 6 個虛擬房間（LunaFocus、VelvetLoFi…），觀看人數會輕微波動
- **有主播 heartbeat：** 依 **觀看人數排序** 排在前面，其餘槽位仍用虛擬房補滿
- **≥6 位真實主播：** 只顯示觀看人數最高的 6 位

### 9.2 主播如何出現在榜上？

1. 帳號為 **Streamer Pass**
2. 在 **`?stream=1`** 直播窗保持開啟（每 30 秒 **streamer heartbeat**）
3. 房名 / 副標題來自 Overlay 設定（line1 / line2）

### 9.3 觀眾點擊

真實主播列可點擊 → 跳轉 `?stream=1&host=<主播UUID>`。

### 9.4 隱藏看板

URL 加 **`&hidenetwork=1`**。

---

## 第 10 章 — Overlay 與徽章

### 10.1 Overlay 兩行文案

- **預設：** 依 UI 語言套用範本（例：🌙 Late-night focus room / ✨ Follow for daily calm streams）
- **自訂：** `GET/PUT /api/streamer/settings`（**視覺編輯器 UI：Phase 2**）
- **位置：** 預設左下；可設 tl/tr/bl/br

### 10.2 徽章

| 類型 | 顯示條件 | 位置 |
|------|----------|------|
| **Founding Creator** | `is_founding_creator=true` | 右上金徽章 |
| **Streamer Pass** | 付費 Streamer（非 Founding 時） | 右上 |

徽章與 Live Network **僅在 `?stream=1` 直播窗** 顯示，不在駕駛艙控制面板。

---

## 第 11 章 — AI DJ（含直播窗）

### 11.1 開關

控制面板 → **DJ 語音** / **定時陪伴**

| 開關 | 效果 |
|------|------|
| DJ 語音開 | 字幕 + TTS 語音 |
| DJ 語音關 | 僅字幕 |
| 定時陪伴 | 週期性旁白 |

### 11.2 直播窗

`?stream=1` 同樣顯示 **底部 AI DJ 字幕卡** 並播放語音（需在駕駛艙已開啟 DJ 語音；首次需 **點擊解鎖音訊**）。

### 11.3 定時陪伴 — 已知差異

| 項目 | 說明 |
|------|------|
| UI 文案 | 可能顯示「30 分鐘陪伴」 |
| 實際程式 | 約 **每 1 分鐘** 檢查是否播報（非嚴格 30 分鐘） |

---

## 第 12 章 — 音訊防斷流（24h 直播）

Stream 模式（`?stream=1`）啟用 **streamMode** 強化：

| 項目 | 一般駕駛艙 | 直播模式 |
|------|------------|----------|
| Stall 偵測 | 20 秒 | **5 秒** |
| Soft reconnect | 最多 3 次 | **無上限**（退避上限 30 秒） |
| 失敗策略 | 換 proxy tier / 換台 | **直播窗不自動換電台**（僅 tier 升級） |

**驗收：** 人為斷網 5–10 秒，音訊應恢復，OBS **無需**重載 Browser Source。

---

## 第 13 章 — 背景輪播與 Scene Pack

### 13.1 輪播（目前主要操作方式）

| 項目 | 說明 |
|------|------|
| 來源 | 畫廊 My 勾選的世界（或 Streamer 上傳背景 API） |
| 上限 | 20 張（輪播 world id） |
| 間隔 | 5 或 10 分鐘（API 可設；UI 編輯 Phase 2） |
| 效果 | cross-fade，粒子 preset 不變 |

### 13.2 Scene Pack（API）

- 建立主題包 → AI 批量生圖 → **activate** 後 24h 自動輪播
- API 完整；**獨立管理 UI：Phase 2**

---

## 第 14 章 — 大陸站開通與金流

### 14.1 全球站（Lemon Squeezy）

1. 登入 → **Upgrade to Streamer Pass**（需配置 `LEMON_SQUEEZY_STREAMER_VARIANT_ID`）
2. 付款完成 → 回到 `/?checkout=success`
3. 刷新後 Streamer 工具解鎖

### 14.2 大陸站（微信手動）

1. 開 [cn.timeloopai.net](https://cn.timeloopai.net) 或選 CN 入口
2. 控制面板 → **大陸創作者 — 手動開通**
3. **Copy UID** → 微信聯繫客服，備註「Streamer Pass」
4. 管理員 `grant-plan`（見第 15 章）

---

## 第 15 章 — 管理員操作手冊

> 詳見 [founding-creator-ops.md](founding-creator-ops.md)

### 15.1 手動開通 Streamer

```bash
curl -X POST https://app.timeloopai.net/api/admin/grant-plan \
  -H "Content-Type: application/json" \
  -H "x-admin-secret: YOUR_ADMIN_SECRET" \
  -d '{"userId":"<UUID>","plan":"streamer","vipUntil":"2027-01-01T00:00:00Z","note":"wechat_manual"}'
```

### 15.2 Founding Creator

```json
{
  "userId": "<UUID>",
  "plan": "streamer",
  "foundingCreator": true,
  "vipUntil": "2027-01-01T00:00:00Z"
}
```

### 15.3 健康檢查

```bash
curl https://app.timeloopai.net/api/health
```

---

## 第 16 章 — 故障排除 FAQ

| 問題 | 處理 |
|------|------|
| Live Network 空白 | 硬刷新；API 失敗時前端會顯示 seed；查 `/api/live-network` |
| 上方有 X 列 | 用 OBS Browser Source，勿依賴彈窗滿屏 |
| 電台不同步 | 駕駛艙先換台 → 一鍵開播；確認 URL 有 `radio=` |
| 沒聲音 | 點畫面解鎖；OBS 來源音量 100% |
| 看不到徽章 | 必須在 `?stream=1`；確認 Streamer / Founding 狀態 |
| 一鍵開播灰色 | 缺輪播圖或音樂未就緒；或非 Streamer Pass |
| CN 無 Lemon 按鈕 | 設計如此 → 微信 + UID |
| admin grant 401 | 檢查 `x-admin-secret` |

---

## 第 17 章 — 附錄

### 17.1 主要 API

| 端點 | 用途 |
|------|------|
| `GET /api/live-network` | Live Network 看板 |
| `POST /api/live-network/streamer-heartbeat` | 主播心跳 |
| `GET/PUT /api/streamer/settings` | Overlay |
| `GET/POST/DELETE /api/streamer/backgrounds` | 背景圖庫 |
| `POST /api/admin/grant-plan` | 人工開通 |
| `POST /api/dj/greet` · `POST /api/dj/speak` | AI DJ |

### 17.2 待完善（Phase 2）

| 功能 | 現況 |
|------|------|
| Overlay 視覺編輯器 | API + 語系範本 |
| Scene Pack 管理 UI | API 完整 |
| Co-focus Join | 後端 + AI DJ 已備；**主界面 Join 按鈕尚未全面接入** |
| DJ 定時 30 分鐘 | UI 文案與程式 interval 不一致 |

### 17.3 修訂紀錄

| 日期 | 說明 |
|------|------|
| 2026-07-03 | 直播主向重寫：Live Network、一鍵開播、radio 同步、AI DJ 直播窗、全螢幕提示 |
| 2026-06-08 | 初版；移除 Affiliate；`?stream=1` 不限時 |

---

## 相關文件

- [直播主快速上手（簡易版）](quickstart-streamer-zh-TW.md)
- [GitHub 部署指南](github-deploy.md)
- [Founding Creator 營運](founding-creator-ops.md)

---

*如有問題請查 `/api/health` 或聯繫 Time Loop AI 營運團隊。*
