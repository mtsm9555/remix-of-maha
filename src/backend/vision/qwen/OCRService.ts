// src/backend/vision/OCRService.ts
import { ImageInput, OCRResult, OCRProvider, OCRBlock, OCRLine, OCRWord } from "./types";

export class OCRService {
  private static defaultProvider: OCRProvider = (process.env.OCR_PROVIDER as OCRProvider) || 'paddleocr';

  /**
   * Extract text from image
   */
  static async extractText(image: ImageInput, provider?: OCRProvider): Promise<OCRResult> {
    const selectedProvider = provider || this.defaultProvider;
    console.log(`[OCR] Extracting text using ${selectedProvider}...`);

    switch (selectedProvider) {
      case 'paddleocr':
        return await this.extractWithPaddleOCR(image);
      case 'tesseract':
        return await this.extractWithTesseract(image);
      case 'easyocr':
        return await this.extractWithEasyOCR(image);
      case 'aws-textract':
        return await this.extractWithAWS(image);
      case 'google-vision':
        return await this.extractWithGoogle(image);
      default:
        return await this.extractWithPaddleOCR(image);
    }
  }

  /**
   * Extract text using PaddleOCR
   */
  private static async extractWithPaddleOCR(image: ImageInput): Promise<OCRResult> {
    const paddleUrl = process.env.PADDLEOCR_URL || 'http://localhost:8888';

    try {
      const response = await fetch(`${paddleUrl}/ocr`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: image.buffer.toString('base64'),
          format: image.format,
          lang: 'en'
        })
      });

      if (!response.ok) {
        throw new Error(`PaddleOCR API error: ${response.statusText}`);
      }

      const data = await response.json();
      return this.parsePaddleOCRResponse(data);
    } catch (error: any) {
      console.warn('[OCR] PaddleOCR unavailable, falling back to Tesseract:', error.message);
      return await this.extractWithTesseract(image);
    }
  }

  /**
   * Extract text using Tesseract
   */
  private static async extractWithTesseract(image: ImageInput): Promise<OCRResult> {
    // In production, use tesseract.js or pytesseract
    console.log('[OCR] Using Tesseract OCR');
    
    // Placeholder implementation
    return {
      text: '[Tesseract OCR result - placeholder]',
      confidence: 0.85,
      blocks: [],
      language: 'eng',
      orientation: 0
    };
  }

  /**
   * Extract text using EasyOCR
   */
  private static async extractWithEasyOCR(image: ImageInput): Promise<OCRResult> {
    const easyOcrUrl = process.env.EASYOCR_URL || 'http://localhost:9000';

    try {
      const response = await fetch(`${easyOcrUrl}/extract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: image.buffer.toString('base64'),
          languages: ['en']
        })
      });

      if (!response.ok) {
        throw new Error(`EasyOCR API error: ${response.statusText}`);
      }

      const data = await response.json();
      return this.parseEasyOCRResponse(data);
    } catch (error: any) {
      console.warn('[OCR] EasyOCR unavailable:', error.message);
      throw error;
    }
  }

  /**
   * Extract text using AWS Textract
   */
  private static async extractWithAWS(image: ImageInput): Promise<OCRResult> {
    // In production, use AWS SDK
    console.log('[OCR] Using AWS Textract');
    
    // Placeholder
    return {
      text: '[AWS Textract result - placeholder]',
      confidence: 0.95,
      blocks: [],
      language: 'en',
      orientation: 0
    };
  }

  /**
   * Extract text using Google Cloud Vision
   */
  private static async extractWithGoogle(image: ImageInput): Promise<OCRResult> {
    // In production, use Google Cloud Vision API
    console.log('[OCR] Using Google Cloud Vision');
    
    // Placeholder
    return {
      text: '[Google Vision result - placeholder]',
      confidence: 0.92,
      blocks: [],
      language: 'en',
      orientation: 0
    };
  }

  /**
   * Parse PaddleOCR response
   */
  private static parsePaddleOCRResponse(data: any): OCRResult {
    const blocks: OCRBlock[] = data.results?.map((result: any) => ({
      text: result.text,
      confidence: result.confidence || 0.9,
      boundingBox: {
        x: result.bbox[0],
        y: result.bbox[1],
        width: result.bbox[2] - result.bbox[0],
        height: result.bbox[3] - result.bbox[1]
      },
      lines: []
    })) || [];

    const fullText = blocks.map(b => b.text).join('\n');
    const avgConfidence = blocks.reduce((sum, b) => sum + b.confidence, 0) / (blocks.length || 1);

    return {
      text: fullText,
      confidence: avgConfidence,
      blocks,
      language: 'en',
      orientation: 0
    };
  }

  /**
   * Parse EasyOCR response
   */
  private static parseEasyOCRResponse(data: any): OCRResult {
    const blocks: OCRBlock[] = data.detections?.map((det: any) => ({
      text: det.text,
      confidence: det.confidence,
      boundingBox: {
        x: det.bbox[0][0],
        y: det.bbox[0][1],
        width: det.bbox[1][0] - det.bbox[0][0],
        height: det.bbox[2][1] - det.bbox[0][1]
      },
      lines: []
    })) || [];

    const fullText = blocks.map(b => b.text).join('\n');
    const avgConfidence = blocks.reduce((sum, b) => sum + b.confidence, 0) / (blocks.length || 1);

    return {
      text: fullText,
      confidence: avgConfidence,
      blocks,
      language: 'en',
      orientation: 0
    };
  }

  /**
   * Extract text from specific region of image
   */
  static async extractFromRegion(
    image: ImageInput,
    region: { x: number; y: number; width: number; height: number }
  ): Promise<OCRResult> {
    // Crop image to region first
    console.log(`[OCR] Extracting text from region: ${JSON.stringify(region)}`);
    
    // In production, crop the image and then call extractText
    return await this.extractText(image);
  }

  /**
   * Extract structured data (tables, forms)
   */
  static async extractStructured(image: ImageInput): Promise<any> {
    console.log('[OCR] Extracting structured data...');
    
    // In production, use specialized models for tables/forms
    return {
      tables: [],
      forms: [],
      keyValues: {}
    };
  }
}