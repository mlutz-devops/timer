import type { Phase } from './workoutTimeline';

export const PREPARATION_DURATION_MS = 3000;

export type TimerState = {
  phaseIndex: number;
  remainingMs: number;
  deadline: number;
  status: 'ready' | 'running' | 'paused' | 'completed';
};

export type TimerAction =
  | { type: 'start'; now: number }
  | { type: 'tick'; now: number }
  | { type: 'toggle'; now: number }
  | { type: 'restart'; now: number }
  | { type: 'navigate'; direction: -1 | 1; now: number };

export function initialTimer(phases: Phase[], now: number): TimerState {
  const duration = phases[0]?.durationMs ?? 0;
  return { phaseIndex: 0, remainingMs: duration, deadline: now + duration, status: phases.length ? 'ready' : 'completed' };
}

// Advance against an absolute deadline, carrying overshoot into following phases.
// This keeps delayed/background ticks from making the workout run slower.
export function advanceClock(state: TimerState, phases: Phase[], now: number): TimerState {
  if (state.status !== 'running') return state;
  let { phaseIndex, deadline } = state;
  while (now >= deadline) {
    if (phaseIndex >= phases.length - 1) {
      return { ...state, phaseIndex, deadline, remainingMs: 0, status: 'completed' };
    }
    phaseIndex++;
    deadline += phases[phaseIndex].durationMs;
  }
  return { ...state, phaseIndex, deadline, remainingMs: deadline - now };
}

export function reduceTimer(state: TimerState, action: TimerAction, phases: Phase[]): TimerState {
  if (action.type === 'restart') return initialTimer(phases, action.now);
  if (action.type === 'start') {
    return state.status === 'ready'
      ? { ...state, phaseIndex: -1, status: 'running', remainingMs: PREPARATION_DURATION_MS, deadline: action.now + PREPARATION_DURATION_MS }
      : state;
  }
  if (state.status === 'ready') return state;
  const current = advanceClock(state, phases, action.now);
  if (action.type === 'tick' || current.status === 'completed') return current;
  if (action.type === 'toggle') {
    return current.status === 'running'
      ? { ...current, status: 'paused' }
      : { ...current, status: 'running', deadline: action.now + current.remainingMs };
  }
  // Rep navigation is unavailable during the initial countdown, even when paused.
  if (current.phaseIndex < 0) return current;
  const phase = phases[current.phaseIndex];
  const targetOrdinal = phase.repOrdinal + (action.direction === -1 && phase.kind === 'rest' ? 0 : action.direction);
  const index = phases.findIndex((item) => item.kind === 'work' && item.repOrdinal === targetOrdinal);
  if (index < 0) return current;
  const duration = phases[index].durationMs;
  return { ...current, phaseIndex: index, remainingMs: duration, deadline: action.now + duration };
}
