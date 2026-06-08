import type { Language } from '@/lib/translations'

export type StreamerOverlayTemplate = {
  id: string
  label: string
  line1: string
  line2: string
}

export const streamerOverlayTemplates: Record<Language, StreamerOverlayTemplate[]> = {
  en: [
    {
      id: 'late-night-focus',
      label: 'Late-night focus',
      line1: '🌙 Late-night focus room',
      line2: '✨ Follow for daily calm streams',
    },
    {
      id: 'cozy-lofi',
      label: 'Cozy lofi',
      line1: '🎧 Cozy lofi vibes all night',
      line2: '💜 Link in bio — join the loop',
    },
    {
      id: 'study-with-me',
      label: 'Study with me',
      line1: '📚 Study with me — deep focus',
      line2: '🔔 Follow for live sessions',
    },
  ],
  'zh-TW': [
    {
      id: 'late-night-focus',
      label: '深夜專注',
      line1: '🌙 深夜專注艙',
      line2: '✨ 追蹤不迷路｜主頁有驚喜',
    },
    {
      id: 'cozy-lofi',
      label: '療癒電台',
      line1: '🎧 深夜療癒電台',
      line2: '💜 主頁連結｜一起專注',
    },
    {
      id: 'study-with-me',
      label: '讀書直播',
      line1: '📚 讀書陪伴中',
      line2: '🔔 追蹤每晚開播',
    },
  ],
  'zh-CN': [
    {
      id: 'late-night-focus',
      label: '深夜专注',
      line1: '🌙 深夜专注舱',
      line2: '✨ 关注不迷路｜主页有惊喜',
    },
    {
      id: 'cozy-lofi',
      label: '治愈电台',
      line1: '🎧 深夜治愈电台',
      line2: '💜 主页链接｜一起专注',
    },
    {
      id: 'study-with-me',
      label: '读书直播',
      line1: '📚 读书陪伴中',
      line2: '🔔 关注每晚开播',
    },
  ],
  ja: [
    {
      id: 'late-night-focus',
      label: '深夜作業',
      line1: '🌙 深夜の作業用BGM',
      line2: '✨ フォローで毎夜配信',
    },
    {
      id: 'cozy-lofi',
      label: 'ロフィ',
      line1: '🎧 夜更かしロフィ配信',
      line2: '💜 プロフィールから参加',
    },
    {
      id: 'study-with-me',
      label: '勉強配信',
      line1: '📚 一緒に勉強しよう',
      line2: '🔔 フォローで通知オン',
    },
  ],
  ko: [
    {
      id: 'late-night-focus',
      label: '심야 집중',
      line1: '🌙 심야 집중룸',
      line2: '✨ 팔로우하고 함께해요',
    },
    {
      id: 'cozy-lofi',
      label: '로파이',
      line1: '🎧 밤샘 로파이 라이브',
      line2: '💜 프로필 링크 확인',
    },
    {
      id: 'study-with-me',
      label: '공부 방송',
      line1: '📚 함께 공부해요',
      line2: '🔔 팔로우하고 알림 받기',
    },
  ],
  es: [
    {
      id: 'late-night-focus',
      label: 'Sala nocturna',
      line1: '🌙 Sala nocturna',
      line2: '✨ Sígueme — link en bio',
    },
    {
      id: 'cozy-lofi',
      label: 'Lo-fi',
      line1: '🎧 Lo-fi nocturno en vivo',
      line2: '💜 Enlace en bio',
    },
    {
      id: 'study-with-me',
      label: 'Estudia conmigo',
      line1: '📚 Estudia conmigo',
      line2: '🔔 Sígueme para avisos',
    },
  ],
  fr: [
    {
      id: 'late-night-focus',
      label: 'Salle de focus',
      line1: '🌙 Salle de focus',
      line2: '✨ Abonne-toi — lien en bio',
    },
    {
      id: 'cozy-lofi',
      label: 'Lo-fi',
      line1: '🎧 Lo-fi nocturne en direct',
      line2: '💜 Lien dans la bio',
    },
    {
      id: 'study-with-me',
      label: 'Étudie avec moi',
      line1: '📚 Étudie avec moi',
      line2: '🔔 Abonne-toi pour les lives',
    },
  ],
  de: [
    {
      id: 'late-night-focus',
      label: 'Nacht-Fokus',
      line1: '🌙 Nacht-Fokusraum',
      line2: '✨ Folge für Daily Streams',
    },
    {
      id: 'cozy-lofi',
      label: 'Lo-fi',
      line1: '🎧 Nacht-Lo-fi Live',
      line2: '💜 Link in Bio',
    },
    {
      id: 'study-with-me',
      label: 'Lern-Stream',
      line1: '📚 Lern mit mir',
      line2: '🔔 Folgen für Benachrichtigungen',
    },
  ],
  th: [
    {
      id: 'late-night-focus',
      label: 'โฟกัสยามดึก',
      line1: '🌙 ห้องโฟกัสยามดึก',
      line2: '✨ ติดตามไม่หลง — ลิงก์ในไบโอ',
    },
    {
      id: 'cozy-lofi',
      label: 'โลฟไอยามดึก',
      line1: '🎧 ไลฟ์โลฟไอยามดึก',
      line2: '💜 ติดตามเพื่อสตรีมทุกคืน',
    },
    {
      id: 'study-with-me',
      label: 'เรียนด้วยกัน',
      line1: '📚 เรียนด้วยกัน — โฟกัสลึก',
      line2: '🔔 ติดตามเพื่อแจ้งเตือนไลฟ์',
    },
  ],
  vi: [
    {
      id: 'late-night-focus',
      label: 'Tập trung đêm khuya',
      line1: '🌙 Phòng tập trung đêm khuya',
      line2: '✨ Theo dõi — link trong bio',
    },
    {
      id: 'cozy-lofi',
      label: 'Lo-fi đêm khuya',
      line1: '🎧 Live lo-fi đêm khuya',
      line2: '💜 Theo dõi để stream mỗi đêm',
    },
    {
      id: 'study-with-me',
      label: 'Học cùng nhau',
      line1: '📚 Học cùng nhau — tập trung sâu',
      line2: '🔔 Theo dõi để nhận thông báo live',
    },
  ],
}

export function getDefaultStreamerOverlayTemplate(language: Language) {
  return streamerOverlayTemplates[language][0] ?? streamerOverlayTemplates.en[0]
}
