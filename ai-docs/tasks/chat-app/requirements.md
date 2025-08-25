# Chat App Implementation Requirements

## Overview

This document outlines the comprehensive requirements for implementing a chat interface that replicates the UI/UX from the original Bodhi chat app while integrating with the Bodhi browser extension instead of direct API calls.

## Source Analysis Summary

### Original Chat App Analysis
**Location**: `/Users/amir36/Documents/workspace/src/github.com/BodhiSearch/BodhiApp/crates/bodhi/src/app/ui/chat`

**Key Components**:
- `page.tsx`: Main chat page with dual sidebar architecture (history + settings)
- `ChatUI.tsx`: Core chat interface with input, message display, and empty state
- `ChatMessage.tsx`: Individual message component with user/assistant distinction and metadata
- `ChatHistory.tsx`: Sidebar showing chat history grouped by time periods
- `NewChatButton.tsx`: Button for creating new chat sessions
- `settings/`: Folder with various settings components (AliasSelector, SettingsSidebar, etc.)

**UI Architecture**:
- Three-panel layout: Chat history (left) + Main chat (center) + Settings (right)
- Responsive design with collapsible sidebars
- Real-time message streaming with loading states
- Empty state for new conversations
- Message metadata display (tokens, timing information)

### Extension Integration Patterns
**Location**: `/Users/amir36/Documents/workspace/src/github.com/BodhiSearch/bodhi-browser/ext-test-app`

**Key Integration Points**:
- `libbodhiext.ts`: Typed wrapper for `window.bodhiext` API
- OAuth flow with PKCE support
- Extension detection with timeout handling
- API request and streaming capabilities
- Callback page for OAuth completion

### Deployment Patterns
**Location**: `/Users/amir36/Documents/workspace/src/github.com/BodhiSearch/bodhi-browser/bodhijs-test-app`

**GitHub Pages Configuration**:
- Vite-based build system with React
- 404.html fallback for client-side routing
- Static hosting optimizations
- Build automation with Makefile

## Implementation Requirements

### 1. UI/UX Components

#### 1.1 Layout Structure
- **Three-panel responsive layout**:
  - Left sidebar: Chat history with collapsible functionality
  - Center panel: Main chat interface
  - Right sidebar: Settings panel (collapsible)
- **Mobile-first responsive design** with appropriate breakpoints
- **Sidebar state persistence** using localStorage
- **Smooth animations** for sidebar transitions

#### 1.2 Chat Interface Components

**Main Chat Component (`ChatUI`)**:
- Message display area with scroll management
- Input textarea with auto-resize functionality
- Send button with loading states
- Empty state for new conversations
- Real-time streaming message display

**Message Component (`ChatMessage`)**:
- User/assistant message distinction with icons (User/Bot from lucide-react)
- Markdown rendering support for assistant messages
- Copy functionality for assistant messages
- Message metadata display (tokens, timing) - adapt for extension responses
- Streaming message animation

**Chat History Component (`ChatHistory`)**:
- Time-based grouping (Today, Yesterday, Previous 7 days)
- Chat title generation and display
- Delete chat functionality
- Current chat highlighting
- Empty state handling

**New Chat Component (`NewChatButton`)**:
- Prominent new chat creation
- Keyboard shortcut support
- Integration with chat state management

#### 1.3 Settings Components

**Settings Sidebar**:
- Model/alias selection (adapt for extension-available models)
- System prompt configuration
- Parameter controls (temperature, max tokens, etc.)
- Stop words configuration
- Settings persistence

### 2. Tailwind CSS + shadcn/ui Setup

#### 2.1 Dependencies Installation
```json
{
  "dependencies": {
    "@radix-ui/react-dialog": "^1.1.2",
    "@radix-ui/react-dropdown-menu": "^2.1.15",
    "@radix-ui/react-label": "^2.1.7",
    "@radix-ui/react-popover": "^1.1.14",
    "@radix-ui/react-scroll-area": "^1.2.9",
    "@radix-ui/react-select": "^2.2.5",
    "@radix-ui/react-separator": "^1.1.7",
    "@radix-ui/react-slider": "^1.3.5",
    "@radix-ui/react-slot": "^1.2.3",
    "@radix-ui/react-switch": "^1.2.5",
    "@radix-ui/react-toast": "^1.2.14",
    "@radix-ui/react-tooltip": "^1.2.7",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.1",
    "cmdk": "^1.0.0",
    "lucide-react": "^0.515.0",
    "react-markdown": "^9.1.0",
    "tailwind-merge": "^2.6.0",
    "tailwindcss-animate": "^1.0.7",
    "vaul": "^1.1.2"
  },
  "devDependencies": {
    "@tailwindcss/typography": "^0.5.16",
    "tailwindcss": "^3.4.17"
  }
}
```

#### 2.2 Configuration Files

**tailwind.config.ts**: 
- Copy complete configuration from original app
- Include all custom color variables and animations
- Typography plugin configuration
- Sidebar-specific styling variables

**components.json**:
- shadcn/ui configuration with TypeScript support
- Component alias setup (@/components, @/lib/utils)
- CSS variables approach for theming

**globals.css**:
- Complete CSS variable definitions for light/dark themes
- Base component styles
- Custom utility classes
- Animation keyframes

#### 2.3 Core UI Components
Create the following shadcn/ui components:
- Button, Input, Textarea, Label
- Dialog, Dropdown Menu, Popover, Select
- Scroll Area, Separator, Sidebar
- Slider, Switch, Toast, Tooltip
- Card, Badge, Alert
- Custom components: Markdown renderer, Code block

### 3. Extension Integration

#### 3.1 Extension Client Library
**File**: `lib/extension-client.ts`

Copy and adapt `libbodhiext.ts`:
```typescript
export class ExtensionClient {
  // Extension detection and initialization
  // API request methods (sendApiRequest, sendStreamRequest)
  // Error handling classes
  // Server state management
}

export async function loadExtensionClient(): Promise<ExtensionClient>
```

#### 3.2 OAuth Integration
**Files**: 
- `lib/oauth.ts`: OAuth utilities and PKCE implementation
- `routes/callback.tsx`: OAuth callback handling page

**Requirements**:
- PKCE-compliant OAuth 2.0 flow
- Secure token storage in localStorage
- State parameter validation
- Error handling for OAuth failures
- Automatic redirect after successful authentication

#### 3.3 API Integration Patterns
Replace direct API calls with extension-mediated requests:
- Chat completions via `sendStreamRequest`
- Model list retrieval via `sendApiRequest`
- Settings and preferences via extension API
- Authentication status via extension OAuth integration

### 4. State Management

#### 4.1 Chat State Management
**Hook**: `hooks/use-chat.ts`
- Message history management
- Streaming message handling
- Input state management
- Loading states for API calls
- Error handling and recovery

#### 4.2 Chat Database/Storage
**Hook**: `hooks/use-chat-db.ts`
- LocalStorage-based chat persistence
- Chat CRUD operations
- Chat history management
- Import/export functionality

#### 4.3 Settings Management
**Hook**: `hooks/use-chat-settings.ts`
- Model selection persistence
- Parameter configuration
- System prompt management
- Settings validation

#### 4.4 Extension State
**Hook**: `hooks/use-extension.ts`
- Extension detection status
- Authentication state management  
- Server connectivity status
- Error handling and retry logic

### 5. React Router Integration

#### 5.1 Route Structure
```
/                    - Main chat interface
/callback            - OAuth callback handling
/settings            - Settings management (optional separate page)
```

#### 5.2 Route Components
- **Home Route**: Main chat interface with three-panel layout
- **Callback Route**: OAuth processing and redirection
- **Error Boundaries**: Comprehensive error handling for each route

### 6. GitHub Pages Deployment

#### 6.1 Build Configuration
**vite.config.ts**:
```typescript
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-index-as-404',
      writeBundle() {
        // Copy index.html as 404.html for SPA routing support
        copyFileSync('dist/index.html', 'dist/404.html');
      },
    },
  ],
  base: '/bodhi-browser-demo-app/', // GitHub Pages subdirectory
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});
```

#### 6.2 GitHub Actions Workflow
Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      - run: npm ci
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

#### 6.3 Deployment Requirements
- Static file optimization
- Proper MIME type handling
- HTTPS enforcement
- Cache headers configuration
- Error page fallbacks

### 7. Development Workflow

#### 7.1 Project Setup
1. Install Tailwind CSS and shadcn/ui dependencies
2. Configure Tailwind with complete theme system
3. Setup shadcn/ui components with proper aliases
4. Create directory structure for hooks, components, and utilities

#### 7.2 Implementation Phases

**Phase 1: Core UI Setup**
- Install and configure Tailwind + shadcn/ui
- Create basic layout components
- Implement responsive sidebar system
- Setup routing with React Router

**Phase 2: Extension Integration**
- Port extension client library
- Implement extension detection
- Setup OAuth flow and callback handling
- Create authentication state management

**Phase 3: Chat Functionality**
- Implement chat interface components
- Create message display and input handling
- Setup streaming message support
- Add chat history and persistence

**Phase 4: Advanced Features**
- Implement settings management
- Add model selection and parameters
- Create system prompt configuration
- Add metadata display and copy functionality

**Phase 5: Deployment**
- Configure GitHub Pages deployment
- Setup build optimization
- Test OAuth flow in production environment
- Performance optimization and error handling

### 8. Key Differences from Original

#### 8.1 API Integration
- **Original**: Direct HTTP calls to Bodhi server API
- **New**: Extension-mediated API calls via `window.bodhiext`

#### 8.2 Authentication
- **Original**: Direct OAuth with Bodhi server
- **New**: Extension-managed OAuth with callback handling

#### 8.3 Deployment
- **Original**: Next.js application with server-side capabilities
- **New**: Static React SPA deployed to GitHub Pages

#### 8.4 State Management
- **Original**: Next.js with server state integration
- **New**: Pure client-side state with localStorage persistence

### 9. Testing Strategy

#### 9.1 Unit Testing
- Component rendering and interaction tests
- Hook functionality tests
- Extension client library tests
- OAuth flow unit tests

#### 9.2 Integration Testing
- End-to-end OAuth flow testing
- Extension integration testing
- Chat functionality testing
- Responsive design testing

#### 9.3 Deployment Testing
- GitHub Pages deployment verification
- Extension compatibility testing
- Cross-browser compatibility
- Performance testing

### 10. Performance Considerations

#### 10.1 Bundle Optimization
- Code splitting for routes
- Lazy loading of components
- Tree shaking for unused dependencies
- Asset optimization and compression

#### 10.2 Runtime Performance
- Message virtualization for large chat histories
- Debounced input handling
- Efficient re-rendering strategies
- Memory leak prevention

#### 10.3 Loading States
- Progressive loading of chat components
- Extension detection feedback
- Message streaming indicators
- Error boundary fallbacks

## Success Criteria

1. **Visual Parity**: UI/UX matches original chat app design and functionality
2. **Extension Integration**: Seamless communication with Bodhi browser extension
3. **OAuth Flow**: Secure and reliable authentication process
4. **GitHub Pages**: Successful deployment with proper routing support
5. **Performance**: Fast loading and responsive interactions
6. **Error Handling**: Graceful degradation and user feedback
7. **Mobile Support**: Fully responsive design across all device sizes
8. **Accessibility**: WCAG-compliant interface with proper keyboard navigation

## Implementation Timeline

- **Week 1**: UI setup and core components
- **Week 2**: Extension integration and OAuth
- **Week 3**: Chat functionality and state management  
- **Week 4**: Advanced features and testing
- **Week 5**: Deployment and optimization

This requirements document provides a comprehensive roadmap for implementing the chat app with all necessary technical details and considerations.