import { WakeWordService } from "./wakeword/WakeWordService";
import { WhisperService } from "./stt/WhisperService";
import { KokoroService } from "./tts/KokoroService";

export interface VoiceOrchestrator {
  handle(input: { type: "voice"; text: string; userId: string }): Promise<{ text: string }>;
}

export class VoiceRuntime {
  private wakeword = new WakeWordService();
  private whisper = new WhisperService();
  private tts = new KokoroService();

  constructor(private orchestrator: VoiceOrchestrator) {}

  async process(userId: string, audio: Uint8Array, hintText?: string) {
    const activated = await this.wakeword.detect(hintText ?? audio);
    if (!activated) return { activated: false as const };

    const transcript = await this.whisper.transcribe(audio);
    const response = await this.orchestrator.handle({
      type: "voice",
      text: transcript.text,
      userId,
    });
    const speech = await this.tts.synthesize(response.text);

    return {
      activated: true as const,
      transcript: transcript.text,
      response: response.text,
      speech,
    };
  }
}