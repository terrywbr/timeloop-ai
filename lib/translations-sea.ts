import type { MusicChannelKey } from '@/lib/music-channels'

type TranslationBundle = {
  title: string
  inputPlaceholder: string
  sceneLabel: string
  generateButton: string
  generating: string
  scenes: Record<'cyberpunk' | 'nature' | 'space' | 'ocean' | 'city' | 'desert', string>
  controls: Record<
    'play' | 'pause' | 'volume' | 'mute' | 'unmute' | 'download' | 'settings' | 'fullscreen' | 'exitFullscreen',
    string
  >
  membership: Record<
    'free' | 'vip' | 'perMonth' | 'upgradeVip' | 'buyCredits' | 'creditsRemaining' | 'vipActive',
    string
  >
  auth: { signInPrompt: string }
  immersive: Record<
    'enterCockpit' | 'rotateLabel' | 'rotateToLandscape' | 'landscapeHint' | 'mobileTapAndRotate',
    string
  >
  language: string
  gallery: Record<
    'title' | 'rentBuy' | 'creator' | 'featured' | 'trending' | 'enterScene' | 'typeNft' | 'typeSponsor',
    string
  >
  music: {
    title: string
    stations: string
    live: string
    channels: Record<MusicChannelKey, string>
    favorites: string
    alreadyFavorited: string
    noFavorites: string
    volume: string
  }
  myScenes: Record<
    'title' | 'save' | 'namePlaceholder' | 'noScenes' | 'loginRequired' | 'cancel' | 'confirm',
    string
  >
  nft: Record<'legendary' | 'rare' | 'common', string>
  streamerOverlay: Record<
    'previewUpgrade' | 'cnManualTitle' | 'cnManualDescription' | 'cnWechatLabel' | 'cnUidHint' | 'cnCopyUid',
    string
  >
}

const somaChannels: Record<MusicChannelKey, string> = {
  lofiChill: 'Groove Salad (SomaFM)',
  synthNight: 'KGU 99.5 The Word',
  ambientForest: 'Space Station (SomaFM)',
  droneZone: 'Drone Zone (SomaFM)',
  deepSpace: 'Deep Space One (SomaFM)',
  synphaera: 'Synphaera (SomaFM)',
  missionControl: 'Mission Control (SomaFM)',
  defconRadio: 'DEF CON Radio (SomaFM)',
  beatBlender: 'Beat Blender (SomaFM)',
  fluid: 'Fluid (SomaFM)',
  cliqhop: 'Cliqhop IDM (SomaFM)',
  secretAgent: 'Secret Agent (SomaFM)',
  lush: 'Lush (SomaFM)',
  digitalis: 'Digitalis (SomaFM)',
  suburbsOfGoa: 'Suburbs of Goa (SomaFM)',
  illstreet: 'Illinois Street Lounge (SomaFM)',
  bootLiquor: 'Boot Liquor (SomaFM)',
  folkForward: 'Folk Forward (SomaFM)',
  popTron: 'PopTron (SomaFM)',
  indiePop: 'Indie Pop Rocks! (SomaFM)',
}

export const thTranslation: TranslationBundle = {
  title: 'Time Loop AI',
  inputPlaceholder: 'อธิบายฉากของคุณ...',
  sceneLabel: 'เอฟเฟกต์ภาพ',
  generateButton: 'สร้าง',
  generating: 'กำลังบิดอวกาศ-เวลา...',
  scenes: {
    cyberpunk: 'แสงนีออน',
    nature: 'อนุภาคธรรมชาติ',
    space: 'ฝุ่นจักรวาล',
    ocean: 'หมอกทะเล',
    city: 'แสงเมือง',
    desert: 'หมอกอบอุ่น',
  },
  controls: {
    play: 'เล่น',
    pause: 'หยุด',
    volume: 'ระดับเสียง',
    mute: 'ปิดเสียง',
    unmute: 'เปิดเสียง',
    download: 'ดาวน์โหลด',
    settings: 'ตั้งค่า',
    fullscreen: 'เต็มจอ',
    exitFullscreen: 'ออกจากเต็มจอ',
  },
  membership: {
    free: 'ฟรี: สร้าง 5 ครั้ง/เดือน',
    vip: 'VIP $5/เดือน: สร้าง 30 ครั้ง',
    perMonth: '/เดือน',
    upgradeVip: 'อัปเกรด VIP',
    buyCredits: 'ซื้อเครดิต',
    creditsRemaining: 'เครดิตคงเหลือ: {count}',
    vipActive: 'VIP ใช้งานอยู่ — สร้างไม่จำกัด',
  },
  auth: {
    signInPrompt: 'เข้าสู่ระบบเพื่อบันทึกฉากและปลดล็อก VIP',
  },
  immersive: {
    enterCockpit: 'เข้าห้องควบคุม · เปิดเสียง',
    rotateLabel: 'การวางแนว',
    rotateToLandscape: 'เพื่อประสบการณ์ห้องควบคุมที่ดีที่สุด กรุณาหมุนอุปกรณ์เป็นแนวนอน 🔄',
    landscapeHint: 'โหมดแนวนอนปลดล็อกมุมมองเต็มจอ',
    mobileTapAndRotate: '⚡ แตะหน้าจอและหมุนเป็นแนวนอนเพื่อประสบการณ์ที่ดีที่สุด',
  },
  language: 'ภาษา',
  gallery: {
    title: 'แกลเลอรีชุมชน',
    rentBuy: 'เช่า/ซื้อ',
    creator: 'ครีเอเตอร์',
    featured: 'แนะนำ',
    trending: 'มาแรง',
    enterScene: 'เข้าสู่ไทม์ไลน์นี้',
    typeNft: 'NFT',
    typeSponsor: 'ผู้สนับสนุน',
  },
  music: {
    title: 'เพลงบรรยากาศ',
    stations: 'สถานี',
    live: 'สด',
    channels: somaChannels,
    favorites: 'รายการโปรด',
    alreadyFavorited: 'อยู่ในรายการโปรดแล้ว',
    noFavorites: 'ยังไม่มีรายการโปรด',
    volume: 'ระดับเสียง',
  },
  myScenes: {
    title: 'ฉากของฉัน',
    save: 'บันทึกปัจจุบัน',
    namePlaceholder: 'ชื่อฉาก...',
    noScenes: 'สร้างโลกเพื่อบันทึกที่นี่',
    loginRequired: 'เข้าสู่ระบบเพื่อดูโลกที่บันทึกไว้',
    cancel: 'ยกเลิก',
    confirm: 'บันทึก',
  },
  nft: {
    legendary: 'ตำนาน',
    rare: 'หายาก',
    common: 'ธรรมดา',
  },
  streamerOverlay: {
    previewUpgrade: 'อัปเกรด Streamer Pass เพื่อสตรีม OBS 24 ชม.',
    cnManualTitle: 'ครีเอเตอร์จีนแผ่นดินใหญ่ — เปิดใช้งานด้วยตนเอง',
    cnManualDescription: 'Streamer Pass เปิดผ่าน WeChat เพิ่ม WeChat ซัพพอร์ตและส่ง UID ด้านล่าง',
    cnWechatLabel: 'WeChat',
    cnUidHint: 'คัดลอก UID และส่งพร้อมหมายเหตุ "Streamer Pass"',
    cnCopyUid: 'คัดลอก UID',
  },
}

export const viTranslation: TranslationBundle = {
  title: 'Time Loop AI',
  inputPlaceholder: 'Mô tả cảnh của bạn...',
  sceneLabel: 'Hiệu ứng hình ảnh',
  generateButton: 'Tạo',
  generating: 'Đang uốn cong không-thời gian...',
  scenes: {
    cyberpunk: 'Ánh neon',
    nature: 'Hạt thiên nhiên',
    space: 'Bụi vũ trụ',
    ocean: 'Sương biển',
    city: 'Ánh đô thị',
    desert: 'Sương ấm',
  },
  controls: {
    play: 'Phát',
    pause: 'Tạm dừng',
    volume: 'Âm lượng',
    mute: 'Tắt tiếng',
    unmute: 'Bật tiếng',
    download: 'Tải xuống',
    settings: 'Cài đặt',
    fullscreen: 'Toàn màn hình',
    exitFullscreen: 'Thoát toàn màn hình',
  },
  membership: {
    free: 'Miễn phí: 5 lần tạo/tháng',
    vip: 'VIP $5/tháng: 30 lần tạo',
    perMonth: '/tháng',
    upgradeVip: 'Nâng cấp VIP',
    buyCredits: 'Mua gói credit',
    creditsRemaining: 'Credit còn lại: {count}',
    vipActive: 'VIP đang hoạt động — tạo không giới hạn',
  },
  auth: {
    signInPrompt: 'Đăng nhập để lưu cảnh và mở khóa VIP',
  },
  immersive: {
    enterCockpit: 'Vào buồng lái · Bật âm thanh',
    rotateLabel: 'Hướng màn hình',
    rotateToLandscape: 'Để trải nghiệm buồng lái tốt nhất, hãy xoay thiết bị sang ngang 🔄',
    landscapeHint: 'Chế độ ngang mở khóa toàn màn hình',
    mobileTapAndRotate: '⚡ Chạm màn hình và xoay ngang để có trải nghiệm tốt nhất',
  },
  language: 'Ngôn ngữ',
  gallery: {
    title: 'Thư viện cộng đồng',
    rentBuy: 'Thuê/Mua',
    creator: 'Người sáng tạo',
    featured: 'Nổi bật',
    trending: 'Xu hướng',
    enterScene: 'Vào dòng thời gian này',
    typeNft: 'NFT',
    typeSponsor: 'Tài trợ',
  },
  music: {
    title: 'Nhạc nền',
    stations: 'Đài',
    live: 'Trực tiếp',
    channels: somaChannels,
    favorites: 'Yêu thích',
    alreadyFavorited: 'Đã có trong yêu thích',
    noFavorites: 'Chưa có yêu thích',
    volume: 'Âm lượng',
  },
  myScenes: {
    title: 'Cảnh của tôi',
    save: 'Lưu hiện tại',
    namePlaceholder: 'Tên cảnh...',
    noScenes: 'Tạo thế giới để lưu tại đây',
    loginRequired: 'Đăng nhập để xem thế giới đã lưu',
    cancel: 'Hủy',
    confirm: 'Lưu',
  },
  nft: {
    legendary: 'Huyền thoại',
    rare: 'Hiếm',
    common: 'Thường',
  },
  streamerOverlay: {
    previewUpgrade: 'Nâng cấp Streamer Pass để stream OBS 24h',
    cnManualTitle: 'Creator Trung Quốc đại lục — kích hoạt thủ công',
    cnManualDescription: 'Streamer Pass qua WeChat. Thêm WeChat hỗ trợ và gửi UID bên dưới',
    cnWechatLabel: 'WeChat',
    cnUidHint: 'Sao chép UID và gửi kèm ghi chú "Streamer Pass"',
    cnCopyUid: 'Sao chép UID',
  },
}
