import type { Workout } from '../types/workout';

export type Phase = {
  kind: 'work' | 'rest';
  exerciseIndex: number;
  set: number;
  rep: number;
  repOrdinal: number;
  durationMs: number;
};

export function buildTimeline(workout: Workout): Phase[] {
  const phases: Phase[] = [];
  const totalReps = workout.exercises.reduce((sum, exercise) => sum + exercise.sets * exercise.reps, 0);
  let repOrdinal = 0;
  workout.exercises.forEach((exercise, exerciseIndex) => {
    for (let set = 1; set <= exercise.sets; set++) {
      for (let rep = 1; rep <= exercise.reps; rep++) {
        const position = { exerciseIndex, set, rep, repOrdinal };
        phases.push({ ...position, kind: 'work', durationMs: exercise.repDurationSeconds * 1000 });
        if (repOrdinal < totalReps - 1 && exercise.restBetweenRepsSeconds > 0) {
          phases.push({ ...position, kind: 'rest', durationMs: exercise.restBetweenRepsSeconds * 1000 });
        }
        repOrdinal++;
      }
    }
  });
  return phases;
}

export function workoutDuration(workout: Workout): number {
  return workout.exercises.reduce((sum, exercise, index) => {
    const reps = exercise.sets * exercise.reps;
    const rests = reps - (index === workout.exercises.length - 1 ? 1 : 0);
    return sum + reps * exercise.repDurationSeconds + rests * exercise.restBetweenRepsSeconds;
  }, 0);
}

export function formatTime(seconds: number): string {
  const whole = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(whole / 60).toString().padStart(2, '0')}:${(whole % 60).toString().padStart(2, '0')}`;
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds} sec`;
  const minutes = Math.ceil(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  return `${hours} hr${minutes % 60 ? ` ${minutes % 60} min` : ''}`;
}
