'use client'

import { LogOut } from 'lucide-react'

type SignOutButtonProps = {
  label: string
  onClick: () => void
  disabled?: boolean
  loading?: boolean
  className?: string
}

export default function SignOutButton({
  label,
  onClick,
  disabled = false,
  loading = false,
  className = '',
}: SignOutButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className={`inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-foreground/15 bg-secondary/40 px-3 text-sm font-medium text-foreground/80 transition hover:border-red-500/35 hover:bg-red-500/10 hover:text-red-200 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
      aria-label={label}
    >
      {loading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-foreground/20 border-t-foreground/80" />
      ) : (
        <LogOut className="h-4 w-4 shrink-0" />
      )}
      <span>{label}</span>
    </button>
  )
}
