import { useContext } from 'react';

import { UpdatesContext } from '@/lib/providers/UpdatesProvider';

/**
 * Access the OTA-update state: whether a downloaded update is staged
 * (`isUpdatePending`) and the action to install it (`applyUpdate`). Used by the
 * "Update available" banner.
 */
export function useUpdates() {
  return useContext(UpdatesContext);
}
