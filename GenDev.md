# Sample Client for Amazon Bedrock - Development Guide

## Project Overview

**Sample Client for Amazon Bedrock** is a cross-platform chat client specifically designed to work with AWS Bedrock's foundation models, particularly Claude models. It's forked from ChatGPT-Next-Web and simplified to support AWS Bedrock exclusively.

### Key Information
- **Version**: 1.2.6 (Tauri), 1.11.2 (Electron), 1.2.3 (Flutter)
- **License**: MIT-0
- **Repository**: https://github.com/aws-samples/sample-client-for-amazon-bedrock
- **Purpose**: Sample/demonstration project, NOT production-ready

## Architecture & Technology Stack

### Core Technologies
- **Frontend**: Next.js 13.4.9 + React 18.2.0 + TypeScript 5.2.2
- **State Management**: Zustand 4.3.8
- **Styling**: SCSS modules + CSS variables
- **Build System**: Next.js with custom export modes

### Multi-Platform Support
1. **Web Application**: Next.js standalone/export builds
2. **Desktop Apps**: 
   - Tauri (Rust-based, primary desktop solution)
   - Electron (Node.js-based, alternative)
3. **Mobile Apps**: Flutter (iOS/Android)
4. **PWA**: Progressive Web App support

### AWS Integration
- **Primary SDK**: @aws-sdk/client-bedrock-runtime ^3.755.0
- **Authentication**: 
  - AWS Access Keys (AK/SK)
  - AWS Cognito integration
  - Session tokens support
- **Supported Models**: Claude 3 Sonnet, Claude 3 Haiku, Claude 3.7 Sonnet
- **Streaming**: Configurable per-model streaming support (default: enabled)

## Project Structure

```
├── app/                          # Next.js app directory
│   ├── components/              # React components
│   │   ├── home.tsx            # Main application shell
│   │   ├── chat.tsx            # Chat interface
│   │   ├── settings.tsx        # Configuration UI
│   │   └── model-config.tsx    # Model configuration
│   ├── client/                 # API clients
│   │   └── platforms/          # Platform-specific implementations
│   │       ├── aws.ts          # AWS Bedrock integration
│   │       ├── aws_cognito.ts  # Cognito authentication
│   │       └── aws_utils.ts    # AWS utilities
│   ├── store/                  # Zustand state management
│   │   ├── config.ts           # App configuration
│   │   ├── chat.ts             # Chat state
│   │   ├── access.ts           # Authentication state
│   │   └── mask.ts             # Chat templates/masks
│   ├── locales/                # Internationalization (20+ languages)
│   └── styles/                 # SCSS stylesheets
├── src-tauri/                  # Tauri desktop app
├── electron-app/               # Electron desktop app
├── flutter_app/                # Flutter mobile app
├── cloudformation/             # AWS deployment templates
└── docs/                       # Documentation
```

## Key Features

### Chat Functionality
- **Multi-model Support**: Claude 3 Sonnet, Haiku, and 3.7 Sonnet
- **Streaming Responses**: Real-time response streaming (configurable per model)
- **Message History**: Persistent chat history with compression
- **Templates/Masks**: Pre-configured chat templates
- **File Upload**: Support for documents (PDF, Word, Excel)
- **Image Support**: Vision model capabilities
- **Export/Import**: Chat history and configuration management

### Configuration Management
- **Model Configuration**: Temperature, top_p, max_tokens, presence/frequency penalty
- **Custom Models**: JSON-based model configuration loading
- **Streaming Control**: Per-model streaming configuration
- **Theme Support**: Auto/Dark/Light themes
- **Multi-language**: 20+ language support

### Authentication & Security
- **AWS Credentials**: Access Key/Secret Key authentication
- **AWS Cognito**: Federated authentication support
- **Session Management**: Token refresh and expiration handling
- **Regional Support**: Configurable AWS regions

### Deployment Options
1. **Local Development**: `yarn dev` for web, `yarn app:dev` for desktop
2. **Self-hosted**: Docker, Vercel, Cloudflare Pages
3. **AWS Cloud**: CloudFormation templates for web deployment
4. **Desktop Distribution**: Pre-built installers for Windows/Mac/Linux
5. **Mobile**: APK for Android, iOS builds

## Development Workflow

### Setup Commands
```bash
# Install dependencies
yarn install

# Development modes
yarn dev                    # Web development server
yarn app:dev              # Tauri desktop development
yarn app:electron-dev     # Electron development

# Build commands
yarn build                 # Web production build
yarn export               # Static export for deployment
yarn app:build           # Tauri desktop build
yarn app:electron-build  # Electron build
yarn app_android:build   # Android APK build
```

### Environment Configuration
- **AWS Region**: Configurable via UI settings
- **Bedrock Endpoint**: Optional custom endpoint
- **Proxy Support**: BRProxy integration for enterprise environments
- **Build Modes**: standalone, export, development

## State Management

### Store Structure (Zustand)
- **config.ts**: App configuration, model settings, UI preferences
- **chat.ts**: Chat sessions, message history, conversation state
- **access.ts**: Authentication credentials, AWS configuration
- **mask.ts**: Chat templates and prompt management
- **sync.ts**: Data synchronization (future feature)

### Configuration Schema
```typescript
DEFAULT_CONFIG = {
  modelConfig: {
    model: "claude-3-sonnet",
    temperature: 0.5,
    top_p: 1,
    max_tokens: 4000,
    support_streaming: true,
    reasoning_config: { type: "enabled", budget_tokens: 1024 }
  }
}
```

## Recent Development History

### Model Configuration Enhancements (2025-08-14)
- Added local JSON file loading for model configurations
- Implemented file validation and error handling
- Enhanced UI with upload functionality

### Streaming Configuration System (2025-08-19)
- Implemented per-model streaming configuration
- Added automatic configuration inheritance
- Changed default streaming behavior to enabled
- Added comprehensive migration logic for backward compatibility

## Deployment Architecture

### CloudFormation Templates
1. **BRClientWebDeploy.json**: Basic web deployment with AK/SK
2. **BRClientWebDeployCognito.json**: Web deployment with Cognito authentication
3. **BRConnector Integration**: Enterprise proxy deployment

### Platform-Specific Builds
- **Tauri**: Cross-platform desktop with Rust backend
- **Electron**: Traditional desktop with Node.js backend
- **Flutter**: Native mobile applications
- **Web**: Static export for CDN deployment

## Security Considerations

### Authentication Flow
1. AWS credentials validation
2. Bedrock service permissions check
3. Session token management
4. Automatic token refresh (Cognito)

### Required IAM Permissions
```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": [
      "bedrock:InvokeModel",
      "bedrock:InvokeModelWithResponseStream"
    ],
    "Resource": "arn:aws:bedrock:*::foundation-model/*"
  }]
}
```

## Future Development Considerations

### Planned Features
- Enhanced file upload support
- Advanced prompt engineering tools
- Multi-session management
- Cloud synchronization
- Plugin system architecture

### Technical Debt
- Consolidate desktop app approaches (Tauri vs Electron)
- Improve mobile app integration
- Enhanced error handling and logging
- Performance optimization for large conversations

## Development Guidelines

### Code Organization
- Components use SCSS modules for styling
- State management through Zustand stores
- Platform-specific code in dedicated directories
- Internationalization through locale files

### Build Process
- Next.js handles web builds
- Platform-specific build scripts for desktop/mobile
- Automated release process through GitHub Actions
- Version synchronization across platforms

This project serves as a comprehensive example of building cross-platform chat applications with AWS Bedrock integration, showcasing modern web technologies and multi-platform deployment strategies.
