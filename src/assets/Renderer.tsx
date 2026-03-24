import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { AsciiEffect } from 'three-stdlib'
import { useRef, useEffect, useMemo, useState } from "react"
import { Model as WebsiteRocket } from "./WebsiteRocket"
import { Model as RocketThrust } from "./RocketThrust"
import { Mesh, Vector3, CatmullRomCurve3} from "three"
import { useMediaQuery, useTheme } from "@mui/material"
import * as THREE from "three"

const ROCKET_POS = new Vector3(0, 0, 0)

const CAMERA_PATH = [
  new Vector3(3,  7,  10),  // start — front
  new Vector3(-5,  9,   7),  // gentler mid point, not so far left
  new Vector3(-8,  10, -2),  // end — behind and above
]

const CAMERA_CURVE = new CatmullRomCurve3(CAMERA_PATH)

const lerp = (current: number, target: number, interpolation: number) =>
  current + interpolation * (target - current)

// ─── Camera Rig ───────────────────────────────────────────────────────────────
const CameraRig = () => {
  const { camera } = useThree()
  const progress = useRef(0)
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  useEffect(() => {
    const handleScroll = () => {
    const scrollTop = window.scrollY
    const rendererHeight = window.innerHeight * 1 // 400vh
    progress.current = Math.min(scrollTop / rendererHeight, 1)
  }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useFrame(() => {
    const p = progress.current
    const pos = CAMERA_CURVE.getPoint(Math.min(p, 1))
    camera.position.copy(pos)

    camera.lookAt(isMobile? ROCKET_POS.clone().add(new Vector3(0,  2,  0)) : ROCKET_POS)
    
    if(!isMobile){
      const forward = new Vector3()
      camera.getWorldDirection(forward)
      const right = new Vector3()
      right.crossVectors(forward, camera.up).normalize()
      const lookTarget = ROCKET_POS.clone().add(right.multiplyScalar(5.6)).add(new Vector3(0,  2,  0))
      camera.lookAt(lookTarget)
    }
  })

  return null
}

// ─── Star Particles ───────────────────────────────────────────────────────────
const StarParticles = () => {
  const count = 15;
  const meshRef = useRef<THREE.Points>(null!)

  const [positions, velocities] = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const velocities = new Float32Array(count)

    for (let i = 0; i < count; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 10
      positions[i * 3 + 1] = (Math.random() - 0.5) * 10
      positions[i * 3 + 2] = (Math.random() - 0.5) * 4
      velocities[i] = 0.02 + Math.random() * 0.12
    }

    return [positions, velocities]
  }, [])

  useFrame(() => {
    if (!meshRef.current) return
    const pos = meshRef.current.geometry.attributes.position.array as Float32Array

    for (let i = 0; i < count; i++) {
      pos[i * 3 + 1] -= velocities[i]

      if (pos[i * 3 + 1] < -6) {
        pos[i * 3 + 0] = (Math.random() - 0.5) * 10
        pos[i * 3 + 1] = 6
        pos[i * 3 + 2] = (Math.random() - 0.5) * 4
      }
    }

    meshRef.current.geometry.attributes.position.needsUpdate = true
  })

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.15} color="#C8922A" transparent opacity={0.8} sizeAttenuation />
    </points>
  )
}

// ─── Rocket ───────────────────────────────────────────────────────────────────
const Rocket = ({ position }: { position: [number, number, number] }) => {
  const reference = useRef<Mesh>(null!)
  const { mouse } = useThree()
  const previousMouse = useRef({ x: 0, y: 0 })
  const extraSpeed = useRef(0)
  const isFirstFrame = useRef(true)
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  useFrame((_, delta) => {
    if (reference.current && !isMobile) {
      if (isFirstFrame.current) {
        previousMouse.current = { x: mouse.x, y: mouse.y }
        isFirstFrame.current = false
      }

      const dx = mouse.x - previousMouse.current.x
      const dy = mouse.y - previousMouse.current.y
      const movement = Math.sqrt(dx * dx + dy * dy)

      // Prevent huge jumps from initial mouse detection or window re-entry
      if (movement < 0.5) {
        extraSpeed.current += movement * 33
      }

      // Smoothly decay the extra speed back to 0 over time
      extraSpeed.current = THREE.MathUtils.damp(extraSpeed.current, 0, 4, delta)

      // Apply base clockwise rotation of ~0.33 rad/s plus any extra speed from mouse movement
      reference.current.rotation.y -= (0.33 + extraSpeed.current) * delta

      // Store current mouse position for the next frame
      previousMouse.current = { x: mouse.x, y: mouse.y }
    }
  })

  return (
    <>
      <group position={position} rotation={isMobile ? [0, 0, 0] : [0, Math.PI, Math.PI * 0.1388888889]} scale={0.88}>
        <WebsiteRocket ref={reference} />
        <StarParticles />
      </group>
      {!isMobile && <RocketThrust position={position} />}
    </>
  )
}

// ─── ASCII Renderer ───────────────────────────────────────────────────────────  .,:;oO08@
function AsciiRenderer({ characters = ' ●◉◍◎○◌◦·', ...options }) {
  const { size, gl, scene, camera } = useThree()
  const isReady = useRef(false)
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

  // Dynamically load JetBrains Mono just for this component
  useEffect(() => {
    const link = document.createElement('link')
    link.href = 'https://fonts.googleapis.com/css2?family=JetBrains+Mono&display=swap'
    link.rel = 'stylesheet'
    document.head.appendChild(link)
    return () => void document.head.removeChild(link)
  }, [])

  const effect = useMemo(() => {
    const effect = new AsciiEffect(gl, characters, { invert: false, resolution: isMobile ? 0.17 : 0.11 })
    effect.domElement.style.position = 'absolute'
    effect.domElement.style.top = '0px'
    effect.domElement.style.left = '0px'
    effect.domElement.style.overflow = 'hidden'
    effect.domElement.style.whiteSpace = 'pre'
    effect.domElement.style.textAlign = 'center'
    effect.domElement.style.letterSpacing = 'normal'
    effect.domElement.style.fontFamily = "'JetBrains Mono', 'Courier New', Courier, monospace"
    effect.domElement.style.margin = '0'
    effect.domElement.style.padding = '0'
    effect.domElement.style.lineHeight = '1'
    effect.domElement.style.color = '#C8922A'
    effect.domElement.style.backgroundColor = '#1C2B35'
    effect.domElement.style.pointerEvents = 'none'
    return effect
  }, [characters, options.invert, gl])

  useEffect(() => {
    const parent = gl.domElement.parentNode
    if (!parent) return
    parent.appendChild(effect.domElement)
    return () => void parent.removeChild(effect.domElement)
  }, [effect])

  useEffect(() => {
    if (size.width > 0 && size.height > 0) {
      effect.setSize(size.width, size.height)
      isReady.current = true  // ← only allow rendering after valid size is set
    }
  }, [effect, size])

  useFrame((state) => {
    if (!isReady.current) return  // ← guard here
    effect.render(scene, camera)
  }, 1)

  return null
}

// ─── Renderer ─────────────────────────────────────────────────────────────────
const Renderer = () => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [frameloop, setFrameloop] = useState<'always' | 'never'>('always')
  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    return () => {
      if (observerRef.current) observerRef.current.disconnect()
    }
  }, [])
  
  return (
    <Canvas 
      frameloop={frameloop}
      camera={{ position: [3, 4, 13], fov: isMobile ? 60 : 50}}
      onCreated={({ gl }) => {
        if (typeof IntersectionObserver !== 'undefined') {
          if (observerRef.current) observerRef.current.disconnect()
          observerRef.current = new IntersectionObserver(
            ([entry]) => setFrameloop(entry.isIntersecting ? 'always' : 'never'),
            { threshold: 0 } // Triggers the exact moment it fully exits or partially enters
          )
          observerRef.current.observe(gl.domElement)
        }
      }}
    >
      <AsciiRenderer characters={isMobile ? ' .~*O' : ' ●◉◍◎○◌◦·'}/>
      <directionalLight position={[-20, 4, 10]} />
      <ambientLight intensity={0.1} />
      <Rocket position={[0, 0, 0]} />
      <CameraRig />
    </Canvas>
  )
}

export default Renderer