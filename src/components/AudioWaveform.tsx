// src/components/AudioWaveform.tsx

import {
  useEffect,
  useRef,
} from "react";

interface AudioWaveformProps {
  isActive?: boolean;
}

export default function AudioWaveform({
  isActive = true,
}: AudioWaveformProps) {

  const canvasRef =
    useRef<HTMLCanvasElement>(null);

  const analyserRef =
    useRef<AnalyserNode | null>(null);

  const dataArrayRef =
    useRef<Uint8Array | null>(null);

  const animationRef =
    useRef<number>();

  useEffect(() => {

    let audioContext:
      AudioContext;

    let microphone:
      MediaStreamAudioSourceNode;

    const setupAudio =
      async () => {

        try {

          const stream =
            await navigator
              .mediaDevices
              .getUserMedia({
                audio: true,
              });

          audioContext =
            new AudioContext();

          analyserRef.current =
            audioContext.createAnalyser();

          analyserRef.current.fftSize =
            256;

          microphone =
            audioContext
              .createMediaStreamSource(
                stream
              );

          microphone.connect(
            analyserRef.current
          );

          const bufferLength =
            analyserRef.current
              .frequencyBinCount;

          dataArrayRef.current =
            new Uint8Array(
              bufferLength
            );

          draw();

        } catch (error) {

          console.error(
            "Microphone Error",
            error
          );

          startDemoMode();

        }

      };

    setupAudio();

    return () => {

      if (animationRef.current) {

        cancelAnimationFrame(
          animationRef.current
        );

      }

    };

  }, []);

  const startDemoMode =
    () => {

      const canvas =
        canvasRef.current;

      if (!canvas) return;

      const ctx =
        canvas.getContext("2d");

      if (!ctx) return;

      const render = () => {

        animationRef.current =
          requestAnimationFrame(
            render
          );

        const width =
          canvas.width;

        const height =
          canvas.height;

        ctx.clearRect(
          0,
          0,
          width,
          height
        );

        drawGrid(
          ctx,
          width,
          height
        );

        const center =
          height / 2;

        ctx.beginPath();

        ctx.strokeStyle =
          "#00eaff";

        ctx.lineWidth = 3;

        for (
          let i = 0;
          i < width;
          i += 8
        ) {

          const wave =
            Math.sin(
              (Date.now() * 0.004) +
              i * 0.05
            ) * 18;

          const y =
            center + wave;

          if (i === 0) {

            ctx.moveTo(
              i,
              y
            );

          } else {

            ctx.lineTo(
              i,
              y
            );

          }

        }

        ctx.stroke();

      };

      render();

    };

  const draw = () => {

    const canvas =
      canvasRef.current;

    const analyser =
      analyserRef.current;

    const dataArray =
      dataArrayRef.current;

    if (
      !canvas ||
      !analyser ||
      !dataArray
    )
      return;

    const ctx =
      canvas.getContext("2d");

    if (!ctx) return;

    const render = () => {

      animationRef.current =
        requestAnimationFrame(
          render
        );

      analyser.getByteFrequencyData(
        dataArray
      );

      const width =
        canvas.width;

      const height =
        canvas.height;

      ctx.clearRect(
        0,
        0,
        width,
        height
      );

      drawGrid(
        ctx,
        width,
        height
      );

      const center =
        height / 2;

      const sliceWidth =
        width /
        dataArray.length;

      ctx.beginPath();

      ctx.lineWidth = 4;

      ctx.strokeStyle =
        "#00eaff";

      for (
        let i = 0;
        i < dataArray.length;
        i++
      ) {

        const x =
          i * sliceWidth;

        const value =
          dataArray[i] / 255;

        const y =
          center +
          (value * 120 - 60);

        if (i === 0) {

          ctx.moveTo(
            x,
            y
          );

        } else {

          ctx.lineTo(
            x,
            y
          );

        }

      }

      ctx.shadowBlur = 25;

      ctx.shadowColor =
        "#00eaff";

      ctx.stroke();

      drawBars(
        ctx,
        dataArray,
        width,
        height
      );

    };

    render();

  };

  const drawBars = (

    ctx: CanvasRenderingContext2D,

    dataArray: Uint8Array,

    width: number,

    height: number

  ) => {

    const center =
      height / 2;

    const barWidth =
      width /
      dataArray.length;

    for (
      let i = 0;
      i < dataArray.length;
      i += 2
    ) {

      const value =
        dataArray[i] / 255;

      const barHeight =
        value * 50;

      ctx.fillStyle =
        "rgba(0,234,255,.6)";

      ctx.fillRect(

        i * barWidth,

        center -
          barHeight / 2,

        2,

        barHeight

      );

    }

  };

  const drawGrid = (

    ctx: CanvasRenderingContext2D,

    width: number,

    height: number

  ) => {

    ctx.strokeStyle =
      "rgba(0,234,255,.05)";

    ctx.lineWidth = 1;

    for (
      let x = 0;
      x < width;
      x += 40
    ) {

      ctx.beginPath();

      ctx.moveTo(x, 0);

      ctx.lineTo(x, height);

      ctx.stroke();

    }

  };

  return (

    <div
      className="
      relative
      w-full
      flex
      justify-center
      items-center
      pointer-events-none
    "
    >

      <canvas
        ref={canvasRef}
        width={700}
        height={140}
        className="
          w-[700px]
          h-[140px]
          opacity-90
        "
      />

      <div
        className="
        absolute
        inset-0
        bg-cyan-400/5
        blur-3xl
      "
      />

    </div>

  );

}