import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Sparkles } from '@react-three/drei';
import { Suspense, useRef } from 'react';
import { useCanvasFrameloop } from './useCanvasFrameloop.js';

/* Small, agriculture-only decorative cluster used inside section panels.
   Pure procedural meshes — no GLTF assets. */

function MiniSprout({ position }) {
  const budRef = useRef();
  useFrame((s) => {
    if (budRef.current) budRef.current.scale.setScalar(1 + Math.sin(s.clock.elapsedTime * 2.4) * 0.08);
  });
  return (
    <Float floatIntensity={1.4} rotationIntensity={0.4} speed={1.4}>
      <group position={position}>
        <mesh>
          <cylinderGeometry args={[0.05, 0.07, 1.0, 10]} />
          <meshStandardMaterial color="#3a8a5c" roughness={0.55} />
        </mesh>
        {[0, 1, 2, 3].map((i) => {
          const flip = i % 2 === 0 ? 1 : -1;
          return (
            <group key={i} position={[0, -0.1 + i * 0.3, 0]} rotation={[0, i * 1.05, 0]}>
              <mesh
                position={[flip * 0.3, 0.1, 0]}
                rotation={[0, 0, flip * -0.7]}
                scale={[0.55, 0.16, 0.32]}
              >
                <sphereGeometry args={[0.5, 12, 8]} />
                <meshStandardMaterial
                  color={i % 2 === 0 ? '#52b788' : '#2d6a4f'}
                  roughness={0.45}
                />
              </mesh>
            </group>
          );
        })}
        <mesh ref={budRef} position={[0, 0.6, 0]}>
          <sphereGeometry args={[0.14, 18, 18]} />
          <meshStandardMaterial
            color="#a7f3d0"
            emissive="#2dd4bf"
            emissiveIntensity={0.85}
            roughness={0.3}
            metalness={0.2}
          />
        </mesh>
      </group>
    </Float>
  );
}

function WheatEar({ position, rotation = [0, 0, 0], scale = 1 }) {
  return (
    <Float floatIntensity={1.6} rotationIntensity={0.6} speed={1.3}>
      <group position={position} rotation={rotation} scale={scale}>
        <mesh>
          <cylinderGeometry args={[0.022, 0.034, 1.0, 6]} />
          <meshStandardMaterial color="#7a8b3e" roughness={0.6} />
        </mesh>
        {[0, 1, 2, 3, 4].map((i) => (
          <group key={i} position={[0, 0.05 + i * 0.13, 0]} rotation={[0, (i % 2) * Math.PI, 0]}>
            <mesh position={[0.07, 0, 0]} rotation={[0, 0, -0.3]}>
              <capsuleGeometry args={[0.055, 0.11, 4, 8]} />
              <meshStandardMaterial color="#e9c184" roughness={0.45} metalness={0.2} />
            </mesh>
          </group>
        ))}
        <mesh position={[0, 0.78, 0]}>
          <coneGeometry args={[0.03, 0.16, 6]} />
          <meshStandardMaterial color="#faedcd" roughness={0.5} />
        </mesh>
      </group>
    </Float>
  );
}

function WaterDrop({ position, scale = 1 }) {
  return (
    <Float floatIntensity={2} rotationIntensity={0.4} speed={1.9}>
      <group position={position} scale={scale}>
        <mesh>
          <sphereGeometry args={[0.22, 20, 20]} />
          <meshPhysicalMaterial
            color="#5eead4"
            transmission={0.85}
            roughness={0.05}
            thickness={0.5}
            clearcoat={1}
            ior={1.4}
          />
        </mesh>
        <mesh position={[0, 0.21, 0]}>
          <coneGeometry args={[0.205, 0.28, 18]} />
          <meshPhysicalMaterial
            color="#5eead4"
            transmission={0.85}
            roughness={0.05}
            thickness={0.5}
            clearcoat={1}
            ior={1.4}
          />
        </mesh>
      </group>
    </Float>
  );
}

function Leaf({ position, color = '#52b788', rotation = [0, 0, 0], scale = 1 }) {
  return (
    <Float floatIntensity={1.8} rotationIntensity={1.2} speed={1.4}>
      <group position={position} rotation={rotation} scale={scale}>
        <mesh rotation={[0, 0, 0.3]} scale={[0.85, 0.22, 0.45]}>
          <sphereGeometry args={[0.45, 14, 10]} />
          <meshStandardMaterial color={color} roughness={0.5} />
        </mesh>
        <mesh position={[-0.36, -0.04, 0]} rotation={[0, 0, 0.3]}>
          <cylinderGeometry args={[0.014, 0.018, 0.18, 6]} />
          <meshStandardMaterial color="#2d6a4f" roughness={0.6} />
        </mesh>
      </group>
    </Float>
  );
}

export default function OrbitingObjects({ kind = 'mix' }) {
  const { frameloop, containerRef } = useCanvasFrameloop();
  return (
    <div ref={containerRef} className="absolute inset-0">
    <Canvas
      frameloop={frameloop}
      dpr={[1, 1.25]}
      camera={{ position: [0, 0, 5], fov: 45 }}
      gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
    >
      <Suspense fallback={null}>
        <ambientLight intensity={0.6} />
        <pointLight position={[3, 3, 3]}   intensity={1.2} color="#faedcd" />
        <pointLight position={[-3, -2, 1]} intensity={0.9} color="#2dd4bf" />

        {kind === 'mix' && (
          <>
            <MiniSprout position={[0, -0.2, 0]} />
            <WheatEar  position={[-1.5, 0.4, -0.2]} rotation={[0, 0, 0.25]} />
            <WaterDrop position={[1.4, 0.0, 0.3]} scale={0.85} />
            <Leaf      position={[1.2, 1.0, -0.4]} color="#5eead4" rotation={[0, 0.4, 0]} scale={0.9} />
            <Leaf      position={[-1.1, -0.9, 0.4]} color="#2dd4bf" rotation={[0, -0.6, 0]} scale={0.8} />
          </>
        )}
        {kind === 'sprout' && <MiniSprout position={[0, 0, 0]} />}
        {kind === 'drop'   && <WaterDrop  position={[0, 0, 0]} scale={1.4} />}
        {kind === 'wheat'  && <WheatEar   position={[0, -0.4, 0]} scale={1.4} />}

        <Sparkles count={28} scale={[6, 4, 4]} size={1.4} speed={0.45} color="#5eead4" />
      </Suspense>
    </Canvas>
    </div>
  );
}
