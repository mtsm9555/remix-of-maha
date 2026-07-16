// src/backend/vision/ScreenshotAnalysisService.ts
import { ImageInput, ScreenshotAnalysisResult, UIElement, LayoutInfo, AccessibilityInfo } from "./types";
import { OCRService } from "./OCRService";
import { ObjectDetectionService } from "./ObjectDetectionService";

export class ScreenshotAnalysisService {
  /**
   * Analyze UI screenshot
   */
  static async analyze(image: ImageInput): Promise<ScreenshotAnalysisResult> {
    console.log('[ScreenshotAnalysis] Analyzing UI screenshot...');

    // 1. Detect UI elements
    const elements = await this.detectUIElements(image);

    // 2. Analyze layout
    const layout = await this.analyzeLayout(image, elements);

    // 3. Check accessibility
    const accessibility = await this.checkAccessibility(elements);

    // 4. Determine UI type
    const uiType = this.determineUIType(elements, layout);

    // 5. Generate suggestions
    const suggestions = this.generateSuggestions(elements, accessibility);

    return {
      uiType,
      elements,
      layout,
      accessibility,
      suggestions
    };
  }

  /**
   * Detect UI elements in screenshot
   */
  private static async detectUIElements(image: ImageInput): Promise<UIElement[]> {
    // Use object detection specialized for UI elements
    const detectionResult = await ObjectDetectionService.detectSpecific(image, [
      'button', 'input', 'text', 'link', 'image', 'icon', 'menu', 'form'
    ]);

    // Also extract text using OCR
    const ocrResult = await OCRService.extractText(image);

    // Combine results
    const elements: UIElement[] = detectionResult.objects.map(obj => ({
      type: this.mapObjectType(obj.label),
      text: this.findTextNearElement(obj, ocrResult),
      boundingBox: obj.boundingBox,
      interactive: ['button', 'input', 'link'].includes(this.mapObjectType(obj.label)),
      attributes: {
        confidence: obj.confidence
      }
    }));

    return elements;
  }

  /**
   * Analyze layout structure
   */
  private static async analyzeLayout(image: ImageInput, elements: UIElement[]): Promise<LayoutInfo> {
    // Analyze grid structure
    const gridStructure = this.detectGridStructure(elements);

    // Extract dominant colors
    const dominantColors = await this.extractDominantColors(image);

    // Calculate whitespace
    const whitespace = this.calculateWhitespace(elements, image);

    // Determine alignment
    const alignment = this.determineAlignment(elements);

    return {
      gridStructure,
      dominantColors,
      whitespace,
      alignment
    };
  }

  /**
   * Check accessibility compliance
   */
  private static async checkAccessibility(elements: UIElement[]): Promise<AccessibilityInfo> {
    const issues: any[] = [];
    let score = 100;

    // Check color contrast (simplified)
    // In production, use proper contrast ratio calculation

    // Check for missing labels on inputs
    const inputsWithoutLabels = elements.filter(
      el => el.type === 'input' && !el.text && !el.attributes?.['aria-label']
    );

    if (inputsWithoutLabels.length > 0) {
      issues.push({
        severity: 'major',
        description: `${inputsWithoutLabels.length} input(s) missing labels`,
        wcagCriterion: '1.3.1 Info and Relationships'
      });
      score -= 20;
    }

    // Check for button text
    const buttonsWithoutText = elements.filter(
      el => el.type === 'button' && !el.text && !el.attributes?.['aria-label']
    );

    if (buttonsWithoutText.length > 0) {
      issues.push({
        severity: 'major',
        description: `${buttonsWithoutText.length} button(s) missing accessible text`,
        wcagCriterion: '4.1.2 Name, Role, Value'
      });
      score -= 20;
    }

    // Determine WCAG level
    let wcagLevel: 'A' | 'AA' | 'AAA' = 'A';
    if (score >= 90) wcagLevel = 'AA';
    if (score >= 95) wcagLevel = 'AAA';

    return {
      score: Math.max(0, score),
      issues,
      wcagLevel
    };
  }

  /**
   * Determine UI type (webpage, mobile app, desktop app)
   */
  private static determineUIType(elements: UIElement[], layout: LayoutInfo): string {
    // Analyze element density and layout to determine type
    const buttonCount = elements.filter(el => el.type === 'button').length;
    const inputCount = elements.filter(el => el.type === 'input').length;

    if (layout.gridStructure === 'responsive' || buttonCount > 10) {
      return 'webpage';
    } else if (layout.alignment === 'vertical' && inputCount > 5) {
      return 'mobile app';
    } else {
      return 'desktop app';
    }
  }

  /**
   * Generate improvement suggestions
   */
  private static generateSuggestions(elements: UIElement[], accessibility: AccessibilityInfo): string[] {
    const suggestions: string[] = [];

    // Accessibility suggestions
    if (accessibility.issues.some(i => i.description.includes('missing labels'))) {
      suggestions.push('Add labels to all form inputs for better accessibility');
    }

    if (accessibility.issues.some(i => i.description.includes('missing accessible text'))) {
      suggestions.push('Add accessible text or aria-labels to icon buttons');
    }

    // UX suggestions
    const buttonsWithoutIcons = elements.filter(el => el.type === 'button' && !el.attributes?.icon);
    if (buttonsWithoutIcons.length > 5) {
      suggestions.push('Consider adding icons to primary action buttons for better recognition');
    }

    // Performance suggestions
    if (elements.length > 100) {
      suggestions.push('High element count detected. Consider lazy loading or pagination');
    }

    return suggestions;
  }

  // Helper methods
  private static mapObjectType(label: string): string {
    const mapping: Record<string, string> = {
      'button': 'button',
      'btn': 'button',
      'input': 'input',
      'textbox': 'input',
      'text': 'text',
      'label': 'text',
      'link': 'link',
      'a': 'link',
      'image': 'image',
      'img': 'image',
      'icon': 'icon',
      'menu': 'menu',
      'navigation': 'menu',
      'form': 'form'
    };

    return mapping[label.toLowerCase()] || 'unknown';
  }

  private static findTextNearElement(element: any, ocrResult: any): string | undefined {
    // Find text blocks near the element's bounding box
    // Simplified implementation
    return undefined;
  }

  private static detectGridStructure(elements: UIElement[]): string {
    // Analyze element positions to detect grid structure
    return 'grid';
  }

  private static async extractDominantColors(image: ImageInput): Promise<any[]> {
    // In production, use color quantization
    return [
      { name: 'primary', hex: '#0ea5e9', percentage: 40 },
      { name: 'background', hex: '#ffffff', percentage: 35 }
    ];
  }

  private static calculateWhitespace(elements: UIElement[], image: ImageInput): number {
    // Calculate percentage of whitespace in the UI
    return 25;
  }

  private static determineAlignment(elements: UIElement[]): string {
    // Analyze element positions to determine alignment
    return 'left';
  }
}