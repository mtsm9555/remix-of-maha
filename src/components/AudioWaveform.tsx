import { useEffect, useRef, useState } from "react";

interface AudioWaveformProps {
  active?: boolean;
}

export default function AudioWaveform({ active = true }: AudioWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const [permissionError, setPermissionError] = useState(false);

  useEffect(() => {
    if (!active) return;

    let audioContext: AudioContext | undefined;
    let stream: MediaStream | undefined;

    const renderWave = () => {
      const canvas = canvasRef.current;
      const analyser = analyserRef.current;
      if (!canvas || !analyser) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const draw = () => {
        animationRef.current = requestAnimationFrame(draw);
        analyser.getByteTimeDomainData(dataArray as unknown as Uint8Array<ArrayBuffer>);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.shadowBlur = 20;
        ctx.shadowColor = "#00eaff";
        ctx.lineWidth = 3;
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
        gradient.addColorStop(0, "#00d9ff");
        gradient.addColorStop(0.5, "#00ffff");
        gradient.addColorStop(1, "#00d9ff");
        ctx.strokeStyle = gradient;
        ctx.beginPath();
        const sliceWidth = canvas.width / bufferLength;
        let x = 0;
        for (let i = 0; i < bufferLength; i++) {
          const v = dataArray[i] / 128.0;
          const y = (v * canvas.height) / 2;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
          x += sliceWidth;
        }
        ctx.stroke();
        ctx.beginPath();
        ctx.strokeStyle = "rgba(0,234,255,.15)";
        ctx.lineWidth = 1;
        ctx.moveTo(0, canvas.height / 2);
        ctx.lineTo(canvas.width, canvas.height / 2);
        ctx.stroke();
      };
      draw();
    };

    const initialize = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioContext = new AudioContext();
        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048;
        source.connect(analyser);
        analyserRef.current = analyser;
        renderWave();
      } catch (error) {
        console.error(error);
        setPermissionError(true);
      }
    };

    initialize();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (stream) stream.getTracks().forEach((t) => t.stop());
      if (audioContext) audioContext.close();
    };
  }, [active]);

  if (permissionError) {
    return <div className="wave-error">Microphone Access Required</div>;
  }

  return (
    <div className="waveform-wrapper">
      <canvas ref={canvasRef} width={800} height={120} className="waveform-canvas" />
    </div>
  );
}