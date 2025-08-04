import { z } from 'zod';

// Configuration schema for aMove platform
export const aMoveConfigSchema = z.object({
  apiUrl: z.string().url().optional().describe('aMove API URL (defaults to https://api.amove.com/v1)'),
  apiKey: z.string().min(1).describe('API key for authentication'),
  accountId: z.string().min(1).describe('aMove account ID'),
  timeout: z.number().positive().optional().describe('Request timeout in milliseconds'),
  maxRetries: z.number().int().positive().max(10).optional().describe('Maximum number of retry attempts'),
  retryDelay: z.number().positive().max(60000).optional().describe('Delay between retries in milliseconds')
});

// Credentials schema for creating aMove users
export const aMoveCredentialsSchema = z.object({
  email: z.string().email().describe('User email address'),
  fullName: z.string().min(1).describe('User full name'),
  role: z.enum(['admin', 'member', 'viewer']).optional().describe('User role in aMove'),
  teamId: z.string().optional().describe('Team ID to assign user to'),
  permissions: z.object({
    canUpload: z.boolean().optional(),
    canDownload: z.boolean().optional(),
    canDelete: z.boolean().optional(),
    canShare: z.boolean().optional(),
    canManageUsers: z.boolean().optional()
  }).optional().describe('Custom permissions for the user')
});

// Export types
export type AMoveConfig = z.infer<typeof aMoveConfigSchema>;
export type AMoveCredentials = z.infer<typeof aMoveCredentialsSchema>;

// Validation helpers
export const validateAMoveConfig = (config: unknown): AMoveConfig => {
  return aMoveConfigSchema.parse(config);
};

export const validateAMoveCredentials = (credentials: unknown): AMoveCredentials => {
  return aMoveCredentialsSchema.parse(credentials);
};