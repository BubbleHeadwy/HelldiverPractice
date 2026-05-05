<script setup lang="ts">
import type { AudioSettings, BindingAction, InputBindings } from '../types'
import { zh } from '../i18n'

defineProps<{
  bindings: InputBindings
  audioSettings: AudioSettings
  listeningAction: BindingAction | null
}>()

const emit = defineEmits<{
  beginRebind: [action: BindingAction]
  toggleMuteAll: []
  toggleMuteMusic: []
}>()

const directionFields: BindingAction[] = ['Up', 'Left', 'Down', 'Right']
const eyebrow = zh('\\u63a7\\u5236\\u53f0')
const title = zh('\\u952e\\u4f4d\\u4e0e\\u97f3\\u6548')
const copy = zh('\\u70b9\\u51fb\\u5b57\\u6bb5\\u540e\\u6309\\u4e0b\\u65b0\\u6309\\u952e\\u5373\\u53ef\\u91cd\\u7ed1\\u3002')
const listening = zh('\\u6309\\u952e\\u76d1\\u542c\\u4e2d\\u2026')
const muteAllOn = zh('\\u97f3\\u6548\\uff1a\\u5f00\\u542f')
const muteAllOff = zh('\\u97f3\\u6548\\uff1a\\u5173\\u95ed')
const muteMusicOn = zh('\\u5e86\\u795d\\u97f3\\u9891\\uff1a\\u5f00\\u542f')
const muteMusicOff = zh('\\u5e86\\u795d\\u97f3\\u9891\\uff1a\\u5173\\u95ed')
</script>

<template>
  <section class="settings-panel compact-panel">
    <div class="settings-header">
      <p class="eyebrow">{{ eyebrow }}</p>
      <h2>{{ title }}</h2>
      <p>{{ copy }}</p>
    </div>

    <div class="settings-layout">
      <button
        type="button"
        class="binding-field start-binding"
        :class="{ listening: listeningAction === 'Start' }"
        @click="emit('beginRebind', 'Start')"
      >
        <span class="binding-label">Start</span>
        <span class="binding-value">{{ listeningAction === 'Start' ? listening : bindings.Start }}</span>
      </button>

      <div class="direction-pad">
        <button
          v-for="field in directionFields"
          :key="field"
          type="button"
          class="binding-field"
          :class="[
            `dir-${field.toLowerCase()}`,
            { listening: listeningAction === field },
          ]"
          @click="emit('beginRebind', field)"
        >
          <span class="binding-label">{{ field }}</span>
          <span class="binding-value">{{ listeningAction === field ? listening : bindings[field] }}</span>
        </button>
      </div>
    </div>

    <div class="audio-controls compact-audio">
      <button
        type="button"
        class="switch-button"
        :class="{ active: !audioSettings.muteAll }"
        @click="emit('toggleMuteAll')"
      >
        {{ audioSettings.muteAll ? muteAllOff : muteAllOn }}
      </button>
      <button
        type="button"
        class="switch-button"
        :class="{ active: !audioSettings.muteMusic }"
        @click="emit('toggleMuteMusic')"
      >
        {{ audioSettings.muteMusic ? muteMusicOff : muteMusicOn }}
      </button>
    </div>
  </section>
</template>
