import { Canvas, useFrame } from '@react-three/fiber';
import {
  Float, ContactShadows, Sparkles, RoundedBox,
} from '@react-three/drei';
import { Suspense, useMemo, useRef } from 'react';
import { useCanvasFrameloop } from './useCanvasFrameloop.js';

/* ========== Soil mound — base for the plant ========== */
function SoilMound() {
  const stones = useMemo(
    () => [
      { p: [0.95, 0.18, -0.45], s: 0.075 },
      { p: [-1.05, 0.18, 0.50], s: 0.090 },
      { p: [0.45, 0.18, 0.95],  s: 0.060 },
      { p: [-0.35, 0.19, -0.85], s: 0.055 },
    ],
    [],
  );
  return (
    <group position={[0, -1.45, 0]}>
      <mesh receiveShadow>
        <cylinderGeometry args={[1.55, 1.75, 0.32, 36]} />
        <meshStandardMaterial color="#3b2a18" roughness={1} />
      </mesh>
      <mesh position={[0, 0.165, 0]} receiveShadow>
        <cylinderGeometry args={[1.45, 1.55, 0.04, 36]} />
        <meshStandardMaterial color="#251608" roughness={1} />
      </mesh>
      {stones.map((st, i) => (
        <mesh key={i} position={st.p} scale={st.s} castShadow>
          <icosahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color="#5b4a37" roughness={0.95} />
        </mesh>
      ))}
    </group>
  );
}

/* ========== Central sprout — focal element ========== */
function Sprout() {
  const budRef = useRef();
  useFrame((s) => {
    if (budRef.current) {
      const t = s.clock.elapsedTime;
      budRef.current.scale.setScalar(1 + Math.sin(t * 2.2) * 0.06);
    }
  });
  const leaves = useMemo(() => {
    const count = 6;
    return Array.from({ length: count }).map((_, i) => {
      // distribute along upper stem: local y ∈ [-0.35, +0.55]
      const y = -0.35 + (i / (count - 1)) * 0.9;
      const angle = i * 1.05;
      const flip = i % 2 === 0 ? 1 : -1;
      const colorA = i % 2 === 0 ? '#52b788' : '#2d6a4f';
      return { y, angle, flip, color: colorA };
    });
  }, []);

  // Group sits so stem bottom is just at soil top (~y -1.29 world).
  // Stem height 1.6, centered → bottom at local y -0.8. Group at y -0.55 → bottom at world -1.35 (0.06 buried).
  return (
    <Float floatIntensity={0.25} rotationIntensity={0.15} speed={1}>
      <group position={[0, -0.55, 0]}>
        {/* stem */}
        <mesh castShadow>
          <cylinderGeometry args={[0.045, 0.075, 1.6, 10]} />
          <meshStandardMaterial color="#3a8a5c" roughness={0.55} />
        </mesh>

        {/* leaves spiraling up the upper stem */}
        {leaves.map((l, i) => (
          <group key={i} position={[0, l.y, 0]} rotation={[0, l.angle, 0]}>
            <mesh
              position={[l.flip * 0.34, 0.08, 0]}
              rotation={[0, 0, l.flip * -0.7]}
              scale={[0.6, 0.18, 0.34]}
              castShadow
            >
              <sphereGeometry args={[0.5, 14, 10]} />
              <meshStandardMaterial color={l.color} roughness={0.45} metalness={0.08} />
            </mesh>
          </group>
        ))}

        {/* glowing top bud — pulses, sits just above stem top */}
        <mesh ref={budRef} position={[0, 0.82, 0]} castShadow>
          <sphereGeometry args={[0.13, 20, 20]} />
          <meshStandardMaterial
            color="#a7f3d0"
            emissive="#2dd4bf"
            emissiveIntensity={0.85}
            roughness={0.3}
            metalness={0.2}
          />
        </mesh>

        {/* aura ring */}
        <mesh position={[0, 0.82, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.18, 0.23, 32]} />
          <meshBasicMaterial color="#5eead4" transparent opacity={0.35} side={2} />
        </mesh>
      </group>
    </Float>
  );
}

/* ========== Fertilizer sack — clean rounded bag ========== */
function FertilizerSack({ position }) {
  const ref = useRef();
  useFrame((s) => {
    if (ref.current) ref.current.rotation.y = s.clock.elapsedTime * 0.28;
  });
  return (
    <Float floatIntensity={0.5} rotationIntensity={0.2} speed={1.2}>
      <group ref={ref} position={position} scale={0.85}>
        {/* main body */}
        <RoundedBox args={[1.0, 1.35, 0.55]} radius={0.14} smoothness={4} castShadow>
          <meshStandardMaterial color="#0d9488" roughness={0.55} metalness={0.08} />
        </RoundedBox>

        {/* gathered/tied top */}
        <mesh position={[0, 0.78, 0]} castShadow>
          <cylinderGeometry args={[0.22, 0.48, 0.22, 18]} />
          <meshStandardMaterial color="#0a7c70" roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.83, 0]}>
          <torusGeometry args={[0.22, 0.045, 10, 18]} />
          <meshStandardMaterial color="#d4a373" roughness={0.45} metalness={0.3} />
        </mesh>

        {/* label */}
        <mesh position={[0, 0.05, 0.281]}>
          <planeGeometry args={[0.7, 0.6]} />
          <meshStandardMaterial
            color="#faedcd"
            roughness={0.4}
            emissive="#d4a373"
            emissiveIntensity={0.18}
          />
        </mesh>

        {/* leaf icon on label */}
        <mesh
          position={[0, 0.12, 0.283]}
          rotation={[0, 0, 0.4]}
          scale={[0.12, 0.05, 0.04]}
        >
          <sphereGeometry args={[1, 12, 8]} />
          <meshStandardMaterial color="#2dd4bf" emissive="#0d9488" emissiveIntensity={0.5} />
        </mesh>
        {/* brand stripe */}
        <mesh position={[0, -0.16, 0.283]}>
          <planeGeometry args={[0.5, 0.05]} />
          <meshStandardMaterial color="#2dd4bf" emissive="#0d9488" emissiveIntensity={0.45} />
        </mesh>
      </group>
    </Float>
  );
}

/* ========== Wheat ear — single grain stalk ========== */
function WheatEar({ position, rotation = [0, 0, 0], scale = 1 }) {
  return (
    <Float floatIntensity={1.4} rotationIntensity={0.5} speed={1.3}>
      <group position={position} rotation={rotation} scale={scale}>
        <mesh castShadow>
          <cylinderGeometry args={[0.018, 0.028, 0.85, 6]} />
          <meshStandardMaterial color="#7a8b3e" roughness={0.6} />
        </mesh>
        {[0, 1, 2, 3, 4].map((i) => (
          <group
            key={i}
            position={[0, 0.05 + i * 0.11, 0]}
            rotation={[0, (i % 2) * Math.PI, 0]}
          >
            <mesh position={[0.06, 0, 0]} rotation={[0, 0, -0.3]} castShadow>
              <capsuleGeometry args={[0.045, 0.09, 4, 8]} />
              <meshStandardMaterial color="#e9c184" roughness={0.45} metalness={0.2} />
            </mesh>
          </group>
        ))}
        <mesh position={[0, 0.66, 0]}>
          <coneGeometry args={[0.025, 0.14, 6]} />
          <meshStandardMaterial color="#faedcd" roughness={0.5} />
        </mesh>
      </group>
    </Float>
  );
}

/* ========== Water drop — proper teardrop ========== */
function WaterDrop({ position, scale = 1 }) {
  return (
    <Float floatIntensity={1.8} rotationIntensity={0.3} speed={1.8}>
      <group position={position} scale={scale}>
        <mesh>
          <sphereGeometry args={[0.14, 18, 18]} />
          <meshPhysicalMaterial
            color="#5eead4"
            transmission={0.85}
            roughness={0.05}
            thickness={0.5}
            clearcoat={1}
            ior={1.4}
          />
        </mesh>
        <mesh position={[0, 0.13, 0]}>
          <coneGeometry args={[0.13, 0.17, 18]} />
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

/* ========== Floating leaf (proper teardrop shape) ========== */
function Leaf({ position, color = '#52b788', rotation = [0, 0, 0], scale = 1 }) {
  return (
    <Float floatIntensity={1.8} rotationIntensity={1} speed={1.4}>
      <group position={position} rotation={rotation} scale={scale}>
        <mesh rotation={[0, 0, 0.3]} scale={[0.7, 0.18, 0.4]} castShadow>
          <sphereGeometry args={[0.4, 14, 10]} />
          <meshStandardMaterial color={color} roughness={0.5} metalness={0.05} />
        </mesh>
        <mesh position={[-0.32, -0.03, 0]} rotation={[0, 0, 0.3]}>
          <cylinderGeometry args={[0.012, 0.015, 0.15, 6]} />
          <meshStandardMaterial color="#2d6a4f" roughness={0.6} />
        </mesh>
      </group>
    </Float>
  );
}

/* ========== Orbital ring — single shared rotation, kept tight to camera ========== */
function OrbitRing() {
  const ref = useRef();
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.18;
  });
  return (
    <group ref={ref}>
      <WheatEar  position={[1.35,  0.85, 0.45]} rotation={[0, 0,  0.25]} scale={0.9} />
      <WheatEar  position={[-1.35, 0.55, -0.4]} rotation={[0, 0, -0.3]}  scale={0.78} />
      <WheatEar  position={[0.40,  1.45, -1.0]} rotation={[0, 0,  0.1]}  scale={0.7} />
      <WaterDrop position={[1.45, -0.15, -0.55]} scale={0.85} />
      <WaterDrop position={[-1.30, -0.35, 0.65]} scale={0.75} />
      <Leaf      position={[1.0,   0.20, 1.05]}  color="#5eead4" scale={0.9} />
      <Leaf      position={[-0.85, 1.05, 0.75]}  color="#52b788" rotation={[0, 0.7, 0]} scale={0.78} />
    </group>
  );
}

/**
 * SceneContained — clean agriculture-themed 3D hero.
 * Anchored to its parent box (does NOT bleed onto the page).
 */
export default function SceneContained({ density = 'rich' }) {
  const { frameloop, containerRef } = useCanvasFrameloop();
  return (
    <div ref={containerRef} className="absolute inset-0">
    <Canvas
      shadows
      frameloop={frameloop}
      dpr={[1, 1.25]}
      camera={{ position: [0, 0.5, 6.6], fov: 38 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
    >
      <Suspense fallback={null}>
        <ambientLight intensity={0.85} color="#a7f3d0" />
        <hemisphereLight args={['#5eead4', '#1b4332', 0.45]} />
        <directionalLight
          position={[3, 5, 3]}
          intensity={1.2}
          castShadow
          shadow-mapSize-width={512}
          shadow-mapSize-height={512}
          color="#faedcd"
        />
        <pointLight position={[-3, 2, -2]} intensity={0.8} color="#2dd4bf" />
        <pointLight position={[3, -1, 3]}  intensity={0.6} color="#d4a373" />

        <SoilMound />
        <Sprout />
        <FertilizerSack position={[-1.45, -0.6, 0.55]} />
        {density !== 'minimal' && <OrbitRing />}

        <Sparkles count={32} scale={[6, 5, 4]} size={1.6} speed={0.4} color="#5eead4" />

        <ContactShadows
          position={[0, -1.62, 0]}
          opacity={0.45}
          scale={9}
          blur={2.6}
          far={3}
          resolution={256}
          frames={1}
          color="#06120c"
        />
      </Suspense>
    </Canvas>
    </div>
  );
}
