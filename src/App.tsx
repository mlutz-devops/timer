import { useEffect, useRef, useState } from 'react';
import { AlertCircle, Grid2X2, LockKeyhole, Plus, Timer } from 'lucide-react';
import { toast } from 'sonner';
import { newWorkout, type Workout } from './types/workout';
import { useWorkouts } from './hooks/useWorkouts';
import { ConfirmDialog } from './components/ConfirmDialog';
import { WorkoutLibrary } from './components/WorkoutLibrary';
import { WorkoutEditor } from './components/WorkoutEditor';
import { WorkoutRunner } from './components/WorkoutRunner';
import { Button } from './components/ui/button';
import { Badge } from './components/ui/badge';
import { Alert, AlertDescription } from './components/ui/alert';

type View = { kind: 'library' } | { kind: 'editor'; workout: Workout; isNew: boolean } | { kind: 'runner'; workout: Workout };

export default function App() {
  const { workouts, error, save, remove } = useWorkouts();
  const [view, setView] = useState<View>({ kind: 'library' });
  const [deleting, setDeleting] = useState<Workout | null>(null);
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    document.title = view.kind === 'runner' ? `${view.workout.name} — Tempo` : view.kind === 'editor' ? 'Edit workout — Tempo' : 'Tempo — Workout Timer';
    window.scrollTo({ top: 0 });
    if (view.kind === 'library') mainRef.current?.focus();
  }, [view.kind]);

  function create() { setView({ kind: 'editor', workout: newWorkout(), isNew: true }); }
  function back() { setView({ kind: 'library' }); }

  if (view.kind === 'runner') return <WorkoutRunner key={view.workout.id} workout={view.workout} onExit={back} />;

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <aside className="sidebar"><Button variant="ghost" className="brand" onClick={back} aria-label="Tempo home"><span className="brand-mark"><Timer className="size-6" /></span><span>tempo<span className="brand-period">.</span></span></Button>
        <nav aria-label="Main navigation"><Button variant="ghost" className={`nav-item ${view.kind === 'library' ? 'nav-active' : ''}`} aria-current={view.kind === 'library' ? 'page' : undefined} onClick={back}><Grid2X2 />Workouts<Badge variant="secondary" className="nav-count">{workouts.length}</Badge></Button><Button variant="ghost" className={`nav-item ${view.kind === 'editor' ? 'nav-active' : ''}`} aria-current={view.kind === 'editor' ? 'page' : undefined} onClick={create}><Plus />Create workout</Button></nav>
        <div className="sidebar-bottom"><div className="local-storage-note"><LockKeyhole size={15} /><div><strong>Saved locally</strong><span>Workouts saved in this browser</span></div></div></div>
      </aside>
      <div className="main-shell"><header className="topbar"><span>Workout timer</span></header>
        <main id="main-content" ref={mainRef} tabIndex={-1} className="page-content">
          {error && <Alert className="storage-alert"><AlertCircle /><AlertDescription>{error}</AlertDescription></Alert>}
          {view.kind === 'library' ? <WorkoutLibrary workouts={workouts} onCreate={create} onEdit={(workout) => setView({ kind: 'editor', workout, isNew: false })} onStart={(workout) => setView({ kind: 'runner', workout: structuredClone(workout) })} onDelete={setDeleting} /> : <WorkoutEditor key={view.workout.id} workout={view.workout} isNew={view.isNew} onCancel={back} onSave={(workout) => { save(workout); back(); toast.success('Workout saved.'); }} />}
        </main>
      </div>
      {deleting && <ConfirmDialog title="Delete this workout?" description={`“${deleting.name}” will be removed from this device. This can’t be undone.`} confirmLabel="Delete workout" destructive onCancel={() => setDeleting(null)} onConfirm={() => { remove(deleting.id); setDeleting(null); toast.success('Workout deleted.'); }} />}
    </div>
  );
}
