import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface Props {
  state: "idle" | "listening" | "thinking" | "speaking";
  volume?: number;
}

const COLORS = {
  idle: "#00d9ff",
  listening: "#00ffb3",
  thinking: "#6aa8ff",
  speaking: "#ffc857",
} as const;

export default function Reactor3D({ state, volume = 0 }: Props) {
  const groupRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const shockRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y += delta * 0.15;
    groupRef.current.rotation.x += delta * 0.05;

    if (coreRef.current) {
      const base = 1 + Math.sin(performance.now() * 0.002) * 0.05;
      const scale = base + volume * 0.01;
      coreRef.current.scale.set(scale, scale, scale);
    }

    if (shockRef.current) {
      const mat = shockRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = Math.min(1, volume * 0.02);
      const s = 1 + volume * 0.005;
      shockRef.current.scale.set(s, s, s);
    }
  });

  const color = COLORS[state];

  return (
    <group ref={groupRef}>
      <mesh ref={coreRef}>
        <icosahedronGeometry args={[1.3, 4]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={3} />
      </mesh>

      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[2.4, 0.03, 16, 120]} />
        <meshStandardMaterial color="#00eaff" emissive="#00eaff" emissiveIntensity={2} />
      </mesh>
      <mesh rotation={[0, Math.PI / 2, 0]}>
        <torusGeometry args={[2.8, 0.02, 16, 120]} />
        <meshStandardMaterial color="#00eaff" emissive="#00eaff" emissiveIntensity={1.5} />
      </mesh>
      <mesh rotation={[Math.PI / 4, Math.PI / 4, 0]}>
        <torusGeometry args={[3.2, 0.015, 16, 120]} />
        <meshStandardMaterial color="#00eaff" emissive="#00eaff" emissiveIntensity={1.2} />
      </mesh>

      <mesh ref={shockRef}>
        <torusGeometry args={[4, 0.05, 16, 200]} />
        <meshBasicMaterial color="#00eaff" transparent opacity={0} />
      </mesh>
    </group>
  );
}