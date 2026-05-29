import { renderHook } from '@testing-library/react-native';
import React from 'react';

import { AuthContext } from '@/lib/providers/AuthProvider';

// AuthProvider pulls in the Supabase client at import time; stub it so importing
// AuthContext doesn't try to build a real client from missing env vars.
jest.mock('@/lib/supabase', () => ({ supabase: {} }));

// Import after the mock is registered.
import { useAuth } from '@/lib/hooks/useAuth';

describe('useAuth', () => {
  it('returns the value supplied by AuthContext.Provider', () => {
    const value = {
      session: { user: { id: 'u1' } },
      profile: { id: 'u1', role: 'admin' },
      loading: false,
    } as any;

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.profile?.role).toBe('admin');
    expect(result.current.loading).toBe(false);
    expect(result.current.session?.user.id).toBe('u1');
  });

  it('falls back to the default context (loading) with no provider', () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current.loading).toBe(true);
    expect(result.current.session).toBeNull();
    expect(result.current.profile).toBeNull();
  });
});
