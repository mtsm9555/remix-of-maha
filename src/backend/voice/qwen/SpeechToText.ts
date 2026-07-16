// src/backend/voice/SpeechToText.ts
import OpenAI from "openai";
import { SpeechToTextRequest, SpeechToTextResult, VoiceProvider } from "./types";
import { AudioProcessor } from "./AudioProcessor";

export class SpeechToText {
  private static openai: OpenAI | null = null;
  private static defaultProvider: VoiceProvider = (process.env.STT_PROVIDER as VoiceProvider) || 'whisper';

  static initialize() {
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }
  }

  /**
   * Transcribe audio to text
   */
  static async transcribe(request: SpeechToTextRequest): Promise<SpeechToTextResult> {
    const provider = this.getProvider(request.model);
    const startTime = Date.now();
    
    console.log(`[STT] Transcribing audio using ${provider}...`);

    try {
      let result: SpeechToTextResult;

      switch (provider) {
        case 'whisper':
          result = await this.transcribeWithWhisper(request);
          break;
        case 'web-speech':
          // Web Speech API is browser-only, handled on frontend
          throw new Error('Web Speech API must be used on the client side');
        default:
          result = await this.transcribeWithWhisper(request);
      }

      const duration = (Date.now() - startTime) / 1000;
      console.log(`[STT] Transcription complete in ${duration.toFixed(2)}s`);
      
      return result;
    } catch (error: any) {
      console.error('[STT] Transcription failed:', error);
      throw error;
    }
  }

  /**
   * Transcribe using OpenAI Whisper API
   */
  private static async transcribeWithWhisper(request: SpeechToTextRequest): Promise<SpeechToTextResult> {
    if (!this.openai) {
      throw new Error('OpenAI not initialized. Set OPENAI_API_KEY environment variable.');
    }

    // Convert to WAV if needed (Whisper prefers WAV/MP3/M4A)
    let audioBuffer = request.audioBuffer instanceof Buffer 
      ? request.audioBuffer 
      : Buffer.from(request.audioBuffer);

    if (request.format !== 'wav' && request.format !== 'mp3') {
      audioBuffer = await AudioProcessor.convertFormat(audioBuffer, request.format, 'wav');
    }

    // Create a File-like object for OpenAI API
    const file = new File([audioBuffer], 'audio.wav', { type: 'audio/wav' });

    const response = await this.openai.audio.transcriptions.create({
      model: request.model || 'whisper-1',
      file: file as any,
      language: request.language?.split('-')[0] || 'en',
      response_format: 'verbose_json',
      timestamp_granularities: request.timestamps ? ['segment'] : undefined
    });

    // Parse response
    const text = response.text;
    const segments = (response as any).segments?.map((seg: any) => ({
      text: seg.text,
      start: seg.start,
      end: seg.end,
      confidence: seg.avg_logprob ? Math.exp(seg.avg_logprob) : 0.9
    }));

    return {
      text: text.trim(),
      confidence: segments ? segments.reduce((sum: number, s: any) => sum + s.confidence, 0) / segments.length : 0.95,
      language: (request.language || 'en-US') as any,
      duration: (response as any).duration || 0,
      segments
    };
  }

  /**
   * Stream transcription (for real-time)
   */
  static async *transcribeStream(
    audioStream: AsyncIterable<Buffer>,
    language?: string
  ): AsyncGenerator<{ text: string; isFinal: boolean; confidence: number }> {
    // Placeholder: In production, use Deepgram, AssemblyAI, or Whisper streaming
    let buffer = '';
    
    for await (const chunk of audioStream) {
      // Simulate streaming transcription
      const text = `[Streaming audio chunk: ${chunk.length} bytes]`;
      yield {
        text,
        isFinal: false,
        confidence: 0.85
      };
    }
    
    yield {
      text: '[Final transcription]',
      isFinal: true,
      confidence: 0.95
    };
  }

  private static getProvider(model?: string): VoiceProvider {
    if (model?.includes('whisper')) return 'whisper';
    if (model?.includes('web-speech')) return 'web-speech';
    return this.defaultProvider;
  }
}

// Auto-initialize
SpeechToText.initialize();