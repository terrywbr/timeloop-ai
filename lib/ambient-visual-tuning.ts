/**
 * Tuning for AmbientWorld 3D depth / parallax playback.
 * Lower displacement + ghost alpha reduces foreground "double image" artifacts.
 */
export const AMBIENT_DEPTH_PARALLAX = {
  /** UV shift multiplier applied to depth sample (was 0.72). */
  depthShift: 0.45,
  directionalLiftX: 0.55,
  directionalLiftY: 0.82,
  /** Max ghost-layer opacity before intensity scaling (was 0.34). */
  ghostAlpha: 0.18,
  nearMaskStart: 0.62,
  nearMaskEnd: 0.92,
  colorLift: 1.04,
  tintStrength: 0.04,
}

export const AMBIENT_SHADER_PARALLAX = {
  parallaxX: 0.038,
  parallaxY: 0.055,
  pointerX: 0.009,
  pointerY: 0.015,
  driftX: 0.0028,
  driftY: 0.0048,
}

export const AMBIENT_MOTION = {
  desktopMotionScale: 0.62,
  mobileMotionScale: 0.38,
  /** Scales camera drift in AmbientWorldLayers (0–1). */
  cameraDriftScale: 0.72,
  pointerFollowX: 0.024,
  pointerFollowY: 0.032,
  autoDriftX: 0.028,
  autoDriftY: 0.036,
}
