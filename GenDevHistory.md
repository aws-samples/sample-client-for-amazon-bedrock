# Development History

This file tracks the development changes made to the Sample Client for Amazon Bedrock project.

## 2025-08-14 - Added Local JSON File Loading for Model Configuration

### Summary
Added a new "Load" button to the model configuration interface that allows users to load model configurations from local JSON files, complementing the existing remote URL update functionality.

### Changes Made

#### Files Modified
- `app/components/model-config.tsx`

#### Detailed Changes

1. **Updated Imports**
   - Added `useRef` import from React
   - Added `UploadIcon` import from `../icons/upload.svg`

2. **Added File Input Reference**
   - Added `const fileInputRef = useRef<HTMLInputElement>(null);` for managing the hidden file input

3. **Implemented File Handling Logic**
   - Created `handleFileLoad` function to process selected JSON files
   - Includes JSON parsing and validation
   - Updates app configuration with loaded models
   - Provides error handling with user-friendly alerts
   - Resets file input after processing to allow reselection of same file

4. **Enhanced UI Components**
   - Added hidden file input element with `.json` file restriction
   - Added new "Load" IconButton with upload icon
   - Positioned next to existing "Update" button for consistent UX
   - Added tooltip: "Load models from local JSON file"

#### Code Structure
```typescript
// File input reference
const fileInputRef = useRef<HTMLInputElement>(null);

// File handling function
const handleFileLoad = (event: React.ChangeEvent<HTMLInputElement>) => {
  // File reading and JSON parsing logic
  // Error handling and app config updates
};

// UI Elements
<input type="file" ref={fileInputRef} onChange={handleFileLoad} accept=".json" style={{ display: 'none' }} />
<IconButton onClick={() => fileInputRef.current?.click()} icon={<UploadIcon />} title="Load models from local JSON file" />
```

### Features Added
- **Local File Support**: Users can now load model configurations from local JSON files
- **File Validation**: Only accepts `.json` files with proper JSON format validation
- **Error Handling**: Displays alerts for invalid JSON files
- **Reusability**: File input resets after each use, allowing multiple file selections
- **Consistent UX**: Integrates seamlessly with existing update button interface
- **Visual Feedback**: Uses upload icon and provides descriptive tooltip

### Technical Details
- Uses HTML5 FileReader API for file processing
- Maintains existing app configuration update pattern
- Follows React best practices with useRef for DOM element access
- Includes TypeScript type safety for file input events

### User Experience
1. User clicks the new "Load" button (upload icon)
2. File selection dialog opens, filtered to show only `.json` files
3. Upon file selection, content is automatically parsed and loaded
4. Success/error feedback provided through console logging and alerts
5. Model list updates immediately upon successful load

### Backward Compatibility
- All existing functionality remains unchanged
- New feature is additive and doesn't affect existing workflows
- Remote URL update functionality continues to work as before

### Future Considerations
- Could be extended to support other file formats (CSV, XML)
- Potential for drag-and-drop file upload interface
- Could add file content preview before loading
- Possible integration with file validation schemas

## 2025-08-19 - Added Model-Specific Streaming Configuration Support

### Summary
Implemented a comprehensive streaming configuration system that allows models to specify their streaming capabilities through a `support_streaming` attribute. This enables per-model streaming control with automatic configuration inheritance and backward compatibility.

### Changes Made

#### Files Modified
- `app/store/config.ts` - Added support_streaming to ModelConfig with migration
- `app/store/chat.ts` - Updated chat logic to use support_streaming instead of hardcoded streaming
- `app/client/api.ts` - Added support_streaming to LLMConfig interface
- `app/components/model-config.tsx` - Added UI controls and auto-configuration logic
- `app/store/mask.ts` - Added debug logging for mask creation

#### Detailed Changes

1. **Model Configuration Schema (`app/store/config.ts`)**
   - Added `support_streaming: false` to DEFAULT_CONFIG.modelConfig
   - Added `support_streaming(x: boolean)` validator function
   - Updated version to 3.9 with migration logic for backward compatibility
   - Migration ensures existing configs without support_streaming default to false

2. **Chat Logic Updates (`app/store/chat.ts`)**
   - Updated version to 4.1 with session migration logic
   - Modified main chat request: `stream: modelConfig.support_streaming ?? false`
   - Modified summarization request to use same streaming logic
   - Updated bot message creation to set streaming based on support_streaming
   - Enhanced onUpdate callback to only update UI during streaming mode
   - Enhanced onFinish callback to ensure UI updates for non-streaming mode

3. **API Interface (`app/client/api.ts`)**
   - Added `support_streaming?: boolean` to LLMConfig interface for type consistency

4. **UI Controls (`app/components/model-config.tsx`)**
   - Added checkbox control for "Support Streaming" setting with proper fallback handling
   - **Auto-Configuration Logic**: When loading JSON files, automatically updates global modelConfig.support_streaming if current model has streaming defined
   - **Model Selection Logic**: When changing models, automatically applies support_streaming from model definition
   - Comprehensive debug logging for troubleshooting configuration flow

5. **Session Management (`app/store/mask.ts`)**
   - Added debug logging to createEmptyMask function
   - Enhanced session creation debugging in chat store

#### Code Structure
```typescript
// Model Configuration
export const DEFAULT_CONFIG = {
  modelConfig: {
    // ... existing config
    support_streaming: false,
    // ... rest of config
  },
};

// Chat Logic
api.llm.chat({
  messages: sendMessages,
  config: { ...modelConfig, stream: modelConfig.support_streaming ?? false },
});

// Auto-Configuration on JSON Load
if (currentModelInNewList && currentModelInNewList.support_streaming !== undefined) {
  config.modelConfig.support_streaming = currentModelInNewList.support_streaming;
}

// Auto-Configuration on Model Selection
if (selectedModel && (selectedModel as any).support_streaming !== undefined) {
  config.support_streaming = (selectedModel as any).support_streaming;
}
```

### Features Added
- **Model-Specific Streaming**: Each model can define its streaming capability via support_streaming attribute
- **Automatic Configuration**: Loading JSON configs or changing models automatically applies streaming settings
- **Backward Compatibility**: Existing configurations work seamlessly with default false value
- **UI Controls**: Users can manually toggle streaming per model configuration
- **Debug Logging**: Comprehensive console output for troubleshooting configuration flow
- **Migration Support**: Automatic migration of existing configs and sessions

### Technical Details
- **Default Behavior**: support_streaming defaults to false (non-streaming mode)
- **Fallback Strategy**: Uses ?? false throughout codebase for undefined values
- **Session Inheritance**: New sessions inherit streaming settings from global model config
- **UI Feedback**: Different behavior for streaming vs non-streaming modes (typing indicators)
- **Type Safety**: Full TypeScript support with proper interface definitions

### User Experience
1. **JSON File Loading**: Models with support_streaming: true automatically enable streaming
2. **Model Selection**: Changing to a streaming-capable model auto-enables streaming
3. **Manual Override**: Users can manually toggle streaming via checkbox in model settings
4. **Visual Feedback**: Non-streaming mode shows typing indicators until response completion
5. **Seamless Migration**: Existing users see no behavior change (streaming disabled by default)

### Backward Compatibility
- **Configuration Files**: Old configs without support_streaming automatically get false value
- **Existing Sessions**: Migration logic adds support_streaming: false to existing sessions
- **API Compatibility**: LLMConfig interface maintains backward compatibility with optional field
- **Default Behavior**: Maintains existing non-streaming behavior for all existing setups

### Problem Solved
- **Issue**: JSON config files with streaming-enabled models weren't applying streaming settings to new sessions
- **Root Cause**: JSON loading only updated model list, not global model configuration
- **Solution**: Added auto-configuration logic that updates global modelConfig when loading JSON files or changing models
- **Result**: Streaming settings from JSON configs now properly inherit to new sessions and chat functionality
