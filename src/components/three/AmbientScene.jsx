import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Sparkles, RoundedBox } from '@react-three/drei';
import { Suspense, useMemo, useRef } from 'react';
import { useCanvasFrameloop } from './useCanvasFrameloop.js';

/* ========================================================================
   AmbientScene — auth pages backdrop.
   "Mini biosphere": a slowly rotating soil disc with sprouts and a
   fertilizer sack growing on it, framed by orbiting water drops, wheat
   ears, and leaves. Calm, ambient, and explicitly agricultural.
   ====================================================================== */

function MiniSprout({ position = [0, 0, 0], scale = 1, glow = true }) {
  const budRef = useRef();
  useFrame((s) => {
    if (budRef.current) {
      const t = s.clock.elapsedTime;
      budRef.current.scale.setScalar(1 + Math.sin(t * 2.4) * 0.08);
    }
  });
  const leaves = useMemo(
    () =>
      [0, 1, 2, 3].map((i) => ({
        y: -0.05 + i * 0.22,
        angle: i * 1.05,
        flip: i % 2 === 0 ? 1 : -1,
        color: i % 2 === 0 ? '#52b788' : '#2d6a4f',
      })),
    [],
  );
  return (
    <group position={position} scale={scale}>
      <mesh castShadow>
        <cylinderGeometry args={[0.04, 0.07, 1.0, 10]} />
        <meshStandardMaterial color="#3a8a5c" roughness={0.55} />
      </mesh>
      {leaves.map((l, i) => (
        <group key={i} position={[0, l.y, 0]} rotation={[0, l.angle, 0]}>
          <mesh
            position={[l.flip * 0.27, 0.08, 0]}
            rotation={[0, 0, l.flip * -0.7]}
            scale={[0.5, 0.16, 0.3]}
            castShadow
          >
            <sphereGeometry args={[0.5, 12, 8]} />
            <meshStandardMaterial color={l.color} roughness={0.45} metalness={0.05} />
          </mesh>
        </group>
      ))}
      {glow && (
        <>
          <mesh ref={budRef} position={[0, 0.55, 0]}>
            <sphereGeometry args={[0.11, 18, 18]} />
            <meshStandardMaterial
              color="#a7f3d0"
              emissive="#2dd4bf"
              emissiveIntensity={0.9}
              roughness={0.3}
              metalness={0.2}
            />
          </mesh>
          <mesh position={[0, 0.55, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.15, 0.19, 32]} />
            <meshBasicMaterial color="#5eead4" transparent opacity={0.35} side={2} />
          </mesh>
        </>
      )}
    </group>
  );
}

function MiniSack({ position }) {
  return (
    <group position={position} scale={0.6}>
      <RoundedBox args={[0.95, 1.25, 0.5]} radius={0.13} smoothness={4} castShadow>
        <meshStandardMaterial color="#0d9488" roughness={0.55} metalness={0.08} />
      </RoundedBox>
      <mesh position={[0, 0.71, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.45, 0.2, 18]} />
        <meshStandardMaterial color="#0a7c70" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.76, 0]}>
        <torusGeometry args={[0.2, 0.04, 10, 18]} />
        <meshStandardMaterial color="#d4a373" roughness={0.45} metalness={0.3} />
      </mesh>
      <mesh position={[0, 0.05, 0.255]}>
        <planeGeometry args={[0.65, 0.55]} />
        <meshStandardMaterial color="#faedcd" roughness={0.4} emissive="#d4a373" emissiveIntensity={0.18} />
      </mesh>
      <mesh
        position={[0, 0.12, 0.257]}
        rotation={[0, 0, 0.4]}
        scale={[0.11, 0.045, 0.04]}
      >
        <sphereGeometry args={[1, 12, 8]} />
        <meshStandardMaterial color="#2dd4bf" emissive="#0d9488" emissiveIntensity={0.5} />
      </mesh>
    </group>
  );
}

/* The whole biosphere disc — rotates as one unit. */
function Biosphere() {
  const ref = useRef();
  useFrame((_, dt) => { if (ref.current) ref.current.rotation.y += dt * 0.12; });
  const stones = useMemo(
    () => [
      { p: [0.85, 0.16, -0.5], s: 0.07 },
      { p: [-0.95, 0.16, 0.4], s: 0.085 },
      { p: [0.4, 0.16, 0.95],  s: 0.055 },
      { p: [-0.4, 0.17, -0.8], s: 0.06 },
    ],
    [],
  );
  return (
    <group ref={ref} position={[0, -0.4, 0]}>
      {/* soil base */}
      <mesh receiveShadow castShadow>
        <cylinderGeometry args={[1.5, 1.7, 0.32, 40]} />
        <meshStandardMaterial color="#3b2a18" roughness={1} />
      </mesh>
      <mesh position={[0, 0.165, 0]} receiveShadow>
        <cylinderGeometry args={[1.42, 1.5, 0.04, 40]} />
        <meshStandardMaterial color="#251608" roughness={1} />
      </mesh>
      {/* stones */}
      {stones.map((st, i) => (
        <mesh key={i} position={st.p} scale={st.s} castShadow>
          <icosahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color="#5b4a37" roughness={0.95} />
        </mesh>
      ))}
      {/* sprouts at staggered radii */}
      <MiniSprout position={[0.0, 0.18, 0.0]} scale={0.95} />
      <MiniSprout position={[-0.78, 0.18, 0.55]} scale={0.7} glow={false} />
      <MiniSprout position={[0.65, 0.18, -0.45]} scale={0.75} glow={false} />
      {/* sack on the disc */}
      <MiniSack position={[0.85, 0.55, 0.7]} />
    </group>
  );
}

/* Orbiting elements — drift in a slow circle around the biosphere */
function OrbitDrift() {
  const ref = useRef();
  useFrame((_, dt) => { if (ref.current) ref.current.rotation.y -= dt * 0.18; });
  return (
    <group ref={ref} position={[0, 0.1, 0]}>
      <Float floatIntensity={1.4} rotationIntensity={0.3} speed={1.5}>
        <mesh position={[2.2, 0.6, 0.4]}>
          <sphereGeometry args={[0.18, 18, 18]} />
          <meshPhysicalMaterial color="#5eead4" transmission={0.85} roughness={0.05} thickness={0.5} clearcoat={1} ior={1.4} />
        </mesh>
      </Float>
      <Float floatIntensity={1.4} rotationIntensity={0.3} speed={1.7}>
        <mesh position={[-2.0, 0.4, 0.7]}>
          <sphereGeometry args={[0.15, 18, 18]} />
          <meshPhysicalMaterial color="#5eead4" transmission={0.85} roughness={0.05} thickness={0.5} clearcoat={1} ior={1.4} />
        </mesh>
      </Float>
      {/* floating wheat ears */}
      <Float floatIntensity={1.4} rotationIntensity={0.6} speed={1.3}>
        <group position={[1.6, 1.4, -0.6]} rotation={[0, 0, 0.3]} scale={0.85}>
          <mesh>
            <cylinderGeometry args={[0.022, 0.034, 0.9, 6]} />
            <meshStandardMaterial color="#7a8b3e" roughness={0.6} />
          </mesh>
          {[0, 1, 2, 3, 4].map((i) => (
            <group key={i} position={[0, 0.05 + i * 0.11, 0]} rotation={[0, (i % 2) * Math.PI, 0]}>
              <mesh position={[0.06, 0, 0]} rotation={[0, 0, -0.3]}>
                <capsuleGeometry args={[0.045, 0.09, 4, 8]} />
                <meshStandardMaterial color="#e9c184" roughness={0.45} metalness={0.2} />
              </mesh>
            </group>
          ))}
        </group>
      </Float>
      <Float floatIntensity={1.4} rotationIntensity={0.6} speed={1.5}>
        <group position={[-1.9, 1.0, -0.4]} rotation={[0, 0, -0.25]} scale={0.7}>
          <mesh>
            <cylinderGeometry args={[0.022, 0.034, 0.9, 6]} />
            <meshStandardMaterial color="#7a8b3e" roughness={0.6} />
          </mesh>
          {[0, 1, 2, 3, 4].map((i) => (
            <group key={i} position={[0, 0.05 + i * 0.11, 0]} rotation={[0, (i % 2) * Math.PI, 0]}>
              <mesh position={[0.06, 0, 0]} rotation={[0, 0, -0.3]}>
                <capsuleGeometry args={[0.045, 0.09, 4, 8]} />
                <meshStandardMaterial color="#e9c184" roughness={0.45} metalness={0.2} />
              </mesh>
            </group>
          ))}
        </group>
      </Float>
      {/* leaves */}
      <Float floatIntensity={1.6} rotationIntensity={1} speed={1.3}>
        <group position={[1.3, -0.3, 1.1]} rotation={[0, 0.4, 0]} scale={0.85}>
          <mesh rotation={[0, 0, 0.3]} scale={[0.8, 0.2, 0.42]}>
            <sphereGeometry args={[0.45, 14, 10]} />
            <meshStandardMaterial color="#5eead4" roughness={0.5} />
          </mesh>
        </group>
      </Float>
      <Float floatIntensity={1.6} rotationIntensity={1} speed={1.5}>
        <group position={[-1.4, -0.2, 1.0]} rotation={[0, -0.6, 0]} scale={0.78}>
          <mesh rotation={[0, 0, 0.3]} scale={[0.8, 0.2, 0.42]}>
            <sphereGeometry args={[0.45, 14, 10]} />
            <meshStandardMaterial color="#52b788" roughness={0.5} />
          </mesh>
        </group>
      </Float>
    </group>
  );
}

export default function AmbientScene() {
  const { frameloop, containerRef } = useCanvasFrameloop();
  return (
    <div ref={containerRef} className="absolute inset-0">
    <Canvas
      shadows
      frameloop={frameloop}
      dpr={[1, 1.25]}
      camera={{ position: [0, 1.0, 5.5], fov: 42 }}
      gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
    >
      <Suspense fallback={null}>
        <ambientLight intensity={0.85} color="#a7f3d0" />
        <hemisphereLight args={['#5eead4', '#1b4332', 0.45]} />
        {/* warm "sun" */}
        <directionalLight
          position={[3, 5, 3]}
          intensity={1.15}
          castShadow
          shadow-mapSize-width={512}
          shadow-mapSize-height={512}
          color="#faedcd"
        />
        <pointLight position={[-3, 2, -2]} intensity={0.8} color="#2dd4bf" />
        <pointLight position={[3, -1, 3]}  intensity={0.6} color="#d4a373" />

        <Biosphere />
        <OrbitDrift />

        <Sparkles count={42} scale={[8, 5, 5]} size={1.7} speed={0.4} color="#5eead4" />
      </Suspense>
    </Canvas>
    </div>
  );
}
