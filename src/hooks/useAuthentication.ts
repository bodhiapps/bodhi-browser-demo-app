import { useState, useEffect } from 'react';
import { oauthManager } from '@/lib/oauth';
import type { AuthenticationState, UserInfo, AuthState } from '@/types/auth';
import type { PlatformDetectionState } from '@/hooks/usePlatformDetection';

export function useAuthentication(platformState: PlatformDetectionState): AuthenticationState {
  const [authStatus, setAuthStatus] = useState<AuthState>('unauthenticated');
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (platformState.status === 'detected' && platformState.client) {
      checkExistingAuth();
    }
  }, [platformState.status, platformState.client]);

  const checkExistingAuth = async () => {
    if (oauthManager.isAuthenticated()) {
      const storedUserInfo = oauthManager.getUserInfo();
      if (storedUserInfo) {
        setUserInfo(storedUserInfo);
        setAuthStatus('authenticated');
      } else if (platformState.client) {
        await fetchUserInfo();
      }
    }
  };

  const fetchUserInfo = async () => {
    if (!platformState.client) return;

    try {
      setAuthStatus('authenticating');
      const userInfo = await oauthManager.fetchUserInfo(platformState.client);
      setUserInfo(userInfo);
      setAuthStatus('authenticated');
      setAuthError(null);
    } catch (error) {
      console.error('Failed to fetch user info:', error);
      setAuthError(error instanceof Error ? error.message : String(error));
      setAuthStatus('error');
      oauthManager.logout();
    }
  };

  const login = async () => {
    if (!platformState.client) {
      setAuthError('Extension not available. Please ensure the Bodhi browser extension is installed.');
      return;
    }

    try {
      setAuthStatus('authenticating');
      setAuthError(null);

      await oauthManager.requestResourceAccess(platformState.client);
      const authUrl = await oauthManager.buildAuthUrl();
      window.location.href = authUrl;
    } catch (error) {
      console.error('Login failed:', error);
      setAuthError(error instanceof Error ? error.message : String(error));
      setAuthStatus('error');
    }
  };

  const logout = () => {
    oauthManager.logout();
    setUserInfo(null);
    setAuthStatus('unauthenticated');
    setAuthError(null);
  };

  return {
    status: authStatus,
    userInfo,
    error: authError,
    login,
    logout,
  };
}