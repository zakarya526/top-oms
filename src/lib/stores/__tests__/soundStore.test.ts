import * as SecureStore from 'expo-secure-store';

import { useSoundStore } from '@/lib/stores/soundStore';

const store = () => useSoundStore.getState();

describe('useSoundStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useSoundStore.setState({ muted: false });
  });

  it('defaults to unmuted', () => {
    expect(store().muted).toBe(false);
  });

  it('setMuted(true) mutes and persists "1"', () => {
    store().setMuted(true);
    expect(store().muted).toBe(true);
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('order_sounds_muted', '1');
  });

  it('setMuted(false) unmutes and persists "0"', () => {
    store().setMuted(false);
    expect(store().muted).toBe(false);
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('order_sounds_muted', '0');
  });

  it('toggleMuted flips the current value', () => {
    expect(store().muted).toBe(false);
    store().toggleMuted();
    expect(store().muted).toBe(true);
    store().toggleMuted();
    expect(store().muted).toBe(false);
  });

  it('does not throw when persistence rejects', () => {
    (SecureStore.setItemAsync as jest.Mock).mockRejectedValueOnce(new Error('no keystore'));
    expect(() => store().setMuted(true)).not.toThrow();
    expect(store().muted).toBe(true);
  });
});
