<script setup lang="ts">
import { COMMAND_GLYPHS, COMMAND_LABELS } from '../constants'

defineProps<{
  command: string
  progress: number
}>()
</script>

<template>
  <div class="command-sequence">
    <div
      v-for="(letter, index) in command.split('')"
      :key="`${letter}-${index}`"
      class="command-cell"
      :class="{ done: index < progress, current: index === progress }"
      :title="COMMAND_LABELS[letter]"
    >
      {{ COMMAND_GLYPHS[letter] }}
    </div>
  </div>
</template>
