import { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, CheckCheck, Coffee, Dumbbell, Pause, Play, RotateCcw, SkipBack, SkipForward, Timer, X } from 'lucide-react';
import type { Workout } from '../types/workout';
import { useWorkoutTimer } from '../hooks/useWorkoutTimer';
import { formatDuration, workoutDuration } from '../utils/workoutTimeline';
import { ConfirmDialog } from './ConfirmDialog';
import { TimerDisplay } from './TimerDisplay';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Separator } from './ui/separator';

export function WorkoutRunner({ workout, onExit }: { workout: Workout; onExit: () => void }) {
  const timer = useWorkoutTimer(workout);
  const [exitPrompt, setExitPrompt] = useState<{ resume: boolean } | null>(null);
  const exercise = workout.exercises[timer.phase?.exerciseIndex ?? 0];
  const resting = timer.phase?.kind === 'rest';
  const ready = timer.status === 'ready';
  const nextWork = useMemo(() => {
    for (let index = timer.phaseIndex + 1; index < timer.phases.length; index++) {
      if (timer.phases[index].kind === 'work') return timer.phases[index];
    }
    return undefined;
  }, [timer.phaseIndex, timer.phases]);
  const completedReps = timer.status === 'completed' ? timer.totalReps : timer.phase.repOrdinal + (resting ? 1 : 0);
  const progress = completedReps / timer.totalReps * 100;

  function requestExit() {
    if (timer.status === 'completed') { onExit(); return; }
    const resume = timer.status === 'running';
    if (resume) timer.toggle();
    setExitPrompt({ resume });
  }

  function cancelExit() {
    if (exitPrompt?.resume) timer.toggle();
    setExitPrompt(null);
  }

  return (
    <main className={`runner ${resting ? 'runner-rest' : ''}`}>
      <header className="runner-header"><div className="runner-brand"><span className="brand-mark"><Timer size={21} /></span><span>tempo<span className="brand-period">.</span></span></div><Button variant="outline" className="exit-button" onClick={requestExit}><X />Exit workout</Button></header>
      {timer.status === 'completed' ? (
        <section className="completion-screen"><div className="completion-icon"><CheckCheck size={48} /></div><h1>Workout complete</h1><p>{workout.name}</p><div className="completion-stats"><div><strong>{workout.exercises.length}</strong><span>exercises</span></div><div><strong>{timer.totalReps}</strong><span>reps</span></div><div><strong>{formatDuration(workoutDuration(workout))}</strong><span>planned time</span></div></div><div className="completion-actions"><Button size="lg" onClick={onExit}><ArrowLeft />Back to workouts</Button><Button variant="outline" size="lg" onClick={timer.restart}><RotateCcw />Restart workout</Button></div></section>
      ) : (
        <>
          <div className="runner-layout">
            <section className="timer-stage" aria-label="Active workout">
              <div className="runner-workout-name">{workout.name}</div>
              <Badge variant="outline" className={`phase-badge ${resting ? 'rest-badge' : ''}`} aria-live="polite">{resting ? <Coffee /> : <Dumbbell />}{ready ? 'READY' : resting ? 'REST' : 'REP'}<span>·</span>EXERCISE {timer.phase.exerciseIndex + 1} OF {workout.exercises.length}</Badge>
              <h1 className="active-exercise">{exercise.name}</h1>
              <TimerDisplay remainingMs={timer.remainingMs} durationMs={timer.phase.durationMs} resting={resting} paused={timer.status === 'paused'} ready={ready} />
              <div className="rep-set-progress"><div role="group" aria-label={`Set ${timer.phase.set} of ${exercise.sets}`}><span>SET</span><strong>{timer.phase.set}<small> / {exercise.sets}</small></strong></div><Separator orientation="vertical" className="progress-divider" /><div role="group" aria-label={`Rep ${timer.phase.rep} of ${exercise.reps}`}><span>REP</span><strong>{timer.phase.rep}<small> / {exercise.reps}</small></strong></div></div>
              <div className="timer-controls"><Button variant="ghost" className="skip-button" onClick={timer.previous} disabled={!timer.canPrevious} aria-label="Previous rep"><SkipBack className="size-6" /><span>Previous</span></Button><Button size="lg" className="pause-button" onClick={ready ? timer.start : timer.toggle}>{ready || timer.status === 'paused' ? <Play className="size-5" fill="currentColor" /> : <Pause className="size-5" fill="currentColor" />}{ready ? 'Start' : timer.status === 'paused' ? 'Resume' : 'Pause'}</Button><Button variant="ghost" className="skip-button" onClick={timer.next} disabled={!timer.canNext} aria-label="Next rep"><SkipForward className="size-6" /><span>Next rep</span></Button></div>
              <p className="next-up">{nextWork ? <><span>NEXT</span>{resting ? `${workout.exercises[nextWork.exerciseIndex].name} · Set ${nextWork.set}, rep ${nextWork.rep}` : exercise.restBetweenRepsSeconds ? `Rest · ${exercise.restBetweenRepsSeconds} seconds` : `${workout.exercises[nextWork.exerciseIndex].name} · Set ${nextWork.set}, rep ${nextWork.rep}`}<ArrowRight size={14} /></> : <><span>FINAL REP</span>Workout ends after this rep.</>}</p>
            </section>
            <Card className="workout-queue" role="complementary"><div className="queue-heading"><span className="eyebrow">EXERCISES</span><span>{workout.exercises.length} exercises</span></div><h2>{workout.name}</h2><ol>{workout.exercises.map((item, index) => { const complete = index < timer.phase.exerciseIndex; const active = index === timer.phase.exerciseIndex; return <li className={`${active ? 'queue-active' : ''} ${complete ? 'queue-complete' : ''}`} key={item.id}><span className="queue-number">{complete ? <Check size={16} /> : String(index + 1).padStart(2, '0')}</span><div><strong>{item.name}</strong><span>{item.sets} sets · {item.reps} reps · {item.repDurationSeconds}s</span></div>{active && <span className="queue-active-dot" />}</li>; })}</ol><div className="overall-progress"><div><span>Workout progress</span><strong>{Math.round(progress)}%</strong></div><Progress className="overall-track" aria-label="Workout progress" value={Math.round(progress)} /><p>{completedReps} of {timer.totalReps} reps completed</p></div></Card>
          </div>
        </>
      )}
      {exitPrompt && <ConfirmDialog title="Exit workout?" description={ready ? 'The workout has not started. Your saved workout will not be deleted.' : 'Leaving discards this session’s progress. Your saved workout will not be deleted.'} confirmLabel="Exit workout" onConfirm={onExit} onCancel={cancelExit} />}
    </main>
  );
}
