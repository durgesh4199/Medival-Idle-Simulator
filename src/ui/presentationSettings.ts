import { create } from 'zustand'

let audio: AudioContext | null = null
const key = 'medieval-idle-reward-sound'
function initialSound() {
  try {
    return localStorage.getItem(key) === 'on'
  } catch {
    return false
  }
}
export const usePresentationSettings = create<{ soundEnabled: boolean; toggleSound: () => void }>(
  (set, get) => ({
    soundEnabled: initialSound(),
    toggleSound: () => {
      const enabled = !get().soundEnabled
      if (enabled && typeof AudioContext !== 'undefined') {
        audio ??= new AudioContext()
        void audio.resume().catch(() => {})
      }
      set({ soundEnabled: enabled })
      try {
        localStorage.setItem(key, enabled ? 'on' : 'off')
      } catch {
        /* Preferences still work for this session. */
      }
    },
  }),
)
export function playRewardChime() {
  if (!usePresentationSettings.getState().soundEnabled || !audio || document.hidden) return
  const start = audio.currentTime
  for (const [index, frequency] of [523.25, 659.25, 783.99].entries()) {
    const oscillator = audio.createOscillator()
    const gain = audio.createGain()
    oscillator.type = 'sine'
    oscillator.frequency.value = frequency
    gain.gain.setValueAtTime(0, start + index * 0.09)
    gain.gain.linearRampToValueAtTime(0.07, start + index * 0.09 + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.001, start + index * 0.09 + 0.45)
    oscillator.connect(gain)
    gain.connect(audio.destination)
    oscillator.start(start + index * 0.09)
    oscillator.stop(start + index * 0.09 + 0.5)
  }
}

// A saved sound preference still needs a browser-approved user gesture after reload.
if (typeof window !== 'undefined') {
  window.addEventListener(
    'pointerdown',
    () => {
      if (!usePresentationSettings.getState().soundEnabled || typeof AudioContext === 'undefined')
        return
      audio ??= new AudioContext()
      void audio.resume().catch(() => {})
    },
    { once: true },
  )
}
