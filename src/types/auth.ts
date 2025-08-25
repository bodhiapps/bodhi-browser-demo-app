export interface UserInfo {
  email: string;
  role: string;
  tokenType: string;
  loggedIn: boolean;
}

export type AuthState = 'unauthenticated' | 'authenticating' | 'authenticated' | 'error';

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
}

export interface AuthenticationState {
  status: AuthState;
  userInfo: UserInfo | null;
  error: string | null;
  login: () => Promise<void>;
  logout: () => void;
}