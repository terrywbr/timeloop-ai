/** Taipei (Asia/Taipei) clock context for live AI DJ time announcements. */
export type TaipeiTimeContext = {
  iso: string
  dateLabel: string
  timeLabel: string
  weekdayLabel: string
  periodLabel: string
  fullLabel: string
}

const WEEKDAY_ZH = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'] as const
const WEEKDAY_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const

function formatInTimeZone(date: Date, timeZone: string, options: Intl.DateTimeFormatOptions, locale = 'zh-TW') {
  return new Intl.DateTimeFormat(locale, { timeZone, ...options }).format(date)
}

function resolvePeriodLabel(hour: number, locale: 'zh' | 'en' | 'th' | 'vi'): string {
  if (locale === 'en') {
    if (hour >= 5 && hour < 12) return 'morning'
    if (hour >= 12 && hour < 18) return 'afternoon'
    if (hour >= 18 && hour < 23) return 'evening'
    return 'late night'
  }
  if (locale === 'th') {
    if (hour >= 5 && hour < 12) return 'ตอนเช้า'
    if (hour >= 12 && hour < 18) return 'ตอนบ่าย'
    if (hour >= 18 && hour < 23) return 'ตอนเย็น'
    return 'ดึก'
  }
  if (locale === 'vi') {
    if (hour >= 5 && hour < 12) return 'buổi sáng'
    if (hour >= 12 && hour < 18) return 'buổi chiều'
    if (hour >= 18 && hour < 23) return 'buổi tối'
    return 'đêm khuya'
  }
  if (hour >= 5 && hour < 12) return '清晨'
  if (hour >= 12 && hour < 18) return '午後'
  if (hour >= 18 && hour < 23) return '夜晚'
  return '深夜'
}

function localeTagForClock(locale: 'zh' | 'en' | 'th' | 'vi') {
  if (locale === 'en') return 'en-US'
  if (locale === 'th') return 'th-TH'
  if (locale === 'vi') return 'vi-VN'
  return 'zh-TW'
}

export function getTaipeiTimeContext(now = new Date(), locale: 'zh' | 'en' | 'th' | 'vi' = 'zh'): TaipeiTimeContext {
  const clockLocale = localeTagForClock(locale)
  const hour = Number.parseInt(formatInTimeZone(now, 'Asia/Taipei', { hour: 'numeric', hour12: false }), 10)

  const dateLabel = formatInTimeZone(now, 'Asia/Taipei', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }, clockLocale)
  const timeLabel = formatInTimeZone(now, 'Asia/Taipei', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }, clockLocale)
  const taipeiWeekday = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Taipei' })).getDay()
  const weekdayLabel = locale === 'zh'
    ? WEEKDAY_ZH[taipeiWeekday]!
    : locale === 'en'
      ? WEEKDAY_EN[taipeiWeekday]!
      : formatInTimeZone(now, 'Asia/Taipei', { weekday: 'long' }, clockLocale)
  const periodLabel = resolvePeriodLabel(hour, locale)

  let fullLabel: string
  if (locale === 'en') {
    fullLabel = `${weekdayLabel}, ${dateLabel}, ${timeLabel} (${periodLabel}, Taipei time)`
  } else if (locale === 'th') {
    fullLabel = `เวลาไทเป ${weekdayLabel} ${dateLabel} ${timeLabel} (${periodLabel})`
  } else if (locale === 'vi') {
    fullLabel = `Giờ Đài Bắc ${weekdayLabel}, ${dateLabel}, ${timeLabel} (${periodLabel})`
  } else {
    fullLabel = `台北時間 ${dateLabel} ${weekdayLabel} ${timeLabel}，${periodLabel}`
  }

  return {
    iso: now.toISOString(),
    dateLabel,
    timeLabel,
    weekdayLabel,
    periodLabel,
    fullLabel,
  }
}
