// Re-export platform types from the main types file
// This maintains compatibility with existing imports while keeping types centralized

export {
  // Core interfaces
  IPlatformModule,
  PlatformResponse,
  PlatformUser,
  PlatformConfig,
  PlatformCredentials,
  PlatformMetadata,
  
  // Enums
  PlatformStatus,
  PlatformUserStatus,
  PlatformCapability,
  PlatformCategory,
  
  // Registry and events
  PlatformRegistry,
  PlatformEvent
} from '../../types/platform.types';