# GitHub Pages Deployment & Bodhi Extension Login Context

## Overview

This document provides comprehensive context for implementing GitHub Pages deployment and Bodhi browser extension login functionality, based on analysis of the `bodhijs-test-app` which demonstrates these exact patterns.

## 1. GitHub Pages Deployment Architecture

### 1.1 Build Configuration
**File Structure Pattern**:
```
project/
├── vite.config.ts       # Build configuration with 404.html support
├── package.json         # Build scripts and dependencies
├── Makefile            # Build automation
├── index.html          # Main entry point
└── src/
    ├── main.tsx        # React app entry
    └── App.tsx         # Router configuration
```

**Key Build Configuration (`vite.config.ts`)**:
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { copyFileSync } from 'fs';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-index-as-404',
      writeBundle() {
        // Critical: Copy index.html as 404.html for SPA routing support
        try {
          copyFileSync(resolve(__dirname, 'dist/index.html'), resolve(__dirname, 'dist/404.html'));
        } catch (error) {
          console.warn('Could not copy index.html as 404.html:', error);
        }
      },
    },
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 12345,
    host: true,
  },
  preview: {
    port: 12345,
    host: true,
  },
});
```

**Package.json Build Scripts**:
```json
{
  "scripts": {
    "clean": "rimraf dist",
    "dev": "vite",
    "build": "tsc && vite build",
    "prebuild": "make dependencies",
    "build:only": "tsc && vite build",
    "build:fast-direct": "npm run prebuild:fast && npm run build:only",
    "build:fast": "node ../scripts/build-fast.mjs bodhijs-test-app 'npm run build:fast-direct' src index.html package.json tsconfig.json vite.config.ts ../../src",
    "prebuild:fast": "make dependencies-fast",
    "lint": "eslint . --report-unused-disable-directives --max-warnings 0",
    "lint:fix": "eslint . --fix",
    "preview": "vite preview",
    "serve": "NODE_ENV=development npm run build:fast && npx serve -d dist -l 12345"
  }
}
```

### 1.2 GitHub Pages Deployment Requirements

**Static Hosting Optimizations**:
1. **404.html Fallback**: Essential for client-side routing support
2. **Base URL Configuration**: May need `base` property in vite.config.ts if deployed to subdirectory
3. **Asset Optimization**: Vite handles bundling and minification automatically
4. **HTTPS Enforcement**: GitHub Pages provides HTTPS by default

**Directory Structure After Build**:
```
dist/
├── index.html          # Main app entry
├── 404.html           # SPA fallback (copy of index.html)
├── assets/            # Optimized JS/CSS bundles
└── vite.svg          # Static assets
```

### 1.3 CI/CD Integration

**GitHub Actions Workflow Pattern** (from unified-ci.yml analysis):
- Build triggers on main branch pushes
- TypeScript compilation with `tsc && vite build`
- Artifact upload for 30-day retention
- Cross-platform testing (Ubuntu, macOS, Windows)

**Environment Variables Needed**:
- `CI=true` for optimized builds
- `NEXT_TELEMETRY_DISABLED=1` for performance
- Authentication variables for testing

## 2. Bodhi Extension Integration Architecture

### 2.1 Extension Library Integration

**Primary Dependency**:
```json
{
  "dependencies": {
    "@bodhiapp/bodhijs": "file:../bodhi-js",
    "react": "19.1.1",
    "react-dom": "19.1.1", 
    "react-router-dom": "7.7.1"
  }
}
```

**Core Integration Pattern**:
```typescript
// Main App.tsx structure
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from '@/pages/LandingPage';
import CallbackPage from '@/pages/CallbackPage';
import ApiTestPage from '@/pages/ApiTestPage';

function App() {
  return (
    <Router>
      <div className="App" style={{ padding: '2rem', textAlign: 'center' }}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/callback" element={<CallbackPage />} />
          <Route path="/api-test" element={<ApiTestPage />} />
        </Routes>
      </div>
    </Router>
  );
}
```

### 2.2 Platform Detection & Initialization

**Platform Detection Hook Pattern** (`usePlatformDetection.ts`):
```typescript
export interface PlatformDetectionState {
  status: 'detecting' | 'detected' | 'setup' | 'timeout' | 'error';
  platform: BodhiPlatform | null;
  client: BodhiExtClient | null;
  extensionId: string | null;
  error: string | null;
  platformState: BodhiPlatformState | null;
}

export function usePlatformDetection(): PlatformDetectionState {
  // Implementation handles:
  // 1. Extension detection with timeout (3000ms)
  // 2. Platform initialization
  // 3. Client creation when ready
  // 4. Error handling and retry logic
}
```

**Main Landing Page Integration**:
```typescript
function LandingPage() {
  const [platform, setPlatform] = useState<BodhiPlatform | null>(null);
  const [platformState, setPlatformState] = useState<BodhiPlatformState | null>(null);
  const [client, setClient] = useState<BodhiExtClient | null>(null);

  const initializePlatform = async () => {
    const newPlatform = new BodhiPlatform({ timeout: 3000 });
    const state = await newPlatform.initialize();
    
    setPlatform(newPlatform);
    setPlatformState(state);
    
    if (state.isReady()) {
      const newClient = newPlatform.getClient();
      setClient(newClient);
    }
  };

  // Platform ready check
  const isReady = platformState?.isReady() || false;
}
```

## 3. OAuth Authentication Implementation

### 3.1 OAuth Configuration Constants

**Authentication Configuration** (`utils/oauth.ts`):
```typescript
// OAuth configuration constants
const APP_CLIENT_ID = 'app-a05c53c5-3fc4-409d-833d-f4acc90e1611';
const BODHI_AUTH_URL = 'https://main-id.getbodhi.app';
const AUTH_REALM = 'bodhi';
const REDIRECT_URI = `${window.location.origin}/callback`;

// Storage keys for secure token management
const STORAGE_KEYS = {
  RESOURCE_SCOPE: 'bodhi_resource_scope',
  ACCESS_TOKEN: 'bodhi_access_token', 
  REFRESH_TOKEN: 'bodhi_refresh_token',
  CODE_VERIFIER: 'bodhi_code_verifier',
  STATE: 'bodhi_state',
  USER_INFO: 'bodhi_user_info',
} as const;
```

### 3.2 PKCE-Compliant OAuth Flow

**OAuth Manager Class Structure**:
```typescript
export class OAuthManager {
  private isExchangingTokens = false;

  // 1. Request resource access from extension
  async requestResourceAccess(bodhiExtClient: BodhiExtClient): Promise<string> {
    const response = await bodhiExtClient.sendApiRequest(
      'POST',
      '/bodhi/v1/auth/request-access',
      { app_client_id: APP_CLIENT_ID }
    );
    localStorage.setItem(STORAGE_KEYS.RESOURCE_SCOPE, response.body.scope);
    return response.body.scope;
  }

  // 2. Build authorization URL with PKCE
  async buildAuthUrl(): Promise<string> {
    const state = Utils.generateRandomString(32);
    const codeVerifier = Utils.generateRandomString(128);
    const codeChallenge = await Utils.generatePKCEChallenge(codeVerifier);
    
    // Store for callback processing
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

  // 3. Exchange authorization code for tokens
  async exchangeCodeForTokens(code: string, state: string): Promise<void> {
    // Includes duplicate exchange prevention
    // State parameter validation
    // Direct fetch to token endpoint
    // Secure token storage
  }
}
```

**PKCE Security Utilities**:
```typescript
class Utils {
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
```

### 3.3 Authentication State Management

**Authentication Hook Pattern** (`useAuthentication.ts`):
```typescript
export interface AuthenticationState {
  status: AuthState;
  userInfo: UserInfo | null;
  error: string | null;
  login: () => Promise<void>;
  logout: () => void;
}

export function useAuthentication(platformState: PlatformDetectionState): AuthenticationState {
  const [authStatus, setAuthStatus] = useState<AuthState>('unauthenticated');
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  // Authentication flow
  const login = async () => {
    if (!platformState.client) {
      setAuthError('Extension not available');
      return;
    }

    await oauthManager.requestResourceAccess(platformState.client);
    const authUrl = await oauthManager.buildAuthUrl();
    window.location.href = authUrl; // Redirect to OAuth provider
  };

  // Check existing authentication on extension availability
  useEffect(() => {
    if (platformState.status === 'detected' && platformState.client) {
      checkExistingAuth();
    }
  }, [platformState.status, platformState.client]);
}
```

### 3.4 OAuth Callback Processing

**Callback Page Implementation** (`CallbackPage.tsx`):
```typescript
function CallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [state, setState] = useState<ProcessingState>({ status: 'loading' });

  useEffect(() => {
    let mounted = true;

    const processCallback = async () => {
      try {
        // Extract OAuth response parameters
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');

        // Handle OAuth errors
        if (error) {
          setState({ status: 'error', message: `OAuth error: ${error}` });
          return;
        }

        // Validate required parameters
        if (!code || !state) {
          setState({ status: 'error', message: 'Missing OAuth parameters' });
          return;
        }

        // Exchange code for tokens
        setState({ status: 'processing', step: 'Exchanging authorization code...' });
        await oauthManager.exchangeCodeForTokens(code, state);
        
        // Success - redirect to main app
        setState({ status: 'success' });
        setTimeout(() => navigate('/'), 2000);
        
      } catch (error) {
        setState({ status: 'error', message: error.message });
      }
    };

    processCallback();
    return () => { mounted = false; };
  }, [searchParams, navigate]);

  // Render processing states with user feedback
}
```

## 4. User Interface Components

### 4.1 Platform Status Display

**Platform Status Section**:
```typescript
export function PlatformStatusSection({
  platform,
  platformState,
  isInitializing,
  onRetryInitialization,
  onShowOnboarding,
}: PlatformStatusSectionProps) {
  const isReady = platformState?.isReady() || false;

  const getStatus = () => {
    if (isInitializing) return { status: 'detecting', title: 'Detecting Platform...' };
    if (!platform) return { status: 'error', title: 'Platform Not Available' };
    if (isReady) return { status: 'detected', title: 'Platform Ready' };
    return { status: 'setup', title: 'Platform Setup Required' };
  };

  // Visual status indicators with retry functionality
  // Setup modal integration for detailed diagnostics
}
```

### 4.2 Authentication UI Components

**Authentication Status Section**:
```typescript
export function AuthenticationStatusSection({ authState, onNavigateToApiTest }) {
  return (
    <div className={`auth-status ${authState.status}`}>
      {/* Status indicators */}
      {authState.status === 'unauthenticated' && (
        <button onClick={authState.login}>Log In</button>
      )}
      
      {authState.status === 'authenticated' && (
        <>
          <UserInfoDisplay userInfo={authState.userInfo} />
          <button onClick={onNavigateToApiTest}>Go to API Test</button>
          <button onClick={authState.logout}>Log Out</button>
        </>
      )}
      
      {authState.status === 'authenticating' && (
        <div>Processing authentication...</div>
      )}
    </div>
  );
}
```

### 4.3 CSS Architecture

**Styling Approach** (from `index.css`):
- CSS custom properties for theming
- Dark/light mode support with `@media (prefers-color-scheme: light)`
- Status-based styling classes (`.extension-status.detected`, `.auth-status.authenticated`)
- Responsive design patterns
- Inline styles for dynamic state-dependent styling

## 5. Implementation Pattern Summary

### 5.1 Core Implementation Flow

1. **App Initialization**:
   - React Router setup with three routes
   - Platform detection on component mount
   - Extension availability checking

2. **Platform Integration**:
   - BodhiPlatform initialization with timeout
   - Platform state monitoring
   - Client creation when ready

3. **Authentication Flow**:
   - Resource access request via extension
   - PKCE OAuth URL generation
   - Browser redirect to OAuth provider
   - Callback processing and token exchange
   - User info fetching and storage

4. **State Management**:
   - Hook-based architecture
   - localStorage for persistence
   - Error handling and retry mechanisms
   - Loading states and user feedback

### 5.2 Key Dependencies

**Required Package Dependencies**:
```json
{
  "@bodhiapp/bodhijs": "file:../bodhi-js",  // Extension integration
  "react": "^19.1.1",                       // UI framework
  "react-dom": "^19.1.1",                   // DOM rendering
  "react-router-dom": "^7.7.1"              // Client-side routing
}
```

**Development Dependencies**:
```json
{
  "@vitejs/plugin-react": "^4.7.0",         // React build support
  "typescript": "5.8.3",                    // Type checking
  "vite": "7.0.6",                          // Build tool
  "eslint": "9.32.0"                        // Code linting
}
```

### 5.3 GitHub Pages Deployment Checklist

- ✅ Vite build configuration with 404.html copy plugin
- ✅ React Router configuration for SPA routing
- ✅ Asset optimization and bundling
- ✅ OAuth redirect URI configured for production domain
- ✅ Environment variable configuration for CI/CD
- ✅ Static file serving optimizations
- ✅ HTTPS enforcement (automatic with GitHub Pages)

### 5.4 Security Considerations

**OAuth Security**:
- PKCE implementation prevents authorization code interception
- State parameter validation prevents CSRF attacks
- Secure token storage in localStorage
- Token expiration handling
- Resource scope validation

**Extension Security**:
- Extension ID validation
- Timeout handling for extension detection
- Error boundary implementation
- Secure API communication patterns

## 6. Testing & Validation Patterns

Based on the CI/CD workflow analysis:
- **Cross-platform testing**: Ubuntu, macOS, Windows
- **Browser automation**: Playwright integration
- **Build validation**: Artifact verification
- **Integration testing**: Full OAuth flow testing
- **Extension compatibility**: Real browser extension testing

This context document provides the complete foundation for implementing GitHub Pages deployment and Bodhi extension login functionality following proven patterns from the bodhijs-test-app.