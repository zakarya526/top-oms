import { renderHook, waitFor } from '@testing-library/react-native';

// Mock the Supabase client before importing AuthProvider (which builds it at
// import time). The maybeSingle() mock is created inside the factory and pulled
// back out via the query chain below so each test can script its resolution.
jest.mock('@/lib/supabase', () => {
  const maybeSingle = jest.fn();
  return {
    supabase: {
      auth: {
        getSession: jest.fn(() =>
          Promise.resolve({ data: { session: { user: { id: 'u1' } } } }),
        ),
        onAuthStateChange: jest.fn(() => ({
          data: { subscription: { unsubscribe: jest.fn() } },
        })),
        signOut: jest.fn(() => Promise.resolve()),
      },
      from: jest.fn(() => ({
        select: () => ({ eq: () => ({ maybeSingle }) }),
      })),
    },
  };
});

import { supabase } from '@/lib/supabase';
import { AuthProvider } from '@/lib/providers/AuthProvider';
import { useAuth } from '@/lib/hooks/useAuth';

// The same jest.fn instance is reused across query-chain calls (closure), so
// this reaches the maybeSingle() the provider actually awaits.
const maybeSingle = (supabase as any)
  .from('user_profiles')
  .select('*')
  .eq('id', 'u1').maybeSingle as jest.Mock;

function makeProfile(overrides: Record<string, unknown> = {}) {
  return {
    id: 'u1',
    restaurant_id: 'rest-1',
    role: 'admin',
    full_name: 'Ada',
    is_active: true,
    created_at: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('AuthProvider profile fetch', () => {
  beforeEach(() => {
    maybeSingle.mockReset();
  });

  // Regression guard: a transient fetch error used to be indistinguishable from
  // "no profile row", which bounced fully-onboarded users into the signup flow.
  it('sets profileError (not a null "needs onboarding") when the fetch errors', async () => {
    maybeSingle.mockResolvedValue({ data: null, error: { message: 'network down' } });

    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.profileError).toBe(true);
    expect(result.current.profile).toBeNull();
  });

  it('does NOT set profileError when the fetch succeeds with no row (genuine onboarding)', async () => {
    maybeSingle.mockResolvedValue({ data: null, error: null });

    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.profileError).toBe(false);
    expect(result.current.profile).toBeNull();
  });

  it('loads the profile and keeps profileError false on success', async () => {
    maybeSingle.mockResolvedValue({ data: makeProfile(), error: null });

    const { result } = renderHook(() => useAuth(), { wrapper: AuthProvider });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.profileError).toBe(false);
    expect(result.current.profile?.role).toBe('admin');
  });
});
