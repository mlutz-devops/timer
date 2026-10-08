import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { workout } from '../test/fixtures';
import { WorkoutLibrary } from './WorkoutLibrary';

it('uses plain labels and shows workouts without an inspiration banner', () => {
  const onStart = vi.fn();
  render(<WorkoutLibrary workouts={[workout]} onCreate={vi.fn()} onEdit={vi.fn()} onDelete={vi.fn()} onStart={onStart} />);
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Workouts');
  expect(screen.queryByRole('region', { name: 'Workout inspiration' })).not.toBeInTheDocument();
  expect(screen.queryByText(/rhythm|better day|good habit|make time|little movement/i)).not.toBeInTheDocument();
  expect(screen.getByText('Open workout')).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: 'Open Test workout' }));
  expect(onStart).toHaveBeenCalledWith(workout);
});
