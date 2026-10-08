import { describe, expect, it, vi } from 'vitest';
import { workout } from '../test/fixtures';
import { isWorkout } from '../types/workout';
import { loadWorkouts, saveWorkouts, STORAGE_KEY } from './storage';

describe('browser persistence', () => {
  it('offers two editable sample workouts on a first visit', () => {
    expect(loadWorkouts().workouts).toHaveLength(2);
    expect(loadWorkouts().workouts.every(isWorkout)).toBe(true);
  });

  it('round-trips workouts and retains an intentionally empty library', () => {
    expect(saveWorkouts([workout])).toBeNull();
    expect(loadWorkouts()).toEqual({ workouts: [workout], error: null });
    saveWorkouts([]);
    expect(loadWorkouts().workouts).toEqual([]);
  });

  it.each(['not-json', '{"version":2,"workouts":[]}', '{"version":1,"workouts":[{}]}', 'null'])(
    'recovers from invalid data without silently replacing it: %s', (invalid) => {
      localStorage.setItem(STORAGE_KEY, invalid);
      expect(loadWorkouts().error).not.toBeNull();
      expect(loadWorkouts().workouts).toEqual([]);
      expect(localStorage.getItem(STORAGE_KEY)).toBe(invalid);
    },
  );

  it('rejects duplicate workout identifiers', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, workouts: [workout, workout] }));
    expect(loadWorkouts().error).not.toBeNull();
  });

  it('reports storage failures without throwing', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Storage full'); });
    expect(saveWorkouts([workout])).toMatch(/will not survive a refresh/);
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('Storage blocked'); });
    expect(loadWorkouts().error).not.toBeNull();
  });

  it('rejects zero reps, fractional sets, missing names and negative rest', () => {
    for (const patch of [{ reps: 0 }, { sets: 1.5 }, { name: ' ' }, { restBetweenRepsSeconds: -1 }, { repDurationSeconds: 0 }]) {
      expect(isWorkout({ ...workout, exercises: [{ ...workout.exercises[0], ...patch }] })).toBe(false);
    }
  });
});
