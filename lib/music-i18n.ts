import type { Language } from '@/lib/translations'
import type { MusicMoodId } from '@/lib/music-moods'

export type MusicMoodCopy = {
  title: string
  subtitle: string
  description: string
}

export type MusicExtensionCopy = {
  onboarding: {
    title: string
    subtitle: string
    next: string
  }
  changeMoods: string
  nextStation: string
  scanning: string
  moods: Record<MusicMoodId, MusicMoodCopy>
}

const moodEn: Record<MusicMoodId, MusicMoodCopy> = {
  'neon-tokyo': {
    title: 'Neon Tokyo',
    subtitle: 'Synthwave / Cyberpunk',
    description: 'High-speed neon nights and sci-fi drive energy.',
  },
  'deep-night': {
    title: 'Deep Night Cosmos',
    subtitle: 'Lo-Fi Chillhop',
    description: 'Focus flows for coding, work, and late-night reading.',
  },
  'deep-space': {
    title: 'Deep Space Hum',
    subtitle: 'Ambient / Drone',
    description: 'Vast space ambience for sleep and meditation.',
  },
  'galactic-tavern': {
    title: 'Galactic Tavern',
    subtitle: 'Jazz / Blues',
    description: 'Relaxed, smoky tunes for unwinding.',
  },
  'galactic-classical': {
    title: 'Galactic Classical',
    subtitle: 'Classical / Piano',
    description: 'Piano and orchestral focus for deep concentration.',
  },
  'retro-earth': {
    title: 'Retro Earth',
    subtitle: '80s / 90s Retro',
    description: 'Nostalgic hits from classic decades.',
  },
}

const moodZhTw: Record<MusicMoodId, MusicMoodCopy> = {
  'neon-tokyo': {
    title: '霓虹東京',
    subtitle: 'Synthwave / Cyberpunk',
    description: '適合想開快車、追求科技感的霓虹夜。',
  },
  'deep-night': {
    title: '深夜宇宙',
    subtitle: 'Lo-Fi Chillhop',
    description: '適合寫程式、工作、讀書的深夜節奏。',
  },
  'deep-space': {
    title: '深空低鳴',
    subtitle: 'Ambient / Drone',
    description: '太空環境音，極度助眠、冥想。',
  },
  'galactic-tavern': {
    title: '星際小酒館',
    subtitle: 'Jazz / Blues',
    description: '放鬆、微醺的小調時光。',
  },
  'galactic-classical': {
    title: '銀河古典',
    subtitle: 'Classical / Piano',
    description: '鋼琴、史詩交響，適合專注。',
  },
  'retro-earth': {
    title: '復古地球',
    subtitle: '80s / 90s Retro',
    description: '懷舊金曲電台，重返黃金年代。',
  },
}

const moodZhCn: Record<MusicMoodId, MusicMoodCopy> = {
  'neon-tokyo': { title: '霓虹东京', subtitle: 'Synthwave / Cyberpunk', description: '适合想开快车、追求科技感的霓虹夜。' },
  'deep-night': { title: '深夜宇宙', subtitle: 'Lo-Fi Chillhop', description: '适合写程序、工作、读书的深夜节奏。' },
  'deep-space': { title: '深空低鸣', subtitle: 'Ambient / Drone', description: '太空环境音，极度助眠、冥想。' },
  'galactic-tavern': { title: '星际小酒馆', subtitle: 'Jazz / Blues', description: '放松、微醺的小调时光。' },
  'galactic-classical': { title: '银河古典', subtitle: 'Classical / Piano', description: '钢琴、史诗交响，适合专注。' },
  'retro-earth': { title: '复古地球', subtitle: '80s / 90s Retro', description: '怀旧金曲电台，重返黄金年代。' },
}

const moodJa: Record<MusicMoodId, MusicMoodCopy> = {
  'neon-tokyo': { title: 'ネオン東京', subtitle: 'Synthwave / Cyberpunk', description: '高速ドライブとサイバーパンクの夜。' },
  'deep-night': { title: '深夜宇宙', subtitle: 'Lo-Fi Chillhop', description: 'コーディング、作業、読書に。' },
  'deep-space': { title: '深宇宙の低鳴', subtitle: 'Ambient / Drone', description: '睡眠と瞑想のための宇宙アンビエント。' },
  'galactic-tavern': { title: '銀河酒場', subtitle: 'Jazz / Blues', description: 'くつろぎのジャズとブルース。' },
  'galactic-classical': { title: '銀河クラシック', subtitle: 'Classical / Piano', description: '集中力を高めるピアノと管弦楽。' },
  'retro-earth': { title: 'レトロ地球', subtitle: '80s / 90s Retro', description: '懐かしの80・90年代ヒット。' },
}

const moodKo: Record<MusicMoodId, MusicMoodCopy> = {
  'neon-tokyo': { title: '네온 도쿄', subtitle: 'Synthwave / Cyberpunk', description: '속도감 있는 사이버펑크의 밤.' },
  'deep-night': { title: '심야 우주', subtitle: 'Lo-Fi Chillhop', description: '코딩, 작업, 독서에 어울리는 비트.' },
  'deep-space': { title: '심우 저음', subtitle: 'Ambient / Drone', description: '수면과 명상을 위한 우주 앰비언트.' },
  'galactic-tavern': { title: '은하 주점', subtitle: 'Jazz / Blues', description: '편안한 재즈와 블루스.' },
  'galactic-classical': { title: '은하 클래식', subtitle: 'Classical / Piano', description: '집중을 위한 피아노와 오케스트라.' },
  'retro-earth': { title: '레트로 지구', subtitle: '80s / 90s Retro', description: '80·90년대 추억의 히트곡.' },
}

const moodEs: Record<MusicMoodId, MusicMoodCopy> = {
  'neon-tokyo': { title: 'Tokio Neón', subtitle: 'Synthwave / Cyberpunk', description: 'Noches neón y energía futurista.' },
  'deep-night': { title: 'Cosmos Nocturno', subtitle: 'Lo-Fi Chillhop', description: 'Para programar, trabajar y leer.' },
  'deep-space': { title: 'Zumbido Espacial', subtitle: 'Ambient / Drone', description: 'Ambiente espacial para dormir y meditar.' },
  'galactic-tavern': { title: 'Taberna Galáctica', subtitle: 'Jazz / Blues', description: 'Jazz relajado y blues suave.' },
  'galactic-classical': { title: 'Clásica Galáctica', subtitle: 'Classical / Piano', description: 'Piano y orquesta para concentrarse.' },
  'retro-earth': { title: 'Tierra Retro', subtitle: '80s / 90s Retro', description: 'Éxitos nostálgicos de los 80 y 90.' },
}

const moodFr: Record<MusicMoodId, MusicMoodCopy> = {
  'neon-tokyo': { title: 'Tokyo Néon', subtitle: 'Synthwave / Cyberpunk', description: 'Nuits néon et énergie cyberpunk.' },
  'deep-night': { title: 'Cosmos Nocturne', subtitle: 'Lo-Fi Chillhop', description: 'Pour coder, travailler et lire.' },
  'deep-space': { title: 'Grondement Spatial', subtitle: 'Ambient / Drone', description: 'Ambiance spatiale pour dormir et méditer.' },
  'galactic-tavern': { title: 'Taverne Galactique', subtitle: 'Jazz / Blues', description: 'Jazz détente et blues doux.' },
  'galactic-classical': { title: 'Classique Galactique', subtitle: 'Classical / Piano', description: 'Piano et orchestre pour la concentration.' },
  'retro-earth': { title: 'Terre Rétro', subtitle: '80s / 90s Retro', description: 'Hits nostalgiques des années 80-90.' },
}

const moodDe: Record<MusicMoodId, MusicMoodCopy> = {
  'neon-tokyo': { title: 'Neon Tokio', subtitle: 'Synthwave / Cyberpunk', description: 'Neonnächte und Cyberpunk-Energie.' },
  'deep-night': { title: 'Nachtkosmos', subtitle: 'Lo-Fi Chillhop', description: 'Zum Coden, Arbeiten und Lesen.' },
  'deep-space': { title: 'Weltraum-Drone', subtitle: 'Ambient / Drone', description: 'Weltraum-Ambiente für Schlaf und Meditation.' },
  'galactic-tavern': { title: 'Galaktische Taverne', subtitle: 'Jazz / Blues', description: 'Entspanntes Jazz und Blues.' },
  'galactic-classical': { title: 'Galaktische Klassik', subtitle: 'Classical / Piano', description: 'Klavier und Orchester zum Fokussieren.' },
  'retro-earth': { title: 'Retro Erde', subtitle: '80s / 90s Retro', description: 'Nostalgische Hits der 80er und 90er.' },
}

export const MUSIC_I18N: Record<Language, MusicExtensionCopy> = {
  en: {
    onboarding: {
      title: 'Choose your music moods',
      subtitle: 'Select one or more — Next will tune random stations from your picks.',
      next: 'Next',
    },
    changeMoods: 'Change music moods',
    nextStation: 'Next station',
    scanning: 'Scanning frequencies…',
    moods: moodEn,
  },
  'zh-TW': {
    onboarding: {
      title: '選擇你喜歡的音樂情境',
      subtitle: '可複選多個 — 點 Next 將依偏好隨機調頻全球電台。',
      next: 'Next',
    },
    changeMoods: '重新選擇音樂情境',
    nextStation: '下一台',
    scanning: '正在掃描頻率…',
    moods: moodZhTw,
  },
  'zh-CN': {
    onboarding: {
      title: '选择你喜欢的音乐情境',
      subtitle: '可多选 — 点 Next 将依偏好随机调频全球电台。',
      next: 'Next',
    },
    changeMoods: '重新选择音乐情境',
    nextStation: '下一台',
    scanning: '正在扫描频率…',
    moods: moodZhCn,
  },
  ja: {
    onboarding: { title: '音楽ムードを選択', subtitle: '複数選択可 — Nextで好みの局からランダム再生。', next: 'Next' },
    changeMoods: 'ムードを変更',
    nextStation: '次の局',
    scanning: '周波数をスキャン中…',
    moods: moodJa,
  },
  ko: {
    onboarding: { title: '음악 무드 선택', subtitle: '복수 선택 가능 — Next로 무작위 방송.', next: 'Next' },
    changeMoods: '무드 변경',
    nextStation: '다음 방송',
    scanning: '주파수 스캔 중…',
    moods: moodKo,
  },
  es: {
    onboarding: { title: 'Elige tus moods musicales', subtitle: 'Selección múltiple — Next sintoniza al azar.', next: 'Next' },
    changeMoods: 'Cambiar moods',
    nextStation: 'Siguiente emisora',
    scanning: 'Escaneando frecuencias…',
    moods: moodEs,
  },
  fr: {
    onboarding: { title: 'Choisissez vos ambiances', subtitle: 'Sélection multiple — Next règle au hasard.', next: 'Next' },
    changeMoods: 'Changer les ambiances',
    nextStation: 'Station suivante',
    scanning: 'Balayage des fréquences…',
    moods: moodFr,
  },
  de: {
    onboarding: { title: 'Musikstimmungen wählen', subtitle: 'Mehrfachauswahl — Next wählt zufällig.', next: 'Next' },
    changeMoods: 'Stimmungen ändern',
    nextStation: 'Nächster Sender',
    scanning: 'Frequenzen scannen…',
    moods: moodDe,
  },
}
