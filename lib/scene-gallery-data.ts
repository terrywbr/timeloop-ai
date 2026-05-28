import type { MusicChannelKey } from '@/lib/music-channels'
import type { AmbientWorldId } from '@/lib/worlds'

export type GalleryItemType = 'NFT' | '贊助'

/** 對應 `page.tsx` 的 `sceneVideos` 鍵，用於切換全螢背景影片 */
export type GalleryVideoScene =
  | 'cyberpunk'
  | 'nature'
  | 'space'
  | 'ocean'
  | 'city'
  | 'desert'

export interface SceneGalleryItem {
  id: string
  title: string
  price: string
  type: GalleryItemType
  thumbnail: string
  /** 點擊卡片時實際進入的 Ambient World preset。 */
  worldId: AmbientWorldId
  /** 建議配對的電台風格（對應左欄串流） */
  stationHints: MusicChannelKey[]
  /** 進入場景時套用的背景影片 */
  videoScene: GalleryVideoScene
}

/** 3x7 畫廊矩陣：21 張卡片，映射到現有三個 Ambient World。 */
export const SCENE_DATA: SceneGalleryItem[] = [
  {
    id: 's01',
    title: '克虹港灣',
    price: '0.42',
    type: 'NFT',
    thumbnail: '/gallery/s01.jpg',
    worldId: 'cyberpunk',
    stationHints: ['synthNight', 'lofiChill'],
    videoScene: 'city',
  },
  {
    id: 's02',
    title: '東京雨夜',
    price: '0.55',
    type: 'NFT',
    thumbnail: '/gallery/s02.jpg',
    worldId: 'cyberpunk',
    stationHints: ['synthNight', 'lofiChill'],
    videoScene: 'city',
  },
  {
    id: 's03',
    title: '火星星座',
    price: '1.08',
    type: 'NFT',
    thumbnail: '/gallery/s03.jpg',
    worldId: 'cosmic-dust',
    stationHints: ['ambientForest', 'synthNight'],
    videoScene: 'space',
  },
  {
    id: 's04',
    title: '星際空間站',
    price: '0.72',
    type: 'NFT',
    thumbnail: '/gallery/s04.jpg',
    worldId: 'cosmic-dust',
    stationHints: ['ambientForest', 'synthNight'],
    videoScene: 'space',
  },
  {
    id: 's05',
    title: '沙漠驛站',
    price: '0.61',
    type: 'NFT',
    thumbnail: '/gallery/s05.jpg',
    worldId: 'deep-ocean',
    stationHints: ['lofiChill', 'ambientForest'],
    videoScene: 'desert',
  },
  {
    id: 's06',
    title: '海底列車',
    price: '0.88',
    type: 'NFT',
    thumbnail: '/gallery/s06.jpg',
    worldId: 'deep-ocean',
    stationHints: ['lofiChill', 'ambientForest'],
    videoScene: 'ocean',
  },
  {
    id: 's07',
    title: '霓虹控制台',
    price: '1.22',
    type: 'NFT',
    thumbnail: '/gallery/s07.jpg',
    worldId: 'cyberpunk',
    stationHints: ['synthNight', 'lofiChill'],
    videoScene: 'cyberpunk',
  },
  {
    id: 's08',
    title: '賽博修道院',
    price: '0.95',
    type: 'NFT',
    thumbnail: '/gallery/s08.jpg',
    worldId: 'deep-ocean',
    stationHints: ['ambientForest', 'lofiChill'],
    videoScene: 'ocean',
  },
  {
    id: 's09',
    title: '月面圖書館',
    price: '2.05',
    type: 'NFT',
    thumbnail: '/gallery/s09.jpg',
    worldId: 'cosmic-dust',
    stationHints: ['ambientForest', 'synthNight'],
    videoScene: 'space',
  },
  {
    id: 's10',
    title: '雨林吊橋',
    price: '0.48',
    type: 'NFT',
    thumbnail: '/gallery/s10.jpg',
    worldId: 'deep-ocean',
    stationHints: ['ambientForest', 'lofiChill'],
    videoScene: 'nature',
  },
  {
    id: 's11',
    title: '仿古羅馬市集',
    price: '0.95',
    type: 'NFT',
    thumbnail: '/gallery/s11.jpg',
    worldId: 'cyberpunk',
    stationHints: ['lofiChill'],
    videoScene: 'city',
  },
  {
    id: 's12',
    title: '蒸汽飛艇',
    price: '1.35',
    type: 'NFT',
    thumbnail: '/gallery/s12.jpg',
    worldId: 'cosmic-dust',
    stationHints: ['synthNight', 'ambientForest'],
    videoScene: 'desert',
  },
  {
    id: 's13',
    title: '量子花園',
    price: '0.59',
    type: 'NFT',
    thumbnail: '/gallery/s13.jpg',
    worldId: 'cosmic-dust',
    stationHints: ['ambientForest'],
    videoScene: 'space',
  },
  {
    id: 's14',
    title: '時空贊助專區',
    price: '—',
    type: '贊助',
    thumbnail: '/gallery/s14.jpg',
    worldId: 'cosmic-dust',
    stationHints: ['synthNight', 'lofiChill', 'ambientForest'],
    videoScene: 'space',
  },
  {
    id: 's15',
    title: '鋼鐵叢林',
    price: '0.76',
    type: 'NFT',
    thumbnail: '/gallery/s15.jpg',
    worldId: 'cyberpunk',
    stationHints: ['synthNight'],
    videoScene: 'city',
  },
  {
    id: 's16',
    title: '冰川洞穴',
    price: '1.02',
    type: 'NFT',
    thumbnail: '/gallery/s16.jpg',
    worldId: 'deep-ocean',
    stationHints: ['ambientForest', 'lofiChill'],
    videoScene: 'nature',
  },
  {
    id: 's17',
    title: '熱帶日落',
    price: '0.34',
    type: 'NFT',
    thumbnail: '/gallery/s17.jpg',
    worldId: 'deep-ocean',
    stationHints: ['lofiChill'],
    videoScene: 'ocean',
  },
  {
    id: 's18',
    title: '像素咖啡館',
    price: '0.67',
    type: 'NFT',
    thumbnail: '/gallery/s18.jpg',
    worldId: 'cyberpunk',
    stationHints: ['lofiChill', 'synthNight'],
    videoScene: 'cyberpunk',
  },
  {
    id: 's19',
    title: '深空觀測台',
    price: '2.40',
    type: 'NFT',
    thumbnail: '/gallery/s19.jpg',
    worldId: 'cosmic-dust',
    stationHints: ['ambientForest', 'synthNight'],
    videoScene: 'space',
  },
  {
    id: 's20',
    title: '古都雪季',
    price: '0.51',
    type: 'NFT',
    thumbnail: '/gallery/s20.jpg',
    worldId: 'deep-ocean',
    stationHints: ['ambientForest'],
    videoScene: 'desert',
  },
  {
    id: 's21',
    title: '潮汐音樂廳',
    price: '1.88',
    type: 'NFT',
    thumbnail: '/gallery/s21.jpg',
    worldId: 'deep-ocean',
    stationHints: ['lofiChill', 'ambientForest'],
    videoScene: 'ocean',
  },
]
