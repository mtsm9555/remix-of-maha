// src/backend/voice/VoiceRuntime.ts
import { SpeechToText } from "./SpeechToText";
import { TextToSpeech } from "./TextToSpeech";
import { WakeWordDetector } from "./WakeWordDetector";
import { AudioProcessor } from "./AudioProcessor";
import { 
  VoiceSession, 
  VoiceMessage, 
  VoiceConfig, 
  SpeechToTextRequest, 
  TextToSpeechRequest,
  VoiceLanguage 
} from "./types";

export class VoiceRuntime {
  private static sessions: Map<string, VoiceSession> = new Map();
  private static defaultVoice: VoiceConfig = {
    provider: 'openai-tts',
    language: 'en-US',
    gender: 'female',
    voiceId: 'nova',
    speed: 1.0
  };

  /**
   * Create a new voice session
   */
  static createSession(userId: string, config?: Partial<VoiceConfig>): VoiceSession {
    const session: VoiceSession = {
      id: crypto.randomUUID(),
      userId,
      startedAt: new Date(),
      lastActiveAt: new Date(),
      isActive: true,
      wakeWordEnabled: true,
      conversationHistory: []
    };

    this.sessions.set(session.id, session);
    console.log(`[VoiceRuntime] Created session ${session.id} for user ${userId}`);
    
    return session;
  }

  /**
   * Process voice input (full pipeline)
   */
  static async processVoiceInput(
    sessionId: string,
    audioBuffer: Buffer | ArrayBuffer,
    options: {
      language?: VoiceLanguage;
      skipWakeWord?: boolean;
      synthesizeResponse?: boolean;
    } = {}
  ): Promise<{
    transcript: string;
    response: string;
    audioResponse?: Buffer;
    wakeWordDetected: boolean;
  }> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Voice session ${sessionId} not found`);
    }

    session.lastActiveAt = new Date();
    console.log(`[VoiceRuntime] Processing voice input for session ${sessionId}`);

    // Step 1: Transcribe audio
    const sttRequest: SpeechToTextRequest = {
      audioBuffer: audioBuffer instanceof Buffer ? audioBuffer : Buffer.from(new Uint8Array(audioBuffer)),
      format: 'wav',
      language: options.language || 'en-US',
      timestamps: true
    };

    const transcription = await SpeechToText.transcribe(sttRequest);
    console.log(`[VoiceRuntime] Transcribed: "${transcription.text}"`);

    // Step 2: Check for wake word (if enabled)
    let wakeWordDetected = false;
    let commandText = transcription.text;

    if (session.wakeWordEnabled && !options.skipWakeWord) {
      const wakeWordResult = WakeWordDetector.detect(transcription.text);
      wakeWordDetected = wakeWordResult.detected;

      if (!wakeWordDetected) {
        console.log('[VoiceRuntime] Wake word not detected, ignoring input');
        return {
          transcript: transcription.text,
          response: '',
          wakeWordDetected: false
        };
      }

      // Extract command after wake word
      const extracted = WakeWordDetector.extractCommand(transcription.text);
      if (extracted && extracted.command) {
        commandText = extracted.command;
      }
    }

    // Add user message to history
    const userMessage: VoiceMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      text: commandText,
      duration: transcription.duration,
      timestamp: new Date()
    };
    session.conversationHistory.push(userMessage);

    // Step 3: Process with Planner Agent (placeholder — wire to your orchestrator)
    const response = `Received: ${commandText}`;

    // Add assistant message to history
    const assistantMessage: VoiceMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      text: response,
      timestamp: new Date()
    };
    session.conversationHistory.push(assistantMessage);

    // Step 4: Synthesize response (optional)
    let audioResponse: Buffer | undefined;
    if (options.synthesizeResponse !== false) {
      const ttsRequest: TextToSpeechRequest = {
        text: response,
        voice: this.defaultVoice,
        format: 'mp3'
      };

      const ttsResult = await TextToSpeech.synthesize(ttsRequest);
      audioResponse = ttsResult.audioBuffer;
      assistantMessage.audioUrl = `data:audio/mp3;base64,${audioResponse.toString('base64')}`;
    }

    return {
      transcript: transcription.text,
      response,
      audioResponse,
      wakeWordDetected
    };
  }

  /**
   * Convert text to speech
   */
  static async speak(text: string, voice?: VoiceConfig): Promise<Buffer> {
    const result = await TextToSpeech.synthesize({
      text,
      voice: voice || this.defaultVoice,
      format: 'mp3'
    });
    return result.audioBuffer;
  }

  /**
   * Get session info
   */
  static getSession(sessionId: string): VoiceSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * End a voice session
   */
  static endSession(sessionId: string) {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.isActive = false;
      console.log(`[VoiceRuntime] Ended session ${sessionId}`);
    }
  }

  /**
   * Set default voice configuration
   */
  static setDefaultVoice(config: VoiceConfig) {
    this.defaultVoice = config;
    console.log(`[VoiceRuntime] Default voice set to: ${config.provider}/${config.voiceId}`);
  }

  /**
   * Get available voices
   */
  static getAvailableVoices() {
    return {
      stt: ['whisper', 'web-speech'],
      tts: TextToSpeech.getAvailableVoices()
    };
  }

  /**
   * Clean up old sessions (call periodically)
   */
  static cleanupOldSessions(maxAgeMs: number = 3600000) { // 1 hour default
    const now = Date.now();
    for (const [id, session] of this.sessions.entries()) {
      if (now - session.lastActiveAt.getTime() > maxAgeMs) {
        this.sessions.delete(id);
        console.log(`[VoiceRuntime] Cleaned up old session ${id}`);
      }
    }
  }
}

// Cleanup old sessions every 10 minutes
setInterval(() => VoiceRuntime.cleanupOldSessions(), 600000);