'use client'

import { ImageIcon, X, ShoppingCart } from 'lucide-react'
import { useLanguage } from '@/lib/language-context'
import { SCENE_DATA, type SceneGalleryItem as GallerySceneItem } from '@/lib/scene-gallery-data'

// Mobile Gallery Content
export interface MobileGalleryContentProps {
  onClose: () => void
  onEnterScene: (item: GallerySceneItem) => void
}

// Mock NFT data - 3x7 grid (21 items) - same as community-gallery
type MobileNFTRarity = 'legendary' | 'rare' | 'common'
const mobileNftItems: { id: string; thumbnail: string; price: string; rarity: MobileNFTRarity }[] = [
  { id: '001', thumbnail: 'https://images.unsplash.com/photo-1634017839464-5c339bbe3c35?w=150&h=150&fit=crop', price: '0.5', rarity: 'legendary' },
  { id: '002', thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&h=150&fit=crop', price: '0.8', rarity: 'rare' },
  { id: '003', thumbnail: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=150&h=150&fit=crop', price: '1.2', rarity: 'legendary' },
  { id: '004', thumbnail: 'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=150&h=150&fit=crop', price: '0.6', rarity: 'common' },
  { id: '005', thumbnail: 'https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?w=150&h=150&fit=crop', price: '0.9', rarity: 'rare' },
  { id: '006', thumbnail: 'https://images.unsplash.com/photo-1549490349-8643362247b5?w=150&h=150&fit=crop', price: '0.7', rarity: 'common' },
  { id: '007', thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=150&h=150&fit=crop', price: '1.5', rarity: 'legendary' },
  { id: '008', thumbnail: 'https://images.unsplash.com/photo-1518640467707-6811f4a6ab73?w=150&h=150&fit=crop', price: '0.4', rarity: 'common' },
  { id: '009', thumbnail: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=150&h=150&fit=crop', price: '2.1', rarity: 'legendary' },
  { id: '010', thumbnail: 'https://images.unsplash.com/photo-1557672172-298e090bd0f1?w=150&h=150&fit=crop', price: '0.3', rarity: 'common' },
  { id: '011', thumbnail: 'https://images.unsplash.com/photo-1604076913837-52ab5629fba9?w=150&h=150&fit=crop', price: '1.8', rarity: 'rare' },
  { id: '012', thumbnail: 'https://images.unsplash.com/photo-1567095761054-7a02e69e5c43?w=150&h=150&fit=crop', price: '0.5', rarity: 'common' },
  { id: '013', thumbnail: 'https://images.unsplash.com/photo-1550859492-d5da9d8e45f3?w=150&h=150&fit=crop', price: '3.2', rarity: 'legendary' },
  { id: '014', thumbnail: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=150&h=150&fit=crop', price: '0.9', rarity: 'rare' },
  { id: '015', thumbnail: 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?w=150&h=150&fit=crop', price: '0.4', rarity: 'common' },
  { id: '016', thumbnail: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=150&h=150&fit=crop', price: '1.1', rarity: 'rare' },
  { id: '017', thumbnail: 'https://images.unsplash.com/photo-1618172193622-ae2d025f4032?w=150&h=150&fit=crop', price: '0.6', rarity: 'common' },
  { id: '018', thumbnail: 'https://images.unsplash.com/photo-1604871000636-074fa5117945?w=150&h=150&fit=crop', price: '2.5', rarity: 'legendary' },
  { id: '019', thumbnail: 'https://images.unsplash.com/photo-1617791160505-6f00504e3519?w=150&h=150&fit=crop', price: '0.7', rarity: 'rare' },
  { id: '020', thumbnail: 'https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?w=150&h=150&fit=crop', price: '0.3', rarity: 'common' },
  { id: '021', thumbnail: 'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=150&h=150&fit=crop', price: '1.9', rarity: 'legendary' },
]

const mobileRarityBorders: Record<MobileNFTRarity, string> = {
  legendary: 'ring-1 ring-amber-500/50',
  rare: 'ring-1 ring-purple-500/50',
  common: 'ring-1 ring-foreground/10',
}

export default function MobileGalleryContent({ onClose, onEnterScene }: MobileGalleryContentProps) {
  const { t } = useLanguage()

  return (
    <div className="no-scrollbar flex h-full flex-col overflow-y-auto p-4">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/20">
            <ImageIcon className="h-4 w-4 text-accent" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">{t.gallery.title}</h2>
        </div>
        <button
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-foreground/70 hover:bg-secondary/50 hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* NFT Grid - 3x7 */}
      <div className="grid grid-cols-3 gap-1.5">
        {SCENE_DATA.map((item, index) => {
          const rarity = mobileNftItems[index]?.rarity ?? 'common'

          return (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              onEnterScene(item)
              onClose()
            }}
            className={`group relative aspect-square cursor-pointer overflow-hidden rounded-md ${mobileRarityBorders[rarity]} transition-all duration-200 hover:scale-105 hover:ring-2`}
          >
            <img
              src={item.thumbnail}
              alt={`Gallery scene ${item.id}`}
              className="h-full w-full object-cover"
              crossOrigin="anonymous"
              loading="lazy"
            />
            <div className="absolute left-0.5 top-0.5 rounded-sm bg-black/60 px-1 py-px text-[8px] font-mono text-white/90">
              #{String(index + 1).padStart(3, '0')}
            </div>
            <div className="absolute inset-0 flex items-end justify-center bg-gradient-to-t from-black/80 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              <div className="mb-1 flex items-center gap-1 rounded-full bg-black/50 px-1.5 py-0.5 backdrop-blur-sm">
                <span className="text-[8px] font-medium text-accent">{item.price} ETH</span>
                <ShoppingCart className="h-2.5 w-2.5 text-white/80" />
              </div>
            </div>
          </button>
          )
        })}
      </div>

      {/* Advertisement Placeholder */}
      <div className="mt-3">
        <div className="glass flex h-[100px] w-full items-center justify-center rounded-lg border border-foreground/10 bg-popover/40">
          <span className="text-xs text-muted-foreground/50">Sponsored Content</span>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-3 border-t border-foreground/10 pt-3 text-center text-xs text-muted-foreground">
        <p>{t.gallery.trending}</p>
      </div>
    </div>
  )
}