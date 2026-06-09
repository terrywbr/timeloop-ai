'use client'

import type { UserAccountProfile } from '@/lib/api-client'
import type { CheckoutProductKind } from '@/lib/billing-config'
import { useLanguage } from '@/lib/language-context'
import CnManualUpgradePanel from '@/components/billing/cn-manual-upgrade-panel'

export type CheckoutHandlerKind = CheckoutProductKind | 'subscription'

type MembershipPanelProps = {
  userProfile: UserAccountProfile | null
  isAuthenticated: boolean
  preferCreditPack: boolean
  isCnHost?: boolean
  cnWechatSupportId?: string
  onRequireAuth: () => void | Promise<boolean>
  onCheckout: (kind: CheckoutHandlerKind) => void
}

function formatVipUntil(iso: string | null, locale: string) {
  if (!iso) return null
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' })
}

export default function MembershipPanel({
  userProfile,
  isAuthenticated,
  preferCreditPack,
  isCnHost = false,
  cnWechatSupportId = '',
  onRequireAuth,
  onCheckout,
}: MembershipPanelProps) {
  const { t, language } = useLanguage()
  const showCnManual = preferCreditPack || isCnHost
  const vipUntilLabel = formatVipUntil(userProfile?.vipUntil ?? null, language)

  const handlePaidAction = (kind: CheckoutHandlerKind) => {
    if (!isAuthenticated) {
      void onRequireAuth()
      return
    }
    onCheckout(kind)
  }

  return (
    <div className="space-y-2 border-t border-foreground/10 pt-4 text-xs text-muted-foreground">
      {userProfile?.vipStatus === 'past_due' ? (
        <p className="rounded-md border border-amber-500/40 bg-amber-500/10 px-2 py-1.5 text-amber-100">
          {t.membership.pastDueWarning}
        </p>
      ) : null}

      {userProfile?.isStreamer ? (
        <p className="text-accent">{t.membership.streamerActive}</p>
      ) : userProfile?.isVip ? (
        <p className="text-accent">{t.membership.vipActive}</p>
      ) : (
        <>
          <p>
            {t.membership.creditsRemaining.replace(
              '{count}',
              String(userProfile?.remainingCredits ?? 5),
            )}
          </p>
          <p>{t.membership.free}</p>
          <p>{t.membership.generationCost}</p>
        </>
      )}

      {vipUntilLabel ? (
        <p>{t.membership.vipUntil.replace('{date}', vipUntilLabel)}</p>
      ) : null}

      <p className="text-accent">{t.membership.vip}</p>

      <div className="flex flex-col gap-2 pt-1">
        {showCnManual ? (
          <CnManualUpgradePanel
            userId={userProfile?.id}
            wechatSupportId={cnWechatSupportId}
            title={t.streamerOverlay.cnManualTitle}
            description={t.streamerOverlay.cnManualDescription}
            wechatLabel={t.streamerOverlay.cnWechatLabel}
            uidHint={t.streamerOverlay.cnUidHint}
            copyLabel={t.streamerOverlay.cnCopyUid}
            pricingTiers={t.streamerOverlay.cnPricingTiers}
          />
        ) : null}

        {!showCnManual && !userProfile?.isVip && !userProfile?.isStreamer ? (
          <button
            type="button"
            onClick={() => handlePaidAction('vip')}
            className="rounded-lg bg-accent px-3 py-2 text-xs font-medium text-accent-foreground transition hover:bg-accent/90"
          >
            {t.membership.upgradeVip}
          </button>
        ) : null}

        {!showCnManual && !userProfile?.isStreamer ? (
          <button
            type="button"
            onClick={() => handlePaidAction('streamer')}
            className="rounded-lg border border-accent/50 bg-accent/10 px-3 py-2 text-xs font-medium text-accent transition hover:bg-accent/20"
          >
            {t.membership.upgradeStreamer}
          </button>
        ) : null}

        {!showCnManual && !userProfile?.isVip && !userProfile?.isStreamer ? (
          <>
            <button
              type="button"
              onClick={() => handlePaidAction('credits_10')}
              className="rounded-lg border border-accent/40 px-3 py-2 text-xs font-medium text-accent transition hover:bg-accent/10"
            >
              {t.membership.buyCredits10}
            </button>
            <button
              type="button"
              onClick={() => handlePaidAction('credits_20')}
              className="rounded-lg border border-accent/40 px-3 py-2 text-xs font-medium text-accent transition hover:bg-accent/10"
            >
              {t.membership.buyCredits20}
            </button>
            <button
              type="button"
              onClick={() => handlePaidAction('credits')}
              className="rounded-lg border border-foreground/20 px-3 py-2 text-xs font-medium text-foreground/80 transition hover:bg-secondary/40"
            >
              {t.membership.buyCredits}
            </button>
          </>
        ) : null}
      </div>
    </div>
  )
}
