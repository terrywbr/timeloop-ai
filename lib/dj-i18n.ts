import type { Language } from '@/lib/translations'
import type { MusicMoodId } from '@/lib/music-moods'

export type DjUiCopy = {
  label: string
  connecting: string
  voiceOn: string
  voiceOff: string
  subtitlesOnly: string
  autoDjComingSoon: string
  intervalCompanion: string
  personas: Record<MusicMoodId, { name: string; sceneTitle: string }>
  fallbacks: Record<MusicMoodId, string>
}

const djEn: DjUiCopy = {
  label: 'AI DJ',
  connecting: 'DJ connecting…',
  voiceOn: 'DJ voice on',
  voiceOff: 'DJ voice off',
  subtitlesOnly: 'Subtitles only',
  autoDjComingSoon: 'Auto DJ — coming soon',
  intervalCompanion: '30-min companion',
  personas: {
    'neon-tokyo': { name: 'Underground Rebel DJ', sceneTitle: 'Blade Runner: Neon Rain Rooftop' },
    'deep-night': { name: 'Houston Commander', sceneTitle: 'NASA ISS Observation Deck' },
    'deep-space': { name: 'Submarine AI', sceneTitle: 'Deep Ocean Submarine 3000ft' },
    'galactic-tavern': { name: 'Jazz Bartender', sceneTitle: '1920 Smoky Jazz Lounge' },
    'galactic-classical': { name: 'Digital Secretary', sceneTitle: 'Nordic Glass Cabin' },
    'retro-earth': { name: 'Outdoor Explorer', sceneTitle: 'Alpine Campfire Tent' },
  },
  fallbacks: {
    'neon-tokyo':
      'Captain, welcome to Neon Tokyo. Millions sleep but our cyber night is just beginning. Random frequency locked — it is {time}. Plug into the electronic wave and let us finish the code.',
    'deep-night':
      'Good afternoon, Captain. The deep cosmos is quiet; only your late-night rhythm remains. It is {time}. Surface noise is fully isolated — grab coffee and enter focus mode.',
    'deep-space':
      'Relax, Captain. Depth: 3000 feet. External noise shielded. It is {time}. Deep space hum frequency engaged — entering maximum focus.',
    'galactic-tavern':
      'Good afternoon, old friend. Busy day out there? Welcome back to your corner. I mixed a musical blind box for you — it is {time}. Shall we talk plans or dive into work?',
    'galactic-classical':
      'Captain, good afternoon. Audio tuned to galactic classical. It is {time}. Minimal space ready — let elegant piano guard your productivity tonight.',
    'retro-earth':
      'Time jump success! Back at the retro Earth alpine camp. Hear the campfire crackle — it is {time}. Pure nostalgic rhythms on camp broadcast. Let the voyage begin.',
  },
}

const djZhTw: DjUiCopy = {
  label: 'AI DJ',
  connecting: 'DJ 連線中…',
  voiceOn: 'DJ 語音開啟',
  voiceOff: 'DJ 語音關閉',
  subtitlesOnly: '僅字幕',
  autoDjComingSoon: 'Auto DJ — 即將推出',
  intervalCompanion: '30 分鐘陪伴',
  personas: {
    'neon-tokyo': { name: '地下電台反抗軍 DJ', sceneTitle: '銀翼殺手：霓虹雨夜天台' },
    'deep-night': { name: '休斯頓地面指揮官', sceneTitle: 'NASA 國際太空站觀景窗' },
    'deep-space': { name: '潛艇 AI', sceneTitle: '深海潛水艇 3000 呎' },
    'galactic-tavern': { name: '深夜酒吧調酒師', sceneTitle: '1920 煙燻爵士酒吧' },
    'galactic-classical': { name: '私人數位秘書', sceneTitle: '北歐林間玻璃屋' },
    'retro-earth': { name: '戶外探險家', sceneTitle: '阿爾卑斯篝火帳篷' },
  },
  fallbacks: {
    'neon-tokyo':
      '艦長，歡迎來到霓虹東京。這個城市有上千萬人睡了，但我們的賽博深夜才正要開始。隨機調頻已鎖定，現在時間 {time}，接入電子頻率，我們來把代碼搞定。',
    'deep-night':
      '下午好，艦長。深邃的宇宙很安靜，這裡只有最適合你的深夜節奏。現在時間 {time}，地表的所有日常喧囂已被完全隔離。喝杯咖啡，準備進入專注狀態吧。',
    'deep-space':
      '放鬆下來，艦長。目前深度：海底 3000 呎。已為您屏蔽外界所有雜音，現在時間 {time}。接入深空低鳴頻率，讓我們進入最深度的專注世界。',
    'galactic-tavern':
      '下午好，我的老朋友。今天外面一定很忙吧？歡迎回到你的專屬角落。我幫你調了一杯音樂盲盒，現在時間 {time}，想聊聊行程，還是直接開始下午的工作？',
    'galactic-classical':
      '艦長，下午好。音訊已調頻至銀河古典。現在時間 {time}，極簡空間已就位，讓優雅的鋼琴音符為您的生產力護航，開始今晚的極致專注吧。',
    'retro-earth':
      '時空跳躍成功！我們已重返復古地球的雪山營地。聽著劈啪作響的篝火，現在時間 {time}，用最純粹的懷舊節奏，跟著營地廣播開始今天的航程吧！',
  },
}

const djZhCn: DjUiCopy = {
  ...djZhTw,
  personas: {
    'neon-tokyo': { name: '地下电台反抗军 DJ', sceneTitle: '银翼杀手：霓虹雨夜天台' },
    'deep-night': { name: '休斯顿地面指挥官', sceneTitle: 'NASA 国际空间站观景窗' },
    'deep-space': { name: '潜艇 AI', sceneTitle: '深海潜水艇 3000 尺' },
    'galactic-tavern': { name: '深夜酒吧调酒师', sceneTitle: '1920 烟熏爵士酒吧' },
    'galactic-classical': { name: '私人数字秘书', sceneTitle: '北欧林间玻璃屋' },
    'retro-earth': { name: '户外探险家', sceneTitle: '阿尔卑斯篝火帐篷' },
  },
  fallbacks: {
    'neon-tokyo':
      '舰长，欢迎来到霓虹东京。这个城市有上千万人睡了，但我们的赛博深夜才正要开始。随机调频已锁定，现在时间 {time}，接入电子频率，我们来把代码搞定。',
    'deep-night':
      '下午好，舰长。深邃的宇宙很安静，这里只有最适合你的深夜节奏。现在时间 {time}，地表的所有日常喧嚣已被完全隔离。喝杯咖啡，准备进入专注状态吧。',
    'deep-space':
      '放松下来，舰长。目前深度：海底 3000 尺。已为您屏蔽外界所有杂音，现在时间 {time}。接入深空低鸣频率，让我们进入最深度的专注世界。',
    'galactic-tavern':
      '下午好，我的老朋友。今天外面一定很忙吧？欢迎回到你的专属角落。我帮你调了一杯音乐盲盒，现在时间 {time}，想聊聊行程，还是直接开始下午的工作？',
    'galactic-classical':
      '舰长，下午好。音频已调频至银河古典。现在时间 {time}，极简空间已就位，让优雅的钢琴音符为您的生产力护航，开始今晚的极致专注吧。',
    'retro-earth':
      '时空跳跃成功！我们已重返复古地球的雪山营地。听着劈啪作响的篝火，现在时间 {time}，用最纯粹的怀旧节奏，跟着营地广播开始今天的航程吧！',
  },
}

function cloneEnPersonas(names: Partial<Record<MusicMoodId, { name: string; sceneTitle: string }>>): DjUiCopy['personas'] {
  return { ...djEn.personas, ...names }
}

export const DJ_I18N: Record<Language, DjUiCopy> = {
  en: djEn,
  'zh-TW': djZhTw,
  'zh-CN': djZhCn,
  ja: {
    ...djEn,
    label: 'AI DJ',
    connecting: 'DJ接続中…',
    voiceOn: 'DJ音声オン',
    voiceOff: 'DJ音声オフ',
    subtitlesOnly: '字幕のみ',
    autoDjComingSoon: 'Auto DJ — 近日公開',
    intervalCompanion: '30分お付き添い',
    personas: cloneEnPersonas({
      'neon-tokyo': { name: 'アンダーグラウンドDJ', sceneTitle: 'ブレードランナー：ネオン雨の屋上' },
      'deep-night': { name: 'ヒューストン管制官', sceneTitle: 'ISS観測デッキ' },
      'deep-space': { name: '潜水艦AI', sceneTitle: '深海潜水艦3000ft' },
      'galactic-tavern': { name: 'ジャズバーテンダー', sceneTitle: '1920スモーキージャズラウンジ' },
      'galactic-classical': { name: 'デジタル秘書', sceneTitle: '北欧ガラスキャビン' },
      'retro-earth': { name: 'アウトドア探検家', sceneTitle: 'アルプスキャンプファイア' },
    }),
  },
  ko: {
    ...djEn,
    connecting: 'DJ 연결 중…',
    voiceOn: 'DJ 음성 켜짐',
    voiceOff: 'DJ 음성 꺼짐',
    subtitlesOnly: '자막만',
    autoDjComingSoon: 'Auto DJ — 곧 출시',
    intervalCompanion: '30분 동행',
    personas: cloneEnPersonas({
      'neon-tokyo': { name: '언더그라운드 DJ', sceneTitle: '블레이드 러너: 네온 비 옥상' },
      'deep-night': { name: '휴스턴 지상 관제', sceneTitle: 'ISS 관측창' },
      'deep-space': { name: '잠수함 AI', sceneTitle: '심해 잠수함 3000ft' },
      'galactic-tavern': { name: '재즈 바텐더', sceneTitle: '1920 스모키 재즈 라운지' },
      'galactic-classical': { name: '디지털 비서', sceneTitle: '북유럽 글래스 캐빈' },
      'retro-earth': { name: '아웃도어 탐험가', sceneTitle: '알프스 캠프파이어' },
    }),
  },
  es: {
    ...djEn,
    connecting: 'Conectando DJ…',
    voiceOn: 'Voz DJ activada',
    voiceOff: 'Voz DJ desactivada',
    subtitlesOnly: 'Solo subtítulos',
    autoDjComingSoon: 'Auto DJ — próximamente',
    intervalCompanion: 'Compañía 30 min',
  },
  fr: {
    ...djEn,
    connecting: 'Connexion DJ…',
    voiceOn: 'Voix DJ activée',
    voiceOff: 'Voix DJ désactivée',
    subtitlesOnly: 'Sous-titres seulement',
    autoDjComingSoon: 'Auto DJ — bientôt',
    intervalCompanion: 'Compagnon 30 min',
  },
  de: {
    ...djEn,
    connecting: 'DJ verbindet…',
    voiceOn: 'DJ-Stimme an',
    voiceOff: 'DJ-Stimme aus',
    subtitlesOnly: 'Nur Untertitel',
    autoDjComingSoon: 'Auto DJ — demnächst',
    intervalCompanion: '30-Min-Begleitung',
  },
}

export function fillDjTemplate(
  template: string,
  vars: { time: string; moodTitle?: string; stationName?: string },
): string {
  return template
    .replace(/\{time\}/g, vars.time)
    .replace(/\{moodTitle\}/g, vars.moodTitle ?? '')
    .replace(/\{stationName\}/g, vars.stationName ?? '')
}

export function getDjFallback(
  locale: Language,
  moodId: MusicMoodId,
  vars: { time: string; moodTitle?: string; stationName?: string },
): string {
  const copy = DJ_I18N[locale] ?? DJ_I18N.en
  return fillDjTemplate(copy.fallbacks[moodId], vars)
}

export function formatDjLocalTime(locale: Language, date = new Date()): string {
  try {
    return date.toLocaleTimeString(locale === 'zh-CN' ? 'zh-CN' : locale === 'zh-TW' ? 'zh-TW' : locale, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: locale === 'en',
    })
  } catch {
    return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  }
}
