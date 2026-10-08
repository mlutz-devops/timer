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
    act(() => vi.advanceTimersByTime(80000));
    expect(screen.getByRole('heading', { name: 'Workout complete' })).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Restart workout' }));
    expect(screen.getByRole('button', { name: 'Start' })).toBeVisible();
    act(() => vi.advanceTimersByTime(20000));
    expect(screen.getByRole('timer')).toHaveTextContent('00:10');
  });
});
