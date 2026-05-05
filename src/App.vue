<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import CommandSequence from './components/CommandSequence.vue'
import ResultsPanel from './components/ResultsPanel.vue'
import SettingsPanel from './components/SettingsPanel.vue'
import StratagemSelector from './components/StratagemSelector.vue'
import TrainingQueue from './components/TrainingQueue.vue'
import {
  CATEGORY_DISPLAY_ORDER,
  DEFAULT_AUDIO_SETTINGS,
} from './constants'
import { zh } from './i18n'
import { AudioManager } from './lib/audio'
import { loadPreferences, persistPreferences } from './lib/storage'
import { createTrainingSession, handleSessionInput, type InputResolution } from './lib/training'
import type {
  BindingAction,
  Stratagem,
  TrainingSession,
  UserPreferences,
} from './types'

const text = {
  initialStatus: zh('\\u542f\\u7528\\u6218\\u7565\\u914d\\u5907\\u540e\\uff0c\\u6309 Start \\u5f00\\u59cb\\u8bad\\u7ec3\\u3002'),
  listeningStatus: zh('\\u6b63\\u5728\\u76d1\\u542c'),
  bindSuffix: zh('\\u65b0\\u6309\\u952e\\u3002'),
  bindDone: zh('\\u5df2\\u7ed1\\u5b9a\\u5230'),
  noEnabled: zh('\\u8bf7\\u5148\\u81f3\\u5c11\\u542f\\u7528 1 \\u9879\\u6218\\u7565\\u914d\\u5907\\u3002'),
  trainingStart: zh('\\u8bad\\u7ec3\\u5f00\\u59cb\\uff0c\\u6309\\u987a\\u5e8f\\u8f93\\u5165\\u5f53\\u524d\\u6218\\u7565\\u914d\\u5907\\u6307\\u4ee4\\u3002'),
  inputWrong: zh('\\u8f93\\u5165\\u9519\\u8bef\\uff0c\\u5f53\\u524d\\u6218\\u7565\\u914d\\u5907\\u5df2\\u91cd\\u7f6e\\u3002'),
  entryDone: zh('\\u5f53\\u524d\\u6218\\u7565\\u914d\\u5907\\u5b8c\\u6210\\uff0c\\u7ee7\\u7eed\\u4e0b\\u4e00\\u9879\\u3002'),
  sessionDone: zh('\\u8bad\\u7ec3\\u5b8c\\u6210\\uff0c\\u672c\\u5c40 KPS '),
  loadFailed: zh('\\u6218\\u7565\\u914d\\u5907\\u6570\\u636e\\u52a0\\u8f7d\\u5931\\u8d25\\uff1a'),
  terminalStatus: zh('\\u7ec8\\u7aef\\u72b6\\u6001'),
  waiting: zh('\\u7b49\\u5f85\\u5f00\\u59cb'),
  enabledCount: zh('\\u5df2\\u542f\\u7528'),
  itemUnit: zh('\\u9879'),
  categoryCount: zh('\\u5206\\u7c7b'),
  groupUnit: zh('\\u7ec4'),
  loading: zh('\\u6b63\\u5728\\u88c5\\u8f7d\\u6218\\u7565\\u914d\\u5907\\u6570\\u636e\\u2026'),
  startWithKey: zh('\\u6309'),
  startTraining: zh('\\u5f00\\u59cb\\u8bad\\u7ec3'),
  idleHint: zh('\\u8bad\\u7ec3\\u65f6\\u652f\\u6301\\u65b9\\u5411\\u952e\\uff0c\\u4ee5\\u53ca\\u4f60\\u81ea\\u5b9a\\u4e49\\u7684 WASD \\u98ce\\u683c\\u952e\\u4f4d\\u3002'),
}

const stratagems = ref<Stratagem[]>([])
const loading = ref(true)
const loadingError = ref('')
const statusMessage = ref(text.initialStatus)
const listeningAction = ref<BindingAction | null>(null)
const session = shallowRef<TrainingSession | null>(null)
const preferences = ref<UserPreferences>(loadPreferences())
const audioManager = new AudioManager(preferences.value.audioSettings ?? DEFAULT_AUDIO_SETTINGS)

const categoryOrder = computed(() => {
  const categories = [...new Set(stratagems.value.map((item) => item.categoryZh))]
  const ordered = CATEGORY_DISPLAY_ORDER.filter((category) => categories.includes(category))
  const remainder = categories.filter((category) => !CATEGORY_DISPLAY_ORDER.includes(category as never))
  return [...ordered, ...remainder]
})

const stratagemById = computed(() =>
  Object.fromEntries(stratagems.value.map((item) => [item.id, item])),
)

const stratagemsByCategory = computed(() =>
  categoryOrder.value.reduce<Record<string, Stratagem[]>>((accumulator, category) => {
    accumulator[category] = stratagems.value.filter((item) => item.categoryZh === category)
    return accumulator
  }, {}),
)

const enabledIdSet = computed(() => new Set(preferences.value.enabledStratagemIds))
const enabledStratagems = computed(() =>
  stratagems.value.filter((item) => enabledIdSet.value.has(item.id)),
)

const activeEntry = computed(() =>
  session.value ? session.value.queue[session.value.activeIndex] ?? null : null,
)

const resultRows = computed(() =>
  session.value?.results.map((result) => ({
    ...result,
    nameZh: stratagemById.value[result.stratagemId]?.nameZh ?? result.stratagemId,
  })) ?? [],
)

const averageTimes = computed(() =>
  Object.fromEntries(
    Object.entries(preferences.value.history).map(([id, values]) => [
      id,
      values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null,
    ]),
  ) as Record<string, number | null>,
)

watch(
  preferences,
  (nextValue) => {
    persistPreferences(nextValue)
    audioManager.updateSettings(nextValue.audioSettings)
  },
  { deep: true },
)

const toggleStratagem = (id: string) => {
  const nextIds = new Set(preferences.value.enabledStratagemIds)
  if (nextIds.has(id)) {
    nextIds.delete(id)
  } else {
    nextIds.add(id)
  }
  preferences.value = {
    ...preferences.value,
    enabledStratagemIds: [...nextIds],
  }
  audioManager.play('buttonBlank')
}

const toggleCategory = (category: string) => {
  const categoryIds = (stratagemsByCategory.value[category] ?? []).map((item) => item.id)
  const enabledIds = new Set(preferences.value.enabledStratagemIds)
  const hasDisabled = categoryIds.some((id) => !enabledIds.has(id))

  categoryIds.forEach((id) => {
    if (hasDisabled) {
      enabledIds.add(id)
    } else {
      enabledIds.delete(id)
    }
  })

  preferences.value = {
    ...preferences.value,
    enabledStratagemIds: [...enabledIds],
  }
  audioManager.play('buttonBlank')
}

const beginRebind = (action: BindingAction) => {
  listeningAction.value = action
  statusMessage.value = `${text.listeningStatus} ${action} ${text.bindSuffix}`
  audioManager.play('buttonBlank')
}

const toggleMuteAll = () => {
  preferences.value = {
    ...preferences.value,
    audioSettings: {
      ...preferences.value.audioSettings,
      muteAll: !preferences.value.audioSettings.muteAll,
    },
  }
}

const toggleMuteMusic = () => {
  preferences.value = {
    ...preferences.value,
    audioSettings: {
      ...preferences.value.audioSettings,
      muteMusic: !preferences.value.audioSettings.muteMusic,
    },
  }
  audioManager.play('buttonBlank')
}

const updateBinding = (action: BindingAction, code: string) => {
  preferences.value = {
    ...preferences.value,
    inputBindings: {
      ...preferences.value.inputBindings,
      [action]: code,
    },
  }
  listeningAction.value = null
  statusMessage.value = `${action} ${text.bindDone} ${code}。`
  audioManager.play('buttonBlank')
}

const startSession = () => {
  const nextSession = createTrainingSession(enabledStratagems.value)
  if (!nextSession) {
    statusMessage.value = text.noEnabled
    audioManager.play('buttonBlank')
    return
  }

  session.value = nextSession
  statusMessage.value = text.trainingStart
  audioManager.play('start')
}

const resolveInput = (code: string): InputResolution => {
  const bindings = preferences.value.inputBindings
  if (code === bindings.Start) {
    return { type: 'start' }
  }
  if (code === bindings.Up || code === 'ArrowUp') {
    return { type: 'command', command: 'u' }
  }
  if (code === bindings.Right || code === 'ArrowRight') {
    return { type: 'command', command: 'r' }
  }
  if (code === bindings.Down || code === 'ArrowDown') {
    return { type: 'command', command: 'd' }
  }
  if (code === bindings.Left || code === 'ArrowLeft') {
    return { type: 'command', command: 'l' }
  }
  return { type: 'none' }
}

const appendHistory = (id: string, duration: number) => {
  const current = preferences.value.history[id] ?? []
  preferences.value = {
    ...preferences.value,
    history: {
      ...preferences.value.history,
      [id]: [...current, duration].slice(-20),
    },
  }
}

const handleCommandInput = (code: string) => {
  if (!session.value) {
    return
  }

  const resolved = resolveInput(code)
  if (resolved.type === 'start') {
    return
  }

  const nextState = handleSessionInput(session.value, resolved)
  session.value = nextState.session

  switch (nextState.event) {
    case 'wrong':
      statusMessage.value = text.inputWrong
      audioManager.play('wrong')
      break
    case 'step-complete':
      audioManager.play('button')
      break
    case 'entry-complete': {
      const completed = session.value.results.at(-1)
      if (completed) {
        appendHistory(completed.stratagemId, completed.durationSeconds)
      }
      statusMessage.value = text.entryDone
      audioManager.play('ballCompleted')
      break
    }
    case 'session-complete': {
      const completed = session.value.results.at(-1)
      if (completed) {
        appendHistory(completed.stratagemId, completed.durationSeconds)
      }
      statusMessage.value = `${text.sessionDone}${session.value.kps?.toFixed(2) ?? '--'}。`
      audioManager.play('sessionCompleted')
      break
    }
    case 'ignored':
      audioManager.play('buttonBlank')
      break
  }
}

const onKeydown = (event: KeyboardEvent) => {
  const target = event.target as HTMLElement | null
  if (target && ['INPUT', 'TEXTAREA'].includes(target.tagName)) {
    return
  }

  if (listeningAction.value) {
    event.preventDefault()
    updateBinding(listeningAction.value, event.code)
    return
  }

  const resolved = resolveInput(event.code)
  if (resolved.type === 'none') {
    return
  }

  event.preventDefault()

  if (resolved.type === 'start') {
    startSession()
    return
  }

  handleCommandInput(event.code)
}

const loadStratagems = async () => {
  try {
    const response = await fetch('/data/stratagems.json')
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    const payload = (await response.json()) as Stratagem[]
    stratagems.value = payload

    const existingIds = new Set(payload.map((item) => item.id))
    const filteredEnabled = preferences.value.enabledStratagemIds.filter((id) => existingIds.has(id))
    preferences.value = {
      ...preferences.value,
      enabledStratagemIds:
        filteredEnabled.length > 0
          ? filteredEnabled
          : payload.slice(0, 8).map((item) => item.id),
    }
  } catch (error) {
    loadingError.value = `${text.loadFailed}${String(error)}`
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  void loadStratagems()
  window.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <div class="app-shell">
    <div class="ambient-grid" />

    <StratagemSelector
      :categories="categoryOrder"
      :stratagems-by-category="stratagemsByCategory"
      :enabled-ids="enabledIdSet"
      :average-times="averageTimes"
      @toggle-category="toggleCategory"
      @toggle-stratagem="toggleStratagem"
    />

    <main class="main-column">
      <header class="hero-panel compact-hero">
        <div class="hero-copy">
          <p class="eyebrow">{{ text.terminalStatus }}</p>
          <h2>{{ activeEntry?.nameZh ?? text.waiting }}</h2>
          <p>{{ statusMessage }}</p>
        </div>
        <div class="hero-meta">
          <span class="meta-chip">{{ text.enabledCount }} {{ enabledStratagems.length }} {{ text.itemUnit }}</span>
          <span class="meta-chip">{{ text.categoryCount }} {{ categoryOrder.length }} {{ text.groupUnit }}</span>
        </div>
      </header>

      <section
        v-if="loading"
        class="state-card"
      >
        {{ text.loading }}
      </section>

      <section
        v-else-if="loadingError"
        class="state-card error"
      >
        {{ loadingError }}
      </section>

      <template v-else>
        <section class="playground-panel compact-playground">
          <TrainingQueue :session="session" />

          <div
            v-if="activeEntry"
            class="active-card compact-active-card"
          >
            <div class="active-details">
              <h3>{{ activeEntry.nameZh }}</h3>
              <p>{{ activeEntry.categoryZh }}</p>
            </div>
          </div>

          <CommandSequence
            v-if="activeEntry"
            :command="activeEntry.command"
            :progress="activeEntry.progress"
          />

          <div
            v-else
            class="idle-card"
          >
            <strong>{{ text.startWithKey }} {{ preferences.inputBindings.Start }} {{ text.startTraining }}</strong>
            <span>{{ text.idleHint }}</span>
          </div>
        </section>

        <div class="support-grid compact-support-grid">
          <SettingsPanel
            :bindings="preferences.inputBindings"
            :audio-settings="preferences.audioSettings"
            :listening-action="listeningAction"
            @begin-rebind="beginRebind"
            @toggle-mute-all="toggleMuteAll"
            @toggle-mute-music="toggleMuteMusic"
          />

          <ResultsPanel
            :session="session"
            :results="resultRows"
          />
        </div>
      </template>
    </main>
  </div>
</template>
