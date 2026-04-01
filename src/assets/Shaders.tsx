import { useMemo, useRef, useEffect } from 'react'
import * as THREE from 'three'
import { useThree, useFrame } from '@react-three/fiber'
import { AsciiEffect as ThreeAsciiEffect } from 'three-stdlib'
import { useTheme, useMediaQuery } from '@mui/material'

// ─────────────────────────────────────────────────────────────────────────────
// SHADERS.TSX — R3F post-processing effects
//
// ┌─ FBO-BASED (full scene replacement) ──────────────────────────────────────
// │  Render the scene to an offscreen FBO, apply a fullscreen shader pass,
// │  then output to screen. Use ONE at a time per Canvas.
// │
// │  <HalftoneEffect />             — halftone dot grid
// │  <ChromaticAberrationEffect />  — RGB channel separation
// │  <ColorGradeEffect />           — exposure / contrast / saturation
// │  <FilmGrainEffect />            — animated film grain
// │
// └─ OVERLAY (pure alpha blend) ───────────────────────────────────────────────
//    No FBO needed. Stack freely on top of any scene or FBO effect.
//
//    <VignetteEffect />             — edge darkening
//
// Usage example:
//   <Canvas>
//     <ambientLight />
//     <MyScene />
//     <HalftoneEffect gridSize={50} invertLuminance dotColor="#111" bgColor="#fff" />
//     <VignetteEffect strength={0.6} />
//   </Canvas>
// ─────────────────────────────────────────────────────────────────────────────

// ─── Shared vertex shader ────────────────────────────────────────────────────
// Full-screen quad: bypasses all camera/model transforms and maps directly to NDC.
// PlaneGeometry args={[2,2]} produces vertices at (±1, ±1) which fill the screen.

const FULLSCREEN_VERT = /* glsl */`
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`

// ─── Shared FBO factory ───────────────────────────────────────────────────────
function createFBO() {
  return new THREE.WebGLRenderTarget(1, 1, {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    format: THREE.RGBAFormat,
    type: THREE.HalfFloatType,
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// 1.  HALFTONE EFFECT
// ─────────────────────────────────────────────────────────────────────────────

const HALFTONE_FRAG = /* glsl */`
uniform sampler2D tScene;
uniform vec2      resolution;
uniform float     gridSize;
uniform float     dotScale;
uniform float     edgeSoft;
uniform vec3      dotColor;
uniform vec3      bgColor;
uniform float     invertLum;
uniform float     colorMix;
uniform float     sampleRadius;
uniform float     hideBackground;  // 1 = suppress dots in bg cells (drive→0), 0 = off

varying vec2 vUv;

float luma(vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }

void main() {
  // ── grid setup ─────────────────────────────────────────────────────────────
  vec2 aspect   = resolution / max(resolution.x, resolution.y);
  vec2 cells    = floor(vec2(gridSize) * aspect);
  vec2 cellSize = vec2(1.0) / cells;

  vec2 cellId     = floor(vUv * cells);
  vec2 cellUv     = fract(vUv * cells);          // 0‒1 within cell
  vec2 cellCentre = (cellId + 0.5) * cellSize;   // UV of cell centre

  // ── multi-tap scene sample around cell centre ──────────────────────────────
  float taps      = 0.0;
  vec3  colSum    = vec3(0.0);
  float lumSum    = 0.0;
  float alphaSum  = 0.0;
  vec2  texel     = 1.0 / resolution;

  for (float y = -3.0; y <= 3.0; y += 1.0) {
    for (float x = -3.0; x <= 3.0; x += 1.0) {
      if (length(vec2(x, y)) > sampleRadius) continue;
      vec4 s   = texture2D(tScene, cellCentre + vec2(x, y) * texel);
      colSum   += s.rgb;
      lumSum   += luma(s.rgb);
      alphaSum += s.a;
      taps     += 1.0;
    }
  }

  vec3  avgColor = colSum / taps;
  float avgLum   = lumSum / taps;
  float avgAlpha = alphaSum / taps;
  float drive    = mix(avgLum, 1.0 - avgLum, invertLum);

  // ── background masking (grid-snapped) ──────────────────────────────────────
  // Detect background via the FBO alpha channel: geometry writes alpha=1,
  // background (clear) writes alpha=0.  Both detection and the dot drive use
  // the same cell-centre kernel, so the mask is quantised to the dot grid and
  // no cell is ever split.  Background cells have their drive zeroed → zero dot
  // radius → output is pure bgColor (fully opaque, no transparency required).
  float cellIsObject = step(0.01, avgAlpha);
  float isFg         = hideBackground > 0.5 ? cellIsObject : 1.0;
  float effectiveDrv = drive * isFg;

  // ── SDF circle ─────────────────────────────────────────────────────────────
  float maxR  = dotScale * 0.5;
  float r     = maxR * effectiveDrv;
  float dist  = length(cellUv - 0.5) - r;
  float alpha = 1.0 - smoothstep(-edgeSoft, edgeSoft, dist);

  // ── colouring ──────────────────────────────────────────────────────────────
  vec3 dotCol = mix(dotColor, avgColor, colorMix);
  gl_FragColor = vec4(mix(bgColor, dotCol, alpha), 1.0);
}
`

export interface HalftoneProps {
  /** Dot grid density along the longest axis (default 45) */
  gridSize?: number
  /** Max dot radius as fraction of cell size, 0–1 (default 0.9) */
  dotScale?: number
  /** Anti-alias softness (default 0.04) */
  edgeSoft?: number
  /** Dot colour when colorMix = 0 (default black) */
  dotColor?: THREE.ColorRepresentation
  /** Background colour between dots (default white) */
  bgColor?: THREE.ColorRepresentation
  /** true → bright areas = big dots (default true) */
  invertLuminance?: boolean
  /** 0 = monochrome dots, 1 = scene-coloured dots (default 0) */
  colorMix?: number
  /** Tap radius in texels for cell-average (default 3) */
  sampleRadius?: number
  /** Render target resolution scale (default 1) */
  resolutionScale?: number
  /**
   * When true, cells whose average colour is close to `bgColor` are treated as
   * background: their dot drive is forced to 0, producing a dot-free cell that
   * outputs pure `bgColor`.  The boundary is quantised to the same dot grid so
   * no cell is ever split.  Output stays fully opaque — no alpha / transparent
   * canvas required.  Works best when `bgColor` matches the scene clear colour.
   * (default false)
   */
  hideBackground?: boolean
}

export function HalftoneEffect({
  gridSize = 45, dotScale = 0.9, edgeSoft = 0.04,
  dotColor = '#000000', bgColor = '#ffffff',
  invertLuminance = true, colorMix = 0, sampleRadius = 3,
  resolutionScale = 1, hideBackground = false,
}: HalftoneProps) {
  const { gl, scene, camera, size, viewport } = useThree()

  const fbo = useMemo(() => createFBO(), [])
  useEffect(() => {
    fbo.setSize(
      Math.floor(size.width  * viewport.dpr * resolutionScale),
      Math.floor(size.height * viewport.dpr * resolutionScale),
    )
  }, [fbo, size, viewport.dpr, resolutionScale])
  useEffect(() => () => fbo.dispose(), [fbo])

  const mat = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      tScene:       { value: null },
      resolution:   { value: new THREE.Vector2() },
      gridSize:     { value: gridSize },
      dotScale:     { value: dotScale },
      edgeSoft:     { value: edgeSoft },
      dotColor:     { value: new THREE.Color(dotColor) },
      bgColor:      { value: new THREE.Color(bgColor) },
      invertLum:    { value: invertLuminance ? 1.0 : 0.0 },
      colorMix:        { value: colorMix },
      sampleRadius:    { value: sampleRadius },
      hideBackground:  { value: hideBackground ? 1.0 : 0.0 },
    },
    vertexShader: FULLSCREEN_VERT,
    fragmentShader: HALFTONE_FRAG,
    depthTest: false,
    depthWrite: false,
  }), []) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => mat.dispose(), [mat])

  const meshRef = useRef<THREE.Mesh>(null)

  useFrame(() => {
    const mesh = meshRef.current
    if (!mesh) return

    // Sync prop-driven uniforms each frame
    mat.uniforms.gridSize.value     = gridSize
    mat.uniforms.dotScale.value     = dotScale
    mat.uniforms.edgeSoft.value     = edgeSoft
    ;(mat.uniforms.dotColor.value  as THREE.Color).set(dotColor)
    ;(mat.uniforms.bgColor.value   as THREE.Color).set(bgColor)
    mat.uniforms.invertLum.value    = invertLuminance ? 1.0 : 0.0
    mat.uniforms.colorMix.value        = colorMix
    mat.uniforms.sampleRadius.value    = sampleRadius
    mat.uniforms.hideBackground.value  = hideBackground ? 1.0 : 0.0

    const w = Math.floor(size.width  * viewport.dpr * resolutionScale)
    const h = Math.floor(size.height * viewport.dpr * resolutionScale)
    ;(mat.uniforms.resolution.value as THREE.Vector2).set(w, h)

    // Pass 1 — render scene (quad hidden) into FBO
    mesh.visible = false
    gl.setRenderTarget(fbo)
    gl.render(scene, camera)

    // Pass 2 — render scene + quad (reads FBO) to screen
    mesh.visible = true
    mat.uniforms.tScene.value = fbo.texture
    gl.setRenderTarget(null)
    gl.render(scene, camera)
  }, 1) // priority 1 → takes over R3F's auto-render; WE are responsible for gl.render

  return (
    <mesh ref={meshRef} frustumCulled={false} renderOrder={999999}>
      <planeGeometry args={[2, 2]} />
      <primitive object={mat} attach="material" />
    </mesh>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 2.  CHROMATIC ABERRATION EFFECT
// ─────────────────────────────────────────────────────────────────────────────

const CHROMA_FRAG = /* glsl */`
uniform sampler2D tScene;
uniform float strength;   // 0.0 – 0.05 is a good range

varying vec2 vUv;

void main() {
  // Aberration grows radially from centre — matches real lens distortion
  vec2 dir  = vUv - 0.5;
  float len = length(dir);

  float r = texture2D(tScene, vUv + dir * strength * len).r;
  float g = texture2D(tScene, vUv).g;
  float b = texture2D(tScene, vUv - dir * strength * len).b;
  float a = texture2D(tScene, vUv).a;

  gl_FragColor = vec4(r, g, b, a);
}
`

export interface ChromaticAberrationProps {
  /** Separation strength — 0.0 = off, ~0.015 = subtle, ~0.05 = strong (default 0.012) */
  strength?: number
  /** Render target resolution scale (default 1) */
  resolutionScale?: number
}

export function ChromaticAberrationEffect({
  strength = 0.012,
  resolutionScale = 1,
}: ChromaticAberrationProps) {
  const { gl, scene, camera, size, viewport } = useThree()

  const fbo = useMemo(() => createFBO(), [])
  useEffect(() => {
    fbo.setSize(
      Math.floor(size.width  * viewport.dpr * resolutionScale),
      Math.floor(size.height * viewport.dpr * resolutionScale),
    )
  }, [fbo, size, viewport.dpr, resolutionScale])
  useEffect(() => () => fbo.dispose(), [fbo])

  const mat = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      tScene:   { value: null },
      strength: { value: strength },
    },
    vertexShader: FULLSCREEN_VERT,
    fragmentShader: CHROMA_FRAG,
    depthTest: false,
    depthWrite: false,
  }), []) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => mat.dispose(), [mat])

  const meshRef = useRef<THREE.Mesh>(null)

  useFrame(() => {
    const mesh = meshRef.current
    if (!mesh) return

    mat.uniforms.strength.value = strength

    mesh.visible = false
    gl.setRenderTarget(fbo)
    gl.render(scene, camera)

    mesh.visible = true
    mat.uniforms.tScene.value = fbo.texture
    gl.setRenderTarget(null)
    gl.render(scene, camera)
  }, 1)

  return (
    <mesh ref={meshRef} frustumCulled={false} renderOrder={999999}>
      <planeGeometry args={[2, 2]} />
      <primitive object={mat} attach="material" />
    </mesh>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 3.  COLOR GRADE EFFECT
// ─────────────────────────────────────────────────────────────────────────────

const COLOR_GRADE_FRAG = /* glsl */`
uniform sampler2D tScene;
uniform float exposure;    // EV stops: 0 = no change, +1 = 2× brighter
uniform float contrast;    // 1 = no change, >1 = more contrast
uniform float saturation;  // 1 = no change, 0 = greyscale, 2 = vivid

varying vec2 vUv;

float luma(vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }

void main() {
  vec4 texel = texture2D(tScene, vUv);
  vec3 color = texel.rgb;

  // Exposure
  color *= pow(2.0, exposure);

  // Contrast around mid-grey
  color  = (color - 0.5) * contrast + 0.5;

  // Saturation
  float lum = luma(color);
  color     = mix(vec3(lum), color, saturation);

  gl_FragColor = vec4(clamp(color, 0.0, 1.0), texel.a);
}
`

export interface ColorGradeProps {
  /** Exposure in EV stops — 0 = unchanged (default 0) */
  exposure?: number
  /** Contrast multiplier — 1 = unchanged (default 1) */
  contrast?: number
  /** Saturation multiplier — 1 = unchanged, 0 = greyscale (default 1) */
  saturation?: number
  /** Render target resolution scale (default 1) */
  resolutionScale?: number
}

export function ColorGradeEffect({
  exposure = 0,
  contrast = 1,
  saturation = 1,
  resolutionScale = 1,
}: ColorGradeProps) {
  const { gl, scene, camera, size, viewport } = useThree()

  const fbo = useMemo(() => createFBO(), [])
  useEffect(() => {
    fbo.setSize(
      Math.floor(size.width  * viewport.dpr * resolutionScale),
      Math.floor(size.height * viewport.dpr * resolutionScale),
    )
  }, [fbo, size, viewport.dpr, resolutionScale])
  useEffect(() => () => fbo.dispose(), [fbo])

  const mat = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      tScene:     { value: null },
      exposure:   { value: exposure },
      contrast:   { value: contrast },
      saturation: { value: saturation },
    },
    vertexShader: FULLSCREEN_VERT,
    fragmentShader: COLOR_GRADE_FRAG,
    depthTest: false,
    depthWrite: false,
  }), []) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => mat.dispose(), [mat])

  const meshRef = useRef<THREE.Mesh>(null)

  useFrame(() => {
    const mesh = meshRef.current
    if (!mesh) return

    mat.uniforms.exposure.value   = exposure
    mat.uniforms.contrast.value   = contrast
    mat.uniforms.saturation.value = saturation

    mesh.visible = false
    gl.setRenderTarget(fbo)
    gl.render(scene, camera)

    mesh.visible = true
    mat.uniforms.tScene.value = fbo.texture
    gl.setRenderTarget(null)
    gl.render(scene, camera)
  }, 1)

  return (
    <mesh ref={meshRef} frustumCulled={false} renderOrder={999999}>
      <planeGeometry args={[2, 2]} />
      <primitive object={mat} attach="material" />
    </mesh>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 4.  FILM GRAIN EFFECT
// ─────────────────────────────────────────────────────────────────────────────

const FILM_GRAIN_FRAG = /* glsl */`
uniform sampler2D tScene;
uniform float     time;
uniform float     intensity;  // 0 = off, 0.05 = subtle, 0.15 = heavy

varying vec2 vUv;

// Value-noise pseudo-random (faster than trigonometric hash at high frequency)
float rand(vec2 n) {
  return fract(sin(dot(n, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  vec4  texel = texture2D(tScene, vUv);

  // Vary grain position per frame (fract prevents float precision decay over time)
  float grain = rand(vUv * 1000.0 + fract(time * 0.07)) * 2.0 - 1.0;  // –1 … +1

  gl_FragColor = vec4(clamp(texel.rgb + grain * intensity, 0.0, 1.0), texel.a);
}
`

export interface FilmGrainProps {
  /** Grain intensity — 0 = off, 0.05 = subtle, 0.15 = heavy film (default 0.06) */
  intensity?: number
  /** Render target resolution scale (default 1) */
  resolutionScale?: number
}

export function FilmGrainEffect({ intensity = 0.06, resolutionScale = 1 }: FilmGrainProps) {
  const { gl, scene, camera, size, viewport } = useThree()

  const fbo = useMemo(() => createFBO(), [])
  useEffect(() => {
    fbo.setSize(
      Math.floor(size.width  * viewport.dpr * resolutionScale),
      Math.floor(size.height * viewport.dpr * resolutionScale),
    )
  }, [fbo, size, viewport.dpr, resolutionScale])
  useEffect(() => () => fbo.dispose(), [fbo])

  const mat = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      tScene:    { value: null },
      time:      { value: 0 },
      intensity: { value: intensity },
    },
    vertexShader: FULLSCREEN_VERT,
    fragmentShader: FILM_GRAIN_FRAG,
    depthTest: false,
    depthWrite: false,
  }), []) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => mat.dispose(), [mat])

  const meshRef = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    const mesh = meshRef.current
    if (!mesh) return

    mat.uniforms.time.value      = clock.elapsedTime
    mat.uniforms.intensity.value = intensity

    mesh.visible = false
    gl.setRenderTarget(fbo)
    gl.render(scene, camera)

    mesh.visible = true
    mat.uniforms.tScene.value = fbo.texture
    gl.setRenderTarget(null)
    gl.render(scene, camera)
  }, 1)

  return (
    <mesh ref={meshRef} frustumCulled={false} renderOrder={999999}>
      <planeGeometry args={[2, 2]} />
      <primitive object={mat} attach="material" />
    </mesh>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 5.  VIGNETTE EFFECT  (overlay — no FBO, stack freely)
// ─────────────────────────────────────────────────────────────────────────────

const VIGNETTE_FRAG = /* glsl */`
uniform float strength;   // 0 = off, 1 = heavy corners
uniform float softness;   // 0 = hard edge, 1 = very soft falloff
uniform vec3  color;      // vignette tint (default black)

varying vec2 vUv;

void main() {
  float dist     = length(vUv - 0.5) * 2.0;          // 0 at centre, ~1.41 at corners
  float vignette = smoothstep(1.0 - softness, 1.0, dist * strength);
  gl_FragColor   = vec4(color, vignette);
}
`

export interface VignetteProps {
  /** 0 = off, ~0.6 = natural, 1 = strong (default 0.55) */
  strength?: number
  /** 0 = harsh edge, 1 = very gradual (default 0.5) */
  softness?: number
  /** Vignette tint — almost always black (default #000000) */
  color?: THREE.ColorRepresentation
}

export function VignetteEffect({
  strength = 0.55,
  softness = 0.5,
  color    = '#000000',
}: VignetteProps) {
  const mat = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      strength: { value: strength },
      softness: { value: softness },
      color:    { value: new THREE.Color(color) },
    },
    vertexShader:   FULLSCREEN_VERT,
    fragmentShader: VIGNETTE_FRAG,
    depthTest:  false,
    depthWrite: false,
    transparent: true,
    blending: THREE.NormalBlending,
  }), []) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => mat.dispose(), [mat])

  // Update uniforms when props change (no FBO needed — pure overlay)
  useFrame(() => {
    mat.uniforms.strength.value = strength
    mat.uniforms.softness.value = softness
    ;(mat.uniforms.color.value as THREE.Color).set(color)
  })

  return (
    // renderOrder 1000 — renders after all scene objects, before FBO effects if any are stacked
    <mesh frustumCulled={false} renderOrder={1000}>
      <planeGeometry args={[2, 2]} />
      <primitive object={mat} attach="material" />
    </mesh>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// 6.  ASCII EFFECT
// ─────────────────────────────────────────────────────────────────────────────
//
// Unlike the other effects this does NOT use an FBO + fullscreen quad.
// three-stdlib's AsciiEffect renders to its own DOM element that it inserts
// as a sibling of the <canvas>.  The useFrame at priority 1 takes over R3F's
// auto-render exactly like the FBO effects do.
//
// Usage:
//   <AsciiEffect characters=" .~*O" color="#ff00ff" />

export interface AsciiEffectProps {
  /** Character ramp darkest→brightest (default ' ●◉◍◎○◌◦·') */
  characters?: string
  /** Invert luminance mapping (default false) */
  invert?: boolean
  /**
   * Grid resolution — lower = coarser.  Defaults to 0.11 desktop / 0.17 mobile.
   * Pass an explicit value to override the responsive default.
   */
  resolution?: number
  /** Text colour (default inherited from THEME via the caller) */
  color?: string
  /** Background colour of the ASCII overlay (default 'white') */
  backgroundColor?: string
  /** Font used for the character grid (default JetBrains Mono with system fallbacks) */
  fontFamily?: string
}

export function AsciiEffect({
  characters    = ' ●◉◍◎○◌◦·',
  invert        = false,
  resolution,
  color         = '#000000',
  backgroundColor = 'white',
  fontFamily    = "'JetBrains Mono', 'Courier New', Courier, monospace",
}: AsciiEffectProps) {
  const { size, gl, scene, camera } = useThree()
  const isReady  = useRef(false)
  const theme    = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const res      = resolution ?? (isMobile ? 0.17 : 0.11)

  // Lazy-load JetBrains Mono only when this effect is mounted
  useEffect(() => {
    const link = document.createElement('link')
    link.href = 'https://fonts.googleapis.com/css2?family=JetBrains+Mono&display=swap'
    link.rel  = 'stylesheet'
    document.head.appendChild(link)
    return () => void document.head.removeChild(link)
  }, [])

  const effect = useMemo(() => {
    const e = new ThreeAsciiEffect(gl, characters, { invert, resolution: res })
    const s = e.domElement.style
    s.position      = 'absolute'
    s.top           = '0px'
    s.left          = '0px'
    s.overflow      = 'hidden'
    s.whiteSpace    = 'pre'
    s.textAlign     = 'center'
    s.letterSpacing = 'normal'
    s.fontFamily    = fontFamily
    s.margin        = '0'
    s.padding       = '0'
    s.lineHeight    = '1'
    s.color              = color
    s.backgroundColor    = backgroundColor
    s.pointerEvents      = 'none'
    return e
  }, [characters, invert, res, gl]) // eslint-disable-line react-hooks/exhaustive-deps

  // Mount / unmount the overlay DOM node alongside the canvas
  useEffect(() => {
    const parent = gl.domElement.parentNode
    if (!parent) return
    parent.appendChild(effect.domElement)
    return () => void parent.removeChild(effect.domElement)
  }, [effect, gl])

  // Sync overlay size whenever the canvas resizes
  useEffect(() => {
    if (size.width > 0 && size.height > 0) {
      effect.setSize(size.width, size.height)
      isReady.current = true
    }
  }, [effect, size])

  // Priority 1 — takes over R3F's auto-render
  useFrame(() => {
    if (!isReady.current) return
    effect.render(scene, camera)
  }, 1)

  return null
}

// ─── Default export (backward compat with existing Renderer import) ───────────
export default HalftoneEffect
