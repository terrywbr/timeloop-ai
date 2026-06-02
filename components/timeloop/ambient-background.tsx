'use client'

import { AmbientWorld } from '@/components/ui/ambient-world'
import type { AmbientWorldLayer } from '@/lib/timeloop/types'

type AmbientBackgroundProps = {
  layers: AmbientWorldLayer[]
}

export default function AmbientBackground({ layers }: AmbientBackgroundProps) {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 bg-transparent">
      {layers.map((layer) => (
        <div
          key={layer.key}
          className={`absolute inset-0 bg-transparent transition-opacity duration-1000 ease-in-out ${
            layer.isActive ? 'opacity-100' : 'pointer-events-none opacity-0'
          }`}
        >
          <AmbientWorld
            backgroundImage={layer.backgroundImage}
            depthMap={layer.depthMap}
            particles={layer.particlePreset}
            shader={layer.shaderPreset}
            ambience={layer.ambienceAudio}
          />
        </div>
      ))}
    </div>
  )
}
