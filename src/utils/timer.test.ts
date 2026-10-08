import { describe, expect, it } from 'vitest';
import { workout } from '../test/fixtures';
import { buildTimeline } from './workoutTimeline';
import { advanceClock, initialTimer, reduceTimer } from './timer';

const phases = buildTimeline(workout);

function runningTimer(now = 0) {
  return reduceTimer(initialTimer(phases, now), { type: 'start', now }, phases);
}

describe('timer engine', () => {
  it('waits for Start and measures the first rep from the moment it is pressed', () => {
    const ready = initialTimer(phases, 1000);
    expect(ready).toMatchObject({ status: 'ready', remainingMs: 10000, phaseIndex: 0 });
    expect(advanceClock(ready, phases, 100000)).toEqual(ready);
    const started = reduceTimer(ready, { type: 'start', now: 100000 }, phases);
    expect(started).toMatchObject({ status: 'running', remainingMs: 10000, deadline: 110000 });
    expect(advanceClock(started, phases, 101000).remainingMs).toBe(9000);
  });

  it('cannot accidentally begin through ticks, pause toggles or rep navigation', () => {
    const ready = initialTimer(phases, 0);
    expect(reduceTimer(ready, { type: 'tick', now: 10000 }, phases)).toEqual(ready);
    expect(reduceTimer(ready, { type: 'toggle', now: 10000 }, phases)).toEqual(ready);
    expect(reduceTimer(ready, { type: 'navigate', direction: 1, now: 10000 }, phases)).toEqual(ready);
    expect(reduceTimer(ready, { type: 'navigate', direction: -1, now: 10000 }, phases)).toEqual(ready);
  });

  it('ignores repeated Start actions after the workout has begun', () => {
    const running = runningTimer();
    expect(reduceTimer(running, { type: 'start', now: 3000 }, phases)).toEqual(running);
    const paused = reduceTimer(running, { type: 'toggle', now: 3000 }, phases);
    expect(reduceTimer(paused, { type: 'start', now: 9000 }, phases)).toEqual(paused);
  });

  it('transitions from a rep into rest after starting', () => {
    const initial = runningTimer(1000);
    expect(initial).toMatchObject({ status: 'running', remainingMs: 10000, phaseIndex: 0 });
    expect(advanceClock(initial, phases, 11000)).toMatchObject({ phaseIndex: 1, remainingMs: 5000 });
    expect(advanceClock(initial, phases, 16000)).toMatchObject({ phaseIndex: 2, remainingMs: 10000 });
  });

  it('carries elapsed time through multiple phases after delayed ticks', () => {
    const state = advanceClock(runningTimer(), phases, 37000);
    expect(state).toMatchObject({ phaseIndex: 4, remainingMs: 3000, deadline: 40000 });
  });

  it('freezes remaining time during pause and continues precisely on resume', () => {
    const paused = reduceTimer(runningTimer(), { type: 'toggle', now: 3200 }, phases);
    expect(paused).toMatchObject({ status: 'paused', remainingMs: 6800 });
    expect(advanceClock(paused, phases, 100000)).toEqual(paused);
    const resumed = reduceTimer(paused, { type: 'toggle', now: 100000 }, phases);
    expect(resumed).toMatchObject({ status: 'running', deadline: 106800 });
    expect(advanceClock(resumed, phases, 106800)).toMatchObject({ phaseIndex: 1, remainingMs: 5000 });
  });

  it('moves to work phases at full duration and preserves paused state', () => {
    const paused = reduceTimer(runningTimer(), { type: 'toggle', now: 2000 }, phases);
    const next = reduceTimer(paused, { type: 'navigate', direction: 1, now: 5000 }, phases);
    expect(next).toMatchObject({ status: 'paused', phaseIndex: 2, remainingMs: 10000 });
    const previous = reduceTimer(next, { type: 'navigate', direction: -1, now: 6000 }, phases);
    expect(previous).toMatchObject({ phaseIndex: 0, remainingMs: 10000, status: 'paused' });
  });

  it('restarts the just-finished rep when moving backward during rest', () => {
    const rest = advanceClock(runningTimer(), phases, 11000);
    const previous = reduceTimer(rest, { type: 'navigate', direction: -1, now: 11000 }, phases);
    expect(previous).toMatchObject({ phaseIndex: 0, remainingMs: 10000 });
    const next = reduceTimer(rest, { type: 'navigate', direction: 1, now: 11000 }, phases);
    expect(next).toMatchObject({ phaseIndex: 2, remainingMs: 10000 });
  });

  it('does not navigate beyond the first or final rep', () => {
    const initial = runningTimer();
    expect(reduceTimer(initial, { type: 'navigate', direction: -1, now: 0 }, phases)).toEqual(initial);
    const final = advanceClock(initial, phases, 61000);
    expect(reduceTimer(final, { type: 'navigate', direction: 1, now: 61000 }, phases)).toEqual(final);
  });

  it('completes after the final rep, with no rest, and resets to ready on restart', () => {
    const completed = advanceClock(runningTimer(), phases, 80000);
    expect(completed).toMatchObject({ phaseIndex: 8, status: 'completed', remainingMs: 0 });
    expect(reduceTimer(completed, { type: 'restart', now: 90000 }, phases)).toMatchObject({ phaseIndex: 0, status: 'ready', remainingMs: 10000 });
  });

  it('handles an empty timeline safely', () => {
    expect(initialTimer([], 0).status).toBe('completed');
  });
});
