import { 
  mockOrganizations, 
  mockUsers, 
  mockPlatformConfigs, 
  mockFreelancers, 
  mockFreelancerPlatforms 
} from './data';

// Mock database that simulates Supabase behavior
class MockSupabaseClient {
  private data = {
    organizations: [...mockOrganizations],
    users: [...mockUsers],
    platforms: [...mockPlatformConfigs], // Use 'platforms' to match the API calls
    platform_configs: [...mockPlatformConfigs], // Keep old name for backward compatibility
    freelancers: [...mockFreelancers],
    freelancer_platforms: [...mockFreelancerPlatforms]
  };

  private subscriptions = new Map<string, Array<{ callback: Function; filter?: any }>>();

  // Helper to simulate async operations
  private async delay(ms: number = 100) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Generate unique IDs
  private generateId(prefix: string = 'mock') {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }

  // Mock table operations
  from(table: string) {
    return {
      select: (columns: string = '*') => ({
        eq: (column: string, value: any) => ({
          order: (orderColumn: string, options: any = {}) => this.selectOrderedWithFilter(table, columns, { [column]: value }, orderColumn, options),
          single: () => this.selectSingle(table, columns, { [column]: value }),
          then: (callback: any) => this.select(table, columns, { [column]: value }).then(callback)
        }),
        in: (column: string, values: any[]) => this.selectIn(table, columns, column, values),
        order: (column: string, options: any = {}) => this.selectOrdered(table, columns, column, options),
        single: () => this.selectSingle(table, columns),
        range: (from: number, to: number) => this.selectRange(table, columns, from, to),
        then: (callback: any) => this.select(table, columns).then(callback)
      }),
      insert: (data: any) => ({
        select: (columns: string = '*') => ({
          single: () => this.insertSingle(table, data),
          then: (callback: any) => this.insert(table, data, columns).then(callback)
        }),
        single: () => this.insertSingle(table, data),
        then: (callback: any) => this.insert(table, data, '*').then(callback)
      }),
      update: (data: any) => ({
        eq: (column: string, value: any) => ({
          select: (_columns: string = '*') => this.update(table, data, { [column]: value }),
          single: () => this.updateSingle(table, data, { [column]: value }),
          then: (callback: any) => this.update(table, data, { [column]: value }).then(callback)
        }),
        in: (column: string, values: any[]) => this.updateIn(table, data, column, values)
      }),
      delete: () => ({
        eq: (column: string, value: any) => this.delete(table, { [column]: value }),
        in: (column: string, values: any[]) => this.deleteIn(table, column, values)
      })
    };
  }

  private async select(table: string, _columns: string, filter: any = {}) {
    await this.delay();
    
    const tableData = this.data[table as keyof typeof this.data] || [];
    let filtered = tableData as any[];

    // Apply filters
    Object.entries(filter).forEach(([key, value]) => {
      filtered = filtered.filter((row: any) => row[key] === value);
    });

    return { data: filtered as any, error: null };
  }

  private async selectIn(table: string, _columns: string, column: string, values: any[]) {
    await this.delay();
    
    const tableData = this.data[table as keyof typeof this.data] || [];
    const filtered = tableData.filter((row: any) => values.includes(row[column]));

    return { data: filtered, error: null };
  }

  private async selectOrdered(table: string, columns: string, column: string, options: any) {
    const { data, error } = await this.select(table, columns);
    if (error) return { data, error };

    const sorted = [...data].sort((a: any, b: any) => {
      const aVal = a[column];
      const bVal = b[column];
      
      if (options.ascending === false) {
        return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
      }
      return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
    });

    return { data: sorted, error: null };
  }

  private async selectOrderedWithFilter(table: string, columns: string, filter: any, orderColumn: string, options: any) {
    const { data, error } = await this.select(table, columns, filter);
    if (error) return { data, error };

    const sorted = [...data].sort((a: any, b: any) => {
      const aVal = a[orderColumn];
      const bVal = b[orderColumn];
      
      if (options.ascending === false) {
        return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
      }
      return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
    });

    return { data: sorted, error: null };
  }

  private async selectSingle(table: string, columns: string, filter: any = {}) {
    const { data, error } = await this.select(table, columns, filter);
    if (error) return { data: null, error };
    
    return { data: data[0] || null, error: null };
  }

  private async updateSingle(table: string, updateData: any, filter: any) {
    const { data, error } = await this.update(table, updateData, filter);
    if (error) return { data: null, error };
    
    return { data: data[0] || null, error: null };
  }

  private async selectRange(table: string, columns: string, from: number, to: number) {
    const { data, error } = await this.select(table, columns);
    if (error) return { data, error };
    
    return { data: data.slice(from, to + 1), error: null };
  }

  private async insert(table: string, insertData: any, _columns: string) {
    await this.delay();
    
    const tableData = this.data[table as keyof typeof this.data] as any[];
    const newRecord = {
      id: this.generateId(table.slice(0, 3)),
      ...insertData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    tableData.push(newRecord);
    this.notifySubscribers(table, 'INSERT', newRecord);

    return { data: [newRecord], error: null };
  }

  private async insertSingle(table: string, insertData: any) {
    const { data, error } = await this.insert(table, insertData, '*');
    return { data: data?.[0] || null, error };
  }

  private async update(table: string, updateData: any, filter: any) {
    await this.delay();
    
    const tableData = this.data[table as keyof typeof this.data] as any[];
    const updatedRecords: any[] = [];

    tableData.forEach((record, index) => {
      const matches = Object.entries(filter).every(([key, value]) => record[key] === value);
      
      if (matches) {
        const updatedRecord = {
          ...record,
          ...updateData,
          updated_at: new Date().toISOString()
        };
        tableData[index] = updatedRecord;
        updatedRecords.push(updatedRecord);
        this.notifySubscribers(table, 'UPDATE', updatedRecord);
      }
    });

    return { data: updatedRecords, error: null };
  }

  private async updateIn(table: string, updateData: any, column: string, values: any[]) {
    await this.delay();
    
    const tableData = this.data[table as keyof typeof this.data] as any[];
    const updatedRecords: any[] = [];

    tableData.forEach((record, index) => {
      if (values.includes(record[column])) {
        const updatedRecord = {
          ...record,
          ...updateData,
          updated_at: new Date().toISOString()
        };
        tableData[index] = updatedRecord;
        updatedRecords.push(updatedRecord);
        this.notifySubscribers(table, 'UPDATE', updatedRecord);
      }
    });

    return { data: updatedRecords, error: null };
  }

  private async delete(table: string, filter: any) {
    await this.delay();
    
    const tableData = this.data[table as keyof typeof this.data] as any[];
    const deletedRecords: any[] = [];

    for (let i = tableData.length - 1; i >= 0; i--) {
      const record = tableData[i];
      const matches = Object.entries(filter).every(([key, value]) => record[key] === value);
      
      if (matches) {
        const deleted = tableData.splice(i, 1)[0];
        deletedRecords.push(deleted);
        this.notifySubscribers(table, 'DELETE', deleted);
      }
    }

    return { data: deletedRecords, error: null };
  }

  private async deleteIn(table: string, column: string, values: any[]) {
    await this.delay();
    
    const tableData = this.data[table as keyof typeof this.data] as any[];
    const deletedRecords: any[] = [];

    for (let i = tableData.length - 1; i >= 0; i--) {
      const record = tableData[i];
      if (values.includes(record[column])) {
        const deleted = tableData.splice(i, 1)[0];
        deletedRecords.push(deleted);
        this.notifySubscribers(table, 'DELETE', deleted);
      }
    }

    return { data: deletedRecords, error: null };
  }

  // Mock auth
  auth = {
    getUser: async () => {
      await this.delay();
      // Return the first user as authenticated for testing
      return { 
        data: { 
          user: { 
            id: mockUsers[0].id, 
            email: mockUsers[0].email 
          } 
        }, 
        error: null 
      };
    },
    getSession: async () => {
      await this.delay();
      // Check localStorage for selected user, default to admin
      const selectedUserId = localStorage.getItem('mock-selected-user-id') || mockUsers[0].id;
      const selectedUser = mockUsers.find(u => u.id === selectedUserId) || mockUsers[0];
      
      return {
        data: {
          session: {
            access_token: 'mock-token',
            user: {
              id: selectedUser.id,
              email: selectedUser.email
            }
          }
        },
        error: null
      };
    },
    signUp: async (credentials: { email: string; password: string; options?: any }) => {
      await this.delay();
      // Simulate successful signup
      const newUser = {
        id: this.generateId('user'),
        email: credentials.email,
        full_name: credentials.options?.data?.full_name || 'Test User'
      };
      
      return {
        data: {
          user: newUser,
          session: {
            access_token: 'mock-token',
            user: newUser
          }
        },
        error: null
      };
    },
    signInWithPassword: async (credentials: { email: string; password: string }) => {
      await this.delay();
      
      // In mock mode, accept any credentials
      if (credentials.email && credentials.password) {
        // Try to find existing user or create a mock user
        let user = mockUsers.find(u => u.email === credentials.email);
        
        if (!user) {
          // Create a temporary user for any email
          user = {
            id: this.generateId('user'),
            email: credentials.email,
            full_name: 'Demo User',
            organization_id: mockUsers[0].organization_id,
            role: 'admin' as const,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            is_active: true
          };
        }
        
        return {
          data: {
            user: { id: user.id, email: user.email },
            session: { 
              access_token: 'mock-token',
              user: { id: user.id, email: user.email }
            }
          },
          error: null
        };
      }
      
      return {
        data: { user: null, session: null },
        error: { message: 'Email and password are required' }
      };
    },
    updateUser: async (attributes: { email?: string; password?: string; data?: any }) => {
      await this.delay();
      // Simulate user update
      return {
        data: {
          user: {
            id: mockUsers[0].id,
            email: attributes.email || mockUsers[0].email,
            ...attributes.data
          }
        },
        error: null
      };
    },
    resetPasswordForEmail: async (_email: string, _options?: any) => {
      await this.delay();
      // Simulate password reset email
      return { error: null };
    },
    signOut: async () => {
      await this.delay();
      return { error: null };
    },
    onAuthStateChange: (callback: Function) => {
      // Simulate initial auth state
      setTimeout(() => {
        const selectedUserId = localStorage.getItem('mock-selected-user-id') || mockUsers[0].id;
        const selectedUser = mockUsers.find(u => u.id === selectedUserId) || mockUsers[0];
        
        callback('SIGNED_IN', { 
          user: { 
            id: selectedUser.id, 
            email: selectedUser.email 
          } 
        });
      }, 100);
      
      return {
        data: { subscription: { unsubscribe: () => {} } }
      };
    }
  };

  // Mock realtime subscriptions with proper method chaining
  channel(name: string) {
    const channelObj = {
      subscriptions: [] as Array<{ event: string; config: any; callback: Function }>,
      
      on: (event: string, config: any, callback: Function) => {
        // Store subscription info
        channelObj.subscriptions.push({ event, config, callback });
        
        // Register with global subscriptions
        const key = `${name}:${event}:${config.table || 'all'}`;
        if (!this.subscriptions.has(key)) {
          this.subscriptions.set(key, []);
        }
        this.subscriptions.get(key)!.push({ callback, filter: config.filter });
        
        // Return channel object for chaining
        return channelObj;
      },
      
      subscribe: (statusCallback?: (status: string) => void) => {
        // Simulate successful subscription
        if (statusCallback) {
          setTimeout(() => statusCallback('SUBSCRIBED'), 10);
        }
        
        // Return channel object for method chaining
        return {
          ...channelObj,
          unsubscribe: () => {
            // Clean up subscriptions for this channel
            const keysToDelete = Array.from(this.subscriptions.keys()).filter(key => key.startsWith(name));
            keysToDelete.forEach(key => this.subscriptions.delete(key));
            return Promise.resolve();
          }
        };
      },
      
      unsubscribe: () => {
        // Clean up subscriptions for this channel
        const keysToDelete = Array.from(this.subscriptions.keys()).filter(key => key.startsWith(name));
        keysToDelete.forEach(key => this.subscriptions.delete(key));
        return Promise.resolve();
      }
    };
    
    return channelObj;
  }

  // Add removeChannel method for compatibility
  removeChannel(subscription: any) {
    if (subscription && subscription.unsubscribe) {
      return subscription.unsubscribe();
    }
    return Promise.resolve();
  }
  
  // Add removeAllChannels method for compatibility
  removeAllChannels() {
    this.subscriptions.clear();
    return Promise.resolve();
  }

  private notifySubscribers(table: string, _event: string, record: any) {
    // Notify relevant subscribers
    this.subscriptions.forEach((subscribers, key) => {
      if (key.includes(table) || key.includes('all')) {
        subscribers.forEach(({ callback, filter }) => {
          // Apply filter if present
          if (filter) {
            const filterParts = filter.split('=');
            if (filterParts.length === 2) {
              const [column, value] = filterParts.map((s: any) => s.replace('eq.', ''));
              if (record[column] !== value) return;
            }
          }
          
          // Simulate async callback
          setTimeout(() => callback(record), 10);
        });
      }
    });
  }
  
  // Add RPC method for stored procedures
  rpc(functionName: string, params?: any) {
    return {
      then: async (callback: any) => {
        await this.delay();
        // Mock stored procedure responses
        let mockData = null;
        
        switch (functionName) {
          case 'get_organization_stats':
            mockData = {
              total_users: mockUsers.length,
              total_freelancers: mockFreelancers.length,
              active_platforms: mockPlatformConfigs.filter(p => p.enabled).length,
              total_platform_connections: mockFreelancerPlatforms.length
            };
            break;
          case 'search_freelancers':
            mockData = mockFreelancers.filter(f => 
              f.organization_id === params?.org_id &&
              (f.full_name.toLowerCase().includes(params?.search_term?.toLowerCase() || '') ||
               f.email.toLowerCase().includes(params?.search_term?.toLowerCase() || ''))
            );
            break;
          default:
            mockData = null;
        }
        
        return callback({ data: mockData, error: null });
      }
    };
  }
}

// Create singleton mock client
export const mockSupabase = new MockSupabaseClient();

// Export for use in place of real supabase
export { mockSupabase as supabase };