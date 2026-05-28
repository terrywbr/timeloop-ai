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
}

const presetConfigs: Record<string, ParticlePresetConfig> = {
  cyberpunk: {
    count: 430,
    colorA: '#5ff3ff',
    colorB: '#ff6bd6',
    opacity: 0.62,
    size: 0.026,
    riseSpeed: 0.068,
    horizontalDrift: 0.02,
  },
  'rain-neon-dust': {
    count: 430,
    colorA: '#5ff3ff',
    colorB: '#ff6bd6',
    opacity: 0.62,
    size: 0.026,
    riseSpeed: 0.068,
    horizontalDrift: 0.02,
  },
  'cosmic-dust': {
    count: 340,
    colorA: '#ffffff',
    colorB: '#cfd8ff',
    opacity: 0.46,
    size: 0.03,
    riseSpeed: 0.038,
    horizontalDrift: 0.012,
  },
  'floating-stardust': {
    count: 340,
    colorA: '#ffffff',
    colorB: '#cfd8ff',
    opacity: 0.46,
    size: 0.03,
    riseSpeed: 0.038,
    horizontalDrift: 0.012,
  },
  'underwater-mist': {
    count: 380,
    colorA: '#8be9ff',
    colorB: '#2f8dff',
    opacity: 0.42,
    size: 0.034,
    riseSpeed: 0.032,
    horizontalDrift: 0.016,
  },
}

const defaultPreset: ParticlePresetConfig = {
  count: 240,
  colorA: '#d8e8ff',
  colorB: '#9ec4ff',
  opacity: 0.42,
  size: 0.028,
  riseSpeed: 0.04,
  horizontalDrift: 0.014,
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

export default function ParticleLayer({ preset, paused = false, intensity = 1 }: ParticleLayerProps) {
  const config = getPresetConfig(preset)
  const pointsRef = useRef<THREE.Points>(null)
  const positionRef = useRef<THREE.BufferAttribute>(null)
  const volume = useMemo(() => ({ x: 7.5, y: 4.4, z: 4.8 }), [])

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

      const verticalDrift = config.riseSpeed * (0.65 + safeIntensity * 0.55)
      const verticalBob = Math.sin(now * 0.42 + phase) * dt * config.riseSpeed * 0.32

      arr[idx + 1] += dt * verticalDrift + verticalBob
      arr[idx] += Math.sin(now * 0.08 + phase) * dt * config.horizontalDrift
      arr[idx + 2] += Math.cos(now * 0.06 + phase) * dt * config.horizontalDrift * 0.6

      if (arr[idx + 1] > volume.y) {
        arr[idx] = rand(-volume.x, volume.x)
        arr[idx + 1] = -volume.y
        arr[idx + 2] = rand(-volume.z, volume.z)
      }
    }

    attr.needsUpdate = true

    if (pointsRef.current) {
      pointsRef.current.position.y = Math.sin(now * 0.12) * 0.18 * safeIntensity
      pointsRef.current.rotation.z = Math.sin(now * 0.035) * 0.012
    }
  })

  return (
    <points ref={pointsRef} frustumCulled={false}>
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
