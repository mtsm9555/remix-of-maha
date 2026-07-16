// src/backend/vision/types.ts

export type VisionProvider = 'qwen2.5-vl' | 'florence-2' | 'gpt-4-vision' | 'claude-vision' | 'custom';
export type OCRProvider = 'paddleocr' | 'tesseract' | 'easyocr' | 'aws-textract' | 'google-vision';
export type ObjectDetectionProvider = 'yolo' | 'detectron2' | 'tensorflow' | 'aws-rekognition';
export type ImageFormat = 'jpeg' | 'png' | 'webp' | 'bmp' | 'gif' | 'tiff';

export interface VisionConfig {
  provider: VisionProvider;
  ocrProvider: OCRProvider;
  objectDetectionProvider: ObjectDetectionProvider;
  model?: string;
  apiKey?: string;
  endpoint?: string;
}

export interface ImageInput {
  buffer: Buffer;
  format: ImageFormat;
  width?: number;
  height?: number;
  url?: string; // For remote images
}

export interface OCRResult {
  text: string;
  confidence: number;
  blocks: OCRBlock[];
  language: string;
  orientation: number;
}

export interface OCRBlock {
  text: string;
  confidence: number;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  lines: OCRLine[];
}

export interface OCRLine {
  text: string;
  confidence: number;
  words: OCRWord[];
  boundingBox: BoundingBox;
}

export interface OCRWord {
  text: string;
  confidence: number;
  boundingBox: BoundingBox;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ObjectDetectionResult {
  objects: DetectedObject[];
  imageWidth: number;
  imageHeight: number;
  processingTime: number;
}

export interface DetectedObject {
  label: string;
  confidence: number;
  boundingBox: BoundingBox;
  categoryId?: string;
  attributes?: Record<string, any>;
}

export interface ImageUnderstandingResult {
  description: string;
  caption: string;
  tags: string[];
  categories: string[];
  objects: string[];
  scene: string;
  colors: ColorInfo[];
  quality: ImageQuality;
  text?: string; // Extracted text if any
  entities: Entity[];
}

export interface ColorInfo {
  name: string;
  hex: string;
  percentage: number;
}

export interface ImageQuality {
  score: number; // 0.0 to 1.0
  sharpness: number;
  brightness: number;
  contrast: number;
  isBlurry: boolean;
  isDark: boolean;
}

export interface Entity {
  type: string; // person, place, organization, etc.
  name: string;
  confidence: number;
  boundingBox?: BoundingBox;
}

export interface VisualQuestionAnsweringResult {
  answer: string;
  confidence: number;
  supportingEvidence?: string;
  relatedObjects?: DetectedObject[];
}

export interface ImageSimilarityResult {
  similarImages: SimilarImage[];
  queryImage: string;
}

export interface SimilarImage {
  url: string;
  similarity: number; // 0.0 to 1.0
  metadata?: Record<string, any>;
}

export interface ScreenshotAnalysisResult {
  uiType: string; // webpage, mobile app, desktop app
  elements: UIElement[];
  layout: LayoutInfo;
  accessibility: AccessibilityInfo;
  suggestions: string[];
}

export interface UIElement {
  type: string; // button, input, text, image, link, etc.
  text?: string;
  boundingBox: BoundingBox;
  attributes?: Record<string, any>;
  interactive: boolean;
}

export interface LayoutInfo {
  gridStructure: string;
  dominantColors: ColorInfo[];
  whitespace: number;
  alignment: string;
}

export interface AccessibilityInfo {
  score: number;
  issues: AccessibilityIssue[];
  wcagLevel: 'A' | 'AA' | 'AAA';
}

export interface AccessibilityIssue {
  severity: 'critical' | 'major' | 'minor';
  description: string;
  element?: UIElement;
  wcagCriterion: string;
}

export interface ImageEmbedding {
  vector: number[];
  dimension: number;
  model: string;
}

export interface VisionTask {
  id: string;
  type: 'ocr' | 'object_detection' | 'understanding' | 'vqa' | 'similarity' | 'screenshot';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  input: ImageInput;
  result?: any;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}