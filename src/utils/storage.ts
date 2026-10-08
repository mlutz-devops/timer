import { isWorkout, type Workout } from '../types/workout';

export const STORAGE_KEY = 'tempo.workouts.v1';

const starterWorkouts: Workout[] = [
  {
    id: 'starter-full-body', name: 'Full body workout',
    exercises: [
      { id: 'starter-squats', name: 'Squats', sets: 3, reps: 6, repDurationSeconds: 20, restBetweenRepsSeconds: 10 },
      { id: 'starter-pushups', name: 'Push-ups', sets: 3, reps: 5, repDurationSeconds: 20, restBetweenRepsSeconds: 10 },
      { id: 'starter-plank', name: 'Plank', sets: 2, reps: 2, repDurationSeconds: 30, restBetweenRepsSeconds: 15 },
    ],
  },
  {
    id: 'starter-reset', name: 'Stretching and breathing',
    exercises: [
      { id: 'starter-stretch', name: 'Standing stretch', sets: 1, reps: 3, repDurationSeconds: 30, restBetweenRepsSeconds: 5 },
      { id: 'starter-lunge', name: 'Low lunge', sets: 2, reps: 2, repDurationSeconds: 30, restBetweenRepsSeconds: 10 },
      { id: 'starter-breathe', name: 'Deep breathing', sets: 1, reps: 3, repDurationSeconds: 20, restBetweenRepsSeconds: 5 },
    ],
  },
];

export function loadWorkouts(): { workouts: Workout[]; error: string | null } {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === null) return { workouts: structuredClone(starterWorkouts), error: null };
    const data: unknown = JSON.parse(saved);
    if (!data || typeof data !== 'object' || !('version' in data) || data.version !== 1 ||
        !('workouts' in data) || !Array.isArray(data.workouts) || !data.workouts.every(isWorkout) ||
        new Set(data.workouts.map((workout: Workout) => workout.id)).size !== data.workouts.length) {
      throw new Error('Invalid saved workouts');
    }
    return { workouts: data.workouts, error: null };
  } catch {
    return { workouts: [], error: 'Your saved workouts could not be loaded. You can still create workouts; saving will replace the unreadable data.' };
  }
}

export function saveWorkouts(workouts: Workout[]): string | null {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, workouts }));
    return null;
  } catch {
    return 'Browser storage is unavailable or full. Your changes are available for this session, but will not survive a refresh.';
  }
}
