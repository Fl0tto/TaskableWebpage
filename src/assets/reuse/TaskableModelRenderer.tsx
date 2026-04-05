import React, { useRef, useEffect, useState, useMemo } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { Box } from "@mui/material"
import * as THREE from "three"
import { HalftoneEffect } from "../Shaders"

// ─── Props ────────────────────────────────────────────────────────────────────

export interface TaskableModelRendererProps {
  /** Any R3F-compatible model component. Rendered at world origin. */
  model: React.ComponentType

  /** Uniform scale applied to the model (default 1) */
  modelScale?: number

  /** Euler XYZ rotation applied to the model in radians (default [0, 0, 0]) */
  modelRotation?: [number, number, number]

  /** XYZ world-space position offset for the model (default [0, 0, 0]) */
  modelOffset?: [number, number, number]

  /**
   * How far the camera sits from the pivot along the pivot's local Z axis.
   * Larger = farther from the model. (default 10)
   */
  cameraDistance?: number

  /**
   * Speed at which the pivot (and therefore camera) rotates around the model.
   * In radians per second. 2π = one full orbit per second. (default Math.PI / 3)
   */
  rotationVelocity?: number

  /**
   * Amplitude of the sinusoidal up-down camera bob in world units.
   * 1 = swings between −1 and +1 on Y. (default 0 = no bob)
   */
  bobAmplitude?: number

  /**
   * Pre-multiplier on the pivot's current rotation angle fed into the sine.
   * cameraY = bobAmplitude * sin(pivot.rotation.y * bobFrequency)
   * Higher = faster oscillation relative to the orbit. (default 1)
   */
  bobFrequency?: number

  /** Dot grid density — maps directly to HalftoneEffect gridSize (default 100) */
  gridSize?: number

  /** Halftone dot colour — maps to HalftoneEffect dotColor (default '#0A0A0A') */
  foregroundColor?: THREE.ColorRepresentation

  /** Halftone background colour — maps to HalftoneEffect bgColor (default '#FFFFFF') */
  backgroundColor?: THREE.ColorRepresentation

  /** CSS width of the canvas container (default '100%') */
  width?: string | number

  /** CSS height of the canvas container (default '100%') */
  height?: string | number
}

// ─── Camera Rig ───────────────────────────────────────────────────────────────
//
// Architecture mirrors a "Blender empty" parent setup:
//   • pivot — an invisible Object3D sitting at world origin
//   • camera — conceptually a child of the pivot, offset by cameraDistance
//               along the pivot's local +Z axis
//
// Rotating the pivot.rotation.y each frame orbits the camera around the model
// without the model itself ever moving.
//
// The bob adds a world-space Y offset driven by:
//   cameraY += bobAmplitude * sin(pivot.rotation.y * bobFrequency)
// so the camera floats up and down as it orbits.

interface CameraRigProps {
  cameraDistance: number
  rotationVelocity: number
  bobAmplitude: number
  bobFrequency: number
}

const CameraRig: React.FC<CameraRigProps> = ({
  cameraDistance,
  rotationVelocity,
  bobAmplitude,
  bobFrequency,
}) => {
  const { camera } = useThree()

  // Tracks the cumulative orbit angle (radians)
  const pivot = useMemo(() => ({ rotation: { y: 0 } }), [])

  // Reusable vector to avoid per-frame allocation
  const localOffset = useMemo(() => new THREE.Vector3(), [])

  useFrame((_, delta) => {
    // Advance orbit
    pivot.rotation.y += rotationVelocity * delta

    // XZ radius is always exactly cameraDistance — no distance drift from bob.
    // Y is driven independently by the sine wave so the camera arcs purely
    // up and down without changing its distance to the model.
    localOffset.set(
      cameraDistance * Math.sin(pivot.rotation.y),
      bobAmplitude   * Math.sin(pivot.rotation.y * bobFrequency),
      cameraDistance * Math.cos(pivot.rotation.y),
    )

    camera.position.copy(localOffset)
    camera.lookAt(0, 0, 0)
  })

  return null
}

// ─── Scene ────────────────────────────────────────────────────────────────────

interface SceneProps {
  model: React.ComponentType
  modelScale: number
  modelRotation: [number, number, number]
  modelOffset: [number, number, number]
  cameraDistance: number
  rotationVelocity: number
  bobAmplitude: number
  bobFrequency: number
  gridSize: number
  foregroundColor: THREE.ColorRepresentation
  backgroundColor: THREE.ColorRepresentation
}

const Scene: React.FC<SceneProps> = ({
  model: ModelComponent,
  modelScale,
  modelRotation,
  modelOffset,
  cameraDistance,
  rotationVelocity,
  bobAmplitude,
  bobFrequency,
  gridSize,
  foregroundColor,
  backgroundColor,
}) => {
  return (
    <>
      <HalftoneEffect
        gridSize={gridSize}
        dotScale={0.95}
        edgeSoft={0.1}
        invertLuminance={true}
        colorMix={0}
        dotColor={foregroundColor}
        bgColor={backgroundColor}
        sampleRadius={2}
        hideBackground={true}
      />
      <directionalLight position={[-14, 8, 10]} intensity={5} />
      <ambientLight intensity={0.01} />

      <group scale={modelScale} rotation={modelRotation} position={modelOffset}>
        <ModelComponent />
      </group>

      <CameraRig
        cameraDistance={cameraDistance}
        rotationVelocity={rotationVelocity}
        bobAmplitude={bobAmplitude}
        bobFrequency={bobFrequency}
      />
    </>
  )
}

// ─── TaskableModelRenderer ────────────────────────────────────────────────────

const TaskableModelRenderer: React.FC<TaskableModelRendererProps> = ({
  model,
  modelScale       = 1,
  modelRotation    = [0, 0, 0],
  modelOffset      = [0, 0, 0],
  cameraDistance   = 10,
  rotationVelocity = Math.PI / 3,
  bobAmplitude     = 0,
  bobFrequency     = 1,
  gridSize         = 100,
  foregroundColor  = '#0A0A0A',
  backgroundColor  = '#FFFFFF',
  width            = '100%',
  height           = '100%',
}) => {
  const [frameloop, setFrameloop] = useState<'always' | 'never'>('always')
  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    return () => {
      if (observerRef.current) observerRef.current.disconnect()
    }
  }, [])

  return (
    <Box sx={{ position: 'relative', width, height }}>
      <Canvas
        frameloop={frameloop}
        camera={{ position: [0, 0, cameraDistance], fov: 50 }}
        onCreated={({ gl }) => {
          if (typeof IntersectionObserver !== 'undefined') {
            if (observerRef.current) observerRef.current.disconnect()
            observerRef.current = new IntersectionObserver(
              ([entry]) => setFrameloop(entry.isIntersecting ? 'always' : 'never'),
              { threshold: 0 },
            )
            observerRef.current.observe(gl.domElement)
          }
        }}
      >
        <Scene
          model={model}
          modelScale={modelScale}
          modelRotation={modelRotation}
          modelOffset={modelOffset}
          cameraDistance={cameraDistance}
          rotationVelocity={rotationVelocity}
          bobAmplitude={bobAmplitude}
          bobFrequency={bobFrequency}
          gridSize={gridSize}
          foregroundColor={foregroundColor}
          backgroundColor={backgroundColor}
        />
      </Canvas>
    </Box>
  )
}

export default TaskableModelRenderer
