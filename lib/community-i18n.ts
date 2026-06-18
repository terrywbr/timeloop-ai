import type { Language } from '@/lib/translations'

export type CommunityStrings = {
  tabFeatured: string
  tabNewest: string
  tabFollowing: string
  tabOfficial: string
  tabMine: string
  myImagesTitle: string
  noMyImages: string
  rotationSelect: string
  rotationSelected: string
  rotationStreamerOnly: string
  rotationStats: string
  publish: string
  unpublish: string
  publishConfirm: string
  share: string
  shareCopied: string
  report: string
  reportPrompt: string
  reportThanks: string
  views: string
  likes: string
  coFocus: string
  coFocusCount: string
  coFocusJoin: string
  coFocusLeave: string
  follow: string
  unfollow: string
  creatorPage: string
  loginToInteract: string
}

const EN: CommunityStrings = {
  tabFeatured: 'Featured',
  tabNewest: 'Newest',
  tabFollowing: 'Following',
  tabOfficial: 'Official',
  tabMine: 'My Images',
  myImagesTitle: 'My Generated Images',
  noMyImages: 'No generated images yet',
  rotationSelect: 'Add to rotation',
  rotationSelected: 'In rotation',
  rotationStreamerOnly: 'Rotation selection is Streamer-only',
  rotationStats: 'Selected for rotation: {selected}/{max}',
  publish: 'Publish to gallery',
  unpublish: 'Make private',
  publishConfirm: 'Anyone will be able to enter your scene. Continue?',
  share: 'Share',
  shareCopied: 'Link copied',
  report: 'Report',
  reportPrompt: 'Why are you reporting this scene?',
  reportThanks: 'Report submitted. Thank you.',
  views: 'views',
  likes: 'likes',
  coFocus: 'Co-focus',
  coFocusCount: '{count} focusing now',
  coFocusJoin: 'Join co-focus',
  coFocusLeave: 'Leave co-focus',
  follow: 'Follow',
  unfollow: 'Unfollow',
  creatorPage: 'Creator',
  loginToInteract: 'Sign in to like, save, or follow',
}

const ZH_TW: CommunityStrings = {
  ...EN,
  tabFeatured: '精選',
  tabNewest: '最新',
  tabFollowing: '關注',
  tabOfficial: '官方',
  tabMine: '我的圖',
  myImagesTitle: '我的生成圖片',
  noMyImages: '目前還沒有生成圖片',
  rotationSelect: '加入輪播',
  rotationSelected: '輪播中',
  rotationStreamerOnly: '輪播勾選僅限 Streamer',
  rotationStats: '已勾選輪播：{selected}/{max}',
  publish: '公開到畫廊',
  unpublish: '改為私人',
  publishConfirm: '公開後，任何人都可進入你的場景。確定要公開嗎？',
  share: '分享',
  shareCopied: '已複製連結',
  report: '檢舉',
  reportPrompt: '請簡述檢舉原因：',
  reportThanks: '已送出檢舉，感謝你。',
  views: '次瀏覽',
  likes: '讚',
  coFocus: '共專注',
  coFocusCount: '此刻 {count} 人專注中',
  coFocusJoin: '加入共專注',
  coFocusLeave: '離開共專注',
  follow: '追蹤',
  unfollow: '取消追蹤',
  creatorPage: '創作者',
  loginToInteract: '登入後可按讚、收藏或追蹤',
}

const ZH_CN: CommunityStrings = {
  ...ZH_TW,
  tabFeatured: '精选',
  tabNewest: '最新',
  tabFollowing: '关注',
  tabOfficial: '官方',
  tabMine: '我的图',
  myImagesTitle: '我的生成图片',
  noMyImages: '目前还没有生成图片',
  rotationSelect: '加入轮播',
  rotationSelected: '轮播中',
  rotationStreamerOnly: '轮播勾选仅限 Streamer',
  rotationStats: '已勾选轮播：{selected}/{max}',
  publish: '公开到画廊',
  unpublish: '改为私密',
  publishConfirm: '公开后，任何人都可进入你的场景。确定要公开吗？',
  share: '分享',
  shareCopied: '已复制链接',
  report: '举报',
  reportPrompt: '请简述举报原因：',
  reportThanks: '已提交举报，感谢你。',
  views: '次浏览',
  likes: '赞',
  coFocus: '共专注',
  coFocusCount: '此刻 {count} 人专注中',
  coFocusJoin: '加入共专注',
  coFocusLeave: '离开共专注',
  follow: '关注',
  unfollow: '取消关注',
  creatorPage: '创作者',
  loginToInteract: '登录后可点赞、收藏或关注',
}

const JA: CommunityStrings = {
  ...EN,
  tabFeatured: '注目',
  tabNewest: '新着',
  tabFollowing: 'フォロー中',
  tabOfficial: '公式',
  tabMine: 'マイ画像',
  myImagesTitle: '自分の生成画像',
  noMyImages: '生成画像はまだありません',
  rotationSelect: 'ローテーションに追加',
  rotationSelected: 'ローテーション中',
  rotationStreamerOnly: 'ローテーション選択は Streamer 限定',
  rotationStats: 'ローテーション選択済み：{selected}/{max}',
  publish: 'ギャラリーに公開',
  unpublish: '非公開にする',
  publishConfirm: '公開すると誰でもシーンに入れます。続けますか？',
  share: '共有',
  shareCopied: 'リンクをコピーしました',
  report: '報告',
  reportPrompt: '報告理由を入力してください',
  reportThanks: '報告を受け付けました',
  views: '回表示',
  likes: 'いいね',
  coFocus: '共同集中',
  coFocusCount: '現在 {count} 人が集中中',
  coFocusJoin: '共同集中に参加',
  coFocusLeave: '共同集中を退出',
  follow: 'フォロー',
  unfollow: 'フォロー解除',
  creatorPage: 'クリエイター',
  loginToInteract: 'いいね・保存・フォローにはログインが必要です',
}

const KO: CommunityStrings = {
  ...JA,
  tabFeatured: '추천',
  tabNewest: '최신',
  tabFollowing: '팔로잉',
  tabOfficial: '공식',
  tabMine: '내 이미지',
  myImagesTitle: '내 생성 이미지',
  noMyImages: '생성된 이미지가 아직 없습니다',
  rotationSelect: '로테이션 추가',
  rotationSelected: '로테이션 중',
  rotationStreamerOnly: '로테이션 선택은 Streamer 전용',
  rotationStats: '로테이션 선택됨: {selected}/{max}',
}
const ES: CommunityStrings = {
  ...EN,
  tabFeatured: 'Destacados',
  tabNewest: 'Recientes',
  tabFollowing: 'Siguiendo',
  tabOfficial: 'Oficial',
  tabMine: 'Mis imágenes',
  myImagesTitle: 'Mis imágenes generadas',
  noMyImages: 'Aún no hay imágenes generadas',
  rotationSelect: 'Añadir a rotación',
  rotationSelected: 'En rotación',
  rotationStreamerOnly: 'La selección de rotación es solo para Streamer',
  rotationStats: 'Seleccionadas para rotación: {selected}/{max}',
}
const FR: CommunityStrings = {
  ...EN,
  tabFeatured: 'À la une',
  tabNewest: 'Récents',
  tabFollowing: 'Abonnements',
  tabOfficial: 'Officiel',
  tabMine: 'Mes images',
  myImagesTitle: 'Mes images générées',
  noMyImages: 'Aucune image générée pour le moment',
  rotationSelect: 'Ajouter à la rotation',
  rotationSelected: 'Dans la rotation',
  rotationStreamerOnly: 'La sélection de rotation est réservée aux Streamer',
  rotationStats: 'Sélectionnées pour la rotation : {selected}/{max}',
}
const DE: CommunityStrings = {
  ...EN,
  tabFeatured: 'Empfohlen',
  tabNewest: 'Neu',
  tabFollowing: 'Folge ich',
  tabOfficial: 'Offiziell',
  tabMine: 'Meine Bilder',
  myImagesTitle: 'Meine generierten Bilder',
  noMyImages: 'Noch keine generierten Bilder',
  rotationSelect: 'Zur Rotation hinzufügen',
  rotationSelected: 'In Rotation',
  rotationStreamerOnly: 'Rotationsauswahl nur für Streamer',
  rotationStats: 'Für Rotation ausgewählt: {selected}/{max}',
}
const TH: CommunityStrings = {
  ...EN,
  tabFeatured: 'แนะนำ',
  tabNewest: 'ล่าสุด',
  tabFollowing: 'กำลังติดตาม',
  tabOfficial: 'ทางการ',
  tabMine: 'รูปของฉัน',
  myImagesTitle: 'รูปที่ฉันสร้าง',
  noMyImages: 'ยังไม่มีรูปที่สร้าง',
  rotationSelect: 'เพิ่มเข้าวนภาพ',
  rotationSelected: 'อยู่ในวนภาพ',
  rotationStreamerOnly: 'การเลือกวนภาพเฉพาะ Streamer',
  rotationStats: 'เลือกสำหรับวนภาพ: {selected}/{max}',
  publish: 'เผยแพร่ในแกลเลอรี',
  unpublish: 'ตั้งเป็นส่วนตัว',
  coFocus: 'โฟกัสร่วม',
  coFocusCount: 'กำลังโฟกัสร่วม {count} คน',
  coFocusJoin: 'เข้าร่วมโฟกัสร่วม',
  coFocusLeave: 'ออกจากโฟกัสร่วม',
  loginToInteract: 'เข้าสู่ระบบเพื่อไลค์ บันทึก หรือติดตาม',
}
const VI: CommunityStrings = {
  ...EN,
  tabFeatured: 'Nổi bật',
  tabNewest: 'Mới nhất',
  tabFollowing: 'Đang theo dõi',
  tabOfficial: 'Chính thức',
  tabMine: 'Ảnh của tôi',
  myImagesTitle: 'Ảnh đã tạo của tôi',
  noMyImages: 'Chưa có ảnh đã tạo',
  rotationSelect: 'Thêm vào luân phiên',
  rotationSelected: 'Đang luân phiên',
  rotationStreamerOnly: 'Chọn luân phiên chỉ dành cho Streamer',
  rotationStats: 'Đã chọn luân phiên: {selected}/{max}',
  publish: 'Xuất bản lên thư viện',
  unpublish: 'Đặt riêng tư',
  coFocus: 'Đồng tập trung',
  coFocusCount: '{count} người đang đồng tập trung',
  coFocusJoin: 'Tham gia đồng tập trung',
  coFocusLeave: 'Rời đồng tập trung',
  loginToInteract: 'Đăng nhập để thích, lưu hoặc theo dõi',
}

export const COMMUNITY_I18N: Record<Language, CommunityStrings> = {
  en: EN,
  'zh-TW': ZH_TW,
  'zh-CN': ZH_CN,
  ja: JA,
  ko: KO,
  es: ES,
  fr: FR,
  de: DE,
  th: TH,
  vi: VI,
}

export function getCommunityStrings(locale: Language): CommunityStrings {
  return COMMUNITY_I18N[locale] ?? EN
}
