// ==========================================
// audio.ts
// MAHA Audio Utilities
// ==========================================

export interface AudioConfig {

  fftSize: number;

  smoothingTimeConstant: number;

  minDecibels: number;

  maxDecibels: number;

}

export const AUDIO_CONFIG: AudioConfig = {

  fftSize: 512,

  smoothingTimeConstant: 0.8,

  minDecibels: -90,

  maxDecibels: -10,

};

export function calculateVolume(
  data: Uint8Array
): number {

  let sum = 0;

  for (
    let i = 0;
    i < data.length;
    i++
  ) {

    sum += data[i];

  }

  return (
    sum / data.length
  );

}

export function normalizeVolume(
  volume: number
): number {

  return Math.min(
    Math.max(
      volume / 255,
      0
    ),
    1
  );

}

export function isSpeaking(
  volume: number,
  threshold = 25
): boolean {

  return volume >
    threshold;

}

export function createAnalyser(
  context: AudioContext
): AnalyserNode {

  const analyser =
    context.createAnalyser();

  analyser.fftSize =
    AUDIO_CONFIG.fftSize;

  analyser.smoothingTimeConstant =
    AUDIO_CONFIG.smoothingTimeConstant;

  analyser.minDecibels =
    AUDIO_CONFIG.minDecibels;

  analyser.maxDecibels =
    AUDIO_CONFIG.maxDecibels;

  return analyser;

}