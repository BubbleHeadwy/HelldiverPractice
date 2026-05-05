<script setup lang="ts">
import type { TrainingEntryResult, TrainingSession } from '../types'
import { zh } from '../i18n'

defineProps<{
  session: TrainingSession | null
  results: Array<TrainingEntryResult & { nameZh: string }>
}>()

const eyebrow = zh('\\u6218\\u62a5')
const title = zh('\\u672c\\u5c40\\u7ed3\\u679c')
const rateUnit = zh('\\u6309\\u952e / \\u79d2')
const emptyText = zh('\\u5b8c\\u6210\\u6574\\u5c40\\u8bad\\u7ec3\\u540e\\uff0c\\u8fd9\\u91cc\\u4f1a\\u663e\\u793a KPS \\u548c\\u672c\\u5c40\\u660e\\u7ec6\\u3002')
</script>

<template>
  <section class="results-panel compact-panel">
    <div class="results-header">
      <p class="eyebrow">{{ eyebrow }}</p>
      <h2>{{ title }}</h2>
    </div>

    <div
      v-if="session?.kps != null"
      class="kps-card compact-kps"
    >
      <span class="kps-label">KPS</span>
      <strong>{{ session?.kps?.toFixed(2) }}</strong>
      <span>{{ rateUnit }}</span>
    </div>

    <p
      v-else
      class="result-placeholder"
    >
      {{ emptyText }}
    </p>

    <ul
      v-if="results.length"
      class="result-list compact-results"
    >
      <li
        v-for="result in results"
        :key="`${result.stratagemId}-${result.completedAt}`"
        class="result-row"
      >
        <span>{{ result.nameZh }}</span>
        <span>{{ result.durationSeconds.toFixed(2) }}s</span>
      </li>
    </ul>
  </section>
</template>
