import type { Language } from '@/lib/translations'
import type { PomodoroPhase } from '@/lib/companion/types'
import { djSpeechLocaleForUiLocale } from '@/lib/dj-speech-locale'

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
  ja: {
    title: 'コンパニオン',
    pomodoro: 'ポモドーロ',
    focus: '集中',
    shortBreak: '短い休憩',
    longBreak: '長い休憩',
    idle: '待機',
    start: '開始',
    pause: '一時停止',
    reset: 'リセット',
    skip: 'スキップ',
    alarms: 'アラーム',
    addAlarm: 'アラーム追加',
    alarmLabel: 'アラーム',
    repeatOnce: '1回',
    repeatDaily: '毎日',
    repeatWeekdays: '平日',
    noAlarms: 'アラーム未設定',
    calendar: '今日の予定',
    connectCalendar: 'Googleカレンダーを接続',
    calendarConnected: 'カレンダー接続済み',
    calendarReconnect: 'カレンダーを再接続',
    noEventsToday: '今日の予定はこれ以上ありません',
    loginRequired: 'カレンダー接続にはログインが必要です',
    minutesUntil: '{title}まであと{minutes}分',
  },
  ko: {
    title: '동반',
    pomodoro: '뽀모도로',
    focus: '집중',
    shortBreak: '짧은 휴식',
    longBreak: '긴 휴식',
    idle: '대기',
    start: '시작',
    pause: '일시정지',
    reset: '초기화',
    skip: '건너뛰기',
    alarms: '알람',
    addAlarm: '알람 추가',
    alarmLabel: '알람',
    repeatOnce: '한 번',
    repeatDaily: '매일',
    repeatWeekdays: '평일',
    noAlarms: '설정된 알람 없음',
    calendar: '오늘 일정',
    connectCalendar: 'Google 캘린더 연결',
    calendarConnected: '캘린더 연결됨',
    calendarReconnect: '캘린더 다시 연결',
    noEventsToday: '오늘 더 이상 일정 없음',
    loginRequired: '캘린더 연결을 위해 로그인하세요',
    minutesUntil: '{title}까지 {minutes}분',
  },
  es: {
    title: 'Compañía',
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
    addAlarm: 'Añadir alarma',
    alarmLabel: 'Alarma',
    repeatOnce: 'Una vez',
    repeatDaily: 'Diario',
    repeatWeekdays: 'Entre semana',
    noAlarms: 'Sin alarmas',
    calendar: 'Agenda de hoy',
    connectCalendar: 'Conectar Google Calendar',
    calendarConnected: 'Calendario conectado',
    calendarReconnect: 'Reconectar calendario',
    noEventsToday: 'No hay más eventos hoy',
    loginRequired: 'Inicia sesión para conectar el calendario',
    minutesUntil: '{minutes} min para {title}',
  },
  fr: {
    title: 'Compagnon',
    pomodoro: 'Pomodoro',
    focus: 'Focus',
    shortBreak: 'Pause courte',
    longBreak: 'Pause longue',
    idle: 'Prêt',
    start: 'Démarrer',
    pause: 'Pause',
    reset: 'Réinitialiser',
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
    calendarConnected: 'Agenda connecté',
    calendarReconnect: 'Reconnecter l\'agenda',
    noEventsToday: 'Plus d\'événements aujourd\'hui',
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
    reset: 'Zurücksetzen',
    skip: 'Überspringen',
    alarms: 'Wecker',
    addAlarm: 'Wecker hinzufügen',
    alarmLabel: 'Wecker',
    repeatOnce: 'Einmal',
    repeatDaily: 'Täglich',
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
    title: 'เพื่อนร่วมทาง',
    pomodoro: 'Pomodoro',
    focus: 'โฟกัส',
    shortBreak: 'พักสั้น',
    longBreak: 'พักยาว',
    idle: 'พร้อม',
    start: 'เริ่ม',
    pause: 'หยุดชั่วคราว',
    reset: 'รีเซ็ต',
    skip: 'ข้าม',
    alarms: 'นาฬิกาปลุก',
    addAlarm: 'เพิ่มนาฬิกาปลุก',
    alarmLabel: 'นาฬิกาปลุก',
    repeatOnce: 'ครั้งเดียว',
    repeatDaily: 'ทุกวัน',
    repeatWeekdays: 'วันธรรมดา',
    noAlarms: 'ยังไม่ตั้งนาฬิกาปลุก',
    calendar: 'ตารางวันนี้',
    connectCalendar: 'เชื่อม Google Calendar',
    calendarConnected: 'เชื่อมปฏิทินแล้ว',
    calendarReconnect: 'เชื่อมปฏิทินใหม่',
    noEventsToday: 'ไม่มีกิจกรรมเพิ่มเติมวันนี้',
    loginRequired: 'เข้าสู่ระบบเพื่อเชื่อมปฏิทิน',
    minutesUntil: 'อีก {minutes} นาทีถึง {title}',
  },
  vi: {
    title: 'Đồng hành',
    pomodoro: 'Pomodoro',
    focus: 'Tập trung',
    shortBreak: 'Nghỉ ngắn',
    longBreak: 'Nghỉ dài',
    idle: 'Sẵn sàng',
    start: 'Bắt đầu',
    pause: 'Tạm dừng',
    reset: 'Đặt lại',
    skip: 'Bỏ qua',
    alarms: 'Báo thức',
    addAlarm: 'Thêm báo thức',
    alarmLabel: 'Báo thức',
    repeatOnce: 'Một lần',
    repeatDaily: 'Hàng ngày',
    repeatWeekdays: 'Ngày thường',
    noAlarms: 'Chưa có báo thức',
    calendar: 'Lịch hôm nay',
    connectCalendar: 'Kết nối Google Calendar',
    calendarConnected: 'Đã kết nối lịch',
    calendarReconnect: 'Kết nối lại lịch',
    noEventsToday: 'Không còn sự kiện hôm nay',
    loginRequired: 'Đăng nhập để kết nối lịch',
    minutesUntil: 'Còn {minutes} phút đến {title}',
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
}

const POMODORO_DJ_FALLBACKS: Record<Language, { focus: string; break: string; reset: string }> = {
  en: {
    focus: 'Captain, focus block started. I am here with you.',
    break: 'Well done, Captain. Take a break — hydrate and return when ready.',
    reset: 'Pomodoro reset. Ready when you are.',
  },
  'zh-TW': {
    focus: '艦長，專注時間開始。我會在這裡陪著你。',
    break: '做得好，艦長。休息一下，喝口水再回來。',
    reset: '番茄鐘已重置，準備好再開始。',
  },
  'zh-CN': {
    focus: '舰长，专注时间开始。我会在这里陪着你。',
    break: '做得好，舰长。休息一下，喝口水再回来。',
    reset: '番茄钟已重置，准备好再开始。',
  },
  ja: {
    focus: '艦長、集中タイム開始。ここで付き添います。',
    break: 'よくできました、艦長。少し休憩して、水分補給してから戻りましょう。',
    reset: 'ポモドーロをリセットしました。準備ができたら始めましょう。',
  },
  ko: {
    focus: '함장님, 집중 시간이 시작됐습니다. 제가 함께할게요.',
    break: '잘하셨어요, 함장님. 잠시 쉬고 물 한 잔 마시고 돌아오세요.',
    reset: '뽀모도로가 초기화됐습니다. 준비되면 다시 시작하세요.',
  },
  es: {
    focus: 'Capitán, bloque de enfoque iniciado. Estoy aquí contigo.',
    break: 'Bien hecho, Capitán. Descansa un momento e hidrátate.',
    reset: 'Pomodoro reiniciado. Listo cuando tú lo estés.',
  },
  fr: {
    focus: 'Capitaine, session focus lancée. Je suis là avec vous.',
    break: 'Bravo, Capitaine. Faites une pause et hydratez-vous.',
    reset: 'Pomodoro réinitialisé. Prêt quand vous l\'êtes.',
  },
  de: {
    focus: 'Kapitän, Fokusblock gestartet. Ich bin bei dir.',
    break: 'Gut gemacht, Kapitän. Mach eine Pause und trink etwas.',
    reset: 'Pomodoro zurückgesetzt. Bereit, wenn du es bist.',
  },
  th: {
    focus: 'Captain, focus block started. I am here with you.',
    break: 'Well done, Captain. Take a break — hydrate and return when ready.',
    reset: 'Pomodoro reset. Ready when you are.',
  },
  vi: {
    focus: 'Captain, focus block started. I am here with you.',
    break: 'Well done, Captain. Take a break — hydrate and return when ready.',
    reset: 'Pomodoro reset. Ready when you are.',
  },
}

const ALARM_DJ_FALLBACKS: Record<Language, (label: string) => string> = {
  en: (label) => `Captain, ${label} — it is time.`,
  'zh-TW': (label) => `艦長，${label} 時間到了。`,
  'zh-CN': (label) => `舰长，${label} 时间到了。`,
  ja: (label) => `艦長、${label} の時間です。`,
  ko: (label) => `함장님, ${label} 시간입니다.`,
  es: (label) => `Capitán, ${label} — es la hora.`,
  fr: (label) => `Capitaine, ${label} — c'est l'heure.`,
  de: (label) => `Kapitän, ${label} — es ist Zeit.`,
  th: (label) => `Captain, ${label} — it is time.`,
  vi: (label) => `Captain, ${label} — it is time.`,
}

const CALENDAR_DJ_FALLBACKS: Record<Language, (title: string, minutes: number) => string> = {
  en: (title, minutes) => `Captain, "${title}" starts in ${minutes} minutes.`,
  'zh-TW': (title, minutes) => `艦長，${minutes} 分鐘後有「${title}」，準備一下。`,
  'zh-CN': (title, minutes) => `舰长，${minutes} 分钟后有「${title}」，准备一下。`,
  ja: (title, minutes) => `艦長、${minutes} 分後に「${title}」があります。準備しましょう。`,
  ko: (title, minutes) => `함장님, ${minutes}분 후 "${title}" 일정이 있습니다. 준비하세요.`,
  es: (title, minutes) => `Capitán, "${title}" empieza en ${minutes} minutos.`,
  fr: (title, minutes) => `Capitaine, « ${title} » commence dans ${minutes} minutes.`,
  de: (title, minutes) => `Kapitän, „${title}" beginnt in ${minutes} Minuten.`,
  th: (title, minutes) => `Captain, "${title}" starts in ${minutes} minutes.`,
  vi: (title, minutes) => `Captain, "${title}" starts in ${minutes} minutes.`,
}

export function getPomodoroDjFallback(locale: Language, phase: PomodoroPhase): string {
  const djLocale = djSpeechLocaleForUiLocale(locale)
  const copy = POMODORO_DJ_FALLBACKS[djLocale] ?? POMODORO_DJ_FALLBACKS.en
  if (phase === 'focus') return copy.focus
  if (phase === 'short_break' || phase === 'long_break') return copy.break
  return copy.reset
}

export function getAlarmDjFallback(locale: Language, label: string): string {
  const djLocale = djSpeechLocaleForUiLocale(locale)
  const fn = ALARM_DJ_FALLBACKS[djLocale] ?? ALARM_DJ_FALLBACKS.en
  return fn(label)
}

export function getCalendarDjFallback(locale: Language, eventTitle: string, minutesUntil: number): string {
  const djLocale = djSpeechLocaleForUiLocale(locale)
  const fn = CALENDAR_DJ_FALLBACKS[djLocale] ?? CALENDAR_DJ_FALLBACKS.en
  return fn(eventTitle, minutesUntil)
}

export function getIntervalDjFallback(
  locale: Language,
  moodId: string,
  time: string,
  index: number,
): string {
  const djLocale = djSpeechLocaleForUiLocale(locale)
  const localeMap = INTERVAL_FALLBACKS[djLocale] ?? INTERVAL_FALLBACKS.en
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
  ja: {
    'neon-tokyo': ['ネオン波に乗り続けろ、艦長。{time} — 集中を保て。', 'サイバーな夜は続く。{time} チェックイン：順調だ。'],
    'deep-night': ['軌道安定、艦長。{time} — 集中航路を維持。', '宇宙は静か、{time}。深呼吸して続けよう。'],
    'deep-space': ['深度3000ft維持。{time} — ノイズ最小。', '潜水モード安定。{time}、全システム正常。'],
    'galactic-tavern': ['あなたの席はここにある、艦長。{time} — ゆっくりどうぞ。', 'ジャズタイム継続中。{time} — 急がなくていい。'],
    'galactic-classical': ['生産性チャンネル開放。{time} — 一歩ずつ。', 'ミニマル空間 {time}。優雅に集中を。'],
    'retro-earth': ['焚き火はまだ燃えている、艦長。{time} — 航海を続けよう。', 'アルプスの夜 {time}。一人じゃない。'],
  },
  ko: {
    'neon-tokyo': ['네온 파도를 타고 있어, 함장님. {time} — 집중 유지.', '사이버 밤은 계속됩니다. {time} 체크인: 잘하고 있어요.'],
    'deep-night': ['궤도 안정, 함장님. {time} — 집중 항로 유지.', '우주는 고요해, {time}. 숨 고르고 계속하세요.'],
    'deep-space': ['수심 3000ft 유지. {time} — 잡음 최소.', '잠수 모드 안정. {time}, 모든 시스템 정상.'],
    'galactic-tavern': ['당신의 자리는 여기 있어, 함장님. {time} — 천천히.', '재즈 타임 계속. {time} — 서두르지 마세요.'],
    'galactic-classical': ['생산성 채널 개방. {time} — 한 걸음씩.', '미니멀 공간 {time}. 우아하게 집중.'],
    'retro-earth': ['모닥불은 아직 타고 있어, 함장님. {time} — 항해 계속.', '알프스의 밤 {time}. 혼자가 아닙니다.'],
  },
  es: {
    'neon-tokyo': ['Sigues en la ola neón, Capitán. {time} — mantén el enfoque.', 'La noche cyber continúa. {time}: vas bien.'],
    'deep-night': ['Órbita estable, Capitán. {time} — mantén la trayectoria.', 'Cosmos tranquilo a las {time}. Respira y continúa.'],
    'deep-space': ['Profundidad 3000ft. {time} — ruido mínimo.', 'Modo submarino estable. {time}: todo en calma.'],
    'galactic-tavern': ['Tu rincón sigue aquí, Capitán. {time} — sin prisa.', 'Hora jazz continúa. {time} — tómatelo con calma.'],
    'galactic-classical': ['Canal productividad abierto. {time} — paso a paso.', 'Cabaña minimal a las {time}. Elegancia y enfoque.'],
    'retro-earth': ['La hoguera sigue crepitando, Capitán. {time} — continúa el viaje.', 'Noche alpina {time}. No estás solo.'],
  },
  fr: {
    'neon-tokyo': ['Toujours sur l\'onde néon, Capitaine. {time} — reste concentré.', 'La nuit cyber continue. {time} : tu assures.'],
    'deep-night': ['Orbite stable, Capitaine. {time} — garde ta trajectoire.', 'Cosmos calme à {time}. Respire et continue.'],
    'deep-space': ['Profondeur 3000ft. {time} — bruit minimal.', 'Mode sous-marin stable. {time} : tout est calme.'],
    'galactic-tavern': ['Ton coin est toujours là, Capitaine. {time} — prends ton temps.', 'Heure jazz en cours. {time} — pas de rush.'],
    'galactic-classical': ['Canal productivité ouvert. {time} — pas à pas.', 'Cabane minimaliste à {time}. Élégance et focus.'],
    'retro-earth': ['Le feu crépite encore, Capitaine. {time} — continue le voyage.', 'Nuit alpine {time}. Tu n\'es pas seul.'],
  },
  de: {
    'neon-tokyo': ['Noch auf der Neonwelle, Kapitän. {time} — bleib fokussiert.', 'Cyber-Nacht geht weiter. {time}: du machst das gut.'],
    'deep-night': ['Orbit stabil, Kapitän. {time} — halte die Kurslinie.', 'Ruhiger Kosmos um {time}. Atme und mach weiter.'],
    'deep-space': ['Tiefe 3000ft. {time} — minimales Rauschen.', 'U-Boot-Modus stabil. {time}: alles ruhig.'],
    'galactic-tavern': ['Deine Ecke ist noch da, Kapitän. {time} — ganz entspannt.', 'Jazz-Stunde läuft. {time} — kein Stress.'],
    'galactic-classical': ['Produktivitätskanal offen. {time} — Schritt für Schritt.', 'Minimalhütte um {time}. Elegant fokussiert.'],
    'retro-earth': ['Lagerfeuer knistert noch, Kapitän. {time} — weiter auf Reise.', 'Alpennacht {time}. Du bist nicht allein.'],
  },
  th: {
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
  vi: {
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
}

const COFOCUS_FALLBACKS: Record<Language, string[]> = {
  en: [
    'Captain, {count} souls are focusing in this timeline with you.',
    'Gallery pulse: {count} captains co-focusing here right now.',
  ],
  'zh-TW': [
    '艦長，此刻有 {count} 位夥伴與你在此時空共專注。',
    '畫廊訊號：{count} 位艦長正在此處一起專注。',
  ],
  'zh-CN': [
    '舰长，此刻有 {count} 位伙伴与你在此时空共专注。',
    '画廊讯号：{count} 位舰长正在此处一起专注。',
  ],
  ja: ['艦長、今 {count} 人がこのタイムラインで集中しています。', 'ギャラリー：{count} 人が共集中中です。'],
  ko: ['함장님, 지금 {count} 명이 이 타임라인에서 함께 집중 중입니다.', '갤러리: {count} 명이 공동 집중 중.'],
  es: ['Capitán, {count} almas se concentran contigo en esta línea temporal.', 'Galería: {count} capitanes co-enfocados aquí.'],
  fr: ['Capitaine, {count} âmes se concentrent avec toi dans cette timeline.', 'Galerie : {count} capitaines co-focus ici.'],
  de: ['Kapitän, {count} Seelen fokussieren mit dir in dieser Zeitlinie.', 'Galerie: {count} Kapitäne co-fokussieren hier.'],
  th: [
    'Captain, {count} souls are focusing in this timeline with you.',
    'Gallery pulse: {count} captains co-focusing here right now.',
  ],
  vi: [
    'Captain, {count} souls are focusing in this timeline with you.',
    'Gallery pulse: {count} captains co-focusing here right now.',
  ],
}

export function getCoFocusDjFallback(locale: Language, count: number): string {
  const djLocale = djSpeechLocaleForUiLocale(locale)
  const templates = COFOCUS_FALLBACKS[djLocale] ?? COFOCUS_FALLBACKS.en
  const pick = templates[Math.floor(Date.now() / 86_400_000) % templates.length] ?? templates[0]
  return pick.replace(/\{count\}/g, String(count))
}
