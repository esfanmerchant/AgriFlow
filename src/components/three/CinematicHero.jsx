import { Canvas, useFrame } from '@react-three/fiber';
import {
  PerspectiveCamera, Sparkles, RoundedBox, ContactShadows,
} from '@react-three/drei';
import { Suspense, useMemo, useRef } from 'react';
import { useCanvasFrameloop } from './useCanvasFrameloop.js';

/* ----- math helpers ----- */
const lerp = (a, b, t) => a + (b - a) * t;
const clamp01 = (t) => (t < 0 ? 0 : t > 1 ? 1 : t);
const smoothstep = (min, max, t) => {
  const x = clamp01((t - min) / (max - min));
  return x * x * (3 - 2 * x);
};

/* ============================================================
   The Seed — a small ovoid that splits open as it cracks.
   ============================================================ */
function Seed({ groupRef, topRef, bottomRef }) {
  return (
    <group ref={groupRef}>
      <mesh ref={topRef} position={[0, 0.04, 0]} castShadow>
        <sphereGeometry args={[0.22, 28, 18, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#a07a4a" roughness={0.7} metalness={0.05} />
      </mesh>
      <mesh ref={bottomRef} position={[0, -0.04, 0]} rotation={[Math.PI, 0, 0]} castShadow>
        <sphereGeometry args={[0.22, 28, 18, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#7a5a32" roughness={0.75} metalness={0.05} />
      </mesh>
      {/* seed core glow — emerges as it cracks */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial
          color="#a7f3d0"
          emissive="#2dd4bf"
          emissiveIntensity={1.2}
          roughness={0.3}
        />
      </mesh>
    </group>
  );
}

/* ============================================================
   Sprout — stem + spiral leaves + glowing bud.
   Scales from 0 to full as scroll progresses through frame 2.
   ============================================================ */
function Sprout({ groupRef, leavesRef, budRef }) {
  const leaves = useMemo(() => {
    const count = 6;
    return Array.from({ length: count }).map((_, i) => ({
      y: -0.35 + (i / (count - 1)) * 0.95,
      angle: i * 1.05,
      flip: i % 2 === 0 ? 1 : -1,
      color: i % 2 === 0 ? '#52b788' : '#2d6a4f',
    }));
  }, []);

  return (
    <group ref={groupRef}>
      {/* stem */}
      <mesh castShadow>
        <cylinderGeometry args={[0.045, 0.075, 1.6, 10]} />
        <meshStandardMaterial color="#3a8a5c" roughness={0.55} />
      </mesh>
      {/* leaves */}
      <group ref={leavesRef}>
        {leaves.map((l, i) => (
          <group key={i} position={[0, l.y, 0]} rotation={[0, l.angle, 0]}>
            <mesh
              position={[l.flip * 0.34, 0.08, 0]}
              rotation={[0, 0, l.flip * -0.7]}
              scale={[0.6, 0.18, 0.34]}
              castShadow
            >
              <sphereGeometry args={[0.5, 14, 10]} />
              <meshStandardMaterial color={l.color} roughness={0.45} metalness={0.05} />
            </mesh>
          </group>
        ))}
      </group>
      {/* glowing bud */}
      <mesh ref={budRef} position={[0, 0.85, 0]} castShadow>
        <sphereGeometry args={[0.13, 20, 20]} />
        <meshStandardMaterial
          color="#a7f3d0"
          emissive="#2dd4bf"
          emissiveIntensity={1}
          roughness={0.3}
          metalness={0.2}
        />
      </mesh>
      {/* aura ring */}
      <mesh position={[0, 0.85, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.18, 0.23, 32]} />
        <meshBasicMaterial color="#5eead4" transparent opacity={0.35} side={2} />
      </mesh>
    </group>
  );
}

/* ============================================================
   Soil mound — base for the plant, fades in from frame 2.
   ============================================================ */
function SoilMound({ groupRef }) {
  const stones = useMemo(
    () => [
      { p: [0.95, 0.18, -0.45], s: 0.075 },
      { p: [-1.05, 0.18, 0.50], s: 0.090 },
      { p: [0.45, 0.18, 0.95],  s: 0.060 },
    ],
    [],
  );
  return (
    <group ref={groupRef} position={[0, -1.55, 0]}>
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

/* ============================================================
   Orbital ring — wheat ears + drops + leaves around the plant.
   Appears in frame 3.
   ============================================================ */
function Orbits({ groupRef }) {
  return (
    <group ref={groupRef}>
      {/* fertilizer sack */}
      <group position={[1.65, 0.0, 0.35]} scale={0.65}>
        <RoundedBox args={[0.95, 1.25, 0.5]} radius={0.13} smoothness={4} castShadow>
          <meshStandardMaterial color="#0d9488" roughness={0.55} />
        </RoundedBox>
        <mesh position={[0, 0.71, 0]} castShadow>
          <cylinderGeometry args={[0.2, 0.45, 0.2, 16]} />
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
      </group>
      {/* wheat ears */}
      {[
        { pos: [-1.55, 0.55, -0.2], rot: [0, 0, 0.25], scl: 0.85 },
        { pos: [0.40, 1.45, -1.0],  rot: [0, 0, 0.10], scl: 0.7 },
      ].map((e, i) => (
        <group key={i} position={e.pos} rotation={e.rot} scale={e.scl}>
          <mesh castShadow>
            <cylinderGeometry args={[0.018, 0.028, 0.85, 6]} />
            <meshStandardMaterial color="#7a8b3e" roughness={0.6} />
          </mesh>
          {[0, 1, 2, 3, 4].map((g) => (
            <group key={g} position={[0, 0.05 + g * 0.11, 0]} rotation={[0, (g % 2) * Math.PI, 0]}>
              <mesh position={[0.06, 0, 0]} rotation={[0, 0, -0.3]} castShadow>
                <capsuleGeometry args={[0.045, 0.09, 4, 8]} />
                <meshStandardMaterial color="#e9c184" roughness={0.45} metalness={0.2} />
              </mesh>
            </group>
          ))}
        </group>
      ))}
      {/* water drops */}
      <mesh position={[1.45, -0.15, -0.55]}>
        <sphereGeometry args={[0.13, 18, 18]} />
        <meshPhysicalMaterial
          color="#5eead4" transmission={0.85} roughness={0.05}
          thickness={0.5} clearcoat={1} ior={1.4}
        />
      </mesh>
      <mesh position={[-1.30, -0.30, 0.65]}>
        <sphereGeometry args={[0.11, 18, 18]} />
        <meshPhysicalMaterial
          color="#5eead4" transmission={0.85} roughness={0.05}
          thickness={0.5} clearcoat={1} ior={1.4}
        />
      </mesh>
      {/* drift leaves */}
      <mesh position={[1.0, 0.2, 1.05]} rotation={[0, 0, 0.3]} scale={[0.55, 0.16, 0.32]}>
        <sphereGeometry args={[0.5, 14, 10]} />
        <meshStandardMaterial color="#5eead4" roughness={0.5} />
      </mesh>
      <mesh position={[-0.85, 1.05, 0.75]} rotation={[0, 0.7, 0]} scale={[0.5, 0.14, 0.3]}>
        <sphereGeometry args={[0.5, 14, 10]} />
        <meshStandardMaterial color="#52b788" roughness={0.5} />
      </mesh>
    </group>
  );
}

/* ============================================================
   Field — distant ring of small plants seen in frame 4.
   ============================================================ */
function Field({ groupRef }) {
  const positions = useMemo(() => {
    const arr = [];
    // concentric rings of plants
    for (let r = 2.6; r < 9; r += 0.9) {
      const count = Math.floor(r * 7);
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2 + r * 0.3;
        const jitter = (Math.sin(i * 12.9898) * 43758.5453) % 1; // pseudo-random
        arr.push({
          pos: [
            Math.cos(angle) * (r + jitter * 0.25),
            -1.55,
            Math.sin(angle) * (r + jitter * 0.25),
          ],
          colorIdx: Math.floor(Math.abs(jitter) * 3) % 3,
        });
      }
    }
    return arr;
  }, []);
  const palette = ['#52b788', '#3a8a5c', '#2d6a4f'];
  return (
    <group ref={groupRef}>
      {positions.map((p, i) => (
        <group key={i} position={p.pos} scale={0.32}>
          <mesh>
            <cylinderGeometry args={[0.05, 0.08, 1.4, 6]} />
            <meshStandardMaterial color={palette[p.colorIdx]} roughness={0.5} />
          </mesh>
          <mesh position={[0.18, 0.25, 0]} rotation={[0, 0, -0.7]} scale={[0.45, 0.14, 0.28]}>
            <sphereGeometry args={[0.5, 8, 6]} />
            <meshStandardMaterial color={palette[(p.colorIdx + 1) % 3]} roughness={0.5} />
          </mesh>
          <mesh position={[-0.18, 0.4, 0]} rotation={[0, 0, 0.7]} scale={[0.4, 0.12, 0.25]}>
            <sphereGeometry args={[0.5, 8, 6]} />
            <meshStandardMaterial color={palette[(p.colorIdx + 2) % 3]} roughness={0.5} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/* ============================================================
   The scene itself — reads MotionValue every frame, drives all
   transforms via refs (no React re-renders).
   ============================================================ */
function CinematicScene({ progressMV }) {
  const cameraRef    = useRef();
  const seedGroupRef = useRef();
  const seedTopRef   = useRef();
  const seedBotRef   = useRef();
  const sproutRef    = useRef();
  const sproutLvsRef = useRef();
  const sproutBudRef = useRef();
  const soilRef      = useRef();
  const orbitsRef    = useRef();
  const fieldRef     = useRef();
  const sunRef       = useRef();
  const ambientRef   = useRef();

  // internal smoothing state — exponentially eases toward the spring-smoothed
  // scroll value. Even subtle jitters in the spring (e.g. when the user
  // releases the trackpad) are absorbed here, giving the scene continuous
  // motion that always settles gracefully.
  const damped = useRef({ t: 0, camPos: { x: 0, y: 0, z: 2.4 }, lookY: 0 });

  useFrame((state, dt) => {
    const targetT = progressMV ? progressMV.get() : 0;
    // critically-damped exponential follow — k bigger = snappier, smaller = softer
    const kT = 1 - Math.exp(-dt * 6);
    damped.current.t += (targetT - damped.current.t) * kT;
    const t = damped.current.t;

    /* Camera path — additionally damped per-axis for cinematic ease:
       - 0.00–0.25 frame 1: eye-level on the seed at z=2.4
       - 0.25–0.50 frame 2: pulls back to z=4.5, slight rise
       - 0.50–0.75 frame 3: continues to z=6.8, rises to y=1.2
       - 0.75–1.00 frame 4: high orbit z=12, y=4.5 looking down
    */
    if (cameraRef.current) {
      const targetZ = lerp(2.4, 12, smoothstep(0, 1, t));
      const targetY =
        lerp(0, 0.4, smoothstep(0.0,  0.5, t)) +
        lerp(0, 4.0, smoothstep(0.55, 1.0, t));
      const targetLookY = lerp(0, -1.2, smoothstep(0.55, 1, t));

      // softer follow on the camera so it floats rather than locks to scroll
      const kCam = 1 - Math.exp(-dt * 4.5);
      damped.current.camPos.z += (targetZ     - damped.current.camPos.z) * kCam;
      damped.current.camPos.y += (targetY     - damped.current.camPos.y) * kCam;
      damped.current.lookY     += (targetLookY - damped.current.lookY)    * kCam;

      cameraRef.current.position.set(0, damped.current.camPos.y, damped.current.camPos.z);
      cameraRef.current.lookAt(0, damped.current.lookY, 0);
    }

    /* SEED — visible 0–0.28, cracks at 0.18, gone after 0.30 */
    if (seedGroupRef.current) {
      const seedScale = 1 - smoothstep(0.22, 0.30, t);
      seedGroupRef.current.scale.setScalar(seedScale);
      // gentle idle bob + spin in frame 1
      const idle = clamp01(1 - t / 0.22);
      seedGroupRef.current.position.y = Math.sin(state.clock.elapsedTime * 1.2) * 0.05 * idle;
      seedGroupRef.current.rotation.y = state.clock.elapsedTime * 0.4;
    }
    if (seedTopRef.current && seedBotRef.current) {
      const crack = smoothstep(0.16, 0.28, t);
      seedTopRef.current.position.y = 0.04 + crack * 0.22;
      seedBotRef.current.position.y = -0.04 - crack * 0.22;
      seedTopRef.current.rotation.x = crack * 0.5;
      seedBotRef.current.rotation.x = Math.PI - crack * 0.5;
    }

    /* SPROUT — emerges 0.22, fully grown by 0.55, stays through 1.0 */
    if (sproutRef.current) {
      const growth = smoothstep(0.22, 0.55, t);
      sproutRef.current.scale.set(growth, growth, growth);
      // sit at soil level, push up as it grows
      sproutRef.current.position.y = lerp(-1.42, -0.78, growth);
      // gentle sway
      sproutRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.6) * 0.03;
    }
    if (sproutLvsRef.current) {
      const leafShow = smoothstep(0.32, 0.55, t);
      sproutLvsRef.current.scale.setScalar(leafShow);
    }
    if (sproutBudRef.current) {
      const budShow = smoothstep(0.45, 0.6, t);
      const breathe = 1 + Math.sin(state.clock.elapsedTime * 2.4) * 0.06;
      sproutBudRef.current.scale.setScalar(budShow * breathe);
    }

    /* SOIL — fades in alongside sprout, stays */
    if (soilRef.current) {
      const soilShow = smoothstep(0.16, 0.32, t);
      soilRef.current.scale.setScalar(soilShow);
    }

    /* ORBITS — appear frame 3 */
    if (orbitsRef.current) {
      const orbitShow = smoothstep(0.50, 0.70, t);
      const orbitFade = 1 - smoothstep(0.85, 1.0, t); // fade as we pull out
      orbitsRef.current.scale.setScalar(orbitShow * orbitFade);
      orbitsRef.current.rotation.y = state.clock.elapsedTime * 0.22;
    }

    /* FIELD — appears frame 4 */
    if (fieldRef.current) {
      const fieldShow = smoothstep(0.72, 0.95, t);
      fieldRef.current.scale.setScalar(fieldShow);
      fieldRef.current.rotation.y = state.clock.elapsedTime * 0.04;
    }

    /* LIGHTS shift mood frame by frame (cool dawn → golden harvest) */
    if (sunRef.current) {
      sunRef.current.intensity = lerp(0.7, 1.7, t);
      const c = sunRef.current.color;
      const g = lerp(0.95, 0.93, t); // very subtle warm shift
      const b = lerp(0.85, 0.70, t);
      c.setRGB(1.0, g, b);
    }
    if (ambientRef.current) {
      ambientRef.current.intensity = lerp(0.55, 0.85, t);
    }
  });

  return (
    <>
      <PerspectiveCamera ref={cameraRef} makeDefault position={[0, 0, 2.4]} fov={48} near={0.1} far={50} />

      <ambientLight ref={ambientRef} intensity={0.55} color="#a7f3d0" />
      <hemisphereLight args={['#5eead4', '#1b4332', 0.5]} />
      <directionalLight
        ref={sunRef}
        position={[3, 5, 3]}
        intensity={0.9}
        color="#faedcd"
        castShadow
        shadow-mapSize-width={512}
        shadow-mapSize-height={512}
      />
      <pointLight position={[-3, 2, -2]} intensity={0.7} color="#2dd4bf" />
      <pointLight position={[3, -1, 3]}  intensity={0.55} color="#d4a373" />

      <Seed groupRef={seedGroupRef} topRef={seedTopRef} bottomRef={seedBotRef} />
      <SoilMound groupRef={soilRef} />
      <group ref={sproutRef} position={[0, -1.42, 0]} scale={0.0001}>
        <Sprout leavesRef={sproutLvsRef} budRef={sproutBudRef} />
      </group>
      <Orbits groupRef={orbitsRef} />
      <Field groupRef={fieldRef} />

      <Sparkles count={45} scale={[12, 8, 6]} size={1.6} speed={0.4} color="#5eead4" />

      <ContactShadows
        position={[0, -1.72, 0]}
        opacity={0.45}
        scale={14}
        blur={3}
        far={5}
        resolution={256}
        frames={1}
        color="#06120c"
      />
    </>
  );
}

/* ============================================================
   Default export — Canvas wrapper used by Landing.
   ============================================================ */
export default function CinematicHero({ scrollYProgress }) {
  const { frameloop, containerRef } = useCanvasFrameloop();

  return (
    <div ref={containerRef} className="absolute inset-0">
      <Canvas
        shadows
        dpr={[1, 1.25]}
        frameloop={frameloop}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      >
        <Suspense fallback={null}>
          <CinematicScene progressMV={scrollYProgress} />
        </Suspense>
      </Canvas>
    </div>
  );
}
