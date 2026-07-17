// src/backend/cicd/PipelineParser.ts
import { PipelineDefinition, PipelineStage, JobDefinition } from "./CICDPlatformTypes";
import * as yaml from 'js-yaml';

export class PipelineParser {
  
  /**
   * Parses YAML pipeline definition
   */
  static parse(yamlContent: string): PipelineDefinition {
    try {
      const parsed = yaml.load(yamlContent) as any;
      
      if (!parsed || !parsed.stages) {
        throw new Error('Invalid pipeline definition: missing stages');
      }
      
      const definition: PipelineDefinition = {
        version: parsed.version || '1.0',
        stages: this.parseStages(parsed.stages),
        artifacts: parsed.artifacts,
        notifications: parsed.notifications
      };
      
      this.validateDefinition(definition);
      
      return definition;
      
    } catch (error: any) {
      throw new Error(`Failed to parse pipeline: ${error.message}`);
    }
  }
  
  /**
   * Parses stages from YAML
   */
  private static parseStages(stages: any[]): PipelineStage[] {
    return stages.map((stage: any, index: number) => ({
      name: stage.name || `stage-${index + 1}`,
      jobs: this.parseJobs(stage.jobs || []),
      condition: stage.condition,
      parallel: stage.parallel || false,
      allowFailure: stage.allowFailure || false
    }));
  }
  
  /**
   * Parses jobs from YAML
   */
  private static parseJobs(jobs: any[]): JobDefinition[] {
    return jobs.map((job: any) => ({
      name: job.name,
      image: job.image || 'node:18-alpine',
      commands: job.commands || job.script || [],
      environment: job.environment || job.env,
      artifacts: job.artifacts,
      cache: job.cache,
      dependencies: job.dependencies,
      timeout: job.timeout || 3600,
      retry: job.retry || 0,
      when: job.when || 'on_success'
    }));
  }
  
  /**
   * Validates pipeline definition
   */
  private static validateDefinition(definition: PipelineDefinition): void {
    if (definition.stages.length === 0) {
      throw new Error('Pipeline must have at least one stage');
    }
    
    for (const stage of definition.stages) {
      if (stage.jobs.length === 0) {
        throw new Error(`Stage "${stage.name}" must have at least one job`);
      }
      
      for (const job of stage.jobs) {
        if (!job.name) {
          throw new Error('All jobs must have a name');
        }
        
        if (!job.commands || job.commands.length === 0) {
          throw new Error(`Job "${job.name}" must have at least one command`);
        }
      }
    }
  }
  
  /**
   * Generates example pipeline YAML
   */
  static generateExample(): string {
    return `version: '1.0'

stages:
  - name: build
    jobs:
      - name: install-dependencies
        image: node:18-alpine
        commands:
          - npm ci
        cache:
          key: npm-cache
          paths:
            - node_modules
      
      - name: compile
        image: node:18-alpine
        commands:
          - npm run build
        dependencies:
          - install-dependencies
        artifacts:
          paths:
            - dist/
          expireIn: 1 week
  
  - name: test
    parallel: true
    jobs:
      - name: unit-tests
        image: node:18-alpine
        commands:
          - npm test
        dependencies:
          - compile
      
      - name: integration-tests
        image: node:18-alpine
        commands:
          - npm run test:integration
        dependencies:
          - compile
  
  - name: deploy
    condition: branch == 'main'
    jobs:
      - name: deploy-staging
        image: alpine:latest
        commands:
          - echo "Deploying to staging..."
          - ./deploy.sh staging
        dependencies:
          - unit-tests
          - integration-tests

artifacts:
  - name: build-output
    paths:
      - dist/
    expireIn: 30 days

notifications:
  - type: slack
    channel: '#deployments'
    on: [success, failure]
`;
  }
}