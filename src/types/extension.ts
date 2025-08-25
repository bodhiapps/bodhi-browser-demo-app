export interface ExtensionClient {
  getExtensionId(): string;
  sendApiRequest(
    method: string,
    endpoint: string,
    body?: any,
    headers?: Record<string, string>
  ): Promise<ApiResponse>;
  sendStreamRequest(
    method: string,
    endpoint: string,
    body?: any,
    headers?: Record<string, string>
  ): Promise<AsyncIterable<StreamChunk>>;
  ping(): Promise<{ message: string }>;
  serverState(): Promise<ServerStateInfo>;
}

export interface ApiResponse {
  body: any;
  headers: Record<string, string>;
  status: number;
}

export interface StreamChunk {
  body: any;
  headers?: Record<string, string>;
  status?: number;
}

export interface ServerStateInfo {
  status: 'setup' | 'ready' | 'resource-admin' | 'error' | 'unreachable';
  version?: string;
  url?: string;
  error?: {
    message: string;
    type?: string;
    code?: string;
    param?: string;
  };
}

export class ExtensionNotFoundError extends Error {
  constructor(timeout: number) {
    super(`Bodhi extension not detected within ${timeout}ms`);
    this.name = 'ExtensionNotFoundError';
  }
}

export class ExtensionTimeoutError extends Error {
  constructor(timeout: number) {
    super(`Timeout fetching extension ID within ${timeout}ms`);
    this.name = 'ExtensionTimeoutError';
  }
}

declare global {
  interface Window {
    bodhiext?: {
      getExtensionId(): Promise<string>;
      sendApiRequest(
        method: string,
        endpoint: string,
        body?: any,
        headers?: Record<string, string>
      ): Promise<ApiResponse>;
      sendStreamRequest(
        method: string,
        endpoint: string,
        body?: any,
        headers?: Record<string, string>
      ): Promise<AsyncIterable<StreamChunk>>;
      ping(): Promise<{ message: string }>;
      serverState(): Promise<ServerStateInfo>;
    };
  }
}