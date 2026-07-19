import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, Sparkles } from "@react-three/drei";
import Reactor3D from "./Reactor3D";

interface Props {
  state: "idle" | "listening" | "thinking" | "speaking";
  volume?: number;
}

export default function ReactorScene({ state, volume }: Props) {
  return (
    <Canvas camera={{ position: [0, 0, 9], fov: 45 }} dpr={[1, 2]}>
      <ambientLight intensity={0.4} />
      <pointLight position={[0, 0, 4]} intensity={12} />
      <pointLight position={[0, 0, -4]} intensity={4} />
      <Sparkles count={200} scale={12} speed={0.3} />
      <Reactor3D state={state} volume={volume} />
      <Environment preset="city" />
      <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.4} />
    </Canvas>
  );
}