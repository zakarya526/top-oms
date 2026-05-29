import React, { createContext, useCallback, useEffect, useMemo } from 'react';
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
   * True once a new OTA update has finished downloading and is staged, ready to
   * install. Drives the "Update available" banner. We never reload on our own —
   * a silent restart could interrupt an order or payment — so the user taps the
   * banner to apply it at a moment that suits them.
   */
  isUpdatePending: boolean;
  /** Restart the app to install the downloaded update. */
  applyUpdate: () => Promise<void>;
}

export const UpdatesContext = createContext<UpdatesContextType>({
  isUpdatePending: false,
  applyUpdate: async () => {},
});

/** Used when the native module is unavailable: just passes children through. */
function NoopUpdatesProvider({ children }: { children: React.ReactNode }) {
  return (
    <UpdatesContext.Provider value={{ isUpdatePending: false, applyUpdate: async () => {} }}>
      {children}
    </UpdatesContext.Provider>
  );
}

/** The real provider — only mounted when the expo-updates native module loaded. */
function ActiveUpdatesProvider({ children }: { children: React.ReactNode }) {
  const { isUpdatePending } = Updates!.useUpdates();

  // Ask the server for a new update and download it in the background. The
  // download completing flips `isUpdatePending`, which surfaces the banner.
  const checkAndFetch = useCallback(async () => {
    if (!Updates!.isEnabled) return; // dev / Expo Go — nothing to do
    try {
      const { isAvailable } = await Updates!.checkForUpdateAsync();
      if (isAvailable) await Updates!.fetchUpdateAsync();
    } catch {
      // Offline or transient server error — try again on the next trigger.
    }
  }, []);

  // Restart into the staged update. reloadAsync() drops in-memory state, so we
  // only ever call this in response to an explicit user tap on the banner.
  const applyUpdate = useCallback(async () => {
    await Updates!.reloadAsync();
  }, []);

  useEffect(() => {
    void checkAndFetch();

    const subscription = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') void checkAndFetch();
    });

    const interval = setInterval(() => void checkAndFetch(), CHECK_INTERVAL_MS);

    return () => {
      subscription.remove();
      clearInterval(interval);
    };
  }, [checkAndFetch]);

  const value = useMemo(() => ({ isUpdatePending, applyUpdate }), [isUpdatePending, applyUpdate]);

  return <UpdatesContext.Provider value={value}>{children}</UpdatesContext.Provider>;
}

/**
 * Quietly downloads the latest published OTA update in the background — on mount,
 * on every return to the foreground, and on a timer — then exposes a pending
 * flag so the UI can offer an "Update" button. It never reloads on its own; the
 * user decides when to apply, so a restart never interrupts a live order.
 *
 * Resolves to a no-op when the expo-updates native module isn't present (so it
 * never crashes a build made before the module was added, or web).
 */
export const UpdatesProvider = Updates ? ActiveUpdatesProvider : NoopUpdatesProvider;
