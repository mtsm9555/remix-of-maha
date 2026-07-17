// src/cli/CLIApiClient.ts
import axios, { AxiosInstance, AxiosError } from 'axios';
import { CLIConfig, CLIApiClient } from './CLITypes';

export class CLIApiClientImpl implements CLIApiClient {
  private client: AxiosInstance;
  private config: CLIConfig;

  constructor(config: CLIConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: config.apiUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        ...(config.apiKey && { 'Authorization': `Bearer ${config.apiKey}` }),
        ...(config.tenantId && { 'X-Tenant-ID': config.tenantId }),
        ...(config.workspaceId && { 'X-Workspace-ID': config.workspaceId })
      }
    });

    this.client.interceptors.response.use(
      response => response,
      (error: AxiosError) => {
        if (error.response) {
          const status = error.response.status;
          const data = error.response.data as any;
          
          if (status === 401) {
            throw new Error('Authentication failed. Please check your API key.');
          } else if (status === 403) {
            throw new Error('Permission denied. You do not have access to this resource.');
          } else if (status === 404) {
            throw new Error('Resource not found.');
          } else if (data?.error) {
            throw new Error(data.error);
          }
        } else if (error.request) {
          throw new Error('No response from server. Please check your API URL.');
        }
        
        throw error;
      }
    );
  }

  /**
   * Makes API request
   */
  async request(method: string, path: string, data?: any): Promise<any> {
    const response = await this.client.request({
      method,
      url: path,
      data
    });
    
    return response.data;
  }

  /**
   * GET request
   */
  async get(path: string): Promise<any> {
    return await this.request('GET', path);
  }

  /**
   * POST request
   */
  async post(path: string, data?: any): Promise<any> {
    return await this.request('POST', path, data);
  }

  /**
   * PUT request
   */
  async put(path: string, data?: any): Promise<any> {
    return await this.request('PUT', path, data);
  }

  /**
   * DELETE request
   */
  async delete(path: string): Promise<any> {
    return await this.request('DELETE', path);
  }
}