// src/backend/voice/types.ts

export type VoiceProvider = 'web-speech' | 'whisper' | 'kokoro' | 'piper' | 'elevenlabs' | 'openai-tts';
export type AudioFormat = 'wav' | 'webm' | 'mp3' | 'pcm' | 'ogg';
export type VoiceGender = 'male' | 'female' | 'neutral';
export type VoiceLanguage = 'en-US' | 'en-GB' | 'es-ES' | 'fr-FR' | 'de-DE' | 'hi-IN' | 'ja-JP' | 'zh-CN';

export interface VoiceConfig {
  provider: VoiceProvider;
  language: VoiceLanguage;
  gender?: VoiceGender;
  voiceId?: string; // Specific voice identifier
  speed?: number; // 0.5 to 2.0
  pitch?: number; // 0.5 to 2.0
  model?: string; // Model name (e.g., 'whisper-1', 'kokoro-v1')
}

export interface SpeechToTextRequest {
  audioBuffer: Buffer | ArrayBuffer;
  format: AudioFormat;
  language?: VoiceLanguage;
  model?: string;
  diarize?: boolean; // Speaker identification
  timestamps?: boolean;
}

export interface SpeechToTextResult {
  text: string;
  confidence: number; // 0.0 to 1.0
  language: VoiceLanguage;
  duration: number; // seconds
  segments?: TranscriptionSegment[];
  speaker?: string;
}

export interface TranscriptionSegment {
  text: string;
  start: number; // seconds
  end: number; // seconds
  confidence: number;
  speaker?: string;
}

export interface TextToSpeechRequest {
  text: string;
  voice?: VoiceConfig;
  format?: AudioFormat;
  speed?: number;
  emotion?: 'neutral' | 'happy' | 'sad' | 'excited' | 'calm' | 'serious';
}

export interface TextToSpeechResult {
  audioBuffer: Buffer;
  format: AudioFormat;
  duration: number; // seconds
  sampleRate: number;
  voiceUsed: string;
}

export interface WakeWordEvent {
  detected: boolean;
  confidence: number;
  timestamp: Date;
  audioLevel?: number;
}

export interface VoiceSession {
  id: string;
  userId: string;
  startedAt: Date;
  lastActiveAt: Date;
  isActive: boolean;
  wakeWordEnabled: boolean;
  currentTranscript?: string;
  conversationHistory: VoiceMessage[];
}

export interface VoiceMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  audioUrl?: string;
  duration?: number;
  timestamp: Date;
}

export interface VoiceStreamEvent {
  type: 'audio_chunk' | 'transcript' | 'wake_word' | 'error' | 'end';
  data: any;
  timestamp: Date;
}