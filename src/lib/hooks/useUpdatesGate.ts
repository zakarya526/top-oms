import { useContext } from 'react';

import { UpdatesContext } from '@/lib/providers/UpdatesProvider';

/**
 * Access the OTA-update gate. Screens with critical, interruptible flows call
 * `blockUpdates(true)` on entry and `blockUpdates(false)` on exit so a silent
 * OTA reload never restarts the app mid-order or mid-payment.
 */
export function useUpdatesGate() {
  return useContext(UpdatesContext);
}
