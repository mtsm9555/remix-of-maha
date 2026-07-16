// src/backend/vision/ObjectDetectionService.ts
import { ImageInput, ObjectDetectionResult, DetectedObject, ObjectDetectionProvider } from "./types";

export class ObjectDetectionService {
  private static defaultProvider: ObjectDetectionProvider = (process.env.OBJECT_DETECTION_PROVIDER as ObjectDetectionProvider) || 'yolo';

  /**
   * Detect objects in image
   */
  static async detect(image: ImageInput, provider?: ObjectDetectionProvider): Promise<ObjectDetectionResult> {
    const selectedProvider = provider || this.defaultProvider;
    const startTime = Date.now();

    console.log(`[ObjectDetection] Detecting objects using ${selectedProvider}...`);

    switch (selectedProvider) {
      case 'yolo':
        return await this.detectWithYOLO(image, startTime);
      case 'detectron2':
        return await this.detectWithDetectron2(image, startTime);
      case 'tensorflow':
        return await this.detectWithTensorFlow(image, startTime);
      case 'aws-rekognition':
        return await this.detectWithAWS(image, startTime);
      default:
        return await this.detectWithYOLO(image, startTime);
    }
  }

  /**
   * Detect objects using YOLO
   */
  private static async detectWithYOLO(image: ImageInput, startTime: number): Promise<ObjectDetectionResult> {
    const yoloUrl = process.env.YOLO_URL || 'http://localhost:5001';

    try {
      const response = await fetch(`${yoloUrl}/detect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: image.buffer.toString('base64'),
          format: image.format,
          confidence_threshold: 0.5,
          iou_threshold: 0.45
        })
      });

      if (!response.ok) {
        throw new Error(`YOLO API error: ${response.statusText}`);
      }

      const data = await response.json();
      const processingTime = Date.now() - startTime;

      return {
        objects: data.detections?.map((det: any) => ({
          label: det.label || det.class,
          confidence: det.confidence,
          boundingBox: {
            x: det.bbox[0] || det.xmin,
            y: det.bbox[1] || det.ymin,
            width: (det.bbox[2] || det.xmax) - (det.bbox[0] || det.xmin),
            height: (det.bbox[3] || det.ymax) - (det.bbox[1] || det.ymin)
          },
          categoryId: det.category_id
        })) || [],
        imageWidth: data.width || image.width || 0,
        imageHeight: data.height || image.height || 0,
        processingTime
      };
    } catch (error: any) {
      console.warn('[ObjectDetection] YOLO unavailable:', error.message);
      throw error;
    }
  }

  /**
   * Detect objects using Detectron2
   */
  private static async detectWithDetectron2(image: ImageInput, startTime: number): Promise<ObjectDetectionResult> {
    const detectronUrl = process.env.DETECTRON2_URL || 'http://localhost:5002';

    try {
      const response = await fetch(`${detectronUrl}/detect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: image.buffer.toString('base64')
        })
      });

      if (!response.ok) {
        throw new Error(`Detectron2 API error: ${response.statusText}`);
      }

      const data = await response.json();
      const processingTime = Date.now() - startTime;

      return {
        objects: data.instances?.pred_classes.map((cls: any, i: number) => ({
          label: cls,
          confidence: data.instances.scores[i],
          boundingBox: {
            x: data.instances.pred_boxes[i][0],
            y: data.instances.pred_boxes[i][1],
            width: data.instances.pred_boxes[i][2] - data.instances.pred_boxes[i][0],
            height: data.instances.pred_boxes[i][3] - data.instances.pred_boxes[i][1]
          }
        })) || [],
        imageWidth: image.width || 0,
        imageHeight: image.height || 0,
        processingTime
      };
    } catch (error: any) {
      console.warn('[ObjectDetection] Detectron2 unavailable:', error.message);
      throw error;
    }
  }

  /**
   * Detect objects using TensorFlow
   */
  private static async detectWithTensorFlow(image: ImageInput, startTime: number): Promise<ObjectDetectionResult> {
    // In production, use TensorFlow.js or Python TF Serving
    console.log('[ObjectDetection] Using TensorFlow');
    
    return {
      objects: [],
      imageWidth: image.width || 0,
      imageHeight: image.height || 0,
      processingTime: Date.now() - startTime
    };
  }

  /**
   * Detect objects using AWS Rekognition
   */
  private static async detectWithAWS(image: ImageInput, startTime: number): Promise<ObjectDetectionResult> {
    // In production, use AWS SDK
    console.log('[ObjectDetection] Using AWS Rekognition');
    
    return {
      objects: [],
      imageWidth: image.width || 0,
      imageHeight: image.height || 0,
      processingTime: Date.now() - startTime
    };
  }

  /**
   * Detect specific objects (filter by category)
   */
  static async detectSpecific(
    image: ImageInput,
    categories: string[]
  ): Promise<ObjectDetectionResult> {
    const result = await this.detect(image);
    
    const filtered = result.objects.filter(obj =>
      categories.some(cat => obj.label.toLowerCase().includes(cat.toLowerCase()))
    );

    return {
      ...result,
      objects: filtered
    };
  }

  /**
   * Count objects in image
   */
  static async count(image: ImageInput): Promise<Record<string, number>> {
    const result = await this.detect(image);
    
    const counts: Record<string, number> = {};
    for (const obj of result.objects) {
      counts[obj.label] = (counts[obj.label] || 0) + 1;
    }
    
    return counts;
  }
}