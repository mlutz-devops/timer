import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { workout } from '../test/fixtures';
import { useWorkoutTimer } from './useWorkoutTimer';

describe('workout timer hook', () => {
  it('keeps the first rep ready without running any timers before Start', () => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
    const { result } = renderHook(() => useWorkoutTimer(workout));
    expect(result.current.status).toBe('ready');
    expect(vi.getTimerCount()).toBe(0);
    expect(result.current.canPrevious).toBe(false);
    expect(result.current.canNext).toBe(false);
    act(() => {
      vi.advanceTimersByTime(120000);
      document.dispatchEvent(new Event('visibilitychange'));
      window.dispatchEvent(new Event('focus'));
      result.current.next();
    });
    expect(result.current.remainingMs).toBe(10000);
    expect(result.current.phase.rep).toBe(1);
    expect(result.current.status).toBe('ready');
    act(() => result.current.start());
    expect(result.current.status).toBe('running');
    expect(result.current.canNext).toBe(true);
    act(() => vi.advanceTimersByTime(1000));
    expect(result.current.remainingMs).toBe(9000);
  });

  it('counts down, pauses, navigates and cleans up its interval on unmount', () => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
    const { result, unmount } = renderHook(() => useWorkoutTimer(workout));
    expect(result.current.remainingMs).toBe(10000);
    act(() => result.current.start());
    act(() => vi.advanceTimersByTime(2000));
    expect(result.current.remainingMs).toBe(8000);
    act(() => result.current.toggle());
    act(() => vi.advanceTimersByTime(5000));
    expect(result.current.remainingMs).toBe(8000);
    act(() => result.current.next());
    expect(result.current.phase.rep).toBe(2);
    expect(result.current.status).toBe('paused');
    expect(result.current.remainingMs).toBe(10000);
    act(() => result.current.toggle());
    act(() => vi.advanceTimersByTime(10000));
    expect(result.current.phase.kind).toBe('rest');
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('reconciles time immediately when the page becomes visible', () => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
    const { result } = renderHook(() => useWorkoutTimer(workout));
    act(() => result.current.start());
    vi.setSystemTime(37000);
    act(() => document.dispatchEvent(new Event('visibilitychange')));
    expect(result.current.phase).toMatchObject({ set: 2, rep: 1, kind: 'work' });
    expect(result.current.remainingMs).toBe(3000);
  });
});
