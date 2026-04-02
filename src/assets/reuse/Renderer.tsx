import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { useRef, useEffect, useMemo, useState } from "react"
import { Model as WebsiteRocket } from "./WebsiteRocket"
import { Mesh, Vector3, CatmullRomCurve3} from "three"
import { useMediaQuery, useTheme, Box } from "@mui/material"
import * as THREE from "three"
import { THEME } from '../../style'
import HalftoneEffect from "../Shaders"

const ROCKET_POS = new Vector3(0, 0, 0)

const CAMERA_PATH = [
  new Vector3(0,  5,  10),  // start — front
  new Vector3(6,  12,  4),  // gentler mid point, not so far left
  new Vector3(8,  14, 1),  // end — behind and above
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

    camera.lookAt(isMobile? ROCKET_POS.clone().add(new Vector3(0,  1,  0)) : ROCKET_POS)
    
    if(!isMobile){
      const forward = new Vector3()
      camera.getWorldDirection(forward)
      const right = new Vector3()
      right.crossVectors(forward, camera.up).normalize()
      const lookTarget = ROCKET_POS.clone().add(right.multiplyScalar(-1.5)).add(new Vector3(0,  4,  0))
      camera.lookAt(lookTarget)
    }
  })

  return null
}

// ─── Star Particles ───────────────────────────────────────────────────────────
const StarParticles = () => {
  return
  const count = 20;
  const meshRef = useRef<THREE.Points>(null!)

  const [positions, velocities] = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const velocities = new Float32Array(count)

    for (let i = 0; i < count; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 15
      positions[i * 3 + 1] = (Math.random() - 0.5) * 15
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
      <pointsMaterial size={0.15} color={THEME.textPrimary} transparent opacity={0.8} sizeAttenuation />
    </points>
  )
}

// ─── Rocket Exhaust Particles ──────────────────────────────────────────────────
const RocketExhaust = ({ position, isMobile }: { position: [number, number, number], isMobile: boolean }) => {
  //return
  const count = 50;
  const meshRef = useRef<THREE.Points>(null!);
  
  const [positions, velocities, ages, sizes] = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const ages = new Float32Array(count);
    const sizes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 0.2;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 0.2;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 0.2;
      
      velocities[i * 3 + 0] = (Math.random() - 0.5) * 1.5;
      // Faster falling downwards to match "star" movement and create a thick trail
      velocities[i * 3 + 1] = -Math.random() * 8.0 - 6.0; 
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 1.5;
      
      ages[i] = - (i / count); // stagger emission
      sizes[i] = Math.random() * 50.0 + 30.0; 
    }

    return [positions, velocities, ages, sizes];
  }, [count]);

  const ParticleShaderMaterial = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      color: { value: new THREE.Color(THEME.textPrimary) },
    },
    vertexShader: `
      attribute float age;
      attribute float particleSize;
      varying float vAge;
      void main() {
        vAge = age;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        // Particles grow significantly more as they age to simulate expanding smoke
        gl_PointSize = particleSize * (10.0 / -mvPosition.z) * (1.0 + max(0.0, age) * 2.5);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform vec3 color;
      varying float vAge;
      void main() {
        if (vAge < 0.0) discard;
        
        float alpha = max(0.0, 1.0 - vAge);
        
        // Soft circular particle
        vec2 circCoord = 2.0 * gl_PointCoord - 1.0;
        float distSq = dot(circCoord, circCoord);
        if (distSq > 1.0) discard;
        
        alpha *= (1.0 - distSq);
        gl_FragColor = vec4(color, alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  }), []);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    
    const pos = meshRef.current.geometry.attributes.position.array as Float32Array;
    const ageArr = meshRef.current.geometry.attributes.age.array as Float32Array;
    const vel = velocities;

    for (let i = 0; i < count; i++) {
      // Slow down the age increment so particles travel further down
      ageArr[i] += delta * 0.8; 
      
      if (ageArr[i] >= 1.0) {
        ageArr[i] = 0.0;
        pos[i * 3 + 0] = (Math.random() - 0.5) * 0.2;
        pos[i * 3 + 1] = (Math.random() - 0.5) * 0.2;
        pos[i * 3 + 2] = (Math.random() - 0.5) * 0.2;
        
        vel[i * 3 + 0] = (Math.random() - 0.5) * 1.5;
        vel[i * 3 + 1] = -Math.random() * 8.0 - 6.0; 
        vel[i * 3 + 2] = (Math.random() - 0.5) * 1.5;
      } else if (ageArr[i] > 0.0) {
        pos[i * 3 + 0] += vel[i * 3 + 0] * delta;
        pos[i * 3 + 1] += vel[i * 3 + 1] * delta;
        pos[i * 3 + 2] += vel[i * 3 + 2] * delta;
        
       // Add more spread/turbulence outward as they fall
        vel[i * 3 + 0] += (Math.random() - 0.5) * delta * 4.0;
        vel[i * 3 + 2] += (Math.random() - 0.5) * delta * 4.0;
      }
    }

    meshRef.current.geometry.attributes.position.needsUpdate = true;
    meshRef.current.geometry.attributes.age.needsUpdate = true;
  });

  return (
    <group position={position} rotation={isMobile ? [0, 0, 0] : [0, 0, -0.428]} scale={0.365}>
      <points ref={meshRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-age" args={[ages, 1]} />
          <bufferAttribute attach="attributes-particleSize" args={[sizes, 1]} />
        </bufferGeometry>
        <primitive attach="material" object={ParticleShaderMaterial} />
      </points>
    </group>
  );
};

// ─── Rocket ───────────────────────────────────────────────────────────────────
const Rocket = ({ position, rocketExhaustKey }: { position: [number, number, number], rocketExhaustKey: number }) => {
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
      <group position={position} rotation={false ? [0, 0, 0] : [0, Math.PI, Math.PI * 0.1388888889]} scale={0.88}>
        <WebsiteRocket ref={reference} />
        <StarParticles />
      </group>
      <RocketExhaust position={position} key={rocketExhaustKey} isMobile={isMobile} />
    </>
  )
}

// ─── Renderer ─────────────────────────────────────────────────────────────────
const Renderer = () => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [frameloop, setFrameloop] = useState<'always' | 'never'>('always')
  const [rocketExhaustKey, setRocketExhaustKey] = useState(0)
  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    return () => {
      if (observerRef.current) observerRef.current.disconnect()
    }
  }, [])
  
  return (
    <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
      <Canvas style={{ background: "white" }}
        frameloop={frameloop}
        camera={{ position: [3, 4, 13], fov: isMobile ? 60 : 50}}
        onCreated={({ gl }) => {
          if (typeof IntersectionObserver !== 'undefined') {
            if (observerRef.current) observerRef.current.disconnect()
            observerRef.current = new IntersectionObserver(
              ([entry]) => {
                setFrameloop(entry.isIntersecting ? 'always' : 'never')
                if (entry.isIntersecting) {
                  setRocketExhaustKey(prev => prev + 1)
                }
              },
              { threshold: 0 } // Triggers the exact moment it fully exits or partially enters
            )
            observerRef.current.observe(gl.domElement)
          }
        }}
      >
        <HalftoneEffect
          gridSize={isMobile ? 80 : 120}
          dotScale={.95}
          edgeSoft={.1}
          invertLuminance={true}
          colorMix={0}      // 0 = mono, 1 = scene-coloured dots
          dotColor={THEME.textPrimary}
          bgColor={THEME.bg}
          sampleRadius={2}
          hideBackground={true}
        />
        <directionalLight position={[-14, 8, 10] } intensity={5} />
        <ambientLight intensity={0.01} />
        <Rocket position={[0, 0, 0]} rocketExhaustKey={rocketExhaustKey} />
        <CameraRig />
      </Canvas>
    </Box>
  )
}

export default Renderer