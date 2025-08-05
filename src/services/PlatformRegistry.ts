// Import all platform modules (classes only, not interfaces)
import { ParsecModule } from '../modules/screen-sharing/ParsecModule';
import { MondayModule } from '../modules/collaboration/MondayModule';
// import { trueNASModule } from '../modules/truenas/TrueNASModule';

// Export actual classes as runtime values
export { ParsecModule as PlatformModule };

// Simple platform registry type (using IPlatformModule interface)
import type { IPlatformModule } from '../types/platform.types';
export type PlatformRegistry = Map<string, IPlatformModule>;

// Platform categories for now - keeping it simple
export type PlatformCategory = 'screen-sharing' | 'file-sharing' | 'collaboration' | 'communication';

/**
 * Simplified registry for platform modules
 */
export class PlatformRegistryService {
  private static instance: PlatformRegistryService;
  private registry: PlatformRegistry = new Map();
  private categoryIndex: Map<PlatformCategory, Set<string>> = new Map();
  
  private constructor() {
    this.initializeRegistry();
  }
  
  static getInstance(): PlatformRegistryService {
    if (!PlatformRegistryService.instance) {
      PlatformRegistryService.instance = new PlatformRegistryService();
    }
    return PlatformRegistryService.instance;
  }
  
  private initializeRegistry(): void {
    // Register working platforms only
    this.registerPlatform(new ParsecModule());
    this.registerPlatform(new MondayModule());
    // this.registerPlatform(trueNASModule); // Disabled until simplified
  }
  
  registerPlatform(platform: IPlatformModule): void {
    const metadata = platform.metadata;
    
    // Add to main registry
    this.registry.set(metadata.id, platform);
    
    // Update category index
    const category = metadata.category as PlatformCategory;
    if (!this.categoryIndex.has(category)) {
      this.categoryIndex.set(category, new Set());
    }
    this.categoryIndex.get(category)!.add(metadata.id);
    
    console.log(`Registered platform: ${metadata.displayName} (${metadata.id}) in category ${metadata.category}`);
  }
  
  getPlatform(platformId: string): IPlatformModule | undefined {
    return this.registry.get(platformId);
  }
  
  getAllPlatforms(): IPlatformModule[] {
    return Array.from(this.registry.values());
  }
  
  getPlatformsByCategory(category: PlatformCategory): IPlatformModule[] {
    const platformIds = this.categoryIndex.get(category) || new Set();
    return Array.from(platformIds)
      .map(id => this.registry.get(id))
      .filter(platform => platform !== undefined) as IPlatformModule[];
  }
  
  getCategorizedPlatforms(): Map<PlatformCategory, IPlatformModule[]> {
    const categorized = new Map<PlatformCategory, IPlatformModule[]>();
    
    const categories: PlatformCategory[] = ['screen-sharing', 'file-sharing', 'collaboration', 'communication'];
    for (const category of categories) {
      const platforms = this.getPlatformsByCategory(category);
      if (platforms.length > 0) {
        categorized.set(category, platforms);
      }
    }
    
    return categorized;
  }
  
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
  
  hasPlatform(platformId: string): boolean {
    return this.registry.has(platformId);
  }
  
  getPlatformCount(): number {
    return this.registry.size;
  }
  
  getCategoryCount(): number {
    return this.categoryIndex.size;
  }
  
  unregisterPlatform(platformId: string): boolean {
    const platform = this.registry.get(platformId);
    if (!platform) return false;
    
    // Remove from registry
    this.registry.delete(platformId);
    
    // Remove from category index
    const categoryPlatforms = this.categoryIndex.get(platform.metadata.category as PlatformCategory);
    if (categoryPlatforms) {
      categoryPlatforms.delete(platformId);
      if (categoryPlatforms.size === 0) {
        this.categoryIndex.delete(platform.metadata.category as PlatformCategory);
      }
    }
    
    return true;
  }
  
  clearRegistry(): void {
    this.registry.clear();
    this.categoryIndex.clear();
  }
}