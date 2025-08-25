import type { UserInfo, TokenResponse } from '@/types/auth';
import type { ExtensionClient } from '@/types/extension';

// OAuth configuration constants
const APP_CLIENT_ID = 'app-a05c53c5-3fc4-409d-833d-f4acc90e1611';
const BODHI_AUTH_URL = 'https://main-id.getbodhi.app';
const AUTH_REALM = 'bodhi';
const REDIRECT_URI = `${window.location.origin}/callback`;

// Storage keys
const STORAGE_KEYS = {
  RESOURCE_SCOPE: 'bodhi_resource_scope',
  ACCESS_TOKEN: 'bodhi_access_token',
  REFRESH_TOKEN: 'bodhi_refresh_token',
  CODE_VERIFIER: 'bodhi_code_verifier',
  STATE: 'bodhi_state',
  USER_INFO: 'bodhi_user_info',
} as const;

// PKCE utilities
class PKCEUtils {
  static generateRandomString(length: number): string {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, byte => String.fromCharCode((byte % 26) + 97)).join('');
  }

  static async generatePKCEChallenge(verifier: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode(...new Uint8Array(digest)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }
}

export class OAuthManager {
  private isExchangingTokens = false;

  async requestResourceAccess(extensionClient: ExtensionClient): Promise<string> {
    try {
      const response = await extensionClient.sendApiRequest(
        'POST',
        '/bodhi/v1/auth/request-access',
        { app_client_id: APP_CLIENT_ID }
      );

      if (!response.body.scope) {
        throw new Error('No scope returned from request-access');
      }

      localStorage.setItem(STORAGE_KEYS.RESOURCE_SCOPE, response.body.scope);
      return response.body.scope;
    } catch (error) {
      throw new Error(
        `Failed to request resource access: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async buildAuthUrl(): Promise<string> {
    const resourceScope = localStorage.getItem(STORAGE_KEYS.RESOURCE_SCOPE);
    if (!resourceScope) {
      throw new Error('Resource scope not found. Call requestResourceAccess first.');
    }

    const state = PKCEUtils.generateRandomString(32);
    const codeVerifier = PKCEUtils.generateRandomString(128);
    const codeChallenge = await PKCEUtils.generatePKCEChallenge(codeVerifier);

    localStorage.setItem(STORAGE_KEYS.STATE, state);
    localStorage.setItem(STORAGE_KEYS.CODE_VERIFIER, codeVerifier);

    const scopes = ['openid', 'email', 'profile', 'roles', 'scope_user_user', resourceScope];
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: APP_CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      scope: scopes.join(' '),
      state: state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    });

    return `${BODHI_AUTH_URL}/realms/${AUTH_REALM}/protocol/openid-connect/auth?${params}`;
  }

  async exchangeCodeForTokens(code: string, state: string): Promise<void> {
    if (this.isAuthenticated()) {
      return;
    }

    if (this.isExchangingTokens) {
      return;
    }

    this.isExchangingTokens = true;

    try {
      const storedState = localStorage.getItem(STORAGE_KEYS.STATE);
      const codeVerifier = localStorage.getItem(STORAGE_KEYS.CODE_VERIFIER);

      if (!storedState || storedState !== state) {
        throw new Error('Invalid state parameter');
      }

      if (!codeVerifier) {
        throw new Error('Code verifier not found');
      }

      const tokenUrl = `${BODHI_AUTH_URL}/realms/${AUTH_REALM}/protocol/openid-connect/token`;
      const params = new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: APP_CLIENT_ID,
        code: code,
        redirect_uri: REDIRECT_URI,
        code_verifier: codeVerifier,
      });

      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Token exchange failed: ${response.status} ${errorText}`);
      }

      const tokenData: TokenResponse = await response.json();

      if (!tokenData.access_token) {
        throw new Error('No access token received');
      }

      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokenData.access_token);
      if (tokenData.refresh_token) {
        localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokenData.refresh_token);
      }

      localStorage.removeItem(STORAGE_KEYS.STATE);
      localStorage.removeItem(STORAGE_KEYS.CODE_VERIFIER);
    } finally {
      this.isExchangingTokens = false;
    }
  }

  getAccessToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  }

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  getUserInfo(): UserInfo | null {
    const userInfoStr = localStorage.getItem(STORAGE_KEYS.USER_INFO);
    if (!userInfoStr) return null;
    try {
      return JSON.parse(userInfoStr);
    } catch {
      return null;
    }
  }

  setUserInfo(userInfo: UserInfo): void {
    localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(userInfo));
  }

  logout(): void {
    Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
    this.isExchangingTokens = false;
  }

  async fetchUserInfo(extensionClient: ExtensionClient): Promise<UserInfo> {
    const accessToken = this.getAccessToken();
    if (!accessToken) {
      throw new Error('No access token available');
    }

    try {
      const response = await extensionClient.sendApiRequest(
        'GET',
        '/bodhi/v1/user',
        undefined,
        { Authorization: `Bearer ${accessToken}` }
      );

      const userInfo: UserInfo = {
        email: response.body.email || 'Unknown',
        role: response.body.role || 'user',
        tokenType: 'Bearer',
        loggedIn: true,
      };

      this.setUserInfo(userInfo);
      return userInfo;
    } catch (error) {
      throw new Error(
        `Failed to fetch user info: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}

export const oauthManager = new OAuthManager();