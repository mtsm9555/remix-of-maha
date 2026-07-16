// src/backend/voice/TextToSpeech.ts
import OpenAI from "openai";
import { TextToSpeechRequest, TextToSpeechResult, VoiceConfig, VoiceProvider } from "./types";

export class TextToSpeech {
  private static openai: OpenAI | null = null;
  private static defaultProvider: VoiceProvider = (process.env.TTS_PROVIDER as VoiceProvider) || 'openai-tts';

  // Available voices for different providers
  private static VOICES = {
    'openai-tts': {
      male: ['onyx', 'echo'],
      female: ['nova', 'shimmer', 'alloy'],
      neutral: ['fable']
    },
    'elevenlabs': {
      // ElevenLabs voice IDs - configure in environment
      jarvis: 'pNInz6obpgDQGcFmaJgB', // Custom voice ID
      professional: '21m00Tcm4TlvDq8ikWAM',
      friendly: 'AZnzlk1XvdvUeBnXmlld'
    },
    'kokoro': {
      male: 'kokoro-en_male',
      female: 'kokoro-en_female'
    },
    'piper': {
      male: 'piper-en_US-male',
      female: 'piper-en_US-female'
    }
  };

  static initialize() {
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }
  }

  /**
   * Convert text to speech
   */
  static async synthesize(request: TextToSpeechRequest): Promise<TextToSpeechResult> {
    const provider = request.voice?.provider || this.defaultProvider;
    const startTime = Date.now();
    
    console.log(`[TTS] Synthesizing speech using ${provider}: "${request.text.substring(0, 50)}..."`);

    try {
      let result: TextToSpeechResult;

      switch (provider) {
        case 'openai-tts':
          result = await this.synthesizeWithOpenAI(request);
          break;
        case 'elevenlabs':
          result = await this.synthesizeWithElevenLabs(request);
          break;
        case 'kokoro':
          result = await this.synthesizeWithKokoro(request);
          break;
        case 'piper':
          result = await this.synthesizeWithPiper(request);
          break;
        case 'web-speech':
          throw new Error('Web Speech API must be used on the client side');
        default:
          result = await this.synthesizeWithOpenAI(request);
      }

      const duration = (Date.now() - startTime) / 1000;
      console.log(`[TTS] Synthesis complete in ${duration.toFixed(2)}s`);
      
      return result;
    } catch (error: any) {
      console.error('[TTS] Synthesis failed:', error);
      throw error;
    }
  }

  /**
   * Synthesize using OpenAI TTS
   */
  private static async synthesizeWithOpenAI(request: TextToSpeechRequest): Promise<TextToSpeechResult> {
    if (!this.openai) {
      throw new Error('OpenAI not initialized');
    }

    const voice = this.selectVoice('openai-tts', request.voice);
    const model = request.voice?.model || 'tts-1'; // or 'tts-1-hd' for higher quality

    const response = await this.openai.audio.speech.create({
      model,
      voice: voice as any,
      input: request.text,
      speed: request.speed || request.voice?.speed || 1.0,
      response_format: (request.format as any) || 'mp3'
    });

    const audioBuffer = Buffer.from(await response.arrayBuffer());
    
    return {
      audioBuffer,
      format: (request.format || 'mp3') as any,
      duration: this.estimateDuration(request.text, request.speed || 1.0),
      sampleRate: 24000,
      voiceUsed: voice
    };
  }

  /**
   * Synthesize using ElevenLabs
   */
  private static async synthesizeWithElevenLabs(request: TextToSpeechRequest): Promise<TextToSpeechResult> {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      console.warn('[TTS] ElevenLabs API key not set, falling back to OpenAI');
      return await this.synthesizeWithOpenAI(request);
    }

    const voiceId = request.voice?.voiceId || this.VOICES.elevenlabs.jarvis;

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': apiKey
        },
        body: JSON.stringify({
          text: request.text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: this.mapEmotionToStyle(request.emotion),
            use_speaker_boost: true
          }
        })
      }
    );

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.statusText}`);
    }

    const audioBuffer = Buffer.from(await response.arrayBuffer());
    
    return {
      audioBuffer,
      format: 'mp3',
      duration: this.estimateDuration(request.text, request.speed || 1.0),
      sampleRate: 44100,
      voiceUsed: voiceId
    };
  }

  /**
   * Synthesize using Kokoro (local model)
   */
  private static async synthesizeWithKokoro(request: TextToSpeechRequest): Promise<TextToSpeechResult> {
    const kokoroUrl = process.env.KOKORO_URL || 'http://localhost:8880';
    const voice = this.selectVoice('kokoro', request.voice);

    try {
      const response = await fetch(`${kokoroUrl}/api/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: request.text,
          voice,
          speed: request.speed || 1.0,
          format: request.format || 'wav'
        })
      });

      if (!response.ok) {
        throw new Error(`Kokoro API error: ${response.statusText}`);
      }

      const audioBuffer = Buffer.from(await response.arrayBuffer());
      
      return {
        audioBuffer,
        format: (request.format || 'wav') as any,
        duration: this.estimateDuration(request.text, request.speed || 1.0),
        sampleRate: 24000,
        voiceUsed: voice
      };
    } catch (error: any) {
      console.warn('[TTS] Kokoro unavailable, falling back to OpenAI:', error.message);
      return await this.synthesizeWithOpenAI(request);
    }
  }

  /**
   * Synthesize using Piper (local model)
   */
  private static async synthesizeWithPiper(request: TextToSpeechRequest): Promise<TextToSpeechResult> {
    const piperUrl = process.env.PIPER_URL || 'http://localhost:5000';
    const voice = this.selectVoice('piper', request.voice);

    try {
      const response = await fetch(`${piperUrl}/api/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: request.text,
          voice,
          speed: request.speed || 1.0
        })
      });

      if (!response.ok) {
        throw new Error(`Piper API error: ${response.statusText}`);
      }

      const audioBuffer = Buffer.from(await response.arrayBuffer());
      
      return {
        audioBuffer,
        format: 'wav',
        duration: this.estimateDuration(request.text, request.speed || 1.0),
        sampleRate: 22050,
        voiceUsed: voice
      };
    } catch (error: any) {
      console.warn('[TTS] Piper unavailable, falling back to OpenAI:', error.message);
      return await this.synthesizeWithOpenAI(request);
    }
  }

  /**
   * Stream TTS for real-time playback
   */
  static async *synthesizeStream(
    text: string,
    voice?: VoiceConfig
  ): AsyncGenerator<Buffer> {
    // Split text into sentences for streaming
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    
    for (const sentence of sentences) {
      const result = await this.synthesize({
        text: sentence.trim(),
        voice,
        format: 'mp3'
      });
      
      // Yield audio in chunks
      const chunks = result.audioBuffer.length > 10000 
        ? [result.audioBuffer.slice(0, 10000), result.audioBuffer.slice(10000)]
        : [result.audioBuffer];
      
      for (const chunk of chunks) {
        yield chunk;
      }
    }
  }

  private static selectVoice(provider: string, config?: VoiceConfig): string {
    const voices = (this.VOICES as any)[provider];
    if (!voices) return 'nova';
    
    const gender = config?.gender || 'female';
    if (config?.voiceId && voices[config.voiceId]) {
      return voices[config.voiceId];
    }
    
    const voiceList = voices[gender] || voices.female;
    return Array.isArray(voiceList) ? voiceList[0] : voiceList;
  }

  private static mapEmotionToStyle(emotion?: string): number {
    const styleMap: Record<string, number> = {
      'neutral': 0.0,
      'happy': 0.5,
      'excited': 0.8,
      'calm': 0.2,
      'serious': 0.3,
      'sad': 0.1
    };
    return styleMap[emotion || 'neutral'] || 0.0;
  }

  private static estimateDuration(text: string, speed: number = 1.0): number {
    // Rough estimate: ~150 words per minute, average 5 chars per word
    const words = text.split(/\s+/).length;
    const minutes = words / 150;
    return (minutes * 60) / speed;
  }

  /**
   * Get available voices
   */
  static getAvailableVoices(provider?: VoiceProvider): any {
    if (provider) {
      return (this.VOICES as any)[provider] || {};
    }
    return this.VOICES;
  }
}

// Auto-initialize
TextToSpeech.initialize();