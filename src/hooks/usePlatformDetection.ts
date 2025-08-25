import { useState, useEffect } from 'react';
import { loadExtensionClient } from '@/lib/extension-client';
import type { ExtensionClient } from '@/types/extension';

export type PlatformDetectionStatus = 'detecting' | 'detected' | 'setup' | 'timeout' | 'error';

export interface PlatformDetectionState {
  status: PlatformDetectionStatus;
  client: ExtensionClient | null;
  extensionId: string | null;
  error: string | null;
}

export function usePlatformDetection(): PlatformDetectionState {
  const [state, setState] = useState<PlatformDetectionState>({
    status: 'detecting',
    client: null,
    extensionId: null,
    error: null,
  });

  useEffect(() => {
    let mounted = true;

    const detectExtension = async () => {
      try {
        setState(prev => ({ ...prev, status: 'detecting', error: null }));
        
        const client = await loadExtensionClient({ timeout: 5000 });
        
        if (!mounted) return;

        setState({
          status: 'detected',
          client,
          extensionId: client.getExtensionId(),
          error: null,
        });
      } catch (error) {
        if (!mounted) return;
        
        const errorMessage = error instanceof Error ? error.message : String(error);
        setState({
          status: 'error',
          client: null,
          extensionId: null,
          error: errorMessage,
        });
      }
    };

    detectExtension();

    return () => {
      mounted = false;
    };
  }, []);

  return state;
}