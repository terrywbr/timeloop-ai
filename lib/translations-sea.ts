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
    | 'free'
    | 'vip'
    | 'perMonth'
    | 'upgradeVip'
    | 'upgradeStreamer'
    | 'creditsRemaining'
    | 'vipActive'
    | 'streamerActive'
    | 'pastDueWarning'
    | 'vipUntil'
    | 'generationCost',
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
    | 'previewUpgrade'
    | 'cnManualTitle'
    | 'cnManualDescription'
    | 'cnWechatLabel'
    | 'cnUidHint'
    | 'cnCopyUid'
    | 'cnPricingTiers'
    | 'backgroundsTitle'
    | 'backgroundsHint'
    | 'uploadBackground'
    | 'uploading'
    | 'removeBackground'
    | 'rotationLabel'
    | 'rotation5'
    | 'rotation10'
    | 'streamModeLink'
    | 'oneClickLiveTitle'
    | 'oneClickLiveButton'
    | 'oneClickLiveHint'
    | 'oneClickLiveStatusImages'
    | 'oneClickLiveStatusMusic'
    | 'oneClickLiveStatusReady'
    | 'oneClickLiveNeedImages'
    | 'oneClickLiveNeedMusic'
    | 'oneClickLivePopoutBlocked'
    | 'oneClickLiveLaunchedToday'
    | 'copyStreamUrl'
    | 'copyStreamUrlDone',
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
    free: 'ฟรี: คredits รายเดือน',
    vip: 'VIP: สร้างไม่จำกัด',
    perMonth: '/เดือน',
    upgradeVip: 'อัปเกรด VIP',
    upgradeStreamer: 'อัปเกรด Streamer Pass',
    creditsRemaining: 'เครดิตคงเหลือ: {count}',
    vipActive: 'VIP ใช้งานอยู่ — สร้างไม่จำกัด',
    streamerActive: 'Streamer Pass ใช้งาน — ปลดล็อกเครื่องมือครีเอเตอร์',
    pastDueWarning: 'ค้างชำระ — โปรดอัปเดตการชำระเงิน',
    vipUntil: 'ใช้ได้ถึง {date}',
    generationCost: 'สร้างฉาก AI ครั้งละ 10 เครดิต (VIP / Streamer ไม่จำกัด)',
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
    cnPricingTiers: 'Streamer Pass (WeChat จ่ายล่วงหน้า):\n• รายเดือน\n• รายไตรมาส\n• รายปี\nส่ง UID + แพ็กเกจให้ซัพพอร์ต',
    backgroundsTitle: 'วนลูปพื้นหลัง OBS',
    backgroundsHint: '{count}/{max} รูป · cross-fade ในโหมดสตรีม',
    uploadBackground: 'อัปโหลดรูป',
    uploading: 'กำลังอัปโหลด…',
    removeBackground: 'ลบ',
    rotationLabel: 'สลับทุก',
    rotation5: '5 นาที',
    rotation10: '10 นาที',
    streamModeLink: 'เปิดโหมดสตรีม (?stream=1)',
    oneClickLiveTitle: 'ไลฟ์คลิกเดียว',
    oneClickLiveButton: 'เริ่มสตรีม OBS',
    oneClickLiveHint: 'เลือกฉากหมุนในคลังและเลือกสถานี แล้วเปิดหน้าต่าง OBS ด้วยคลิกเดียวทุกวัน',
    oneClickLiveStatusImages: 'ฉากหมุน: {count}',
    oneClickLiveStatusMusic: 'เพลง: {name}',
    oneClickLiveStatusReady: 'พร้อมแล้ว — คลิกเดียวเพื่อไลฟ์',
    oneClickLiveNeedImages: 'เลือกฉากหมุนอย่างน้อย 1 รูปในคลังขวา (แท็บของฉัน)',
    oneClickLiveNeedMusic: 'ทำ onboarding เพลงและยืนยันสถานีก่อน',
    oneClickLivePopoutBlocked: 'ป๊อปอัปถูกบล็อก อนุญาตหรือคัดลอก URL ด้านล่าง',
    oneClickLiveLaunchedToday: 'เปิดหน้าต่างสตรีมวันนี้แล้ว',
    copyStreamUrl: 'คัดลอก URL สตรีม',
    copyStreamUrlDone: 'คัดลอก URL แล้ว',
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
    free: 'Miễn phí: credits hàng tháng',
    vip: 'VIP: tạo không giới hạn',
    perMonth: '/tháng',
    upgradeVip: 'Nâng cấp VIP',
    upgradeStreamer: 'Nâng cấp Streamer Pass',
    creditsRemaining: 'Credit còn lại: {count}',
    vipActive: 'VIP đang hoạt động — tạo không giới hạn',
    streamerActive: 'Streamer Pass — công cụ creator đã mở',
    pastDueWarning: 'Quá hạn thanh toán — vui lòng cập nhật billing.',
    vipUntil: 'Hiệu lực đến {date}',
    generationCost: 'Mỗi cảnh AI tốn 10 credit (VIP / Streamer không giới hạn).',
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
    cnPricingTiers: 'Streamer Pass (WeChat trả trước):\n• Tháng\n• Quý\n• Năm\nGửi UID + gói cho hỗ trợ.',
    backgroundsTitle: 'Vòng lặp nền OBS',
    backgroundsHint: '{count}/{max} ảnh · cross-fade ở chế độ stream',
    uploadBackground: 'Tải ảnh lên',
    uploading: 'Đang tải lên…',
    removeBackground: 'Xóa',
    rotationLabel: 'Xoay mỗi',
    rotation5: '5 phút',
    rotation10: '10 phút',
    streamModeLink: 'Mở chế độ stream (?stream=1)',
    oneClickLiveTitle: 'Live một cú nhấp',
    oneClickLiveButton: 'Bắt đầu stream OBS',
    oneClickLiveHint: 'Chọn cảnh xoay trong thư viện và chọn đài, mỗi ngày mở cửa sổ OBS bằng một cú nhấp.',
    oneClickLiveStatusImages: 'Cảnh xoay: {count}',
    oneClickLiveStatusMusic: 'Nhạc: {name}',
    oneClickLiveStatusReady: 'Sẵn sàng — một cú nhấp để phát',
    oneClickLiveNeedImages: 'Chọn ít nhất 1 cảnh trong thư viện bên phải (tab Của tôi).',
    oneClickLiveNeedMusic: 'Hoàn tất onboarding nhạc và xác nhận đài trước.',
    oneClickLivePopoutBlocked: 'Pop-up bị chặn. Cho phép pop-up hoặc sao chép URL bên dưới.',
    oneClickLiveLaunchedToday: 'Đã mở cửa sổ stream hôm nay',
    copyStreamUrl: 'Sao chép URL stream',
    copyStreamUrlDone: 'Đã sao chép URL',
  },
}
