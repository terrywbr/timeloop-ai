'use client'

import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import DepthParallax from './DepthParallax'
import ParticleLayer from './ParticleLayer'
import ShaderBackground from './ShaderBackground'

export type AmbientWorldParticles = {
  enabled?: boolean
  intensity?: number
  preset?: string
}

export type AmbientWorldShader = {
  enabled?: boolean
  intensity?: number
  motionScale?: number
  paused?: boolean
  preset?: string
}

export type AmbientWorldAmbience = {
  fogColor?: string
  neonColor?: string
  ambientColor?: string
  paused?: boolean
  muted?: boolean
  preset?: string
}

export type AmbientWorldProps = {
  backgroundImage?: string
  depthMap?: string
  particles?: AmbientWorldParticles | string
  shader?: AmbientWorldShader | string
  ambience?: AmbientWorldAmbience | string
}

const defaultAmbience: Required<Pick<AmbientWorldAmbience, 'fogColor' | 'neonColor' | 'ambientColor'>> = {
  fogColor: '#213a62',
  neonColor: '#64a4ff',
  ambientColor: '#1b2d4d',
}

function finiteNumber(value: unknown, fallback = 0) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min
}

function clamp01(value: unknown, fallback = 1) {
  return THREE.MathUtils.clamp(finiteNumber(value, fallback), 0, 1)
}

function particleConfigFrom(value: AmbientWorldParticles | string | undefined): AmbientWorldParticles {
  return typeof value === 'string' ? { preset: value } : value ?? {}
}

function shaderConfigFrom(value: AmbientWorldShader | string | undefined): AmbientWorldShader {
  return typeof value === 'string' ? { preset: value } : value ?? {}
}

function ambienceConfigFrom(value: AmbientWorldAmbience | string | undefined): AmbientWorldAmbience {
  return typeof value === 'string' ? { preset: value } : value ?? {}
}

function createSolidTexture(color: [number, number, number, number]) {
  const texture = new THREE.DataTexture(new Uint8Array(color), 1, 1, THREE.RGBAFormat)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.needsUpdate = true
  return texture
}

function createFallbackTexture(backgroundImage?: string) {
  if (typeof document === 'undefined') {
    return createSolidTexture([7, 16, 31, 255])
  }

  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 576
  const ctx = canvas.getContext('2d')
  if (!ctx) return new THREE.Texture()

  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
  gradient.addColorStop(0, '#07101f')
  gradient.addColorStop(0.52, '#12152d')
  gradient.addColorStop(1, '#06070c')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  const glow = ctx.createRadialGradient(
    canvas.width * 0.72,
    canvas.height * 0.32,
    8,
    canvas.width * 0.72,
    canvas.height * 0.32,
    canvas.width * 0.58,
  )
  glow.addColorStop(0, '#315dff99')
  glow.addColorStop(1, '#315dff00')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  for (let i = 0; i < 160; i += 1) {
    const x = Math.random() * canvas.width
    const y = canvas.height * (0.18 + Math.random() * 0.72)
    const w = 1 + Math.random() * 2.4
    const h = 1 + Math.random() * 8
    ctx.fillStyle = i % 4 === 0 ? '#79b8ff8f' : '#ffffff24'
    ctx.fillRect(x, y, w, h)
  }

  if (backgroundImage) {
    ctx.fillStyle = '#ffffff14'
    ctx.font = '24px sans-serif'
    ctx.fillText('Ambient World', 36, canvas.height - 42)
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.minFilter = THREE.LinearFilter
  texture.magFilter = THREE.LinearFilter
  texture.generateMipmaps = false
  return texture
}

function createFallbackDepthMap(depthMap?: string) {
  if (typeof document === 'undefined') {
    return createSolidTexture([128, 128, 128, 255])
  }

  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 576
  const ctx = canvas.getContext('2d')
  if (!ctx) return new THREE.Texture()

  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
  gradient.addColorStop(0, '#eeeeee')
  gradient.addColorStop(0.55, '#777777')
  gradient.addColorStop(1, '#171717')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  for (let i = 0; i < 8; i += 1) {
    const x = Math.random() * canvas.width
    const y = Math.random() * canvas.height
    const radius = 80 + Math.random() * 220
    const glow = ctx.createRadialGradient(x, y, 0, x, y, radius)
    glow.addColorStop(0, '#ffffffb8')
    glow.addColorStop(1, '#00000000')
    ctx.fillStyle = glow
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }

  if (depthMap) {
    ctx.fillStyle = '#ffffff10'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.minFilter = THREE.LinearFilter
  texture.magFilter = THREE.LinearFilter
  texture.generateMipmaps = false
  return texture
}

/** Same-origin, Supabase signed URL, or proxied CDN URL for WebGL sampling. */
function resolveTextureSource(url?: string) {
  if (!url) return undefined
  if (url.startsWith('/')) return url
  if (url.startsWith('https://')) {
    try {
      const parsed = new URL(url)
      // Supabase signed URLs already include auth token; load directly with CORS.
      if (parsed.hostname.endsWith('.supabase.co') && parsed.pathname.includes('/storage/v1/object/sign/')) {
        return url
      }
    } catch {
      return url
    }
    return `/api/proxy-image?url=${encodeURIComponent(url)}`
  }
  return url
}

function configureColorTexture(texture: THREE.Texture) {
  texture.colorSpace = THREE.SRGBColorSpace
  texture.minFilter = THREE.LinearFilter
  texture.magFilter = THREE.LinearFilter
  texture.generateMipmaps = false
  texture.wrapS = THREE.ClampToEdgeWrapping
  texture.wrapT = THREE.ClampToEdgeWrapping
  texture.needsUpdate = true
  return texture
}

function configureDepthTexture(texture: THREE.Texture) {
  texture.colorSpace = THREE.NoColorSpace
  texture.minFilter = THREE.LinearFilter
  texture.magFilter = THREE.LinearFilter
  texture.generateMipmaps = false
  texture.wrapS = THREE.ClampToEdgeWrapping
  texture.wrapT = THREE.ClampToEdgeWrapping
  texture.needsUpdate = true
  return texture
}

function loadTexture(
  source: string,
  configure: (texture: THREE.Texture) => THREE.Texture,
  onLoad: (texture: THREE.Texture) => void,
  onError: () => void,
) {
  const loader = new THREE.TextureLoader()
  loader.setCrossOrigin('anonymous')
  loader.load(
    source,
    (texture) => onLoad(configure(texture)),
    undefined,
    onError,
  )
}

function AmbientWorldLayers({
  backgroundTexture,
  depthTexture,
  particles,
  shader,
  ambience,
}: {
  backgroundTexture: THREE.Texture
  depthTexture: THREE.Texture
  particles: AmbientWorldParticles
  shader: AmbientWorldShader
  ambience: AmbientWorldAmbience
}) {
  const { size } = useThree()
  const pointerOffsetRef = useRef(new THREE.Vector2(0, 0))
  const targetPointerRef = useRef(new THREE.Vector2(0, 0))
  const randomCameraDriftRef = useRef(new THREE.Vector3(0, 0, 0))
  const randomCameraTargetRef = useRef(new THREE.Vector3(0, 0, 0))
  const nextRandomCameraAtRef = useRef(0)
  const neonLightRef = useRef<THREE.PointLight>(null)
  const fillLightRef = useRef<THREE.PointLight>(null)

  const paused = Boolean(shader.paused || ambience.paused)
  const effectsIntensity = ambience.muted ? 0.2 : clamp01(shader.intensity, 1)
  const particleIntensity = ambience.muted ? 0.15 : clamp01(particles.intensity, effectsIntensity)
  const motionScale = finiteNumber(shader.motionScale, size.width > 768 ? 1 : 0.45)
  const particlePreset = particles.preset || 'cyberpunk'

  useFrame((state, delta) => {
    const dt = Math.min(finiteNumber(delta, 0), 0.033)
    const t = finiteNumber(state.clock.getElapsedTime(), 0)
    const alpha = THREE.MathUtils.clamp(0.045 * (dt * 60), 0, 1)
    const pointerX = THREE.MathUtils.clamp(finiteNumber(state.pointer?.x, 0), -1, 1)
    const pointerY = THREE.MathUtils.clamp(finiteNumber(state.pointer?.y, 0), -1, 1)
    const autoOffsetX = Math.sin(t * 0.18) * 0.04 * motionScale
    const autoOffsetY = Math.cos(t * 0.16) * 0.052 * motionScale

    if (t >= nextRandomCameraAtRef.current) {
      randomCameraTargetRef.current.set(
        randomBetween(-0.026, 0.026) * motionScale,
        randomBetween(-0.034, 0.034) * motionScale,
        randomBetween(-0.018, 0.018) * motionScale,
      )
      nextRandomCameraAtRef.current = t + randomBetween(4.5, 8)
    }
    randomCameraDriftRef.current.lerp(randomCameraTargetRef.current, THREE.MathUtils.clamp(0.018 * (dt * 60), 0, 1))

    targetPointerRef.current.set(
      pointerX * 0.034 * motionScale + autoOffsetX,
      pointerY * 0.046 * motionScale + autoOffsetY,
    )
    pointerOffsetRef.current.lerp(targetPointerRef.current, alpha)

    if (!paused) {
      state.camera.position.x = Math.sin(t * 0.08) * 0.046 * motionScale + randomCameraDriftRef.current.x
      state.camera.position.y = Math.cos(t * 0.065) * 0.058 * motionScale + randomCameraDriftRef.current.y
      state.camera.position.z = 2.25 + Math.sin(t * 0.05) * 0.025 * motionScale + randomCameraDriftRef.current.z
      state.camera.lookAt(0, 0, 0)
    }

    if (neonLightRef.current) {
      const flicker = 0.85 + 0.15 * Math.sin(t * 7.5) * Math.sin(t * 3.8 + 1.1)
      neonLightRef.current.intensity = THREE.MathUtils.lerp(
        finiteNumber(neonLightRef.current.intensity, 1),
        (1.2 + flicker) * effectsIntensity,
        THREE.MathUtils.clamp(0.08 * (dt * 60), 0, 1),
      )
    }

    if (fillLightRef.current) {
      fillLightRef.current.intensity = THREE.MathUtils.lerp(
        finiteNumber(fillLightRef.current.intensity, 1),
        0.65 + effectsIntensity * 0.5,
        THREE.MathUtils.clamp(0.06 * (dt * 60), 0, 1),
      )
    }
  })

  return (
    <>
      <ambientLight color={ambience.ambientColor ?? defaultAmbience.ambientColor} intensity={0.5} />
      <pointLight
        ref={neonLightRef}
        position={[1.8, 1.2, 1.8]}
        color={ambience.neonColor ?? defaultAmbience.neonColor}
        intensity={1.25}
        distance={8}
      />
      <pointLight
        ref={fillLightRef}
        position={[-1.6, -0.8, 1.2]}
        color={ambience.fogColor ?? defaultAmbience.fogColor}
        intensity={1}
        distance={7}
      />

      {shader.enabled !== false ? (
        <ShaderBackground
          texture={backgroundTexture}
          depthTexture={depthTexture}
          paused={paused}
          effectsIntensity={effectsIntensity}
          pointerOffset={pointerOffsetRef.current}
          motionScale={motionScale}
        />
      ) : null}

      <DepthParallax
        texture={backgroundTexture}
        depthTexture={depthTexture}
        paused={paused}
        intensity={effectsIntensity}
        pointerOffset={pointerOffsetRef.current}
        motionScale={motionScale}
      />

      {particles.enabled !== false ? (
        <ParticleLayer preset={particlePreset} paused={paused} intensity={particleIntensity} />
      ) : null}
    </>
  )
}

export function AmbientWorld({
  backgroundImage,
  depthMap,
  particles = {},
  shader = {},
  ambience = {},
}: AmbientWorldProps) {
  const particleConfig = particleConfigFrom(particles)
  const shaderConfig = shaderConfigFrom(shader)
  const ambienceConfig = ambienceConfigFrom(ambience)
  const fallbackBackgroundTexture = useMemo(() => createFallbackTexture(backgroundImage), [backgroundImage])
  const fallbackDepthTexture = useMemo(() => createFallbackDepthMap(depthMap), [depthMap])
  const [backgroundTexture, setBackgroundTexture] = useState<THREE.Texture>(fallbackBackgroundTexture)
  const [depthTexture, setDepthTexture] = useState<THREE.Texture>(fallbackDepthTexture)

  const backgroundSource = resolveTextureSource(backgroundImage)
  const depthSource = resolveTextureSource(depthMap)

  useEffect(() => {
    setBackgroundTexture(fallbackBackgroundTexture)
    if (!backgroundSource) return

    let cancelled = false
    loadTexture(
      backgroundSource,
      configureColorTexture,
      (texture) => {
        if (cancelled) {
          texture.dispose()
          return
        }
        setBackgroundTexture(texture)
      },
      () => {
        if (!cancelled) setBackgroundTexture(fallbackBackgroundTexture)
      },
    )

    return () => {
      cancelled = true
    }
  }, [backgroundSource, fallbackBackgroundTexture])

  useEffect(() => {
    setDepthTexture(fallbackDepthTexture)
    if (!depthSource) return

    let cancelled = false
    loadTexture(
      depthSource,
      configureDepthTexture,
      (texture) => {
        if (cancelled) {
          texture.dispose()
          return
        }
        setDepthTexture(texture)
      },
      () => {
        if (!cancelled) setDepthTexture(fallbackDepthTexture)
      },
    )

    return () => {
      cancelled = true
    }
  }, [depthSource, fallbackDepthTexture])

  useEffect(() => {
    return () => {
      fallbackBackgroundTexture.dispose()
      fallbackDepthTexture.dispose()
    }
  }, [fallbackBackgroundTexture, fallbackDepthTexture])

  return (
    <Canvas
      className="pointer-events-none absolute inset-0 z-0 h-full w-full"
      dpr={[1, 1.5]}
      gl={{ antialias: false, alpha: false, powerPreference: 'high-performance' }}
      camera={{ position: [0, 0, 2.25], fov: 52, near: 0.1, far: 10 }}
      frameloop={shaderConfig.paused || ambienceConfig.paused ? 'demand' : 'always'}
    >
      <AmbientWorldLayers
        backgroundTexture={backgroundTexture}
        depthTexture={depthTexture}
        particles={particleConfig}
        shader={shaderConfig}
        ambience={ambienceConfig}
      />
    </Canvas>
  )
}

export default AmbientWorld
