import { IPlatformModule, PlatformRegistry, PlatformCategory } from '../types/platform.types';

// Import all platform modules
import { ParsecModule } from '../modules/screen-sharing/ParsecModule';
import { TrueNASModule } from '../modules/file-sharing/TrueNASModule';
// Import more modules as they are created

/**
 * Central registry for all platform modules
 * Manages platform discovery, registration, and access
 */
export class PlatformRegistryService {
  private static instance: PlatformRegistryService;
  private registry: PlatformRegistry = new Map();
  private categoryIndex: Map<PlatformCategory, Set<string>> = new Map();
  
  private constructor() {
    this.initializeRegistry();
  }
  
  /**
   * Get singleton instance
   */
  static getInstance(): PlatformRegistryService {
    if (!PlatformRegistryService.instance) {
      PlatformRegistryService.instance = new PlatformRegistryService();
    }
    return PlatformRegistryService.instance;
  }
  
  /**
   * Initialize the registry with all available platform modules
   */
  private initializeRegistry(): void {
    // Register all platform modules
    this.registerPlatform(new ParsecModule());
    this.registerPlatform(new TrueNASModule());
    // Add more platforms here as they are created
    
    // Future platforms to add:
    // Screen Sharing: TeamViewer, AnyDesk, Chrome Remote Desktop
    // File Sharing: Lucidlink, Dropbox Business, Google Drive
    // Collaboration: Iconik, Frame.io, Widen, Monday.com
    // Communication: Slack, Discord, Microsoft Teams, Zoom
  }
  
  /**
   * Register a platform module
   */
  registerPlatform(platform: IPlatformModule): void {
    const metadata = platform.metadata;
    
    // Add to main registry
    this.registry.set(metadata.id, platform);
    
    // Update category index
    if (!this.categoryIndex.has(metadata.category)) {
      this.categoryIndex.set(metadata.category, new Set());
    }
    this.categoryIndex.get(metadata.category)!.add(metadata.id);
    
    console.log(`Registered platform: ${metadata.displayName} (${metadata.id}) in category ${metadata.category}`);
  }
  
  /**
   * Get a platform module by ID
   */
  getPlatform(platformId: string): IPlatformModule | undefined {
    return this.registry.get(platformId);
  }
  
  /**
   * Get all platform modules
   */
  getAllPlatforms(): IPlatformModule[] {
    return Array.from(this.registry.values());
  }
  
  /**
   * Get platforms by category
   */
  getPlatformsByCategory(category: PlatformCategory): IPlatformModule[] {
    const platformIds = this.categoryIndex.get(category) || new Set();
    return Array.from(platformIds)
      .map(id => this.registry.get(id))
      .filter(platform => platform !== undefined) as IPlatformModule[];
  }
  
  /**
   * Get all categories with their platforms
   */
  getCategorizedPlatforms(): Map<PlatformCategory, IPlatformModule[]> {
    const categorized = new Map<PlatformCategory, IPlatformModule[]>();
    
    for (const category of Object.values(PlatformCategory)) {
      const platforms = this.getPlatformsByCategory(category as PlatformCategory);
      if (platforms.length > 0) {
        categorized.set(category as PlatformCategory, platforms);
      }
    }
    
    return categorized;
  }
  
  /**
   * Search platforms by name or features
   */
  searchPlatforms(query: string): IPlatformModule[] {
    const lowerQuery = query.toLowerCase();
    
    return this.getAllPlatforms().filter(platform => {
      const metadata = platform.metadata;
      return (
        metadata.name.toLowerCase().includes(lowerQuery) ||
        metadata.displayName.toLowerCase().includes(lowerQuery) ||
        metadata.description.toLowerCase().includes(lowerQuery) ||
        metadata.features.some(feature => feature.toLowerCase().includes(lowerQuery))
      );
    });
  }
  
  /**
   * Check if a platform is registered
   */
  hasPlatform(platformId: string): boolean {
    return this.registry.has(platformId);
  }
  
  /**
   * Get platform count
   */
  getPlatformCount(): number {
    return this.registry.size;
  }
  
  /**
   * Get category count
   */
  getCategoryCount(): number {
    return this.categoryIndex.size;
  }
  
  /**
   * Unregister a platform (useful for testing)
   */
  unregisterPlatform(platformId: string): boolean {
    const platform = this.registry.get(platformId);
    if (!platform) return false;
    
    // Remove from registry
    this.registry.delete(platformId);
    
    // Remove from category index
    const categoryPlatforms = this.categoryIndex.get(platform.metadata.category);
    if (categoryPlatforms) {
      categoryPlatforms.delete(platformId);
      if (categoryPlatforms.size === 0) {
        this.categoryIndex.delete(platform.metadata.category);
      }
    }
    
    return true;
  }
  
  /**
   * Clear all registered platforms (useful for testing)
   */
  clearRegistry(): void {
    this.registry.clear();
    this.categoryIndex.clear();
  }
}