import type { Freelancer, FreelancerPlatform } from '../contexts/FreelancerContext';

// Mock Organizations
export const mockOrganizations = [
  {
    id: 'org-1',
    name: 'TechFlow Solutions',
    domain: 'techflow.com',
    settings: {
      branding: {
        primary_color: '#3B82F6',
        logo_url: null
      }
    },
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z'
  },
  {
    id: 'org-2',
    name: 'Digital Nomads Inc',
    domain: 'digitalnomads.co',
    settings: {
      branding: {
        primary_color: '#10B981',
        logo_url: null
      }
    },
    created_at: '2024-01-20T14:30:00Z',
    updated_at: '2024-01-20T14:30:00Z'
  },
  {
    id: 'org-3',
    name: 'Creative Studios',
    domain: 'creativestudios.com',
    settings: {
      branding: {
        primary_color: '#8B5CF6',
        logo_url: null
      }
    },
    created_at: '2024-02-01T09:15:00Z',
    updated_at: '2024-02-01T09:15:00Z'
  }
];

// Mock Users
export const mockUsers = [
  {
    id: 'user-1',
    email: 'admin@techflow.com',
    first_name: 'Sarah',
    last_name: 'Johnson',
    role: 'admin' as const,
    organization_id: 'org-1',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
    is_active: true
  },
  {
    id: 'user-2',
    email: 'manager@digitalnomads.co',
    first_name: 'Mike',
    last_name: 'Chen',
    role: 'member' as const,
    organization_id: 'org-2',
    created_at: '2024-01-20T14:30:00Z',
    updated_at: '2024-01-20T14:30:00Z',
    is_active: true
  },
  {
    id: 'user-3',
    email: 'admin@creativestudios.com',
    first_name: 'Elena',
    last_name: 'Rodriguez',
    role: 'admin' as const,
    organization_id: 'org-3',
    created_at: '2024-02-01T09:15:00Z',
    updated_at: '2024-02-01T09:15:00Z',
    is_active: true
  },
  {
    id: 'user-4',
    email: 'user@techflow.com',
    first_name: 'David',
    last_name: 'Wilson',
    role: 'member' as const,
    organization_id: 'org-1',
    created_at: '2024-01-16T11:00:00Z',
    updated_at: '2024-01-16T11:00:00Z',
    is_active: true
  }
];

// Mock Platform Configurations
export const mockPlatformConfigs = [
  {
    id: 'config-1',
    organization_id: 'org-1',
    platform_id: 'amove',
    enabled: true,
    config: {
      apiKey: 'mock-amove-key-123',
      apiSecret: 'mock-amove-secret-456',
      baseUrl: 'https://api.amove.com/v1'
    },
    created_at: '2024-01-15T10:30:00Z',
    updated_at: '2024-01-15T10:30:00Z'
  },
  {
    id: 'config-2',
    organization_id: 'org-1',
    platform_id: 'upwork',
    enabled: true,
    config: {
      clientId: 'mock-upwork-client-123',
      clientSecret: 'mock-upwork-secret-456',
      redirectUri: 'https://app.example.com/auth/upwork'
    },
    created_at: '2024-01-15T10:35:00Z',
    updated_at: '2024-01-15T10:35:00Z'
  },
  {
    id: 'config-3',
    organization_id: 'org-1',
    platform_id: 'fiverr',
    enabled: false,
    config: {
      apiKey: 'mock-fiverr-key-789'
    },
    created_at: '2024-01-15T10:40:00Z',
    updated_at: '2024-01-15T10:40:00Z'
  },
  {
    id: 'config-4',
    organization_id: 'org-2',
    platform_id: 'amove',
    enabled: true,
    config: {
      apiKey: 'mock-amove-key-789',
      apiSecret: 'mock-amove-secret-012',
      baseUrl: 'https://api.amove.com/v1'
    },
    created_at: '2024-01-20T15:00:00Z',
    updated_at: '2024-01-20T15:00:00Z'
  },
  {
    id: 'config-5',
    organization_id: 'org-2',
    platform_id: 'freelancer',
    enabled: true,
    config: {
      oAuthToken: 'mock-freelancer-token-345'
    },
    created_at: '2024-01-20T15:05:00Z',
    updated_at: '2024-01-20T15:05:00Z'
  },
  {
    id: 'config-6',
    organization_id: 'org-1',
    platform_id: 'monday',
    enabled: true,
    config: {
      apiToken: 'mock-monday-token-789',
      workspaceId: 'mock-workspace-123'
    },
    created_at: '2024-01-20T15:10:00Z',
    updated_at: '2024-01-20T15:10:00Z'
  }
];

// Mock Freelancers
export const mockFreelancers: Freelancer[] = [
  {
    id: 'freelancer-1',
    organization_id: 'org-1',
    email: 'john.doe@gmail.com',
    first_name: 'John',
    last_name: 'Doe',
    phone: '+1 (555) 123-4567',
    status: 'active',
    created_at: '2024-01-16T09:00:00Z',
    updated_at: '2024-01-16T09:00:00Z',
    created_by: 'user-1',
    metadata: {
      skills: ['JavaScript', 'React', 'Node.js'],
      experience_level: 'senior'
    }
  },
  {
    id: 'freelancer-2',
    organization_id: 'org-1',
    email: 'jane.smith@gmail.com',
    first_name: 'Jane',
    last_name: 'Smith',
    phone: '+1 (555) 234-5678',
    status: 'active',
    created_at: '2024-01-17T10:30:00Z',
    updated_at: '2024-01-17T10:30:00Z',
    created_by: 'user-1',
    metadata: {
      skills: ['Python', 'Django', 'PostgreSQL'],
      experience_level: 'mid'
    }
  },
  {
    id: 'freelancer-3',
    organization_id: 'org-1',
    email: 'alex.jones@gmail.com',
    first_name: 'Alex',
    last_name: 'Jones',
    phone: '+1 (555) 345-6789',
    status: 'pending',
    created_at: '2024-01-18T14:15:00Z',
    updated_at: '2024-01-18T14:15:00Z',
    created_by: 'user-1',
    metadata: {
      skills: ['UI/UX Design', 'Figma', 'Adobe Creative Suite'],
      experience_level: 'senior'
    }
  },
  {
    id: 'freelancer-4',
    organization_id: 'org-1',
    email: 'maria.garcia@gmail.com',
    first_name: 'Maria',
    last_name: 'Garcia',
    phone: '+1 (555) 456-7890',
    status: 'error',
    created_at: '2024-01-19T11:45:00Z',
    updated_at: '2024-01-19T11:45:00Z',
    created_by: 'user-1',
    metadata: {
      skills: ['Content Writing', 'SEO', 'Social Media'],
      experience_level: 'mid'
    }
  },
  {
    id: 'freelancer-5',
    organization_id: 'org-1',
    email: 'david.wilson@gmail.com',
    first_name: 'David',
    last_name: 'Wilson',
    phone: '+1 (555) 567-8901',
    status: 'active',
    created_at: '2024-01-20T16:20:00Z',
    updated_at: '2024-01-20T16:20:00Z',
    created_by: 'user-1',
    metadata: {
      skills: ['Mobile Development', 'Flutter', 'iOS'],
      experience_level: 'senior'
    }
  },
  {
    id: 'freelancer-6',
    organization_id: 'org-2',
    email: 'lisa.brown@gmail.com',
    first_name: 'Lisa',
    last_name: 'Brown',
    phone: '+1 (555) 678-9012',
    status: 'active',
    created_at: '2024-01-21T08:30:00Z',
    updated_at: '2024-01-21T08:30:00Z',
    created_by: 'user-2',
    metadata: {
      skills: ['Data Science', 'Machine Learning', 'Python'],
      experience_level: 'senior'
    }
  },
  {
    id: 'freelancer-7',
    organization_id: 'org-2',
    email: 'tom.davis@gmail.com',
    first_name: 'Tom',
    last_name: 'Davis',
    phone: '+1 (555) 789-0123',
    status: 'active',
    created_at: '2024-01-22T13:45:00Z',
    updated_at: '2024-01-22T13:45:00Z',
    created_by: 'user-2',
    metadata: {
      skills: ['DevOps', 'AWS', 'Docker', 'Kubernetes'],
      experience_level: 'senior'
    }
  },
  {
    id: 'freelancer-8',
    organization_id: 'org-2',
    email: 'sarah.miller@gmail.com',
    first_name: 'Sarah',
    last_name: 'Miller',
    phone: '+1 (555) 890-1234',
    status: 'pending',
    created_at: '2024-01-23T10:15:00Z',
    updated_at: '2024-01-23T10:15:00Z',
    created_by: 'user-2',
    metadata: {
      skills: ['Video Editing', 'Motion Graphics', 'After Effects'],
      experience_level: 'mid'
    }
  },
  {
    id: 'freelancer-9',
    organization_id: 'org-3',
    email: 'robert.taylor@gmail.com',
    first_name: 'Robert',
    last_name: 'Taylor',
    phone: '+1 (555) 901-2345',
    status: 'active',
    created_at: '2024-02-02T15:30:00Z',
    updated_at: '2024-02-02T15:30:00Z',
    created_by: 'user-3',
    metadata: {
      skills: ['Photography', 'Photo Editing', 'Lightroom'],
      experience_level: 'senior'
    }
  },
  {
    id: 'freelancer-10',
    organization_id: 'org-3',
    email: 'jennifer.anderson@gmail.com',
    first_name: 'Jennifer',
    last_name: 'Anderson',
    phone: '+1 (555) 012-3456',
    status: 'active',
    created_at: '2024-02-03T12:00:00Z',
    updated_at: '2024-02-03T12:00:00Z',
    created_by: 'user-3',
    metadata: {
      skills: ['Project Management', 'Agile', 'Scrum'],
      experience_level: 'senior'
    }
  },
  {
    id: 'freelancer-11',
    organization_id: 'org-1',
    email: 'mike.johnson@gmail.com',
    first_name: 'Mike',
    last_name: 'Johnson',
    phone: '+1 (555) 123-9876',
    status: 'inactive',
    created_at: '2024-01-25T09:30:00Z',
    updated_at: '2024-01-25T09:30:00Z',
    created_by: 'user-1',
    metadata: {
      skills: ['Blockchain', 'Solidity', 'Web3'],
      experience_level: 'mid'
    }
  },
  {
    id: 'freelancer-12',
    organization_id: 'org-1',
    email: 'anna.wilson@gmail.com',
    first_name: 'Anna',
    last_name: 'Wilson',
    phone: '+1 (555) 234-8765',
    status: 'active',
    created_at: '2024-01-26T14:45:00Z',
    updated_at: '2024-01-26T14:45:00Z',
    created_by: 'user-1',
    metadata: {
      skills: ['Graphic Design', 'Branding', 'Illustrator'],
      experience_level: 'mid'
    }
  }
];

// Mock Freelancer Platform Associations
export const mockFreelancerPlatforms: FreelancerPlatform[] = [
  // John Doe - org-1
  {
    id: 'fp-1',
    freelancer_id: 'freelancer-1',
    platform_id: 'amove',
    status: 'active',
    platform_user_id: 'amove-user-123',
    provisioned_at: '2024-01-16T09:15:00Z',
    last_sync_at: '2024-01-30T10:00:00Z',
  },
  {
    id: 'fp-2',
    freelancer_id: 'freelancer-1',
    platform_id: 'upwork',
    status: 'active',
    platform_user_id: 'upwork-user-456',
    provisioned_at: '2024-01-16T09:20:00Z',
    last_sync_at: '2024-01-29T15:30:00Z',
  },
  {
    id: 'fp-2a',
    freelancer_id: 'freelancer-1',
    platform_id: 'monday',
    status: 'active',
    platform_user_id: 'monday-user-123',
    provisioned_at: '2024-01-16T09:25:00Z',
    last_sync_at: '2024-01-30T12:00:00Z',
  },
  // Jane Smith - org-1
  {
    id: 'fp-3',
    freelancer_id: 'freelancer-2',
    platform_id: 'amove',
    status: 'active',
    platform_user_id: 'amove-user-789',
    provisioned_at: '2024-01-17T10:45:00Z',
    last_sync_at: '2024-01-30T11:15:00Z',
  },
  {
    id: 'fp-4',
    freelancer_id: 'freelancer-2',
    platform_id: 'upwork',
    status: 'error',
  },
  {
    id: 'fp-4a',
    freelancer_id: 'freelancer-2',
    platform_id: 'monday',
    status: 'active',
    platform_user_id: 'monday-user-456',
    provisioned_at: '2024-01-17T11:00:00Z',
    last_sync_at: '2024-01-30T13:15:00Z',
  },
  // Alex Jones - org-1 (pending)
  {
    id: 'fp-5',
    freelancer_id: 'freelancer-3',
    platform_id: 'amove',
    status: 'pending',
  },
  // Maria Garcia - org-1 (error case)
  {
    id: 'fp-6',
    freelancer_id: 'freelancer-4',
    platform_id: 'amove',
    status: 'error',
  },
  {
    id: 'fp-7',
    freelancer_id: 'freelancer-4',
    platform_id: 'upwork',
    status: 'error',
  },
  // David Wilson - org-1
  {
    id: 'fp-8',
    freelancer_id: 'freelancer-5',
    platform_id: 'amove',
    status: 'active',
    platform_user_id: 'amove-user-101',
    provisioned_at: '2024-01-20T16:35:00Z',
    last_sync_at: '2024-01-30T09:45:00Z',
  },
  // Lisa Brown - org-2
  {
    id: 'fp-9',
    freelancer_id: 'freelancer-6',
    platform_id: 'amove',
    status: 'active',
    platform_user_id: 'amove-user-202',
    provisioned_at: '2024-01-21T08:45:00Z',
    last_sync_at: '2024-01-30T14:20:00Z',
  },
  {
    id: 'fp-10',
    freelancer_id: 'freelancer-6',
    platform_id: 'freelancer',
    status: 'active',
    platform_user_id: 'freelancer-user-303',
    provisioned_at: '2024-01-21T09:00:00Z',
    last_sync_at: '2024-01-30T16:10:00Z',
  },
  // Tom Davis - org-2
  {
    id: 'fp-11',
    freelancer_id: 'freelancer-7',
    platform_id: 'amove',
    status: 'active',
    platform_user_id: 'amove-user-404',
    provisioned_at: '2024-01-22T14:00:00Z',
    last_sync_at: '2024-01-30T12:30:00Z',
  },
  // Sarah Miller - org-2 (pending)
  {
    id: 'fp-12',
    freelancer_id: 'freelancer-8',
    platform_id: 'freelancer',
    status: 'pending',
  },
  // Robert Taylor - org-3
  {
    id: 'fp-13',
    freelancer_id: 'freelancer-9',
    platform_id: 'amove',
    status: 'active',
    platform_user_id: 'amove-user-505',
    provisioned_at: '2024-02-02T15:45:00Z',
    last_sync_at: '2024-02-10T10:00:00Z',
  },
  // Jennifer Anderson - org-3
  {
    id: 'fp-14',
    freelancer_id: 'freelancer-10',
    platform_id: 'amove',
    status: 'active',
    platform_user_id: 'amove-user-606',
    provisioned_at: '2024-02-03T12:15:00Z',
    last_sync_at: '2024-02-10T11:30:00Z',
  },
  // Mike Johnson - org-1 (inactive)
  {
    id: 'fp-15',
    freelancer_id: 'freelancer-11',
    platform_id: 'amove',
    status: 'inactive',
    platform_user_id: 'amove-user-707',
    provisioned_at: '2024-01-25T09:45:00Z',
  },
  // Anna Wilson - org-1
  {
    id: 'fp-16',
    freelancer_id: 'freelancer-12',
    platform_id: 'amove',
    status: 'active',
    platform_user_id: 'amove-user-808',
    provisioned_at: '2024-01-26T15:00:00Z',
    last_sync_at: '2024-01-30T08:15:00Z',
  },
  {
    id: 'fp-17',
    freelancer_id: 'freelancer-12',
    platform_id: 'upwork',
    status: 'active',
    platform_user_id: 'upwork-user-909',
    provisioned_at: '2024-01-26T15:15:00Z',
    last_sync_at: '2024-01-30T13:45:00Z',
  }
];

// Platform connection statuses for testing
export const mockPlatformStatuses = new Map([
  ['amove', { 
    connected: true, 
    lastChecked: new Date().toISOString(),
    responseTime: 120,
    status: 'healthy'
  }],
  ['upwork', { 
    connected: true, 
    lastChecked: new Date().toISOString(),
    responseTime: 85,
    status: 'healthy'
  }],
  ['fiverr', { 
    connected: false, 
    lastChecked: new Date().toISOString(),
    responseTime: null,
    status: 'disconnected',
    error: 'Platform disabled'
  }],
  ['freelancer', { 
    connected: true, 
    lastChecked: new Date().toISOString(),
    responseTime: 150,
    status: 'healthy'
  }]
]);