import { useEffect, useMemo, useReducer } from 'react';
import type { Workout } from '../types/workout';
import { buildTimeline } from '../utils/workoutTimeline';
import { initialTimer, reduceTimer, type TimerAction, type TimerState } from '../utils/timer';

export function useWorkoutTimer(workout: Workout) {
  const phases = useMemo(() => buildTimeline(workout), [workout]);
  const [state, dispatch] = useReducer(
    (current: TimerState, action: TimerAction) => reduceTimer(current, action, phases),
    phases,
    (timeline) => initialTimer(timeline, Date.now()),
  );

  useEffect(() => {
    if (state.status !== 'running') return;
    const tick = () => dispatch({ type: 'tick', now: Date.now() });
    const interval = window.setInterval(tick, 100);
    document.addEventListener('visibilitychange', tick);
    window.addEventListener('focus', tick);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', tick);
      window.removeEventListener('focus', tick);
    };
  }, [state.status]);

  const phase = phases[state.phaseIndex];
  const totalReps = workout.exercises.reduce((sum, exercise) => sum + exercise.sets * exercise.reps, 0);
  return {
    ...state, phases, phase, totalReps,
    canPrevious: Boolean(state.status !== 'ready' && phase && (phase.repOrdinal > 0 || phase.kind === 'rest')),
    canNext: Boolean(state.status !== 'ready' && phase && phase.repOrdinal < totalReps - 1),
    start: () => dispatch({ type: 'start', now: Date.now() }),
    toggle: () => dispatch({ type: 'toggle', now: Date.now() }),
    next: () => dispatch({ type: 'navigate', direction: 1, now: Date.now() }),
    previous: () => dispatch({ type: 'navigate', direction: -1, now: Date.now() }),
    restart: () => dispatch({ type: 'restart', now: Date.now() }),
  };
}
