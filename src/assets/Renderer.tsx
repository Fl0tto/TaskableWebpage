import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { AsciiEffect } from 'three-stdlib'
import { useRef, useEffect, useMemo, useState } from "react"
import { Model as WebsiteRocket } from "./WebsiteRocket"
import { Model as RocketThrust } from "./RocketThrust"

import { Mesh, Vector3, CatmullRomCurve3} from "three"
import * as THREE from "three"
import Lenis from "lenis"

const ROCKET_POS = new Vector3(0, 0, 0)

const CAMERA_PATH = [
  new Vector3(3,   5,  10),  // start — front
  new Vector3(-5,  7,   7),  // gentler mid point, not so far left
  new Vector3(-8,  10, -2),  // end — behind and above
]

const CAMERA_CURVE = new CatmullRomCurve3(CAMERA_PATH)

const lerp = (current: number, target: number, interpolation: number) =>
  current + interpolation * (target - current)

// ─── Camera Rig ───────────────────────────────────────────────────────────────
const CameraRig = () => {
  const { camera } = useThree()
  const progress = useRef(0)

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.5,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    })

    const handleScroll = () => {
      const scrollTop = window.scrollY
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight
      progress.current = scrollTop / maxScroll
    }

    window.addEventListener("scroll", handleScroll)

    const raf = (time: number) => {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }
    requestAnimationFrame(raf)

    return () => {
      window.removeEventListener("scroll", handleScroll)
      lenis.destroy()
    }
  }, [])

  useFrame(() => {
    const p = progress.current

    // Get smooth position along curve
    const pos = CAMERA_CURVE.getPoint(p)
    camera.position.copy(pos)

    camera.lookAt(ROCKET_POS)

    // Derive right vector from camera's current orientation
    const forward = new Vector3()
    camera.getWorldDirection(forward)
    const right = new Vector3()
    right.crossVectors(forward, camera.up).normalize()

    const lookTarget = ROCKET_POS.clone().add(
      right.multiplyScalar(6)
    )
    camera.lookAt(lookTarget)
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

  useFrame(() => {
    if (reference.current) {
      reference.current.rotation.y = Math.PI * - mouse.x + mouse.y * 1.66
    }
  })

  return (
    <>
      <group position={position} rotation={[0, Math.PI, Math.PI * 0.1388888889]} scale={0.88}>
        <WebsiteRocket ref={reference} />
        <StarParticles />
      </group>
      <RocketThrust position={position} />
    </>
  )
}

// ─── ASCII Renderer ───────────────────────────────────────────────────────────
function AsciiRenderer({ characters = ' ●◉◍◎○◌◦·', ...options }) {
  const { size, gl, scene, camera } = useThree()
  const isReady = useRef(false)

  const effect = useMemo(() => {
    const effect = new AsciiEffect(gl, characters, { invert: false, resolution: 0.07 })
    effect.domElement.style.position = 'absolute'
    effect.domElement.style.top = '0px'
    effect.domElement.style.left = '0px'
    effect.domElement.style.color = '#C8922A'
    effect.domElement.style.backgroundColor = '#1C2B35'
    effect.domElement.style.pointerEvents = 'none'
    return effect
  }, [characters, options.invert])

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
  return (
    <Canvas camera={{ position: [3, 4, 13], fov: 50 }}>
      <AsciiRenderer />
      <directionalLight position={[-20, 4, 10]} />
      <ambientLight intensity={0.1} />
      <Rocket position={[0, 0, 0]} />
      <CameraRig />
    </Canvas>
  )
}

export default Renderer