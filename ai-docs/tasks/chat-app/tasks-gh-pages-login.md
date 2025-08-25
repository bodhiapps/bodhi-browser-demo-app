# Tasks: GitHub Pages Deployment & Bodhi OAuth 2.1 Login Implementation

## Overview

This document provides detailed, item-wise tasks to implement GitHub Pages deployment and Bodhi platform OAuth 2.1 login functionality. The tasks are logically grouped and sequenced to ensure a smooth implementation process while maintaining a working application at each stage.

**Current State**: React Router v7 (framework mode) with SSR, basic Tailwind CSS  
**Target State**: Static React SPA with Vite build, GitHub Pages deployment, Bodhi extension OAuth integration

## Phase 1: Project Architecture Migration

### 1.1 Dependency Management & Build System Migration

**Task 1.1.1: Update package.json dependencies**
- Remove React Router v7 framework dependencies:
  - `@react-router/node`
  - `@react-router/serve`
  - `@react-router/dev`
- Add standard React + Vite dependencies:
  ```json
  {
    "dependencies": {
      "react": "^19.1.0",
      "react-dom": "^19.1.0", 
      "react-router-dom": "^7.7.1"
    },
    "devDependencies": {
      "@vitejs/plugin-react": "^4.7.0",
      "vite": "^6.3.3",
      "@types/react": "^19.1.2",
      "@types/react-dom": "^19.1.2",
      "typescript": "^5.8.3",
      "tailwindcss": "^4.1.4",
      "@tailwindcss/vite": "^4.1.4",
      "rimraf": "^6.0.1"
    }
  }
  ```

**Task 1.1.2: Update build scripts in package.json**
- Replace React Router v7 scripts with standard Vite scripts:
  ```json
  {
    "scripts": {
      "clean": "rimraf dist",
      "dev": "vite",
      "build": "tsc && vite build",
      "preview": "vite preview",
      "typecheck": "tsc --noEmit",
      "lint": "eslint . --ext .js,.jsx,.ts,.tsx",
      "lint:fix": "eslint . --ext .js,.jsx,.ts,.tsx --fix"
    }
  }
  ```

**Task 1.1.3: Create new vite.config.ts for GitHub Pages**
- Create vite.config.ts with GitHub Pages optimization:
  ```typescript
  import { defineConfig } from 'vite';
  import react from '@vitejs/plugin-react';
  import tailwindcss from '@tailwindcss/vite';
  import { copyFileSync } from 'fs';
  import { resolve } from 'path';

  export default defineConfig({
    plugins: [
      tailwindcss(),
      react(),
      {
        name: 'copy-index-as-404',
        writeBundle() {
          // Essential for GitHub Pages SPA routing
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
      port: 3000,
      host: true,
    },
    preview: {
      port: 3000,
      host: true,
    },
  });
  ```

**Task 1.1.4: Remove React Router v7 configuration files**
- Delete `react-router.config.ts`
- Remove `app/routes.ts`
- Clean up React Router v7 specific configurations

### 1.2 Project Structure Migration

**Task 1.2.1: Create new project structure**
- Create standard React project structure:
  ```
  src/
  ├── main.tsx              # React app entry point
  ├── App.tsx               # Main app component with router
  ├── index.css             # Global styles with Tailwind
  ├── components/           # Reusable UI components
  ├── hooks/                # Custom React hooks
  ├── pages/                # Page components
  ├── lib/                  # Utility libraries
  └── types/                # TypeScript type definitions
  ```

**Task 1.2.2: Create public/index.html**
- Create standard HTML entry point:
  ```html
  <!doctype html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <link rel="icon" type="image/svg+xml" href="/favicon.ico" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Bodhi Browser Demo App</title>
    </head>
    <body>
      <div id="root"></div>
      <script type="module" src="/src/main.tsx"></script>
    </body>
  </html>
  ```

**Task 1.2.3: Create src/main.tsx**
- Create React application entry point:
  ```typescript
  import React from 'react';
  import ReactDOM from 'react-dom/client';
  import App from './App.tsx';
  import './index.css';

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  ```

**Task 1.2.4: Migrate existing content to new structure**
- Move `app/welcome/` content to `src/components/welcome/`
- Update import paths and component structure
- Preserve existing Tailwind styling
- Test that migration works with `npm run dev`

### 1.3 Routing Setup

**Task 1.3.1: Create App.tsx with React Router**
- Implement basic routing structure following bodhijs-test-app pattern:
  ```typescript
  import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
  import HomePage from '@/pages/HomePage';
  import CallbackPage from '@/pages/CallbackPage';

  function App() {
    return (
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/callback" element={<CallbackPage />} />
          </Routes>
        </div>
      </Router>
    );
  }

  export default App;
  ```

**Task 1.3.2: Create initial page components**
- Create `src/pages/HomePage.tsx` with migrated welcome content
- Create `src/pages/CallbackPage.tsx` placeholder for OAuth callback
- Ensure routing works correctly with development server

**Task 1.3.3: Update global CSS for new structure**
- Migrate `app/app.css` content to `src/index.css`
- Ensure Tailwind CSS continues working
- Add any additional global styles needed

## Phase 2: Bodhi Extension Integration Foundation

### 2.1 Bodhi Platform Dependencies

**Task 2.1.1: Identify and plan Bodhi library integration**
- Research available Bodhi extension libraries
- Determine if we need to create local extension client library
- Plan integration approach based on available packages
- Document dependency strategy

**Task 2.1.2: Create extension client library structure**
- Create `src/lib/extension-client.ts` following bodhijs-test-app pattern
- Implement basic types and interfaces:
  ```typescript
  export interface ExtensionClient {
    getExtensionId(): string;
    sendApiRequest(method: string, endpoint: string, body?: any, headers?: Record<string, string>): Promise<ApiResponse>;
    sendStreamRequest(method: string, endpoint: string, body?: any, headers?: Record<string, string>): Promise<AsyncIterable<StreamChunk>>;
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
  ```

**Task 2.1.3: Implement extension detection logic**
- Create extension detection with timeout handling:
  ```typescript
  export async function loadExtensionClient(config: { timeout?: number } = {}): Promise<ExtensionClient> {
    const timeout = config.timeout ?? 10000;
    
    // Step 1: Poll for window.bodhiext availability
    const extensionDetected = await new Promise<boolean>(resolve => {
      const checkExtension = () => {
        if (typeof window.bodhiext !== 'undefined') {
          resolve(true);
          return;
        }
        setTimeout(checkExtension, 100);
      };
      checkExtension();
      setTimeout(() => resolve(false), timeout);
    });

    if (!extensionDetected) {
      throw new ExtensionNotFoundError(timeout);
    }

    // Step 2: Get extension client
    const extensionId = await window.bodhiext!.getExtensionId();
    return new ExtensionClientImpl(extensionId);
  }
  ```

### 2.2 Platform Detection Hooks

**Task 2.2.1: Create usePlatformDetection hook**
- Create `src/hooks/usePlatformDetection.ts`:
  ```typescript
  export interface PlatformDetectionState {
    status: 'detecting' | 'detected' | 'setup' | 'timeout' | 'error';
    client: ExtensionClient | null;
    extensionId: string | null;
    error: string | null;
  }

  export function usePlatformDetection(): PlatformDetectionState {
    // Implementation following bodhijs-test-app pattern
    // Extension detection with timeout
    // Error handling and retry mechanisms
    // Status state management
  }
  ```

**Task 2.2.2: Create platform status components**
- Create `src/components/PlatformStatusSection.tsx`
- Implement status display with visual indicators:
  - Detecting: Loading spinner
  - Detected: Success checkmark
  - Setup: Warning with action button
  - Error: Error message with retry button
- Include retry functionality and setup modal triggers

**Task 2.2.3: Test extension detection**
- Verify extension detection works with Bodhi browser extension installed
- Test timeout handling when extension is not available
- Test error states and recovery mechanisms
- Ensure user feedback is clear and actionable

## Phase 3: OAuth 2.1 PKCE Implementation

### 3.1 OAuth Utilities and Constants

**Task 3.1.1: Create OAuth configuration**
- Create `src/lib/oauth.ts` with configuration constants:
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

**Task 3.1.2: Implement PKCE security utilities**
- Create cryptographic utilities for PKCE:
  ```typescript
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
  ```

**Task 3.1.3: Define OAuth types and interfaces**
- Create comprehensive type definitions:
  ```typescript
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
  ```

### 3.2 OAuth Manager Implementation

**Task 3.2.1: Implement OAuth flow methods**
- Create `OAuthManager` class with core methods:
  ```typescript
  export class OAuthManager {
    private isExchangingTokens = false;

    async requestResourceAccess(extensionClient: ExtensionClient): Promise<string> {
      // Request resource scope from Bodhi platform via extension
    }

    async buildAuthUrl(): Promise<string> {
      // Generate PKCE parameters and build OAuth authorization URL
    }

    async exchangeCodeForTokens(code: string, state: string): Promise<void> {
      // Exchange authorization code for access token with PKCE verification
    }
  }
  ```

**Task 3.2.2: Implement token management**
- Add token storage and retrieval methods:
  ```typescript
  getAccessToken(): string | null
  isAuthenticated(): boolean
  getUserInfo(): UserInfo | null
  setUserInfo(userInfo: UserInfo): void
  logout(): void
  ```

**Task 3.2.3: Add user info fetching**
- Implement API call to fetch user information:
  ```typescript
  async fetchUserInfo(extensionClient: ExtensionClient): Promise<UserInfo> {
    // Use extension client to call user info API with stored access token
  }
  ```

**Task 3.2.4: Implement security safeguards**
- Add duplicate token exchange prevention
- Implement state parameter validation
- Add timeout handling for token exchange
- Ensure secure token storage practices

### 3.3 Authentication Hook Implementation

**Task 3.3.1: Create useAuthentication hook**
- Create `src/hooks/useAuthentication.ts`:
  ```typescript
  export interface AuthenticationState {
    status: AuthState;
    userInfo: UserInfo | null;
    error: string | null;
    login: () => Promise<void>;
    logout: () => void;
  }

  export function useAuthentication(platformState: PlatformDetectionState): AuthenticationState {
    // Integrates with platform detection
    // Manages authentication state
    // Handles login/logout flows
    // Provides error handling
  }
  ```

**Task 3.3.2: Implement authentication state management**
- Add state variables for auth status, user info, and errors
- Implement effect hooks for checking existing authentication
- Add automatic token refresh logic if needed
- Handle authentication state persistence

**Task 3.3.3: Implement login flow**
- Create login method that:
  - Validates extension availability
  - Requests resource access
  - Builds OAuth URL
  - Redirects to OAuth provider
  - Handles errors gracefully

**Task 3.3.4: Implement logout functionality**
- Create logout method that:
  - Clears stored tokens and user info
  - Resets authentication state
  - Provides user feedback
  - Handles cleanup properly

## Phase 4: OAuth Callback Processing

### 4.1 Callback Page Implementation

**Task 4.1.1: Create callback processing states**
- Define processing state types:
  ```typescript
  type ProcessingState =
    | { status: 'loading' }
    | { status: 'processing'; step: string }
    | { status: 'success' }
    | { status: 'error'; message: string };
  ```

**Task 4.1.2: Implement callback parameter extraction**
- Extract and validate OAuth response parameters:
  ```typescript
  const code = searchParams.get('code');
  const state = searchParams.get('state'); 
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');
  ```

**Task 4.1.3: Add OAuth error handling**
- Handle OAuth provider errors:
  - Access denied by user
  - Invalid client configuration
  - Server errors
  - Network timeouts
- Provide clear error messages to users

**Task 4.1.4: Implement token exchange in callback**
- Process successful OAuth callback:
  ```typescript
  const processCallback = async () => {
    setState({ status: 'processing', step: 'Exchanging authorization code...' });
    await oauthManager.exchangeCodeForTokens(code, state);
    setState({ status: 'success' });
    setTimeout(() => navigate('/'), 2000);
  };
  ```

### 4.2 Callback UI Components

**Task 4.2.1: Create callback processing UI**
- Implement processing states display:
  - Loading spinner for initial state
  - Progress indicators for token exchange
  - Success confirmation with redirect notice
  - Error display with retry options

**Task 4.2.2: Add user feedback elements**
- Create progress indicators showing current step
- Add estimated time remaining for processes
- Include helpful explanatory text
- Implement accessibility features (ARIA labels, screen reader support)

**Task 4.2.3: Implement navigation controls**
- Add "Return to Home" button
- Include retry functionality for errors
- Handle automatic redirect after success
- Prevent double-processing of callbacks

## Phase 5: UI Components and Integration

### 5.1 Authentication Status Components

**Task 5.1.1: Create AuthenticationStatusSection component**
- Implement authentication status display:
  ```typescript
  interface AuthenticationStatusSectionProps {
    authState: AuthenticationState;
    onNavigateToApiTest?: () => void;
  }
  ```
- Show current authentication status with visual indicators
- Display user information when authenticated
- Provide login/logout action buttons

**Task 5.1.2: Implement user information display**
- Show user email and role when authenticated
- Format user data in readable layout
- Add user avatar/profile picture if available
- Include token information for debugging (dev mode only)

**Task 5.1.3: Add authentication action buttons**
- Login button for unauthenticated state
- Logout button for authenticated state
- Loading state during authentication process
- Error state with retry functionality

### 5.2 Main Application Integration

**Task 5.2.1: Update HomePage with platform and auth components**
- Integrate platform status section
- Add authentication status section
- Implement proper loading states
- Handle error states gracefully

**Task 5.2.2: Create app-wide state management**
- Consider context providers for shared state
- Implement error boundaries
- Add global loading states
- Handle app-wide notifications/toasts

**Task 5.2.3: Implement navigation and routing logic**
- Add navigation guards for authenticated routes
- Implement automatic redirects based on auth state
- Handle deep linking and route preservation
- Add breadcrumb navigation if needed

## Phase 6: GitHub Pages Deployment Setup

### 6.1 GitHub Actions Workflow

**Task 6.1.1: Create GitHub Actions workflow**
- Create `.github/workflows/deploy.yml`:
  ```yaml
  name: Deploy to GitHub Pages

  on:
    push:
      branches: [ main ]
    workflow_dispatch:

  permissions:
    contents: read
    pages: write
    id-token: write

  concurrency:
    group: "pages"
    cancel-in-progress: false

  jobs:
    build:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v4
        - uses: actions/setup-node@v4
          with:
            node-version: '18'
            cache: 'npm'
        - run: npm ci
        - run: npm run build
        - uses: actions/upload-pages-artifact@v3
          with:
            path: ./dist

    deploy:
      environment:
        name: github-pages
        url: ${{ steps.deployment.outputs.page_url }}
      runs-on: ubuntu-latest
      needs: build
      steps:
        - uses: actions/deploy-pages@v4
          id: deployment
  ```

**Task 6.1.2: Configure repository settings**
- Enable GitHub Pages in repository settings
- Configure Pages source to GitHub Actions
- Set up custom domain if needed
- Configure HTTPS enforcement

**Task 6.1.3: Test deployment workflow**
- Verify workflow runs successfully
- Check that built assets are correct
- Verify SPA routing works with 404.html fallback
- Test OAuth callback URLs work with deployed domain

### 6.2 Production Configuration

**Task 6.2.1: Update OAuth configuration for production**
- Configure production redirect URIs
- Update OAuth client settings if needed
- Test OAuth flow with production domain
- Verify extension integration works in production

**Task 6.2.2: Add environment-specific configuration**
- Create environment variable handling
- Configure different settings for dev/prod
- Add build-time configuration
- Implement feature flags if needed

**Task 6.2.3: Optimize for production**
- Configure bundle optimization
- Add performance monitoring
- Implement error tracking
- Add analytics if required

## Phase 7: Testing and Validation

### 7.1 End-to-End Testing

**Task 7.1.1: Test complete OAuth flow**
- Test login process from start to finish
- Verify token storage and retrieval
- Test logout functionality
- Verify user information display

**Task 7.1.2: Test extension integration**
- Verify extension detection works
- Test API calls through extension
- Test error handling when extension unavailable
- Verify retry mechanisms work

**Task 7.1.3: Test GitHub Pages deployment**
- Verify app loads correctly from GitHub Pages
- Test all routes work with client-side routing
- Test OAuth callback handling in production
- Verify assets load correctly

### 7.2 Error Handling Validation

**Task 7.2.1: Test error scenarios**
- Extension not installed
- OAuth authorization denied
- Network errors during token exchange
- Invalid or expired tokens

**Task 7.2.2: Test edge cases**
- Multiple tab scenarios
- Browser back/forward navigation
- Page refresh during authentication
- Concurrent authentication attempts

**Task 7.2.3: Validate security measures**
- Verify PKCE implementation
- Test state parameter validation
- Check token storage security
- Validate error message safety (no sensitive info exposure)

## Phase 8: Documentation and Cleanup

### 8.1 Documentation

**Task 8.1.1: Update README.md**
- Document new build process
- Explain OAuth configuration
- Add development setup instructions
- Include deployment instructions

**Task 8.1.2: Add code documentation**
- Document OAuth flow and security measures
- Add JSDoc comments to public APIs
- Document environment variables
- Create troubleshooting guide

**Task 8.1.3: Create user documentation**
- Add instructions for users
- Document browser extension requirements
- Explain authentication process
- Add FAQ for common issues

### 8.2 Final Cleanup

**Task 8.2.1: Clean up old files**
- Remove unused React Router v7 files
- Clean up obsolete configuration
- Remove temporary files
- Update .gitignore if needed

**Task 8.2.2: Code review and optimization**
- Review all implementation for best practices
- Optimize bundle size
- Clean up unused dependencies
- Standardize code style

**Task 8.2.3: Final testing**
- Comprehensive testing of all features
- Performance testing
- Cross-browser compatibility
- Mobile responsiveness

## Success Criteria

Upon completion of all tasks:

1. ✅ **GitHub Pages Deployment**: App successfully deploys to GitHub Pages with automatic CI/CD
2. ✅ **SPA Routing**: Client-side routing works correctly with 404.html fallback
3. ✅ **Extension Integration**: Bodhi browser extension is detected and integrated
4. ✅ **OAuth 2.1 Login**: PKCE-compliant OAuth flow works end-to-end
5. ✅ **User Authentication**: Users can log in, view profile, and log out
6. ✅ **Error Handling**: Graceful error handling for all failure scenarios
7. ✅ **Security**: PKCE implementation and secure token storage
8. ✅ **Production Ready**: Optimized build and proper production configuration

## Risk Mitigation

- **Extension Availability**: Implement graceful fallbacks when extension is not available
- **OAuth Errors**: Comprehensive error handling for all OAuth failure scenarios
- **Build Issues**: Maintain working application at each implementation stage
- **Security**: Follow OAuth 2.1 and PKCE best practices throughout
- **Deployment**: Test deployment workflow early and often

This task structure ensures systematic implementation while maintaining a working application throughout the development process.