/* eslint-disable @typescript-eslint/no-require-imports -- expo-audio is loaded
   via require so a missing native module is catchable instead of a load-time
   crash; the asset .wav files use Metro's require-based asset resolution. */
import type { AudioPlayer } from 'expo-audio';

import { useSoundStore } from '@/lib/stores/soundStore';
import { Enums } from '@/lib/types/database';

type OrderStatus = Enums<'order_status'>;

/** Order-flow events that have a feedback chime. */
export type OrderSoundEvent = 'added' | OrderStatus;

// expo-audio is a native module. A build made BEFORE it was added (a stale dev
// client) or web won't contain the native side, so load it defensively — missing
// audio then degrades to silence rather than crashing the app.
let audio: typeof import('expo-audio') | undefined;
try {
  audio = require('expo-audio');
} catch {
  audio = undefined;
}

// Metro needs literal require paths. Statuses with no entry (e.g. "pending")
// simply no-op when passed in.
const SOURCES: Partial<Record<OrderSoundEvent, number>> = {
  added: require('../../../assets/sounds/added.wav'),
  preparing: require('../../../assets/sounds/preparing.wav'),
  ready: require('../../../assets/sounds/ready.wav'),
  served: require('../../../assets/sounds/served.wav'),
  completed: require('../../../assets/sounds/completed.wav'),
  cancelled: require('../../../assets/sounds/cancelled.wav'),
};

const players: Partial<Record<OrderSoundEvent, AudioPlayer>> = {};
let audioModeReady = false;

/**
 * Play the feedback chime for an order-flow event on the acting device. Safe to
 * call anywhere: no-ops when muted, when the native module is unavailable, or
 * when the event has no sound. Never throws — a chime must not break an order.
 */
export function playOrderSound(event: OrderSoundEvent) {
  if (!audio) return; // native module absent (stale dev client / web)
  if (useSoundStore.getState().muted) return;

  const source = SOURCES[event];
  if (source === undefined) return;

  try {
    if (!audioModeReady) {
      // A POS must stay audible even with the hardware silent switch on.
      audio.setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
      audioModeReady = true;
    }
    let player = players[event];
    if (!player) {
      player = audio.createAudioPlayer(source);
      players[event] = player;
    }
    player.seekTo(0); // rewind so rapid repeats replay from the start
    player.play();
  } catch {
    // Swallow — audio failures must never interrupt the order flow.
  }
}
