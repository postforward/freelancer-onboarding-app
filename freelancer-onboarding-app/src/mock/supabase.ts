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
    platform_configs: [...mockPlatformConfigs],
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
        eq: (column: string, value: any) => this.select(table, columns, { [column]: value }),
        in: (column: string, values: any[]) => this.selectIn(table, columns, column, values),
        order: (column: string, options: any = {}) => this.selectOrdered(table, columns, column, options),
        single: () => this.selectSingle(table, columns),
        range: (from: number, to: number) => this.selectRange(table, columns, from, to)
      }),
      insert: (data: any) => ({
        select: (columns: string = '*') => this.insert(table, data, columns),
        single: () => this.insertSingle(table, data)
      }),
      update: (data: any) => ({
        eq: (column: string, value: any) => this.update(table, data, { [column]: value }),
        in: (column: string, values: any[]) => this.updateIn(table, data, column, values)
      }),
      delete: () => ({
        eq: (column: string, value: any) => this.delete(table, { [column]: value }),
        in: (column: string, values: any[]) => this.deleteIn(table, column, values)
      })
    };
  }

  private async select(table: string, columns: string, filter: any = {}) {
    await this.delay();
    
    const tableData = this.data[table as keyof typeof this.data] || [];
    let filtered = tableData;

    // Apply filters
    Object.entries(filter).forEach(([key, value]) => {
      filtered = filtered.filter((row: any) => row[key] === value);
    });

    return { data: filtered, error: null };
  }

  private async selectIn(table: string, columns: string, column: string, values: any[]) {
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

  private async selectSingle(table: string, columns: string) {
    const { data, error } = await this.select(table, columns);
    if (error) return { data: null, error };
    
    return { data: data[0] || null, error: null };
  }

  private async selectRange(table: string, columns: string, from: number, to: number) {
    const { data, error } = await this.select(table, columns);
    if (error) return { data, error };
    
    return { data: data.slice(from, to + 1), error: null };
  }

  private async insert(table: string, insertData: any, columns: string) {
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
    signInWithPassword: async (credentials: { email: string; password: string }) => {
      await this.delay();
      const user = mockUsers.find(u => u.email === credentials.email);
      
      if (user && credentials.password === 'password') {
        return {
          data: {
            user: { id: user.id, email: user.email },
            session: { access_token: 'mock-token' }
          },
          error: null
        };
      }
      
      return {
        data: { user: null, session: null },
        error: { message: 'Invalid credentials' }
      };
    },
    signOut: async () => {
      await this.delay();
      return { error: null };
    },
    onAuthStateChange: (callback: Function) => {
      // Simulate initial auth state
      setTimeout(() => {
        callback('SIGNED_IN', { 
          user: { 
            id: mockUsers[0].id, 
            email: mockUsers[0].email 
          } 
        });
      }, 100);
      
      return {
        data: { subscription: { unsubscribe: () => {} } }
      };
    }
  };

  // Mock realtime subscriptions
  channel(name: string) {
    return {
      on: (event: string, config: any, callback: Function) => {
        const key = `${name}:${event}:${config.table || 'all'}`;
        if (!this.subscriptions.has(key)) {
          this.subscriptions.set(key, []);
        }
        this.subscriptions.get(key)!.push({ callback, filter: config.filter });
        
        return this;
      },
      subscribe: () => {
        return Promise.resolve();
      },
      unsubscribe: () => {
        // Clean up subscriptions for this channel
        const keysToDelete = Array.from(this.subscriptions.keys()).filter(key => key.startsWith(name));
        keysToDelete.forEach(key => this.subscriptions.delete(key));
        return Promise.resolve();
      }
    };
  }

  private notifySubscribers(table: string, event: string, record: any) {
    // Notify relevant subscribers
    this.subscriptions.forEach((subscribers, key) => {
      if (key.includes(table) || key.includes('all')) {
        subscribers.forEach(({ callback, filter }) => {
          // Apply filter if present
          if (filter) {
            const filterParts = filter.split('=');
            if (filterParts.length === 2) {
              const [column, value] = filterParts.map(s => s.replace('eq.', ''));
              if (record[column] !== value) return;
            }
          }
          
          // Simulate async callback
          setTimeout(() => callback(record), 10);
        });
      }
    });
  }
}

// Create singleton mock client
export const mockSupabase = new MockSupabaseClient();

// Export for use in place of real supabase
export { mockSupabase as supabase };