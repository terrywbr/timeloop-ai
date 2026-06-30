-- =============================================================================
-- 手動開通 Streamer Pass（Supabase SQL Editor）
-- =============================================================================
-- 若 UPDATE 顯示「0 row」→ email 在 public.users 找不到，請先跑「步驟 1」診斷。
-- 若 UPDATE 有 1 row 但 plan 仍是 vip → 先跑 migration：
--   supabase/migrations/20260624_sql_editor_admin_grant.sql
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 步驟 1：診斷 — 比對 auth.users 與 public.users（email 不分大小寫）
-- 把 %terrywbrsun% 改成你要查的關鍵字
-- -----------------------------------------------------------------------------
SELECT
  au.id,
  au.email AS auth_email,
  au.created_at AS auth_created_at,
  pu.email AS public_email,
  pu.plan,
  pu.vip_status,
  pu.vip_until,
  pu.is_founding_creator,
  pu.lemon_squeezy_variant_id
FROM auth.users au
LEFT JOIN public.users pu ON pu.id = au.id
WHERE au.email ILIKE '%terrywbrsun%'
ORDER BY au.created_at;

-- 若 auth 有、public 沒有（public_email 為 NULL）→ 先補建 profile：
-- INSERT INTO public.users (id, email, display_name, avatar_url)
-- SELECT id, email,
--   coalesce(raw_user_meta_data->>'name', raw_user_meta_data->>'full_name'),
--   raw_user_meta_data->>'avatar_url'
-- FROM auth.users
-- WHERE email ILIKE '%terrywbrsun%'
-- ON CONFLICT (id) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 步驟 2：一鍵開通（推薦）— 需先執行 20260624_sql_editor_admin_grant.sql
-- -----------------------------------------------------------------------------
-- Founding Creator + 90 天：
-- SELECT * FROM public.admin_grant_streamer_by_email('terrywbrsun@gmail.com', true, 90);

-- 僅 Streamer Pass 90 天（無 Founding 徽章）：
-- SELECT * FROM public.admin_grant_streamer_by_email('terrywbrsun@gmail.com', false, 90);

-- 自訂一年：
-- SELECT * FROM public.admin_grant_streamer_by_email('terrywbrsun2@gmail.com', true, 365);

-- -----------------------------------------------------------------------------
-- 步驟 3：手動 UPDATE（請用步驟 1 查到的 id，不要用猜的 email）
-- -----------------------------------------------------------------------------
-- UPDATE public.users
-- SET
--   plan = 'streamer',
--   vip_status = 'active',
--   vip_until = now() + interval '90 days',
--   is_founding_creator = true,
--   founding_enrolled_at = COALESCE(founding_enrolled_at, now()),
--   lemon_squeezy_variant_id = '1771738',
--   lemon_squeezy_subscription_id = NULL,
--   updated_at = now()
-- WHERE id = '<從步驟 1 複製的 UUID>';

-- -----------------------------------------------------------------------------
-- 步驟 4：驗證
-- -----------------------------------------------------------------------------
-- SELECT id, email, plan, vip_status, vip_until, is_founding_creator, founding_enrolled_at
-- FROM public.users
-- WHERE email ILIKE '%terrywbrsun%';

-- 預期：plan = streamer, vip_status = active, vip_until 在未來
-- App 內請「登出」再登入，或硬重新整理，以刷新 Token / 權限。
