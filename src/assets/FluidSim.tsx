import { Fluid } from '@whatisjery/react-fluid-distortion';
import { EffectComposer } from '@react-three/postprocessing';
import { Canvas } from '@react-three/fiber';

const FluidSim = () => {

  return (
    <Canvas
        style={{
            position: 'fixed',
            top: 0,
            left: 0,
            height: '100vh',
            width: '100vw',
            background: 'transparent',
            pointerEvents: 'none',
        }}>
        <EffectComposer>
            <Fluid fluidColor={("#C8922A")} 
            showBackground={false} 
            blend={20}
            intensity={1}
            radius={0.166}
            distortion={2}
            force={2.5}
            curl={2}
            swirl={1}
            velocityDissipation={.99}
            densityDissipation={.96}
            pressure={.8}
            />
        </EffectComposer>
    </Canvas>
  )
}

export default FluidSim;