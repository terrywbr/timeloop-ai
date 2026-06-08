'use client'

type CnManualUpgradePanelProps = {
  userId?: string | null
  wechatSupportId: string
  title: string
  description: string
  wechatLabel: string
  uidHint: string
  copyLabel: string
}

export default function CnManualUpgradePanel({
  userId,
  wechatSupportId,
  title,
  description,
  wechatLabel,
  uidHint,
  copyLabel,
}: CnManualUpgradePanelProps) {
  const handleCopyUid = async () => {
    if (!userId) return
    try {
      await navigator.clipboard.writeText(userId)
    } catch {
      // ignore clipboard failures
    }
  }

  return (
    <div className="space-y-3 rounded-lg border border-accent/30 bg-accent/5 p-3">
      <div>
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</p>
      </div>
      {wechatSupportId ? (
        <p className="text-xs text-foreground">
          {wechatLabel}: <span className="font-mono text-accent">{wechatSupportId}</span>
        </p>
      ) : null}
      {userId ? (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">{uidHint}</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 truncate rounded bg-background/60 px-2 py-1 text-[10px] text-foreground">
              {userId}
            </code>
            <button
              type="button"
              onClick={() => void handleCopyUid()}
              className="shrink-0 rounded border border-accent/40 px-2 py-1 text-[10px] font-medium text-accent transition hover:bg-accent/10"
            >
              {copyLabel}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
