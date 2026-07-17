// src/backend/business/analytics/PredictiveAnalyticsEngine.ts
import { createClient } from "@supabase/supabase-js";
import { PredictiveForecast, ForecastDataPoint, MetricDataPoint, AggregationPeriod } from "./BusinessAnalyticsTypes";
import * as crypto from "crypto";

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export class PredictiveAnalyticsEngine {
  
  /**
   * Generates forecast using linear regression
   */
  static async generateLinearForecast(
    tenantId: string,
    metricId: string,
    historicalData: MetricDataPoint[],
    horizon: number
  ): Promise<PredictiveForecast> {
    if (historicalData.length < 3) {
      throw new Error('Insufficient data for forecasting (need at least 3 data points)');
    }
    
    // Prepare data for linear regression
    const xValues = historicalData.map((d, i) => i);
    const yValues = historicalData.map(d => d.value);
    
    // Calculate linear regression coefficients
    const n = xValues.length;
    const sumX = xValues.reduce((sum, x) => sum + x, 0);
    const sumY = yValues.reduce((sum, y) => sum + y, 0);
    const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0);
    const sumXX = xValues.reduce((sum, x) => sum + x * x, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Generate forecast
    const forecastData: ForecastDataPoint[] = [];
    const lastDate = historicalData[historicalData.length - 1].date;
    
    for (let i = 1; i <= horizon; i++) {
      const forecastDate = new Date(lastDate);
      forecastDate.setDate(forecastDate.getDate() + i * 30); // Assume monthly
      
      const predictedValue = slope * (n + i - 1) + intercept;
      
      // Calculate confidence intervals (simplified)
      const stdError = this.calculateStandardError(yValues, xValues, slope, intercept);
      const confidence = 0.95;
      const zScore = 1.96; // 95% confidence
      
      forecastData.push({
        date: forecastDate,
        predictedValue: Math.max(0, predictedValue),
        lowerBound: Math.max(0, predictedValue - zScore * stdError),
        upperBound: predictedValue + zScore * stdError,
        confidence: confidence * 100
      });
    }
    
    // Calculate accuracy metrics
    const mape = this.calculateMAPE(yValues, xValues, slope, intercept);
    const rmse = this.calculateRMSE(yValues, xValues, slope, intercept);
    
    const forecast: PredictiveForecast = {
      id: `forecast_${crypto.randomUUID()}`,
      tenantId,
      metricId,
      forecastPeriod: 'monthly',
      forecastHorizon: horizon,
      modelType: 'linear',
      modelConfidence: Math.max(0, 100 - mape),
      historicalData,
      forecastData,
      mape,
      rmse,
      createdAt: new Date()
    };
    
    await supabase.from('predictive_forecasts').insert({
      ...forecast,
      historical_data: forecast.historicalData,
      forecast_data: forecast.forecastData,
      created_at: forecast.createdAt.toISOString()
    });
    
    return forecast;
  }
  
  /**
   * Generates forecast using exponential smoothing
   */
  static async generateExponentialForecast(
    tenantId: string,
    metricId: string,
    historicalData: MetricDataPoint[],
    horizon: number,
    alpha: number = 0.3
  ): Promise<PredictiveForecast> {
    if (historicalData.length < 2) {
      throw new Error('Insufficient data for exponential smoothing');
    }
    
    // Apply exponential smoothing
    const smoothed: number[] = [historicalData[0].value];
    
    for (let i = 1; i < historicalData.length; i++) {
      const smoothedValue = alpha * historicalData[i].value + (1 - alpha) * smoothed[i - 1];
      smoothed.push(smoothedValue);
    }
    
    // Generate forecast
    const forecastData: ForecastDataPoint[] = [];
    const lastDate = historicalData[historicalData.length - 1].date;
    const lastSmoothed = smoothed[smoothed.length - 1];
    
    for (let i = 1; i <= horizon; i++) {
      const forecastDate = new Date(lastDate);
      forecastDate.setDate(forecastDate.getDate() + i * 30);
      
      forecastData.push({
        date: forecastDate,
        predictedValue: lastSmoothed,
        lowerBound: lastSmoothed * 0.8,
        upperBound: lastSmoothed * 1.2,
        confidence: 80
      });
    }
    
    const forecast: PredictiveForecast = {
      id: `forecast_${crypto.randomUUID()}`,
      tenantId,
      metricId,
      forecastPeriod: 'monthly',
      forecastHorizon: horizon,
      modelType: 'exponential',
      modelConfidence: 80,
      historicalData,
      forecastData,
      mape: 0,
      rmse: 0,
      createdAt: new Date()
    };
    
    await supabase.from('predictive_forecasts').insert({
      ...forecast,
      historical_data: forecast.historicalData,
      forecast_data: forecast.forecastData,
      created_at: forecast.createdAt.toISOString()
    });
    
    return forecast;
  }
  
  /**
   * Calculates Mean Absolute Percentage Error
   */
  private static calculateMAPE(actual: number[], x: number[], slope: number, intercept: number): number {
    let sumAPE = 0;
    
    for (let i = 0; i < actual.length; i++) {
      const predicted = slope * x[i] + intercept;
      const ape = Math.abs((actual[i] - predicted) / actual[i]) * 100;
      sumAPE += ape;
    }
    
    return sumAPE / actual.length;
  }
  
  /**
   * Calculates Root Mean Square Error
   */
  private static calculateRMSE(actual: number[], x: number[], slope: number, intercept: number): number {
    let sumSquaredError = 0;
    
    for (let i = 0; i < actual.length; i++) {
      const predicted = slope * x[i] + intercept;
      const error = actual[i] - predicted;
      sumSquaredError += error * error;
    }
    
    return Math.sqrt(sumSquaredError / actual.length);
  }
  
  /**
   * Calculates standard error
   */
  private static calculateStandardError(actual: number[], x: number[], slope: number, intercept: number): number {
    const rmse = this.calculateRMSE(actual, x, slope, intercept);
    return rmse / Math.sqrt(actual.length);
  }
}