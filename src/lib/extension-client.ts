import type {
  ExtensionClient,
  ApiResponse,
  StreamChunk,
  ServerStateInfo
} from '@/types/extension';
import {
  ExtensionNotFoundError,
  ExtensionTimeoutError,
} from '@/types/extension';

export class ExtensionClientImpl implements ExtensionClient {
  private extensionId: string;
  
  constructor(extensionId: string) {
    this.extensionId = extensionId;
  }

  getExtensionId(): string {
    return this.extensionId;
  }

  async sendApiRequest(
    method: string,
    endpoint: string,
    body?: any,
    headers?: Record<string, string>
  ): Promise<ApiResponse> {
    this.ensureExtensionAvailable();
    return window.bodhiext!.sendApiRequest(method, endpoint, body, headers);
  }

  async sendStreamRequest(
    method: string,
    endpoint: string,
    body?: any,
    headers?: Record<string, string>
  ): Promise<AsyncIterable<StreamChunk>> {
    this.ensureExtensionAvailable();
    return window.bodhiext!.sendStreamRequest(method, endpoint, body, headers);
  }

  async ping(): Promise<{ message: string }> {
    this.ensureExtensionAvailable();
    return window.bodhiext!.ping();
  }

  async serverState(): Promise<ServerStateInfo> {
    this.ensureExtensionAvailable();
    return window.bodhiext!.serverState();
  }

  private ensureExtensionAvailable(): void {
    if (typeof window.bodhiext === 'undefined') {
      throw new Error('Bodhi extension not available');
    }
  }
}

export async function loadExtensionClient(
  config: { timeout?: number } = {}
): Promise<ExtensionClient> {
  const timeout = config.timeout ?? 10000;

  // Step 1: Poll for window.bodhiext availability
  const extensionDetected = await new Promise<boolean>(resolve => {
    const startTime = Date.now();

    const checkExtension = () => {
      if (typeof window.bodhiext !== 'undefined') {
        resolve(true);
        return;
      }

      if (Date.now() - startTime >= timeout) {
        resolve(false);
        return;
      }

      setTimeout(checkExtension, 100);
    };

    checkExtension();
  });

  if (!extensionDetected) {
    throw new ExtensionNotFoundError(timeout);
  }

  // Step 2: Fetch extension ID with timeout
  try {
    const extensionIdPromise = window.bodhiext!.getExtensionId();
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new ExtensionTimeoutError(timeout)), timeout);
    });

    const extensionId = await Promise.race([extensionIdPromise, timeoutPromise]);
    return new ExtensionClientImpl(extensionId);
  } catch (error) {
    if (error instanceof ExtensionTimeoutError) {
      throw error;
    }
    throw new ExtensionTimeoutError(timeout);
  }
}