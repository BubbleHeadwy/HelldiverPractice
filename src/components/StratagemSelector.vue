<script setup lang="ts">
import type { Stratagem } from '../types'
import { zh } from '../i18n'

defineProps<{
  categories: string[]
  stratagemsByCategory: Record<string, Stratagem[]>
  enabledIds: Set<string>
  averageTimes: Record<string, number | null>
}>()

const emit = defineEmits<{
  toggleCategory: [category: string]
  toggleStratagem: [id: string]
}>()

const allEnabled = (items: Stratagem[], enabledIds: Set<string>) =>
  items.length > 0 && items.every((item) => enabledIds.has(item.id))

const heading = zh('\\u6218\\u7565\\u7ec8\\u7aef')
const description = zh('\\u52fe\\u9009\\u6761\\u76ee\\u540e\\u6309\\u5f00\\u59cb\\u952e\\u5373\\u53ef\\u8fdb\\u5165\\u8bad\\u7ec3\\u3002')
const toggleAll = zh('\\u5168\\u9009')
const toggleNone = zh('\\u5168\\u4e0d\\u9009')
const averagePrefix = zh('\\u00b7 \\u5e73\\u5747')
</script>

<template>
  <aside class="selector-panel">
    <div class="panel-heading">
      <p class="eyebrow">{{ heading }}</p>
      <h1>HELLDIVER PRACTICE</h1>
      <p class="panel-copy">{{ description }}</p>
    </div>

    <section
      v-for="category in categories"
      :key="category"
      class="category-block"
    >
      <button
        class="category-toggle"
        type="button"
        @click="emit('toggleCategory', category)"
      >
        <span># {{ category }}</span>
        <span class="category-hint">
          {{ allEnabled(stratagemsByCategory[category], enabledIds) ? toggleNone : toggleAll }}
        </span>
      </button>

      <div class="stratagem-grid">
        <button
          v-for="stratagem in stratagemsByCategory[category]"
          :key="stratagem.id"
          type="button"
          class="stratagem-chip"
          :class="{ active: enabledIds.has(stratagem.id) }"
          :title="`${stratagem.nameZh}${averageTimes[stratagem.id] ? ` ${averagePrefix} ${averageTimes[stratagem.id]?.toFixed(2)}s` : ''}`"
          @click="emit('toggleStratagem', stratagem.id)"
        >
          <img
            class="stratagem-icon"
            :src="stratagem.iconPath"
            :alt="stratagem.nameZh"
          >
          <span class="sr-only">{{ stratagem.nameZh }}</span>
          <span
            v-if="averageTimes[stratagem.id]"
            class="avg-badge"
          >
            {{ averageTimes[stratagem.id]?.toFixed(2) }}s
          </span>
        </button>
      </div>
    </section>
  </aside>
</template>
