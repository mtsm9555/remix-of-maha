// Single-source microphone bus. One getUserMedia, one AudioContext, one AnalyserNode.
// Subscribers get frequency snapshots at RAF cadence. Ref-counted teardown.

export interface AudioSnapshot {
  volume: number;         // 0..255 average
  frequency: Uint8Array;  // shared buffer (read-only view; do not mutate)
}

type Listener = (snap: AudioSnapshot) => void;

class AudioBus {
  private stream: MediaStream | null = null;
  private context: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private buffer: Uint8Array = new Uint8Array(0);
  private listeners = new Set<Listener>();
  private rafId = 0;
  private starting: Promise<void> | null = null;
  private volume = 0;

  async subscribe(cb: Listener): Promise<() => void> {
    this.listeners.add(cb);
    if (!this.context) await this.start();
    // Emit an initial snapshot so new subscribers get data quickly.
    if (this.buffer.length) cb({ volume: this.volume, frequency: this.buffer });
    return () => this.unsubscribe(cb);
  }

  getStream(): MediaStream | null {
    return this.stream;
  }

  private unsubscribe(cb: Listener) {
    this.listeners.delete(cb);
    if (this.listeners.size === 0) this.stop();
  }

  private async start() {
    if (this.starting) return this.starting;
    this.starting = (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        this.stream = stream;
        const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const context = new Ctx();
        this.context = context;
        const source = context.createMediaStreamSource(stream);
        const analyser = context.createAnalyser();
        analyser.fftSize = 512;
        analyser.smoothingTimeConstant = 0.8;
        source.connect(analyser);
        this.analyser = analyser;
        this.buffer = new Uint8Array(analyser.frequencyBinCount);
        this.loop();
      } catch (err) {
        console.error("[audioBus] mic init failed", err);
      } finally {
        this.starting = null;
      }
    })();
    return this.starting;
  }

  private loop = () => {
    if (!this.analyser) return;
    this.analyser.getByteFrequencyData(this.buffer);
    let sum = 0;
    for (let i = 0; i < this.buffer.length; i++) sum += this.buffer[i];
    this.volume = sum / this.buffer.length;
    const snap: AudioSnapshot = { volume: this.volume, frequency: this.buffer };
    this.listeners.forEach((fn) => fn(snap));
    this.rafId = requestAnimationFrame(this.loop);
  };

  private stop() {
    cancelAnimationFrame(this.rafId);
    this.rafId = 0;
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    this.context?.close().catch(() => {});
    this.context = null;
    this.analyser = null;
    this.buffer = new Uint8Array(0);
    this.volume = 0;
  }
}

export const audioBus = new AudioBus();
