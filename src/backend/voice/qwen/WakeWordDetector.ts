// src/backend/voice/WakeWordDetector.ts
import { WakeWordEvent } from "./types";

export class WakeWordDetector {
  private static wakeWords = ['hey maha', 'maha', 'ok maha', 'jarvis'];
  private static sensitivity = 0.7; // 0.0 to 1.0

  /**
   * Detect wake word in transcribed text
   */
  static detect(text: string): WakeWordEvent {
    const lowerText = text.toLowerCase().trim();
    
    for (const wakeWord of this.wakeWords) {
      if (lowerText.includes(wakeWord)) {
        // Calculate confidence based on how clearly the wake word was detected
        const confidence = this.calculateConfidence(lowerText, wakeWord);
        
        if (confidence >= this.sensitivity) {
          console.log(`[WakeWord] Detected: "${wakeWord}" (confidence: ${confidence.toFixed(2)})`);
          
          // Extract the command after the wake word
          const commandIndex = lowerText.indexOf(wakeWord) + wakeWord.length;
          const command = text.substring(commandIndex).trim();
          
          return {
            detected: true,
            confidence,
            timestamp: new Date(),
            audioLevel: 0.8 // Placeholder
          };
        }
      }
    }

    return {
      detected: false,
      confidence: 0,
      timestamp: new Date()
    };
  }

  /**
   * Extract command from text after wake word
   */
  static extractCommand(text: string): { wakeWord: string; command: string } | null {
    const lowerText = text.toLowerCase();
    
    for (const wakeWord of this.wakeWords) {
      const index = lowerText.indexOf(wakeWord);
      if (index !== -1) {
        const command = text.substring(index + wakeWord.length).trim();
        return { wakeWord, command };
      }
    }
    
    return null;
  }

  /**
   * Set custom wake words
   */
  static setWakeWords(words: string[]) {
    this.wakeWords = words.map(w => w.toLowerCase());
    console.log(`[WakeWord] Custom wake words set: ${this.wakeWords.join(', ')}`);
  }

  /**
   * Set detection sensitivity
   */
  static setSensitivity(level: number) {
    this.sensitivity = Math.max(0, Math.min(1, level));
    console.log(`[WakeWord] Sensitivity set to: ${this.sensitivity}`);
  }

  /**
   * Add a custom wake word
   */
  static addWakeWord(word: string) {
    const lower = word.toLowerCase();
    if (!this.wakeWords.includes(lower)) {
      this.wakeWords.push(lower);
      console.log(`[WakeWord] Added wake word: ${lower}`);
    }
  }

  private static calculateConfidence(text: string, wakeWord: string): number {
    // Simple confidence calculation
    // In production, use a dedicated wake word model (Porcupine, Snowboy, etc.)
    
    let confidence = 0.9; // Base confidence
    
    // Reduce if wake word is not at the start
    if (!text.startsWith(wakeWord)) {
      confidence -= 0.2;
    }
    
    // Reduce if there's a lot of text after (might be false positive)
    const afterWakeWord = text.substring(text.indexOf(wakeWord) + wakeWord.length);
    if (afterWakeWord.length > 100) {
      confidence -= 0.1;
    }
    
    // Boost if exact match
    if (text === wakeWord || text.startsWith(wakeWord + ' ')) {
      confidence += 0.05;
    }
    
    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Browser-side wake word detection using Web Speech API
   * This runs continuously and listens for the wake word
   */
  static getBrowserWakeWordScript(): string {
    return `
// Browser-side wake word detection
class WakeWordListener {
  constructor(wakeWords = ['hey maha', 'maha']) {
    this.wakeWords = wakeWords;
    this.recognition = null;
    this.isListening = false;
    this.onWakeWord = null;
  }

  start() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.error('Speech recognition not supported');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';

    this.recognition.onresult = (event) => {
      const last = event.results.length - 1;
      const text = event.results[last][0].transcript.toLowerCase();
      
      for (const wakeWord of this.wakeWords) {
        if (text.includes(wakeWord)) {
          console.log('Wake word detected:', wakeWord);
          if (this.onWakeWord) {
            this.onWakeWord(wakeWord, text);
          }
          // Stop listening after wake word detected
          this.stop();
          break;
        }
      }
    };

    this.recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'no-speech' && this.isListening) {
        // Restart if no speech detected
        setTimeout(() => this.start(), 1000);
      }
    };

    this.recognition.onend = () => {
      if (this.isListening) {
        // Restart if still supposed to be listening
        setTimeout(() => this.start(), 500);
      }
    };

    this.isListening = true;
    this.recognition.start();
    console.log('Wake word listener started');
  }

  stop() {
    this.isListening = false;
    if (this.recognition) {
      this.recognition.stop();
    }
  }
}

window.wakeWordListener = new WakeWordListener();
`;
  }
}