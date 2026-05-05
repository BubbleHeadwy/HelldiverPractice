import { DEFAULT_AUDIO_SETTINGS, DEFAULT_BINDINGS, STORAGE_KEY } from '../constants'
import type { UserPreferences } from '../types'

const createDefaultPreferences = (): UserPreferences => ({
  enabledStratagemIds: [],
  inputBindings: { ...DEFAULT_BINDINGS },
  audioSettings: { ...DEFAULT_AUDIO_SETTINGS },
  history: {},
})

export const loadPreferences = (): UserPreferences => {
  if (typeof window === 'undefined') {
    return createDefaultPreferences()
  }

  const saved = window.localStorage.getItem(STORAGE_KEY)
  if (!saved) {
    return createDefaultPreferences()
  }

  try {
    const parsed = JSON.parse(saved) as Partial<UserPreferences>
    return {
      enabledStratagemIds: Array.isArray(parsed.enabledStratagemIds)
        ? parsed.enabledStratagemIds.filter((value): value is string => typeof value === 'string')
        : [],
      inputBindings: {
        ...DEFAULT_BINDINGS,
        ...(parsed.inputBindings ?? {}),
      },
      audioSettings: {
        ...DEFAULT_AUDIO_SETTINGS,
        ...(parsed.audioSettings ?? {}),
      },
      history: parsed.history ?? {},
    }
  } catch {
    return createDefaultPreferences()
  }
}

export const persistPreferences = (preferences: UserPreferences): void => {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences))
}
