export type Exercise = {
  id: string;
  name: string;
  sets: number;
  reps: number;
  repDurationSeconds: number;
  restBetweenRepsSeconds: number;
};

export type Workout = {
  id: string;
  name: string;
  exercises: Exercise[];
};

export const limits = { sets: 20, reps: 100, seconds: 3600, exercises: 30 };

export function newExercise(): Exercise {
  return {
    id: crypto.randomUUID(), name: '', sets: 3, reps: 8,
    repDurationSeconds: 30, restBetweenRepsSeconds: 15,
  };
}

export function newWorkout(): Workout {
  return { id: crypto.randomUUID(), name: '', exercises: [newExercise()] };
}

function integer(value: unknown, minimum: number, maximum: number): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= minimum && value <= maximum;
}

export function isWorkout(value: unknown): value is Workout {
  if (!value || typeof value !== 'object') return false;
  const workout = value as Partial<Workout>;
  return typeof workout.id === 'string' && workout.id.length > 0 &&
    typeof workout.name === 'string' && workout.name.trim().length > 0 &&
    Array.isArray(workout.exercises) && workout.exercises.length > 0 &&
    workout.exercises.length <= limits.exercises &&
    workout.exercises.every((exercise) =>
      exercise && typeof exercise.id === 'string' && exercise.id.length > 0 &&
      typeof exercise.name === 'string' && exercise.name.trim().length > 0 &&
      integer(exercise.sets, 1, limits.sets) && integer(exercise.reps, 1, limits.reps) &&
      integer(exercise.repDurationSeconds, 1, limits.seconds) &&
      integer(exercise.restBetweenRepsSeconds, 0, limits.seconds),
    ) && new Set(workout.exercises.map((exercise) => exercise.id)).size === workout.exercises.length;
}
