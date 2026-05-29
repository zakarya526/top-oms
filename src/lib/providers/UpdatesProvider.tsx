import * as Updates from 'expo-updates';
import React, { createContext, useCallback, useEffect, useMemo, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

/**
 * How often to poll for a new OTA update on always-on devices. Kitchen displays
 * and waiter tablets can stay in the foreground for an entire shift without ever
 * cold-booting, and expo-updates' default behaviour only checks on launch — so
 * without this poll such a device would never pick up a published update.
 */
const CHECK_INTERVAL_MS = 15 * 60 * 1000;

interface UpdatesContextType {
  /**
   * Defer OTA reloads while the app is in a flow that must not be interrupted
   * (an order being edited, a payment in flight, …). Call `blockUpdates(true)`
   * when entering such a flow and `blockUpdates(false)` when leaving it; an
   * update that downloaded in the meantime is applied as soon as it's unblocked.
   */
  blockUpdates: (blocked: boolean) => void;
}

export const UpdatesContext = createContext<UpdatesContextType>({
  blockUpdates: () => {},
});

/**
 * Silently keeps the app on the latest published OTA update. It checks on mount,
 * on every return to the foreground, and on a timer; downloads new updates in
 * the background; and reloads the app to apply them — but only when it's safe
 * (foregrounded, and no critical flow has called `blockUpdates(true)`).
 *
 * No-ops entirely in Expo Go / development builds, where expo-updates is disabled
 * and the JS is always served from the dev server.
 */
export function UpdatesProvider({ children }: { children: React.ReactNode }) {
  const { isUpdatePending } = Updates.useUpdates();

  const blockedRef = useRef(false);
  const pendingRef = useRef(false);

  // Mirror the staged-update flag into a ref so the imperative "flush on unblock"
  // path can read the latest value without re-subscribing.
  useEffect(() => {
    pendingRef.current = isUpdatePending;
  }, [isUpdatePending]);

  // Apply a downloaded update, but only at a safe moment. reloadAsync() restarts
  // the app and drops in-memory state, so we never fire it mid-critical-flow, and
  // never while backgrounded (where reloadAsync is documented as unstable).
  const applyIfSafe = useCallback(async () => {
    if (!pendingRef.current || blockedRef.current) return;
    if (AppState.currentState !== 'active') return;
    try {
      await Updates.reloadAsync();
    } catch {
      // Leave the update staged; we'll retry on the next safe moment / boot.
    }
  }, []);

  // Ask the server for a new update and download it in the background. The
  // download completing flips `isUpdatePending`, which drives the apply effect.
  const checkAndFetch = useCallback(async () => {
    if (!Updates.isEnabled) return; // dev / Expo Go — nothing to do
    try {
      const { isAvailable } = await Updates.checkForUpdateAsync();
      if (isAvailable) await Updates.fetchUpdateAsync();
    } catch {
      // Offline or transient server error — try again on the next trigger.
    }
  }, []);

  // Whenever an update becomes staged (from our fetch or the launch-time check),
  // try to apply it.
  useEffect(() => {
    if (isUpdatePending) void applyIfSafe();
  }, [isUpdatePending, applyIfSafe]);

  useEffect(() => {
    void checkAndFetch();

    const subscription = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') {
        void checkAndFetch();
        void applyIfSafe(); // apply anything staged while we were backgrounded
      }
    });

    const interval = setInterval(() => void checkAndFetch(), CHECK_INTERVAL_MS);

    return () => {
      subscription.remove();
      clearInterval(interval);
    };
  }, [checkAndFetch, applyIfSafe]);

  const blockUpdates = useCallback(
    (blocked: boolean) => {
      blockedRef.current = blocked;
      if (!blocked) void applyIfSafe(); // flush a waiting update
    },
    [applyIfSafe],
  );

  const value = useMemo(() => ({ blockUpdates }), [blockUpdates]);

  return <UpdatesContext.Provider value={value}>{children}</UpdatesContext.Provider>;
}
