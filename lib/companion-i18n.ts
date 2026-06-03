import type { Language } from '@/lib/translations'
import type { PomodoroPhase } from '@/lib/companion/types'

export type CompanionUiCopy = {
  title: string
  pomodoro: string
  focus: string
  shortBreak: string
  longBreak: string
  idle: string
  start: string
  pause: string
  reset: string
  skip: string
  alarms: string
  addAlarm: string
  alarmLabel: string
  repeatOnce: string
  repeatDaily: string
  repeatWeekdays: string
  noAlarms: string
  calendar: string
  connectCalendar: string
  calendarConnected: string
  calendarReconnect: string
  noEventsToday: string
  loginRequired: string
  minutesUntil: string
}

const en: CompanionUiCopy = {
  title: 'Companion',
  pomodoro: 'Pomodoro',
  focus: 'Focus',
  shortBreak: 'Short break',
  longBreak: 'Long break',
  idle: 'Ready',
  start: 'Start',
  pause: 'Pause',
  reset: 'Reset',
  skip: 'Skip',
  alarms: 'Alarms',
  addAlarm: 'Add alarm',
  alarmLabel: 'Alarm',
  repeatOnce: 'Once',
  repeatDaily: 'Daily',
  repeatWeekdays: 'Weekdays',
  noAlarms: 'No alarms set',
  calendar: 'Today\'s schedule',
  connectCalendar: 'Connect Google Calendar',
  calendarConnected: 'Calendar connected',
  calendarReconnect: 'Reconnect calendar',
  noEventsToday: 'No more events today',
  loginRequired: 'Sign in to connect calendar',
  minutesUntil: '{minutes} min until {title}',
}

const zhTw: CompanionUiCopy = {
  title: '陪伴',
  pomodoro: '番茄鐘',
  focus: '專注',
  shortBreak: '短休息',
  longBreak: '長休息',
  idle: '待機',
  start: '開始',
  pause: '暫停',
  reset: '重置',
  skip: '跳過',
  alarms: '鬧鐘',
  addAlarm: '新增鬧鐘',
  alarmLabel: '鬧鐘',
  repeatOnce: '一次',
  repeatDaily: '每天',
  repeatWeekdays: '平日',
  noAlarms: '尚未設定鬧鐘',
  calendar: '今日行程',
  connectCalendar: '連接 Google 行事曆',
  calendarConnected: '行事曆已連接',
  calendarReconnect: '重新連接行事曆',
  noEventsToday: '今日沒有更多行程',
  loginRequired: '請先登入以連接行事曆',
  minutesUntil: '距離 {title} 還有 {minutes} 分鐘',
}

export const COMPANION_I18N: Record<Language, CompanionUiCopy> = {
  en,
  'zh-TW': zhTw,
  'zh-CN': {
    ...zhTw,
    title: '陪伴',
    pomodoro: '番茄钟',
    focus: '专注',
    shortBreak: '短休息',
    longBreak: '长休息',
    idle: '待机',
    start: '开始',
    pause: '暂停',
    reset: '重置',
    skip: '跳过',
    alarms: '闹钟',
    addAlarm: '新增闹钟',
    alarmLabel: '闹钟',
    repeatOnce: '一次',
    repeatDaily: '每天',
    repeatWeekdays: '平日',
    noAlarms: '尚未设定闹钟',
    calendar: '今日行程',
    connectCalendar: '连接 Google 日历',
    calendarConnected: '日历已连接',
    calendarReconnect: '重新连接日历',
    noEventsToday: '今日没有更多行程',
    loginRequired: '请先登录以连接日历',
    minutesUntil: '距离 {title} 还有 {minutes} 分钟',
  },
  ja: { ...en, title: 'コンパニオン', pomodoro: 'ポモドーロ', focus: '集中', alarms: 'アラーム', calendar: '今日の予定' },
  ko: { ...en, title: '동반', pomodoro: '뽀모도로', focus: '집중', alarms: '알람', calendar: '오늘 일정' },
  es: { ...en, title: 'Compañía', pomodoro: 'Pomodoro', focus: 'Enfoque', alarms: 'Alarmas', calendar: 'Agenda de hoy' },
  fr: { ...en, title: 'Compagnon', pomodoro: 'Pomodoro', focus: 'Focus', alarms: 'Alarmes', calendar: 'Agenda du jour' },
  de: { ...en, title: 'Begleitung', pomodoro: 'Pomodoro', focus: 'Fokus', alarms: 'Wecker', calendar: 'Heutiger Plan' },
}

export function getPomodoroPhaseLabel(locale: Language, phase: PomodoroPhase): string {
  const c = COMPANION_I18N[locale] ?? COMPANION_I18N.en
  switch (phase) {
    case 'focus':
      return c.focus
    case 'short_break':
      return c.shortBreak
    case 'long_break':
      return c.longBreak
    default:
      return c.idle
  }
}

export function getPomodoroDjFallback(locale: Language, phase: PomodoroPhase): string {
  const zh = locale.startsWith('zh')
  if (phase === 'focus') {
    return zh ? '艦長，專注時間開始。我會在這裡陪著你。' : 'Captain, focus block started. I am here with you.'
  }
  if (phase === 'short_break' || phase === 'long_break') {
    return zh ? '做得好，艦長。休息一下，喝口水再回來。' : 'Well done, Captain. Take a break — hydrate and return when ready.'
  }
  return zh ? '番茄鐘已重置，準備好再開始。' : 'Pomodoro reset. Ready when you are.'
}

export function getAlarmDjFallback(locale: Language, label: string): string {
  const zh = locale.startsWith('zh')
  return zh
    ? `艦長，${label} 時間到了。`
    : `Captain, ${label} — it is time.`
}

export function getCalendarDjFallback(locale: Language, eventTitle: string, minutesUntil: number): string {
  const zh = locale.startsWith('zh')
  return zh
    ? `艦長，${minutesUntil} 分鐘後有「${eventTitle}」，準備一下。`
    : `Captain, "${eventTitle}" starts in ${minutesUntil} minutes.`
}

export function getIntervalDjFallback(
  locale: Language,
  moodId: string,
  time: string,
  index: number,
): string {
  const localeMap = INTERVAL_FALLBACKS[locale] ?? INTERVAL_FALLBACKS.en
  const templates =
    localeMap[moodId] ?? INTERVAL_FALLBACKS.en[moodId as keyof typeof INTERVAL_FALLBACKS.en] ?? INTERVAL_FALLBACKS.en['deep-night']
  const pick = templates[index % templates.length] ?? templates[0]
  return pick.replace(/\{time\}/g, time)
}

const INTERVAL_FALLBACKS: Record<
  Language,
  Record<string, string[]>
> = {
  en: {
    'neon-tokyo': [
      'Still riding the neon wave, Captain. It is {time} — stay sharp.',
      'Cyber night continues. {time} check-in: you are doing fine.',
    ],
    'deep-night': [
      'Orbit stable, Captain. {time} — keep your focus trajectory.',
      'Quiet cosmos at {time}. Breathe and continue.',
    ],
    'deep-space': [
      'Depth holding at 3000ft. {time} — noise floor minimal.',
      'Submarine mode steady. {time} status: all systems calm.',
    ],
    'galactic-tavern': [
      'Your corner is still here, Captain. {time} — sip and steady on.',
      'Jazz hour continues. {time} — no rush.',
    ],
    'galactic-classical': [
      'Productivity channel open. {time} — one step at a time.',
      'Minimal cabin at {time}. Stay elegant, stay focused.',
    ],
    'retro-earth': [
      'Campfire still crackling, Captain. {time} — keep the voyage going.',
      'Alpine night at {time}. You are not alone out here.',
    ],
  },
  'zh-TW': {
    'neon-tokyo': ['霓虹頻道仍在播放，艦長。現在 {time}，保持節奏。', '賽博深夜繼續中，{time} 打卡：你做得很好。'],
    'deep-night': ['軌道穩定，艦長。{time}，維持專注航向。', '宇宙依舊安靜，{time}，深呼吸繼續。'],
    'deep-space': ['深度維持 3000 呎，{time}，雜音極低。', '潛航模式穩定，{time}，一切平靜。'],
    'galactic-tavern': ['你的角落還在，艦長。{time}，慢慢來。', '爵士時光繼續，{time}，不用急。'],
    'galactic-classical': ['生產力頻道開啟，{time}，一步一腳印。', '極簡空間 {time}，優雅專注。'],
    'retro-earth': ['篝火仍在劈啪，艦長。{time}，繼續航程。', '雪山之夜 {time}，你不是一個人。'],
  },
  'zh-CN': {
    'neon-tokyo': ['霓虹频道仍在播放，舰长。现在 {time}，保持节奏。'],
    'deep-night': ['轨道稳定，舰长。{time}，维持专注航向。'],
    'deep-space': ['深度维持 3000 尺，{time}，杂音极低。'],
    'galactic-tavern': ['你的角落还在，舰长。{time}，慢慢来。'],
    'galactic-classical': ['生产力频道开启，{time}，一步一脚印。'],
    'retro-earth': ['篝火仍在劈啪，舰长。{time}，继续航程。'],
  },
  ja: { 'deep-night': ['軌道は安定、艦長。{time}。'] },
  ko: { 'deep-night': ['궤도 안정, 함장. {time}.'] },
  es: { 'deep-night': ['Órbita estable, Capitán. {time}.'] },
  fr: { 'deep-night': ['Orbite stable, Capitaine. {time}.'] },
  de: { 'deep-night': ['Orbit stabil, Kapitän. {time}.'] },
}
