'use client'

import { useFrame, useThree } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'

type DepthParallaxProps = {
  texture: THREE.Texture
  depthTexture: THREE.Texture
  paused: boolean
  intensity: number
  pointerOffset?: THREE.Vector2
  motionScale?: number
}

function finiteNumber(value: unknown, fallback = 0) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min
}

function finiteVector2(value: THREE.Vector2 | undefined) {
  return new THREE.Vector2(finiteNumber(value?.x), finiteNumber(value?.y))
}

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragmentShader = `
  uniform sampler2D uTexture;
  uniform sampler2D uDepthMap;
  uniform vec2 uOffset;
  uniform vec2 uPointer;
  uniform float uIntensity;
  uniform float uMotionScale;

  varying vec2 vUv;

  void main() {
    float depth = texture2D(uDepthMap, vUv).r;
    vec2 directionalLift = vec2(0.86, 1.34);
    vec2 uv = vUv + (uOffset + uPointer * directionalLift) * (depth * 0.72) * uMotionScale;
    vec3 sampleColor = texture2D(uTexture, uv).rgb;

    float nearMask = smoothstep(0.5, 0.95, depth);
    float alpha = nearMask * 0.34 * uIntensity;

    vec3 lifted = sampleColor * 1.08 + vec3(0.02, 0.05, 0.08) * nearMask;
    gl_FragColor = vec4(lifted, alpha);
  }
`

export default function DepthParallax({
  texture,
  depthTexture,
  paused,
  intensity,
  pointerOffset,
  motionScale,
}: DepthParallaxProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const targetPointerRef = useRef(new THREE.Vector2(0, 0))
  const randomDriftRef = useRef(new THREE.Vector3(0, 0, 0))
  const randomTargetRef = useRef(new THREE.Vector3(0, 0, 0))
  const nextRandomAtRef = useRef(0)
  const { viewport } = useThree()

  const uniforms = useMemo(
    () => ({
      uTexture: { value: texture },
      uDepthMap: { value: depthTexture },
      uOffset: { value: new THREE.Vector2(0, 0) },
      uPointer: { value: new THREE.Vector2(0, 0) },
      uIntensity: { value: finiteNumber(intensity, 1) },
      uMotionScale: { value: finiteNumber(motionScale, 0) },
    }),
    [texture, depthTexture, intensity, motionScale],
  )

  useFrame((state, delta) => {
    if (!materialRef.current) return
    materialRef.current.uniforms.uTexture.value = texture
    materialRef.current.uniforms.uDepthMap.value = depthTexture

    const dt = Math.min(finiteNumber(delta, 0), 0.033)
    const alpha = THREE.MathUtils.clamp(0.08 * (dt * 60), 0, 1)
    const safePointerOffset = finiteVector2(pointerOffset)
    const safeIntensity = finiteNumber(intensity, 1)
    const safeMotionScale = finiteNumber(motionScale, 0)
    const t = finiteNumber(state.clock.getElapsedTime(), 0)
    const autoOffsetX = Math.sin(t * 0.16) * 0.028 * safeMotionScale
    const autoOffsetY = Math.cos(t * 0.14) * 0.044 * safeMotionScale

    if (t >= nextRandomAtRef.current) {
      randomTargetRef.current.set(
        randomBetween(-0.026, 0.026) * safeMotionScale,
        randomBetween(-0.04, 0.04) * safeMotionScale,
        randomBetween(-0.006, 0.012) * safeMotionScale,
      )
      nextRandomAtRef.current = t + randomBetween(4.5, 8.5)
    }
    randomDriftRef.current.lerp(randomTargetRef.current, THREE.MathUtils.clamp(0.018 * (dt * 60), 0, 1))

    targetPointerRef.current.set(
      finiteNumber(safePointerOffset.x + autoOffsetX + randomDriftRef.current.x * 0.35, 0),
      finiteNumber(safePointerOffset.y + autoOffsetY + randomDriftRef.current.y * 0.35, 0),
    )

    if (!paused) {
      const slowZoom = 1 + Math.sin(t * 0.05 + 0.8) * 0.012 + randomDriftRef.current.z

      if (meshRef.current) {
        meshRef.current.scale.set(viewport.width * slowZoom, viewport.height * slowZoom, 1)
        meshRef.current.position.x = randomDriftRef.current.x
        meshRef.current.position.y = Math.sin(t * 0.055 + 0.4) * 0.018 * safeMotionScale + randomDriftRef.current.y
        meshRef.current.position.z = 0.01 + Math.cos(t * 0.035) * 0.008
      }

      uniforms.uOffset.value.set(Math.sin(t * 0.07) * 0.02, Math.cos(t * 0.052) * 0.032)
    }
    uniforms.uPointer.value.lerp(targetPointerRef.current, alpha)
    uniforms.uIntensity.value = THREE.MathUtils.lerp(
      finiteNumber(uniforms.uIntensity.value, 1),
      safeIntensity,
      alpha,
    )
    uniforms.uMotionScale.value = THREE.MathUtils.lerp(
      finiteNumber(uniforms.uMotionScale.value, 0),
      safeMotionScale,
      alpha,
    )
  })

  return (
    <mesh
      ref={meshRef}
      scale={[viewport.width, viewport.height, 1]}
      position={[0, 0, 0.01]}
      renderOrder={-90}
      frustumCulled={false}
    >
      <planeGeometry args={[1, 1, 1, 1]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        depthTest={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </mesh>
  )
}
