import type { PomodoroConfig, PomodoroPhase, PomodoroState } from '@/lib/companion/types'
import { DEFAULT_POMODORO_CONFIG } from '@/lib/companion/types'

export function createInitialPomodoroState(config: PomodoroConfig = DEFAULT_POMODORO_CONFIG): PomodoroState {
  return {
    phase: 'idle',
    remainingSeconds: config.focusMinutes * 60,
    completedFocusCycles: 0,
    isRunning: false,
  }
}

function phaseDurationSeconds(phase: PomodoroPhase, config: PomodoroConfig): number {
  switch (phase) {
    case 'focus':
      return config.focusMinutes * 60
    case 'short_break':
      return config.shortBreakMinutes * 60
    case 'long_break':
      return config.longBreakMinutes * 60
    default:
      return config.focusMinutes * 60
  }
}

export function startPomodoro(state: PomodoroState, config: PomodoroConfig): PomodoroState {
  const phase: PomodoroPhase = state.phase === 'idle' ? 'focus' : state.phase
  return {
    ...state,
    phase,
    isRunning: true,
    remainingSeconds:
      state.phase === 'idle' ? phaseDurationSeconds('focus', config) : state.remainingSeconds,
  }
}

export function pausePomodoro(state: PomodoroState): PomodoroState {
  return { ...state, isRunning: false }
}

export function resetPomodoro(config: PomodoroConfig): PomodoroState {
  return createInitialPomodoroState(config)
}

export function skipPomodoroPhase(state: PomodoroState, config: PomodoroConfig): PomodoroState {
  return advancePhase(state, config)
}

function advancePhase(state: PomodoroState, config: PomodoroConfig): PomodoroState {
  if (state.phase === 'focus') {
    const nextCycles = state.completedFocusCycles + 1
    const useLong =
      nextCycles > 0 && nextCycles % config.cyclesBeforeLongBreak === 0
    const nextPhase: PomodoroPhase = useLong ? 'long_break' : 'short_break'
    return {
      phase: nextPhase,
      remainingSeconds: phaseDurationSeconds(nextPhase, config),
      completedFocusCycles: nextCycles,
      isRunning: state.isRunning,
    }
  }

  return {
    phase: 'focus',
    remainingSeconds: phaseDurationSeconds('focus', config),
    completedFocusCycles: state.completedFocusCycles,
    isRunning: state.isRunning,
  }
}

export function tickPomodoro(
  state: PomodoroState,
  config: PomodoroConfig,
  deltaSeconds = 1,
): { state: PomodoroState; phaseChanged: boolean; previousPhase: PomodoroPhase } {
  if (!state.isRunning || state.phase === 'idle') {
    return { state, phaseChanged: false, previousPhase: state.phase }
  }

  if (state.remainingSeconds > deltaSeconds) {
    return {
      state: { ...state, remainingSeconds: state.remainingSeconds - deltaSeconds },
      phaseChanged: false,
      previousPhase: state.phase,
    }
  }

  const previousPhase = state.phase
  const next = advancePhase({ ...state, remainingSeconds: 0 }, config)
  return { state: next, phaseChanged: true, previousPhase }
}
