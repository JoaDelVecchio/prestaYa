const SOUND_PREF_KEY = 'accessibility:disableSounds';
const HAPTIC_PREF_KEY = 'accessibility:disableHaptics';

const canUseWindow = () => typeof window !== 'undefined';

const allows = (key: string) => {
  if (!canUseWindow()) return false;
  try {
    return window.localStorage.getItem(key) !== 'true';
  } catch (error) {
    return true;
  }
};

export const allowsSound = () => allows(SOUND_PREF_KEY);
export const allowsHaptics = () => allows(HAPTIC_PREF_KEY);

export function triggerHapticSuccess() {
  if (!canUseWindow() || !allowsHaptics()) return;
  if (navigator.vibrate) {
    navigator.vibrate(10);
  }
}

export function triggerHapticError() {
  if (!canUseWindow() || !allowsHaptics()) return;
  if (navigator.vibrate) {
    navigator.vibrate([0, 40, 40, 40]);
  }
}

function playTone(frequency: number, duration = 160) {
  if (!canUseWindow() || !allowsSound()) return;
  try {
    const audioContext = new AudioContext();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;
    gain.gain.value = 0.05;

    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration / 1000);
  } catch (error) {
    // ignore audio errors silently
  }
}

export function playSuccessTone() {
  playTone(880, 140);
}

export function playErrorTone() {
  playTone(220, 200);
}
