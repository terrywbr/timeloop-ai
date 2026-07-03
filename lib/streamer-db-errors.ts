export function toErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String((error as { message: unknown }).message)
  }
  return 'Unknown settings error'
}

export function isMissingStreamerTableError(message: string, table = 'streamer_settings') {
  const lower = message.toLowerCase()
  const tableLower = table.toLowerCase()
  if (lower.includes('schema cache') && lower.includes(tableLower)) return true
  if (lower.includes('pgrst205') && lower.includes(tableLower)) return true
  if (lower.includes('could not find') && lower.includes(tableLower)) return true
  if (lower.includes('does not exist') && lower.includes(tableLower)) return true
  return false
}
