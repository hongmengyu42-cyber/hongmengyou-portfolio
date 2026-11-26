import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { api, ApiError } from '../../api/client';
import { renderApp } from '../../test/render';
import { ContactForm } from './ContactForm';

async function fillValid() {
  await userEvent.type(screen.getByLabelText('Name'), '  Ada Lovelace ');
  await userEvent.type(screen.getByLabelText('Email'), 'ada@example.com');
  await userEvent.type(screen.getByLabelText('Subject'), 'Hello there');
  await userEvent.type(screen.getByLabelText('Message'), 'This message is long enough.');
}

const submit = () => userEvent.click(screen.getByRole('button', { name: 'Send message' }));

describe('ContactForm', () => {
  it('blocks an empty submit, explains each problem and focuses the first invalid field', async () => {
    const send = vi.spyOn(api, 'submitContact').mockResolvedValue();
    renderApp(<ContactForm />);

    await submit();

    expect(send).not.toHaveBeenCalled();
    expect(screen.getByText('Please enter your name.')).toBeInTheDocument();
    expect(screen.getByText('Please enter your email address.')).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText('Name')).toHaveAttribute('aria-describedby', 'contact-name-error');
    expect(screen.getByLabelText('Name')).toHaveFocus();
  });

  it('sends trimmed values with an empty honeypot, then confirms success', async () => {
    const send = vi.spyOn(api, 'submitContact').mockResolvedValue();
    renderApp(<ContactForm />);
    await fillValid();

    await submit();

    expect(send).toHaveBeenCalledWith({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      subject: 'Hello there',
      message: 'This message is long enough.',
      website: '',
    });
    expect(await screen.findByRole('status')).toHaveTextContent('Message sent');
  });

  it('keeps the honeypot out of reach of people and assistive tech but fills it for bots', async () => {
    const send = vi.spyOn(api, 'submitContact').mockResolvedValue();
    renderApp(<ContactForm />);

    const honeypot = document.querySelector<HTMLInputElement>('input[name="website"]');
    expect(honeypot).not.toBeNull();
    expect(honeypot).toHaveAttribute('tabindex', '-1');
    expect(honeypot).toHaveAttribute('autocomplete', 'off');
    expect(honeypot?.closest('[aria-hidden="true"]')).not.toBeNull();

    await fillValid();
    fireEvent.change(honeypot as HTMLInputElement, { target: { value: 'http://spam.example' } });
    await submit();

    expect(send).toHaveBeenCalledWith(expect.objectContaining({ website: 'http://spam.example' }));
  });

  it('maps server-side field errors onto the matching fields', async () => {
    vi.spyOn(api, 'submitContact').mockRejectedValue(new ApiError(400, 'One or more fields are invalid.', { errors: { email: 'must be a well-formed email address' } }));
    renderApp(<ContactForm />);
    await fillValid();

    await submit();

    expect(await screen.findByText('must be a well-formed email address')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent('check the highlighted fields');
    expect(screen.getByLabelText('Email')).toHaveFocus();
  });

  it('explains the rate limit on a 429', async () => {
    vi.spyOn(api, 'submitContact').mockRejectedValue(new ApiError(429, 'Too many messages.'));
    renderApp(<ContactForm />);
    await fillValid();
    await submit();
    expect(await screen.findByRole('alert')).toHaveTextContent('several messages recently');
  });

  it('shows the network message when offline and keeps what the visitor typed', async () => {
    vi.spyOn(api, 'submitContact').mockRejectedValue(new ApiError(0, 'Network error. Check your connection and try again.'));
    renderApp(<ContactForm />);
    await fillValid();
    await submit();
    expect(await screen.findByRole('alert')).toHaveTextContent('Network error');
    expect(screen.getByLabelText('Subject')).toHaveValue('Hello there');
  });

  it('never leaks raw server text for unexpected failures', async () => {
    vi.spyOn(api, 'submitContact').mockRejectedValue(new ApiError(500, 'java.lang.NullPointerException at Foo.bar'));
    renderApp(<ContactForm />);
    await fillValid();
    await submit();
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Something went wrong');
    expect(alert).not.toHaveTextContent('NullPointerException');
  });

  it('disables the button while sending to prevent double submits', async () => {
    let finish: () => void = () => undefined;
    vi.spyOn(api, 'submitContact').mockImplementation(() => new Promise<void>((resolve) => (finish = resolve)));
    renderApp(<ContactForm />);
    await fillValid();
    await submit();

    expect(screen.getByRole('button', { name: 'Sending…' })).toBeDisabled();
    finish();
    expect(await screen.findByRole('status')).toBeInTheDocument();
  });
});
