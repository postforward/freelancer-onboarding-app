import { z } from 'zod';

// Configuration schema for TrueNAS platform
export const trueNASConfigSchema = z.object({
  apiUrl: z.string().url().describe('TrueNAS API URL (e.g., https://truenas.local/api/v2.0)'),
  apiKey: z.string().min(1).describe('API key for authentication'),
  smbSharePath: z.string().optional().describe('Default SMB share path'),
  defaultGroup: z.string().optional().describe('Default group for new users'),
  timeout: z.number().positive().optional().describe('Request timeout in milliseconds'),
  verifySsl: z.boolean().optional().describe('Verify SSL certificates (default: true)')
});

// Credentials schema for creating TrueNAS users
export const trueNASCredentialsSchema = z.object({
  username: z.string()
    .min(1)
    .max(32)
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username must contain only letters, numbers, underscores, and hyphens')
    .describe('SMB username'),
  password: z.string()
    .min(8)
    .describe('SMB password (must meet complexity requirements)'),
  fullName: z.string().min(1).describe('User full name'),
  email: z.string().email().optional().describe('User email address'),
  groups: z.array(z.string()).optional().describe('Groups to assign user to'),
  homeDirectory: z.string().optional().describe('User home directory path'),
  shell: z.string().optional().describe('User shell (default: /usr/bin/zsh)'),
  smbAccess: z.boolean().optional().describe('Enable SMB access (default: true)'),
  permissions: z.object({
    readOnly: z.boolean().optional(),
    allowGuest: z.boolean().optional(),
    recyclebinEnabled: z.boolean().optional()
  }).optional().describe('SMB share permissions')
});

// Group schema
export const trueNASGroupSchema = z.object({
  name: z.string()
    .min(1)
    .max(32)
    .regex(/^[a-zA-Z0-9_-]+$/, 'Group name must contain only letters, numbers, underscores, and hyphens'),
  gid: z.number().int().positive().optional().describe('Group ID (auto-assigned if not provided)'),
  sudo: z.boolean().optional().describe('Grant sudo privileges to group members'),
  smb: z.boolean().optional().describe('Enable SMB access for group')
});

// Share schema
export const trueNASShareSchema = z.object({
  name: z.string().min(1).describe('Share name'),
  path: z.string().min(1).describe('Share path on TrueNAS'),
  comment: z.string().optional().describe('Share description'),
  enabled: z.boolean().optional().describe('Enable share (default: true)'),
  browsable: z.boolean().optional().describe('Make share browsable (default: true)'),
  readonly: z.boolean().optional().describe('Read-only share (default: false)'),
  guestok: z.boolean().optional().describe('Allow guest access (default: false)'),
  hostsallow: z.array(z.string()).optional().describe('Allowed hosts/IPs'),
  hostsdeny: z.array(z.string()).optional().describe('Denied hosts/IPs')
});

// Export types
export type TrueNASConfig = z.infer<typeof trueNASConfigSchema>;
export type TrueNASCredentials = z.infer<typeof trueNASCredentialsSchema>;
export type TrueNASGroup = z.infer<typeof trueNASGroupSchema>;
export type TrueNASShare = z.infer<typeof trueNASShareSchema>;

// Validation helpers
export const validateTrueNASConfig = (config: unknown): TrueNASConfig => {
  return trueNASConfigSchema.parse(config);
};

export const validateTrueNASCredentials = (credentials: unknown): TrueNASCredentials => {
  return trueNASCredentialsSchema.parse(credentials);
};

export const validateTrueNASGroup = (group: unknown): TrueNASGroup => {
  return trueNASGroupSchema.parse(group);
};

export const validateTrueNASShare = (share: unknown): TrueNASShare => {
  return trueNASShareSchema.parse(share);
};