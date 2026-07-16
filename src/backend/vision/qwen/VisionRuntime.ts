// src/backend/vision/VisionRuntime.ts
import { OCRService } from "./OCRService";
import { ObjectDetectionService } from "./ObjectDetectionService";
import { ImageUnderstandingService } from "./ImageUnderstandingService";
import { ScreenshotAnalysisService } from "./ScreenshotAnalysisService";
import { 
  ImageInput, 
  VisionTask, 
  VisionConfig,
  OCRResult,
  ObjectDetectionResult,
  ImageUnderstandingResult,
  ScreenshotAnalysisResult,
  VisualQuestionAnsweringResult
} from "./types";

export class VisionRuntime {
  private static tasks: Map<string, VisionTask> = new Map();
  private static defaultConfig: VisionConfig = {
    provider: 'qwen2.5-vl',
    ocrProvider: 'paddleocr',
    objectDetectionProvider: 'yolo'
  };

  /**
   * Process image with multiple vision tasks
   */
  static async processImage(
    image: ImageInput,
    tasks: Array<'ocr' | 'objects' | 'understanding' | 'screenshot'> = ['understanding']
  ): Promise<{
    ocr?: OCRResult;
    objects?: ObjectDetectionResult;
    understanding?: ImageUnderstandingResult;
    screenshot?: ScreenshotAnalysisResult;
  }> {
    console.log(`[VisionRuntime] Processing image with tasks: ${tasks.join(', ')}`);

    const results: any = {};

    // Run tasks in parallel
    const promises = tasks.map(async (task) => {
      const taskId = `${task}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const visionTask: VisionTask = {
        id: taskId,
        type: task,
        status: 'processing',
        input: image,
        createdAt: new Date()
      };

      this.tasks.set(taskId, visionTask);

      try {
        let result: any;

        switch (task) {
          case 'ocr':
            result = await OCRService.extractText(image, this.defaultConfig.ocrProvider);
            break;
          case 'objects':
            result = await ObjectDetectionService.detect(image, this.defaultConfig.objectDetectionProvider);
            break;
          case 'understanding':
            result = await ImageUnderstandingService.understand(image, this.defaultConfig.provider);
            break;
          case 'screenshot':
            result = await ScreenshotAnalysisService.analyze(image);
            break;
        }

        visionTask.status = 'completed';
        visionTask.result = result;
        visionTask.completedAt = new Date();

        results[task] = result;
      } catch (error: any) {
        visionTask.status = 'failed';
        visionTask.error = error.message;
        console.error(`[VisionRuntime] Task ${taskId} failed:`, error.message);
      }
    });

    await Promise.all(promises);
    return results;
  }

  /**
   * Extract text from image (OCR)
   */
  static async extractText(image: ImageInput): Promise<OCRResult> {
    return await OCRService.extractText(image, this.defaultConfig.ocrProvider);
  }

  /**
   * Detect objects in image
   */
  static async detectObjects(image: ImageInput): Promise<ObjectDetectionResult> {
    return await ObjectDetectionService.detect(image, this.defaultConfig.objectDetectionProvider);
  }

  /**
   * Understand and describe image
   */
  static async understandImage(image: ImageInput): Promise<ImageUnderstandingResult> {
    return await ImageUnderstandingService.understand(image, this.defaultConfig.provider);
  }

  /**
   * Answer question about image
   */
  static async answerQuestion(
    image: ImageInput,
    question: string
  ): Promise<VisualQuestionAnsweringResult> {
    return await ImageUnderstandingService.answerQuestion(image, question, this.defaultConfig.provider);
  }

  /**
   * Analyze screenshot
   */
  static async analyzeScreenshot(image: ImageInput): Promise<ScreenshotAnalysisResult> {
    return await ScreenshotAnalysisService.analyze(image);
  }

  /**
   * Get task status
   */
  static getTaskStatus(taskId: string): VisionTask | undefined {
    return this.tasks.get(taskId);
  }

  /**
   * Set default configuration
   */
  static setDefaultConfig(config: Partial<VisionConfig>) {
    this.defaultConfig = { ...this.defaultConfig, ...config };
    console.log('[VisionRuntime] Default config updated:', this.defaultConfig);
  }

  /**
   * Clean up old tasks
   */
  static cleanupOldTasks(maxAgeMs: number = 3600000) {
    const now = Date.now();
    for (const [id, task] of this.tasks.entries()) {
      if (task.completedAt && now - task.completedAt.getTime() > maxAgeMs) {
        this.tasks.delete(id);
      }
    }
  }
}

// Cleanup old tasks every 10 minutes
setInterval(() => VisionRuntime.cleanupOldTasks(), 600000);