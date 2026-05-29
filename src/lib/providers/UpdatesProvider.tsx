import React, { createContext, useCallback, useEffect, useMemo, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

/**
 * expo-updates is a native module. A build created BEFORE it was added (a stale
 * dev client, web, …) doesn't contain the native side, and importing it throws
 * "Cannot find native module 'ExpoUpdates'" at load time — which would crash the
 * whole app. Load it defensively so the provider degrades to a no-op until a
 * build that actually includes the module is installed. Updates are disabled in
 * dev builds regardless, so the no-op costs nothing there.
 */
let Updates: typeof import('expo-updates') | undefined;
try {
  // require (not import) so a missing native module is catchable rather than a
  // hard load-time crash.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  Updates = require('expo-updates');
} catch {
  Updates = undefined;
}

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

/** Used when the native module is unavailable: just passes children through. */
function NoopUpdatesProvider({ children }: { children: React.ReactNode }) {
  return (
    <UpdatesContext.Provider value={{ blockUpdates: () => {} }}>{children}</UpdatesContext.Provider>
  );
}

/** The real provider — only mounted when the expo-updates native module loaded. */
function ActiveUpdatesProvider({ children }: { children: React.ReactNode }) {
  const { isUpdatePending } = Updates!.useUpdates();

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
      await Updates!.reloadAsync();
    } catch {
      // Leave the update staged; we'll retry on the next safe moment / boot.
    }
  }, []);

  // Ask the server for a new update and download it in the background. The
  // download completing flips `isUpdatePending`, which drives the apply effect.
  const checkAndFetch = useCallback(async () => {
    if (!Updates!.isEnabled) return; // dev / Expo Go — nothing to do
    try {
      const { isAvailable } = await Updates!.checkForUpdateAsync();
      if (isAvailable) await Updates!.fetchUpdateAsync();
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

/**
 * Silently keeps the app on the latest published OTA update. It checks on mount,
 * on every return to the foreground, and on a timer; downloads new updates in
 * the background; and reloads the app to apply them — but only when it's safe
 * (foregrounded, and no critical flow has called `blockUpdates(true)`).
 *
 * Resolves to a no-op when the expo-updates native module isn't present (so it
 * never crashes a build made before the module was added, or web).
 */
export const UpdatesProvider = Updates ? ActiveUpdatesProvider : NoopUpdatesProvider;
