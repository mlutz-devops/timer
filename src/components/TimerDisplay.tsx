import { formatTime } from '../utils/workoutTimeline';

type Props = { remainingMs: number; durationMs: number; resting: boolean; paused: boolean; ready: boolean };

export function TimerDisplay({ remainingMs, durationMs, resting, paused, ready }: Props) {
  const remaining = durationMs ? Math.max(0, Math.min(1, remainingMs / durationMs)) : 0;
  return (
    <div className={`timer-display ${resting ? 'timer-rest' : ''} ${paused ? 'timer-paused' : ''}`}>
      <svg className="timer-ring" viewBox="0 0 400 400" aria-hidden="true"><circle className="ring-track" cx="200" cy="200" r="186" /><circle className="ring-progress" cx="200" cy="200" r="186" pathLength="100" strokeDasharray="100" strokeDashoffset={100 * (1 - remaining)} /></svg>
      <div className="timer-digits"><span className="timer-phase-label">{ready ? 'READY' : paused ? 'PAUSED' : resting ? 'REST' : 'REP'}</span><span className="countdown" role="timer" aria-label={`${resting ? 'Rest' : 'Rep'} time remaining`}>{formatTime(remainingMs / 1000)}</span><span className="timer-under-label">{ready ? 'Press Start to begin' : 'Time remaining'}</span></div>
    </div>
  );
}
