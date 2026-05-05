import type { AudioSettings } from '../types'

type SoundName =
  | 'button'
  | 'buttonBlank'
  | 'wrong'
  | 'start'
  | 'ballCompleted'
  | 'sessionCompleted'

interface AudioRegistryEntry {
  filePath: string
  volume: number
  allowMusicMute?: boolean
}

const SOUND_LIBRARY: Record<SoundName, AudioRegistryEntry | AudioRegistryEntry[]> = {
  button: { filePath: '/assets/audio/button.mp3', volume: 0.5 },
  buttonBlank: { filePath: '/assets/audio/button_blank.mp3', volume: 0.4 },
  wrong: { filePath: '/assets/audio/wrong.mp3', volume: 0.4 },
  start: { filePath: '/assets/audio/start.mp3', volume: 0.8 },
  ballCompleted: { filePath: '/assets/audio/ball_completed.mp3', volume: 0.85 },
  sessionCompleted: [
    { filePath: '/assets/audio/balls_completed_type1.mp3', volume: 0.9, allowMusicMute: true },
    { filePath: '/assets/audio/balls_completed_type2.mp3', volume: 0.9, allowMusicMute: true },
    { filePath: '/assets/audio/balls_completed_type3.mp3', volume: 0.9, allowMusicMute: true },
  ],
}

export class AudioManager {
  private settings: AudioSettings

  private readonly players = new Map<string, HTMLAudioElement>()

  private completionCursor = 0

  constructor(settings: AudioSettings) {
    this.settings = settings
  }

  updateSettings(settings: AudioSettings) {
    this.settings = settings
  }

  play(name: SoundName) {
    if (this.settings.muteAll || typeof Audio === 'undefined') {
      return
    }

    const entry = SOUND_LIBRARY[name]
    const selected = Array.isArray(entry)
      ? entry[this.completionCursor++ % entry.length]
      : entry

    if (selected.allowMusicMute && this.settings.muteMusic) {
      return
    }

    const audio = this.getPlayer(selected.filePath)
    audio.currentTime = 0
    audio.volume = selected.volume
    void audio.play().catch(() => undefined)
  }

  private getPlayer(filePath: string) {
    const existing = this.players.get(filePath)
    if (existing) {
      return existing
    }

    const audio = new Audio(filePath)
    audio.preload = 'auto'
    this.players.set(filePath, audio)
    return audio
  }
}
