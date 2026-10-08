import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { newWorkout } from '../types/workout';
import { workout } from '../test/fixtures';
import { WorkoutEditor } from './WorkoutEditor';

describe('workout editor', () => {
  it('adds, reorders and removes exercises before saving', async () => {
    const onSave = vi.fn();
    const user = userEvent.setup();
    render(<WorkoutEditor workout={workout} isNew={false} onSave={onSave} onCancel={vi.fn()} />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Edit workout');
    await user.click(screen.getByRole('button', { name: 'Add exercise' }));
    await user.type(screen.getByLabelText('Exercise 3 name'), 'Lunges');
    await user.click(screen.getByRole('button', { name: 'Move exercise 3 up' }));
    expect(screen.getByLabelText('Exercise 2 name')).toHaveValue('Lunges');
    await user.click(screen.getByRole('button', { name: 'Remove exercise 3' }));
    await user.click(screen.getByRole('button', { name: 'Save workout' }));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ exercises: [workout.exercises[0], expect.objectContaining({ name: 'Lunges' })] }));
  });

  it('prevents invalid names and preserves the last exercise', () => {
    const onSave = vi.fn();
    render(<WorkoutEditor workout={newWorkout()} isNew onSave={onSave} onCancel={vi.fn()} />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Create workout');
    expect(screen.getByRole('button', { name: 'Remove exercise 1' })).toBeDisabled();
    fireEvent.submit(screen.getByRole('button', { name: 'Save workout' }).closest('form')!);
    expect(screen.getByRole('alert')).toHaveTextContent('Give your workout');
    expect(onSave).not.toHaveBeenCalled();
  });
});
