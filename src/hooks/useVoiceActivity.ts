import {
  useEffect,
  useRef,
  useState
} from "react";

export interface VoiceActivity {

  isSpeaking: boolean;

  volume: number;

  speechStart: boolean;

  speechEnd: boolean;

}

export function useVoiceActivity() {

  const [
    isSpeaking,
    setIsSpeaking
  ] = useState(false);

  const [
    volume,
    setVolume
  ] = useState(0);

  const [
    speechStart,
    setSpeechStart
  ] = useState(false);

  const [
    speechEnd,
    setSpeechEnd
  ] = useState(false);

  const analyserRef =
    useRef<AnalyserNode | null>(
      null
    );

  const speakingRef =
    useRef(false);

  const silenceTimerRef =
    useRef<number>(0);

  useEffect(() => {

    let frameId = 0;
    let localStream: MediaStream | null = null;
    let localContext: AudioContext | null = null;

    const init = async () => {

      try {

        const stream =
          await navigator
            .mediaDevices
            .getUserMedia({
              audio: true
            });
        localStream = stream;

        const context =
          new AudioContext();
        localContext = context;

        const source =
          context
            .createMediaStreamSource(
              stream
            );

        const analyser =
          context
            .createAnalyser();

        analyser.fftSize =
          1024;

        analyser.smoothingTimeConstant =
          0.85;

        source.connect(
          analyser
        );

        analyserRef.current =
          analyser;

        const buffer =
          new Uint8Array(
            analyser.frequencyBinCount
          );

        const THRESHOLD = 18;

        const SILENCE_MS = 1200;

        const update = () => {

          analyser
            .getByteFrequencyData(
              buffer
            );

          let sum = 0;

          for (
            let i = 0;
            i < buffer.length;
            i++
          ) {

            sum += buffer[i];

          }

          const avg =
            sum /
            buffer.length;

          setVolume(avg);

          const now =
            performance.now();

          if (
            avg >
            THRESHOLD
          ) {

            silenceTimerRef.current =
              now;

            if (
              !speakingRef.current
            ) {

              speakingRef.current =
                true;

              setIsSpeaking(
                true
              );

              setSpeechStart(
                true
              );

              setSpeechEnd(
                false
              );

              setTimeout(
                () =>
                  setSpeechStart(
                    false
                  ),
                250
              );

            }

          } else {

            if (
              speakingRef.current &&
              now -
                silenceTimerRef.current >
                SILENCE_MS
            ) {

              speakingRef.current =
                false;

              setIsSpeaking(
                false
              );

              setSpeechEnd(
                true
              );

              setTimeout(
                () =>
                  setSpeechEnd(
                    false
                  ),
                250
              );

            }

          }

          frameId =
            requestAnimationFrame(
              update
            );

        };

        update();

      } catch (err) {

        console.error(
          "VAD Error",
          err
        );

      }

    };

    init();

    return () => {

      cancelAnimationFrame(
        frameId
      );
      localStream?.getTracks().forEach((t) => t.stop());
      localContext?.close().catch(() => {});

    };

  }, []);

  return {

    isSpeaking,

    volume,

    speechStart,

    speechEnd

  };

}