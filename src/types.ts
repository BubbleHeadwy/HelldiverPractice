export type CommandKey = 'u' | 'r' | 'd' | 'l'

export type BindingAction = 'Start' | 'Up' | 'Left' | 'Down' | 'Right'

export interface Stratagem {
  id: string
  nameZh: string
  categoryZh: string
  command: string
  iconPath: string
}

export interface TrainingEntryResult {
  stratagemId: string
  durationSeconds: number
  commandCount: number
  completedAt: string
}

export interface TrainingQueueEntry extends Stratagem {
  queueId: string
  startedAt: number | null
  endedAt: number | null
  durationSeconds: number | null
  progress: number
  completed: boolean
}

export interface TrainingSession {
  queue: TrainingQueueEntry[]
  activeIndex: number
  startedAt: number | null
  completedAt: number | null
  results: TrainingEntryResult[]
  kps: number | null
}

export interface InputBindings {
  Start: string
  Up: string
  Left: string
  Down: string
  Right: string
}

export interface AudioSettings {
  muteAll: boolean
  muteMusic: boolean
}

export interface UserPreferences {
  enabledStratagemIds: string[]
  inputBindings: InputBindings
  audioSettings: AudioSettings
  history: Record<string, number[]>
}
