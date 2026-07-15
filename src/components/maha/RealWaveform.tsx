import { useEffect, useRef, useState } from "react";

type Mode = "linear" | "circular";

interface Props {
  mode?: Mode;
  height?: number;
  onStatusChange?: (status: "idle" | "speaking") => void;
}

export default function RealWaveform({ mode = "linear", height = 180, onStatusChange }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "speaking">("idle");

  useEffect(() => {
    let audioContext: AudioContext | undefined;
    let animationFrame = 0;
    let stream: MediaStream | undefined;
    let cancelled = false;

    async function start() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (cancelled) return;
        audioContext = new AudioContext();
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048;
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let lastStatus: "idle" | "speaking" = "idle";

        const draw = () => {
          animationFrame = requestAnimationFrame(draw);
          analyser.getByteTimeDomainData(dataArray);

          // volume detection
          let sum = 0;
          for (let i = 0; i < bufferLength; i++) {
            sum += Math.abs(dataArray[i] - 128);
          }
          const volume = sum / bufferLength;
          const nextStatus: "idle" | "speaking" = volume > 6 ? "speaking" : "idle";
          if (nextStatus !== lastStatus) {
            lastStatus = nextStatus;
            setStatus(nextStatus);
            onStatusChange?.(nextStatus);
          }

          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.lineWidth = 2;
          ctx.strokeStyle = "#4FD8FF";
          ctx.shadowBlur = 20;
          ctx.shadowColor = "#4FD8FF";
          ctx.beginPath();

          if (mode === "linear") {
            const sliceWidth = canvas.width / bufferLength;
            let x = 0;
            for (let i = 0; i < bufferLength; i++) {
              const v = dataArray[i] / 128.0;
              const y = (v * canvas.height) / 2;
              if (i === 0) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
              x += sliceWidth;
            }
            ctx.lineTo(canvas.width, canvas.height / 2);
          } else {
            const cx = canvas.width / 2;
            const cy = canvas.height / 2;
            const baseRadius = Math.min(cx, cy) * 0.55;
            for (let i = 0; i < bufferLength; i++) {
              const angle = (i / bufferLength) * Math.PI * 2;
              const amplitude = (dataArray[i] - 128) / 128;
              const radius = baseRadius + amplitude * 40;
              const x = cx + Math.cos(angle) * radius;
              const y = cy + Math.sin(angle) * radius;
              if (i === 0) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
            }
            ctx.closePath();
          }
          ctx.stroke();
        };
        draw();
      } catch (e) {
        setError((e as Error).message || "Microphone unavailable");
      }
    }

    start();

    return () => {
      cancelled = true;
      cancelAnimationFrame(animationFrame);
      stream?.getTracks().forEach((t) => t.stop());
      audioContext?.close();
    };
  }, [mode, onStatusChange]);

  return (
    <div className="bg-[#0B1118] border border-[#152533] rounded-xl p-4 relative">
      <div className="flex justify-between items-center mb-2">
        <div className="text-cyan-300 text-xs tracking-widest">WAVEFORM</div>
        <div className="text-[10px] text-cyan-400 uppercase">
          {error ? "MIC OFFLINE" : status}
        </div>
      </div>
      <canvas
        ref={canvasRef}
        width={800}
        height={height}
        className="w-full"
        style={{ height }}
      />
    </div>
  );
}
