import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { workout } from '../test/fixtures';
import { WorkoutRunner } from './WorkoutRunner';

describe('workout start controls', () => {
  it('shows Start before starting, then only Pause or Resume for the session', () => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
    render(<WorkoutRunner workout={workout} onExit={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Start' })).toBeVisible();
    expect(screen.getByText('READY', { selector: '.timer-phase-label' })).toBeVisible();
    act(() => vi.advanceTimersByTime(60000));
    expect(screen.getByRole('timer')).toHaveTextContent('00:10');
    fireEvent.click(screen.getByRole('button', { name: 'Start' }));
    expect(screen.getByRole('button', { name: 'Pause' })).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Start' })).not.toBeInTheDocument();
    expect(screen.getByRole('timer')).toHaveAccessibleName('Preparation time remaining');
    expect(screen.getByRole('timer')).toHaveTextContent('3');
    expect(screen.getByRole('button', { name: 'Next rep' })).toBeDisabled();
    act(() => vi.advanceTimersByTime(1000));
    expect(screen.getByRole('timer')).toHaveTextContent('2');
    act(() => vi.advanceTimersByTime(1000));
    expect(screen.getByRole('timer')).toHaveTextContent('1');
    act(() => vi.advanceTimersByTime(1000));
    expect(screen.getByRole('timer')).toHaveAccessibleName('Rep time remaining');
    expect(screen.getByRole('timer')).toHaveTextContent('00:10');
    act(() => vi.advanceTimersByTime(2000));
    expect(screen.getByRole('timer')).toHaveTextContent('00:08');
    fireEvent.click(screen.getByRole('button', { name: 'Pause' }));
    expect(screen.getByRole('button', { name: 'Resume' })).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Next rep' }));
    fireEvent.click(screen.getByRole('button', { name: 'Previous rep' }));
    expect(screen.getByRole('button', { name: 'Resume' })).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Resume' }));
    expect(screen.getByRole('button', { name: 'Pause' })).toBeVisible();
  });

  it('shows Start again only for a fresh session after completion', () => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
    render(<WorkoutRunner workout={workout} onExit={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Start' }));
    act(() => vi.advanceTimersByTime(83000));
    expect(screen.getByRole('heading', { name: 'Workout complete' })).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Restart workout' }));
    expect(screen.getByRole('button', { name: 'Start' })).toBeVisible();
    act(() => vi.advanceTimersByTime(20000));
    expect(screen.getByRole('timer')).toHaveTextContent('00:10');
  });

  it('highlights set and exercise endings, labels rests, and previews the next exercise', () => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
    const custom = { ...workout, exercises: workout.exercises.map((exercise) => ({ ...exercise, restBetweenSetsSeconds: 30 })) };
    render(<WorkoutRunner workout={custom} onExit={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Start' }));
    act(() => vi.advanceTimersByTime(3000));
    fireEvent.click(screen.getByRole('button', { name: 'Next rep' }));
    expect(screen.getByRole('status')).toHaveTextContent('Last rep of this set');
    expect(screen.getByText(/Set rest · 30 seconds/)).toBeVisible();
    act(() => vi.advanceTimersByTime(10000));
    expect(screen.getByRole('status')).toHaveTextContent('Set complete');
    expect(screen.getByText('SET REST', { selector: '.timer-phase-label' })).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Next rep' }));
    fireEvent.click(screen.getByRole('button', { name: 'Next rep' }));
    expect(screen.getByRole('status')).toHaveTextContent('Last rep of this exercise');
    expect(screen.getByText(/Exercise rest · 30 seconds → Plank/)).toBeVisible();
    act(() => vi.advanceTimersByTime(10000));
    expect(screen.getByRole('status')).toHaveTextContent('Exercise complete');
    expect(screen.getByText('EXERCISE REST', { selector: '.timer-phase-label' })).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Next rep' }));
    expect(screen.getByRole('status')).toHaveTextContent('Final rep of the workout');
  });
});
