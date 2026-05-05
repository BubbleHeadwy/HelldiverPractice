import type { AudioSettings, InputBindings } from './types'
import { zh } from './i18n'

export const STORAGE_KEY = 'helldiver-practice.preferences.v1'

export const DEFAULT_BINDINGS: InputBindings = {
  Start: 'Enter',
  Up: 'KeyW',
  Left: 'KeyA',
  Down: 'KeyS',
  Right: 'KeyD',
}

export const DEFAULT_AUDIO_SETTINGS: AudioSettings = {
  muteAll: false,
  muteMusic: false,
}

export const COMMAND_LABELS: Record<string, string> = {
  u: zh('\\u4e0a'),
  r: zh('\\u53f3'),
  d: zh('\\u4e0b'),
  l: zh('\\u5de6'),
}

export const COMMAND_GLYPHS: Record<string, string> = {
  u: '\u2191',
  r: '\u2192',
  d: '\u2193',
  l: '\u2190',
}

export const CATEGORY_DISPLAY_ORDER = [
  zh('\\u8f68\\u9053\\u653b\\u51fb'),
  zh('\\u98de\\u9e70\\u653b\\u51fb'),
  zh('\\u652f\\u63f4\\u6b66\\u5668'),
  zh('\\u80cc\\u5305'),
  zh('\\u90e8\\u7f72\\u88c5\\u7f6e'),
  zh('\\u54e8\\u6212\\u70ae'),
  zh('\\u8f7d\\u5177'),
  zh('\\u8230\\u8239\\u652f\\u63f4'),
  zh('\\u4efb\\u52a1\\u76ee\\u6807'),
  zh('\\u5176\\u4ed6'),
] as const
