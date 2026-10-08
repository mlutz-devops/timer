import { ArrowRight, Clock3, Dumbbell, Pencil, Plus, Trash2 } from 'lucide-react';
import type { Workout } from '../types/workout';
import { formatDuration, workoutDuration } from '../utils/workoutTimeline';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';

type Props = {
  workouts: Workout[];
  onCreate: () => void;
  onEdit: (workout: Workout) => void;
  onStart: (workout: Workout) => void;
  onDelete: (workout: Workout) => void;
};

export function WorkoutLibrary({ workouts, onCreate, onEdit, onStart, onDelete }: Props) {
  return (
    <>
      <section className="page-heading">
        <div><h1 id="workouts-heading">Workouts <Badge variant="secondary" className="count-badge">{workouts.length}</Badge></h1><p>Create, edit, or select a workout.</p></div>
        <Button size="lg" onClick={onCreate}><Plus />New workout</Button>
      </section>

      <section aria-labelledby="workouts-heading" className="library-section">
        <div className="workout-grid">
          {workouts.map((workout, index) => (
            <Card className="workout-card" role="article" key={workout.id}>
              <div className="card-top"><span className={`workout-symbol symbol-${index % 3}`} aria-hidden="true"><Dumbbell size={25} /></span>
                <div className="card-actions"><Button variant="ghost" size="icon" aria-label={`Edit ${workout.name}`} onClick={() => onEdit(workout)}><Pencil /></Button><Button variant="ghost" size="icon" className="delete-button" aria-label={`Delete ${workout.name}`} onClick={() => onDelete(workout)}><Trash2 /></Button></div>
              </div>
              <Button variant="ghost" className="card-start" aria-label={`Open ${workout.name}`} onClick={() => onStart(workout)}>
                <span className="eyebrow">INTERVAL WORKOUT</span><h3>{workout.name}</h3>
                <span className="card-meta"><span><Clock3 size={15} />{formatDuration(workoutDuration(workout))}</span><span className="meta-dot">·</span><span>{workout.exercises.length} {workout.exercises.length === 1 ? 'exercise' : 'exercises'}</span></span>
                <span className="exercise-names">{workout.exercises.map((exercise) => exercise.name).join(' · ')}</span>
                <span className="card-bottom"><span>Open workout</span><span className="start-arrow"><ArrowRight size={19} /></span></span>
              </Button>
            </Card>
          ))}
          <Button variant="outline" className="create-card" aria-label="Create a new workout" onClick={onCreate}><span className="create-plus"><Plus className="size-6" /></span><h3>New workout</h3><p>Configure exercises and timing.</p><span>Create workout <ArrowRight size={16} /></span></Button>
        </div>
      </section>
    </>
  );
}
