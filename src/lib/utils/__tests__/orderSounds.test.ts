// expo-audio is a native module; replace it with a controllable stub. The
// factory must be self-contained (Jest hoists it above the imports).
jest.mock('expo-audio', () => ({
  setAudioModeAsync: jest.fn(() => Promise.resolve()),
  createAudioPlayer: jest.fn(() => ({ seekTo: jest.fn(), play: jest.fn() })),
}));

jest.mock('@/lib/stores/soundStore', () => ({
  useSoundStore: { getState: jest.fn(() => ({ muted: false })) },
}));

type AudioMock = {
  setAudioModeAsync: jest.Mock;
  createAudioPlayer: jest.Mock;
};

/**
 * orderSounds keeps module-level caches (the audio-mode flag and a per-event
 * player map), so each test re-imports it fresh against the mocks above.
 */
function load() {
  let playOrderSound!: typeof import('@/lib/utils/orderSounds').playOrderSound;
  let audio!: AudioMock;
  let useSoundStore!: { getState: jest.Mock };
  // Capture the module's dependencies from INSIDE the same sandbox it is
  // required in, otherwise they're separate copies and the spies see no calls.
  jest.isolateModules(() => {
    audio = require('expo-audio') as AudioMock;
    useSoundStore = (require('@/lib/stores/soundStore') as { useSoundStore: { getState: jest.Mock } })
      .useSoundStore;
    playOrderSound = require('@/lib/utils/orderSounds').playOrderSound;
  });
  return { playOrderSound, audio, useSoundStore };
}

/** The player object handed back by the most recent createAudioPlayer call. */
function lastPlayer(audio: AudioMock) {
  const calls = audio.createAudioPlayer.mock.results;
  return calls[calls.length - 1]?.value as { seekTo: jest.Mock; play: jest.Mock };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('playOrderSound', () => {
  it('plays the chime for an event that has a sound', () => {
    const { playOrderSound, audio } = load();
    playOrderSound('ready');

    expect(audio.createAudioPlayer).toHaveBeenCalledTimes(1);
    const player = lastPlayer(audio);
    expect(player.seekTo).toHaveBeenCalledWith(0);
    expect(player.play).toHaveBeenCalledTimes(1);
  });

  it('configures the audio mode to stay audible with the silent switch on', () => {
    const { playOrderSound, audio } = load();
    playOrderSound('added');
    expect(audio.setAudioModeAsync).toHaveBeenCalledWith({ playsInSilentMode: true });
  });

  it('stays silent when muted', () => {
    const { playOrderSound, audio, useSoundStore } = load();
    useSoundStore.getState.mockReturnValue({ muted: true });

    playOrderSound('ready');
    expect(audio.createAudioPlayer).not.toHaveBeenCalled();
  });

  it('no-ops for a status that has no sound', () => {
    const { playOrderSound, audio } = load();
    playOrderSound('pending');
    expect(audio.createAudioPlayer).not.toHaveBeenCalled();
  });

  it('reuses the cached player for repeated plays of the same event', () => {
    const { playOrderSound, audio } = load();
    playOrderSound('served');
    playOrderSound('served');

    expect(audio.createAudioPlayer).toHaveBeenCalledTimes(1);
    expect(lastPlayer(audio).play).toHaveBeenCalledTimes(2);
  });

  it('never throws when playback fails', () => {
    const { playOrderSound, audio } = load();
    audio.createAudioPlayer.mockImplementationOnce(() => {
      throw new Error('audio engine down');
    });
    expect(() => playOrderSound('ready')).not.toThrow();
  });

  it('no-ops when the native audio module is unavailable', () => {
    let playOrderSound!: typeof import('@/lib/utils/orderSounds').playOrderSound;
    jest.isolateModules(() => {
      jest.doMock('expo-audio', () => {
        throw new Error('native module missing');
      });
      jest.doMock('@/lib/stores/soundStore', () => ({
        useSoundStore: { getState: () => ({ muted: false }) },
      }));
      playOrderSound = require('@/lib/utils/orderSounds').playOrderSound;
    });
    expect(() => playOrderSound('ready')).not.toThrow();
  });
});
