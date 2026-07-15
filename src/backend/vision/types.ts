export interface VisionRequest {
  userId: string;
  imageUrl: string;
  task: "ocr" | "objects" | "screen" | "analyze";
}

export interface OCRResult {
  text: string;
}

export interface DetectedObject {
  label: string;
  confidence: number;
  bbox: number[];
}

export interface ScreenAnalysis {
  buttons: string[];
  forms: string[];
  menus: string[];
  text: string;
}

export interface VisionResult {
  text?: OCRResult;
  objects?: DetectedObject[];
  screen?: ScreenAnalysis;
  analysis?: unknown;
}

export interface VisionEntity {
  name: string;
  type: string;
}