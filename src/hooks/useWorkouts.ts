import { useState } from 'react';
import type { Workout } from '../types/workout';
import { loadWorkouts, saveWorkouts } from '../utils/storage';

export function useWorkouts() {
  const [initial] = useState(loadWorkouts);
  const [workouts, setWorkouts] = useState(initial.workouts);
  const [error, setError] = useState(initial.error);

  function commit(next: Workout[]) {
    setWorkouts(next);
    setError(saveWorkouts(next));
  }

  function save(workout: Workout) {
    const exists = workouts.some((item) => item.id === workout.id);
    commit(exists ? workouts.map((item) => item.id === workout.id ? workout : item) : [...workouts, workout]);
  }

  return { workouts, error, save, remove: (id: string) => commit(workouts.filter((item) => item.id !== id)) };
}
