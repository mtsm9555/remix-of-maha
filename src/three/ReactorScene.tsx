import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, Sparkles } from "@react-three/drei";
import { useMemo } from "react";
import Reactor3D from "./Reactor3D";
import type { AIState } from "@/services/stateMachine";

interface Props {
  state: AIState;
  volume?: number;
}

export default function ReactorScene({ state, volume }: Props) {
  const { isMobile, reduce } = useMemo(() => {
    if (typeof window === "undefined") return { isMobile: false, reduce: false };
    return {
      isMobile: window.innerWidth < 768,
      reduce: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    };
  }, []);

  return (
    <Canvas
      camera={{ position: [0, 0, 9], fov: 45 }}
      dpr={isMobile ? [1, 1.5] : [1, 2]}
      // "demand" frameloop cuts GPU work when nothing is animating; autoRotate
      // triggers invalidation via OrbitControls so the scene still spins.
      frameloop={reduce ? "demand" : "always"}
      performance={{ min: 0.5 }}
      gl={{ antialias: !isMobile, powerPreference: "high-performance" }}
    >
      <ambientLight intensity={0.4} />
      <pointLight position={[0, 0, 4]} intensity={12} />
      <pointLight position={[0, 0, -4]} intensity={4} />
      {!reduce && <Sparkles count={isMobile ? 60 : 150} scale={12} speed={0.3} />}
      <Reactor3D state={state} volume={volume} />
      <Environment preset="city" />
      <OrbitControls enableZoom={false} autoRotate={!reduce} autoRotateSpeed={0.4} />
    </Canvas>
  );
}