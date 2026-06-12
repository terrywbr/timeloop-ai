import type { Language } from '@/lib/translations'
import type { PomodoroPhase } from '@/lib/companion/types'
import { pickRandomPresetLine } from '@/lib/dj-preset-lines'
import { isMusicMoodId, type MusicMoodId } from '@/lib/music-moods'

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
  title: '?芯撈',
  pomodoro: '?芾???,
  focus: '撠釣',
  shortBreak: '?凋???,
  longBreak: '?瑚???,
  idle: '敺?',
  start: '??',
  pause: '?怠?',
  reset: '?蔭',
  skip: '頝喲?',
  alarms: '擛折?',
  addAlarm: '?啣?擛折?',
  alarmLabel: '擛折?',
  repeatOnce: '銝甈?,
  repeatDaily: '瘥予',
  repeatWeekdays: '撟單',
  noAlarms: '撠閮剖?擛折?',
  calendar: '隞銵?',
  connectCalendar: '?? Google 銵???,
  calendarConnected: '銵??歇??',
  calendarReconnect: '???銵???,
  noEventsToday: '隞瘝??游?銵?',
  loginRequired: '隢??餃隞仿?銵???,
  minutesUntil: '頝 {title} ?? {minutes} ??',
}

export const COMPANION_I18N: Record<Language, CompanionUiCopy> = {
  en,
  'zh-TW': zhTw,
  'zh-CN': {
    ...zhTw,
    title: '?芯撈',
    pomodoro: '?芾???,
    focus: '銝釣',
    shortBreak: '?凋???,
    longBreak: '?蹂???,
    idle: '敺',
    start: '撘憪?,
    pause: '??',
    reset: '?蔭',
    skip: '頝唾?',
    alarms: '?寥?',
    addAlarm: '?啣??寥?',
    alarmLabel: '?寥?',
    repeatOnce: '銝甈?,
    repeatDaily: '瘥予',
    repeatWeekdays: '撟單',
    noAlarms: '撠霈曉??寥?',
    calendar: '隞銵?',
    connectCalendar: '餈 Google ?亙?',
    calendarConnected: '?亙?撌脰???,
    calendarReconnect: '?餈?亙?',
    noEventsToday: '隞瘝⊥??游?銵?',
    loginRequired: '霂瑕??餃?隞亥??交??,
    minutesUntil: '頝氖 {title} 餈? {minutes} ??',
  },
  ja: {
    title: '?喋???芥',
    pomodoro: '????,
    focus: '?葉',
    shortBreak: '?准?隡',
    longBreak: '?瑯?隡',
    idle: '敺?',
    start: '??',
    pause: '銝??甇?,
    reset: '?芥??',
    skip: '?嫘??',
    alarms: '?Ｕ?潦?',
    addAlarm: '?Ｕ?潦?餈賢?',
    alarmLabel: '?Ｕ?潦?',
    repeatOnce: '1??,
    repeatDaily: '瘥',
    repeatWeekdays: '撟單',
    noAlarms: '?Ｕ?潦??芾身摰?,
    calendar: '隞?桐?摰?,
    connectCalendar: 'Google?怒?喋??潦??亦?',
    calendarConnected: '?怒?喋??潭蝬???,
    calendarReconnect: '?怒?喋??潦??蝬?,
    noEventsToday: '隞?桐?摰??隞乩????整???,
    loginRequired: '?怒?喋??潭蝬?胯?啜?喋?敹??扼?',
    minutesUntil: '{title}?整?{minutes}??,
  },
  ko: {
    title: '??',
    pomodoro: '踳諈刺?諢?,
    focus: '鴔?',
    shortBreak: '鴔抓? ?渥?',
    longBreak: '篣??渥?',
    idle: '?篣?,
    start: '??',
    pause: '?潰???',
    reset: '黕萼??,
    skip: '穇渠??國萼',
    alarms: '??',
    addAlarm: '?? 黺?',
    alarmLabel: '??',
    repeatOnce: '??貒?,
    repeatDaily: '諤木',
    repeatWeekdays: '?',
    noAlarms: '?木????? ??',
    calendar: '?月? ?潰?',
    connectCalendar: 'Google 儥旭???國盒',
    calendarConnected: '儥旭???國盒??,
    calendarReconnect: '儥旭???木? ?國盒',
    noEventsToday: '?月? ???渥? ?潰? ??',
    loginRequired: '儥旭???國盒??? 諢溢?貲??賄?',
    minutesUntil: '{title}篧? {minutes}賱?,
  },
  es: {
    title: 'Compa簽穩a',
    pomodoro: 'Pomodoro',
    focus: 'Enfoque',
    shortBreak: 'Descanso corto',
    longBreak: 'Descanso largo',
    idle: 'Listo',
    start: 'Iniciar',
    pause: 'Pausar',
    reset: 'Reiniciar',
    skip: 'Saltar',
    alarms: 'Alarmas',
    addAlarm: 'A簽adir alarma',
    alarmLabel: 'Alarma',
    repeatOnce: 'Una vez',
    repeatDaily: 'Diario',
    repeatWeekdays: 'Entre semana',
    noAlarms: 'Sin alarmas',
    calendar: 'Agenda de hoy',
    connectCalendar: 'Conectar Google Calendar',
    calendarConnected: 'Calendario conectado',
    calendarReconnect: 'Reconectar calendario',
    noEventsToday: 'No hay m獺s eventos hoy',
    loginRequired: 'Inicia sesi籀n para conectar el calendario',
    minutesUntil: '{minutes} min para {title}',
  },
  fr: {
    title: 'Compagnon',
    pomodoro: 'Pomodoro',
    focus: 'Focus',
    shortBreak: 'Pause courte',
    longBreak: 'Pause longue',
    idle: 'Pr礙t',
    start: 'D矇marrer',
    pause: 'Pause',
    reset: 'R矇initialiser',
    skip: 'Passer',
    alarms: 'Alarmes',
    addAlarm: 'Ajouter une alarme',
    alarmLabel: 'Alarme',
    repeatOnce: 'Une fois',
    repeatDaily: 'Quotidien',
    repeatWeekdays: 'Semaine',
    noAlarms: 'Aucune alarme',
    calendar: 'Agenda du jour',
    connectCalendar: 'Connecter Google Agenda',
    calendarConnected: 'Agenda connect矇',
    calendarReconnect: 'Reconnecter l\'agenda',
    noEventsToday: 'Plus d\'矇v矇nements aujourd\'hui',
    loginRequired: 'Connectez-vous pour lier l\'agenda',
    minutesUntil: '{minutes} min avant {title}',
  },
  de: {
    title: 'Begleitung',
    pomodoro: 'Pomodoro',
    focus: 'Fokus',
    shortBreak: 'Kurze Pause',
    longBreak: 'Lange Pause',
    idle: 'Bereit',
    start: 'Start',
    pause: 'Pause',
    reset: 'Zur羹cksetzen',
    skip: '?berspringen',
    alarms: 'Wecker',
    addAlarm: 'Wecker hinzuf羹gen',
    alarmLabel: 'Wecker',
    repeatOnce: 'Einmal',
    repeatDaily: 'T瓣glich',
    repeatWeekdays: 'Wochentags',
    noAlarms: 'Keine Wecker',
    calendar: 'Heutiger Plan',
    connectCalendar: 'Google Kalender verbinden',
    calendarConnected: 'Kalender verbunden',
    calendarReconnect: 'Kalender erneut verbinden',
    noEventsToday: 'Keine weiteren Termine heute',
    loginRequired: 'Anmelden, um Kalender zu verbinden',
    minutesUntil: 'Noch {minutes} Min. bis {title}',
  },
  th: {
    title: '鉆鉊虞鉆葉鉊腦鉆葷鉊﹤?鉊耜?',
    pomodoro: 'Pomodoro',
    focus: '鉆?鉊萵鉊?,
    shortBreak: '鉊萵鉊葵鉊晤?鉊?,
    longBreak: '鉊萵鉊腺鉊耜葷',
    idle: '鉊腦鉆葉鉊?,
    start: '鉆鉊?葩鉆腹',
    pause: '鉊徇腺鉊詮?鉊萵鉆葷鉊腦鉊耜葷',
    reset: '鉊?葭鉆鉊?鉊?,
    skip: '鉊?鉊耜腹',
    alarms: '鉊葡鉊眇葩鉊葡鉊艇鉊詮?',
    addAlarm: '鉆鉊葩鉆腹鉊葡鉊眇葩鉊葡鉊艇鉊詮?',
    alarmLabel: '鉊葡鉊眇葩鉊葡鉊艇鉊詮?',
    repeatOnce: '鉊腦鉊晤?鉊?鉊葭鉊Ｒ葷',
    repeatDaily: '鉊虜鉊葷鉊晤?',
    repeatWeekdays: '鉊抉萵鉊?鉊?腦鉊﹤?鉊?,
    noAlarms: '鉊Ｒ萵鉊?鉊﹤?鉊萵鉆?鉊葡鉊眇葩鉊葡鉊艇鉊詮?',
    calendar: '鉊葡鉊?葡鉊葷鉊晤?鉊葭鉆?,
    connectCalendar: '鉆鉊虞鉆葉鉊?Google Calendar',
    calendarConnected: '鉆鉊虞鉆葉鉊﹤?鉊葩鉊葩鉊?鉊丞?鉊?,
    calendarReconnect: '鉆鉊虞鉆葉鉊﹤?鉊葩鉊葩鉊?鉊徇腹鉆?,
    noEventsToday: '鉆腹鉆腹鉊菽?鉊毯?鉊腦鉊?腹鉆鉊葩鉆腹鉆鉊葩鉊﹤葷鉊晤?鉊葭鉆?,
    loginRequired: '鉆鉊?鉊耜葵鉊嫩?鉊?萼鉊?鉆鉊虞鉆葉鉆鉊虞鉆葉鉊﹤?鉊葩鉊葩鉊?,
    minutesUntil: '鉊冢葭鉊?{minutes} 鉊葡鉊葭鉊葆鉊?{title}',
  },
  vi: {
    title: '?廙g h?nh',
    pomodoro: 'Pomodoro',
    focus: 'T廕計 trung',
    shortBreak: 'Ngh廙?ng廕疸',
    longBreak: 'Ngh廙?d?i',
    idle: 'S廕登 s?ng',
    start: 'B廕眩 ?廕吟',
    pause: 'T廕《 d廙南g',
    reset: '?廕暗 l廕【',
    skip: 'B廙?qua',
    alarms: 'B獺o th廙妾',
    addAlarm: 'Th礙m b獺o th廙妾',
    alarmLabel: 'B獺o th廙妾',
    repeatOnce: 'M廙 l廕吵',
    repeatDaily: 'H?ng ng?y',
    repeatWeekdays: 'Ng?y th廙g',
    noAlarms: 'Cha c籀 b獺o th廙妾',
    calendar: 'L廙h h繫m nay',
    connectCalendar: 'K廕篙 n廙 Google Calendar',
    calendarConnected: '?瓊 k廕篙 n廙 l廙h',
    calendarReconnect: 'K廕篙 n廙 l廕【 l廙h',
    noEventsToday: 'Kh繫ng c簷n s廙?ki廙 h繫m nay',
    loginRequired: '??ng nh廕計 ?廙?k廕篙 n廙 l廙h',
    minutesUntil: 'C簷n {minutes} ph繳t ?廕積 {title}',
  },
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

function resolveDjMoodId(moodId?: string): MusicMoodId {
  return moodId && isMusicMoodId(moodId) ? moodId : 'deep-night'
}

/** Static preset lines for TTS cache — no dynamic time, labels, or counts. */
export function getPomodoroDjFallback(locale: Language, _phase: PomodoroPhase, moodId?: MusicMoodId): string {
  return pickRandomPresetLine(moodId ?? 'deep-night', locale)
}

export function getAlarmDjFallback(locale: Language, _label: string, moodId?: MusicMoodId): string {
  return pickRandomPresetLine(moodId ?? 'deep-night', locale)
}

export function getCalendarDjFallback(
  locale: Language,
  _eventTitle: string,
  _minutesUntil: number,
  moodId?: MusicMoodId,
): string {
  return pickRandomPresetLine(moodId ?? 'deep-night', locale)
}

export function getIntervalDjFallback(locale: Language, moodId: string, _time?: string, _index?: number): string {
  return pickRandomPresetLine(resolveDjMoodId(moodId), locale)
}

export function getCoFocusDjFallback(locale: Language, _count: number, moodId?: MusicMoodId): string {
  return pickRandomPresetLine(moodId ?? 'deep-night', locale)
}
