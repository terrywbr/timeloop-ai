'use client'

import { useRef } from 'react'
import { ImagePlus, Trash2 } from 'lucide-react'
import { useLanguage } from '@/lib/language-context'

export type StreamerBackgroundItem = {
  id: string
  public_url: string
}

type StreamerBackgroundsPanelProps = {
  backgrounds: StreamerBackgroundItem[]
  maxBackgrounds: number
  rotationMinutes: 5 | 10
  isUploading: boolean
  onUpload: (file: File) => void | Promise<void>
  onDelete: (id: string) => void | Promise<void>
  onRotationChange: (minutes: 5 | 10) => void | Promise<void>
}

export default function StreamerBackgroundsPanel({
  backgrounds,
  maxBackgrounds,
  rotationMinutes,
  isUploading,
  onUpload,
  onDelete,
  onRotationChange,
}: StreamerBackgroundsPanelProps) {
  const { t } = useLanguage()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const canUpload = backgrounds.length < maxBackgrounds && !isUploading

  return (
    <div className="space-y-3 border-t border-foreground/10 pt-4">
      <div>
        <p className="text-xs font-medium text-foreground/90">{t.streamerOverlay.backgroundsTitle}</p>
        <p className="mt-1 text-[11px] text-muted-foreground">
          {t.streamerOverlay.backgroundsHint
            .replace('{count}', String(backgrounds.length))
            .replace('{max}', String(maxBackgrounds))}
        </p>
      </div>

      {backgrounds.length > 0 ? (
        <ul className="grid grid-cols-3 gap-2">
          {backgrounds.map((item) => (
            <li key={item.id} className="group relative aspect-video overflow-hidden rounded-md border border-foreground/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.public_url} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => void onDelete(item.id)}
                className="absolute right-1 top-1 rounded bg-black/60 p-1 text-white opacity-0 transition group-hover:opacity-100"
                aria-label={t.streamerOverlay.removeBackground}
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0]
            event.target.value = ''
            if (file) void onUpload(file)
          }}
        />
        <button
          type="button"
          disabled={!canUpload}
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 rounded-lg border border-accent/40 px-3 py-2 text-xs font-medium text-accent transition hover:bg-accent/10 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ImagePlus className="h-3.5 w-3.5" />
          {isUploading ? t.streamerOverlay.uploading : t.streamerOverlay.uploadBackground}
        </button>
      </div>

      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
        <span>{t.streamerOverlay.rotationLabel}</span>
        {([5, 10] as const).map((minutes) => (
          <button
            key={minutes}
            type="button"
            onClick={() => void onRotationChange(minutes)}
            className={`rounded px-2 py-0.5 transition ${
              rotationMinutes === minutes
                ? 'bg-accent text-accent-foreground'
                : 'border border-foreground/15 hover:border-accent/40'
            }`}
          >
            {minutes === 5 ? t.streamerOverlay.rotation5 : t.streamerOverlay.rotation10}
          </button>
        ))}
      </div>

      <a
        href="/?stream=1"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block text-[11px] text-accent underline-offset-2 hover:underline"
      >
        {t.streamerOverlay.streamModeLink}
      </a>
    </div>
  )
}
