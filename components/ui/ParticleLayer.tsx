'use client'

import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'

type ParticleLayerProps = {
  preset: string
  paused?: boolean
  intensity?: number
}

type ParticlePresetConfig = {
  count: number
  colorA: string
  colorB: string
  opacity: number
  size: number
  riseSpeed: number
  horizontalDrift: number
  motion: 'rise' | 'fall' | 'float' | 'bubble' | 'streak' | 'haze'
  shape: 'spark' | 'star' | 'ring' | 'flake' | 'leaf' | 'streak' | 'mist'
}

const presetConfigs: Record<string, ParticlePresetConfig> = {
  cyberpunk: {
    count: 620,
    colorA: '#5ff3ff',
    colorB: '#ff6bd6',
    opacity: 0.78,
    size: 0.09,
    riseSpeed: 0.2,
    horizontalDrift: 0.08,
    motion: 'rise',
    shape: 'spark',
  },
  'rain-neon-dust': {
    count: 620,
    colorA: '#5ff3ff',
    colorB: '#ff6bd6',
    opacity: 0.78,
    size: 0.09,
    riseSpeed: 0.2,
    horizontalDrift: 0.08,
    motion: 'rise',
    shape: 'spark',
  },
  'cosmic-dust': {
    count: 520,
    colorA: '#ffffff',
    colorB: '#cfd8ff',
    opacity: 0.7,
    size: 0.12,
    riseSpeed: 0.08,
    horizontalDrift: 0.055,
    motion: 'float',
    shape: 'star',
  },
  'floating-stardust': {
    count: 520,
    colorA: '#ffffff',
    colorB: '#cfd8ff',
    opacity: 0.7,
    size: 0.12,
    riseSpeed: 0.08,
    horizontalDrift: 0.055,
    motion: 'float',
    shape: 'star',
  },
  'underwater-mist': {
    count: 430,
    colorA: '#8be9ff',
    colorB: '#2f8dff',
    opacity: 0.72,
    size: 0.16,
    riseSpeed: 0.14,
    horizontalDrift: 0.075,
    motion: 'bubble',
    shape: 'ring',
  },
  'jazz-golden-dust': {
    count: 420,
    colorA: '#ffd978',
    colorB: '#c9a227',
    opacity: 0.68,
    size: 0.1,
    riseSpeed: 0.08,
    horizontalDrift: 0.05,
    motion: 'float',
    shape: 'spark',
  },
  'nordic-snow-dust': {
    count: 520,
    colorA: '#f5f8ff',
    colorB: '#b8cce8',
    opacity: 0.76,
    size: 0.115,
    riseSpeed: 0.1,
    horizontalDrift: 0.09,
    motion: 'fall',
    shape: 'flake',
  },
  'campfire-embers': {
    count: 520,
    colorA: '#ffb347',
    colorB: '#ff6b2b',
    opacity: 0.82,
    size: 0.085,
    riseSpeed: 0.24,
    horizontalDrift: 0.08,
    motion: 'rise',
    shape: 'spark',
  },
  'nature-leaves': {
    count: 360,
    colorA: '#7dff9a',
    colorB: '#3cb878',
    opacity: 0.72,
    size: 0.145,
    riseSpeed: 0.09,
    horizontalDrift: 0.13,
    motion: 'fall',
    shape: 'leaf',
  },
  'city-light-streaks': {
    count: 460,
    colorA: '#ffd978',
    colorB: '#ff9f43',
    opacity: 0.86,
    size: 0.22,
    riseSpeed: 0.26,
    horizontalDrift: 0.12,
    motion: 'streak',
    shape: 'streak',
  },
  'desert-sand-mist': {
    count: 360,
    colorA: '#f4d4a0',
    colorB: '#c9956a',
    opacity: 0.62,
    size: 0.2,
    riseSpeed: 0.055,
    horizontalDrift: 0.16,
    motion: 'haze',
    shape: 'mist',
  },
}

const defaultPreset: ParticlePresetConfig = {
  count: 240,
  colorA: '#d8e8ff',
  colorB: '#9ec4ff',
  opacity: 0.42,
  size: 0.1,
  riseSpeed: 0.08,
  horizontalDrift: 0.05,
  motion: 'float',
  shape: 'star',
}

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min
}

function finiteNumber(value: unknown, fallback = 0) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function getPresetConfig(preset: string) {
  return presetConfigs[preset] ?? defaultPreset
}

function createParticleTexture(shape: ParticlePresetConfig['shape']) {
  const canvas = document.createElement('canvas')
  canvas.width = 96
  canvas.height = 96
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.translate(48, 48)
  ctx.fillStyle = 'white'
  ctx.strokeStyle = 'white'
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  if (shape === 'streak') {
    const gradient = ctx.createLinearGradient(-44, 0, 44, 0)
    gradient.addColorStop(0, 'rgba(255,255,255,0)')
    gradient.addColorStop(0.45, 'rgba(255,255,255,0.95)')
    gradient.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.strokeStyle = gradient
    ctx.lineWidth = 9
    ctx.beginPath()
    ctx.moveTo(-42, 0)
    ctx.lineTo(42, 0)
    ctx.stroke()
  } else if (shape === 'ring') {
    ctx.lineWidth = 6
    ctx.globalAlpha = 0.9
    ctx.beginPath()
    ctx.arc(0, 0, 26, 0, Math.PI * 2)
    ctx.stroke()
    ctx.globalAlpha = 0.25
    ctx.beginPath()
    ctx.arc(0, 0, 36, 0, Math.PI * 2)
    ctx.stroke()
  } else if (shape === 'leaf') {
    ctx.rotate(-0.5)
    ctx.beginPath()
    ctx.ellipse(0, 0, 14, 32, 0, 0, Math.PI * 2)
    ctx.fill()
  } else if (shape === 'flake') {
    ctx.lineWidth = 4
    for (let i = 0; i < 6; i += 1) {
      ctx.rotate(Math.PI / 3)
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.lineTo(0, 32)
      ctx.stroke()
    }
    ctx.beginPath()
    ctx.arc(0, 0, 7, 0, Math.PI * 2)
    ctx.fill()
  } else if (shape === 'mist') {
    const gradient = ctx.createRadialGradient(0, 0, 4, 0, 0, 42)
    gradient.addColorStop(0, 'rgba(255,255,255,0.55)')
    gradient.addColorStop(0.45, 'rgba(255,255,255,0.25)')
    gradient.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(0, 0, 42, 0, Math.PI * 2)
    ctx.fill()
  } else if (shape === 'star') {
    ctx.lineWidth = 5
    ctx.beginPath()
    ctx.moveTo(-28, 0)
    ctx.lineTo(28, 0)
    ctx.moveTo(0, -28)
    ctx.lineTo(0, 28)
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(0, 0, 9, 0, Math.PI * 2)
    ctx.fill()
  } else {
    const gradient = ctx.createRadialGradient(0, 0, 2, 0, 0, 34)
    gradient.addColorStop(0, 'rgba(255,255,255,1)')
    gradient.addColorStop(0.35, 'rgba(255,255,255,0.75)')
    gradient.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(0, 0, 34, 0, Math.PI * 2)
    ctx.fill()
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true
  return texture
}

export default function ParticleLayer({ preset, paused = false, intensity = 1 }: ParticleLayerProps) {
  const config = getPresetConfig(preset)
  const pointsRef = useRef<THREE.Points>(null)
  const positionRef = useRef<THREE.BufferAttribute>(null)
  const volume = useMemo(() => ({ x: 7.5, y: 4.4, z: 4.8 }), [])
  const particleTexture = useMemo(() => createParticleTexture(config.shape), [config.shape])

  const positions = useMemo(() => {
    const arr = new Float32Array(config.count * 3)

    for (let i = 0; i < config.count; i += 1) {
      arr[i * 3] = rand(-volume.x, volume.x)
      arr[i * 3 + 1] = rand(-volume.y, volume.y)
      arr[i * 3 + 2] = rand(-volume.z, volume.z)
    }

    return arr
  }, [config.count, volume.x, volume.y, volume.z])

  const colors = useMemo(() => {
    const colorA = new THREE.Color(config.colorA)
    const colorB = new THREE.Color(config.colorB)
    const arr = new Float32Array(config.count * 3)

    for (let i = 0; i < config.count; i += 1) {
      const mixed = colorA.clone().lerp(colorB, i % 2 === 0 ? 0.25 : 0.75)
      arr[i * 3] = mixed.r
      arr[i * 3 + 1] = mixed.g
      arr[i * 3 + 2] = mixed.b
    }

    return arr
  }, [config.colorA, config.colorB, config.count])

  useFrame((state, delta) => {
    const attr = positionRef.current
    if (!attr || paused) return

    const dt = Math.min(finiteNumber(delta, 0), 0.033)
    const now = finiteNumber(state.clock.elapsedTime, 0)
    const safeIntensity = THREE.MathUtils.clamp(finiteNumber(intensity, 1), 0, 1)
    const arr = attr.array as Float32Array

    for (let i = 0; i < config.count; i += 1) {
      const idx = i * 3
      const phase = i * 0.137

      const speed = config.riseSpeed * (0.65 + safeIntensity * 0.55)
      const bob = Math.sin(now * 0.42 + phase) * dt * config.riseSpeed * 0.32

      switch (config.motion) {
        case 'fall':
          arr[idx + 1] -= dt * speed * 1.8 + bob
          arr[idx] += Math.sin(now * 0.32 + phase) * dt * config.horizontalDrift * 3.8
          break
        case 'bubble':
          arr[idx + 1] += dt * speed * 2 + bob
          arr[idx] += Math.sin(now * 1.35 + phase) * dt * config.horizontalDrift * 4
          arr[idx + 2] += Math.cos(now * 0.8 + phase) * dt * config.horizontalDrift * 1.5
          break
        case 'streak':
          arr[idx] += dt * speed * 5.5
          arr[idx + 1] += Math.sin(now * 0.45 + phase) * dt * config.horizontalDrift * 1.5
          break
        case 'haze':
          arr[idx] += dt * config.horizontalDrift * (1.9 + safeIntensity)
          arr[idx + 1] += Math.sin(now * 0.3 + phase) * dt * config.riseSpeed * 1.1
          arr[idx + 2] += Math.cos(now * 0.26 + phase) * dt * config.horizontalDrift * 1.5
          break
        case 'float':
          arr[idx + 1] += Math.sin(now * 0.45 + phase) * dt * speed * 1.8
          arr[idx] += Math.sin(now * 0.24 + phase) * dt * config.horizontalDrift * 2.8
          arr[idx + 2] += Math.cos(now * 0.18 + phase) * dt * config.horizontalDrift * 1.8
          break
        case 'rise':
        default:
          arr[idx + 1] += dt * speed * 2 + bob
          arr[idx] += Math.sin(now * 0.2 + phase) * dt * config.horizontalDrift * 2.4
          arr[idx + 2] += Math.cos(now * 0.14 + phase) * dt * config.horizontalDrift * 1.4
          break
      }

      if (arr[idx + 1] > volume.y || arr[idx + 1] < -volume.y || arr[idx] > volume.x || arr[idx] < -volume.x) {
        arr[idx] = config.motion === 'streak' ? -volume.x : rand(-volume.x, volume.x)
        arr[idx + 1] = config.motion === 'fall' ? volume.y : config.motion === 'rise' || config.motion === 'bubble' ? -volume.y : rand(-volume.y, volume.y)
        arr[idx + 2] = rand(-volume.z, volume.z)
      }
    }

    attr.needsUpdate = true

    if (pointsRef.current) {
      pointsRef.current.position.y = Math.sin(now * 0.16) * 0.3 * safeIntensity
      pointsRef.current.rotation.z =
        config.motion === 'streak'
          ? -0.16
          : Math.sin(now * (config.motion === 'haze' ? 0.08 : 0.05)) * 0.04
    }
  })

  return (
    <points key={preset} ref={pointsRef} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute
          ref={positionRef}
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        vertexColors
        map={particleTexture ?? undefined}
        alphaTest={0.02}
        size={config.size}
        sizeAttenuation
        transparent
        opacity={config.opacity * THREE.MathUtils.clamp(finiteNumber(intensity, 1), 0, 1)}
        depthWrite={false}
        depthTest={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}
