import type { Language } from '@/lib/translations'
import type { MusicMoodId } from '@/lib/music-moods'
import { DJ_PRESET_LINES, pickRandomPresetLine } from '@/lib/dj-preset-lines'
import { MUSIC_MOOD_IDS } from '@/lib/music-moods'

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

function buildStaticFallbacks(presetLocale: 'en' | 'zh'): Record<MusicMoodId, string> {
  return Object.fromEntries(
    MUSIC_MOOD_IDS.map((id) => [id, DJ_PRESET_LINES[id][presetLocale][0]!]),
  ) as Record<MusicMoodId, string>
}

const STATIC_EN_FALLBACKS = buildStaticFallbacks('en')
const STATIC_ZH_FALLBACKS = buildStaticFallbacks('zh')

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
  fallbacks: STATIC_EN_FALLBACKS,
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
  fallbacks: STATIC_ZH_FALLBACKS,
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
  fallbacks: STATIC_ZH_FALLBACKS,
}

const djJa: DjUiCopy = {
  label: 'AI DJ',
  connecting: 'DJ接続中…',
  voiceOn: 'DJ音声オン',
  voiceOff: 'DJ音声オフ',
  subtitlesOnly: '字幕のみ',
  autoDjComingSoon: 'Auto DJ — 近日公開',
  intervalCompanion: '30分お付き添い',
  personas: {
    'neon-tokyo': { name: 'アンダーグラウンドDJ', sceneTitle: 'ブレードランナー：ネオン雨の屋上' },
    'deep-night': { name: 'ヒューストン管制官', sceneTitle: 'ISS観測デッキ' },
    'deep-space': { name: '潜水艦AI', sceneTitle: '深海潜水艦3000ft' },
    'galactic-tavern': { name: 'ジャズバーテンダー', sceneTitle: '1920スモーキージャズラウンジ' },
    'galactic-classical': { name: 'デジタル秘書', sceneTitle: '北欧ガラスキャビン' },
    'retro-earth': { name: 'アウトドア探検家', sceneTitle: 'アルプスキャンプファイア' },
  },
  fallbacks: STATIC_EN_FALLBACKS,
}

const djKo: DjUiCopy = {
  label: 'AI DJ',
  connecting: 'DJ 연결 중…',
  voiceOn: 'DJ 음성 켜짐',
  voiceOff: 'DJ 음성 꺼짐',
  subtitlesOnly: '자막만',
  autoDjComingSoon: 'Auto DJ — 곧 출시',
  intervalCompanion: '30분 동행',
  personas: {
    'neon-tokyo': { name: '언더그라운드 DJ', sceneTitle: '블레이드 러너: 네온 비 옥상' },
    'deep-night': { name: '휴스턴 지상 관제', sceneTitle: 'ISS 관측창' },
    'deep-space': { name: '잠수함 AI', sceneTitle: '심해 잠수함 3000ft' },
    'galactic-tavern': { name: '재즈 바텐더', sceneTitle: '1920 스모키 재즈 라운지' },
    'galactic-classical': { name: '디지털 비서', sceneTitle: '북유럽 글래스 캐빈' },
    'retro-earth': { name: '아웃도어 탐험가', sceneTitle: '알프스 캠프파이어' },
  },
  fallbacks: STATIC_EN_FALLBACKS,
}

const djEs: DjUiCopy = {
  label: 'AI DJ',
  connecting: 'Conectando DJ…',
  voiceOn: 'Voz DJ activada',
  voiceOff: 'Voz DJ desactivada',
  subtitlesOnly: 'Solo subtítulos',
  autoDjComingSoon: 'Auto DJ — próximamente',
  intervalCompanion: 'Compañía 30 min',
  personas: {
    'neon-tokyo': { name: 'DJ Rebelde Underground', sceneTitle: 'Blade Runner: Azotea bajo la lluvia neón' },
    'deep-night': { name: 'Comandante de Houston', sceneTitle: 'Cubierta de observación ISS' },
    'deep-space': { name: 'IA Submarina', sceneTitle: 'Submarino de aguas profundas 3000ft' },
    'galactic-tavern': { name: 'Camarero de Jazz', sceneTitle: 'Salón de jazz ahumado 1920' },
    'galactic-classical': { name: 'Secretaria Digital', sceneTitle: 'Cabaña de cristal nórdica' },
    'retro-earth': { name: 'Explorador Outdoor', sceneTitle: 'Tienda junto a la hoguera alpina' },
  },
  fallbacks: STATIC_EN_FALLBACKS,
}

const djFr: DjUiCopy = {
  label: 'AI DJ',
  connecting: 'Connexion DJ…',
  voiceOn: 'Voix DJ activée',
  voiceOff: 'Voix DJ désactivée',
  subtitlesOnly: 'Sous-titres seulement',
  autoDjComingSoon: 'Auto DJ — bientôt',
  intervalCompanion: 'Compagnon 30 min',
  personas: {
    'neon-tokyo': { name: 'DJ Rebelle Underground', sceneTitle: 'Blade Runner : Toit sous la pluie néon' },
    'deep-night': { name: 'Commandant Houston', sceneTitle: 'Pont d\'observation ISS' },
    'deep-space': { name: 'IA Sous-marine', sceneTitle: 'Sous-marin des profondeurs 3000ft' },
    'galactic-tavern': { name: 'Barman Jazz', sceneTitle: 'Salon jazz enfumé 1920' },
    'galactic-classical': { name: 'Secrétaire Numérique', sceneTitle: 'Cabane vitrée nordique' },
    'retro-earth': { name: 'Explorateur Outdoor', sceneTitle: 'Tente au feu de camp alpin' },
  },
  fallbacks: STATIC_EN_FALLBACKS,
}

const djDe: DjUiCopy = {
  label: 'AI DJ',
  connecting: 'DJ verbindet…',
  voiceOn: 'DJ-Stimme an',
  voiceOff: 'DJ-Stimme aus',
  subtitlesOnly: 'Nur Untertitel',
  autoDjComingSoon: 'Auto DJ — demnächst',
  intervalCompanion: '30-Min-Begleitung',
  personas: {
    'neon-tokyo': { name: 'Underground-Rebell-DJ', sceneTitle: 'Blade Runner: Neonregen-Dach' },
    'deep-night': { name: 'Houston-Bodenkommandant', sceneTitle: 'ISS-Beobachtungsdeck' },
    'deep-space': { name: 'U-Boot-KI', sceneTitle: 'Tiefsee-U-Boot 3000ft' },
    'galactic-tavern': { name: 'Jazz-Barkeeper', sceneTitle: '1920 Rauchige Jazz-Lounge' },
    'galactic-classical': { name: 'Digitale Sekretärin', sceneTitle: 'Nordische Glashütte' },
    'retro-earth': { name: 'Outdoor-Entdecker', sceneTitle: 'Alpines Lagerfeuer-Zelt' },
  },
  fallbacks: STATIC_EN_FALLBACKS,
}

const djTh: DjUiCopy = {
  label: 'AI DJ',
  connecting: 'DJ กำลังเชื่อมต่อ…',
  voiceOn: 'เปิดเสียง DJ',
  voiceOff: 'ปิดเสียง DJ',
  subtitlesOnly: 'คำบรรยายเท่านั้น',
  autoDjComingSoon: 'Auto DJ — เร็วๆ นี้',
  intervalCompanion: 'เพื่อนร่วมทาง 30 นาที',
  personas: {
    'neon-tokyo': { name: 'Underground Rebel DJ', sceneTitle: 'Blade Runner: Neon Rain Rooftop' },
    'deep-night': { name: 'Houston Commander', sceneTitle: 'NASA ISS Observation Deck' },
    'deep-space': { name: 'Submarine AI', sceneTitle: 'Deep Ocean Submarine 3000ft' },
    'galactic-tavern': { name: 'Jazz Bartender', sceneTitle: '1920 Smoky Jazz Lounge' },
    'galactic-classical': { name: 'Digital Secretary', sceneTitle: 'Nordic Glass Cabin' },
    'retro-earth': { name: 'Outdoor Explorer', sceneTitle: 'Alpine Campfire Tent' },
  },
  fallbacks: STATIC_EN_FALLBACKS,
}

const djVi: DjUiCopy = {
  label: 'AI DJ',
  connecting: 'DJ đang kết nối…',
  voiceOn: 'Bật giọng DJ',
  voiceOff: 'Tắt giọng DJ',
  subtitlesOnly: 'Chỉ phụ đề',
  autoDjComingSoon: 'Auto DJ — sắp ra mắt',
  intervalCompanion: 'Đồng hành 30 phút',
  personas: {
    'neon-tokyo': { name: 'Underground Rebel DJ', sceneTitle: 'Blade Runner: Neon Rain Rooftop' },
    'deep-night': { name: 'Houston Commander', sceneTitle: 'NASA ISS Observation Deck' },
    'deep-space': { name: 'Submarine AI', sceneTitle: 'Deep Ocean Submarine 3000ft' },
    'galactic-tavern': { name: 'Jazz Bartender', sceneTitle: '1920 Smoky Jazz Lounge' },
    'galactic-classical': { name: 'Digital Secretary', sceneTitle: 'Nordic Glass Cabin' },
    'retro-earth': { name: 'Outdoor Explorer', sceneTitle: 'Alpine Campfire Tent' },
  },
  fallbacks: STATIC_EN_FALLBACKS,
}

export const DJ_I18N: Record<Language, DjUiCopy> = {
  en: djEn,
  'zh-TW': djZhTw,
  'zh-CN': djZhCn,
  ja: djJa,
  ko: djKo,
  es: djEs,
  fr: djFr,
  de: djDe,
  th: djTh,
  vi: djVi,
}

export const DJ_SUPPORTED_LANGUAGES = Object.keys(DJ_I18N) as Language[]

export function getDjFallback(locale: Language, moodId: MusicMoodId): string {
  return pickRandomPresetLine(moodId, locale)
}

/** UI clock helper — not used for TTS (time is HUD-only). */
export function formatDjLocalTime(locale: Language, date = new Date()): string {
  try {
    const timeLocale =
      locale === 'zh-CN' ? 'zh-CN' : locale === 'zh-TW' ? 'zh-TW' : locale === 'th' ? 'th-TH' : locale === 'vi' ? 'vi-VN' : locale
    return date.toLocaleTimeString(timeLocale, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: locale === 'en' || locale === 'th' || locale === 'vi',
    })
  } catch {
    return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
  }
}
