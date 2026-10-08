import { describe, expect, it } from 'vitest';
import { workout } from '../test/fixtures';
import { buildTimeline, formatDuration, formatTime, workoutDuration } from './workoutTimeline';

describe('workout timeline', () => {
  it('runs every set and exercise in order, with rest between all reps', () => {
    const phases = buildTimeline(workout);
    expect(phases).toHaveLength(9);
    expect(phases.map((phase) => phase.kind)).toEqual(['work', 'rest', 'work', 'rest', 'work', 'rest', 'work', 'rest', 'work']);
    expect(phases[4]).toMatchObject({ exerciseIndex: 0, set: 2, rep: 1, repOrdinal: 2 });
    expect(phases[8]).toMatchObject({ exerciseIndex: 1, set: 1, rep: 1, repOrdinal: 4, durationMs: 20000 });
  });

  it('omits zero-length rests and the final rest', () => {
    const noRest = { ...workout, exercises: workout.exercises.map((exercise) => ({ ...exercise, restBetweenRepsSeconds: 0 })) };
    expect(buildTimeline(noRest)).toHaveLength(5);
    expect(buildTimeline(noRest).every((phase) => phase.kind === 'work')).toBe(true);
    const single = { ...workout, exercises: [{ ...workout.exercises[0], sets: 1, reps: 1 }] };
    expect(buildTimeline(single)).toHaveLength(1);
  });

  it('reports the same duration as the generated timeline', () => {
    expect(workoutDuration(workout)).toBe(80);
    expect(buildTimeline(workout).reduce((sum, phase) => sum + phase.durationMs, 0)).toBe(80000);
  });

  it('formats countdowns and total durations', () => {
    expect(formatTime(9.1)).toBe('00:10');
    expect(formatTime(60)).toBe('01:00');
    expect(formatTime(-2)).toBe('00:00');
    expect(formatDuration(30)).toBe('30 sec');
    expect(formatDuration(80)).toBe('2 min');
    expect(formatDuration(3660)).toBe('1 hr 1 min');
  });
});
