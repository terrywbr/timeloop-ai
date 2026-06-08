import type { Language } from '@/lib/translations'
import type { MusicMoodId } from '@/lib/music-moods'
import { djSpeechLocaleForUiLocale } from '@/lib/dj-speech-locale'

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
  fallbacks: {
    'neon-tokyo':
      '艦長、ネオン東京へようこそ。街は眠っても、俺たちのサイバーな夜は始まったばかりだ。ランダム周波数ロック済み、現在 {time}。電子波に接続して、コードを仕上げよう。',
    'deep-night':
      'こんにちは、艦長。深宇宙は静かだ。この時間帯に合った深夜リズムだけが残っている。現在 {time}。地上の雑音は完全に遮断された。コーヒーを片手に、集中モードへ入ろう。',
    'deep-space':
      'リラックスしてください、艦長。深度3000フィート。外部ノイズは遮断済み、現在 {time}。深空低周波に接続——最大集中モードへ。',
    'galactic-tavern':
      'こんにちは、古い友よ。今日は忙しかっただろう？ あなたの席へようこそ。音楽のブラインドボックスを用意した。現在 {time}。予定を話すか、すぐ仕事に入るか？',
    'galactic-classical':
      '艦長、こんにちは。銀河クラシックにチューニング済み。現在 {time}。ミニマル空間の準備完了——優雅なピアノが今夜の生産性を守る。',
    'retro-earth':
      'タイムジャンプ成功！ レトロ地球のアルプスキャンプに戻った。焚き火のパチパチ、現在 {time}。キャンプ放送の懐かしいリズムで、今日の航海を始めよう。',
  },
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
  fallbacks: {
    'neon-tokyo':
      '함장님, 네온 도쿄에 오신 것을 환영합니다. 수백만 명이 잠들었지만, 우리의 사이버 밤은 이제 시작입니다. 랜덤 주파수 잠금, 지금 {time}. 전자 파동에 접속해 코드를 마무리합시다.',
    'deep-night':
      '안녕하세요, 함장님. 깊은 우주는 고요합니다. 지금 {time}, 지표면의 소음은 완전히 차단되었습니다. 커피 한 잔과 함께 집중 모드로 들어가세요.',
    'deep-space':
      '긴장을 풀으세요, 함장님. 수심 3000피트. 외부 소음 차단 완료, 지금 {time}. 심우 저주파에 접속 — 최대 집중 모드로 진입합니다.',
    'galactic-tavern':
      '안녕, 오랜 친구. 오늘 바깥은 바빴지? 네 자리로 돌아온 것을 환영해. 음악 블라인드 박스를 준비했어. 지금 {time}. 일정을 이야기할까, 바로 일 시작할까?',
    'galactic-classical':
      '함장님, 안녕하세요. 은하 클래식으로 튜닝 완료. 지금 {time}. 미니멀 공간 준비됐습니다 — 우아한 피아노가 오늘 밤의 생산성을 지켜드립니다.',
    'retro-earth':
      '시간 점프 성공! 레트로 지구 알프스 캠프에 돌아왔습니다. 모닥불 소리, 지금 {time}. 캠프 방송의 향수 어린 리듬으로 오늘의 항해를 시작합시다.',
  },
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
  fallbacks: {
    'neon-tokyo':
      'Capitán, bienvenido a Tokio Neón. Millones duermen, pero nuestra noche cibernética acaba de empezar. Frecuencia aleatoria bloqueada — son las {time}. Conéctate a la onda electrónica y terminemos el código.',
    'deep-night':
      'Buenas tardes, Capitán. El cosmos profundo está en silencio; solo queda tu ritmo nocturno. Son las {time}. Ruido superficial aislado — toma un café y entra en modo enfoque.',
    'deep-space':
      'Relájate, Capitán. Profundidad: 3000 pies. Ruido externo bloqueado. Son las {time}. Frecuencia de zumbido espacial activada — entrando en máximo enfoque.',
    'galactic-tavern':
      'Buenas tardes, viejo amigo. ¿Día ajetreado? Bienvenido a tu rincón. Preparé una caja musical sorpresa — son las {time}. ¿Hablamos de planes o empezamos a trabajar?',
    'galactic-classical':
      'Capitán, buenas tardes. Audio sintonizado a clásica galáctica. Son las {time}. Espacio minimalista listo — deja que el piano elegante guarde tu productividad.',
    'retro-earth':
      '¡Salto temporal exitoso! De vuelta en el campamento alpino retro. Escucha la hoguera — son las {time}. Ritmos nostálgicos en la radio del campamento. ¡Que comience el viaje!',
  },
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
  fallbacks: {
    'neon-tokyo':
      'Capitaine, bienvenue à Tokyo Néon. Des millions dorment, mais notre nuit cyber vient de commencer. Fréquence aléatoire verrouillée — il est {time}. Branchez-vous sur l\'onde électronique et finissons le code.',
    'deep-night':
      'Bon après-midi, Capitaine. Le cosmos profond est silencieux ; seul votre rythme nocturne reste. Il est {time}. Bruit de surface isolé — prenez un café et entrez en mode focus.',
    'deep-space':
      'Détendez-vous, Capitaine. Profondeur : 3000 pieds. Bruit externe bloqué. Il est {time}. Fréquence de bourdonnement spatial activée — concentration maximale.',
    'galactic-tavern':
      'Bon après-midi, vieil ami. Journée chargée dehors ? Bienvenue dans votre coin. J\'ai préparé une boîte musicale surprise — il est {time}. On parle plans ou on attaque le travail ?',
    'galactic-classical':
      'Capitaine, bon après-midi. Audio réglé sur classique galactique. Il est {time}. Espace minimal prêt — laissez le piano élégant garder votre productivité.',
    'retro-earth':
      'Saut temporel réussi ! Retour au camp alpin rétro. Écoutez le feu de camp — il est {time}. Rythmes nostalgiques à la radio du camp. Que le voyage commence !',
  },
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
  fallbacks: {
    'neon-tokyo':
      'Kapitän, willkommen in Neon Tokio. Millionen schlafen, aber unsere Cyber-Nacht beginnt gerade. Zufallsfrequenz gesperrt — es ist {time}. Schalte dich auf die elektronische Welle und lass uns den Code fertigstellen.',
    'deep-night':
      'Guten Tag, Kapitän. Der tiefe Kosmos ist still; nur dein Nachtrhythmus bleibt. Es ist {time}. Oberflächenlärm vollständig isoliert — nimm einen Kaffee und starte den Fokusmodus.',
    'deep-space':
      'Entspann dich, Kapitän. Tiefe: 3000 Fuß. Außenlärm abgeschirmt. Es ist {time}. Weltraum-Drone-Frequenz aktiv — maximaler Fokus.',
    'galactic-tavern':
      'Guten Tag, alter Freund. Hektischer Tag draußen? Willkommen in deiner Ecke. Ich habe eine musikalische Überraschungsbox gemischt — es ist {time}. Pläne besprechen oder direkt arbeiten?',
    'galactic-classical':
      'Kapitän, guten Tag. Audio auf galaktische Klassik eingestellt. Es ist {time}. Minimaler Raum bereit — elegantes Klavier bewacht deine Produktivität.',
    'retro-earth':
      'Zeitsprung erfolgreich! Zurück im retro-alpinen Camp. Hör das Lagerfeuer knistern — es ist {time}. Nostalgische Rhythmen im Camp-Radio. Lasst die Reise beginnen!',
  },
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
  fallbacks: djEn.fallbacks,
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
  fallbacks: djEn.fallbacks,
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
  const djLocale = djSpeechLocaleForUiLocale(locale)
  const copy = DJ_I18N[djLocale] ?? DJ_I18N.en
  return fillDjTemplate(copy.fallbacks[moodId], vars)
}

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
