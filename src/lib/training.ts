import type {
  CommandKey,
  Stratagem,
  TrainingEntryResult,
  TrainingQueueEntry,
  TrainingSession,
} from '../types'

const nowSeconds = () => Date.now() / 1000

const duplicateCountForLength = (commandLength: number) => {
  if (commandLength >= 7) return 2
  if (commandLength >= 5) return 1
  return 0
}

const shuffle = <T>(items: T[]) => {
  const next = [...items]
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[next[index], next[swapIndex]] = [next[swapIndex], next[index]]
  }
  return next
}

export const createTrainingSession = (availableStratagems: Stratagem[]): TrainingSession | null => {
  if (availableStratagems.length === 0) {
    return null
  }

  const expanded: Stratagem[] = []
  availableStratagems.forEach((stratagem) => {
    expanded.push(stratagem)
    const duplicates = duplicateCountForLength(stratagem.command.length)
    for (let index = 0; index < duplicates; index += 1) {
      if (Math.random() > 0.5) {
        expanded.push(stratagem)
      }
    }
  })

  const shuffled = shuffle(expanded)
  const queueSize = Math.max(
    1,
    Math.min(shuffled.length, Math.floor(Math.random() * 5) + 4),
  )
  const queue = shuffled.slice(0, queueSize).map<TrainingQueueEntry>((stratagem, index) => ({
    ...stratagem,
    queueId: `${stratagem.id}-${index}-${Math.random().toString(36).slice(2, 8)}`,
    startedAt: index === 0 ? nowSeconds() : null,
    endedAt: null,
    durationSeconds: null,
    progress: 0,
    completed: false,
  }))

  return {
    queue,
    activeIndex: 0,
    startedAt: nowSeconds(),
    completedAt: null,
    results: [],
    kps: null,
  }
}

export interface InputResolution {
  type: 'start' | 'command' | 'none'
  command?: CommandKey
}

export const handleSessionInput = (
  session: TrainingSession,
  resolution: InputResolution,
): {
  session: TrainingSession
  event:
    | 'ignored'
    | 'wrong'
    | 'step-complete'
    | 'entry-complete'
    | 'session-complete'
} => {
  if (resolution.type === 'none') {
    return { session, event: 'ignored' }
  }

  const queue = session.queue.map((entry) => ({ ...entry }))
  const activeEntry = queue[session.activeIndex]
  if (!activeEntry) {
    return { session, event: 'ignored' }
  }

  if (resolution.type === 'start') {
    return { session, event: 'ignored' }
  }

  const command = activeEntry.command[activeEntry.progress]
  if (resolution.command !== command) {
    activeEntry.progress = 0
    return {
      session: { ...session, queue },
      event: 'wrong',
    }
  }

  if (activeEntry.startedAt == null) {
    activeEntry.startedAt = nowSeconds()
  }

  activeEntry.progress += 1
  if (activeEntry.progress < activeEntry.command.length) {
    return {
      session: { ...session, queue },
      event: 'step-complete',
    }
  }

  activeEntry.completed = true
  activeEntry.endedAt = nowSeconds()
  activeEntry.durationSeconds = Number((activeEntry.endedAt - activeEntry.startedAt).toFixed(2))

  const result: TrainingEntryResult = {
    stratagemId: activeEntry.id,
    durationSeconds: activeEntry.durationSeconds,
    commandCount: activeEntry.command.length,
    completedAt: new Date().toISOString(),
  }

  const results = [...session.results, result]
  const nextIndex = session.activeIndex + 1

  if (nextIndex >= queue.length) {
    const totalTime = results.reduce((sum, item) => sum + item.durationSeconds, 0)
    const totalCommands = results.reduce((sum, item) => sum + item.commandCount, 0)
    return {
      session: {
        ...session,
        queue,
        results,
        completedAt: nowSeconds(),
        kps: totalTime > 0 ? Number((totalCommands / totalTime).toFixed(2)) : null,
      },
      event: 'session-complete',
    }
  }

  queue[nextIndex] = {
    ...queue[nextIndex],
    startedAt: nowSeconds(),
  }

  return {
    session: {
      ...session,
      queue,
      activeIndex: nextIndex,
      results,
    },
    event: 'entry-complete',
  }
}
