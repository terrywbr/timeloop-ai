'use client'

import { useFrame, useThree } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'

type ShaderBackgroundProps = {
  texture: THREE.Texture
  depthTexture: THREE.Texture
  paused: boolean
  effectsIntensity: number
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
  uniform float uTime;
  uniform sampler2D uTexture;
  uniform sampler2D uDepthMap;
  uniform float uFogDensity;
  uniform float uNeonStrength;
  uniform float uBloomStrength;
  uniform float uZoom;
  uniform float uParallax;
  uniform vec2 uPointer;

  varying vec2 vUv;

  void main() {
    float depth = texture2D(uDepthMap, vUv).r;

    vec2 drift = vec2(
      sin((vUv.y * 9.0) + (uTime * 0.07)),
      cos((vUv.x * 8.0) + (uTime * 0.05))
    ) * vec2(0.0028, 0.0048) * uParallax;

    vec2 parallax = (vUv - 0.5) * vec2(0.065, 0.095) * depth * uParallax;
    vec2 uv = vUv + drift + parallax + (uPointer * vec2(0.014, 0.024));
    vec2 zoomedUv = (uv - 0.5) / uZoom + 0.5;

    vec3 color = texture2D(uTexture, zoomedUv).rgb;

    float rainScan = smoothstep(0.94, 1.0, fract(vUv.y * 120.0 - uTime * 1.8));
    color += vec3(0.02, 0.05, 0.09) * rainScan * 0.25;

    float fogMask = smoothstep(0.15, 1.05, length(vUv - 0.5));
    color = mix(color, vec3(0.03, 0.05, 0.08), fogMask * uFogDensity * 0.4);

    float flicker = 0.6 + 0.4 * sin(uTime * 8.0) * sin(uTime * 3.7 + 1.4);
    float neonBandLeft = smoothstep(0.0, 0.3, 1.0 - abs(vUv.x - 0.2) * 3.0);
    float neonBandRight = smoothstep(0.0, 0.3, 1.0 - abs(vUv.x - 0.78) * 3.0);
    float neonMask = max(neonBandLeft, neonBandRight) * smoothstep(0.05, 0.85, vUv.y);
    color += vec3(0.12, 0.38, 0.82) * neonMask * flicker * uNeonStrength * 0.5;

    float luminance = max(max(color.r, color.g), color.b);
    float bloom = smoothstep(0.48, 0.95, luminance);
    color += color * bloom * 0.42 * uBloomStrength;

    gl_FragColor = vec4(color, 1.0);
  }
`

export default function ShaderBackground({
  texture,
  depthTexture,
  paused,
  effectsIntensity,
  pointerOffset,
  motionScale,
}: ShaderBackgroundProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const randomDriftRef = useRef(new THREE.Vector3(0, 0, 0))
  const randomTargetRef = useRef(new THREE.Vector3(0, 0, 0))
  const nextRandomAtRef = useRef(0)
  const { viewport } = useThree()

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uTexture: { value: texture },
      uDepthMap: { value: depthTexture },
      uFogDensity: { value: 0.65 },
      uNeonStrength: { value: 0.85 },
      uBloomStrength: { value: 1.0 },
      uZoom: { value: 1.02 },
      uParallax: { value: 1.0 },
      uPointer: { value: new THREE.Vector2(0, 0) },
    }),
    [texture, depthTexture],
  )

  useFrame((state, delta) => {
    if (!materialRef.current) return
    materialRef.current.uniforms.uTexture.value = texture
    materialRef.current.uniforms.uDepthMap.value = depthTexture

    const dt = Math.min(finiteNumber(delta, 0), 0.033)
    const alpha = THREE.MathUtils.clamp(0.07 * (dt * 60), 0, 1)
    const safePointerOffset = finiteVector2(pointerOffset)
    const safeEffectsIntensity = finiteNumber(effectsIntensity, 1)
    const safeMotionScale = finiteNumber(motionScale, 0)

    if (!paused) uniforms.uTime.value += dt

    const t = finiteNumber(state.clock.getElapsedTime(), finiteNumber(uniforms.uTime.value, 0))
    const shaderTime = finiteNumber(uniforms.uTime.value, 0)

    if (t >= nextRandomAtRef.current) {
      randomTargetRef.current.set(
        randomBetween(-0.022, 0.022) * safeMotionScale,
        randomBetween(-0.03, 0.03) * safeMotionScale,
        randomBetween(-0.008, 0.012) * safeMotionScale,
      )
      nextRandomAtRef.current = t + randomBetween(4, 7.5)
    }
    randomDriftRef.current.lerp(randomTargetRef.current, THREE.MathUtils.clamp(0.02 * (dt * 60), 0, 1))

    const slowZoom = 1 + Math.sin(t * 0.05) * 0.014 + randomDriftRef.current.z

    if (meshRef.current) {
      meshRef.current.scale.set(viewport.width * slowZoom, viewport.height * slowZoom, 1)
      meshRef.current.position.x = randomDriftRef.current.x
      meshRef.current.position.y = Math.cos(t * 0.055) * 0.014 * safeMotionScale + randomDriftRef.current.y
      meshRef.current.position.z = Math.sin(t * 0.04) * 0.012
    }

    uniforms.uZoom.value = 1.018 + Math.sin(shaderTime * 0.08) * 0.014 + randomDriftRef.current.z * 0.5
    uniforms.uPointer.value.lerp(safePointerOffset, alpha)
    uniforms.uNeonStrength.value = THREE.MathUtils.lerp(
      finiteNumber(uniforms.uNeonStrength.value, 0.85),
      0.25 + safeEffectsIntensity * 0.75,
      THREE.MathUtils.clamp(0.06 * (dt * 60), 0, 1),
    )
    uniforms.uBloomStrength.value = THREE.MathUtils.lerp(
      finiteNumber(uniforms.uBloomStrength.value, 1),
      0.4 + safeEffectsIntensity * 0.9,
      THREE.MathUtils.clamp(0.06 * (dt * 60), 0, 1),
    )
    uniforms.uParallax.value = THREE.MathUtils.lerp(
      finiteNumber(uniforms.uParallax.value, 1),
      0.65 + safeMotionScale * 0.35,
      THREE.MathUtils.clamp(0.05 * (dt * 60), 0, 1),
    )
  })

  return (
    <mesh
      ref={meshRef}
      scale={[viewport.width, viewport.height, 1]}
      position={[0, 0, 0]}
      renderOrder={-100}
      frustumCulled={false}
    >
      <planeGeometry args={[1, 1, 1, 1]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        depthWrite={false}
        depthTest={false}
        toneMapped={false}
      />
    </mesh>
  )
}
