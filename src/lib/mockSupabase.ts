// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js';

// Mock User Data
const MOCK_USER: User = {
  id: 'mock-user-123',
  app_metadata: { provider: 'email' },
  user_metadata: {
    first_name: 'Demo',
    last_name: 'User',
  },
  aud: 'authenticated',
  created_at: new Date().toISOString(),
  email: 'demo@example.com',
  phone: '',
  role: 'authenticated',
  updated_at: new Date().toISOString(),
};

const MOCK_SESSION: Session = {
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  expires_in: 3600,
  token_type: 'bearer',
  user: MOCK_USER,
};

// Storage for mock DB
const mockStorage: Record<string, any[]> = {
  profiles: [
    {
      id: MOCK_USER.id,
      email: MOCK_USER.email,
      first_name: 'Demo',
      last_name: 'User',
      onboarding_completed: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  ],
  users: [
      {
          id: MOCK_USER.id,
          email: MOCK_USER.email,
          full_name: 'Demo User',
          created_at: new Date().toISOString(),
      }
  ],
  jobs: [],
  events: [],
  host_families: [],
  au_pairs: [],
};

// Chainable Mock Query Builder
class MockQueryBuilder {
  private table: string;
  private data: any[];
  private error: any = null;

  constructor(table: string) {
    this.table = table;
    this.data = mockStorage[table] || [];
  }

  select(_columns?: string) {
    // Simulating select - just return self for chaining, data filtering happens at end if needed
    // For now, we return all data for the table
    return this;
  }

  insert(data: any) {
    if (!mockStorage[this.table]) mockStorage[this.table] = [];
    
    const newRecord = { ...data, id: Math.random().toString(36).substr(2, 9), created_at: new Date().toISOString() };
    mockStorage[this.table].push(newRecord);
    this.data = [newRecord];
    return this;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  update(_data: any) {
    // We can't easily update without a where clause first, but in this simple mock
    // we will pretend we updated everything filtered so far (which is all if no filter)
    // Realistically, update comes after eq usually.
    return this;
  }

  upsert(data: any) {
    return this.insert(data);
  }

  eq(column: string, value: any) {
    this.data = this.data.filter(item => item[column] === value);
    return this;
  }

  neq(column: string, value: any) {
    this.data = this.data.filter(item => item[column] !== value);
    return this;
  }
  
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  gt(column: string, value: any) {
    this.data = this.data.filter(item => item[column] > value);
    return this;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  lt(column: string, value: any) {
    this.data = this.data.filter(item => item[column] < value);
    return this;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  gte(column: string, value: any) {
    this.data = this.data.filter(item => item[column] >= value);
    return this;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  lte(column: string, value: any) {
    this.data = this.data.filter(item => item[column] <= value);
    return this;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  like(_column: string, _value: any) { return this; }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ilike(_column: string, _value: any) { return this; }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  is(column: string, value: any) {
    this.data = this.data.filter(item => item[column] === value);
    return this;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  in(column: string, value: any[]) {
    this.data = this.data.filter(item => value.includes(item[column]));
    return this;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  contains(_column: string, _value: any) { return this; }
  
  order(column: string, opts?: { ascending?: boolean }) {
    const ascending = opts?.ascending ?? true;
    this.data.sort((a, b) => {
      if (a[column] < b[column]) return ascending ? -1 : 1;
      if (a[column] > b[column]) return ascending ? 1 : -1;
      return 0;
    });
    return this;
  }
  limit(count: number) { 
      this.data = this.data.slice(0, count);
      return this; 
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  range(from: number, to: number) {
    this.data = this.data.slice(from, to + 1);
    return this;
  }
  
  single() {
    return { data: this.data[0] || null, error: this.data.length === 0 ? { message: 'No rows found' } : null };
  }

  maybeSingle() {
    return { data: this.data[0] || null, error: null };
  }

  async then(resolve: (res: { data: any, error: any }) => void) {
    // Make it thenable to await it
    resolve({ data: this.data, error: this.error });
  }
}

export const mockSupabase = {
  auth: {
    getSession: async () => {
      // Check local storage for "mock-session"
      const stored = localStorage.getItem('mock-session');
      if (stored) {
        return { data: { session: JSON.parse(stored) }, error: null };
      }
      return { data: { session: null }, error: null };
    },
    onAuthStateChange: (callback: (event: AuthChangeEvent, session: Session | null) => void) => {
        // Trigger initial state
        const stored = localStorage.getItem('mock-session');
        if (stored) {
            callback('SIGNED_IN', JSON.parse(stored));
        } else {
            callback('SIGNED_OUT', null);
        }
        
        return { data: { subscription: { unsubscribe: () => {} } } };
    },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    signUp: async ({ email, password: _password }: any) => {
        const session = { ...MOCK_SESSION, user: { ...MOCK_USER, email } };
        localStorage.setItem('mock-session', JSON.stringify(session));
        // Simulate a reload or event trigger? 
        // In a real app, onAuthStateChange fires. Here we might need to manually trigger if we could.
        // But for now, returning success is enough.
        return { data: { user: session.user, session }, error: null };
    },
    signInWithPassword: async ({ email, password }: any) => {
        if (password === 'error') {
            return { data: { user: null, session: null }, error: { message: 'Invalid login' } };
        }
        const session = { ...MOCK_SESSION, user: { ...MOCK_USER, email } };
        localStorage.setItem('mock-session', JSON.stringify(session));
        // Force reload to update UI state since we can't easily trigger the subscriber from here without an event emitter
        setTimeout(() => window.location.reload(), 500); 
        return { data: { user: session.user, session }, error: null };
    },
    signInWithOAuth: async () => {
        return { data: { url: 'http://localhost:5173' }, error: null };
    },
    signOut: async () => {
        localStorage.removeItem('mock-session');
        setTimeout(() => window.location.reload(), 100);
        return { error: null };
    },
    getUser: async () => {
        const stored = localStorage.getItem('mock-session');
        return { data: { user: stored ? JSON.parse(stored).user : null }, error: null };
    }
  },
  from: (table: string) => {
    return new MockQueryBuilder(table);
  },
  storage: {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      from: (_bucket: string) => ({
          upload: async () => ({ data: { path: 'mock-path' }, error: null }),
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          getPublicUrl: (_path: string) => ({ data: { publicUrl: 'https://via.placeholder.com/150' } }),
      })
  }
};
