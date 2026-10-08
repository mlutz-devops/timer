import { useState, type FormEvent } from 'react';
import { ArrowDown, ArrowLeft, ArrowUp, Check, Clock3, Plus, Trash2 } from 'lucide-react';
import { isWorkout, limits, newExercise, type Exercise, type Workout } from '../types/workout';
import { formatDuration, workoutDuration } from '../utils/workoutTimeline';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Alert, AlertDescription } from './ui/alert';

type Props = { workout: Workout; isNew: boolean; onSave: (workout: Workout) => void; onCancel: () => void };

const numberFields = [
  { key: 'sets', label: 'Sets', min: 1, max: limits.sets },
  { key: 'reps', label: 'Reps per set', min: 1, max: limits.reps },
  { key: 'repDurationSeconds', label: 'Rep time', min: 1, max: limits.seconds },
  { key: 'restBetweenRepsSeconds', label: 'Rest time', min: 0, max: limits.seconds },
] as const;

export function WorkoutEditor({ workout, isNew, onSave, onCancel }: Props) {
  const [draft, setDraft] = useState<Workout>(() => structuredClone(workout));
  const [error, setError] = useState<string | null>(null);

  function updateExercise(id: string, patch: Partial<Exercise>) {
    setDraft((current) => ({ ...current, exercises: current.exercises.map((exercise) => exercise.id === id ? { ...exercise, ...patch } : exercise) }));
  }

  function move(index: number, direction: -1 | 1) {
    setDraft((current) => {
      const exercises = [...current.exercises];
      [exercises[index], exercises[index + direction]] = [exercises[index + direction], exercises[index]];
      return { ...current, exercises };
    });
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const clean = { ...draft, name: draft.name.trim(), exercises: draft.exercises.map((exercise) => ({ ...exercise, name: exercise.name.trim() })) };
    if (!isWorkout(clean)) { setError('Give your workout and every exercise a name, and check the number fields.'); return; }
    onSave(clean);
  }

  const duration = workoutDuration(draft);
  return (
    <>
      <Button variant="ghost" className="back-link" onClick={onCancel}><ArrowLeft />Back to workouts</Button>
      <section className="page-heading editor-heading"><div><h1>{isNew ? 'Create workout' : 'Edit workout'}</h1><p>Configure exercises, sets, reps, and timing.</p></div></section>
      <form onSubmit={submit} className="editor-layout">
        <div className="editor-fields">
          <Card className="editor-panel"><Label className="field-label" htmlFor="workout-name">Workout name</Label><Input id="workout-name" className="workout-name-input" required maxLength={80} placeholder="e.g. Full body workout" value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} autoFocus /></Card>
          <div className="section-heading exercise-section-heading"><h2>Exercises <Badge variant="secondary" className="count-badge">{draft.exercises.length}</Badge></h2><span className="subtle">Execution order</span></div>
          {draft.exercises.map((exercise, index) => (
            <Card className="exercise-editor editor-panel" key={exercise.id} role="region" aria-label={`Exercise ${index + 1}`}>
              <div className="exercise-editor-top"><Badge variant="secondary" className="exercise-number">{String(index + 1).padStart(2, '0')}</Badge><Label className="sr-only" htmlFor={`name-${exercise.id}`}>Exercise {index + 1} name</Label><Input id={`name-${exercise.id}`} className="exercise-name-input" value={exercise.name} required maxLength={80} placeholder="Exercise name" onChange={(event) => updateExercise(exercise.id, { name: event.target.value })} />
                <div className="exercise-actions"><Button variant="ghost" size="icon-sm" disabled={index === 0} aria-label={`Move exercise ${index + 1} up`} onClick={() => move(index, -1)}><ArrowUp /></Button><Button variant="ghost" size="icon-sm" disabled={index === draft.exercises.length - 1} aria-label={`Move exercise ${index + 1} down`} onClick={() => move(index, 1)}><ArrowDown /></Button><Button variant="ghost" size="icon-sm" className="delete-button" disabled={draft.exercises.length === 1} aria-label={`Remove exercise ${index + 1}`} onClick={() => setDraft({ ...draft, exercises: draft.exercises.filter((item) => item.id !== exercise.id) })}><Trash2 /></Button></div>
              </div>
              <div className="number-fields">{numberFields.map((field) => (
                <Label key={field.key} className="number-field" htmlFor={`${exercise.id}-${field.key}`}><span>{field.label}</span><span className="number-input-wrap"><Input id={`${exercise.id}-${field.key}`} aria-label={`Exercise ${index + 1} ${field.label.toLowerCase()}`} type="number" min={field.min} max={field.max} step={1} required value={Number.isFinite(exercise[field.key]) ? exercise[field.key] : ''} onChange={(event) => updateExercise(exercise.id, { [field.key]: event.target.value === '' ? NaN : Number(event.target.value) })} />{field.key.endsWith('Seconds') && <span>sec</span>}</span></Label>
              ))}</div>
            </Card>
          ))}
          <Button variant="outline" className="add-exercise-button" disabled={draft.exercises.length >= limits.exercises} onClick={() => setDraft({ ...draft, exercises: [...draft.exercises, newExercise()] })}><Plus />Add exercise</Button>
          {error && <Alert variant="destructive" className="error-message"><AlertDescription>{error}</AlertDescription></Alert>}
          <div className="editor-bottom-actions"><Button variant="outline" onClick={onCancel}>Cancel</Button><Button type="submit"><Check />Save workout</Button></div>
        </div>
        <Card className="editor-summary" role="complementary"><span className="eyebrow">WORKOUT SUMMARY</span><h2>{draft.name.trim() || 'Untitled workout'}</h2><span className="summary-duration"><Clock3 size={19} />{Number.isFinite(duration) ? formatDuration(duration) : '—'}</span><Separator className="summary-divider" /><ol>{draft.exercises.map((exercise, index) => <li key={exercise.id}><span className="summary-number">{index + 1}</span><div><strong>{exercise.name.trim() || 'New exercise'}</strong><span>{Number.isFinite(exercise.sets) ? exercise.sets : '—'} sets · {Number.isFinite(exercise.reps) ? exercise.reps : '—'} reps</span></div></li>)}</ol><p className="summary-tip">Rest follows each rep, including between sets and exercises. No rest after the final rep.</p></Card>
      </form>
    </>
  );
}
