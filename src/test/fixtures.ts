import type { Workout } from '../types/workout';

export const workout: Workout = {
  id: 'test-workout', name: 'Test workout',
  exercises: [
    { id: 'squats', name: 'Squats', sets: 2, reps: 2, repDurationSeconds: 10, restBetweenRepsSeconds: 5 },
    { id: 'plank', name: 'Plank', sets: 1, reps: 1, repDurationSeconds: 20, restBetweenRepsSeconds: 5 },
  ],
};
