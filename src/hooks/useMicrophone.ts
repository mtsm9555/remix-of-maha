import {
  useEffect,
  useRef,
  useState,
} from "react";

export type AIState =
  | "idle"
  | "listening"
  | "thinking"
  | "speaking";

export interface MicrophoneData {

  volume: number;

  state: AIState;

  frequencyData:
    Uint8Array | null;

  analyser:
    AnalyserNode | null;

}

export function useMicrophone() {

  const [volume,
    setVolume] =
    useState(0);

  const [state,
    setState] =
    useState<AIState>(
      "idle"
    );

  const [frequencyData,
    setFrequencyData] =
    useState<
      Uint8Array | null
    >(null);

  const analyserRef =
    useRef<
      AnalyserNode | null
    >(null);

  const audioContextRef =
    useRef<
      AudioContext | null
    >(null);

  const streamRef =
    useRef<
      MediaStream | null
    >(null);

  useEffect(() => {

    let frameId = 0;

    const initialize =
      async () => {

      try {

        const stream =
          await navigator
            .mediaDevices
            .getUserMedia({
              audio: true,
            });

        streamRef.current =
          stream;

        const context =
          new AudioContext();

        audioContextRef.current =
          context;

        const source =
          context
            .createMediaStreamSource(
              stream
            );

        const analyser =
          context
            .createAnalyser();

        analyser.fftSize =
          512;

        analyser.smoothingTimeConstant =
          0.8;

        source.connect(
          analyser
        );

        analyserRef.current =
          analyser;

        const bufferLength =
          analyser
            .frequencyBinCount;

        const dataArray =
          new Uint8Array(
            bufferLength
          );

        const update = () => {

          analyser
            .getByteFrequencyData(
              dataArray
            );

          let sum = 0;

          for (
            let i = 0;
            i <
            dataArray.length;
            i++
          ) {

            sum +=
              dataArray[i];

          }

          const average =
            sum /
            dataArray.length;

          setVolume(
            average
          );

          setFrequencyData(
            new Uint8Array(
              dataArray
            )
          );

          // Voice Activity Detection

          if (
            average > 25
          ) {

            setState(
              "listening"
            );

          } else {

            setState(
              "idle"
            );

          }

          frameId =
            requestAnimationFrame(
              update
            );

        };

        update();

      } catch (error) {

        console.error(
          "Microphone Error:",
          error
        );

      }

    };

    initialize();

    return () => {

      cancelAnimationFrame(
        frameId
      );

      streamRef.current
        ?.getTracks()
        .forEach(
          (track) =>
            track.stop()
        );

      audioContextRef.current
        ?.close();

    };

  }, []);

  return {

    volume,

    state,

    frequencyData,

    analyser:
      analyserRef.current,

  };

}