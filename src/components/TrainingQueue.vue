<script setup lang="ts">
import type { TrainingSession } from '../types'
import { zh } from '../i18n'

defineProps<{
  session: TrainingSession | null
}>()

const emptyText = zh('\\u5148\\u5728\\u5de6\\u4fa7\\u542f\\u7528\\u6218\\u7565\\u914d\\u5907\\uff0c\\u518d\\u6309\\u5f00\\u59cb\\u952e\\u751f\\u6210\\u8bad\\u7ec3\\u961f\\u5217\\u3002')
</script>

<template>
  <div class="queue-strip">
    <template v-if="session?.queue.length">
      <article
        v-for="(entry, index) in session.queue"
        :key="entry.queueId"
        class="queue-card"
        :class="{
          active: session.activeIndex === index && !entry.completed,
          complete: entry.completed,
        }"
      >
        <span
          v-if="entry.durationSeconds !== null"
          class="queue-time"
        >
          {{ entry.durationSeconds.toFixed(2) }}s
        </span>
        <img
          class="queue-icon"
          :src="entry.iconPath"
          :alt="entry.nameZh"
        >
      </article>
    </template>
    <div
      v-else
      class="queue-empty"
    >
      {{ emptyText }}
    </div>
  </div>
</template>
