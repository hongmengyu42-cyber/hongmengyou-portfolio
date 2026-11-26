import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ConfirmDialog } from './ConfirmDialog';

const setup = (overrides: Partial<Parameters<typeof ConfirmDialog>[0]> = {}) => {
  const props = { open: true, title: 'Delete thing?', message: 'It will be gone.', onConfirm: vi.fn().mockResolvedValue(undefined), onCancel: vi.fn(), ...overrides };
  render(<ConfirmDialog {...props} />);
  return props;
};

describe('ConfirmDialog', () => {
  it('is a named modal dialog and puts focus on Cancel so a stray Enter never deletes', () => {
    setup();
    const dialog = screen.getByRole('dialog', { name: 'Delete thing?' });
    expect(dialog).toHaveTextContent('It will be gone.');
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus();
  });

  it('is not exposed while closed', () => {
    setup({ open: false });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('confirms and cancels through their own buttons', async () => {
    const props = setup();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(props.onCancel).toHaveBeenCalledTimes(1);
    expect(props.onConfirm).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(props.onConfirm).toHaveBeenCalledTimes(1);
  });

  it('keeps the dialog open and explains the failure when the action fails', async () => {
    setup({ onConfirm: vi.fn().mockRejectedValue(new Error('Server said no')) });
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Server said no');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeEnabled(); // can retry
  });

  it('disables both buttons while the action runs', async () => {
    let finish: () => void = () => undefined;
    setup({ onConfirm: () => new Promise<void>((resolve) => (finish = resolve)) });
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(screen.getByRole('button', { name: 'Working…' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
    finish();
  });
});
