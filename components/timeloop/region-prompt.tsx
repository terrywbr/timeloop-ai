'use client'

type RegionPromptProps = {
  onChooseGlobal: () => void
  onChooseCn: () => void
}

export default function RegionPrompt({ onChooseGlobal, onChooseCn }: RegionPromptProps) {
  return (
    <div className="fixed inset-x-4 top-20 z-[95] mx-auto max-w-md rounded-2xl border border-accent/30 bg-popover/90 p-4 text-sm text-foreground shadow-[0_0_32px_rgba(80,180,255,0.22)] backdrop-blur-md">
      <p className="font-medium">偵測到你可能使用簡體中文環境</p>
      <p className="mt-1 text-muted-foreground">
        是否切換到中國優化入口？系統會記住你的選擇，不會每次詢問。
      </p>
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={onChooseGlobal}
          className="flex-1 rounded-lg border border-foreground/10 bg-secondary/60 px-3 py-2 text-foreground/80 transition hover:bg-secondary"
        >
          留在國際站
        </button>
        <button
          type="button"
          onClick={onChooseCn}
          className="flex-1 rounded-lg bg-accent px-3 py-2 font-medium text-accent-foreground transition hover:bg-accent/90"
        >
          切換中國入口
        </button>
      </div>
    </div>
  )
}
