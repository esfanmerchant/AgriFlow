import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Environment, ContactShadows, Sparkles, MeshDistortMaterial, MeshWobbleMaterial } from '@react-three/drei';
import { Suspense, useMemo, useRef } from 'react';
import * as THREE from 'three';

/* ----- Procedural wheat stalk ----- */
function WheatStalk({ position, rotation, scale = 1 }) {
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh position={[0, 0.6, 0]} castShadow>
        <cylinderGeometry args={[0.025, 0.04, 1.4, 8]} />
        <meshStandardMaterial color="#7a8b3e" roughness={0.6} />
      </mesh>
      {[0, 1, 2, 3, 4].map((i) => (
        <group key={i} position={[0, 1.35 + i * 0.08, 0]} rotation={[0, (i % 2) * Math.PI, 0]}>
          <mesh castShadow>
            <capsuleGeometry args={[0.06, 0.12, 4, 12]} />
            <meshStandardMaterial color="#d4a373" roughness={0.4} metalness={0.2} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 1.85, 0]}>
        <coneGeometry args={[0.04, 0.18, 8]} />
        <meshStandardMaterial color="#faedcd" roughness={0.4} />
      </mesh>
    </group>
  );
}

/* ----- Procedural fertilizer bag ----- */
function FertilizerBag({ position = [0, 0, 0] }) {
  const ref = useRef();
  useFrame((s) => { if (ref.current) ref.current.rotation.y = s.clock.elapsedTime * 0.3; });
  return (
    <Float floatIntensity={1.4} rotationIntensity={0.4} speed={1.6}>
      <group ref={ref} position={position}>
        <mesh castShadow>
          <boxGeometry args={[1.2, 1.6, 0.6]} />
          <meshStandardMaterial color="#0d9488" roughness={0.5} metalness={0.1} />
        </mesh>
        <mesh position={[0, 0.1, 0.305]}>
          <planeGeometry args={[0.9, 0.7]} />
          <meshStandardMaterial color="#faedcd" roughness={0.4} emissive="#d4a373" emissiveIntensity={0.15} />
        </mesh>
        <mesh position={[0, 0.85, 0]}>
          <torusGeometry args={[0.3, 0.08, 12, 24]} />
          <meshStandardMaterial color="#0f2a1f" roughness={0.7} />
        </mesh>
      </group>
    </Float>
  );
}

/* ----- Distorted growth orb ----- */
function GrowthOrb({ position }) {
  return (
    <Float floatIntensity={2} rotationIntensity={1} speed={2}>
      <mesh position={position} castShadow>
        <icosahedronGeometry args={[0.55, 4]} />
        <MeshDistortMaterial
          color="#2dd4bf" emissive="#0d9488"
          distort={0.45} speed={2.4}
          roughness={0.15} metalness={0.7}
        />
      </mesh>
    </Float>
  );
}

/* ----- Floating apple/fruit ----- */
function Apple({ position }) {
  return (
    <Float floatIntensity={2} rotationIntensity={1.4} speed={1.8}>
      <group position={position}>
        <mesh castShadow>
          <sphereGeometry args={[0.34, 32, 32]} />
          <meshStandardMaterial color="#ef4444" roughness={0.25} metalness={0.4} />
        </mesh>
        <mesh position={[0.04, 0.34, 0]} rotation={[0, 0, 0.3]}>
          <cylinderGeometry args={[0.03, 0.03, 0.18, 8]} />
          <meshStandardMaterial color="#52260d" />
        </mesh>
        <mesh position={[0.16, 0.36, 0]} rotation={[0, 0, -1.2]}>
          <coneGeometry args={[0.08, 0.18, 8]} />
          <meshStandardMaterial color="#52b788" />
        </mesh>
      </group>
    </Float>
  );
}

/* ----- Floating leaf (twisted plane) ----- */
function Leaf({ position, color = '#52b788' }) {
  return (
    <Float floatIntensity={2.5} rotationIntensity={2} speed={1.4}>
      <mesh position={position}>
        <torusGeometry args={[0.2, 0.08, 8, 16, Math.PI]} />
        <MeshWobbleMaterial color={color} factor={0.3} speed={1.8} roughness={0.4} />
      </mesh>
    </Float>
  );
}

/* ----- Water drop ----- */
function WaterDrop({ position }) {
  return (
    <Float floatIntensity={2.2} rotationIntensity={0.5} speed={2.2}>
      <mesh position={position}>
        <sphereGeometry args={[0.18, 24, 24]} />
        <meshPhysicalMaterial
          color="#5eead4"
          transmission={0.85}
          roughness={0.05}
          thickness={0.5}
          clearcoat={1}
          ior={1.4}
        />
      </mesh>
    </Float>
  );
}

/* ----- Mini procedural tractor ----- */
function Tractor({ position }) {
  const ref = useRef();
  useFrame((s) => { if (ref.current) ref.current.rotation.y = s.clock.elapsedTime * 0.4; });
  return (
    <Float floatIntensity={1.2} rotationIntensity={0.2} speed={1.2}>
      <group ref={ref} position={position} scale={0.55}>
        {/* body */}
        <mesh position={[0, 0.3, 0]} castShadow>
          <boxGeometry args={[1.2, 0.5, 0.7]} />
          <meshStandardMaterial color="#d4a373" metalness={0.5} roughness={0.35} />
        </mesh>
        {/* cabin */}
        <mesh position={[0.15, 0.75, 0]} castShadow>
          <boxGeometry args={[0.55, 0.45, 0.55]} />
          <meshStandardMaterial color="#faedcd" metalness={0.3} roughness={0.4} />
        </mesh>
        {/* exhaust */}
        <mesh position={[-0.45, 0.85, 0.25]}>
          <cylinderGeometry args={[0.04, 0.05, 0.4, 8]} />
          <meshStandardMaterial color="#1f2937" />
        </mesh>
        {/* big rear wheels */}
        {[[-0.4, 0, 0.4], [-0.4, 0, -0.4]].map((p, i) => (
          <mesh key={i} position={p} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <torusGeometry args={[0.32, 0.13, 12, 24]} />
            <meshStandardMaterial color="#06120c" roughness={0.7} />
          </mesh>
        ))}
        {/* front wheels */}
        {[[0.45, 0.05, 0.35], [0.45, 0.05, -0.35]].map((p, i) => (
          <mesh key={i} position={p} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <torusGeometry args={[0.2, 0.09, 12, 24]} />
            <meshStandardMaterial color="#06120c" roughness={0.7} />
          </mesh>
        ))}
      </group>
    </Float>
  );
}

/* ----- Wheat field ring ----- */
function WheatField() {
  const stalks = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 30; i++) {
      const r = 1.7 + Math.random() * 1.6;
      const a = (i / 30) * Math.PI * 2 + Math.random() * 0.3;
      arr.push({
        position: [Math.cos(a) * r, -1.3, Math.sin(a) * r],
        rotation: [Math.random() * 0.2 - 0.1, Math.random() * Math.PI, Math.random() * 0.2 - 0.1],
        scale: 0.65 + Math.random() * 0.6,
      });
    }
    return arr;
  }, []);
  const ref = useRef();
  useFrame((s) => { if (ref.current) ref.current.rotation.y = s.clock.elapsedTime * 0.08; });
  return (
    <group ref={ref}>
      {stalks.map((p, i) => <WheatStalk key={i} {...p} />)}
    </group>
  );
}

/* ----- Ring of orbiting drops + leaves around the orb ----- */
function Orbits() {
  const g = useRef();
  useFrame((s) => { if (g.current) g.current.rotation.y = s.clock.elapsedTime * 0.25; });
  return (
    <group ref={g}>
      <WaterDrop position={[1.6, 0.3, 1.0]} />
      <WaterDrop position={[-1.4, 0.7, -1.2]} />
      <Leaf position={[1.8, -0.2, -0.8]} color="#5eead4" />
      <Leaf position={[-1.7, 0.1, 1.0]} color="#52b788" />
      <Leaf position={[0.8, 1.2, -1.6]} color="#2dd4bf" />
    </group>
  );
}

export default function HeroScene() {
  return (
    <div className="absolute inset-0 -z-10">
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [0, 1.2, 6], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.45} />
          <directionalLight
            position={[4, 6, 4]}
            intensity={1.3}
            castShadow
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
            color="#faedcd"
          />
          <pointLight position={[-4, 2, -2]} intensity={0.8} color="#2dd4bf" />
          <pointLight position={[3, -1, 3]}  intensity={0.6} color="#d4a373" />

          <FertilizerBag position={[-2.6, 0.4, 0]} />
          <GrowthOrb position={[2.6, 0.5, 0]} />
          <Apple position={[0.5, 1.6, 0.2]} />
          <Tractor position={[-0.6, -0.7, 1.3]} />
          <Orbits />
          <WheatField />

          <Sparkles count={120} scale={[12, 7, 7]} size={2.2} speed={0.5} color="#5eead4" />
          <ContactShadows
            position={[0, -1.45, 0]}
            opacity={0.6}
            scale={12}
            blur={2.6}
            far={3}
            color="#06120c"
          />
          <Environment preset="forest" />
        </Suspense>
      </Canvas>
    </div>
  );
}
