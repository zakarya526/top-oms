import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';

const STORAGE_KEY = 'order_sounds_muted';

interface SoundStore {
  /** When true, order-flow chimes are suppressed on this device. */
  muted: boolean;
  setMuted: (muted: boolean) => void;
  toggleMuted: () => void;
}

export const useSoundStore = create<SoundStore>((set, get) => ({
  muted: false,
  setMuted: (muted) => {
    set({ muted });
    // Persist per-device, best effort (SecureStore is unavailable on web).
    SecureStore.setItemAsync(STORAGE_KEY, muted ? '1' : '0').catch(() => {});
  },
  toggleMuted: () => get().setMuted(!get().muted),
}));

// Hydrate the saved preference on startup so a muted device stays muted.
SecureStore.getItemAsync(STORAGE_KEY)
  .then((value) => {
    if (value === '1') useSoundStore.setState({ muted: true });
  })
  .catch(() => {});
