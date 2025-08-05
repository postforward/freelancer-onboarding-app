// Re-export platform types from the main types file
// This maintains compatibility with existing imports while keeping types centralized

export type {
  // Core interfaces
  IPlatformModule,
  PlatformResponse,
  PlatformUser,
  PlatformConfig,
  PlatformCredentials,
  PlatformMetadata,
  
  // Registry and events
  PlatformRegistry,
  PlatformEvent
} from '../../types/platform.types';

export {
  // Enums (values, not types)
  PlatformStatus,
  PlatformUserStatus,
  PlatformCapability,
  PlatformCategory
} from '../../types/platform.types';