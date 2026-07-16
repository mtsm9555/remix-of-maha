// src/backend/vision/ImageUnderstandingService.ts
import { 
  ImageInput, 
  ImageUnderstandingResult, 
  VisionProvider,
  VisualQuestionAnsweringResult,
  ImageEmbedding
} from "./types";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";

export class ImageUnderstandingService {
  private static openai: OpenAI | null = null;
  private static anthropic: Anthropic | null = null;
  private static defaultProvider: VisionProvider = (process.env.VISION_PROVIDER as VisionProvider) || 'qwen2.5-vl';

  static initialize() {
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }
    if (process.env.ANTHROPIC_API_KEY) {
      this.anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    }
  }

  /**
   * Understand and describe image
   */
  static async understand(image: ImageInput, provider?: VisionProvider): Promise<ImageUnderstandingResult> {
    const selectedProvider = provider || this.defaultProvider;
    console.log(`[ImageUnderstanding] Analyzing image using ${selectedProvider}...`);

    switch (selectedProvider) {
      case 'qwen2.5-vl':
        return await this.understandWithQwen(image);
      case 'florence-2':
        return await this.understandWithFlorence(image);
      case 'gpt-4-vision':
        return await this.understandWithGPT4Vision(image);
      case 'claude-vision':
        return await this.understandWithClaude(image);
      default:
        return await this.understandWithQwen(image);
    }
  }

  /**
   * Understand using Qwen2.5-VL
   */
  private static async understandWithQwen(image: ImageInput): Promise<ImageUnderstandingResult> {
    const qwenUrl = process.env.QWEN_VL_URL || 'http://localhost:8000';

    try {
      const response = await fetch(`${qwenUrl}/understand`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: image.buffer.toString('base64'),
          tasks: ['caption', 'tags', 'objects', 'scene', 'colors']
        })
      });

      if (!response.ok) {
        throw new Error(`Qwen2.5-VL API error: ${response.statusText}`);
      }

      const data = await response.json();
      return this.parseQwenResponse(data);
    } catch (error: any) {
      console.warn('[ImageUnderstanding] Qwen2.5-VL unavailable, falling back to GPT-4V:', error.message);
      return await this.understandWithGPT4Vision(image);
    }
  }

  /**
   * Understand using Florence-2
   */
  private static async understandWithFlorence(image: ImageInput): Promise<ImageUnderstandingResult> {
    const florenceUrl = process.env.FLORENCE2_URL || 'http://localhost:8001';

    try {
      const response = await fetch(`${florenceUrl}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: image.buffer.toString('base64'),
          task: 'detailed_caption'
        })
      });

      if (!response.ok) {
        throw new Error(`Florence-2 API error: ${response.statusText}`);
      }

      const data = await response.json();
      return this.parseFlorenceResponse(data);
    } catch (error: any) {
      console.warn('[ImageUnderstanding] Florence-2 unavailable:', error.message);
      throw error;
    }
  }

  /**
   * Understand using GPT-4 Vision
   */
  private static async understandWithGPT4Vision(image: ImageInput): Promise<ImageUnderstandingResult> {
    if (!this.openai) {
      throw new Error('OpenAI not initialized');
    }

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Analyze this image comprehensively. Provide: 1) A detailed description, 2) Key objects present, 3) Scene/context, 4) Dominant colors, 5) Any text visible, 6) Overall mood/atmosphere'
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/${image.format};base64,${image.buffer.toString('base64')}`
              }
            }
          ]
        }
      ],
      max_tokens: 1000
    });

    const analysis = response.choices[0].message.content || '';
    
    return {
      description: analysis,
      caption: analysis.split('\n')[0] || 'Image analysis',
      tags: this.extractTags(analysis),
      categories: ['general'],
      objects: [],
      scene: 'unknown',
      colors: [],
      quality: { score: 0.9, sharpness: 0.9, brightness: 0.5, contrast: 0.7, isBlurry: false, isDark: false },
      entities: []
    };
  }

  /**
   * Understand using Claude Vision
   */
  private static async understandWithClaude(image: ImageInput): Promise<ImageUnderstandingResult> {
    if (!this.anthropic) {
      throw new Error('Anthropic not initialized');
    }

    const response = await this.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Describe this image in detail, including objects, scene, colors, and any text.'
            },
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: `image/${image.format}`,
                data: image.buffer.toString('base64')
              }
            }
          ]
        }
      ]
    });

    const analysis = response.content[0].type === 'text' ? response.content[0].text : '';

    return {
      description: analysis,
      caption: analysis.split('\n')[0] || 'Image analysis',
      tags: this.extractTags(analysis),
      categories: ['general'],
      objects: [],
      scene: 'unknown',
      colors: [],
      quality: { score: 0.9, sharpness: 0.9, brightness: 0.5, contrast: 0.7, isBlurry: false, isDark: false },
      entities: []
    };
  }

  /**
   * Answer questions about an image (Visual Question Answering)
   */
  static async answerQuestion(
    image: ImageInput,
    question: string,
    provider?: VisionProvider
  ): Promise<VisualQuestionAnsweringResult> {
    console.log(`[VQA] Answering question: "${question}"`);

    if (provider === 'gpt-4-vision' || !provider) {
      return await this.answerWithGPT4Vision(image, question);
    }

    // Use Qwen or other VQA model
    return await this.answerWithQwenVQA(image, question);
  }

  private static async answerWithGPT4Vision(
    image: ImageInput,
    question: string
  ): Promise<VisualQuestionAnsweringResult> {
    if (!this.openai) {
      throw new Error('OpenAI not initialized');
    }

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: question },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/${image.format};base64,${image.buffer.toString('base64')}`
              }
            }
          ]
        }
      ],
      max_tokens: 500
    });

    const answer = response.choices[0].message.content || '';

    return {
      answer,
      confidence: 0.85,
      supportingEvidence: answer
    };
  }

  private static async answerWithQwenVQA(
    image: ImageInput,
    question: string
  ): Promise<VisualQuestionAnsweringResult> {
    const qwenUrl = process.env.QWEN_VL_URL || 'http://localhost:8000';

    const response = await fetch(`${qwenUrl}/vqa`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image: image.buffer.toString('base64'),
        question
      })
    });

    if (!response.ok) {
      throw new Error(`Qwen VQA API error: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      answer: data.answer,
      confidence: data.confidence || 0.85,
      supportingEvidence: data.evidence
    };
  }

  /**
   * Generate image embedding for similarity search
   */
  static async generateEmbedding(image: ImageInput): Promise<ImageEmbedding> {
    console.log('[ImageUnderstanding] Generating embedding...');

    // In production, use CLIP, DINO, or similar models
    const embeddingUrl = process.env.EMBEDDING_URL || 'http://localhost:8002';

    try {
      const response = await fetch(`${embeddingUrl}/embed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: image.buffer.toString('base64')
        })
      });

      if (!response.ok) {
        throw new Error('Embedding API error');
      }

      const data = await response.json();

      return {
        vector: data.embedding,
        dimension: data.dimension || 512,
        model: data.model || 'clip-vit-base'
      };
    } catch (error: any) {
      console.error('[ImageUnderstanding] Embedding generation failed:', error.message);
      throw error;
    }
  }

  /**
   * Find similar images
   */
  static async findSimilar(
    image: ImageInput,
    limit: number = 10
  ): Promise<any> {
    const embedding = await this.generateEmbedding(image);
    
    // In production, search vector database for similar embeddings
    console.log(`[ImageUnderstanding] Finding ${limit} similar images...`);
    
    return {
      similarImages: [],
      queryImage: 'base64...'
    };
  }

  // Helper methods
  private static parseQwenResponse(data: any): ImageUnderstandingResult {
    return {
      description: data.description || data.caption || '',
      caption: data.caption || '',
      tags: data.tags || [],
      categories: data.categories || [],
      objects: data.objects || [],
      scene: data.scene || 'unknown',
      colors: data.colors?.map((c: any) => ({
        name: c.name,
        hex: c.hex,
        percentage: c.percentage
      })) || [],
      quality: {
        score: data.quality?.score || 0.9,
        sharpness: data.quality?.sharpness || 0.9,
        brightness: data.quality?.brightness || 0.5,
        contrast: data.quality?.contrast || 0.7,
        isBlurry: data.quality?.is_blurry || false,
        isDark: data.quality?.is_dark || false
      },
      text: data.text,
      entities: data.entities || []
    };
  }

  private static parseFlorenceResponse(data: any): ImageUnderstandingResult {
    return {
      description: data.caption || '',
      caption: data.caption || '',
      tags: data.tags || [],
      categories: [],
      objects: data.objects || [],
      scene: 'unknown',
      colors: [],
      quality: { score: 0.9, sharpness: 0.9, brightness: 0.5, contrast: 0.7, isBlurry: false, isDark: false },
      entities: []
    };
  }

  private static extractTags(text: string): string[] {
    // Simple tag extraction - in production, use NLP
    return text.toLowerCase()
      .split(/[\s,]+/)
      .filter(word => word.length > 3)
      .slice(0, 20);
  }
}

// Auto-initialize
ImageUnderstandingService.initialize();